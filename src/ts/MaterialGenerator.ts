import * as THREE from "three";
import { Uniform } from "./uniforms.ts";

export class MaterialGenerator {
  constructor() {}

  public static createBasicMaterial(color: number) {
    return new THREE.MeshBasicMaterial({ color: color });
  }
  public static createShaderMaterial(
    vertexShader: string,
    fragmentShader: string,
    uniforms: Record<string, Uniform<any>>
  ) {
    return new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
    });
  }
}
