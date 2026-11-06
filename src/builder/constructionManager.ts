import * as THREE from 'three';
import { MaterialLibrary } from '../world/materials';
import { CatalogItem, CustomPlacedObject, CustomVillageData, ConstructionAction, PlacementValidationResult } from './types';
import { CATALOG_ITEMS } from './catalog';
import { validatePlacement } from './validation';
import { SharedBuildData } from '../multiplayer/types';

export interface ConstructionManagerOptions {
  scene: THREE.Scene;
  materials: MaterialLibrary;
  isSoftwareGl?: boolean;
  onStateChange?: () => void;
  onBudgetChange?: (balance: number) => void;
  initialBudget?: number;
}

const STORAGE_KEY = '3dworld_custom_village_v1';
const DEFAULT_BUDGET = 15000;
const MAX_CUSTOM_OBJECTS = 120;

export class ConstructionManager {
  private scene: THREE.Scene;
  private materials: MaterialLibrary;
  private isSoftwareGl: boolean;
  private onStateChange?: () => void;
  private onBudgetChange?: (balance: number) => void;

  // Scene Groups
  public customObjectsGroup = new THREE.Group();
  public sharedObjectsGroup = new THREE.Group();
  public previewGroup = new THREE.Group();
  public selectionMarkerGroup = new THREE.Group();

  // State
  private placedObjects = new Map<string, { data: CustomPlacedObject; group: THREE.Group }>();
  private sharedObjects = new Map<string, { data: SharedBuildData; group: THREE.Group }>();
  private activeCatalogItem: CatalogItem | null = null;
  private previewPosition = new THREE.Vector3(0, 0.08, 0);
  private previewRotation: number = 0; // In radians
  private isPreviewValid: boolean = true;
  private validationReason: string = '';

  private selectedObjectId: string | null = null;
  private gridSnapEnabled: boolean = true;
  private gridSize: number = 1.0; // 1m grid snap

  // Virtual Construction Budget
  private budget: number = DEFAULT_BUDGET;

  // History for Undo / Redo
  private undoStack: ConstructionAction[] = [];
  private redoStack: ConstructionAction[] = [];

