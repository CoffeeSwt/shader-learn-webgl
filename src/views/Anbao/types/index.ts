import { DashboardConfig } from './dashboard';

export interface DetailViewConfig {
    type: 'bar' | 'pie' | 'video' | 'info';
    title: string;
    dataSourceId?: string; // Optional: Bind to real-time data source
    staticData?: any;      // Optional: Static configuration/data
    url?: string; // Optional: URL for video or static content
}

export interface PlanItem {
    id?: string; // Unique identifier for binding
    type: string; // 'camera' | 'guard' | 'barrier' | 'gate' | 'scanner' | 'water_barrier' | 'fence';
    pos: { x: number, y: number, z: number };
    scale?: { x: number, y: number, z: number };
    rotation?: { x: number, y: number, z: number };
    endPos?: { x: number, y: number, z: number }; // For line-based objects
    label: string;
    desc: string;
    time: number;
    detailView?: DetailViewConfig;
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
    dashboard?: DashboardConfig; // Dynamic dashboard configuration
}

export interface Plans {
    [key: string]: Plan;
}
