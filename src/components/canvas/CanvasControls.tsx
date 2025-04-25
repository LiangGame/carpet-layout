import React from 'react';
import { useAtom } from 'jotai';
import { canvasGridAtom, canvasSizeAtom, showGridAtom } from '../../atoms/canvasAtoms';
import { Form, InputNumber, Checkbox, Slider, Space, Typography, Button, Row, Col } from 'antd';
import { RedoOutlined, ColumnWidthOutlined, ColumnHeightOutlined, BorderOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Define styles as objects
const styles = {
  canvasControlsPanel: {
    backgroundColor: '#333',
    borderRadius: '4px',
    border: '1px solid #222',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#444',
    borderBottom: '1px solid #222',
  },
  panelSection: {
    padding: '10px 12px',
    borderBottom: '1px solid #222',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2px',
  },
  inputGroup: {
    marginBottom: '2px',
  },
  inputLabel: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2px',
  },
};

interface CanvasControlsProps {
  hideHeader?: boolean;
}

function CanvasControls({ hideHeader = false }: CanvasControlsProps) {
  const [canvasSize, setCanvasSize] = useAtom(canvasSizeAtom);
  const [showGrid, setShowGrid] = useAtom(showGridAtom);
  const [gridSize, setGridSize] = useAtom(canvasGridAtom);
  
  const handleWidthChange = (value: number | null) => {
    if (value !== null) {
      setCanvasSize({ ...canvasSize, width: value });
    }
  };

  const handleHeightChange = (value: number | null) => {
    if (value !== null) {
      setCanvasSize({ ...canvasSize, height: value });
    }
  };

  const handleResetSize = () => {
    setCanvasSize({ width: 800, height: 600 });
  };

  const handleGridSizeChange = (value: number | null) => {
    if (value !== null) {
      setGridSize(value);
    }
  };

  return (
    <div style={styles.canvasControlsPanel}>
      {!hideHeader && (
        <div style={styles.panelHeader}>
          <Text strong style={{ fontSize: '14px', color: '#fff' }}>画布设置</Text>
        </div>
      )}
      
      <div style={{...styles.panelSection, borderBottom: '1px solid #222'}}>
        <div style={styles.sectionHeader}>
          <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>尺寸</Text>
          <Button 
            type="text"
            size="small"
            icon={<RedoOutlined />} 
            onClick={handleResetSize}
            title="重置尺寸"
            style={{ marginLeft: 'auto', padding: '0 4px', height: '20px' }}
          />
        </div>
        
        <Row gutter={[12, 8]} style={{ marginTop: 4 }}>
          <Col span={12}>
            <div style={styles.inputGroup}>
              <div style={styles.inputLabel}>
                <ColumnWidthOutlined style={{ fontSize: '12px', marginRight: '4px', color: '#bbb' }} />
                <Text style={{ fontSize: '12px', color: '#ddd' }}>宽度</Text>
              </div>
              <InputNumber
                min={100}
                max={3000}
                value={canvasSize.width}
                onChange={handleWidthChange}
                style={{ width: '100%' }}
                size="small"
                addonAfter="px"
                bordered={true}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={styles.inputGroup}>
              <div style={styles.inputLabel}>
                <ColumnHeightOutlined style={{ fontSize: '12px', marginRight: '4px', color: '#bbb' }} />
                <Text style={{ fontSize: '12px', color: '#ddd' }}>高度</Text>
              </div>
              <InputNumber
                min={100}
                max={3000}
                value={canvasSize.height}
                onChange={handleHeightChange}
                style={{ width: '100%' }}
                size="small"
                addonAfter="px"
                bordered={true}
              />
            </div>
          </Col>
        </Row>
      </div>
      
      <div style={styles.panelSection}>
        <div style={styles.sectionHeader}>
          <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>网格</Text>
        </div>
        
        <div style={{ marginTop: 4 }}>
          <Checkbox 
            checked={showGrid} 
            onChange={e => setShowGrid(e.target.checked)}
            style={{ fontSize: '12px' }}
          >
            <Text style={{ fontSize: '12px', color: '#ddd' }}>显示网格</Text>
          </Checkbox>
        </div>
        
        {showGrid && (
          <div style={{ marginTop: 8 }}>
            <div style={styles.inputGroup}>
              <div style={styles.inputLabel}>
                <BorderOutlined style={{ fontSize: '12px', marginRight: '4px', color: '#bbb' }} />
                <Text style={{ fontSize: '12px', color: '#ddd' }}>网格大小</Text>
                <Text style={{ fontSize: '12px', marginLeft: 'auto', color: '#ddd' }}>{gridSize}px</Text>
              </div>
              <Slider
                min={5}
                max={100}
                value={gridSize}
                onChange={handleGridSizeChange}
                style={{ margin: '4px 0 0' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CanvasControls; 