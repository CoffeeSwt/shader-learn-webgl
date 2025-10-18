import {
  BufferGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  Color,
  LineBasicMaterial,
  BufferAttribute,
  LineSegments,
  TubeGeometry,
  CatmullRomCurve3,
  MeshPhongMaterial,
  Quaternion,
} from "three";

export interface FractalTreeParams {
  depth: number;
  branchLength: number;
  branchRadius: number;
  branchAngle: number;
  branchCount: number;
  colorScheme: number;
  colorIntensity: number;
}

export interface KochSnowflakeParams {
  iterations: number;
  size: number;
  lineWidth: number;
  colorScheme: number;
  colorIntensity: number;
}

export class FractalGeometryGenerator {
  /**
   * 创建分形树几何体
   */
  static createFractalTree(params: FractalTreeParams): Group {
    const treeGroup = new Group();
    treeGroup.name = 'fractalTree';

    // 递归生成树枝
    this.generateTreeBranch(
      treeGroup,
      new Vector3(0, -2, 0), // 起始位置
      new Vector3(0, 1, 0),  // 初始方向
      params.branchLength,
      params.branchRadius,
      params.depth,
      params
    );

    return treeGroup;
  }

  /**
   * 递归生成树枝
   */
  private static generateTreeBranch(
    parent: Group,
    startPos: Vector3,
    direction: Vector3,
    length: number,
    radius: number,
    depth: number,
    params: FractalTreeParams
  ) {
    if (depth <= 0 || radius < 0.001) return;

    // 计算终点位置
    const endPos = startPos.clone().add(direction.clone().multiplyScalar(length));

    // 创建树枝几何体
    const branchGeometry = new CylinderGeometry(
      radius * 0.7, // 顶部半径
      radius,        // 底部半径
      length,        // 高度
      8              // 径向分段
    );

    // 根据深度和颜色方案设置材质
    const material = this.createTreeMaterial(depth, params.depth, params.colorScheme, params.colorIntensity);
    const branchMesh = new Mesh(branchGeometry, material);

    // 定位和旋转树枝
    const midPoint = startPos.clone().add(endPos).multiplyScalar(0.5);
    branchMesh.position.copy(midPoint);

    // 计算旋转
    const up = new Vector3(0, 1, 0);
    const quaternion = new Quaternion().setFromUnitVectors(up, direction.clone().normalize());
    branchMesh.setRotationFromQuaternion(quaternion);

    parent.add(branchMesh);

    // 生成子分支
    const newLength = length * (0.7 + Math.random() * 0.2); // 长度衰减
    const newRadius = radius * 0.7; // 半径衰减

    for (let i = 0; i < params.branchCount; i++) {
      // 计算分支角度
      const angleY = (i / params.branchCount) * Math.PI * 2; // 围绕Y轴的角度
      const angleX = params.branchAngle * (Math.PI / 180) * (0.8 + Math.random() * 0.4); // 向上的角度

      // 创建新的方向向量
      const newDirection = new Vector3(
        Math.sin(angleX) * Math.cos(angleY),
        Math.cos(angleX),
        Math.sin(angleX) * Math.sin(angleY)
      );

      // 将方向向量转换到当前分支的坐标系
      newDirection.applyQuaternion(quaternion);

      // 递归生成子分支
      this.generateTreeBranch(
        parent,
        endPos.clone(),
        newDirection,
        newLength,
        newRadius,
        depth - 1,
        params
      );
    }
  }

  /**
   * 创建树的材质
   */
  private static createTreeMaterial(currentDepth: number, maxDepth: number, colorScheme: number, intensity: number): MeshPhongMaterial {
    const depthRatio = currentDepth / maxDepth;
    let color: Color;

    switch (colorScheme) {
      case 0: // 自然树色
        color = new Color().lerpColors(
          new Color(0x8B4513), // 棕色树干
          new Color(0x228B22), // 绿色叶子
          1 - depthRatio
        );
        break;
      case 1: // 火焰树
        color = new Color().lerpColors(
          new Color(0x8B0000), // 深红
          new Color(0xFFD700), // 金黄
          1 - depthRatio
        );
        break;
      case 2: // 冰霜树
        color = new Color().lerpColors(
          new Color(0x4682B4), // 钢蓝
          new Color(0xF0F8FF), // 爱丽丝蓝
          1 - depthRatio
        );
        break;
      case 3: // 彩虹树
        const hue = (depthRatio + Date.now() * 0.0001) % 1;
        color = new Color().setHSL(hue, 0.8, 0.6);
        break;
      default:
        color = new Color(0x8B4513);
    }

    color.multiplyScalar(intensity);

    return new MeshPhongMaterial({
      color: color,
      shininess: 30,
      transparent: true,
      opacity: 0.9
    });
  }

