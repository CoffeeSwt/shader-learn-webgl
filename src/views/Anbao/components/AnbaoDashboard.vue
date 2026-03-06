<template>
    <div class="dashboard-grid" :style="gridStyle">
        <component 
            v-for="widget in activeWidgets" 
            :key="widget.id"
            :is="getWidgetComponent(widget.type)"
            class="dashboard-widget"
            :style="getWidgetStyle(widget)"
            v-bind="widget.props"
            :dataSourceId="widget.dataSourceId"
            :title="widget.title"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePlans } from '../composables/usePlans';
import { useAnbaoState } from '../composables/useAnbaoState';
import { getWidgetComponent } from './dashboard/registry';
import { WidgetConfig, DashboardConfig } from '../types/dashboard';

const { plans, appliedPlanId, editingPlanId } = usePlans();
const { currentMode } = useAnbaoState();

const props = defineProps<{
    previewMode?: boolean;
    planId?: string;
}>();

// Default configuration matches the original hardcoded layout
const defaultDashboard: DashboardConfig = {
    widgets: [
        { 
            id: 'traffic', 
            type: 'traffic', 
            title: 'Traffic', 
            layout: { x: 1, y: 1, w: 1, h: 1 } 
        },
        { 
            id: 'video', 
            type: 'video', 
            title: 'Video', 
            layout: { x: 1, y: 2, w: 1, h: 1 } 
        },
        { 
            id: 'info', 
            type: 'info', 
            title: 'Info', 
            layout: { x: 3, y: 1, w: 1, h: 1 } 
        },
        { 
            id: 'plan-list', 
            type: 'plan-list', 
            title: 'Plans', 
            layout: { x: 3, y: 2, w: 1, h: 1 } 
        }
    ],
    grid: {
        columns: 3,
        rows: 2,
        gap: 20
    }
};

const currentDashboard = computed(() => {
    // Live preview in edit mode
    if (currentMode.value === 'edit' && editingPlanId.value && plans[editingPlanId.value]?.dashboard) {
        return plans[editingPlanId.value].dashboard!;
    }
    if (appliedPlanId.value && plans[appliedPlanId.value]?.dashboard) {
        return plans[appliedPlanId.value].dashboard!;
    }
    return defaultDashboard;
});

const activeWidgets = computed(() => currentDashboard.value.widgets);

const gridStyle = computed(() => {
    if (props.previewMode) {
        return {
            position: 'absolute' as const,
            bottom: '220px',
            left: '20px',
            width: '400px',
            height: '300px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            zIndex: 30,
            pointerEvents: 'auto' as const,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '10px',
            overflow: 'auto'
        };
    }

    const config = currentDashboard.value.grid || defaultDashboard.grid!;
    // If using the default 3-column layout logic (sidebar - content - sidebar)
    if (config.columns === 3) {
        return {
            gridTemplateColumns: '350px 1fr 350px',
            gridTemplateRows: '1fr 1fr',
            gap: `${config.gap}px`
        };
    }
    // Generic grid
    return {
        gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
        gridTemplateRows: `repeat(${config.rows}, 1fr)`,
        gap: `${config.gap}px`
    };
});

const getWidgetStyle = (widget: WidgetConfig) => {
    if (props.previewMode) {
        return {
            gridColumn: 'auto',
            gridRow: 'auto'
        };
    }
    return {
        gridColumn: `${widget.layout.x} / span ${widget.layout.w}`,
        gridRow: `${widget.layout.y} / span ${widget.layout.h}`
    };
};
</script>

<style scoped>
.dashboard-grid {
    flex: 1;
    display: grid;
    min-height: 0;
    pointer-events: none; /* Allow clicks to pass through to 3D scene */
    padding: 20px;
    box-sizing: border-box;
}

.dashboard-widget {
    pointer-events: auto; /* Re-enable clicks for widgets */
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
}
</style>
