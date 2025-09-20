import {
  Clock,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
  type Camera,
} from "three";

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

  public uniforms = {
    time: { value: 0.0 },
    mouse: { value: new Vector2(0.0, 0.0) },
    resolution: {
      value: new Vector2(window.innerWidth, window.innerHeight),
    },
  };

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

      this.uniforms.mouse.value.copy(this.mousePositionSTD);
    });
  }

  private resize() {
    if (!this.domElement) return;
    this.renderer.setSize(
      this.domElement.offsetWidth,
      this.domElement.offsetHeight
    );
    (this.camera as PerspectiveCamera).aspect =
      this.domElement.offsetWidth / this.domElement.offsetHeight;
    (this.camera as PerspectiveCamera).updateProjectionMatrix();

    this.uniforms.resolution.value.set(
      this.domElement.offsetWidth,
      this.domElement.offsetHeight
    );
  }

  private render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.uniforms.time.value = elapsedTime;

    this.renderer.render(this.scene, this.camera);
  }

  public addObj(object: Mesh) {
    this.scene.add(object);
  }

  public dispose() {
    this.renderer.dispose();
    this.scene.clear();
    this.domElement?.removeEventListener("pointermove", () => {});
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
}
