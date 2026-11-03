import * as THREE from 'three';
import { MaterialLibrary } from '../world/materials';

export type CatalogCategory =
  | 'residential'
  | 'commercial'
  | 'civic'
  | 'infrastructure'
  | 'landscape';

export interface CatalogItem {
  id: string;
  name: string;
  category: CatalogCategory;
  footprint: { width: number; depth: number; height: number };
  cost: number;
  description: string;
  snapToGrid?: boolean;
  categoryLabel?: string;
  createMesh: (materials: MaterialLibrary, isSoftwareGl?: boolean) => THREE.Group;
}

export interface CustomPlacedObject {
  id: string;
  typeId: string;
  position: [number, number, number];
  rotation: number; // Y rotation in radians
  placedAt: number;
  cost: number;
}

export interface CustomVillageData {
  version: number;
  name: string;
  updatedAt: number;
  budget: number;
  objects: CustomPlacedObject[];
}

export interface PlacementValidationResult {
  isValid: boolean;
  reason?: string;
}

export type ConstructionAction =
  | { type: 'place'; object: CustomPlacedObject }
  | { type: 'delete'; object: CustomPlacedObject }
  | {
      type: 'transform';
      id: string;
      prev: { position: [number, number, number]; rotation: number };
      next: { position: [number, number, number]; rotation: number };
    };
