import React, { useState, useEffect } from 'react';
import './App.css';
import Canvas from './components/canvas/Canvas';
import Toolbar from './components/tools/Toolbar';
import ToolProperties from './components/tools/ToolProperties';
import { useToolsStore } from './store/toolsStore';
import HistoryButtons from './components/tools/HistoryButtons';

const AppContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
};

const HeaderStyle: React.CSSProperties = {
  padding: '0 24px',
  height: '48px',
  lineHeight: '48px',
  backgroundColor: '#222',
  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  color: '#fff',
};

const MainContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  flexGrow: 1,
  overflow: 'hidden',
};

const ContentStyle: React.CSSProperties = {
  position: 'relative',
  padding: 0,
  overflow: 'hidden',
  backgroundColor: '#fff',
  flex: 1,
};

const PropertiesPanelStyle: React.CSSProperties = {
  width: '280px',
  borderLeft: '1px solid #222',
  backgroundColor: '#333',
  height: '100%',
  overflow: 'auto',
};

function App() {
  const { activeTool } = useToolsStore();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  // Update the properties panel when the active tool changes
  useEffect(() => {
    setSelectedTool(activeTool);
  }, [activeTool]);

  // 获取Canvas组件的引用，以便调用其Undo/Redo方法
  const canvasRef = React.useRef<any>(null);

  // 处理撤销/重做按钮点击
  const handleUndo = () => {
    if (canvasRef.current) {
      canvasRef.current.handleUndo();
    }
  };

  const handleRedo = () => {
    if (canvasRef.current) {
      canvasRef.current.handleRedo();
    }
  };

  return (
    <div style={AppContainer}>
      {/* 顶部标题栏 */}
      <div style={HeaderStyle}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>地毯排版工具</h1>
      </div>
      
      <div style={MainContainer}>
        {/* 左侧工具栏 */}
        <Toolbar />
        
        {/* 主内容区域 */}
        <div style={ContentStyle}>
          <Canvas ref={canvasRef} />
        </div>
        
        {/* 历史操作按钮 */}
        <HistoryButtons onUndo={handleUndo} onRedo={handleRedo} />
        
        {/* 右侧属性面板 */}
        <div style={PropertiesPanelStyle}>
          <ToolProperties selectedTool={selectedTool} />
        </div>
      </div>
    </div>
  );
}

export default App;
