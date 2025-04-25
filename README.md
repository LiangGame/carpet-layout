# 网页版在线地毯排版工具 (Online Carpet Layout Tool)

一个专业的基于Web的地毯设计和排版工具，提供全面的矢量绘制、图案处理和色彩管理功能。

## 主要功能

- **画布系统**：支持自定义尺寸、缩放、平移和网格对齐
- **矢量绘制**：提供基础图形工具和节点编辑功能
- **图案处理**：支持线性和径向阵列排列
- **色彩系统**：提供材质库和Pantone色卡支持

## 技术栈

- React 18 + TypeScript
- 状态管理: Zustand
- 图形处理: Fabric.js, Paper.js, Konva
- 路由: React Router
- UI组件: 自定义组件 + 参数化设计工具(Leva)

## 开发设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
src/
├── components/     # UI组件
│   ├── canvas/     # 画布相关组件
│   ├── tools/      # 绘图工具组件
│   ├── pattern/    # 图案处理组件
│   └── color/      # 色彩管理组件
├── hooks/          # 自定义React Hooks
├── store/          # Zustand状态管理
├── utils/          # 工具函数
└── assets/         # 静态资源
```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
