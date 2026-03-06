export interface PlanItem {
    type: 'camera' | 'guard' | 'barrier' | 'gate' | 'scanner' | 'water_barrier' | 'fence';
    pos: { x: number, y: number, z: number };
    scale?: { x: number, y: number, z: number };
    rotation?: { x: number, y: number, z: number };
    endPos?: { x: number, y: number, z: number }; // For line-based objects
    label: string;
    desc: string;
    time: number;
}

export interface CameraKeyframe {
    t: number;
    pos: { x: number, y: number, z: number };
    target: { x: number, y: number, z: number };
    label?: string;
    description?: string;
    thumbnail?: string; // Optional: dataURL or path
}

export interface AnimationSequence {
    name: string;
    duration: number;
    track: CameraKeyframe[];
}

export interface Plan {
    name: string;
    duration: number; // Deprecated, use sequence duration
    items: PlanItem[];
    cameraTrack: CameraKeyframe[]; // Default track
    sequences: AnimationSequence[]; // Multiple sequences
}

export interface Plans {
    [key: string]: Plan;
}