  // Raycasting helper plane at ground level
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.08);

  // Materials for preview ghost
  private validPreviewMaterial = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.65,
    wireframe: false,
  });
  private invalidPreviewMaterial = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.72,
    wireframe: false,
  });

  private groundRing!: THREE.Mesh;
  private groundRingMaterial!: THREE.MeshBasicMaterial;

  constructor(options: ConstructionManagerOptions) {
    this.scene = options.scene;
    this.materials = options.materials;
    this.isSoftwareGl = !!options.isSoftwareGl;
    this.onStateChange = options.onStateChange;
    this.onBudgetChange = options.onBudgetChange;
    this.budget = options.initialBudget || DEFAULT_BUDGET;

    this.customObjectsGroup.name = 'CustomVillageObjects';
    this.sharedObjectsGroup.name = 'SharedCommunityObjects';
    this.previewGroup.name = 'ConstructionPreview';
    this.selectionMarkerGroup.name = 'CustomObjectSelectionMarker';

    this.scene.add(this.customObjectsGroup);
    this.scene.add(this.sharedObjectsGroup);
    this.scene.add(this.previewGroup);
    this.scene.add(this.selectionMarkerGroup);

    this.initPreviewHelpers();
    this.initSelectionMarker();

    // Auto-load saved custom village if exists
    this.loadSavedVillageSilently();
  }

  private initPreviewHelpers() {
    this.previewGroup.visible = false;

    // Footprint ground projector indicator
    const ringGeo = new THREE.RingGeometry(1.2, 1.4, 32);
    ringGeo.rotateX(-Math.PI / 2);
    this.groundRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    this.groundRing = new THREE.Mesh(ringGeo, this.groundRingMaterial);
    this.groundRing.position.y = 0.05;
    this.previewGroup.add(this.groundRing);
  }

  private initSelectionMarker() {
    this.selectionMarkerGroup.visible = false;

    // Cyan selection brackets and ground ring
    const ringGeo = new THREE.RingGeometry(2.0, 2.3, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.06;
    this.selectionMarkerGroup.add(ring);

    // Corner brackets
    const bMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (const [cx, cz] of [[-2, -2], [2, -2], [2, 2], [-2, 2]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), bMat);
      b.position.set(cx - Math.sign(cx) * 0.4, 0.08, cz);
      this.selectionMarkerGroup.add(b);

      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), bMat);
      b2.position.set(cx, 0.08, cz - Math.sign(cz) * 0.4);
      this.selectionMarkerGroup.add(b2);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. PREVIEW & SELECTION CONTROLS
  // ---------------------------------------------------------------------------
  public selectCatalogItem(item: CatalogItem | null) {
    this.activeCatalogItem = item;
    this.selectedObjectId = null;
    this.selectionMarkerGroup.visible = false;

    // Clear previous ghost preview mesh
    while (this.previewGroup.children.length > 1) {
      this.previewGroup.remove(this.previewGroup.children[1]);
    }

    if (!item) {
      this.previewGroup.visible = false;
      this.notifyState();
      return;
    }

    // Generate ghost preview model
    const ghost = item.createMesh(this.materials, this.isSoftwareGl);
    ghost.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = this.validPreviewMaterial;
        (child as THREE.Mesh).castShadow = false;
        (child as THREE.Mesh).receiveShadow = false;
      }
    });
    this.previewGroup.add(ghost);

    // Adapt ground ring radius to object footprint
    const maxDim = Math.max(item.footprint.width, item.footprint.depth) * 0.55;
    this.groundRing.scale.set(maxDim, maxDim, maxDim);

    this.previewGroup.visible = true;
    this.updatePreviewValidation();
    this.notifyState();
  }

  public getActiveCatalogItem(): CatalogItem | null {
    return this.activeCatalogItem;
  }

  public setGridSnap(enabled: boolean) {
    this.gridSnapEnabled = enabled;
    this.notifyState();
  }

  public isGridSnapEnabled(): boolean {
    return this.gridSnapEnabled;
  }

  public rotatePreview(deltaDegrees: number) {
    const rad = (deltaDegrees * Math.PI) / 180;
    this.previewRotation = (this.previewRotation + rad) % (Math.PI * 2);
    this.previewGroup.rotation.y = this.previewRotation;
    this.updatePreviewValidation();
    this.notifyState();
  }

  public resetPreviewRotation() {
    this.previewRotation = 0;
    this.previewGroup.rotation.y = 0;
    this.updatePreviewValidation();
    this.notifyState();
  }

  public getPreviewRotation(): number {
    return this.previewRotation;
  }

  /**
   * Updates pointer hover position from raycaster intersection with terrain/ground plane
   */
  public updatePointerPosition(raycaster: THREE.Raycaster) {
    if (!this.activeCatalogItem) return;

    const intersection = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(this.groundPlane, intersection);

    if (hit) {
      let x = intersection.x;
      let z = intersection.z;

      if (this.gridSnapEnabled) {
        x = Math.round(x / this.gridSize) * this.gridSize;
        z = Math.round(z / this.gridSize) * this.gridSize;
      }

      this.previewPosition.set(x, 0.08, z);
      this.previewGroup.position.copy(this.previewPosition);
      this.updatePreviewValidation();
    }
  }

  public setPlacementPositionDirect(x: number, z: number) {
    if (this.gridSnapEnabled) {
      x = Math.round(x / this.gridSize) * this.gridSize;
      z = Math.round(z / this.gridSize) * this.gridSize;
    }
    this.previewPosition.set(x, 0.08, z);
    this.previewGroup.position.copy(this.previewPosition);
    this.updatePreviewValidation();
  }

  private updatePreviewValidation() {
    if (!this.activeCatalogItem) return;

    const existingList = Array.from(this.placedObjects.values()).map((p) => p.data);
    const res: PlacementValidationResult = validatePlacement(
      this.activeCatalogItem,
      [this.previewPosition.x, this.previewPosition.y, this.previewPosition.z],
      this.previewRotation,
      existingList
    );

    // Also check budget
    let isValid = res.isValid;
    let reason = res.reason || '';

    if (isValid && this.budget < this.activeCatalogItem.cost) {
      isValid = false;
      reason = `Insufficient funds ($${this.budget} available, requires $${this.activeCatalogItem.cost})`;
    }

    this.isPreviewValid = isValid;
    this.validationReason = reason;

    // Apply color tint to ghost mesh & ring
    const mat = isValid ? this.validPreviewMaterial : this.invalidPreviewMaterial;
    this.groundRingMaterial.color.setHex(isValid ? 0x22d3ee : 0xef4444);

    if (this.previewGroup.children.length > 1) {
      const ghost = this.previewGroup.children[1];
      ghost.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = mat;
        }
      });
    }
  }

  public getValidationStatus(): { isValid: boolean; reason: string } {
    return { isValid: this.isPreviewValid, reason: this.validationReason };
  }

  // ---------------------------------------------------------------------------
  // 2. CONFIRM & CANCEL PLACEMENT
  // ---------------------------------------------------------------------------
  public confirmPlacement(): CustomPlacedObject | null {
    if (!this.activeCatalogItem) return null;

    this.updatePreviewValidation();
    if (!this.isPreviewValid) return null;

    if (this.placedObjects.size >= MAX_CUSTOM_OBJECTS) {
      this.validationReason = `Object limit reached (${MAX_CUSTOM_OBJECTS} objects). Delete existing items to build more.`;
      return null;
    }

    const uniqueId = 'cobj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const placedData: CustomPlacedObject = {
      id: uniqueId,
      typeId: this.activeCatalogItem.id,
      position: [this.previewPosition.x, this.previewPosition.y, this.previewPosition.z],
      rotation: this.previewRotation,
      placedAt: Date.now(),
      cost: this.activeCatalogItem.cost,
    };

    // Instantiate physical mesh model
    const group = this.instantiateModel(placedData);
    this.placedObjects.set(uniqueId, { data: placedData, group });

    // Deduct cost from virtual budget
    this.budget -= placedData.cost;
    this.onBudgetChange?.(this.budget);

    // Record undo action
    this.undoStack.push({ type: 'place', object: { ...placedData } });
    this.redoStack = []; // Clear redo history on new action

    // Keep item selected for rapid placement or auto-close
    this.updatePreviewValidation();
    this.notifyState();
    return placedData;
  }

  public cancelPlacement() {
    this.selectCatalogItem(null);
  }

  // ---------------------------------------------------------------------------
  // 3. SELECTION, EDITING, DUPLICATION & DELETION
  // ---------------------------------------------------------------------------
  public selectPlacedObject(id: string | null) {
    if (!id || !this.placedObjects.has(id)) {
      this.selectedObjectId = null;
      this.selectionMarkerGroup.visible = false;
      this.notifyState();
      return;
    }

    this.selectedObjectId = id;
    this.activeCatalogItem = null;
    this.previewGroup.visible = false;

    const entry = this.placedObjects.get(id)!;
    this.selectionMarkerGroup.position.set(
      entry.data.position[0],
      entry.data.position[1],
      entry.data.position[2]
    );
    this.selectionMarkerGroup.rotation.y = entry.data.rotation;
    this.selectionMarkerGroup.visible = true;
    this.notifyState();
  }

  public getSelectedObjectId(): string | null {
    return this.selectedObjectId;
  }

  public getSelectedObjectData(): CustomPlacedObject | null {
    if (!this.selectedObjectId) return null;
    return this.placedObjects.get(this.selectedObjectId)?.data || null;
  }

  public rotateSelectedObject(deltaDeg: number) {
    if (!this.selectedObjectId) return;
    const entry = this.placedObjects.get(this.selectedObjectId);
    if (!entry) return;

    const prevRot = entry.data.rotation;
    const nextRot = (prevRot + (deltaDeg * Math.PI) / 180) % (Math.PI * 2);

    // Record undo
    this.undoStack.push({
      type: 'transform',
      id: entry.data.id,
      prev: { position: [...entry.data.position], rotation: prevRot },
      next: { position: [...entry.data.position], rotation: nextRot },
    });
    this.redoStack = [];

    entry.data.rotation = nextRot;
    entry.group.rotation.y = nextRot;
    this.selectionMarkerGroup.rotation.y = nextRot;
    this.notifyState();
  }

  public duplicateSelectedObject(): boolean {
    if (!this.selectedObjectId) return false;
    const entry = this.placedObjects.get(this.selectedObjectId);
    if (!entry) return false;

    const catItem = CATALOG_ITEMS.find((c) => c.id === entry.data.typeId);
    if (!catItem) return false;

    // Switch to placement preview for duplicate with offset position
    this.selectCatalogItem(catItem);
    this.previewRotation = entry.data.rotation;
    this.previewGroup.rotation.y = entry.data.rotation;
    this.previewPosition.set(
      entry.data.position[0] + 3.0,
      entry.data.position[1],
      entry.data.position[2] + 3.0
    );
    this.previewGroup.position.copy(this.previewPosition);
    this.updatePreviewValidation();
    return true;
  }

  public deleteSelectedObject(): boolean {
    if (!this.selectedObjectId) return false;
    const entry = this.placedObjects.get(this.selectedObjectId);
    if (!entry) return false;

    const deletedData = { ...entry.data };

    // Remove from scene & map
    this.customObjectsGroup.remove(entry.group);
    this.placedObjects.delete(this.selectedObjectId);

    // Refund budget
    this.budget += deletedData.cost;
    this.onBudgetChange?.(this.budget);

    // Record undo
    this.undoStack.push({ type: 'delete', object: deletedData });
    this.redoStack = [];

    this.selectedObjectId = null;
    this.selectionMarkerGroup.visible = false;
    this.notifyState();
    return true;
  }

  // ---------------------------------------------------------------------------
  // 4. UNDO & REDO
  // ---------------------------------------------------------------------------
  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const action = this.undoStack.pop()!;

    if (action.type === 'place') {
      // Undo place => delete object
      const entry = this.placedObjects.get(action.object.id);
      if (entry) {
        this.customObjectsGroup.remove(entry.group);
        this.placedObjects.delete(action.object.id);
        this.budget += action.object.cost;
        this.onBudgetChange?.(this.budget);
        this.redoStack.push(action);
      }
    } else if (action.type === 'delete') {
      // Undo delete => re-instantiate object
      const group = this.instantiateModel(action.object);
      this.placedObjects.set(action.object.id, { data: action.object, group });
      this.budget -= action.object.cost;
      this.onBudgetChange?.(this.budget);
      this.redoStack.push(action);
    } else if (action.type === 'transform') {
      // Undo transform => revert to prev
      const entry = this.placedObjects.get(action.id);
      if (entry) {
        entry.data.position = [...action.prev.position];
        entry.data.rotation = action.prev.rotation;
        entry.group.position.set(...action.prev.position);
        entry.group.rotation.y = action.prev.rotation;
        this.redoStack.push(action);
      }
    }

    this.selectedObjectId = null;
    this.selectionMarkerGroup.visible = false;
    this.notifyState();
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const action = this.redoStack.pop()!;

    if (action.type === 'place') {
      const group = this.instantiateModel(action.object);
      this.placedObjects.set(action.object.id, { data: action.object, group });
      this.budget -= action.object.cost;
      this.onBudgetChange?.(this.budget);
      this.undoStack.push(action);
    } else if (action.type === 'delete') {
      const entry = this.placedObjects.get(action.object.id);
      if (entry) {
        this.customObjectsGroup.remove(entry.group);
        this.placedObjects.delete(action.object.id);
        this.budget += action.object.cost;
        this.onBudgetChange?.(this.budget);
        this.undoStack.push(action);
      }
    } else if (action.type === 'transform') {
      const entry = this.placedObjects.get(action.id);
      if (entry) {
        entry.data.position = [...action.next.position];
        entry.data.rotation = action.next.rotation;
        entry.group.position.set(...action.next.position);
        entry.group.rotation.y = action.next.rotation;
        this.undoStack.push(action);
      }
    }

    this.selectedObjectId = null;
    this.selectionMarkerGroup.visible = false;
    this.notifyState();
    return true;
  }

  // ---------------------------------------------------------------------------
  // 5. SAVE, LOAD & RESET VILLAGE
  // ---------------------------------------------------------------------------
  public saveVillage(villageName: string = 'My Custom Village'): boolean {
    try {
      const objectsList: CustomPlacedObject[] = Array.from(this.placedObjects.values()).map(
        (entry) => ({ ...entry.data })
      );

      const data: CustomVillageData = {
        version: 1,
        name: villageName.trim() || 'My Custom Village',
        updatedAt: Date.now(),
        budget: this.budget,
        objects: objectsList,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  public loadSavedVillage(): { success: boolean; name?: string; count?: number; error?: string } {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { success: false, error: 'No saved custom layout found in this browser.' };
      }

      const parsed: CustomVillageData = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.objects)) {
        return { success: false, error: 'Saved village data is corrupted or outdated.' };
      }

      // 1. Remove existing custom objects
      this.clearAllCustomObjects();

      // 2. Reconstruct custom objects
      let count = 0;
      for (const objData of parsed.objects) {
        const item = CATALOG_ITEMS.find((c) => c.id === objData.typeId);
        if (item) {
          const group = this.instantiateModel(objData);
          this.placedObjects.set(objData.id, { data: objData, group });
          count++;
        }
      }

      this.budget = typeof parsed.budget === 'number' ? parsed.budget : DEFAULT_BUDGET;
      this.onBudgetChange?.(this.budget);

      // Clear undo/redo history on fresh load
      this.undoStack = [];
      this.redoStack = [];

      this.notifyState();
      return { success: true, name: parsed.name, count };
    } catch {
      return { success: false, error: 'Failed to read save data from local storage.' };
    }
  }

  private loadSavedVillageSilently() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: CustomVillageData = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.objects)) {
        for (const objData of parsed.objects) {
          const item = CATALOG_ITEMS.find((c) => c.id === objData.typeId);
          if (item) {
            const group = this.instantiateModel(objData);
            this.placedObjects.set(objData.id, { data: objData, group });
          }
        }
        if (typeof parsed.budget === 'number') {
          this.budget = parsed.budget;
        }
      }
    } catch {
      // Ignored
    }
  }

  public resetCustomVillage(): boolean {
    this.clearAllCustomObjects();
    this.budget = DEFAULT_BUDGET;
    this.onBudgetChange?.(this.budget);
    this.undoStack = [];
    this.redoStack = [];

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Handled
    }

    this.notifyState();
    return true;
  }

  private clearAllCustomObjects() {
    for (const entry of this.placedObjects.values()) {
      this.customObjectsGroup.remove(entry.group);
    }
    this.placedObjects.clear();
    this.selectedObjectId = null;
    this.selectionMarkerGroup.visible = false;
  }

  // ---------------------------------------------------------------------------
  // 6. MODEL FACTORY & RAYCAST HIT TESTING
  // ---------------------------------------------------------------------------
  private instantiateModel(data: CustomPlacedObject): THREE.Group {
    const item = CATALOG_ITEMS.find((c) => c.id === data.typeId);
    if (!item) return new THREE.Group();

    const group = item.createMesh(this.materials, this.isSoftwareGl);
    group.position.set(data.position[0], data.position[1], data.position[2]);
    group.rotation.y = data.rotation;

    // Attach raycasting metadata to each mesh in group
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData = {
          isCustomPlacedObject: true,
          customObjectId: data.id,
        };
      }
    });

    this.customObjectsGroup.add(group);
    return group;
  }

  /**
   * Raycast test to select placed objects
   */
  public raycastCustomObject(raycaster: THREE.Raycaster): string | null {
    const intersects = raycaster.intersectObjects(this.customObjectsGroup.children, true);
    if (intersects.length > 0) {
      for (const hit of intersects) {
        if (hit.object.userData?.isCustomPlacedObject) {
          return hit.object.userData.customObjectId as string;
        }
      }
    }
    return null;
  }

  public getPlacedCount(): number {
    return this.placedObjects.size;
  }

  public getBudget(): number {
    return this.budget;
  }

  public setBudget(newBudget: number) {
    this.budget = Math.max(0, newBudget);
    this.onBudgetChange?.(this.budget);
  }

  // Convenient Aliases for Component Handlers
  public startPlacement(item: CatalogItem | null) {
    this.selectCatalogItem(item);
  }

  public toggleGridSnap(): boolean {
    this.gridSnapEnabled = !this.gridSnapEnabled;
    this.notifyState();
    return this.gridSnapEnabled;
  }

  public rotateSelected(deltaDeg: number) {
    this.rotateSelectedObject(deltaDeg);
  }

  public duplicateSelected(): boolean {
    return this.duplicateSelectedObject();
  }

  public deleteSelected(): boolean {
    return this.deleteSelectedObject();
  }

  public deselectObject() {
    this.selectPlacedObject(null);
  }

  public saveToLocalStorage(name?: string): boolean {
    return this.saveVillage(name);
  }

  public loadFromLocalStorage(): { success: boolean; name?: string; count?: number; error?: string } {
    return this.loadSavedVillage();
  }

  private notifyState() {
    this.onStateChange?.();
  }

  // ---------------------------------------------------------------------------
  // 7. COMMUNITY SHARED BUILDS SYNC
  // ---------------------------------------------------------------------------
  public syncSharedBuilds(builds: SharedBuildData[]) {
    const activeIds = new Set<string>();

    for (const b of builds) {
      activeIds.add(b.id);
      if (!this.sharedObjects.has(b.id)) {
        const item = CATALOG_ITEMS.find((c) => c.id === b.typeId);
        if (!item) continue;

        const group = item.createMesh(this.materials, this.isSoftwareGl);
        group.position.set(b.position[0], b.position[1], b.position[2]);
        group.rotation.y = b.rotation;

        // Add subtle floating community badge
        const plaque = this.createCommunityPlaque(b.ownerName);
        plaque.position.set(0, item.footprint.height + 0.8, 0);
        group.add(plaque);

        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.userData = {
              isSharedBuild: true,
              sharedBuildId: b.id,
              ownerId: b.ownerId,
              ownerName: b.ownerName,
            };
          }
        });

        this.sharedObjectsGroup.add(group);
        this.sharedObjects.set(b.id, { data: b, group });
      }
    }

    // Remove deleted community builds
    for (const [id, entry] of this.sharedObjects) {
      if (!activeIds.has(id)) {
        this.sharedObjectsGroup.remove(entry.group);
        this.sharedObjects.delete(id);
      }
    }
  }

  private createCommunityPlaque(ownerName: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 70;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(10, 8, 300, 54, 18);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#10b981';
      ctx.stroke();

      // Dot badge
      ctx.beginPath();
      ctx.arc(36, 35, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      // Text
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const truncated = ownerName.length > 14 ? ownerName.slice(0, 13) + '…' : ownerName;
      ctx.fillText(`Community • ${truncated}`, 54, 35);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.2, 0.5, 1);
    return sprite;
  }

  public getSharedBuildsCount(): number {
    return this.sharedObjects.size;
  }

  public dispose() {
    this.clearAllCustomObjects();
    for (const entry of this.sharedObjects.values()) {
      this.sharedObjectsGroup.remove(entry.group);
    }
    this.sharedObjects.clear();
    this.scene.remove(this.customObjectsGroup);
    this.scene.remove(this.sharedObjectsGroup);
    this.scene.remove(this.previewGroup);
    this.scene.remove(this.selectionMarkerGroup);
  }
}
