import { create } from 'zustand';

// 常用地毯尺寸预设（单位：毫米）
export const CARPET_PRESETS = {
  SMALL: { width: 2000, height: 3000, label: '2x3m' },
  MEDIUM: { width: 3000, height: 4000, label: '3x4m' },
  LARGE: { width: 4000, height: 6000, label: '4x6m' },
};

// 画布默认设置
const DEFAULT_ZOOM = 100; // 百分比
const DEFAULT_DPI = 150;
const MIN_ZOOM = 10;
const MAX_ZOOM = 1000;

type Unit = 'mm' | 'cm' | 'm';

interface CanvasState {
  // 画布尺寸和单位
  width: number;
  height: number;
  unit: Unit;
  dpi: number;
  
  // 视图控制
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  pan: { x: number, y: number };
  
  // 操作方法
  setCanvasSize: (width: number, height: number) => void;
  setUnit: (unit: Unit) => void;
  setDpi: (dpi: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  applyPreset: (preset: keyof typeof CARPET_PRESETS) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  // 初始状态
  width: CARPET_PRESETS.MEDIUM.width,
  height: CARPET_PRESETS.MEDIUM.height,
  unit: 'mm',
  dpi: DEFAULT_DPI,
  zoom: DEFAULT_ZOOM,
  showGrid: true,
  showRulers: true,
  pan: { x: 0, y: 0 },
  
  // 操作方法
  setCanvasSize: (width, height) => set({ width, height }),
  setUnit: (unit) => set({ unit }),
  setDpi: (dpi) => set({ dpi }),
  setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM) }),
  setPan: (x, y) => set({ pan: { x, y } }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
  applyPreset: (preset) => set({
    width: CARPET_PRESETS[preset].width,
    height: CARPET_PRESETS[preset].height,
  }),
})); 