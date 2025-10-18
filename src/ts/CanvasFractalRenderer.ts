// Canvas分形渲染器类
// 用于渲染分形树和Koch雪花

export interface FractalTreeCanvasParams {
  angle: number;           // 分支角度 (弧度)
  branchRatio: number;     // 分支长度比例
  maxDepth: number;        // 最大递归深度
  thickness: number;       // 线条粗细
  colorScheme: string;     // 颜色方案
  colorIntensity: number;  // 颜色强度
}

export interface KochSnowflakeCanvasParams {
  iterations: number;      // 迭代次数
  size: number;           // 雪花大小
  thickness: number;      // 线条粗细
  colorScheme: string;    // 颜色方案
  colorIntensity: number; // 颜色强度
}

export interface Point {
  x: number;
  y: number;
}

export class CanvasFractalRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number = 3.5; // 增加初始缩放比例，让分形树更清晰可见
  private offsetX: number = 0;
  private offsetY: number = 0;
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private onRedrawCallback: (() => void) | null = null; // 重新渲染回调

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法获取Canvas 2D上下文');
    }
    this.ctx = context;
    this.setupCanvas();
    this.setupEventListeners();
    
    // 确保Canvas完全初始化后再允许渲染
    // 使用requestAnimationFrame确保DOM更新完成
    requestAnimationFrame(() => {
      this.setupCanvas(); // 再次设置Canvas尺寸，确保正确
    });
  }

  private setupCanvas(): void {
    // 设置Canvas尺寸
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // 设置Canvas样式
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  private setupEventListeners(): void {
    // 鼠标拖拽
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        // 拖拽时重新渲染
        this.triggerRedraw();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });

    // 滚轮缩放
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale *= zoomFactor;
      this.scale = Math.max(0.1, Math.min(10, this.scale)); // 限制缩放范围
      // 缩放后重新渲染
      this.triggerRedraw();
    });
  }

  // 设置重新渲染回调
  public setRedrawCallback(callback: () => void): void {
    this.onRedrawCallback = callback;
  }

  // 触发重新渲染
  private triggerRedraw(): void {
    if (this.onRedrawCallback) {
      this.onRedrawCallback();
    }
  }

  public reset(): void {
    this.scale = 3.5; // 重置为新的初始缩放比例
    this.offsetX = 0;
    this.offsetY = 0;
    // 重置后重新渲染
    this.triggerRedraw();
  }

  public clear(): void {
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 填充不透明的背景色，确保完全覆盖WebGL内容
    this.ctx.fillStyle = '#0a0a0a'; // 深色背景，与应用主题一致
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private applyTransform(): void {
    this.ctx.save();
    this.ctx.translate(this.canvas.clientWidth / 2 + this.offsetX, this.canvas.clientHeight / 2 + this.offsetY);
    this.ctx.scale(this.scale, this.scale);
  }

  private restoreTransform(): void {
    this.ctx.restore();
  }

  private getColorFromScheme(scheme: string, intensity: number, depth: number = 0): string {
    const alpha = Math.min(1, intensity);
    
    switch (scheme) {
      case 'rainbow':
        const hue = (depth * 30) % 360;
        return `hsla(${hue}, 70%, 50%, ${alpha})`;
      
      case 'fire':
        const fireColors = ['#ff0000', '#ff4500', '#ffa500', '#ffff00'];
        const colorIndex = depth % fireColors.length;
        return fireColors[colorIndex] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      
      case 'ocean':
        const oceanColors = ['#000080', '#0066cc', '#0099ff', '#00ccff'];
        const oceanIndex = depth % oceanColors.length;
        return oceanColors[oceanIndex] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      
      case 'forest':
        const forestColors = ['#006400', '#228b22', '#32cd32', '#90ee90'];
        const forestIndex = depth % forestColors.length;
        return forestColors[forestIndex] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      
      default:
        return `rgba(255, 255, 255, ${alpha})`;
    }
  }

  public drawFractalTree(params: FractalTreeCanvasParams): void {
    this.clear();
    this.applyTransform();

    const startX = 0;
    const startY = 30; // 进一步调整起始位置，适应新的缩放比例
    const initialLength = 25; // 大幅减小初始长度，适应3.5倍缩放
    const initialAngle = -Math.PI / 2; // 向上

    this.drawTreeBranch(
      startX, startY,
      initialLength,
      initialAngle,
      params.maxDepth,
      params,
      0
    );

    this.restoreTransform();
  }

  private drawTreeBranch(
    x: number, y: number,
    length: number,
    angle: number,
    depth: number,
    params: FractalTreeCanvasParams,
    currentDepth: number
  ): void {
    if (depth <= 0 || length < 1) return;

    // 计算终点
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    // 设置线条样式
    this.ctx.strokeStyle = this.getColorFromScheme(params.colorScheme, params.colorIntensity, currentDepth);
    this.ctx.lineWidth = params.thickness * (depth / params.maxDepth);

    // 绘制分支
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // 递归绘制子分支
    const newLength = length * params.branchRatio;
    const leftAngle = angle - params.angle;
    const rightAngle = angle + params.angle;

    this.drawTreeBranch(endX, endY, newLength, leftAngle, depth - 1, params, currentDepth + 1);
    this.drawTreeBranch(endX, endY, newLength, rightAngle, depth - 1, params, currentDepth + 1);
  }

  public drawKochSnowflake(params: KochSnowflakeCanvasParams): void {
    this.clear();
    this.applyTransform();

    // 创建等边三角形的三个顶点
    const size = params.size;
    const height = size * Math.sqrt(3) / 2;
    
    const points: Point[] = [
      { x: -size / 2, y: height / 3 },      // 左下
      { x: size / 2, y: height / 3 },       // 右下
      { x: 0, y: -2 * height / 3 }          // 顶部
    ];

    // 设置线条样式
    this.ctx.strokeStyle = this.getColorFromScheme(params.colorScheme, params.colorIntensity);
    this.ctx.lineWidth = params.thickness;

    // 绘制三条边的Koch曲线
    for (let i = 0; i < 3; i++) {
      const start = points[i];
      const end = points[(i + 1) % 3];
      this.drawKochLine(start, end, params.iterations);
    }

    this.restoreTransform();
  }

  private drawKochLine(start: Point, end: Point, iterations: number): void {
    if (iterations === 0) {
      // 基础情况：绘制直线
      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.stroke();
      return;
    }

    // 计算三等分点
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    const p1: Point = {
      x: start.x + dx / 3,
      y: start.y + dy / 3
    };
    
    const p2: Point = {
      x: start.x + 2 * dx / 3,
      y: start.y + 2 * dy / 3
    };

    // 计算等边三角形的顶点
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const height = Math.sqrt(3) / 6 * Math.sqrt(dx * dx + dy * dy);
    
    const peak: Point = {
      x: midX - height * dy / Math.sqrt(dx * dx + dy * dy),
      y: midY + height * dx / Math.sqrt(dx * dx + dy * dy)
    };

    // 递归绘制四条线段
    this.drawKochLine(start, p1, iterations - 1);
    this.drawKochLine(p1, peak, iterations - 1);
    this.drawKochLine(peak, p2, iterations - 1);
    this.drawKochLine(p2, end, iterations - 1);
  }

  public resize(): void {
    this.setupCanvas();
  }

  public dispose(): void {
    // 清理事件监听器
    this.canvas.removeEventListener('mousedown', () => {});
    this.canvas.removeEventListener('mousemove', () => {});
    this.canvas.removeEventListener('mouseup', () => {});
    this.canvas.removeEventListener('mouseleave', () => {});
    this.canvas.removeEventListener('wheel', () => {});
  }
}