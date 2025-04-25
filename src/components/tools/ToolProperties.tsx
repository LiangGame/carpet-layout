import React, { useState } from 'react';
import { Card, Tabs, Typography, Form, InputNumber, Space, Checkbox, Button, Row, Col, Menu, Input, Select, Divider } from 'antd';
import { useAtom } from 'jotai';
import { canvasGridAtom, canvasSizeAtom, showGridAtom } from '../../atoms/canvasAtoms';
import CanvasControls from '../canvas/CanvasControls';
import ColorPicker from '../color/ColorPicker';
import DrawingColorPicker from './DrawingColorPicker';
import { usePatternStore, ArrangementType, TransformationType } from '../../store/patternStore';
import { RedoOutlined } from '@ant-design/icons';
import { useToolsStore } from '../../store/toolsStore';
import { useDrawingStore } from '../../store/drawingStore';

const { Text } = Typography;
const { Option } = Select;

// Define styles as objects
const styles = {
  propertiesPanel: {
    backgroundColor: '#333',
    borderRadius: '0px',
    border: '1px solid #222',
    overflow: 'hidden',
    height: '100%',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#444',
    borderBottom: '1px solid #222',
  },
  emptyState: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: '100%',
    color: '#999',
    flexDirection: 'column' as const,
    padding: '20px',
  },
  contentContainer: {
    height: 'calc(100% - 36px)',
    overflowY: 'auto' as const,
  },
  formContainer: {
    padding: '12px',
    color: '#ddd',
  }
};

// 定义Tabs组件的样式覆盖
const tabsStyle = {
  '.ant-tabs-tab': {
    color: '#bbb !important',
  },
  '.ant-tabs-tab-active': {
    color: '#fff !important',
  },
  '.ant-tabs-tab-btn': {
    color: 'inherit',
  },
  '.ant-tabs-ink-bar': {
    backgroundColor: '#1890ff',
  },
  '.ant-form-item-label > label': {
    color: '#ccc',
  },
};

interface ToolPropertiesProps {
  selectedTool: string | null;
}

const getTitleForTool = (tool: string | null): string => {
  switch (tool) {
    case 'canvas': return '画布设置';
    case 'brush': return '画笔设置';
    case 'color': return '颜色设置';
    case 'rectangle': return '矩形设置';
    case 'circle': return '圆形设置';
    case 'text': return '文字设置';
    case 'view': return '视图选项';
    case 'arrange': return '阵列排列';
    case 'transform': return '变形工具';
    default: return '属性面板';
  }
};

