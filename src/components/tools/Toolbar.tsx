import React from 'react';
import { useToolsStore, ToolType } from '../../store/toolsStore';
import { Tooltip, Button, Divider } from 'antd';
import {
  SelectOutlined,
  LineOutlined,
  HighlightOutlined,
  FolderOutlined,
  FontSizeOutlined,
  LayoutOutlined,
  EyeOutlined,
  BgColorsOutlined,
  EditOutlined,
  AppstoreOutlined,
  ExpandOutlined,
  TableOutlined,
  CiCircleOutlined
} from '@ant-design/icons';

const toolbarContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '46px',
  backgroundColor: '#333',
  padding: '8px 0',
  height: '100%',
  overflowY: 'auto',
};

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, title, isActive, onClick }) => {
  return (
    <Tooltip title={title} placement="right">
      <Button
        type="text"
        icon={icon}
        onClick={onClick}
        style={{ 
          margin: '2px 0', 
          height: '36px', 
          width: '100%', 
          borderRadius: 0,
          color: isActive ? '#fff' : '#bbb',
          backgroundColor: isActive ? '#555' : 'transparent'
        }}
      />
    </Tooltip>
  );
};

const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool } = useToolsStore();

  const tools: Array<{ tool: ToolType; icon: React.ReactNode; title: string; group?: string }> = [
    { tool: 'select', icon: <SelectOutlined />, title: '选择工具', group: 'navigation' },
    { tool: 'canvas', icon: <LayoutOutlined />, title: '画布设置', group: 'settings' },
    { tool: 'brush', icon: <EditOutlined />, title: '画笔工具', group: 'drawing' },
    { tool: 'rectangle', icon: <TableOutlined />, title: '矩形工具', group: 'drawing' },
    { tool: 'circle', icon: <CiCircleOutlined />, title: '圆形工具', group: 'drawing' },
    { tool: 'line', icon: <LineOutlined />, title: '直线工具', group: 'drawing' },
    { tool: 'polygon', icon: <HighlightOutlined />, title: '多边形工具', group: 'drawing' },
    { tool: 'path', icon: <EditOutlined rotate={45} />, title: '路径工具', group: 'drawing' },
    { tool: 'text', icon: <FontSizeOutlined />, title: '文本工具', group: 'drawing' },
    { tool: 'arrange', icon: <AppstoreOutlined />, title: '阵列排列', group: 'transform' },
    { tool: 'transform', icon: <ExpandOutlined />, title: '变形工具', group: 'transform' },
    { tool: 'color', icon: <BgColorsOutlined />, title: '颜色设置', group: 'settings' },
    { tool: 'view', icon: <EyeOutlined />, title: '视图选项', group: 'settings' },
    { tool: 'doorTemplate', icon: <FolderOutlined />, title: '门框模板', group: 'templates' },
  ];

  // 按分组组织工具
  const groupedTools: Record<string, typeof tools> = {};
  tools.forEach(tool => {
    const group = tool.group || 'other';
    if (!groupedTools[group]) {
      groupedTools[group] = [];
    }
    groupedTools[group].push(tool);
  });

  // 分组顺序
  const groupOrder = ['navigation', 'drawing', 'transform', 'settings', 'templates', 'other'];

  return (
    <div style={toolbarContainerStyle}>
      {groupOrder.map(group => {
        const toolsInGroup = groupedTools[group] || [];
        if (toolsInGroup.length === 0) return null;
        
        return (
          <React.Fragment key={group}>
            {toolsInGroup.map(toolInfo => (
              <ToolButton
                key={toolInfo.tool}
                tool={toolInfo.tool}
                icon={toolInfo.icon}
                title={toolInfo.title}
                isActive={activeTool === toolInfo.tool}
                onClick={() => setActiveTool(toolInfo.tool)}
              />
            ))}
            <Divider style={{ margin: '6px 0', borderColor: '#555' }} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Toolbar; 