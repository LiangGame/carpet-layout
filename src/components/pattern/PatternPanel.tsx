import React from 'react';
import { usePatternStore, ArrangementType, TransformationType } from '../../store/patternStore';
import { Card, Tabs, Button, InputNumber, Space, Checkbox, Form, Row, Col, Typography } from 'antd';
import { RedoOutlined } from '@ant-design/icons';

const { Text } = Typography;

// 主面板组件
const PatternPanel: React.FC = () => {
  const {
    arrangementType,
    linearArrangement,
    radialArrangement,
    transformationType,
    freeTransformation,
    arrangementEnabled,
    transformationEnabled,
    setArrangementType,
    setLinearArrangement,
    setRadialArrangement,
    setTransformationType,
    setFreeTransformation,
    toggleArrangementEnabled,
    toggleTransformationEnabled,
    resetTransformations,
  } = usePatternStore();

  // 线性阵列参数更新
  const handleLinearChange = (field: keyof typeof linearArrangement, value: number | boolean) => {
    setLinearArrangement({ [field]: value });
  };

  // 径向阵列参数更新
  const handleRadialChange = (field: keyof typeof radialArrangement, value: number) => {
    setRadialArrangement({ [field]: value });
  };

  // 自由变形参数更新
  const handleFreeTransformChange = (field: keyof typeof freeTransformation, value: number) => {
    if (field === 'type') return;
    setFreeTransformation({ [field]: value });
  };

  // 标签页项目
  const items = [
    {
      key: 'arrangement',
      label: '阵列排列',
      children: arrangementEnabled ? (
        <Card size="small" style={{ marginTop: '8px' }} bodyStyle={{ padding: '12px' }}>
          <Tabs
            type="card"
            activeKey={arrangementType}
            onChange={(key) => setArrangementType(key as ArrangementType)}
            items={[
              {
                key: 'linear',
                label: '线性阵列',
                children: (
                  <Form layout="vertical" style={{ marginTop: '8px' }}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="行数">
                          <InputNumber
                            min={1}
                            max={20}
                            value={linearArrangement.rows}
                            onChange={(value) => handleLinearChange('rows', value as number)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="列数">
                          <InputNumber
                            min={1}
                            max={20}
                            value={linearArrangement.columns}
                            onChange={(value) => handleLinearChange('columns', value as number)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="行间距 (mm)">
                          <InputNumber
                            min={0}
                            value={linearArrangement.rowSpacing}
                            onChange={(value) => handleLinearChange('rowSpacing', value as number)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="列间距 (mm)">
                          <InputNumber
                            min={0}
                            value={linearArrangement.columnSpacing}
                            onChange={(value) => handleLinearChange('columnSpacing', value as number)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item>
                          <Checkbox
                            checked={linearArrangement.fillCanvas}
                            onChange={(e) => handleLinearChange('fillCanvas', e.target.checked)}
                          >
                            自动填满画布
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
                  <Form layout="vertical" style={{ marginTop: '8px' }}>
                    <Form.Item label="复制数量">
                      <InputNumber
                        min={2}
                        max={36}
                        value={radialArrangement.count}
                        onChange={(value) => handleRadialChange('count', value as number)}
                      />
                    </Form.Item>
                    <Form.Item label="角度范围">
                      <Space>
                        <InputNumber
                          min={1}
                          max={360}
                          value={radialArrangement.angle}
                          onChange={(value) => handleRadialChange('angle', value as number)}
                        />
                        <Text>度</Text>
                      </Space>
                    </Form.Item>
                    <Form.Item label="半径 (mm)">
                      <InputNumber
                        min={10}
                        value={radialArrangement.radius}
                        onChange={(value) => handleRadialChange('radius', value as number)}
                      />
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        </Card>
      ) : null,
    },
    {
      key: 'transformation',
      label: '变形工具',
      children: transformationEnabled ? (
        <Card size="small" style={{ marginTop: '8px' }} bodyStyle={{ padding: '12px' }}>
          <Tabs
            type="card"
            activeKey={transformationType}
            onChange={(key) => setTransformationType(key as TransformationType)}
            items={[
              {
                key: 'free',
                label: '自由变换',
                children: (
                  <Form layout="vertical" style={{ marginTop: '8px' }}>
                    <Form.Item label="水平缩放">
                      <InputNumber
                        min={0.1}
                        max={10}
                        step={0.1}
                        value={freeTransformation.scaleX}
                        onChange={(value) => handleFreeTransformChange('scaleX', value as number)}
                      />
                    </Form.Item>
                    <Form.Item label="垂直缩放">
                      <InputNumber
                        min={0.1}
                        max={10}
                        step={0.1}
                        value={freeTransformation.scaleY}
                        onChange={(value) => handleFreeTransformChange('scaleY', value as number)}
                      />
                    </Form.Item>
                    <Form.Item label="旋转角度">
                      <Space>
                        <InputNumber
                          min={-180}
                          max={180}
                          value={freeTransformation.rotation}
                          onChange={(value) => handleFreeTransformChange('rotation', value as number)}
                        />
                        <Text>度</Text>
                      </Space>
                    </Form.Item>
                    <Form.Item label="水平斜切">
                      <Space>
                        <InputNumber
                          min={-89}
                          max={89}
                          value={freeTransformation.skewX}
                          onChange={(value) => handleFreeTransformChange('skewX', value as number)}
                        />
                        <Text>度</Text>
                      </Space>
                    </Form.Item>
                    <Form.Item label="垂直斜切">
                      <Space>
                        <InputNumber
                          min={-89}
                          max={89}
                          value={freeTransformation.skewY}
                          onChange={(value) => handleFreeTransformChange('skewY', value as number)}
                        />
                        <Text>度</Text>
                      </Space>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'envelope',
                label: '封套变形',
                children: (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
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
        </Card>
      ) : null,
    },
  ];

  return (
    <div style={{ padding: '12px', backgroundColor: '#f8f8f8', borderTop: '1px solid #ddd' }}>
      <Tabs
        type="card"
        items={items}
        activeKey={arrangementEnabled ? 'arrangement' : transformationEnabled ? 'transformation' : ''}
        onChange={(key) => {
          if (key === 'arrangement' && !arrangementEnabled) {
            toggleArrangementEnabled();
          } else if (key === 'transformation' && !transformationEnabled) {
            toggleTransformationEnabled();
          } else if (key === 'arrangement' && arrangementEnabled) {
            toggleArrangementEnabled();
          } else if (key === 'transformation' && transformationEnabled) {
            toggleTransformationEnabled();
          }
        }}
      />
    </div>
  );
};

export default PatternPanel; 