// 阵列排列工具属性面板
const ArrangeProperties: React.FC = () => {
  const {
    arrangementType,
    linearArrangement,
    radialArrangement,
    setArrangementType,
    setLinearArrangement,
    setRadialArrangement,
  } = usePatternStore();

  // 线性阵列参数更新
  const handleLinearChange = (field: keyof typeof linearArrangement, value: number | boolean) => {
    setLinearArrangement({ [field]: value });
  };

  // 径向阵列参数更新
  const handleRadialChange = (field: keyof typeof radialArrangement, value: number) => {
    setRadialArrangement({ [field]: value });
  };

  return (
    <div style={styles.formContainer}>
      <Tabs
        type="card"
        activeKey={arrangementType}
        onChange={(key) => setArrangementType(key as ArrangementType)}
        items={[
          {
            key: 'linear',
            label: '线性阵列',
            children: (
              <Form layout="vertical" style={{ marginTop: '8px', color: '#ddd' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<span style={{ color: '#ddd' }}>行数</span>}>
                      <InputNumber
                        min={1}
                        max={20}
                        value={linearArrangement.rows}
                        onChange={(value) => handleLinearChange('rows', value as number)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<span style={{ color: '#ddd' }}>列数</span>}>
                      <InputNumber
                        min={1}
                        max={20}
                        value={linearArrangement.columns}
                        onChange={(value) => handleLinearChange('columns', value as number)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<span style={{ color: '#ddd' }}>行间距 (mm)</span>}>
                      <InputNumber
                        min={0}
                        value={linearArrangement.rowSpacing}
                        onChange={(value) => handleLinearChange('rowSpacing', value as number)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<span style={{ color: '#ddd' }}>列间距 (mm)</span>}>
                      <InputNumber
                        min={0}
                        value={linearArrangement.columnSpacing}
                        onChange={(value) => handleLinearChange('columnSpacing', value as number)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item>
                      <Checkbox
                        checked={linearArrangement.fillCanvas}
                        onChange={(e) => handleLinearChange('fillCanvas', e.target.checked)}
                      >
                        <span style={{ color: '#ddd' }}>自动填满画布</span>
                      </Checkbox>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            ),
          },
          {
            key: 'radial',
            label: '径向阵列',
            children: (
              <Form layout="vertical" style={{ marginTop: '8px', color: '#ddd' }}>
                <Form.Item label={<span style={{ color: '#ddd' }}>复制数量</span>}>
                  <InputNumber
                    min={2}
                    max={36}
                    value={radialArrangement.count}
                    onChange={(value) => handleRadialChange('count', value as number)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label={<span style={{ color: '#ddd' }}>角度范围</span>}>
                  <Space style={{ width: '100%' }}>
                    <InputNumber
                      min={1}
                      max={360}
                      value={radialArrangement.angle}
                      onChange={(value) => handleRadialChange('angle', value as number)}
                      style={{ width: '100%' }}
                    />
                    <Text style={{ color: '#ddd' }}>度</Text>
                  </Space>
                </Form.Item>
                <Form.Item label={<span style={{ color: '#ddd' }}>半径 (mm)</span>}>
                  <InputNumber
                    min={10}
                    value={radialArrangement.radius}
                    onChange={(value) => handleRadialChange('radius', value as number)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form>
            ),
          },
        ]}
      />
    </div>
  );
};

// 变形工具属性面板
const TransformProperties: React.FC = () => {
  const {
    transformationType,
    freeTransformation,
    setTransformationType,
    setFreeTransformation,
    resetTransformations,
  } = usePatternStore();

  // 自由变形参数更新
  const handleFreeTransformChange = (field: keyof typeof freeTransformation, value: number) => {
    if (field === 'type') return;
    setFreeTransformation({ [field]: value });
  };

  return (
    <div style={styles.formContainer}>
      <Tabs
        type="card"
        activeKey={transformationType}
        onChange={(key) => setTransformationType(key as TransformationType)}
        items={[
          {
            key: 'free',
            label: '自由变换',
            children: (
              <Form layout="vertical" style={{ marginTop: '8px', color: '#ddd' }}>
                <Form.Item label={<span style={{ color: '#ddd' }}>水平缩放</span>}>
                  <InputNumber
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={freeTransformation.scaleX}
                    onChange={(value) => handleFreeTransformChange('scaleX', value as number)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label={<span style={{ color: '#ddd' }}>垂直缩放</span>}>
                  <InputNumber
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={freeTransformation.scaleY}
                    onChange={(value) => handleFreeTransformChange('scaleY', value as number)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label={<span style={{ color: '#ddd' }}>旋转角度</span>}>
                  <Space style={{ width: '100%' }}>
                    <InputNumber
                      min={-180}
                      max={180}
                      value={freeTransformation.rotation}
                      onChange={(value) => handleFreeTransformChange('rotation', value as number)}
                      style={{ width: '100%' }}
                    />
                    <Text style={{ color: '#ddd' }}>度</Text>
                  </Space>
                </Form.Item>
                <Form.Item label={<span style={{ color: '#ddd' }}>水平斜切</span>}>
                  <Space style={{ width: '100%' }}>
                    <InputNumber
                      min={-89}
                      max={89}
                      value={freeTransformation.skewX}
                      onChange={(value) => handleFreeTransformChange('skewX', value as number)}
                      style={{ width: '100%' }}
                    />
                    <Text style={{ color: '#ddd' }}>度</Text>
                  </Space>
                </Form.Item>
                <Form.Item label={<span style={{ color: '#ddd' }}>垂直斜切</span>}>
                  <Space style={{ width: '100%' }}>
                    <InputNumber
                      min={-89}
                      max={89}
                      value={freeTransformation.skewY}
                      onChange={(value) => handleFreeTransformChange('skewY', value as number)}
                      style={{ width: '100%' }}
                    />
                    <Text style={{ color: '#ddd' }}>度</Text>
                  </Space>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'envelope',
            label: '封套变形',
            children: (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#ddd' }}>
                封套变形工具需要在画布上直接操作网格控制点
              </div>
            ),
          },
        ]}
      />
      <div style={{ marginTop: '12px', textAlign: 'right' }}>
        <Button icon={<RedoOutlined />} onClick={resetTransformations}>
          重置变形
        </Button>
      </div>
    </div>
  );
};

const DrawingProperties: React.FC = () => {
  const { 
    strokeColor, 
    fillColor, 
    strokeWidth, 
    hasFill,
    setStrokeColor, 
    setFillColor, 
    setStrokeWidth,
    toggleFill
  } = useDrawingStore();
  
  return (
    <Form layout="vertical" style={{ padding: '16px' }}>
      <DrawingColorPicker 
        color={strokeColor}
        onChange={setStrokeColor}
        label="线条颜色"
      />
      
      <Form.Item>
        <Checkbox 
          checked={hasFill} 
          onChange={() => toggleFill()}
          style={{ color: '#ddd' }}
        >
          启用填充
        </Checkbox>
      </Form.Item>
      
      {hasFill && (
        <DrawingColorPicker 
          color={fillColor}
          onChange={setFillColor}
          label="填充颜色"
        />
      )}
      
      <Form.Item label={<span style={{ color: '#ddd' }}>图形线条宽度</span>}>
        <InputNumber
          min={1}
          max={30}
          value={strokeWidth}
          onChange={(value) => value !== null && setStrokeWidth(value)}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
};

// 添加一个新的TextProperties组件
const TextProperties: React.FC = () => {
  const { 
    fontSize, 
    fontFamily, 
    textAlign, 
    fontStyle,
    fillColor,
    textStrokeWidth,
    setFontSize, 
    setFontFamily, 
    setTextAlign,
    setFontStyle,
    setFillColor,
    setTextStrokeWidth
  } = useDrawingStore();
  
  return (
    <Form layout="vertical" style={{ padding: '16px' }}>
      <Form.Item label={<span style={{ color: '#ddd' }}>字体大小</span>}>
        <InputNumber
          min={8}
          max={72}
          value={fontSize}
          onChange={(value) => value !== null && setFontSize(value)}
          style={{ width: '100%' }}
        />
      </Form.Item>
      
      <Form.Item label={<span style={{ color: '#ddd' }}>字体</span>}>
        <Select
          value={fontFamily}
          onChange={setFontFamily}
          style={{ width: '100%' }}
        >
          <Option value="Arial">Arial</Option>
          <Option value="Helvetica">Helvetica</Option>
          <Option value="Times New Roman">Times New Roman</Option>
          <Option value="Courier New">Courier New</Option>
          <Option value="SimSun">宋体</Option>
          <Option value="Microsoft YaHei">微软雅黑</Option>
        </Select>
      </Form.Item>
      
      <Form.Item label={<span style={{ color: '#ddd' }}>对齐方式</span>}>
        <Select
          value={textAlign}
          onChange={value => setTextAlign(value as 'left' | 'center' | 'right')}
          style={{ width: '100%' }}
        >
          <Option value="left">左对齐</Option>
          <Option value="center">居中</Option>
          <Option value="right">右对齐</Option>
        </Select>
      </Form.Item>
      
      <Form.Item label={<span style={{ color: '#ddd' }}>字体样式</span>}>
        <Select
          value={fontStyle}
          onChange={setFontStyle}
          style={{ width: '100%' }}
        >
          <Option value="normal">常规</Option>
          <Option value="bold">粗体</Option>
          <Option value="italic">斜体</Option>
          <Option value="bold italic">粗斜体</Option>
        </Select>
      </Form.Item>
      
      <DrawingColorPicker 
        color={fillColor}
        onChange={setFillColor}
        label="文字颜色"
      />
      
      <Form.Item label={<span style={{ color: '#ddd' }}>文字描边粗细</span>}>
        <InputNumber
          min={0}
          max={5}
          step={0.1}
          value={textStrokeWidth}
          onChange={(value) => value !== null && setTextStrokeWidth(value)}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
};

const ToolProperties: React.FC<ToolPropertiesProps> = ({ selectedTool }) => {
  return (
    <div style={styles.propertiesPanel}>
      <div style={styles.panelHeader}>
        <Text strong style={{ fontSize: '14px', color: '#fff' }}>
          {getTitleForTool(selectedTool)}
        </Text>
      </div>

      <div style={styles.contentContainer}>
        {selectedTool === 'canvas' ? (
          <CanvasControls hideHeader={true} />
        ) : selectedTool === 'color' ? (
          <ColorPicker isCompact={true} />
        ) : selectedTool === 'arrange' ? (
          <ArrangeProperties />
        ) : selectedTool === 'transform' ? (
          <TransformProperties />
        ) : selectedTool === 'brush' ? (
          <div style={{ padding: '12px', color: '#ddd' }}>
            <DrawingProperties />
          </div>
        ) : selectedTool === 'rectangle' || selectedTool === 'circle' || selectedTool === 'line' ? (
          <div style={{ padding: '12px', color: '#ddd' }}>
            <DrawingProperties />
          </div>
        ) : selectedTool === 'text' ? (
          <div style={{ padding: '12px', color: '#ddd' }}>
            <TextProperties />
          </div>
        ) : selectedTool === 'view' ? (
          <div style={{ padding: '12px', color: '#ddd' }}>
            <Text style={{ color: '#ddd' }}>视图设置</Text>
            {/* 视图设置控制 */}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <Text type="secondary">请在左侧选择一个工具</Text>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
              工具属性将显示在此处
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolProperties; 