  /**
   * 创建Koch雪花几何体
   */
  static createKochSnowflake(params: KochSnowflakeParams): Group {
    const snowflakeGroup = new Group();
    snowflakeGroup.name = 'kochSnowflake';

    // 初始三角形的三个顶点
    const size = params.size;
    const height = size * Math.sqrt(3) / 2;
    
    const points = [
      new Vector3(-size / 2, -height / 3, 0),
      new Vector3(size / 2, -height / 3, 0),
      new Vector3(0, height * 2 / 3, 0)
    ];

    // 为每条边生成Koch曲线
    for (let i = 0; i < 3; i++) {
      const start = points[i];
      const end = points[(i + 1) % 3];
      const kochPoints = this.generateKochCurve(start, end, params.iterations);
      
      // 创建线段几何体
      const lineGeometry = this.createLineGeometry(kochPoints);
      const material = this.createSnowflakeMaterial(params.colorScheme, params.colorIntensity);
      const line = new LineSegments(lineGeometry, material);
      
      snowflakeGroup.add(line);
    }

    return snowflakeGroup;
  }

  /**
   * 生成Koch曲线点
   */
  private static generateKochCurve(start: Vector3, end: Vector3, iterations: number): Vector3[] {
    let points = [start.clone(), end.clone()];

    for (let i = 0; i < iterations; i++) {
      const newPoints: Vector3[] = [];
      
      for (let j = 0; j < points.length - 1; j++) {
        const p1 = points[j];
        const p2 = points[j + 1];
        
        // 将线段分成三等分
        const oneThird = p1.clone().lerp(p2, 1/3);
        const twoThird = p1.clone().lerp(p2, 2/3);
        
        // 计算等边三角形的第三个点
        const direction = p2.clone().sub(p1);
        const perpendicular = new Vector3(-direction.z, direction.y, direction.x).normalize();
        const triangleHeight = direction.length() / (2 * Math.sqrt(3));
        const peak = oneThird.clone().lerp(twoThird, 0.5).add(perpendicular.multiplyScalar(triangleHeight));
        
        newPoints.push(p1.clone());
        newPoints.push(oneThird);
        newPoints.push(peak);
        newPoints.push(twoThird);
      }
      newPoints.push(points[points.length - 1].clone());
      points = newPoints;
    }

    return points;
  }

  /**
   * 创建线段几何体
   */
  private static createLineGeometry(points: Vector3[]): BufferGeometry {
    const geometry = new BufferGeometry();
    const vertices: number[] = [];
    
    for (let i = 0; i < points.length - 1; i++) {
      vertices.push(points[i].x, points[i].y, points[i].z);
      vertices.push(points[i + 1].x, points[i + 1].y, points[i + 1].z);
    }
    
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    return geometry;
  }

  /**
   * 创建雪花材质
   */
  private static createSnowflakeMaterial(colorScheme: number, intensity: number): LineBasicMaterial {
    let color: Color;

    switch (colorScheme) {
      case 0: // 经典白色
        color = new Color(0xFFFFFF);
        break;
      case 1: // 火焰色
        color = new Color(0xFF6B35);
        break;
      case 2: // 海洋色
        color = new Color(0x00CED1);
        break;
      case 3: // 彩虹色
        const hue = (Date.now() * 0.001) % 1;
        color = new Color().setHSL(hue, 0.8, 0.7);
        break;
      default:
        color = new Color(0xFFFFFF);
    }

    color.multiplyScalar(intensity);

    return new LineBasicMaterial({
      color: color,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
  }

  /**
   * 更新分形树参数
   */
  static updateFractalTree(treeGroup: Group, params: FractalTreeParams): void {
    // 清除现有的树
    treeGroup.clear();
    
    // 重新生成树
    this.generateTreeBranch(
      treeGroup,
      new Vector3(0, -2, 0),
      new Vector3(0, 1, 0),
      params.branchLength,
      params.branchRadius,
      params.depth,
      params
    );
  }

  /**
   * 更新Koch雪花参数
   */
  static updateKochSnowflake(snowflakeGroup: Group, params: KochSnowflakeParams): void {
    // 清除现有的雪花
    snowflakeGroup.clear();
    
    // 重新生成雪花
    const size = params.size;
    const height = size * Math.sqrt(3) / 2;
    
    const points = [
      new Vector3(-size / 2, -height / 3, 0),
      new Vector3(size / 2, -height / 3, 0),
      new Vector3(0, height * 2 / 3, 0)
    ];

    for (let i = 0; i < 3; i++) {
      const start = points[i];
      const end = points[(i + 1) % 3];
      const kochPoints = this.generateKochCurve(start, end, params.iterations);
      
      const lineGeometry = this.createLineGeometry(kochPoints);
      const material = this.createSnowflakeMaterial(params.colorScheme, params.colorIntensity);
      const line = new LineSegments(lineGeometry, material);
      
      snowflakeGroup.add(line);
    }
  }
}