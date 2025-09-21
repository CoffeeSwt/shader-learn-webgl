import {
  Clock,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
  type Camera,
} from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { Uniform, UniformsManager } from "@/ts/uniforms.ts";

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

  public uniforms = new UniformsManager({
    u_time: new Uniform("f", 0),
    u_resolution: new Uniform("v2", new Vector2()),
    u_mouse: new Uniform("v2", new Vector2()),
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
    });

    //初始化controls
    this.controls = new OrbitControls(
      this.camera as PerspectiveCamera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true;
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

    this.uniforms.set(
      "u_resolution",
      new Vector2(this.domElement.offsetWidth, this.domElement.offsetHeight)
    );
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
