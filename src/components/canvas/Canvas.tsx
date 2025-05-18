import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Rect, Circle, Line, Path, Text } from 'react-konva';
import { useCanvasStore } from '../../store/canvasStore';
import { useToolsStore } from '../../store/toolsStore';
import { useDrawingStore } from '../../store/drawingStore';
import Rulers from './Rulers';
import Konva from 'konva';
import { ReloadOutlined, CheckOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useHistoryStore } from '../../store/historyStore';

// 形状接口
interface ShapeProps {
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
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: string;
  fontStyle?: string;
}

// 辅助线接口
interface GuidelineProps {
  points: number[];
  text?: string;
  textPosition?: { x: number, y: number };
}

// 在形状接口后添加永久性标注接口
interface AnnotationProps extends GuidelineProps {
  shapeId: string; // 关联的形状ID
}

// 添加对齐辅助线接口
interface AlignmentGuideProps {
  points: number[];
}

// 添加交点节点接口
interface JointProps {
  id: string;
  x: number;
  y: number;
  radius: number;
  fill: string;
  stroke: string;
}

// Canvas组件样式
const canvasContainerStyle = (isSpacePressed: boolean): React.CSSProperties => ({
  position: 'relative',
  overflow: 'hidden',
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#333', // 调整为与深色主题一致的背景色
  cursor: isSpacePressed ? 'grab' : 'default', // 空格键按下时变为抓取手势
});

// 修改缩放控制器样式 - 使用指定位置
const zoomControlsStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(94vh - 37px)',
  right: '8px',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: '#ffffff',
  padding: '4px',
  borderRadius: '3px',
  fontSize: '13px',
  fontWeight: 'bold',
  zIndex: 9999,
  userSelect: 'none',
  fontFamily: 'Arial, sans-serif',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
};

const zoomButtonStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'rgba(255, 255, 255, 0.2)',
  color: 'white',
  borderRadius: '2px',
  margin: '0 3px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
};

// 重置按钮样式
const resetButtonStyle: React.CSSProperties = {
  ...zoomButtonStyle,
  width: 'auto',
  fontSize: '12px',
  padding: '0 5px',
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
};

const zoomTextStyle: React.CSSProperties = {
  margin: '0 5px',
  minWidth: '45px',
  textAlign: 'center',
  fontSize: '12px',
};

// 暴露给父组件的方法接口
export interface CanvasRef {
  handleUndo: () => void;
  handleRedo: () => void;
}

