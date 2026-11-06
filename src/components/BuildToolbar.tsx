import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  RotateCw,
  Check,
  X,
  Search,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  DollarSign,
  Grid,
  AlertCircle,
  HelpCircle,
  Building,
  Store,
  Landmark,
  TreePine,
  Waypoints,
  Sparkles,
  Globe,
} from 'lucide-react';
import { CatalogCategory, CatalogItem, CustomPlacedObject } from '../builder/types';
import { CATALOG_ITEMS, CATEGORY_LABELS } from '../builder/catalog';
import { ConfirmModal } from './ConfirmModal';

interface BuildToolbarProps {
  activeItem: CatalogItem | null;
  onSelectItem: (item: CatalogItem | null) => void;
  onConfirmPlacement: () => void;
  onCancelPlacement: () => void;
  onRotatePreview: (deltaDeg: number) => void;
  gridSnap: boolean;
  onToggleGridSnap: () => void;
  validationStatus: { isValid: boolean; reason: string };
  selectedObject: CustomPlacedObject | null;
  onRotateSelected: (deltaDeg: number) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onDeselectObject: () => void;
  budget: number;
  placedCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveVillage: (name: string) => boolean;
  onLoadVillage: () => { success: boolean; name?: string; count?: number; error?: string };
  onResetVillage: () => void;
  onExitBuildMode: () => void;
  isMultiplayerActive?: boolean;
  onPublishToSharedWorld?: (obj: CustomPlacedObject) => Promise<{ success: boolean; error?: string }>;
}

