import React from 'react';
import { Button, Tooltip } from 'antd';
import { UndoOutlined, RedoOutlined } from '@ant-design/icons';
import { useHistoryStore } from '../../store/historyStore';

const buttonStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#444',
  border: 'none',
  borderRadius: '4px',
  color: '#fff',
  margin: '4px 5px',
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#333',
  color: '#666',
  cursor: 'not-allowed',
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 0',
  backgroundColor: '#333',
  borderRight: '1px solid #222',
};

interface HistoryButtonsProps {
  onUndo: () => void;
  onRedo: () => void;
}

const HistoryButtons: React.FC<HistoryButtonsProps> = ({ onUndo, onRedo }) => {
  const { canUndo, canRedo } = useHistoryStore();
  
  return (
    <div style={containerStyle}>
      <Tooltip title="撤销 (Ctrl+Z)" placement="right">
        <Button
          icon={<UndoOutlined />}
          onClick={onUndo}
          disabled={!canUndo()}
          style={canUndo() ? buttonStyle : disabledButtonStyle}
        />
      </Tooltip>
      <Tooltip title="重做 (Ctrl+Y)" placement="right">
        <Button
          icon={<RedoOutlined />}
          onClick={onRedo}
          disabled={!canRedo()}
          style={canRedo() ? buttonStyle : disabledButtonStyle}
        />
      </Tooltip>
    </div>
  );
};

export default HistoryButtons; 