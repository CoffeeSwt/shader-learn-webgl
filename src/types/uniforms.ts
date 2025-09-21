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
export type UniformType =
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

// 根据 type 推导 value 的类型
export type UniformValue<T extends UniformType> = T extends "f"
  ? number
  : T extends "i"
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

// 单个 uniform 定义
export interface Uniform<T extends UniformType = UniformType> {
  type: T;
  value: UniformValue<T>;
}

// 可自由扩展的 uniforms 对象
export type UniformsMap = Record<string, Uniform>;
