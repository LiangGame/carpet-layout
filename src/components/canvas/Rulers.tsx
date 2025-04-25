import React, { useEffect, useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';

interface RulerProps {
  zoom: number;
  pan: { x: number; y: number };
}

const Rulers: React.FC<RulerProps> = ({ zoom, pan }) => {
  const horizontalRulerRef = useRef<HTMLDivElement>(null);
  const verticalRulerRef = useRef<HTMLDivElement>(null);
  
  // 绘制刻度线的函数
  const drawRulers = () => {
    const horizontalRuler = horizontalRulerRef.current;
    const verticalRuler = verticalRulerRef.current;
    
    if (!horizontalRuler || !verticalRuler) return;
    
    // 清除旧的刻度线
    horizontalRuler.innerHTML = '';
    verticalRuler.innerHTML = '';
    
    // 计算刻度间距，根据缩放调整刻度密度
    const baseSpacing = 10; // 基础间距 (毫米)
    const scaleFactor = zoom / 100;
    
    // 自动调整刻度密度，根据缩放比例决定使用多大间隔的刻度
    // 在缩放较小时，增加刻度间距，避免重叠
    let tickInterval = 1; // 默认每个刻度都显示
    let showLabelInterval = 5; // 默认每5个刻度显示一个标签
    
    // 根据缩放比例自动调整刻度间隔
    if (scaleFactor < 0.3) {
      tickInterval = 10;
      showLabelInterval = 2;
    } else if (scaleFactor < 0.5) {
      tickInterval = 5;
      showLabelInterval = 2;
    } else if (scaleFactor < 0.8) {
      tickInterval = 2;
      showLabelInterval = 5;
    }
    
    // 每10毫米绘制一个刻度
    const spacing = baseSpacing * scaleFactor;
    
    // 计算起始刻度位置
    const startX = Math.floor(-pan.x / spacing) * spacing + pan.x;
    const startY = Math.floor(-pan.y / spacing) * spacing + pan.y;
    
    // 计算需要绘制的刻度数量
    const horizontalCount = Math.ceil(horizontalRuler.clientWidth / spacing) + 1;
    const verticalCount = Math.ceil(verticalRuler.clientHeight / spacing) + 1;
    
    // 绘制水平刻度
    for (let i = 0; i < horizontalCount; i++) {
      // 根据tickInterval跳过一些刻度
      if (i % tickInterval !== 0) continue;
      
      const position = startX + i * spacing;
      const tickElement = document.createElement('div');
      tickElement.className = 'ruler-tick horizontal';
      tickElement.style.left = `${position}px`;
      
      // 每隔showLabelInterval个刻度显示一个数字标签
      if (i % (tickInterval * showLabelInterval) === 0) {
        tickElement.style.height = '10px';
        
        const labelElement = document.createElement('div');
        labelElement.className = 'ruler-label';
        const value = Math.round((position - pan.x) / scaleFactor);
        labelElement.textContent = `${value}`;
        labelElement.style.position = 'absolute';
        labelElement.style.left = `${position}px`;
        labelElement.style.top = '2px';
        labelElement.style.fontSize = '8px';
        labelElement.style.transform = 'translateX(-50%)';
        
        // 为标签添加最小间距，防止重叠
        labelElement.style.minWidth = '20px';
        labelElement.style.textAlign = 'center';
        
        horizontalRuler.appendChild(labelElement);
      }
      
      horizontalRuler.appendChild(tickElement);
    }
    
    // 绘制垂直刻度
    for (let i = 0; i < verticalCount; i++) {
      // 根据tickInterval跳过一些刻度
      if (i % tickInterval !== 0) continue;
      
      const position = startY + i * spacing;
      const tickElement = document.createElement('div');
      tickElement.className = 'ruler-tick vertical';
      tickElement.style.top = `${position}px`;
      
      // 每隔showLabelInterval个刻度显示一个数字标签
      if (i % (tickInterval * showLabelInterval) === 0) {
        tickElement.style.width = '10px';
        
        const labelElement = document.createElement('div');
        labelElement.className = 'ruler-label';
        const value = Math.round((position - pan.y) / scaleFactor);
        labelElement.textContent = `${value}`;
        labelElement.style.position = 'absolute';
        labelElement.style.top = `${position}px`;
        labelElement.style.left = '2px';
        labelElement.style.fontSize = '8px';
        labelElement.style.transform = 'translateY(-50%)';
        
        // 为垂直标签添加最小高度间距，防止重叠
        labelElement.style.minHeight = '15px';
        labelElement.style.display = 'flex';
        labelElement.style.alignItems = 'center';
        
        verticalRuler.appendChild(labelElement);
      }
      
      verticalRuler.appendChild(tickElement);
    }
  };
  
  // 当缩放或平移改变时重绘刻度
  useEffect(() => {
    drawRulers();
    
    // 监听窗口大小变化，重绘刻度
    window.addEventListener('resize', drawRulers);
    return () => {
      window.removeEventListener('resize', drawRulers);
    };
  }, [zoom, pan]);
  
  return (
    <div className="rulers-container">
      <div className="ruler horizontal" ref={horizontalRulerRef}></div>
      <div className="ruler vertical" ref={verticalRulerRef}></div>
      <div className="ruler-corner"></div>
    </div>
  );
};

export default Rulers; 