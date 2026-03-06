export interface WidgetConfig {
    id: string;
    type: string;
    title: string;
    layout: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    props?: Record<string, any>;
    dataSourceId?: string;
    // Optional binding to a specific plan item
    binding?: {
        targetId?: string; // The ID of the plan item (we might need to add ID to PlanItem)
        sourceType?: 'camera' | 'sensor' | 'data';
    };
}

export interface DashboardConfig {
    widgets: WidgetConfig[];
    grid?: {
        columns: number;
        rows: number;
        gap: number;
    };
}

// Registry interface for component mapping
import { Component } from 'vue';

export interface WidgetRegistryItem {
    component: Component;
    defaultProps?: Record<string, any>;
    label: string;
}
