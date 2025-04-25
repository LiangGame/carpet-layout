import React, { useEffect, useRef } from 'react';
import paper from 'paper';
import { useCanvasStore } from '../../store/canvasStore';
import { useToolsStore } from '../../store/toolsStore';
import { useDrawingStore } from '../../store/drawingStore';

const PaperCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<paper.Path | null>(null);
  const { activeTool } = useToolsStore();
  const { width, height, zoom, pan } = useCanvasStore();
  const { strokeColor, strokeWidth, fillColor, hasFill } = useDrawingStore();
  
  // 初始化Paper.js
  useEffect(() => {
    if (canvasRef.current) {
      // 初始化Paper.js画布
      paper.setup(canvasRef.current);
      
      return () => {
        // 清理
        paper.project.clear();
      };
    }
  }, []);
  
  // 监听工具变化
  useEffect(() => {
    if (activeTool === 'path') {
      // 设置Paper.js工具
      const tool = new paper.Tool();
      
      // 鼠标按下时创建新路径
      tool.onMouseDown = (event: paper.ToolEvent) => {
        // 转换坐标点，匹配Canvas.tsx中的转换逻辑
        const scale = zoom / 100;
        const adjustedPoint = new paper.Point(
          event.point.x / scale + pan.x / scale,
          event.point.y / scale + pan.y / scale
        );
        
        // 创建新路径
        pathRef.current = new paper.Path({
          segments: [adjustedPoint],
          strokeColor: new paper.Color(strokeColor),
          strokeWidth: strokeWidth,
          fillColor: hasFill ? new paper.Color(fillColor) : undefined
        });
      };
      
      // 鼠标拖动时添加点
      tool.onMouseDrag = (event: paper.ToolEvent) => {
        if (pathRef.current) {
          // 转换坐标点，匹配Canvas.tsx中的转换逻辑
          const scale = zoom / 100;
          const adjustedPoint = new paper.Point(
            event.point.x / scale + pan.x / scale,
            event.point.y / scale + pan.y / scale
          );
          pathRef.current.add(adjustedPoint);
        }
      };
      
      // 鼠标释放时完成路径
      tool.onMouseUp = () => {
        if (pathRef.current) {
          pathRef.current.simplify(10); // 简化路径，移除冗余点
          pathRef.current = null;
        }
      };
      
      // 激活该工具
      tool.activate();
      
      return () => {
        // 清除该工具
        tool.remove();
      };
    }
  }, [activeTool, strokeColor, strokeWidth, fillColor, hasFill, zoom, pan]);
  
  // 监听缩放和平移变化
  useEffect(() => {
    if (paper.view) {
      // 更新Paper.js视图的缩放和平移
      const scale = zoom / 100;
      paper.view.zoom = scale;
      
      // 设置视图的中心位置，使其与Konva的坐标系统保持一致
      paper.view.center = new paper.Point(
        width / 2 / scale - pan.x / scale,
        height / 2 / scale - pan.y / scale
      );
      
      paper.view.update();
    }
  }, [zoom, pan, width, height]);
  
  return (
    <canvas 
      ref={canvasRef} 
      id="paper-canvas" 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: activeTool === 'path' ? 'auto' : 'none',
        zIndex: activeTool === 'path' ? 2 : -1
      }}
    />
  );
};

export default PaperCanvas; 