import { create } from 'zustand';

export type ToolType = 
  | 'select'       // 选择工具
  | 'rectangle'    // 矩形工具
  | 'circle'       // 圆形工具
  | 'line'         // 直线工具
  | 'polygon'      // 多边形工具
  | 'path'         // 自由路径工具
  | 'doorTemplate' // 门框预设工具
  | 'text'         // 文本工具
  | 'canvas'       // 画布设置
  | 'brush'        // 画笔工具
  | 'color'        // 颜色设置
  | 'view'         // 视图选项
  | 'arrange'      // 阵列排列
  | 'transform';   // 变形工具

interface ToolState {
  // 当前选中的工具
  activeTool: ToolType;
  
  // 当前多边形的边数设置
  polygonSides: number;
  
  // 是否锁定比例
  lockRatio: boolean;
  
  // 方法
  setActiveTool: (tool: ToolType) => void;
  setPolygonSides: (sides: number) => void;
  toggleLockRatio: () => void;
}

export const useToolsStore = create<ToolState>((set) => ({
  // 初始状态
  activeTool: 'select',
  polygonSides: 6,
  lockRatio: false,
  
  // 操作方法
  setActiveTool: (tool) => set({ activeTool: tool }),
  setPolygonSides: (sides) => set({ polygonSides: Math.min(Math.max(sides, 3), 12) }),
  toggleLockRatio: () => set((state) => ({ lockRatio: !state.lockRatio })),
})); 