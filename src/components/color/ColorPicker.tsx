import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useColorStore, FillType, MaterialType } from '../../store/colorStore';
import { Card, Tabs, Button, Input, Tag, Row, Col, Typography, List, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import './colorpicker.css'; // Import custom CSS for color picker styling

const { Text } = Typography;

interface ColorPickerProps {
  isCompact?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ isCompact = false }) => {
  const {
    fillType,
    solidColor,
    materialColors,
    recentColors,
    favoriteColors,
    materialMode,
    setSolidColor,
    setFillType,
    toggleMaterialMode,
    addToFavorites,
  } = useColorStore();

  const [selectedMaterialType, setSelectedMaterialType] = useState<MaterialType | 'all'>('all');

  // 切换材质类型
  const handleMaterialTypeSelect = (type: MaterialType | 'all') => {
    setSelectedMaterialType(type);
  };

  // 过滤材质颜色
  const filteredMaterialColors = selectedMaterialType === 'all'
    ? materialColors
    : materialColors.filter(color => color.type === selectedMaterialType);

  // 选择颜色
  const handleColorSelect = (color: string) => {
    setSolidColor(color);
  };

  // 将当前颜色添加到收藏
  const handleAddToFavorites = () => {
    addToFavorites(solidColor);
  };

  // 颜色/材质模式的标签页
  const colorModeItems = [
    {
      key: 'color',
      label: '色彩',
      children: (
        <>
          <HexColorPicker color={solidColor} onChange={handleColorSelect} className="small-color-picker" />
          <Input
            value={solidColor}
            onChange={(e) => handleColorSelect(e.target.value)}
            style={{ width: '100%', margin: '8px 0' }}
          />

          {/* 最近使用的颜色 */}
          {recentColors.length > 0 && (
            <>
              <Text strong style={{ display: 'block', margin: '12px 0 8px' }}>最近使用:</Text>
              <Row gutter={[8, 8]}>
                {recentColors.map((color) => (
                  <Col key={color}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        border: '1px solid #ddd',
                        backgroundColor: color,
                      }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    />
                  </Col>
                ))}
              </Row>
            </>
          )}

          {/* 收藏的颜色 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 8px' }}>
            <Text strong>收藏:</Text>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddToFavorites}
            >
              添加当前颜色
            </Button>
          </div>
          
          {favoriteColors.length > 0 ? (
            <Row gutter={[8, 8]}>
              {favoriteColors.map((color) => (
                <Col key={color}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      border: '1px solid #ddd',
                      backgroundColor: color,
                    }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>暂无收藏，点击"添加当前颜色"添加。</Text>
          )}
        </>
      ),
    },
    {
      key: 'material',
      label: '材质',
      children: (
        <>
          {/* 材质类型过滤 */}
          <Text strong style={{ display: 'block', margin: '0 0 8px' }}>材质类型:</Text>
          <Space style={{ marginBottom: '12px' }} wrap>
            <Tag.CheckableTag
              checked={selectedMaterialType === 'all'}
              onChange={() => handleMaterialTypeSelect('all')}
            >
              全部
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={selectedMaterialType === 'wool'}
              onChange={() => handleMaterialTypeSelect('wool')}
            >
              羊毛
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={selectedMaterialType === 'acrylic'}
              onChange={() => handleMaterialTypeSelect('acrylic')}
            >
              腈纶
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={selectedMaterialType === 'silk'}
              onChange={() => handleMaterialTypeSelect('silk')}
            >
              丝绸
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={selectedMaterialType === 'cotton'}
              onChange={() => handleMaterialTypeSelect('cotton')}
            >
              棉质
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={selectedMaterialType === 'nylon'}
              onChange={() => handleMaterialTypeSelect('nylon')}
            >
              尼龙
            </Tag.CheckableTag>
          </Space>

          {/* 材质颜色列表 */}
          <Text strong style={{ display: 'block', margin: '12px 0 8px' }}>可用颜色:</Text>
          <List
            style={{ maxHeight: isCompact ? '220px' : '300px', overflowY: 'auto' }}
            size="small"
            dataSource={filteredMaterialColors}
            renderItem={(material) => (
              <List.Item
                style={{ 
                  padding: '4px', 
                  cursor: 'pointer',
                  backgroundColor: solidColor === material.hex ? '#e3e3e3' : 'transparent',
                }}
                onClick={() => handleColorSelect(material.hex)}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      marginRight: '8px',
                      border: '1px solid #ddd',
                      backgroundColor: material.hex,
                    }}
                  />
                  <div>
                    <div>{material.name}</div>
                    <div style={{ fontSize: '10px', color: '#888' }}>
                      {material.pantoneCode ? `Pantone: ${material.pantoneCode}` : material.hex}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </>
      ),
    },
  ];

  // 主要填充类型选项卡
  const fillTypeItems = [
    {
      key: 'solid',
      label: '纯色',
      children: (
        <Tabs
          activeKey={materialMode ? 'material' : 'color'}
          onChange={(key) => {
            if ((key === 'material' && !materialMode) || 
                (key === 'color' && materialMode)) {
              toggleMaterialMode();
            }
          }}
          items={colorModeItems}
        />
      ),
    },
    {
      key: 'gradient',
      label: '渐变',
      children: <div style={{ textAlign: 'center', padding: '20px 0' }}>渐变编辑器 - 开发中</div>,
    },
    {
      key: 'none',
      label: '无填充',
      children: <div style={{ textAlign: 'center', padding: '20px 0' }}>无填充颜色</div>,
    },
  ];

  // 根据是否紧凑模式使用不同的样式
  const containerStyle = isCompact 
    ? {
        height: '100%',
        overflow: 'hidden',
      }
    : {
        width: '240px', 
        height: '100%', 
        borderRadius: 0, 
        borderTop: 0, 
        borderBottom: 0,
        borderRight: 0,
      };

  const bodyStyle = isCompact 
    ? { padding: '8px' }
    : { padding: '12px' };

  return (
    <Card style={containerStyle} bodyStyle={bodyStyle}>
      <Tabs
        activeKey={fillType}
        onChange={(key) => setFillType(key as FillType)}
        items={fillTypeItems}
        size={isCompact ? "small" : "middle"}
      />
    </Card>
  );
};

export default ColorPicker; 