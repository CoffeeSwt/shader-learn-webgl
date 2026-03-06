import { Component } from 'vue';
import TrafficPanel from '../panels/TrafficPanel.vue';
import VideoPanel from '../panels/VideoPanel.vue';
import InfoPanel from '../panels/InfoPanel.vue';
import PlanListPanel from '../panels/PlanListPanel.vue';
import CameraFeed from '../panels/CameraFeed.vue';
import GateFlow from '../panels/GateFlow.vue';
import EventInfo from '../panels/EventInfo.vue';

export const widgetRegistry: Record<string, Component> = {
    'traffic': TrafficPanel,
    'video': VideoPanel,
    'info': InfoPanel,
    'plan-list': PlanListPanel,
    'camera-feed': CameraFeed,
    'gate-flow': GateFlow,
    'event-info': EventInfo
};

export function getWidgetComponent(type: string): Component | null {
    return widgetRegistry[type] || null;
}
