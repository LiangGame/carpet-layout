import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd';
import 'antd/dist/reset.css'; // 导入Ant Design样式
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#4a90e2',
          colorBgBase: '#333',
        },
        components: {
          Button: {
            colorPrimaryHover: '#5c9ce6',
          },
          Input: {
            colorBgContainer: '#444',
            colorBorder: '#555',
          },
          Select: {
            colorBgContainer: '#444',
            colorBorder: '#555',
          },
          Tabs: {
            colorBgContainer: '#444',
          },
          Card: {
            colorBgContainer: '#444',
          },
          Modal: {
            colorBgElevated: '#444',
          },
          Checkbox: {
            colorBgContainer: '#444',
          },
        }
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
