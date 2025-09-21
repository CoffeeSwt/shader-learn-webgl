import { Uniform } from "@/types/uniforms.ts";
import {
  BoxGeometry,
  Color,
  Mesh,
  Vector3,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
} from "three";

export class BasicObjGenerator {
  constructor() {}
  public static createBasicBox(
    size: Vector3,
    color: Color,
    position: Vector3
  ): Mesh {
    const box = new BoxGeometry(size.x, size.y, size.z);
    const material = new MeshBasicMaterial({ color: color });
    const mesh = new Mesh(box, material);
    mesh.position.set(position.x, position.y, position.z);
    return mesh;
  }

  public static createPlane(
    width: number,
    height: number,
    color: Color,
    position: Vector3
  ): Mesh {
    const mesh = new PlaneGeometry(width, height);
    const material = new MeshBasicMaterial({ color: color, side: 2 });
    const plane = new Mesh(mesh, material);
    plane.position.set(position.x, position.y, position.z);
    return plane;
  }

  public static createScreenShaderPlane(
    vertexShader: string,
    fragmentShader: string,
    uniforms: Record<string, Uniform<any>>
  ): Mesh {
    const mesh = new PlaneGeometry(2, 2);
    const material = new ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
    });
    const plane = new Mesh(mesh, material);
    plane.position.set(0, 0, 0);
    return plane;
  }
}
