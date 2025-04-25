import { create } from 'zustand';

interface DrawingState {
  // 线条颜色
  strokeColor: string;
  
  // 填充颜色
  fillColor: string;
  
  // 线条宽度
  strokeWidth: number;
  
  // 文本线条宽度
  textStrokeWidth: number;
  
  // 是否填充
  hasFill: boolean;
  
  // 文本相关属性
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  fontStyle: string; // normal, bold, italic
  
  // 操作方法
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setTextStrokeWidth: (width: number) => void;
  toggleFill: () => void;
  setHasFill: (hasFill: boolean) => void;
  
  // 文本相关方法
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void; 
  setTextAlign: (align: 'left' | 'center' | 'right') => void;
  setFontStyle: (style: string) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  // 初始状态
  strokeColor: '#000000',
  fillColor: '#4287f5',
  strokeWidth: 10,
  textStrokeWidth: 0,
  hasFill: false,
  
  // 文本初始状态
  fontSize: 18,
  fontFamily: 'Arial',
  textAlign: 'left' as const,
  fontStyle: 'normal',
  
  // 方法实现
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setTextStrokeWidth: (width) => set({ textStrokeWidth: width }),
  toggleFill: () => set((state) => ({ hasFill: !state.hasFill })),
  setHasFill: (hasFill) => set({ hasFill }),
  
  // 文本方法实现
  setFontSize: (size) => set({ fontSize: size }),
  setFontFamily: (family) => set({ fontFamily: family }),
  setTextAlign: (align) => set({ textAlign: align }),
  setFontStyle: (style) => set({ fontStyle: style }),
})); 