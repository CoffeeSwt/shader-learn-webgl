# 分形艺术展示平台 🎨

一个基于WebGL技术的交互式分形艺术展示平台，通过实时渲染让用户探索分形几何的数学美学和艺术价值。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.5.21-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)
![Three.js](https://img.shields.io/badge/Three.js-0.180.0-orange.svg)

## 📖 项目简介

分形艺术展示平台是一个创新的教育和艺术平台，旨在通过交互式可视化降低分形学习门槛，推广分形艺术。平台提供了多种分形类型的实时渲染，包括Mandelbrot集、Julia集、分形树、Koch雪花等，用户可以通过直观的参数调节体验分形的无穷魅力。

### 🎯 核心价值

- **教育价值**：通过可视化帮助理解复杂的分形数学概念
- **艺术价值**：展示分形几何的视觉美学和艺术创作潜力
- **技术价值**：展示WebGL和着色器编程的强大能力
- **交互价值**：提供直观的参数调节和实时反馈体验

## 🚀 功能特性

### 🎨 分形渲染
- **实时WebGL渲染**：高性能的GPU加速分形计算
- **多种分形类型**：Mandelbrot集、Julia集、分形树、Koch雪花
- **动态参数调节**：实时调整迭代次数、缩放、颜色方案等
- **流畅交互**：支持鼠标缩放、拖拽、触摸手势

### 🎛️ 渲染模式
- **Shader模式**：使用GLSL着色器进行GPU计算
- **Canvas模式**：使用Canvas 2D API绘制分形树和雪花
- **几何模式**：使用Three.js几何体构建3D分形结构

### 🎨 视觉效果
- **多种颜色方案**：彩虹、火焰、海洋、森林等主题
- **动画效果**：平滑的参数过渡和动态变化
- **高质量渲染**：支持高分辨率和抗锯齿

### 🔧 交互控制
- **参数面板**：直观的滑块和数值输入控件
- **快捷操作**：重置视图、保存参数、分享作品
- **响应式设计**：适配桌面和移动设备

## 🛠️ 技术栈

### 前端框架
- **Vue 3.5.21** - 渐进式JavaScript框架
- **TypeScript 5.9.2** - 类型安全的JavaScript超集
- **Vite 6.3.6** - 快速的前端构建工具

### 渲染引擎
- **Three.js 0.180.0** - 3D图形库
- **WebGL** - 硬件加速的图形API
- **GLSL** - OpenGL着色器语言

### UI框架
- **UnoCSS 66.1.0** - 原子化CSS引擎
- **Vue Router 4.5.1** - Vue.js官方路由管理器
- **Pinia 3.0.3** - Vue.js状态管理库

### 工具库
- **Axios 1.12.2** - HTTP客户端库

## 📁 项目结构

```
shader-learn-webgl/
├── src/
│   ├── components/          # Vue组件
│   ├── views/              # 页面组件
│   │   ├── Trae/           # 主要分形展示页面
│   │   ├── FractalIntro.vue # 分形介绍页面
│   │   └── Home.vue        # 首页
│   ├── ts/                 # TypeScript核心模块
│   │   ├── BasicEngine.ts  # 渲染引擎核心
│   │   ├── CanvasFractalRenderer.ts # Canvas分形渲染器
│   │   ├── FractalGeometryGenerator.ts # 几何分形生成器
│   │   ├── BasicObjGenerator.ts # 基础对象生成器
│   │   ├── MaterialGenerator.ts # 材质生成器
│   │   └── uniforms.ts     # Uniform变量管理
│   ├── router/             # 路由配置
│   ├── store/              # 状态管理
│   ├── api/                # API接口
│   └── utils/              # 工具函数
├── public/                 # 静态资源
├── .trae/                  # 项目文档
│   └── documents/          # 需求和架构文档
└── package.json            # 项目配置
```

## 🔧 安装和运行

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 或 **yarn** >= 1.22.0
- 支持WebGL的现代浏览器

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/shader-learn-webgl.git
cd shader-learn-webgl
```

2. **安装依赖**
```bash
npm install
# 或使用 yarn
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或使用 yarn
yarn dev
```

4. **访问应用**
打开浏览器访问 `http://localhost:5173`

### 构建生产版本

```bash
npm run build
# 或使用 yarn
yarn build
```

构建完成后，生成的文件将在 `dist/` 目录中。

## 📖 使用说明

### 基础操作

1. **选择分形类型**
   - 在顶部导航栏选择不同的分形类型
   - 支持Julia集、Mandelbrot集、分形树、Koch雪花

2. **调节参数**
   - 使用右侧参数面板调节各种参数
   - 实时查看参数变化对分形的影响

3. **交互操作**
   - **鼠标滚轮**：缩放视图
   - **鼠标拖拽**：平移视图
   - **双击**：重置视图中心

### 高级功能

1. **渲染模式切换**
   - Shader模式：高性能GPU渲染
   - Canvas模式：传统2D绘制
   - 几何模式：3D几何体构建

2. **参数调节**
   - **迭代次数**：控制分形细节程度
   - **缩放级别**：调整视图缩放
   - **颜色方案**：选择不同的配色主题
   - **颜色强度**：调整颜色饱和度

3. **动画控制**
   - 启用/禁用参数动画
   - 调节动画速度
   - 设置循环模式

## 🔨 开发指南

### 添加新的分形类型

1. **创建着色器文件**
```glsl
// src/views/Trae/shaders/newFractal.glsl
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_center;
uniform float u_zoom;
uniform int u_maxIterations;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    uv = uv / u_zoom + u_center;
    
    // 在这里实现你的分形算法
    vec3 color = vec3(0.0);
    
    gl_FragColor = vec4(color, 1.0);
}
```

2. **在Trae.vue中注册**
```typescript
// 导入新的着色器
import newFractalShader from './shaders/newFractal.glsl?raw'

// 添加到着色器映射
const shaders = {
    // ... 现有着色器
    newFractal: newFractalShader
}

// 添加分形信息
const fractalInfos = {
    // ... 现有信息
    newFractal: {
        name: '新分形',
        description: '这是一个新的分形类型...'
    }
}
```

### 添加新的参数控制

1. **在uniforms.ts中定义**
```typescript
public uniforms = new UniformsManager({
    // ... 现有uniforms
    u_newParameter: new Uniform("f", 1.0),
});
```

2. **在UI中添加控制器**
```vue
<div class="control-group">
    <label>新参数</label>
    <input 
        type="range" 
        v-model="newParameter" 
        min="0" 
        max="10" 
        step="0.1"
        @input="updateUniforms"
    />
</div>
```

### 自定义颜色方案

在着色器中添加新的颜色计算函数：

```glsl
vec3 getColor(float t, int scheme) {
    if (scheme == 4) { // 新的颜色方案
        return vec3(
            sin(t * 6.28),
            sin(t * 6.28 + 2.09),
            sin(t * 6.28 + 4.18)
        ) * 0.5 + 0.5;
    }
    // ... 其他颜色方案
}
```

## 🔬 技术实现

### WebGL渲染管线

1. **顶点着色器**：处理屏幕四边形的顶点
2. **片段着色器**：计算每个像素的分形值
3. **Uniform传递**：将参数从JavaScript传递到着色器
4. **渲染循环**：使用requestAnimationFrame实现流畅动画

### 分形算法实现

#### Mandelbrot集
```glsl
vec2 mandelbrot(vec2 c) {
    vec2 z = vec2(0.0);
    for (int i = 0; i < MAX_ITERATIONS; i++) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
    }
    return z;
}
```

#### Julia集
```glsl
vec2 julia(vec2 z, vec2 c) {
    for (int i = 0; i < MAX_ITERATIONS; i++) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
    }
    return z;
}
```

### 性能优化

1. **GPU并行计算**：利用着色器的并行特性
2. **自适应精度**：根据缩放级别调整迭代次数
3. **视锥体裁剪**：只渲染可见区域
4. **缓存优化**：复用计算结果

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **报告Bug**：在Issues中描述问题
2. **功能建议**：提出新功能想法
3. **代码贡献**：提交Pull Request
4. **文档改进**：完善项目文档

### 开发流程

1. **Fork项目**到你的GitHub账户
2. **创建分支**：`git checkout -b feature/new-feature`
3. **提交更改**：`git commit -m "Add new feature"`
4. **推送分支**：`git push origin feature/new-feature`
5. **创建Pull Request**

### 代码规范

- 使用TypeScript进行类型检查
- 遵循Vue 3 Composition API最佳实践
- 保持代码简洁和可读性
- 添加适当的注释和文档

## 📄 许可证

本项目采用 [MIT许可证](LICENSE)。

## 🙏 致谢

- [Three.js](https://threejs.org/) - 强大的3D图形库
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [UnoCSS](https://unocss.dev/) - 即时原子化CSS引擎
- [Vite](https://vitejs.dev/) - 快速的前端构建工具

## 📞 联系我们

- **项目主页**：[GitHub Repository](https://github.com/your-username/shader-learn-webgl)
- **问题反馈**：[GitHub Issues](https://github.com/your-username/shader-learn-webgl/issues)
- **讨论交流**：[GitHub Discussions](https://github.com/your-username/shader-learn-webgl/discussions)

---

**让我们一起探索分形的无穷魅力！** ✨
