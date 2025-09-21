import {
  Vector2,
  Vector3,
  Vector4,
  Color,
  Texture,
  Matrix3,
  Matrix4,
} from "three";

// 支持的 uniform 类型
type UniformType =
  | "f"
  | "i"
  | "b"
  | "v2"
  | "v3"
  | "v4"
  | "c"
  | "t"
  | "m3"
  | "m4";

// 根据 type 推导 value 类型
type UniformValue<T extends UniformType> = T extends "f" | "i"
  ? number
  : T extends "b"
  ? boolean
  : T extends "v2"
  ? Vector2
  : T extends "v3"
  ? Vector3
  : T extends "v4"
  ? Vector4
  : T extends "c"
  ? Color
  : T extends "t"
  ? Texture
  : T extends "m3"
  ? Matrix3
  : T extends "m4"
  ? Matrix4
  : never;

// Uniform 类
export class Uniform<T extends UniformType> {
  constructor(public type: T, private _value: UniformValue<T>) {}

  get value(): UniformValue<T> {
    return this._value;
  }

  set value(val: UniformValue<T>) {
    const current = this._value;

    // 对 Vector/Color/Matrix 类型，使用 set 方法更新
    if (current instanceof Vector2 && val instanceof Vector2) {
      current.set(val.x, val.y);
    } else if (current instanceof Vector3 && val instanceof Vector3) {
      current.set(val.x, val.y, val.z);
    } else if (current instanceof Vector4 && val instanceof Vector4) {
      current.set(val.x, val.y, val.z, val.w);
    } else if (current instanceof Color && val instanceof Color) {
      current.set(val.r, val.g, val.b);
    } else if (current instanceof Matrix3 && val instanceof Matrix3) {
      current.set(...val.elements);
    } else if (current instanceof Matrix4 && val instanceof Matrix4) {
      current.set(...val.elements);
    } else {
      // number, boolean, Texture 直接赋值
      this._value = val;
    }
  }
}

// Uniforms 管理类
export class UniformsManager<U extends Record<string, Uniform<any>>> {
  constructor(private uniforms: U) {}

  get<K extends keyof U>(key: K): U[K]["value"] {
    return this.uniforms[key].value;
  }

  set<K extends keyof U>(key: K, value: U[K]["value"]) {
    this.uniforms[key].value = value;
  }

  getUniformObject(): U {
    return this.uniforms;
  }
}