// 修改为接受ref参数的组件
const Canvas = forwardRef<CanvasRef, object>((_props, ref) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  
  // 形状状态管理
  const [shapes, setShapes] = useState<ShapeProps[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // 辅助线状态管理
  const [guidelines, setGuidelines] = useState<GuidelineProps[]>([]);
  
  // 永久性标注状态管理
  const [annotations, setAnnotations] = useState<AnnotationProps[]>([]);
  
  // 添加对齐辅助线状态
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuideProps[]>([]);
  const alignmentThreshold = 10; // 对齐阈值，单位为像素
  
  // 获取激活的工具
  const { activeTool } = useToolsStore();
  
  // 绘制状态
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentShapeId, setCurrentShapeId] = useState<string | null>(null);
  
  // 钢笔工具状态
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number, controlX1?: number, controlY1?: number, controlX2?: number, controlY2?: number }[]>([]);
  const [activeControlPoint] = useState<{index: number, handle: 'controlPoint1' | 'controlPoint2' | null}>({index: -1, handle: null});
  const [lastMousePos, setLastMousePos] = useState<{x: number, y: number} | null>(null);
  
  // 历史记录处理
  const { addHistory, undo, redo } = useHistoryStore();

  // 记录当前状态到历史记录
  const recordHistory = (description: string) => {
    addHistory({
      shapes,
      annotations
    }, description);
  };

  // 处理撤销操作
  const handleUndo = () => {
    const prevState = undo();
    if (prevState) {
      setShapes(prevState.shapes);
      setAnnotations(prevState.annotations);
    }
  };

  // 处理重做操作
  const handleRedo = () => {
    const nextState = redo();
    if (nextState) {
      setShapes(nextState.shapes);
      setAnnotations(nextState.annotations);
    }
  };
  
  // 初始化历史记录
  useEffect(() => {
    // 添加初始历史记录
    recordHistory('初始状态');
  }, []); // 仅在组件挂载时执行一次
  
  const {
    width,
    height,
    zoom,
    pan,
    showGrid,
    showRulers,
    setZoom,
    setPan
  } = useCanvasStore();

  // 获取绘制属性
  const { strokeColor, fillColor, strokeWidth, textStrokeWidth, hasFill } = useDrawingStore();

  // 网格样式，修改为无限大小
  const gridStyle = (gridSize: number, panX: number, panY: number): React.CSSProperties => ({
    position: 'absolute',
    top: '-5000px',  // 网格向上扩展5000px
    left: '-5000px', // 网格向左扩展5000px
    width: '10000px', // 总宽度10000px (比大多数屏幕都大得多)
    height: '10000px', // 总高度10000px
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundImage: `
      linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
    `,
    transform: `translate(${-panX}px, ${-panY}px)`,
    pointerEvents: 'none',
    zIndex: 1,
  });

  // 像素转米的换算函数
  const pixelsToMeters = (pixels: number): number => {
    // 假设100像素 = 1米，可以根据需要调整这个比例
    const ratio = 100; // 像素/米
    return pixels / ratio;
  };

  // 格式化尺寸显示，保留两位小数
  const formatMeasurement = (pixels: number): string => {
    const meters = pixelsToMeters(pixels);
    return `${meters.toFixed(2)}m`;
  };

  // 生成唯一ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 11);
  };

  // 缩放处理

  // 空格+拖拽平移画布
  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const [lastPosition, setLastPosition] = React.useState({ x: 0, y: 0 });

  // 添加连续绘制线条的状态
  const [continuousDrawing, setContinuousDrawing] = useState(false);
  const [linePoints, setLinePoints] = useState<number[]>([]);
  const [lineSegments, setLineSegments] = useState<ShapeProps[]>([]);

  // 添加转折点节点状态
  const [joints, setJoints] = useState<JointProps[]>([]);

  // 在Canvas组件内添加mouseCaptured状态来跟踪鼠标按下
  const [mouseCaptured, setMouseCaptured] = useState(false);

  // 添加一个状态来存储形状的起始点位置
  const [dragOrigin, setDragOrigin] = useState<{ id: string, points: number[] | null, x: number, y: number } | null>(null);

  // 添加拖动控制点的状态
  const [activeHandle, setActiveHandle] = useState<{
    id: string;
    handleIndex: number; 
    type: HandleType;
    initialPosition: {x: number, y: number};
    initialShape: ShapeProps;
  } | null>(null);

  // 文本编辑状态
  const [editingText, setEditingText] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showTextHelp, setShowTextHelp] = useState(false);

  // 从drawingStore获取文本属性
  const { fontSize, fontFamily, textAlign, fontStyle } = useDrawingStore();

  // 处理文本双击编辑
  const handleTextDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 获取文本形状ID
    const id = e.target.id();
    if (!id) return;
    
    // 找到文本形状
    const textShape = shapes.find(s => s.id === id && s.type === 'text');
    if (!textShape) return;
    
    // 设置编辑中的文本ID和值
    setEditingText(id);
    setTextValue(textShape.text || '');
    setShowTextHelp(true); // 显示帮助提示
    
    // 获取文本在画布中的位置
    const textNode = e.target as Konva.Text;
    const textWidth = textNode.width();
    const textHeight = textNode.height();
    
    // 根据缩放和平移计算屏幕上的实际位置
    const stage = stageRef.current;
    if (stage) {
      const stageRect = stage.container().getBoundingClientRect();
      
      // 确保使用正确的坐标转换
      // 从舞台坐标到画布坐标
      const absPos = textNode.getAbsolutePosition();
      
      const textPosInStage = {
        x: absPos.x * scale + stageRect.left - pan.x * scale,
        y: absPos.y * scale + stageRect.top - pan.y * scale,
        width: Math.max(textWidth * scale, 200), // 确保最小宽度适合输入
        height: Math.max(textHeight * scale, 40) // 确保最小高度适合输入
      };
      
      setTextPosition(textPosInStage);
    }
    
    // 记录编辑前的状态，以便在历史记录中记录更改
    recordHistory(`开始编辑文本 #${id}`);
    
    // 设置一个定时器，使文本区域在出现后获得焦点
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select(); // 全选文本以便直接替换
      }
    }, 10);
  };

  // 处理文本输入完成
  
  // 确认编辑完成
  const handleCompleteTextEdit = () => {
    if (editingText === null) return;
    
    // 找到正在编辑的文本形状
    const textShape = shapes.find(s => s.id === editingText);
    if (!textShape) return;
    
    // 更新文本内容
    const updatedShapes = shapes.map(s => {
      if (s.id === editingText) {
        return { 
          ...s, 
          text: textValue || '文本', // 确保不会有空文本
          fontSize: fontSize,
          fontFamily: fontFamily,
          textAlign: textAlign,
          fontStyle: fontStyle,
          strokeWidth: textStrokeWidth
        };
      }
      return s;
    });
    
    setShapes(updatedShapes);
    setEditingText(null);
    setShowTextHelp(false);
    
    // 记录文本编辑到历史
    recordHistory(`编辑文本 #${editingText}`);
  };
  
  // 取消编辑
  const handleCancelTextEdit = () => {
    setEditingText(null);
    setShowTextHelp(false);
  };

  // 处理文本输入变化
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextValue(e.target.value);
  };

  // 处理ESC键取消文本编辑
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelTextEdit();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCompleteTextEdit();
    }
  };

  // 修改处理键盘事件的函数，在空格按下和释放时调整鼠标样式


  useEffect(() => {
    const handleKeyboardDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(true);
        // 将鼠标样式设为grab
        document.body.style.cursor = mouseCaptured ? 'grabbing' : 'grab';
      }
      
      // 按Escape键结束连续绘制
      if (e.code === 'Escape') {
        console.log('ESC key pressed, exiting continuous drawing mode');
        setContinuousDrawing(false);
        setLinePoints([]);
        setIsDrawing(false);
        setCurrentShapeId(null);
      }
      
      // 添加Ctrl+Z撤销快捷键
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      
      // 添加Ctrl+Y重做快捷键
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      
      // 添加Delete键删除选中形状
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        // 内联处理删除形状
        setShapes(shapes.filter(shape => shape.id !== selectedId));
        setAnnotations(annotations.filter(anno => anno.shapeId !== selectedId));
        // 记录历史
        addHistory({
          shapes: shapes.filter(shape => shape.id !== selectedId),
          annotations: annotations.filter(anno => anno.shapeId !== selectedId)
        }, `删除形状 #${selectedId}`);
        setSelectedId(null);
      }
      
      // 如果正在编辑文本，不处理全局快捷键
      if (editingText !== null) return;
    };

    const handleKeyboardUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        // 恢复默认鼠标样式
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyboardDown);
    window.addEventListener('keyup', handleKeyboardUp);
    return () => {
      window.removeEventListener('keydown', handleKeyboardDown);
      window.removeEventListener('keyup', handleKeyboardUp);
    };
  }, [
    continuousDrawing, 
    linePoints, 
    shapes, 
    annotations, 
    selectedId, 
    mouseCaptured,
    isSpacePressed,
    editingText,
    addHistory,
    handleUndo,
    handleRedo
  ]);
  
  // 修改坐标转换辅助函数
  // 将鼠标/屏幕坐标转换为画布坐标
  const getStagePointerPosition = (stage: Konva.Stage | null): { x: number, y: number } | null => {
    if (!stage) return null;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return null;
    
    // 更正坐标计算 - 这里需要考虑Stage的位置和缩放
    // Stage设置了x=-pan.x和缩放为scale，所以需要反向计算
    return {
      x: (pointerPos.x) / scale + pan.x / scale,
      y: (pointerPos.y) / scale + pan.y / scale
    };
  };

  // 修改handleMouseDown函数
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isSpacePressed) {
      // 在空格按下状态下，更新鼠标样式为grabbing
      document.body.style.cursor = 'grabbing';
      setMouseCaptured(true);
      
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          // 记录原始鼠标位置，不需要转换
          setLastPosition({
            x: pointerPos.x,
            y: pointerPos.y
          });
        }
      }
      return;
    }
    
    // 获取当前鼠标位置
    const stage = e.target.getStage();
    const pointerPos = getStagePointerPosition(stage);
    if (!pointerPos) return;
    
    const { x, y } = pointerPos;
    setLastMousePos({ x, y });
    
    // 如果点击的是舞台而不是形状，取消选择
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
    
    // 只有在未选择任何形状且使用绘图工具时才启动绘制模式
    if (
      !clickedOnEmpty || 
      activeTool === 'select' || 
      activeTool === 'view' || 
      activeTool === 'canvas' || 
      activeTool === 'color'
    ) {
      return;
    }
    
    // 如果正在连续绘制多边形，则不需要重新开始
    if (continuousDrawing && activeTool === 'polygon') {
      return;
    }
    
    // 如果是PS钢笔工具 (activeTool === 'path')
    if (activeTool === 'path') {
      if (!isDrawing) {
        // 开始一个新路径
        setIsDrawing(true);
        const id = generateId();
        setCurrentShapeId(id);
        
        // 添加第一个点
        const newPoint = { x, y };
        setCurrentPath([newPoint]);
        
        // 创建新形状
        const newShape: ShapeProps = {
          id,
          type: 'bezier',
          x: 0,
          y: 0,
          bezierPoints: [newPoint],
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          fill: hasFill ? fillColor : 'transparent',
          draggable: true,
        };
        
        setShapes([...shapes, newShape]);
      } else {
        // 已经在绘制路径中，添加新点
        if (currentShapeId) {
          // 检查是否点击接近第一个点，如果是则闭合路径
          const shape = shapes.find(s => s.id === currentShapeId);
          if (shape && shape.bezierPoints && shape.bezierPoints.length > 1) {
            const firstPoint = shape.bezierPoints[0];
            const dx = x - firstPoint.x;
            const dy = y - firstPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 10) { // 10px阈值
              // 闭合路径
              const closedPath = [...shape.bezierPoints];
              
              // 更新形状使路径闭合
              setShapes(shapes.map(s => {
                if (s.id === currentShapeId) {
                  return {
                    ...s,
                    bezierPoints: closedPath,
                    draggable: true
                  };
                }
                return s;
              }));
              
              // 结束绘制
              setIsDrawing(false);
              setCurrentPath([]);
              setCurrentShapeId(null);
              return;
            }
          }
          
          // 添加新点，使用上一点和当前点之间的贝塞尔曲线
          const newPoint = { x, y, controlX1: x, controlY1: y, controlX2: x, controlY2: y };
          
          // 更新上一个点的控制点
          const updatedPath = [...currentPath];
          if (updatedPath.length > 0) {
            const prevPoint = updatedPath[updatedPath.length - 1];
            // 如果是添加第二个点，设置第一个点的控制点
            if (updatedPath.length === 1) {
              prevPoint.controlX2 = prevPoint.x;
              prevPoint.controlY2 = prevPoint.y;
            }
          }
          
          // 添加新点到路径中
          updatedPath.push(newPoint);
          setCurrentPath(updatedPath);
          
          // 更新形状
          setShapes(shapes.map(s => {
            if (s.id === currentShapeId) {
              return {
                ...s,
                bezierPoints: updatedPath
              };
            }
            return s;
          }));
        }
      }
      return;
    }
    
    setIsDrawing(true);
    
    setStartPoint({ x, y });
    
    // 形状的共同属性
    const commonProps = {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      fill: hasFill ? fillColor : 'transparent',
      draggable: true,
    };
    
    let newShape: ShapeProps | null = null;
    const id = generateId();
    
    // 根据不同的绘制工具执行不同的操作
    switch (activeTool) {
      case 'rectangle':
        newShape = {
          id,
          type: 'rectangle',
          x,
          y,
          width: 0,
          height: 0,
          ...commonProps
        };
        break;
        
      case 'circle':
        newShape = {
          id,
          type: 'circle',
          x,
          y,
          radius: 0,
          ...commonProps
        };
        break;
        
      case 'line':
        // 简化的线条工具，只创建单一线段
        newShape = {
          id,
          type: 'line',
          x: 0,
          y: 0,
          points: [x, y, x, y],
          ...commonProps
        };
        break;
        
      case 'polygon':
        // 多边形工具，支持连续绘制
        newShape = {
          id,
          type: 'line', // 仍然使用line类型，但行为不同
          x: 0,
          y: 0,
          points: [x, y, x, y],
          ...commonProps
        };
        break;
        
      case 'brush':
        // 画笔工具使用路径
        newShape = {
          id,
          type: 'path',
          x: 0,
          y: 0,
          points: [x, y],
          ...commonProps
        };
        break;
        
      case 'text':
        // 文本工具
        newShape = {
          id,
          type: 'text',
          x,
          y,
          text: '点击输入文本',
          fontSize,
          fontFamily,
          textAlign,
          fontStyle,
          stroke: strokeColor,
          strokeWidth: textStrokeWidth, // 使用文本专用的线条宽度
          fill: '#000000', // 文本默认黑色
          draggable: true,
        };
        
        // 在添加形状后立即进入编辑模式
        setTimeout(() => {
          setEditingText(id);
          setTextValue('点击输入文本');
          setShowTextHelp(true);
          
          // 设置文本框位置
          const stage = stageRef.current;
          if (stage) {
            const stageRect = stage.container().getBoundingClientRect();
            // 计算文本框在屏幕上的位置
            const textPosInStage = {
              x: (x * scale) + stageRect.left - (pan.x * scale),
              y: (y * scale) + stageRect.top - (pan.y * scale),
              width: 200, // 初始宽度
              height: 40  // 初始高度
            };
            setTextPosition(textPosInStage);
          }
          
          // 设置一个定时器，使文本区域在出现后获得焦点
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              textareaRef.current.select();
            }
          }, 10);
        }, 10);
        
        break;
    }
    
    if (newShape) {
      setShapes([...shapes, newShape]);
      setCurrentShapeId(id);
    }
  };

  // 修改handleMouseMove函数
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isSpacePressed && mouseCaptured) {
      // 只有空格+鼠标按下时才能拖动
      const stage = e.target.getStage();
      if (stage) {
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          // 计算屏幕像素中的移动差异
          const deltaX = pointerPos.x - lastPosition.x;
          const deltaY = pointerPos.y - lastPosition.y;
          
          // 根据当前缩放级别调整pan的变化量
          const scaledDeltaX = deltaX / scale;
          const scaledDeltaY = deltaY / scale;
          
          // 更新pan位置
          setPan(pan.x - scaledDeltaX, pan.y - scaledDeltaY);
          
          // 更新拖动起始位置
          setLastPosition({ x: pointerPos.x, y: pointerPos.y });
        }
      }
      return;
    }
    
    // 获取当前鼠标位置
    const stage = e.target.getStage();
    const pointerPos = getStagePointerPosition(stage);
    if (!pointerPos) return;
    
    const { x, y } = pointerPos;
    
    // 如果是钢笔工具的控制点拖拽
    if (activeTool === 'path' && isDrawing && currentShapeId && activeControlPoint.index !== -1) {
      // 正在调整控制点
      const shape = shapes.find(s => s.id === currentShapeId);
      if (!shape || !shape.bezierPoints) return;
      
      const updatedPoints = [...shape.bezierPoints];
      const point = updatedPoints[activeControlPoint.index];
      
      if (!point) return;
      
      // 获取移动距离
      if (!lastMousePos) {
        setLastMousePos({ x, y });
        return;
      }
      
      const deltaX = x - lastMousePos.x;
      const deltaY = y - lastMousePos.y;
      
      // 根据当前拖拽的控制柄更新点
      if (activeControlPoint.handle === 'controlPoint1') {
        // 控制点1
        if (point.controlX1 !== undefined && point.controlY1 !== undefined) {
          point.controlX1 += deltaX;
          point.controlY1 += deltaY;
          
          // 对称更新另一侧的控制点
          if (point.controlX2 !== undefined && point.controlY2 !== undefined) {
            const dx = point.x - point.controlX1;
            const dy = point.y - point.controlY1;
            point.controlX2 = point.x + dx;
            point.controlY2 = point.y + dy;
          }
        }
      } else if (activeControlPoint.handle === 'controlPoint2') {
        // 控制点2
        if (point.controlX2 !== undefined && point.controlY2 !== undefined) {
          point.controlX2 += deltaX;
          point.controlY2 += deltaY;
          
          // 对称更新另一侧的控制点
          if (point.controlX1 !== undefined && point.controlY1 !== undefined) {
            const dx = point.x - point.controlX2;
            const dy = point.y - point.controlY2;
            point.controlX1 = point.x + dx;
            point.controlY1 = point.y + dy;
          }
        }
      }
      
      // 更新形状
      setShapes(shapes.map(s => {
        if (s.id === currentShapeId) {
          return {
            ...s,
            bezierPoints: updatedPoints
          };
        }
        return s;
      }));
      
      // 更新当前路径
      setCurrentPath(updatedPoints);
      
      // 更新最后鼠标位置
      setLastMousePos({ x, y });
      return;
    }
    
    if (!isDrawing || !startPoint || !currentShapeId) return;
    
    // 计算潜在的对齐点和辅助线
    const newAlignmentGuides: AlignmentGuideProps[] = [];
    let snapToX: number | null = null;
    let snapToY: number | null = null;
    const snapThreshold = alignmentThreshold;
    
    // 检查与其他形状的对齐关系
    shapes.forEach(shape => {
      if (shape.id === currentShapeId) return; // 跳过当前正在绘制的形状
      
      if (shape.type === 'rectangle') {
        // 矩形的对齐点
        const shapeLeft = shape.x;
        const shapeRight = shape.x + (shape.width || 0);
        const shapeTop = shape.y;
        const shapeBottom = shape.y + (shape.height || 0);
        
        // 检查水平对齐
        if (Math.abs(x - shapeLeft) < snapThreshold) {
          // 左对齐
          newAlignmentGuides.push({
            points: [shapeLeft, 0, shapeLeft, height]
          });
          // 记录吸附位置
          snapToX = shapeLeft;
        }
        
        if (Math.abs(x - shapeRight) < snapThreshold) {
          // 右对齐
          newAlignmentGuides.push({
            points: [shapeRight, 0, shapeRight, height]
          });
          // 记录吸附位置
          snapToX = shapeRight;
        }
        
        // 检查垂直对齐
        if (Math.abs(y - shapeTop) < snapThreshold) {
          // 顶部对齐
          newAlignmentGuides.push({
            points: [0, shapeTop, width, shapeTop]
          });
          // 记录吸附位置
          snapToY = shapeTop;
        }
        
        if (Math.abs(y - shapeBottom) < snapThreshold) {
          // 底部对齐
          newAlignmentGuides.push({
            points: [0, shapeBottom, width, shapeBottom]
          });
          // 记录吸附位置
          snapToY = shapeBottom;
        }
      } else if (shape.type === 'line' && shape.points && shape.points.length >= 4) {
        // 线条的对齐点
        const startX = shape.points[0];
        const startY = shape.points[1];
        const endX = shape.points[2];
        const endY = shape.points[3];
        
        // 检查起点对齐
        if (Math.abs(x - startX) < snapThreshold) {
          newAlignmentGuides.push({
            points: [startX, 0, startX, height]
          });
          // 记录吸附位置
          snapToX = startX;
        }
        
        if (Math.abs(y - startY) < snapThreshold) {
          newAlignmentGuides.push({
            points: [0, startY, width, startY]
          });
          // 记录吸附位置
          snapToY = startY;
        }
        
        // 检查终点对齐
        if (Math.abs(x - endX) < snapThreshold) {
          newAlignmentGuides.push({
            points: [endX, 0, endX, height]
          });
          // 记录吸附位置
          snapToX = endX;
        }
        
        if (Math.abs(y - endY) < snapThreshold) {
          newAlignmentGuides.push({
            points: [0, endY, width, endY]
          });
          // 记录吸附位置
          snapToY = endY;
        }
      }
    });
    
    // 更新对齐辅助线
    setAlignmentGuides(newAlignmentGuides);
    
    // 吸附当前点
    const snappedX = snapToX !== null ? snapToX : x;
    const snappedY = snapToY !== null ? snapToY : y;
    
    // 临时保存辅助线数据
    const newGuidelines: GuidelineProps[] = [];
    
    // 更新形状，使用吸附后的坐标
    setShapes(shapes.map(shape => {
      if (shape.id !== currentShapeId) return shape;
      
      switch (shape.type) {
        case 'rectangle':
          // 计算矩形尺寸
          const width = Math.abs(x - startPoint.x);
          const height = Math.abs(y - startPoint.y);
          const rectX = Math.min(startPoint.x, x);
          const rectY = Math.min(startPoint.y, y);
          
          // 添加尺寸辅助线（单位换算为米）
          newGuidelines.push(
            {
              points: [rectX, rectY - 15, rectX + width, rectY - 15],
              text: `宽度: ${formatMeasurement(width)}`,
              textPosition: { x: rectX + width / 2, y: rectY - 40 }
            },
            {
              points: [rectX - 15, rectY, rectX - 15, rectY + height],
              text: `高度: ${formatMeasurement(height)}`,
              textPosition: { x: rectX - 10, y: rectY + height / 2 }
            }
          );
          
          return {
            ...shape,
            width,
            height,
            x: rectX,
            y: rectY,
          };
          
        case 'circle':
          const dx = x - startPoint.x;
          const dy = y - startPoint.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          
          // 添加半径辅助线（单位换算为米）
          newGuidelines.push(
            {
              points: [startPoint.x, startPoint.y, x, y],
              text: `半径: ${formatMeasurement(radius)}`,
              textPosition: { x: startPoint.x + dx / 2, y: startPoint.y + dy / 2 - 10 }
            }
          );
          
          return {
            ...shape,
            radius,
          };
          
        case 'line':
        case 'polygon':
          const ldx = snappedX - startPoint.x;
          const ldy = snappedY - startPoint.y;
          const length = Math.sqrt(ldx * ldx + ldy * ldy);
          const angle = Math.atan2(ldy, ldx) * 180 / Math.PI;
          
          // 计算偏移的辅助线位置
          // 计算偏移方向，使标注始终显示在图形外部
          const offset = 18; // 减小偏移距离，使标注线靠近实际线条
          const normalizedLength = Math.sqrt(ldx * ldx + ldy * ldy);
          
          // 如果线条长度过短，不计算偏移
          if (normalizedLength < 1) {
            return {
              ...shape,
              points: [startPoint.x, startPoint.y, snappedX, snappedY],
            };
          }
          
          // 计算单位向量的垂直方向
          const perpX = -ldy / normalizedLength;
          const perpY = ldx / normalizedLength;
          
          // 确定偏移方向，判断哪一侧是图形外部
          // 通过检查形状中心与线段的位置关系来判断
          // 首先计算当前已绘制形状的中心（如果有多个线段）
          let centerX = 0;
          let centerY = 0;
          let pointCount = 0;
          
          if (linePoints.length >= 4) {
            // 有现有的线段，计算点的平均中心
            for (let i = 0; i < linePoints.length; i += 2) {
              centerX += linePoints[i];
              centerY += linePoints[i + 1];
              pointCount++;
            }
            
            // 加上当前线段的起点
            centerX += startPoint.x;
            centerY += startPoint.y;
            pointCount++;
            
            if (pointCount > 0) {
              centerX /= pointCount;
              centerY /= pointCount;
            }
          } else {
            // 没有足够的点，使用当前起点作为参考
            centerX = startPoint.x;
            centerY = startPoint.y;
          }
          
          // 检查线段中点到中心的向量
          const midX = (startPoint.x + snappedX) / 2;
          const midY = (startPoint.y + snappedY) / 2;
          const toCenterX = centerX - midX;
          const toCenterY = centerY - midY;
          
          // 计算点积来判断方向
          const dotProduct = perpX * toCenterX + perpY * toCenterY;
          
          // 如果点积为负，意味着垂直向量指向形状外部，否则需要反转
          const direction = dotProduct < 0 ? 1 : -1;
          
          // 应用方向校正后的偏移
          const offsetStartX = startPoint.x + perpX * offset * direction;
          const offsetStartY = startPoint.y + perpY * offset * direction;
          const offsetEndX = snappedX + perpX * offset * direction;
          const offsetEndY = snappedY + perpY * offset * direction;
          
          // 为文本计算额外的偏移，将其放在标注线外侧
          const textOffset = 25; // 增加文本相对于标注线的额外偏移，从15增加到25
          const textPosX = offsetStartX + ldx / 2 + perpX * textOffset * direction;
          const textPosY = offsetStartY + ldy / 2 + perpY * textOffset * direction;
          
          // 添加长度和角度辅助线，使用偏移后的位置（单位换算为米）
          newGuidelines.push(
            {
              points: [offsetStartX, offsetStartY, offsetEndX, offsetEndY],
              text: `长度: ${formatMeasurement(length)}, 角度: ${Math.round(angle)}°`,
              textPosition: { 
                x: textPosX, 
                y: textPosY
              }
            }
          );
          
          return {
            ...shape,
            points: [startPoint.x, startPoint.y, snappedX, snappedY],
          };
          
        case 'brush':
        case 'path':
          return {
            ...shape,
            points: [...(shape.points || []), x, y],
          };
          
        default:
          return shape;
      }
    }));
    
    // 更新辅助线
    setGuidelines(newGuidelines);
  };

  // 修改handleMouseUp函数
  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isSpacePressed && mouseCaptured) {
      document.body.style.cursor = 'grab';
      setMouseCaptured(false);
      return;
    }
    
    setMouseCaptured(false);
    
    if (!isDrawing || !startPoint || !currentShapeId) return;
    
    const stage = e.target.getStage();
    const pointerPos = getStagePointerPosition(stage);
    if (!pointerPos) return;
    
    const { x, y } = pointerPos;
    
    // 计算潜在的对齐点和辅助线
    const newAlignmentGuides: AlignmentGuideProps[] = [];
    let snapToX: number | null = null;
    let snapToY: number | null = null;
    const snapThreshold = alignmentThreshold; // 使用相同的阈值
    
    // 检查与其他形状的对齐关系
    shapes.forEach(shape => {
      if (shape.id === currentShapeId) return; // 跳过当前正在绘制的形状
      
      if (shape.type === 'rectangle') {
        // 矩形的对齐点
        const shapeLeft = shape.x;
        const shapeRight = shape.x + (shape.width || 0);
        const shapeTop = shape.y;
        const shapeBottom = shape.y + (shape.height || 0);
        
        // 检查水平对齐
        if (Math.abs(x - shapeLeft) < snapThreshold) {
          // 左对齐
          newAlignmentGuides.push({
            points: [shapeLeft, 0, shapeLeft, height]
          });
          // 记录吸附位置
          snapToX = shapeLeft;
        }
        
        if (Math.abs(x - shapeRight) < snapThreshold) {
          // 右对齐
          newAlignmentGuides.push({
            points: [shapeRight, 0, shapeRight, height]
          });
          // 记录吸附位置
          snapToX = shapeRight;
        }
        
        // 检查垂直对齐
        if (Math.abs(y - shapeTop) < snapThreshold) {
          // 顶部对齐
          newAlignmentGuides.push({
            points: [0, shapeTop, width, shapeTop]
          });
          // 记录吸附位置
          snapToY = shapeTop;
        }
        
        if (Math.abs(y - shapeBottom) < snapThreshold) {
          // 底部对齐
          newAlignmentGuides.push({
            points: [0, shapeBottom, width, shapeBottom]
          });
          // 记录吸附位置
          snapToY = shapeBottom;
        }
      } else if (shape.type === 'line' && shape.points && shape.points.length >= 4) {
        // 线条的对齐点
        const startX = shape.points[0];
        const startY = shape.points[1];
        const endX = shape.points[2];
        const endY = shape.points[3];
        
        // 检查起点对齐
        if (Math.abs(x - startX) < snapThreshold) {
          newAlignmentGuides.push({
            points: [startX, 0, startX, height]
          });
          // 记录吸附位置
          snapToX = startX;
        }
        
        if (Math.abs(y - startY) < snapThreshold) {
          newAlignmentGuides.push({
            points: [0, startY, width, startY]
          });
          // 记录吸附位置
          snapToY = startY;
        }
        
        // 检查终点对齐
        if (Math.abs(x - endX) < snapThreshold) {
          newAlignmentGuides.push({
            points: [endX, 0, endX, height]
          });
          // 记录吸附位置
          snapToX = endX;
        }
        
        if (Math.abs(y - endY) < snapThreshold) {
          newAlignmentGuides.push({
            points: [0, endY, width, endY]
          });
          // 记录吸附位置
          snapToY = endY;
        }
      }
    });
    
    // 更新对齐辅助线
    setAlignmentGuides(newAlignmentGuides);
    
    // 吸附当前点
    const snappedX = snapToX !== null ? snapToX : x;
    const snappedY = snapToY !== null ? snapToY : y;
    
    // 临时保存辅助线数据
    const newGuidelines: GuidelineProps[] = [];
    
    // 更新形状，使用吸附后的坐标
    setShapes(shapes.map(shape => {
      if (shape.id !== currentShapeId) return shape;
      
      switch (shape.type) {
        case 'rectangle':
          // 计算矩形尺寸
          const width = Math.abs(x - startPoint.x);
          const height = Math.abs(y - startPoint.y);
          const rectX = Math.min(startPoint.x, x);
          const rectY = Math.min(startPoint.y, y);
          
          // 添加尺寸辅助线（单位换算为米）
          newGuidelines.push(
            {
              points: [rectX, rectY - 15, rectX + width, rectY - 15],
              text: `宽度: ${formatMeasurement(width)}`,
              textPosition: { x: rectX + width / 2, y: rectY - 40 }
            },
            {
              points: [rectX - 15, rectY, rectX - 15, rectY + height],
              text: `高度: ${formatMeasurement(height)}`,
              textPosition: { x: rectX - 10, y: rectY + height / 2 }
            }
          );
          
          return {
            ...shape,
            width,
            height,
            x: rectX,
            y: rectY,
          };
          
        case 'circle':
          const dx = x - startPoint.x;
          const dy = y - startPoint.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          
          // 添加半径辅助线（单位换算为米）
          newGuidelines.push(
            {
              points: [startPoint.x, startPoint.y, x, y],
              text: `半径: ${formatMeasurement(radius)}`,
              textPosition: { x: startPoint.x + dx / 2, y: startPoint.y + dy / 2 - 10 }
            }
          );
          
          return {
            ...shape,
            radius,
          };
          
        case 'line':
        case 'polygon':
          const ldx = snappedX - startPoint.x;
          const ldy = snappedY - startPoint.y;
          const length = Math.sqrt(ldx * ldx + ldy * ldy);
          const angle = Math.atan2(ldy, ldx) * 180 / Math.PI;
          
          // 计算偏移的辅助线位置
          // 计算偏移方向，使标注始终显示在图形外部
          const offset = 18; // 减小偏移距离，使标注线靠近实际线条
          const normalizedLength = Math.sqrt(ldx * ldx + ldy * ldy);
          
          // 如果线条长度过短，不计算偏移
          if (normalizedLength < 1) {
            return {
              ...shape,
              points: [startPoint.x, startPoint.y, snappedX, snappedY],
            };
          }
          
          // 计算单位向量的垂直方向
          const perpX = -ldy / normalizedLength;
          const perpY = ldx / normalizedLength;
          
          // 确定偏移方向，判断哪一侧是图形外部
          // 通过检查形状中心与线段的位置关系来判断
          // 首先计算当前已绘制形状的中心（如果有多个线段）
          let centerX = 0;
          let centerY = 0;
          let pointCount = 0;
          
          if (linePoints.length >= 4) {
            // 有现有的线段，计算点的平均中心
            for (let i = 0; i < linePoints.length; i += 2) {
              centerX += linePoints[i];
              centerY += linePoints[i + 1];
              pointCount++;
            }
            
            // 加上当前线段的起点
            centerX += startPoint.x;
            centerY += startPoint.y;
            pointCount++;
            
            if (pointCount > 0) {
              centerX /= pointCount;
              centerY /= pointCount;
            }
          } else {
            // 没有足够的点，使用当前起点作为参考
            centerX = startPoint.x;
            centerY = startPoint.y;
          }
          
          // 检查线段中点到中心的向量
          const midX = (startPoint.x + snappedX) / 2;
          const midY = (startPoint.y + snappedY) / 2;
          const toCenterX = centerX - midX;
          const toCenterY = centerY - midY;
          
          // 计算点积来判断方向
          const dotProduct = perpX * toCenterX + perpY * toCenterY;
          
          // 如果点积为负，意味着垂直向量指向形状外部，否则需要反转
          const direction = dotProduct < 0 ? 1 : -1;
          
          // 应用方向校正后的偏移
          const offsetStartX = startPoint.x + perpX * offset * direction;
          const offsetStartY = startPoint.y + perpY * offset * direction;
          const offsetEndX = snappedX + perpX * offset * direction;
          const offsetEndY = snappedY + perpY * offset * direction;
          
          // 为文本计算额外的偏移，将其放在标注线外侧
          const textOffset = 25; // 增加文本相对于标注线的额外偏移，从15增加到25
          const textPosX = offsetStartX + ldx / 2 + perpX * textOffset * direction;
          const textPosY = offsetStartY + ldy / 2 + perpY * textOffset * direction;
          
          // 添加长度和角度辅助线，使用偏移后的位置（单位换算为米）
          newGuidelines.push(
            {
              points: [offsetStartX, offsetStartY, offsetEndX, offsetEndY],
              text: `长度: ${formatMeasurement(length)}, 角度: ${Math.round(angle)}°`,
              textPosition: { 
                x: textPosX, 
                y: textPosY
              }
            }
          );
          
          return {
            ...shape,
            points: [startPoint.x, startPoint.y, snappedX, snappedY],
          };
        case 'brush':
        case 'path':
          const finalPoints = [...(shape.points || []), x, y];
          // 对于path路径，我们可以应用简化算法，减少点的数量
          if (finalPoints.length > 10) {
            // 简化算法可以在此实现，或者使用第三方库
            // 这里只是一个简单的示例，实际中可能需要更复杂的简化算法
            const simplifiedPoints = simplifyPoints(finalPoints, 1);
            return {
              ...shape,
              points: simplifiedPoints,
            };
          }
          return {
            ...shape,
            points: finalPoints,
          };
          
        default:
          return shape;
      }
    }));
    
    // 更新辅助线
    setGuidelines(newGuidelines);
    
    // 清除对齐辅助线
    setAlignmentGuides([]);
    
    if (!isDrawing || !currentShapeId) return;
    
    // 获取当前正在绘制的形状
    const currentShape = shapes.find(s => s.id === currentShapeId);
    
    // 将刚绘制的图形设为可拖动
    setShapes(shapes.map(shape => {
      if (shape.id === currentShapeId) {
        return {
          ...shape,
          draggable: true,
        };
      }
      return shape;
    }));
    
    // 如果创建的是特别小的形状（可能是意外点击），则删除它
    if (activeTool === 'rectangle' || activeTool === 'circle') {
      const shape = shapes.find(s => s.id === currentShapeId);
      if (
        shape && 
        ((shape.type === 'rectangle' && (shape.width || 0) < 5 && (shape.height || 0) < 5) || 
         (shape.type === 'circle' && (shape.radius || 0) < 5))
      ) {
        setShapes(shapes.filter(s => s.id !== currentShapeId));
        setGuidelines([]);
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentShapeId(null);
        return;
      }
    }
    
    // 多边形连续绘制逻辑
    if (activeTool === 'polygon' && currentShape && currentShape.points) {
      // 获取线条的终点 - 使用实际点而非鼠标位置
      const lineEndX = currentShape.points[2]; // 这里已经是吸附后的点
      const lineEndY = currentShape.points[3];
      
      // 检查是否与起始点接近以形成闭合图形
      const closeDistance = 15; // 设置一个合理的接近阈值
      
      // 连续绘制的第一个点
      if (continuousDrawing && linePoints.length >= 2) {
        const firstX = linePoints[0];
        const firstY = linePoints[1];
        
        // 计算当前点与起始点之间的距离
        const dx = lineEndX - firstX;
        const dy = lineEndY - firstY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离小于阈值，视为闭合图形
        if (distance < closeDistance) {
          console.log('Detected closed shape, auto-closing');
          
          // 修改当前线段终点为精确的起始点位置，确保完美闭合
          const updatedCurrentShape = {
            ...currentShape,
            points: [currentShape.points[0], currentShape.points[1], firstX, firstY]
          };
          
          // 更新当前线段
          setShapes(prevShapes => 
            prevShapes.map(s => s.id === currentShapeId ? updatedCurrentShape : s)
          );
          
          // 将临时辅助线转换为永久标注
          const permanentAnnotations = guidelines.map(guide => ({
            ...guide,
            shapeId: currentShapeId
          }));
          
          // 添加到永久性标注列表
          setAnnotations([...annotations, ...permanentAnnotations]);
          
          // 清除临时辅助线
          setGuidelines([]);
          
          // 退出连续绘制模式
          setContinuousDrawing(false);
          setLinePoints([]);
          setIsDrawing(false);
          setCurrentShapeId(null);
          
          return;
        }
      }
      
      // 更新连续绘制的点列表
      setLinePoints([...linePoints, lineEndX, lineEndY]);
      
      // 添加到线段集合
      setLineSegments([...lineSegments, {...currentShape, draggable: true}]);
      
      // 在转折点添加节点，确保线条连接处无缝衔接
      // 只有在有前一个点的情况下才添加节点
      if (linePoints.length >= 2) {
        const jointId = generateId();
        const newJoint: JointProps = {
          id: jointId,
          x: lineEndX,
          y: lineEndY,
          radius: strokeWidth * 0.4, // 调整为线条宽度的0.4倍，使视觉上更协调
          fill: strokeColor,
          stroke: strokeColor
        };
        
        setJoints(prevJoints => [...prevJoints, newJoint]);
      }
      
      // 启动连续绘制模式
      setContinuousDrawing(true);
      
      // 将临时辅助线转换为永久标注
      const permanentAnnotations = guidelines.map(guide => ({
        ...guide,
        shapeId: currentShapeId
      }));
      
      // 添加到永久性标注列表
      setAnnotations([...annotations, ...permanentAnnotations]);
      
      // 清除临时辅助线
      setGuidelines([]);
      
      // 如果是连续绘制模式，则暂不重置绘制状态，而是准备绘制下一条线
      setIsDrawing(false);
      setCurrentShapeId(null);
      
      // 自动开始绘制下一条线
      setTimeout(() => {
        // 创建新的线条形状
        const newId = generateId();
        const newLine: ShapeProps = {
          id: newId,
          type: 'line',
          x: 0,
          y: 0,
          points: [lineEndX, lineEndY, lineEndX, lineEndY], // 从上一条线的终点开始
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          fill: 'transparent',
          draggable: true,
        };
        
        setShapes([...shapes, newLine]);
        setCurrentShapeId(newId);
        setStartPoint({ x: lineEndX, y: lineEndY });
        setIsDrawing(true);
      }, 0);
      
      return; // 不执行后续代码
    } else if (activeTool === 'line') {
      // 直线工具处理 - 单线段，完成后直接结束
      // 将临时辅助线转换为永久标注
      const permanentAnnotations = guidelines.map(guide => ({
        ...guide,
        shapeId: currentShapeId
      }));
      
      // 添加到永久性标注列表
      setAnnotations([...annotations, ...permanentAnnotations]);
      
      // 清除临时辅助线
      setGuidelines([]);
      
      // 重置绘制状态
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentShapeId(null);
      return;
    }
    
    // 将临时辅助线转换为永久标注
    const permanentAnnotations = guidelines.map(guide => ({
      ...guide,
      shapeId: currentShapeId
    }));
    
    // 添加到永久性标注列表
    setAnnotations([...annotations, ...permanentAnnotations]);
    
    console.log('Drawing completed:', {
      type: activeTool,
      shape: shapes.find(s => s.id === currentShapeId),
      strokeColor,
      fillColor,
      hasFill,
      strokeWidth,
      annotations: permanentAnnotations
    });
    
    // 清除临时辅助线
    setGuidelines([]);
    
    // 重置绘制状态
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentShapeId(null);
    
    // 在完成绘制后记录历史
    if (activeTool && ['line', 'rectangle', 'circle', 'path', 'brush', 'polygon'].includes(activeTool)) {
      const toolNames: Record<string, string> = {
        'line': '直线',
        'rectangle': '矩形',
        'circle': '圆形',
        'path': '路径',
        'brush': '画笔',
        'polygon': '多边形'
      };
      
      if (activeTool === 'polygon' && continuousDrawing) {
        // 多边形连续绘制中，暂不记录历史
        return;
      }
      
      recordHistory(`绘制${toolNames[activeTool]} #${currentShapeId}`);
    }
  };

  // 选中形状
  const handleSelect = (id: string) => {
    setSelectedId(id);
  };
  
  // 计算网格尺寸，根据缩放调整网格大小
  const gridSize = Math.max(5, Math.floor(10 * (zoom / 100)));
  
  // 缩放系数
  const scale = zoom / 100;

  // 当形状移动时更新其关联的标注位置
  const handleShapeDragEnd = (id: string, newX: number, newY: number) => {
    // 找到被拖动的形状
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    // 计算移动的差距
    const deltaX = newX - shape.x;
    const deltaY = newY - shape.y;
    
    // 更新形状位置
    const updatedShapes = shapes.map(s => {
      if (s.id === id) {
        const updatedShape = { ...s, x: newX, y: newY };
        
        // 如果是线条形状，需要更新points数组
        if (s.type === 'line' && s.points && s.points.length >= 4) {
          const newPoints = [...s.points];
          for (let i = 0; i < newPoints.length; i += 2) {
            newPoints[i] += deltaX;
            newPoints[i + 1] += deltaY;
          }
          updatedShape.points = newPoints;
        }
        
        return updatedShape;
      }
      return s;
    });
    
    setShapes(updatedShapes);
    
    // 同时更新关联的标注位置
    setAnnotations(annotations.map(anno => {
      if (anno.shapeId !== id) return anno;
      
      return {
        ...anno,
        points: anno.points.map((val, index) => {
          // 偶数索引为X坐标，奇数索引为Y坐标
          return index % 2 === 0 ? val + deltaX : val + deltaY;
        }),
        textPosition: anno.textPosition 
          ? { 
              x: anno.textPosition.x + deltaX, 
              y: anno.textPosition.y + deltaY 
            } 
          : undefined
      };
    }));
    
    // 记录到历史
    recordHistory(`移动图形 #${id}`);
  };

  // 添加选中控制点的样式和类型
  const handleSize = 7;  // 略微减小控制点大小

  // 控制点枚举类型
  enum HandleType {
    CORNER = 'corner',
    EDGE = 'edge',
    RESIZE = 'resize'
  }

  // 渲染形状
  const renderShapes = () => {
    return shapes.map(shape => {
      const isSelected = shape.id === selectedId;
      // 分离key和其他属性
      const { id } = shape;
      const shapeProps = {
        onClick: () => handleSelect(id),
        onTap: () => handleSelect(id),
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth,
        fill: shape.fill,
        draggable: activeTool === 'select' ? true : shape.draggable,
        // 选中状态的样式
        strokeScaleEnabled: false,
        strokeEnabled: true,
        shadowColor: isSelected ? '#1890ff' : 'transparent', // 使用蓝色高亮
        shadowBlur: isSelected ? 12 : 0,  // 增加阴影模糊半径
        shadowOpacity: isSelected ? 0.7 : 0, // 增加阴影不透明度
        shadowOffset: { x: 0, y: 0 },
      };
      
      // 渲染单个控制点
      const renderHandle = (x: number, y: number, type: HandleType = HandleType.CORNER, index: number) => {
        // 根据控制点类型决定样式
        let fill = 'white';
        let stroke = '#1890ff';
        const strokeWidth = 1.5;
        let cursor = 'pointer';
        
        if (type === HandleType.CORNER) {
          // 角落控制点
          fill = 'white';
          cursor = 'nwse-resize'; // 适合对角线缩放的光标
        } else if (type === HandleType.EDGE) {
          // 边缘控制点
          fill = '#e6f7ff';
          cursor = index % 2 === 0 ? 'ns-resize' : 'ew-resize'; // 水平或垂直缩放的光标
        } else if (type === HandleType.RESIZE) {
          // 缩放控制点
          fill = '#1890ff';
          stroke = 'white';
          cursor = 'nesw-resize';
        }
        
        return (
          <Circle
            key={`handle-${id}-${index}`}
            x={x}
            y={y}
            radius={handleSize / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            perfectDrawEnabled={false}
            shadowColor={'rgba(0,0,0,0.3)'}
            shadowBlur={2}
            shadowOffset={{x: 1, y: 1}}
            shadowOpacity={0.5}
            listening={true} // 使控制点可交互
            draggable={true} // 使控制点可拖动
            cursor={cursor}  // 设置适当的光标样式
            onDragStart={(e) => {
              // 记录拖动开始时的位置和形状
              const node = e.target;
              const shape = shapes.find(s => s.id === id);
              if (!shape) return;
              
              setActiveHandle({
                id,
                handleIndex: index,
                type,
                initialPosition: {x: node.x(), y: node.y()},
                initialShape: {...shape}
              });
              
              // 阻止事件冒泡，避免触发整个形状的拖动
              e.cancelBubble = true;
            }}
            onDragMove={(e) => {
              if (!activeHandle || activeHandle.id !== id) return;
              
              const node = e.target;
              const currentPos = {x: node.x(), y: node.y()};
              const initialPos = activeHandle.initialPosition;
              const deltaX = currentPos.x - initialPos.x;
              const deltaY = currentPos.y - initialPos.y;
              
              const shape = shapes.find(s => s.id === id);
              if (!shape) return;
              
              // 根据控制点类型和索引进行不同的调整
              if (shape.type === 'rectangle' && shape.width !== undefined && shape.height !== undefined) {
                let newX = shape.x;
                let newY = shape.y;
                let newWidth = shape.width;
                let newHeight = shape.height;
                
                if (type === HandleType.CORNER) {
                  // 角落控制点 - 调整大小和位置
                  switch (index) {
                    case 0: // 左上
                      newX += deltaX;
                      newY += deltaY;
                      newWidth -= deltaX;
                      newHeight -= deltaY;
                      break;
                    case 1: // 右上
                      newY += deltaY;
                      newWidth += deltaX;
                      newHeight -= deltaY;
                      break;
                    case 2: // 左下
                      newX += deltaX;
                      newWidth -= deltaX;
                      newHeight += deltaY;
                      break;
                    case 3: // 右下
                      newWidth += deltaX;
                      newHeight += deltaY;
                      break;
                  }
                } else if (type === HandleType.EDGE) {
                  // 边缘控制点 - 只调整一个方向
                  switch (index) {
                    case 4: // 上中
                      newY += deltaY;
                      newHeight -= deltaY;
                      break;
                    case 5: // 右中
                      newWidth += deltaX;
                      break;
                    case 6: // 下中
                      newHeight += deltaY;
                      break;
                    case 7: // 左中
                      newX += deltaX;
                      newWidth -= deltaX;
                      break;
                  }
                }
                
                // 确保宽高不为负
                if (newWidth > 5 && newHeight > 5) {
                  // 更新形状
                  setShapes(shapes.map(s => {
                    if (s.id === id) {
                      return {
                        ...s,
                        x: newX,
                        y: newY,
                        width: newWidth,
                        height: newHeight
                      };
                    }
                    return s;
                  }));
                  
                  // 同步更新关联的标注
                  updateAnnotations(id, newX - shape.x, newY - shape.y);
                }
              } else if (shape.type === 'circle' && shape.radius !== undefined) {
                // 圆形的调整
                let newRadius = shape.radius;
                
                if (type === HandleType.RESIZE) {
                  // 计算从圆心到新位置的距离作为半径
                  const dx = currentPos.x - shape.x;
                  const dy = currentPos.y - shape.y;
                  newRadius = Math.sqrt(dx * dx + dy * dy);
                  
                  // 确保半径不小于最小值
                  if (newRadius > 5) {
                    setShapes(shapes.map(s => {
                      if (s.id === id) {
                        return {
                          ...s,
                          radius: newRadius
                        };
                      }
                      return s;
                    }));
                    
                    // 同步更新关联的标注
                    updateAnnotations(id, 0, 0, newRadius / shape.radius);
                  }
                }
              } else if (shape.type === 'line' && shape.points && shape.points.length >= 4) {
                // 线条的调整
                const newPoints = [...shape.points];
                
                if (index === 0) {
                  // 起点
                  newPoints[0] = currentPos.x;
                  newPoints[1] = currentPos.y;
                } else if (index === 1) {
                  // 终点
                  newPoints[2] = currentPos.x;
                  newPoints[3] = currentPos.y;
                }
                
                setShapes(shapes.map(s => {
                  if (s.id === id) {
                    return {
                      ...s,
                      points: newPoints
                    };
                  }
                  return s;
                }));
                
                // 同步更新关联的标注
                updateAnnotations(id, 0, 0, 1, newPoints);
              } else if (shape.type === 'bezier' && shape.bezierPoints) {
                // 贝塞尔曲线的控制点调整
                const pointIndex = Math.floor(index / 3);
                const handleType = index % 3;
                
                if (pointIndex < shape.bezierPoints.length) {
                  const updatedPoints = [...shape.bezierPoints];
                  const point = updatedPoints[pointIndex];
                  
                  if (handleType === 0) {
                    // 主锚点
                    point.x = currentPos.x;
                    point.y = currentPos.y;
                    
                    // 同时移动控制点，保持相对位置
                    if (point.controlX1 !== undefined && point.controlY1 !== undefined) {
                      const dx = point.controlX1 - initialPos.x;
                      const dy = point.controlY1 - initialPos.y;
                      point.controlX1 = currentPos.x + dx;
                      point.controlY1 = currentPos.y + dy;
                    }
                    
                    if (point.controlX2 !== undefined && point.controlY2 !== undefined) {
                      const dx = point.controlX2 - initialPos.x;
                      const dy = point.controlY2 - initialPos.y;
                      point.controlX2 = currentPos.x + dx;
                      point.controlY2 = currentPos.y + dy;
                    }
                  } else if (handleType === 1 && point.controlX1 !== undefined) {
                    // 控制点1
                    point.controlX1 = currentPos.x;
                    point.controlY1 = currentPos.y;
                    
                    // 对称更新另一侧的控制点
                    if (point.controlX2 !== undefined && point.controlY2 !== undefined) {
                      const dx = point.x - point.controlX1;
                      const dy = point.y - point.controlY1;
                      point.controlX2 = point.x + dx;
                      point.controlY2 = point.y + dy;
                    }
                  } else if (handleType === 2 && point.controlX2 !== undefined) {
                    // 控制点2
                    point.controlX2 = currentPos.x;
                    point.controlY2 = currentPos.y;
                    
                    // 对称更新另一侧的控制点
                    if (point.controlX1 !== undefined && point.controlY1 !== undefined) {
                      const dx = point.x - point.controlX2;
                      const dy = point.y - point.controlY2;
                      point.controlX1 = point.x + dx;
                      point.controlY1 = point.y + dy;
                    }
                  }
                  
                  setShapes(shapes.map(s => {
                    if (s.id === id) {
                      return {
                        ...s,
                        bezierPoints: updatedPoints
                      };
                    }
                    return s;
                  }));
                  
                  setCurrentPath(updatedPoints);
                }
              }
              
              // 阻止事件冒泡
              e.cancelBubble = true;
            }}
            onDragEnd={(e) => {
              // 重置控制点到其正常位置
              e.target.position({x: x, y: y});
              setActiveHandle(null);
              
              // 记录历史
              recordHistory(`调整形状 #${id}`);
              
              // 阻止事件冒泡
              e.cancelBubble = true;
            }}
          />
        );
      };
      
      // 渲染选中形状的辅助控制点和选中框
      const renderSelectionHandles = () => {
        if (!isSelected) return null;
        
        // 根据形状类型计算控制点位置
        if (shape.type === 'rectangle' && shape.width && shape.height) {
          // 矩形的选中边框
          const padding = 5; // 选中框与形状的间距
          const x = shape.x - padding;
          const y = shape.y - padding;
          const width = shape.width + padding * 2;
          const height = shape.height + padding * 2;
          
          // 控制点位置 - 四角和中点
          return (
            <>
              {/* 选中矩形边框 */}
              <Rect
                x={x}
                y={y}
                width={width}
                height={height}
                stroke="#1890ff"
                strokeWidth={1.5}
                dash={[4, 4]}
                perfectDrawEnabled={false}
                listening={false}
              />
              
              {/* 控制点 - 角落 */}
              {renderHandle(x, y, HandleType.CORNER, 0)} 
              {renderHandle(x + width, y, HandleType.CORNER, 1)}
              {renderHandle(x, y + height, HandleType.CORNER, 2)}
              {renderHandle(x + width, y + height, HandleType.CORNER, 3)}
              
              {/* 控制点 - 边缘 */}
              {renderHandle(x + width / 2, y, HandleType.EDGE, 4)}
              {renderHandle(x + width, y + height / 2, HandleType.EDGE, 5)}
              {renderHandle(x + width / 2, y + height, HandleType.EDGE, 6)}
              {renderHandle(x, y + height / 2, HandleType.EDGE, 7)}
            </>
          );
        } else if (shape.type === 'circle' && shape.radius) {
          // 圆形的选中边框
          const padding = 5;
          const outerRadius = shape.radius + padding;
          
          // 圆形的控制点位置
          return (
            <>
              {/* 选中圆形边框 */}
              <Circle
                x={shape.x}
                y={shape.y}
                radius={outerRadius}
                stroke="#1890ff"
                strokeWidth={1.5}
                dash={[4, 4]}
                perfectDrawEnabled={false}
                listening={false}
              />
              
              {/* 控制点 - 上下左右四个方向 */}
              {renderHandle(shape.x, shape.y - outerRadius, HandleType.RESIZE, 0)}
              {renderHandle(shape.x + outerRadius, shape.y, HandleType.RESIZE, 1)}
              {renderHandle(shape.x, shape.y + outerRadius, HandleType.RESIZE, 2)}
              {renderHandle(shape.x - outerRadius, shape.y, HandleType.RESIZE, 3)}
            </>
          );
        } else if (shape.type === 'line' && shape.points && shape.points.length >= 4) {
          // 线条的选中边框和控制点
          const points = shape.points;
          const startX = points[0];
          const startY = points[1];
          const endX = points[2];
          const endY = points[3];
          
          return (
            <>
              {/* 线条虚线边框 */}
              <Line
                points={points}
                stroke="#1890ff"
                strokeWidth={2}
                dash={[4, 4]}
                perfectDrawEnabled={false}
                listening={false}
              />
              
              {/* 控制点 - 起点和终点 */}
              {renderHandle(startX, startY, HandleType.CORNER, 0)}
              {renderHandle(endX, endY, HandleType.CORNER, 1)}
            </>
          );
        } else if (shape.type === 'bezier' && shape.bezierPoints) {
          // 贝塞尔曲线的控制点和路径
          const bezierPoints = shape.bezierPoints;
          
          // 创建控制线和控制点的数组
          const controlLines: Array<React.ReactElement> = [];
          const controlHandles: Array<React.ReactElement> = [];
          
          bezierPoints.forEach((point, i) => {
            // 为每个点添加锚点控制柄
            controlHandles.push(
              renderHandle(point.x, point.y, HandleType.CORNER, i * 3)
            );
            
            // 添加控制点及其连线
            if (point.controlX1 !== undefined && point.controlY1 !== undefined) {
              // 控制点1
              controlHandles.push(
                renderHandle(point.controlX1, point.controlY1, HandleType.RESIZE, i * 3 + 1)
              );
              
              // 控制线1
              controlLines.push(
                <Line
                  key={`control-line-1-${id}-${i}`}
                  points={[point.x, point.y, point.controlX1, point.controlY1]}
                  stroke="#1890ff"
                  strokeWidth={1}
                  dash={[2, 2]}
                  listening={false}
                />
              );
            }
            
            if (point.controlX2 !== undefined && point.controlY2 !== undefined) {
              // 控制点2
              controlHandles.push(
                renderHandle(point.controlX2, point.controlY2, HandleType.RESIZE, i * 3 + 2)
              );
              
              // 控制线2
              controlLines.push(
                <Line
                  key={`control-line-2-${id}-${i}`}
                  points={[point.x, point.y, point.controlX2, point.controlY2]}
                  stroke="#1890ff"
                  strokeWidth={1}
                  dash={[2, 2]}
                  listening={false}
                />
              );
            }
          });
          
          return (
            <>
              {/* 路径虚线边框 */}
              <Path
                stroke="#1890ff"
                strokeWidth={2}
                dash={[4, 4]}
                perfectDrawEnabled={false}
                listening={false}
                data={generateBezierPathData(bezierPoints)}
              />
              
              {/* 控制线 */}
              {controlLines}
              
              {/* 控制点 */}
              {controlHandles}
            </>
          );
        }
        
        return null;
      };
      
      // 渲染形状和选中控制点
      switch (shape.type) {
        case 'rectangle':
          return (
            <React.Fragment key={id}>
              <Rect
                {...shapeProps}
                x={shape.x}
                y={shape.y}
                width={shape.width || 0}
                height={shape.height || 0}
                onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                  const newX = e.target.x();
                  const newY = e.target.y();
                  handleShapeDragEnd(id, newX, newY);
                }}
              />
              {renderSelectionHandles()}
            </React.Fragment>
          );
          
        case 'circle':
          return (
            <React.Fragment key={id}>
              <Circle
                {...shapeProps}
                x={shape.x}
                y={shape.y}
                radius={shape.radius || 0}
                onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                  const newX = e.target.x();
                  const newY = e.target.y();
                  handleShapeDragEnd(id, newX, newY);
                }}
              />
              {renderSelectionHandles()}
            </React.Fragment>
          );
          
        case 'line':
          // 对于线条，使用完全不同的拖动策略
          return (
            <React.Fragment key={id}>
              <Line
                {...shapeProps}
                points={shape.points || []}
                x={0}
                y={0}
                lineCap="round"
                lineJoin="round"
                onDragStart={(e) => {
                  const node = e.target;
                  // 记录拖动起始位置
                  setDragOrigin({
                    id,
                    points: shape.points ? [...shape.points] : null,
                    x: node.x(),
                    y: node.y()
                  });
                }}
                onDragEnd={(e) => {
                  // 只有在有拖动起始记录时才处理
                  if (dragOrigin && dragOrigin.id === id && dragOrigin.points) {
                    const node = e.target;
                    
                    // 计算总移动距离
                    const dx = node.x() - dragOrigin.x;
                    const dy = node.y() - dragOrigin.y;
                    
                    // 移动所有点
                    const newPoints = [...dragOrigin.points];
                    for (let i = 0; i < newPoints.length; i += 2) {
                      newPoints[i] += dx;
                      newPoints[i + 1] += dy;
                    }
                    
                    // 更新形状点
                    setShapes(shapes.map(s => 
                      s.id === id ? { ...s, points: newPoints } : s
                    ));
                    
                    // 更新相关标注
                    setAnnotations(annotations.map(anno => {
                      if (anno.shapeId !== id) return anno;
                      
                      return {
                        ...anno,
                        points: anno.points.map((val, index) => 
                          index % 2 === 0 ? val + dx : val + dy
                        ),
                        textPosition: anno.textPosition 
                          ? { 
                              x: anno.textPosition.x + dx, 
                              y: anno.textPosition.y + dy 
                            } 
                          : undefined
                      };
                    }));
                  }
                  
                  // 重置拖动状态
                  setDragOrigin(null);
                  // 将线条重置回原点
                  e.target.position({ x: 0, y: 0 });
                }}
              />
              {renderSelectionHandles()}
            </React.Fragment>
          );
          
        case 'path':
          return (
            <React.Fragment key={id}>
              <Line
                {...shapeProps}
                points={shape.points || []}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                onDragStart={(e) => {
                  const node = e.target;
                  // 记录拖动起始位置
                  setDragOrigin({
                    id,
                    points: shape.points ? [...shape.points] : null,
                    x: node.x(),
                    y: node.y()
                  });
                }}
                onDragEnd={(e) => {
                  // 只有在有拖动起始记录时才处理
                  if (dragOrigin && dragOrigin.id === id && dragOrigin.points) {
                    const node = e.target;
                    
                    // 计算总移动距离
                    const dx = node.x() - dragOrigin.x;
                    const dy = node.y() - dragOrigin.y;
                    
                    // 移动所有点
                    const newPoints = [...dragOrigin.points];
                    for (let i = 0; i < newPoints.length; i += 2) {
                      newPoints[i] += dx;
                      newPoints[i + 1] += dy;
                    }
                    
                    // 更新形状点
                    setShapes(shapes.map(s => 
                      s.id === id ? { ...s, points: newPoints } : s
                    ));
                    
                    // 更新相关标注
                    setAnnotations(annotations.map(anno => {
                      if (anno.shapeId !== id) return anno;
                      
                      return {
                        ...anno,
                        points: anno.points.map((val, index) => 
                          index % 2 === 0 ? val + dx : val + dy
                        ),
                        textPosition: anno.textPosition 
                          ? { 
                              x: anno.textPosition.x + dx, 
                              y: anno.textPosition.y + dy 
                            } 
                          : undefined
                      };
                    }));
                  }
                  
                  // 重置拖动状态
                  setDragOrigin(null);
                  // 将路径重置回原点
                  e.target.position({ x: 0, y: 0 });
                }}
              />
              {renderSelectionHandles()}
            </React.Fragment>
          );
        
        case 'bezier':
          return (
            <React.Fragment key={id}>
              <Path
                {...shapeProps}
                data={generateBezierPathData(shape.bezierPoints || [])}
                onDragStart={(e) => {
                  const node = e.target;
                  // 记录拖动起始位置和点
                  setDragOrigin({
                    id,
                    points: null, // 不使用points
                    x: node.x(),
                    y: node.y()
                  });
                }}
                onDragEnd={(e) => {
                  if (dragOrigin && dragOrigin.id === id) {
                    const node = e.target;
                    
                    // 计算总移动距离
                    const dx = node.x() - dragOrigin.x;
                    const dy = node.y() - dragOrigin.y;
                    
                    // 移动所有贝塞尔点
                    if (shape.bezierPoints) {
                      const newBezierPoints = shape.bezierPoints.map(point => {
                        const newPoint = { ...point };
                        newPoint.x += dx;
                        newPoint.y += dy;
                        
                        if (newPoint.controlX1 !== undefined) {
                          newPoint.controlX1 += dx;
                        }
                        if (newPoint.controlY1 !== undefined) {
                          newPoint.controlY1 += dy;
                        }
                        if (newPoint.controlX2 !== undefined) {
                          newPoint.controlX2 += dx;
                        }
                        if (newPoint.controlY2 !== undefined) {
                          newPoint.controlY2 += dy;
                        }
                        
                        return newPoint;
                      });
                      
                      // 更新形状
                      setShapes(shapes.map(s => 
                        s.id === id ? { ...s, bezierPoints: newBezierPoints } : s
                      ));
                      
                      // 更新当前路径（如果在编辑模式）
                      if (isDrawing && currentShapeId === id) {
                        setCurrentPath(newBezierPoints);
                      }
                      
                      // 记录历史
                      recordHistory(`移动曲线路径 #${id}`);
                    }
                  }
                  
                  // 重置拖动状态
                  setDragOrigin(null);
                  // 将路径重置回原点
                  e.target.position({ x: 0, y: 0 });
                }}
              />
              {isSelected && renderSelectionHandles()}
            </React.Fragment>
          );
          
        case 'text':
          return (
            <React.Fragment key={id}>
              <Text
                {...shapeProps}
                id={id}
                x={shape.x}
                y={shape.y}
                text={shape.text || ''}
                fontSize={shape.fontSize || fontSize}
                fontFamily={shape.fontFamily || fontFamily}
                align={shape.textAlign || textAlign}
                fontStyle={shape.fontStyle || fontStyle}
                onDblClick={handleTextDblClick}
                onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                  const newX = e.target.x();
                  const newY = e.target.y();
                  handleShapeDragEnd(id, newX, newY);
                }}
              />
              {renderSelectionHandles()}
            </React.Fragment>
          );
          
        default:
          return null;
      }
    });
  };

  // 渲染辅助线
  const renderGuidelines = () => {
    return guidelines.map((guide, index) => {
      // 计算辅助线角度
      const points = guide.points;
      if (points.length >= 4) {
        const angle = Math.atan2(points[3] - points[1], points[2] - points[0]) * 180 / Math.PI;
        
        return (
          <React.Fragment key={`guide-${index}`}>
            <Line
              points={guide.points}
              stroke="#00A8FF"
              strokeWidth={1.5}
              dash={[5, 5]}
              opacity={0.9}
            />
            {guide.text && guide.textPosition && (
              <Text
                text={guide.text}
                x={guide.textPosition.x}
                y={guide.textPosition.y}
                fontSize={14}
                fontStyle="bold"
                fill="#00A8FF"
                align="center"
                rotation={angle}
                offsetX={0}
                offsetY={-5}
                padding={5}
                background="#ffffff"
                cornerRadius={3}
              />
            )}
          </React.Fragment>
        );
      }
      return null;
    }).filter(Boolean);
  };

  // 渲染永久性标注
  const renderAnnotations = () => {
    return annotations.map((anno, index) => {
      // 计算辅助线角度
      const points = anno.points;
      if (points.length >= 4) {
        const angle = Math.atan2(points[3] - points[1], points[2] - points[0]) * 180 / Math.PI;
        
        return (
          <React.Fragment key={`annotation-${index}`}>
            <Line
              points={anno.points}
              stroke="#00A8FF"
              strokeWidth={1.5}
              dash={[5, 5]}
              opacity={0.7}
            />
            {anno.text && anno.textPosition && (
              <Text
                text={anno.text}
                x={anno.textPosition.x}
                y={anno.textPosition.y}
                fontSize={13}
                fontStyle="bold"
                fill="#00A8FF"
                align="center"
                rotation={angle}
                offsetX={0}
                offsetY={-5}
                padding={5}
                background="#ffffff"
                cornerRadius={3}
              />
            )}
          </React.Fragment>
        );
      }
      return null;
    }).filter(Boolean);
  };

  // 添加渲染对齐辅助线的函数
  const renderAlignmentGuides = () => {
    return alignmentGuides.map((guide, index) => {
      // 解构guide.points来获取坐标
      const [x1, y1, x2, y2] = guide.points;
      
      // 如果是垂直线
      if (x1 === x2) {
        return (
          <Line
            key={`align-guide-${index}`}
            points={[x1, 0, x1, height]}
            stroke="#FF3030"
            strokeWidth={1}
            dash={[5, 5]}
            opacity={0.8}
          />
        );
      }
      // 如果是水平线
      else if (y1 === y2) {
        return (
          <Line
            key={`align-guide-${index}`}
            points={[0, y1, width, y1]}
            stroke="#FF3030"
            strokeWidth={1}
            dash={[5, 5]}
            opacity={0.8}
          />
        );
      }
      
      return (
        <Line
          key={`align-guide-${index}`}
          points={guide.points}
          stroke="#FF3030"
          strokeWidth={1}
          dash={[5, 5]}
          opacity={0.8}
        />
      );
    });
  };

  // 添加渲染节点函数
  const renderJoints = () => {
    return joints.map(joint => (
      <Circle
        key={joint.id}
        x={joint.x}
        y={joint.y}
        radius={joint.radius}
        fill={joint.fill}
        stroke={joint.stroke}
      />
    ));
  };

  // 双击事件处理 - 可以用于关闭图形
  const handleDblClick = () => {
    console.log('Double click detected');
    console.log('Continuous drawing:', continuousDrawing);
    console.log('Line points:', linePoints);
    
    if (continuousDrawing && linePoints.length >= 4) {
      console.log('Creating closing line');
      // 如果是连续绘制模式，且已有至少两个点（构成一条线）
      // 添加从最后一点到第一点的线，形成闭合图形
      const firstX = linePoints[0];
      const firstY = linePoints[1];
      const lastX = linePoints[linePoints.length - 2];
      const lastY = linePoints[linePoints.length - 1];
      
      console.log(`From (${lastX}, ${lastY}) to (${firstX}, ${firstY})`);
      
      // 添加闭合线段
      const id = generateId();
      const closingLine: ShapeProps = {
        id,
        type: 'line',
        x: 0,
        y: 0,
        points: [lastX, lastY, firstX, firstY],
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        fill: hasFill ? fillColor : 'transparent',
        draggable: true,
      };
      
      // 更新shapes状态，确保添加闭合线段
      setShapes(prevShapes => [...prevShapes, closingLine]);
      
      // 添加闭合点的节点
      const jointId = generateId();
      const closingJoint: JointProps = {
        id: jointId,
        x: firstX,
        y: firstY,
        radius: strokeWidth * 0.4, // 从线条宽度的一半调整为0.4倍
        fill: strokeColor,
        stroke: strokeColor
      };
      
      setJoints(prevJoints => [...prevJoints, closingJoint]);
      
      // 结束连续绘制
      setContinuousDrawing(false);
      setLinePoints([]);
      setIsDrawing(false);
      setCurrentShapeId(null);
    }
  };

  // 缩放控制函数
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(Math.min(zoom + 10, 400)); // 最大放大到400%
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(Math.max(zoom - 10, 20)); // 最小缩小到20%
  };

  const handleZoomReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(100); // 重置为100%
  };

  // 修改容器返回部分，移除onWheel属性并添加passive事件监听
  useEffect(() => {
    // 使用ref获取容器元素
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    // 添加被动wheel事件监听器
    const handlePassiveWheel = (e: WheelEvent) => {
      // 阻止事件冒泡，防止触发浏览器默认缩放
      e.stopPropagation();
      
      // 检测是否为触控板的缩放手势 (通常metaKey为true或ctrlKey为true)
      if (e.ctrlKey || e.metaKey) {
        // 这是缩放手势
        e.stopPropagation();
        // 计算缩放比例 - 针对触控板缩放手势优化
        const delta = e.deltaY;
        const zoomFactor = 0.4; // 降低缩放敏感度
        const newZoom = zoom - delta * zoomFactor;
        // 限制缩放范围
        const limitedZoom = Math.max(20, Math.min(400, newZoom));
        setZoom(limitedZoom);
      } else {
        // 普通滚轮事件
        const delta = e.deltaY;
        const newZoom = zoom - delta / 10;
        // 限制缩放范围
        const limitedZoom = Math.max(20, Math.min(400, newZoom));
        setZoom(limitedZoom);
      }
    };
    
    // 阻止触控板双指缩放导致整个页面缩放
    const handleTouchMove = (e: TouchEvent) => {
      // 检测是否为多指触摸
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    container.addEventListener('wheel', handlePassiveWheel, { passive: true });
    
    // 添加触摸事件监听，阻止双指缩放
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    // 添加浏览器级别的键盘事件监听，捕获cmd+加/减号缩放
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.metaKey && (e.key === '+' || e.key === '-' || e.key === '=')) {
        e.preventDefault();
        // 可选：响应Cmd+加/减号的自定义缩放
        if (e.key === '+' || e.key === '=') {
          setZoom(Math.min(zoom + 10, 400));
        } else if (e.key === '-') {
          setZoom(Math.max(zoom - 10, 20));
        }
        return false;
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    
    return () => {
      container.removeEventListener('wheel', handlePassiveWheel);
      container.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [zoom, setZoom]);

  // 添加防止整个页面缩放的useEffect
  useEffect(() => {
    // 添加viewport meta标签防止页面缩放
    const existingMeta = document.querySelector('meta[name="viewport"]');
    if (!existingMeta) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
      
      return () => {
        document.head.removeChild(meta);
      };
    } else {
      const originalContent = existingMeta.getAttribute('content');
      existingMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      
      return () => {
        if (originalContent) {
          existingMeta.setAttribute('content', originalContent);
        }
      };
    }
  }, []);

  // 添加阻止默认缩放事件的全局处理程序
  useEffect(() => {
    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    
    // 捕获阶段处理，确保我们能最先接收到事件
    window.addEventListener('wheel', preventZoom, { passive: false, capture: true });
    
    return () => {
      window.removeEventListener('wheel', preventZoom, { capture: true });
    };
  }, []);

  // 辅助函数，更新与形状关联的标注
  const updateAnnotations = (
    shapeId: string, 
    deltaX: number = 0, 
    deltaY: number = 0, 
    scaleFactor: number = 1,
    newPoints?: number[]
  ) => {
    setAnnotations(annotations.map(anno => {
      if (anno.shapeId !== shapeId) return anno;
      
      if (newPoints) {
        // 如果提供了新的点坐标（用于线条），直接更新
        return {
          ...anno,
          points: anno.points.map((_val, index) => {
            // 基于线条起点和终点的变化更新标注
            if (index % 4 < 2) {
              return newPoints[index % 2];
            } else {
              return newPoints[index % 2 + 2];
            }
          }),
          textPosition: anno.textPosition 
            ? { 
                x: (newPoints[0] + newPoints[2]) / 2, 
                y: (newPoints[1] + newPoints[3]) / 2 - 20 
              } 
            : undefined
        };
      }
      
      if (scaleFactor !== 1) {
        // 缩放的情况（圆形）
        return {
          ...anno,
          points: anno.points.map((val) => {
            return val * scaleFactor;
          }),
          textPosition: anno.textPosition 
            ? { 
                x: anno.textPosition.x * scaleFactor, 
                y: anno.textPosition.y * scaleFactor 
              } 
            : undefined
        };
      }
      
      // 平移的情况（矩形）
      return {
        ...anno,
        points: anno.points.map((val, index) => {
          // 偶数索引为X坐标，奇数索引为Y坐标
          return index % 2 === 0 ? val + deltaX : val + deltaY;
        }),
        textPosition: anno.textPosition 
          ? { 
              x: anno.textPosition.x + deltaX, 
              y: anno.textPosition.y + deltaY 
            } 
          : undefined
      };
    }));
  };

  // 添加一个简单的点简化算法
  const simplifyPoints = (points: number[], tolerance: number = 1): number[] => {
    if (points.length <= 4) return points;
    
    const result: number[] = [];
    result.push(points[0], points[1]); // 添加第一个点
    
    for (let i = 2; i < points.length - 2; i += 2) {
      const x1 = points[i - 2];
      const y1 = points[i - 1];
      const x2 = points[i];
      const y2 = points[i + 1];
      const x3 = points[i + 2];
      const y3 = points[i + 3];
      
      // 计算点到线段的距离
      const distance = pointToLineDistance(x2, y2, x1, y1, x3, y3);
      
      // 如果距离大于容差，则保留该点
      if (distance > tolerance) {
        result.push(x2, y2);
      }
    }
    
    // 添加最后一个点
    result.push(points[points.length - 2], points[points.length - 1]);
    
    return result;
  };

  // 计算点到线段的距离
  const pointToLineDistance = (
    px: number, py: number, 
    x1: number, y1: number, 
    x2: number, y2: number
  ): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 生成贝塞尔曲线的SVG路径数据
  const generateBezierPathData = (points: {x: number, y: number, controlX1?: number, controlY1?: number, controlX2?: number, controlY2?: number}[]): string => {
    if (!points || points.length === 0) return '';
    
    // 开始路径
    let pathData = `M ${points[0].x},${points[0].y}`;
    
    // 添加所有的曲线段
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      if (current.controlX2 !== undefined && current.controlY2 !== undefined &&
          next.controlX1 !== undefined && next.controlY1 !== undefined) {
        // 完整的三次贝塞尔曲线
        pathData += ` C ${current.controlX2},${current.controlY2} ${next.controlX1},${next.controlY1} ${next.x},${next.y}`;
      } else if (current.controlX2 !== undefined && current.controlY2 !== undefined) {
        // 只有起点控制点
        pathData += ` Q ${current.controlX2},${current.controlY2} ${next.x},${next.y}`;
      } else if (next.controlX1 !== undefined && next.controlY1 !== undefined) {
        // 只有终点控制点
        pathData += ` Q ${next.controlX1},${next.controlY1} ${next.x},${next.y}`;
      } else {
        // 无控制点，使用直线
        pathData += ` L ${next.x},${next.y}`;
      }
    }
    
    // 如果是闭合路径（点数大于2且最后一点与第一点接近）
    if (points.length > 2) {
      const first = points[0];
      const last = points[points.length - 1];
      const dx = last.x - first.x;
      const dy = last.y - first.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 10) {
        pathData += ' Z'; // 闭合路径
      }
    }
    
    return pathData;
  };

  // 将undo和redo函数暴露给父组件
  useImperativeHandle(ref, () => ({
    handleUndo,
    handleRedo
  }));

  return (
    <div 
      id="canvas-container"
      style={canvasContainerStyle(isSpacePressed)}
    >
      {/* 网格 */}
      {showGrid && (
        <div style={gridStyle(gridSize, pan.x, pan.y)} />
      )}
      
      {/* Konva 画布 */}
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={-pan.x * scale}
        y={-pan.y * scale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDblClick}
        onTouchStart={(e) => handleMouseDown(e as any)}
        onTouchMove={(e) => handleMouseMove(e as any)}
        onTouchEnd={(e) => handleMouseUp(e as any)}
        style={{
          backgroundColor: '#fff',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)'
        }}
      >
        <Layer ref={layerRef}>
          {renderShapes()}
          {renderGuidelines()}
          {renderAnnotations()}
          {renderAlignmentGuides()}
          {renderJoints()}
        </Layer>
      </Stage>
      
      {/* 标尺 */}
      {showRulers && <Rulers zoom={zoom} pan={pan} />}
      
      {/* 缩放控制器 */}
      <div style={zoomControlsStyle}>
        <button 
          style={zoomButtonStyle} 
          onClick={handleZoomOut}
          title="缩小">−</button>
        <div style={zoomTextStyle}>{Math.round(zoom)}%</div>
        <button 
          style={zoomButtonStyle} 
          onClick={handleZoomIn}
          title="放大">+</button>
        <button 
          style={resetButtonStyle} 
          onClick={handleZoomReset}
          title="重置缩放">
          <ReloadOutlined style={{ fontSize: '12px' }} />
          <span style={{ marginLeft: '2px' }}>重置</span>
        </button>
      </div>
      
      {/* 文本编辑器 */}
      {editingText !== null && (
        <div
          style={{
            position: 'absolute',
            zIndex: 1000,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: `${textPosition.x}px`,
              top: `${textPosition.y}px`,
              width: `${textPosition.width}px`,
              pointerEvents: 'auto',
              zIndex: 1001,
            }}
          >
            <textarea
              ref={textareaRef}
              value={textValue}
              onChange={handleTextareaChange}
              onKeyDown={handleTextareaKeyDown}
              style={{
                width: '100%',
                minHeight: `${textPosition.height}px`,
                fontSize: `${fontSize * scale}px`,
                fontFamily,
                textAlign: textAlign as any,
                fontStyle,
                padding: '8px',
                border: '2px solid #1890ff',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                outline: 'none',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                resize: 'both',
                zIndex: 1001,
                transition: 'border-color 0.3s',
                lineHeight: '1.2',
                overflow: 'auto',
              }}
              placeholder="输入文本..."
              autoFocus
            />
            
            {/* 文本编辑工具栏 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                backgroundColor: '#1890ff',
                borderRadius: '0 0 4px 4px',
                marginTop: '-1px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <button
                onClick={() => setShowTextHelp(!showTextHelp)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                }}
                title="显示/隐藏帮助"
              >
                <InfoCircleOutlined />
              </button>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCancelTextEdit}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                  }}
                  title="取消"
                >
                  <CloseOutlined />
                </button>
                
                <button
                  onClick={handleCompleteTextEdit}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                  }}
                  title="确认"
                >
                  <CheckOutlined />
                </button>
              </div>
            </div>
            
            {/* 文本编辑帮助提示 */}
            {showTextHelp && (
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  marginTop: '8px',
                  fontSize: '12px',
                  maxWidth: '250px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>文本编辑快捷键:</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Enter</span>
                  <span>确认</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Shift+Enter</span>
                  <span>换行</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Esc</span>
                  <span>取消</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// 添加显示名称
Canvas.displayName = 'Canvas';

export default Canvas; 