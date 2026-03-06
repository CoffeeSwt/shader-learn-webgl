import { ref } from 'vue';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    title?: string;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
    const add = (message: string, type: Toast['type'] = 'info', duration = 3000, title?: string) => {
        const id = nextId++;
        const toast: Toast = { id, message, type, duration, title };
        toasts.value.push(toast);

        if (duration > 0) {
            setTimeout(() => {
                remove(id);
            }, duration);
        }
    };

    const remove = (id: number) => {
        const index = toasts.value.findIndex(t => t.id === id);
        if (index !== -1) {
            toasts.value.splice(index, 1);
        }
    };

    return {
        toasts,
        success: (msg: string, duration = 3000, title?: string) => add(msg, 'success', duration, title),
        error: (msg: string, duration = 4000, title?: string) => add(msg, 'error', duration, title),
        warning: (msg: string, duration = 3000, title?: string) => add(msg, 'warning', duration, title),
        info: (msg: string, duration = 3000, title?: string) => add(msg, 'info', duration, title),
        remove
    };
}