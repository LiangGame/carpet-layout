import { create } from 'zustand';

// 阵列类型
export type ArrangementType = 'linear' | 'radial';

// 线性阵列配置
interface LinearArrangement {
  type: 'linear';
  rows: number;
  columns: number;
  rowSpacing: number; // 行间距（毫米）
  columnSpacing: number; // 列间距（毫米）
  fillCanvas: boolean; // 是否自动填满画布
}

// 径向阵列配置
interface RadialArrangement {
  type: 'radial';
  count: number; // 复制数量
  angle: number; // 完整角度（通常为360度）
  radius: number; // 径向距离（毫米）
}

// 阵列联合类型
export type Arrangement = LinearArrangement | RadialArrangement;

// 变形类型
export type TransformationType = 'free' | 'envelope';

// 自由变形配置
interface FreeTransformation {
  type: 'free';
  skewX: number; // 水平斜切角度
  skewY: number; // 垂直斜切角度
  scaleX: number; // 水平缩放
  scaleY: number; // 垂直缩放
  rotation: number; // 旋转角度
}

// 封套变形配置
interface EnvelopeTransformation {
  type: 'envelope';
  gridSize: [number, number]; // 网格大小，如 [4, 4]
  controlPoints: { x: number; y: number }[][]; // 控制点网格
}

// 变形联合类型
export type Transformation = FreeTransformation | EnvelopeTransformation;

interface PatternState {
  // 当前阵列类型
  arrangementType: ArrangementType;
  
  // 阵列配置
  linearArrangement: LinearArrangement;
  radialArrangement: RadialArrangement;
  
  // 当前变形类型
  transformationType: TransformationType;
  
  // 变形配置
  freeTransformation: FreeTransformation;
  envelopeTransformation: EnvelopeTransformation;
  
  // 是否启用阵列
  arrangementEnabled: boolean;
  
  // 是否启用变形
  transformationEnabled: boolean;
  
  // 方法
  setArrangementType: (type: ArrangementType) => void;
  setLinearArrangement: (config: Partial<LinearArrangement>) => void;
  setRadialArrangement: (config: Partial<RadialArrangement>) => void;
  setTransformationType: (type: TransformationType) => void;
  setFreeTransformation: (config: Partial<FreeTransformation>) => void;
  setEnvelopeTransformation: (config: Partial<EnvelopeTransformation>) => void;
  toggleArrangementEnabled: () => void;
  toggleTransformationEnabled: () => void;
  resetTransformations: () => void;
}

// 创建网格控制点辅助函数
const createGridControlPoints = (rows: number, cols: number): { x: number; y: number }[][] => {
  const grid: { x: number; y: number }[][] = [];
  
  for (let r = 0; r <= rows; r++) {
    const row: { x: number; y: number }[] = [];
    for (let c = 0; c <= cols; c++) {
      row.push({
        x: c / cols,  // 归一化坐标 (0-1)
        y: r / rows,  // 归一化坐标 (0-1)
      });
    }
    grid.push(row);
  }
  
  return grid;
};

export const usePatternStore = create<PatternState>((set) => ({
  // 初始状态
  arrangementType: 'linear',
  
  linearArrangement: {
    type: 'linear',
    rows: 2,
    columns: 2,
    rowSpacing: 10,
    columnSpacing: 10,
    fillCanvas: false,
  },
  
  radialArrangement: {
    type: 'radial',
    count: 6,
    angle: 360,
    radius: 100,
  },
  
  transformationType: 'free',
  
  freeTransformation: {
    type: 'free',
    skewX: 0,
    skewY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  },
  
  envelopeTransformation: {
    type: 'envelope',
    gridSize: [4, 4],
    controlPoints: createGridControlPoints(4, 4),
  },
  
  arrangementEnabled: false,
  transformationEnabled: false,
  
  // 方法
  setArrangementType: (type) => set({ arrangementType: type }),
  
  setLinearArrangement: (config) => set((state) => ({
    linearArrangement: {
      ...state.linearArrangement,
      ...config,
      type: 'linear',
    },
  })),
  
  setRadialArrangement: (config) => set((state) => ({
    radialArrangement: {
      ...state.radialArrangement,
      ...config,
      type: 'radial',
    },
  })),
  
  setTransformationType: (type) => set({ transformationType: type }),
  
  setFreeTransformation: (config) => set((state) => ({
    freeTransformation: {
      ...state.freeTransformation,
      ...config,
      type: 'free',
    },
  })),
  
  setEnvelopeTransformation: (config) => set((state) => ({
    envelopeTransformation: {
      ...state.envelopeTransformation,
      ...config,
      type: 'envelope',
    },
  })),
  
  toggleArrangementEnabled: () => set((state) => ({
    arrangementEnabled: !state.arrangementEnabled,
  })),
  
  toggleTransformationEnabled: () => set((state) => ({
    transformationEnabled: !state.transformationEnabled,
  })),
  
  resetTransformations: () => set({
    freeTransformation: {
      type: 'free',
      skewX: 0,
      skewY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    },
    envelopeTransformation: {
      type: 'envelope',
      gridSize: [4, 4],
      controlPoints: createGridControlPoints(4, 4),
    },
  }),
})); 