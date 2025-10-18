import {
  Clock,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
  TextureLoader,
  Texture,
  type Camera,
  Group,
  DirectionalLight,
  AmbientLight,
} from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { Uniform, UniformsManager } from "@/ts/uniforms.ts";
import { CanvasFractalRenderer, FractalTreeCanvasParams, KochSnowflakeCanvasParams } from "@/ts/CanvasFractalRenderer.ts";

export class BasicEngine {
  public domElement: HTMLDivElement | null = null;
  public renderer: WebGLRenderer = new WebGLRenderer({ antialias: true });
  public camera: Camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  public scene: Scene = new Scene();
  public clock: Clock = new Clock();
  public mousePosition: Vector2 = new Vector2(); // offset 坐标
  public mousePositionSTD: Vector2 = new Vector2(); // [0,1]
  public mousePositionNDC: Vector2 = new Vector2(); // [-1,1]
  private resizeObserver: ResizeObserver | null = null;
  public controls: OrbitControls | null = null; // 以后可能会用到轨道控制器
  public zoomFactor: number = 3.5;
  
  // 几何体渲染模式相关
  public isGeometryMode: boolean = false;
  private directionalLight: DirectionalLight | null = null;
  private ambientLight: AmbientLight | null = null;
  
  // Canvas渲染模式相关
  public isCanvasMode: boolean = false;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasFractalRenderer: CanvasFractalRenderer | null = null;
  private currentCanvasFractalType: 'fractalTree' | 'kochSnowflake' | null = null;
  private currentCanvasFractalParams: FractalTreeCanvasParams | KochSnowflakeCanvasParams | null = null;
  
  // 拖拽相关状态
  private isDragging: boolean = false;
  private lastMousePosition: Vector2 = new Vector2();
  private currentCenter: Vector2 = new Vector2(0, 0);

  public uniforms = new UniformsManager({
    u_time: new Uniform("f", 0),
    u_resolution: new Uniform("v2", new Vector2()),
    u_mouse: new Uniform("v2", new Vector2()),
    u_zoom: new Uniform("f", 3.5),
    u_maxIterations: new Uniform("i", 200),
    u_center: new Uniform("v2", new Vector2(0, 0)),
    u_colorScheme: new Uniform("i", 0),
    u_colorIntensity: new Uniform("f", 1.0),
    u_juliaC: new Uniform("v2", new Vector2(-0.7, 0.27015)),
    iChannel0: new Uniform("t", new Texture()),
  });

  constructor() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  public init(domElement: HTMLDivElement) {
    this.domElement = domElement;
    this.resize();
    this.domElement.appendChild(this.renderer.domElement);
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);

    const resizeObserver = new ResizeObserver(() => this.resize());
    resizeObserver.observe(this.domElement);
    this.resizeObserver = resizeObserver;

    // 鼠标监听
    this.domElement.addEventListener("pointerdown", (e: PointerEvent) => {
      this.isDragging = true;
      const rect = this.domElement!.getBoundingClientRect();
      this.lastMousePosition.set(e.offsetX, e.offsetY);
      this.domElement!.setPointerCapture(e.pointerId);
    });

    this.domElement.addEventListener("pointermove", (e: PointerEvent) => {
      const rect = this.domElement!.getBoundingClientRect();
      this.mousePosition.set(e.offsetX, e.offsetY);
      this.mousePositionSTD.set(
        e.offsetX / rect.width,
        e.offsetY / rect.height
      );
      this.mousePositionNDC.set(
        (e.offsetX / rect.width) * 2 - 1,
        -(e.offsetY / rect.height) * 2 + 1
      );
      this.uniforms.set("u_mouse", this.mousePosition);

      // 处理拖拽平移
      if (this.isDragging) {
        const deltaX = e.offsetX - this.lastMousePosition.x;
        const deltaY = e.offsetY - this.lastMousePosition.y;
        
        // 改进的拖拽灵敏度算法：缩放越大，拖拽越精细
        const sensitivity = 1 / this.zoomFactor / rect.width * 4;
        
        this.currentCenter.x -= deltaX * sensitivity;
        this.currentCenter.y += deltaY * sensitivity; // Y轴反向
        
        this.uniforms.set("u_center", this.currentCenter.clone());
        this.lastMousePosition.set(e.offsetX, e.offsetY);
      }
    });

