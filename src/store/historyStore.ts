import { create } from 'zustand';

// 定义形状接口
export interface ShapeProps {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  bezierPoints?: {x: number, y: number, controlX1?: number, controlY1?: number, controlX2?: number, controlY2?: number}[];
  stroke: string;
  strokeWidth: number;
  fill: string;
  draggable: boolean;
}

// 辅助线接口
export interface GuidelineProps {
  points: number[];
  text?: string;
  textPosition?: { x: number, y: number };
}

// 永久性标注接口
export interface AnnotationProps extends GuidelineProps {
  shapeId: string; // 关联的形状ID
}

// 定义历史记录中需要存储的状态
interface HistoryState {
  shapes: ShapeProps[];
  annotations: AnnotationProps[];
}

interface HistoryRecord {
  state: HistoryState;
  description: string;
}

interface HistoryStore {
  // 历史记录堆栈
  history: HistoryRecord[];
  
  // 当前在历史记录中的位置索引
  currentIndex: number;
  
  // 最大历史记录数量
  maxHistorySize: number;
  
  // 当前状态是否已保存到历史记录中
  isSaved: boolean;
  
  // 添加新的历史记录
  addHistory: (state: HistoryState, description: string) => void;
  
  // 撤销操作
  undo: () => HistoryState | null;
  
  // 重做操作
  redo: () => HistoryState | null;
  
  // 获取当前状态
  getCurrentState: () => HistoryState | null;
  
  // 重置历史记录
  resetHistory: () => void;
  
  // 检查是否可以撤销/重做
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // 设置保存状态
  setSaved: (saved: boolean) => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  history: [],
  currentIndex: -1,
  maxHistorySize: 30,
  isSaved: true,
  
  addHistory: (state, description) => {
    const { history, currentIndex, maxHistorySize } = get();
    
    // 创建新的历史记录
    const newRecord: HistoryRecord = {
      state: {
        shapes: JSON.parse(JSON.stringify(state.shapes)),    // 深拷贝确保数据独立
        annotations: JSON.parse(JSON.stringify(state.annotations)),
      },
      description
    };
    
    // 如果当前不在历史的末尾，则删除当前位置之后的所有历史
    let newHistory = currentIndex < history.length - 1
      ? history.slice(0, currentIndex + 1)
      : [...history];
    
    // 添加新的记录
    newHistory.push(newRecord);
    
    // 如果历史记录超过最大限制，则删除最老的记录
    if (newHistory.length > maxHistorySize) {
      newHistory = newHistory.slice(newHistory.length - maxHistorySize);
    }
    
    // 更新状态
    set({
      history: newHistory,
      currentIndex: newHistory.length - 1,
      isSaved: false
    });
  },
  
  undo: () => {
    const { history, currentIndex } = get();
    
    // 检查是否可以撤销
    if (currentIndex <= 0) return null;
    
    // 更新索引
    const newIndex = currentIndex - 1;
    set({ currentIndex: newIndex, isSaved: false });
    
    // 返回撤销后的状态
    return history[newIndex]?.state || null;
  },
  
  redo: () => {
    const { history, currentIndex } = get();
    
    // 检查是否可以重做
    if (currentIndex >= history.length - 1) return null;
    
    // 更新索引
    const newIndex = currentIndex + 1;
    set({ currentIndex: newIndex, isSaved: false });
    
    // 返回重做后的状态
    return history[newIndex]?.state || null;
  },
  
  getCurrentState: () => {
    const { history, currentIndex } = get();
    return currentIndex >= 0 && currentIndex < history.length
      ? history[currentIndex].state
      : null;
  },
  
  resetHistory: () => {
    set({ history: [], currentIndex: -1, isSaved: true });
  },
  
  canUndo: () => {
    const { currentIndex } = get();
    return currentIndex > 0;
  },
  
  canRedo: () => {
    const { history, currentIndex } = get();
    return currentIndex < history.length - 1;
  },
  
  setSaved: (saved) => {
    set({ isSaved: saved });
  }
})); 