export const BuildToolbar: React.FC<BuildToolbarProps> = ({
  activeItem,
  onSelectItem,
  onConfirmPlacement,
  onCancelPlacement,
  onRotatePreview,
  gridSnap,
  onToggleGridSnap,
  validationStatus,
  selectedObject,
  onRotateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onDeselectObject,
  budget,
  placedCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveVillage,
  onLoadVillage,
  onResetVillage,
  onExitBuildMode,
  isMultiplayerActive = false,
  onPublishToSharedWorld,
}) => {
  const [activeCategory, setActiveCategory] = useState<CatalogCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCatalogOpen, setIsCatalogOpen] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [saveVillageName, setSaveVillageName] = useState('My Modern Village');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const filteredItems = useMemo(() => {
    return CATALOG_ITEMS.filter((item) => {
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const selectedItemData = useMemo(() => {
    if (!selectedObject) return null;
    return CATALOG_ITEMS.find((c) => c.id === selectedObject.typeId) || null;
  }, [selectedObject]);

  const handleSave = () => {
    const ok = onSaveVillage(saveVillageName);
    if (ok) {
      showToast(`Saved "${saveVillageName}" to browser storage!`);
      setSaveModalOpen(false);
    } else {
      showToast('Error saving village. Storage might be full.');
    }
  };

  const handleLoad = () => {
    const res = onLoadVillage();
    if (res.success) {
      showToast(`Loaded "${res.name || 'Custom Village'}" (${res.count || 0} objects)!`);
    } else {
      showToast(res.error || 'Failed to load custom layout.');
    }
  };

  const handleReset = () => {
    setConfirmResetOpen(true);
  };

  const handleConfirmReset = () => {
    onResetVillage();
    setConfirmResetOpen(false);
    showToast('Custom layout reset. Initial budget restored.');
  };

  const handlePublishShared = async () => {
    if (!selectedObject || !onPublishToSharedWorld) return;
    setIsPublishing(true);
    try {
      const res = await onPublishToSharedWorld(selectedObject);
      if (res.success) {
        showToast('Published structure to Shared Community World! Visible to all online players.');
      } else {
        showToast(res.error || 'Failed to publish structure.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to publish to community.');
    } finally {
      setIsPublishing(false);
    }
  };

  const getCategoryIcon = (cat: CatalogCategory | 'all') => {
    switch (cat) {
      case 'residential':
        return <Building className="w-3.5 h-3.5" />;
      case 'commercial':
        return <Store className="w-3.5 h-3.5" />;
      case 'civic':
        return <Landmark className="w-3.5 h-3.5" />;
      case 'infrastructure':
        return <Waypoints className="w-3.5 h-3.5" />;
      case 'landscape':
        return <TreePine className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <>
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-cyan-500/50 shadow-2xl text-xs font-mono text-cyan-200 backdrop-blur-md animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Save Village Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#090e1a] border border-cyan-500/30 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="font-display font-bold text-base text-white mb-2 flex items-center gap-2">
              <Save className="w-4 h-4 text-cyan-400" />
              Save Custom Village
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Your custom layout will be saved to your browser's local storage with all positions and objects.
            </p>
            <input
              type="text"
              value={saveVillageName}
              onChange={(e) => setSaveVillageName(e.target.value)}
              placeholder="Village Name"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400 mb-4 font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                Save Village
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Construction HUD (Collapsible Bottom Deck) */}
      <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[96vw] sm:max-w-4xl pointer-events-none transition-all">
        <div className="pointer-events-auto bg-[#070b16]/96 border border-cyan-500/30 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl backdrop-blur-md">
          {/* Top Control Bar: Mode indicator, Budget, History, Save/Load, and Exit */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap pb-2 border-b border-white/10">
            {/* Left: Mode Badge & Virtual Budget */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>BUILD MODE</span>
              </div>

              {/* Virtual Budget Counter */}
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono"
                title="Virtual Construction Budget (Costs are fictional)"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold">{budget.toLocaleString()}</span>
              </div>

              {/* Objects Placed Badge */}
              <span className="text-[11px] font-mono text-slate-400 hidden xs:inline">
                Objects: {placedCount}/120
              </span>
            </div>

            {/* Right: Actions: Undo, Redo, Save, Load, Reset, Exit */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-1.5 rounded-lg border transition-colors ${
                  canUndo
                    ? 'border-white/15 text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer'
                    : 'border-white/5 text-slate-600 cursor-not-allowed'
                }`}
                title="Undo Last Action"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-1.5 rounded-lg border transition-colors ${
                  canRedo
                    ? 'border-white/15 text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer'
                    : 'border-white/5 text-slate-600 cursor-not-allowed'
                }`}
                title="Redo Action"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSaveModalOpen(true)}
                className="p-1.5 rounded-lg border border-white/15 text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
                title="Save Custom Village to Browser Storage"
              >
                <Save className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleLoad}
                className="p-1.5 rounded-lg border border-white/15 text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
                title="Load Saved Custom Village"
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg border border-white/15 text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Reset Custom Objects (Leaves base village intact)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onExitBuildMode}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-rose-900/40 border border-white/20 hover:border-rose-400 text-slate-200 hover:text-rose-200 text-xs font-semibold transition-colors cursor-pointer ml-1"
                title="Exit Build Mode and Return to Normal Exploration"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Build</span>
              </button>
            </div>
          </div>

          {/* ACTIVE PLACEMENT SUB-BAR: Appears when an item is selected from catalog */}
          {activeItem && (
            <div className="mt-2.5 pt-2 border-t border-cyan-500/20 bg-cyan-950/30 -mx-1 px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Item Info & Validity Notice */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white">{activeItem.name}</span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  ${activeItem.cost}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {activeItem.footprint.width}x{activeItem.footprint.depth}m
                </span>

                {/* Validity Pill */}
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                    validationStatus.isValid
                      ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                      : 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                  }`}
                >
                  {validationStatus.isValid ? (
                    <>
                      <Check className="w-3 h-3 text-cyan-400" />
                      <span>Ready to Place</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                      <span>{validationStatus.reason || 'Invalid Position'}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Placement Action Controls: Rotate, Grid Snap, Confirm, Cancel */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => onRotatePreview(-45)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs transition-colors cursor-pointer"
                  title="Rotate Left 45° (Keyboard: Q)"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-400" />
                  <span className="font-mono text-[11px]">-45°</span>
                </button>

                <button
                  onClick={() => onRotatePreview(45)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs transition-colors cursor-pointer"
                  title="Rotate Right 45° (Keyboard: R / E)"
                >
                  <RotateCw className="w-3 h-3 text-cyan-400" />
                  <span className="font-mono text-[11px]">+45°</span>
                </button>

                <button
                  onClick={onToggleGridSnap}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                    gridSnap
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                  title="Toggle 1-Meter Grid Snapping"
                >
                  <Grid className="w-3 h-3" />
                  <span className="text-[11px]">{gridSnap ? 'Snap 1m' : 'Free'}</span>
                </button>

                <button
                  onClick={onConfirmPlacement}
                  disabled={!validationStatus.isValid}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    validationStatus.isValid
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-400/30'
                      : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                  }`}
                  title="Place Object onto Terrain (Tap or Click)"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Place (${activeItem.cost})</span>
                </button>

                <button
                  onClick={onCancelPlacement}
                  className="p-1.5 rounded-xl border border-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Cancel Placement"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* CONTEXTUAL OBJECT EDITING SUB-BAR: Appears when a placed object is selected */}
          {selectedObject && (
            <div className="mt-2.5 pt-2 border-t border-cyan-500/20 bg-indigo-950/30 -mx-1 px-3 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-cyan-200">
                  {selectedItemData?.name || 'Custom Placed Object'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {selectedObject.id.substring(0, 8)}...
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => onRotateSelected(-45)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs transition-colors cursor-pointer"
                  title="Rotate Object Left 45°"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-400" />
                  <span className="font-mono text-[11px]">-45°</span>
                </button>

                <button
                  onClick={() => onRotateSelected(45)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs transition-colors cursor-pointer"
                  title="Rotate Object Right 45°"
                >
                  <RotateCw className="w-3 h-3 text-cyan-400" />
                  <span className="font-mono text-[11px]">+45°</span>
                </button>

                <button
                  onClick={onDuplicateSelected}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs transition-colors cursor-pointer"
                  title="Duplicate Object with Unique ID"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>Duplicate</span>
                </button>

                {/* Share to Community World */}
                {isMultiplayerActive && onPublishToSharedWorld && (
                  <button
                    onClick={handlePublishShared}
                    disabled={isPublishing}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 text-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Publish structure to Shared Community World so all online visitors can view it"
                  >
                    <Globe className="w-3 h-3 text-emerald-400" />
                    <span>{isPublishing ? 'Publishing...' : 'Share to World'}</span>
                  </button>
                )}

                <button
                  onClick={onDeleteSelected}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs transition-colors cursor-pointer"
                  title="Delete Object and Refund Cost"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Delete (+${selectedObject.cost})</span>
                </button>

                <button
                  onClick={onDeselectObject}
                  className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-white"
                  title="Deselect"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Category Filter Pills & Search */}
          <div className="mt-2.5 flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
              {(['all', 'residential', 'commercial', 'civic', 'infrastructure', 'landscape'] as (CatalogCategory | 'all')[]).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 font-semibold'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                    }`}
                  >
                    {getCategoryIcon(cat)}
                    <span>{CATEGORY_LABELS[cat] || cat}</span>
                  </button>
                )
              )}
            </div>

            {/* Quick Search Input */}
            <div className="relative shrink-0 w-32 sm:w-44">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog..."
                className="w-full pl-7 pr-2 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          {/* Catalog Item Carousel / Cards Row */}
          {isCatalogOpen && (
            <div className="mt-2 flex items-center gap-2 overflow-x-auto py-1 max-h-28 scrollbar-thin scrollbar-thumb-white/20">
              {filteredItems.map((item) => {
                const isSelected = activeItem?.id === item.id;
                const canAfford = budget >= item.cost;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem(isSelected ? null : item)}
                    className={`group flex flex-col justify-between p-2 rounded-xl border text-left shrink-0 w-32 sm:w-36 h-22 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-[11px] font-semibold text-white group-hover:text-cyan-300 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.footprint.width}x{item.footprint.depth}m
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          canAfford ? 'text-emerald-400' : 'text-slate-500 line-through'
                        }`}
                      >
                        ${item.cost}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono uppercase">
                        {item.category.slice(0, 3)}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="text-xs text-slate-400 py-3 px-4 font-mono">
                  No catalog items found matching "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Custom Layout Reset */}
      <ConfirmModal
        isOpen={confirmResetOpen}
        title="Reset Custom Village Layout?"
        message="Are you sure you want to remove all custom-placed structures and reset your construction budget? The base modern village, landmarks, and simulation will remain 100% intact."
        confirmLabel="Reset Custom Layout"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </>
  );
};
