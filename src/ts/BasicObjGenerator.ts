import { BoxGeometry, Color, Mesh, Vector3, MeshBasicMaterial } from "three";

export class BasicObjGenerator {
  constructor() {}
  public static createBasicBox(
    size: Vector3,
    color: Color,
    position: Vector3
  ): Mesh {
    const mesh = new Mesh(
      new BoxGeometry(size.x, size.y, size.z),
      new MeshBasicMaterial({ color: color })
    );
    mesh.position.set(position.x, position.y, position.z);
    return mesh;
  }
}
