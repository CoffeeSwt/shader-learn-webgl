import * as THREE from "three";

export class MaterialGenerator {
  public static createBasicMaterial(color: number) {
    return new THREE.MeshBasicMaterial({ color: color });
  }
  public static createShaderMaterial(
    vertexShader: string,
    fragmentShader: string,
    uniforms: { [uniform: string]: { value: any } }
  ) {
    return new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
    });
  }
}