    this.domElement.addEventListener("pointerup", (e: PointerEvent) => {
      this.isDragging = false;
      this.domElement!.releasePointerCapture(e.pointerId);
    });

    //初始化controls
    this.controls = new OrbitControls(
      this.camera as PerspectiveCamera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true;

    // 缩放监听（滚轮）
    this.domElement.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        e.preventDefault();
        const factor = Math.exp(e.deltaY * 0.0005);
        this.zoomFactor = Math.min(100000, Math.max(0.01, this.zoomFactor * factor));
        this.uniforms.set("u_zoom", this.zoomFactor);
      },
      { passive: false }
    );
  }

  private resize() {
    if (!this.domElement) return;
    
    // WebGL渲染器调整大小
    this.renderer.setSize(
      this.domElement.offsetWidth,
      this.domElement.offsetHeight
    );
    (this.camera as PerspectiveCamera).aspect =
      this.domElement.offsetWidth / this.domElement.offsetHeight;
    (this.camera as PerspectiveCamera).updateProjectionMatrix();

    // 使用 canvas 的实际尺寸，与 gl_FragCoord 保持一致
    const canvas = this.renderer.domElement;
    this.uniforms.set(
      "u_resolution",
      new Vector2(canvas.width, canvas.height)
    );

    // Canvas渲染器调整大小
    if (this.isCanvasMode) {
      this.resizeCanvas();
    }
  }

  private render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.uniforms.set("u_time", elapsedTime);

    this.controls?.update();

    this.renderer.render(this.scene, this.camera);
  }

  public addObj(object: Mesh) {
    this.scene.add(object);
  }

  public getUniforms() {
    return this.uniforms.getUniformObject();
  }

  public removeObj(object: Mesh) {
    this.scene.remove(object);
  }

  public getObjectByName(name: string): Mesh | undefined {
    return this.scene.getObjectByName(name) as Mesh;
  }

  public getObjectsByUUID(uuid: string): Mesh | undefined {
    return this.scene.getObjectByProperty("uuid", uuid) as Mesh;
  }

  public resetCenter() {
    this.currentCenter.set(0, 0);
    this.uniforms.set("u_center", this.currentCenter.clone());
  }

  public dispose() {
    // 清理Canvas渲染器
    if (this.isCanvasMode) {
      this.cleanupCanvasRenderer();
    }
    
    this.renderer.dispose();
    this.scene.clear();
    // 重置拖拽状态
    this.isDragging = false;
    this.domElement?.removeChild(this.renderer.domElement);
    this.domElement = null;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  public animate = () => {
    requestAnimationFrame(this.animate);
    this.render();
  };

  /**
   * 切换到几何体渲染模式
   */
  public enableGeometryMode() {
    this.isGeometryMode = true;
    this.setupLighting();
    this.setupGeometryCamera();
  }

  /**
   * 切换到着色器渲染模式
   */
  public disableGeometryMode() {
    this.isGeometryMode = false;
    this.removeLighting();
    this.setupShaderCamera();
  }

  /**
   * 设置几何体渲染所需的光照
   */
  private setupLighting() {
    // 移除现有光照
    this.removeLighting();

    // 添加环境光
    this.ambientLight = new AmbientLight(0x404040, 0.6);
    this.scene.add(this.ambientLight);

    // 添加方向光
    this.directionalLight = new DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(5, 5, 5);
    this.directionalLight.castShadow = true;
    this.scene.add(this.directionalLight);
  }

  /**
   * 移除光照
   */
  private removeLighting() {
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
      this.ambientLight = null;
    }
    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
      this.directionalLight = null;
    }
  }

  /**
   * 设置几何体模式的相机
   */
  private setupGeometryCamera() {
    const camera = this.camera as PerspectiveCamera;
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    
    if (this.controls) {
      this.controls.enabled = true;
      this.controls.enableZoom = true;
      this.controls.enableRotate = true;
      this.controls.enablePan = true;
      this.controls.reset();
    }
  }

  /**
   * 设置着色器模式的相机
   */
  private setupShaderCamera() {
    const camera = this.camera as PerspectiveCamera;
    camera.position.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    
    if (this.controls) {
      this.controls.enabled = false;
    }
  }

  /**
   * 添加几何体对象（Group或Mesh）
   */
  public addGeometry(object: Group | Mesh) {
    this.scene.add(object);
  }

  /**
   * 移除几何体对象
   */
  public removeGeometry(object: Group | Mesh) {
    this.scene.remove(object);
  }

  /**
   * 根据名称获取几何体对象
   */
  public getGeometryByName(name: string): Group | Mesh | undefined {
    return this.scene.getObjectByName(name) as Group | Mesh;
  }

  /**
   * 清除所有几何体对象
   */
  public clearGeometry() {
    const objectsToRemove: (Group | Mesh)[] = [];
    this.scene.traverse((child) => {
      if (child instanceof Group || child instanceof Mesh) {
        if (child.name === 'fractalTree' || child.name === 'kochSnowflake') {
          objectsToRemove.push(child);
        }
      }
    });
    
    objectsToRemove.forEach(obj => this.scene.remove(obj));
  }

  /**
   * 启用Canvas渲染模式
   */
  public enableCanvasMode() {
    this.isCanvasMode = true;
    this.isGeometryMode = false;
    
    // 清除WebGL画布内容
    this.clearWebGLCanvas();
    
    this.setupCanvasRenderer();
    this.hideWebGLRenderer();
  }

  /**
   * 禁用Canvas渲染模式
   */
  public disableCanvasMode() {
    this.isCanvasMode = false;
    
    // 彻底清理Canvas渲染器
    this.cleanupCanvasRenderer();
    
    // 重置Canvas相关状态
    this.currentCanvasFractalType = null;
    this.currentCanvasFractalParams = null;
    
    // 显示WebGL渲染器
    this.showWebGLRenderer();
    
    // 强制立即渲染WebGL内容，确保正确显示
    requestAnimationFrame(() => {
      this.render();
    });
  }

  /**
   * 设置Canvas渲染器
   */
  private setupCanvasRenderer() {
    if (!this.domElement) return;

    // 创建Canvas元素
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.style.position = 'absolute';
    this.canvasElement.style.top = '0';
    this.canvasElement.style.left = '0';
    this.canvasElement.style.width = '100%';
    this.canvasElement.style.height = '100%';
    this.canvasElement.style.zIndex = '1';
    this.canvasElement.style.backgroundColor = '#0a0a0a'; // 设置不透明背景色，确保完全覆盖WebGL内容
    
    // 设置Canvas大小
    const rect = this.domElement.getBoundingClientRect();
    this.canvasElement.width = rect.width;
    this.canvasElement.height = rect.height;
    this.canvasElement.style.width = rect.width + 'px';
    this.canvasElement.style.height = rect.height + 'px';

    // 添加到DOM
    this.domElement.appendChild(this.canvasElement);

    // 创建Canvas分形渲染器
    this.canvasFractalRenderer = new CanvasFractalRenderer(this.canvasElement);
    
    // 设置重新渲染回调，用于缩放和拖拽后重新绘制
    this.canvasFractalRenderer.setRedrawCallback(() => {
      this.redrawCanvasFractal();
    });
    
    // 确保Canvas渲染器完全初始化后，触发首次渲染
    // 使用双重requestAnimationFrame确保DOM和Canvas都完全准备好
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 如果已经有待渲染的分形，立即渲染
        if (this.currentCanvasFractalType && this.currentCanvasFractalParams) {
          this.redrawCanvasFractal();
        }
      });
    });
  }

  /**
   * 清理Canvas渲染器
   */
  private cleanupCanvasRenderer() {
    if (this.canvasFractalRenderer) {
      this.canvasFractalRenderer.dispose();
      this.canvasFractalRenderer = null;
    }

    if (this.canvasElement && this.domElement) {
      // 确保Canvas元素完全从DOM中移除
      try {
        this.domElement.removeChild(this.canvasElement);
      } catch (e) {
        // 如果元素已经被移除，忽略错误
        console.warn('Canvas element already removed from DOM');
      }
      this.canvasElement = null;
    }
    
    // 强制清理可能残留的Canvas元素
    if (this.domElement) {
      const existingCanvases = this.domElement.querySelectorAll('canvas');
      existingCanvases.forEach(canvas => {
        if (canvas !== this.renderer.domElement) {
          try {
            this.domElement!.removeChild(canvas);
          } catch (e) {
            // 忽略移除错误
          }
        }
      });
    }
  }

  /**
   * 隐藏WebGL渲染器
   */
  private hideWebGLRenderer() {
    this.renderer.domElement.style.display = 'none';
  }

  /**
   * 显示WebGL渲染器
   */
  private showWebGLRenderer() {
    this.renderer.domElement.style.display = 'block';
  }

  /**
   * 清除WebGL画布内容
   */
  private clearWebGLCanvas() {
    // 只清除着色器平面对象，保留其他可能的场景元素
    const objectsToRemove: Mesh[] = [];
    this.scene.traverse((child) => {
      if (child instanceof Mesh && child.material && 'uniforms' in child.material) {
        objectsToRemove.push(child);
      }
    });
    
    objectsToRemove.forEach(obj => this.scene.remove(obj));
    
    // 清除渲染器缓冲区
    this.renderer.clear();
  }

  /**
   * 绘制分形树
   */
  public drawCanvasFractalTree(params: FractalTreeCanvasParams) {
    if (this.canvasFractalRenderer) {
      this.currentCanvasFractalType = 'fractalTree';
      this.currentCanvasFractalParams = params;
      
      // 确保Canvas完全准备好后再绘制
      requestAnimationFrame(() => {
        if (this.canvasFractalRenderer) {
          this.canvasFractalRenderer.drawFractalTree(params);
        }
      });
    }
  }

  /**
   * 绘制Koch雪花
   */
  public drawCanvasKochSnowflake(params: KochSnowflakeCanvasParams) {
    if (this.canvasFractalRenderer) {
      this.currentCanvasFractalType = 'kochSnowflake';
      this.currentCanvasFractalParams = params;
      
      // 确保Canvas完全准备好后再绘制
      requestAnimationFrame(() => {
        if (this.canvasFractalRenderer) {
          this.canvasFractalRenderer.drawKochSnowflake(params);
        }
      });
    }
  }

  /**
   * 重新绘制当前Canvas分形（用于缩放和拖拽后的重新渲染）
   */
  private redrawCanvasFractal() {
    if (!this.canvasFractalRenderer || !this.currentCanvasFractalType || !this.currentCanvasFractalParams) {
      return;
    }

    if (this.currentCanvasFractalType === 'fractalTree') {
      this.canvasFractalRenderer.drawFractalTree(this.currentCanvasFractalParams as FractalTreeCanvasParams);
    } else if (this.currentCanvasFractalType === 'kochSnowflake') {
      this.canvasFractalRenderer.drawKochSnowflake(this.currentCanvasFractalParams as KochSnowflakeCanvasParams);
    }
  }

  /**
   * 重置Canvas视图
   */
  public resetCanvasView() {
    if (this.canvasFractalRenderer) {
      this.canvasFractalRenderer.reset();
    }
  }

  /**
   * 调整Canvas大小
   */
  public resizeCanvas() {
    if (this.canvasFractalRenderer && this.canvasElement && this.domElement) {
      const rect = this.domElement.getBoundingClientRect();
      this.canvasElement.width = rect.width;
      this.canvasElement.height = rect.height;
      this.canvasElement.style.width = rect.width + 'px';
      this.canvasElement.style.height = rect.height + 'px';
      this.canvasFractalRenderer.resize();
    }
  }
}
