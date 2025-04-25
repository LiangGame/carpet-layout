import { create } from 'zustand';

// 定义渐变类型
export type GradientType = 'linear' | 'radial';

// 定义色标点类型
interface ColorStop {
  offset: number; // 0-1范围内的位置
  color: string;  // 颜色值（HEX格式）
}

// 定义渐变对象
interface Gradient {
  type: GradientType;
  colorStops: ColorStop[];
  angle?: number; // 线性渐变的角度（仅用于线性渐变）
  radius?: number; // 径向渐变的半径（仅用于径向渐变）
}

// 可用材质类型
export type MaterialType = 'wool' | 'acrylic' | 'silk' | 'cotton' | 'nylon';

// 材质颜色定义
interface MaterialColor {
  id: string;
  name: string;
  hex: string;
  type: MaterialType;
  pantoneCode?: string; // Pantone色号（如果有）
}

// 预设材质颜色
const presetMaterialColors: MaterialColor[] = [
  { id: 'wool-1', name: '羊毛白', hex: '#F5F5DC', type: 'wool' },
  { id: 'wool-2', name: '羊毛奶油', hex: '#FFFDD0', type: 'wool' },
  { id: 'wool-3', name: '羊毛灰', hex: '#808080', type: 'wool' },
  { id: 'wool-4', name: '羊毛黑', hex: '#36454F', type: 'wool' },
  { id: 'acrylic-1', name: '腈纶红', hex: '#FF5252', type: 'acrylic' },
  { id: 'acrylic-2', name: '腈纶蓝', hex: '#4169E1', type: 'acrylic' },
  { id: 'acrylic-3', name: '腈纶绿', hex: '#228B22', type: 'acrylic' },
  { id: 'acrylic-4', name: '腈纶黄', hex: '#FFD700', type: 'acrylic' },
  { id: 'silk-1', name: '丝绸米', hex: '#FFF8DC', type: 'silk' },
  { id: 'silk-2', name: '丝绸紫', hex: '#800080', type: 'silk' },
  { id: 'cotton-1', name: '棉质白', hex: '#FFFFFF', type: 'cotton' },
  { id: 'cotton-2', name: '棉质蓝', hex: '#87CEEB', type: 'cotton' },
  { id: 'nylon-1', name: '尼龙灰', hex: '#A9A9A9', type: 'nylon' },
  { id: 'nylon-2', name: '尼龙黑', hex: '#000000', type: 'nylon' },
];

export type FillType = 'solid' | 'gradient' | 'none';

interface ColorState {
  // 当前填充类型
  fillType: FillType;
  
  // 当前选中的纯色
  solidColor: string;
  
  // 当前选中的渐变
  gradient: Gradient;
  
  // 材质颜色列表
  materialColors: MaterialColor[];
  
  // 收藏的颜色
  favoriteColors: string[];
  
  // 最近使用的颜色
  recentColors: string[];
  
  // 是否显示材质模式（否则为标准色彩模式）
  materialMode: boolean;
  
  // 方法
  setSolidColor: (color: string) => void;
  setFillType: (type: FillType) => void;
  setGradient: (gradient: Gradient) => void;
  addGradientStop: (stop: ColorStop) => void;
  updateGradientStop: (index: number, stop: ColorStop) => void;
  removeGradientStop: (index: number) => void;
  addToFavorites: (color: string) => void;
  removeFromFavorites: (color: string) => void;
  toggleMaterialMode: () => void;
  findSimilarMaterialColor: (hexColor: string) => MaterialColor | null;
}

export const useColorStore = create<ColorState>((set, get) => ({
  // 初始状态
  fillType: 'solid',
  solidColor: '#000000',
  gradient: {
    type: 'linear',
    colorStops: [
      { offset: 0, color: '#ffffff' },
      { offset: 1, color: '#000000' },
    ],
    angle: 0,
  },
  materialColors: presetMaterialColors,
  favoriteColors: [],
  recentColors: [],
  materialMode: false,
  
  // 方法
  setSolidColor: (color) => {
    set({ solidColor: color });
    // 添加到最近使用的颜色
    const recentColors = [color, ...get().recentColors.filter(c => c !== color)].slice(0, 10);
    set({ recentColors });
  },
  
  setFillType: (type) => set({ fillType: type }),
  
  setGradient: (gradient) => set({ gradient }),
  
  addGradientStop: (stop) => set((state) => ({
    gradient: {
      ...state.gradient,
      colorStops: [...state.gradient.colorStops, stop].sort((a, b) => a.offset - b.offset),
    }
  })),
  
  updateGradientStop: (index, stop) => set((state) => {
    const newStops = [...state.gradient.colorStops];
    newStops[index] = stop;
    return {
      gradient: {
        ...state.gradient,
        colorStops: newStops.sort((a, b) => a.offset - b.offset),
      }
    };
  }),
  
  removeGradientStop: (index) => set((state) => {
    // 确保至少保留两个色标点
    if (state.gradient.colorStops.length <= 2) return state;
    
    const newStops = [...state.gradient.colorStops];
    newStops.splice(index, 1);
    return {
      gradient: {
        ...state.gradient,
        colorStops: newStops,
      }
    };
  }),
  
  addToFavorites: (color) => set((state) => ({
    favoriteColors: state.favoriteColors.includes(color)
      ? state.favoriteColors
      : [...state.favoriteColors, color]
  })),
  
  removeFromFavorites: (color) => set((state) => ({
    favoriteColors: state.favoriteColors.filter(c => c !== color)
  })),
  
  toggleMaterialMode: () => set((state) => ({
    materialMode: !state.materialMode
  })),
  
  // 查找最接近的材质颜色
  findSimilarMaterialColor: (hexColor) => {
    // 将十六进制颜色转换为RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // 找到最接近的材质颜色
    let closestColor: MaterialColor | null = null;
    let minDistance = Infinity;
    
    get().materialColors.forEach(material => {
      const mr = parseInt(material.hex.slice(1, 3), 16);
      const mg = parseInt(material.hex.slice(3, 5), 16);
      const mb = parseInt(material.hex.slice(5, 7), 16);
      
      // 计算欧几里得距离
      const distance = Math.sqrt(
        Math.pow(r - mr, 2) + Math.pow(g - mg, 2) + Math.pow(b - mb, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = material;
      }
    });
    
    return closestColor;
  },
})); 