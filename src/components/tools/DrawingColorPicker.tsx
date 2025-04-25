import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { Typography, Input } from 'antd';

const { Text } = Typography;

interface DrawingColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

const DrawingColorPicker: React.FC<DrawingColorPickerProps> = ({ color, onChange, label }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <Text style={{ color: '#ddd', display: 'block', marginBottom: '8px' }}>{label}</Text>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            backgroundColor: color,
            border: '1px solid #555',
            marginRight: '8px',
            borderRadius: '2px'
          }} 
        />
        <Input 
          value={color} 
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '120px' }} 
        />
      </div>
      <HexColorPicker 
        color={color} 
        onChange={onChange} 
        className="small-color-picker" 
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default DrawingColorPicker; 