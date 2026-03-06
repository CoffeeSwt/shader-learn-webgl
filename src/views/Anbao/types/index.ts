export interface PlanItem {
    type: 'camera' | 'guard' | 'barrier';
    pos: { x: number, y: number, z: number };
    label: string;
    desc: string;
    time: number;
}

export interface CameraKeyframe {
    t: number;
    pos: { x: number, y: number, z: number };
    target: { x: number, y: number, z: number };
}

export interface Plan {
    name: string;
    duration: number;
    items: PlanItem[];
    cameraTrack: CameraKeyframe[];
}

export interface Plans {
    [key: string]: Plan;
}
