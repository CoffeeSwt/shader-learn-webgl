<template>
    <div class="anbao-toast-container">
        <TransitionGroup name="toast">
            <ToastComponent
                v-for="toast in toasts"
                :key="toast.id"
                :message="toast.message"
                :type="toast.type"
                :duration="toast.duration"
                :title="toast.title"
                @close="remove(toast.id)"
            />
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import { useToast } from '../../composables/useToast';
import ToastComponent from './Toast.vue';

const { toasts, remove } = useToast();
</script>

<style scoped>
.anbao-toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    pointer-events: none; /* Container passes clicks through */
}

/* Transition Styles */
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}

.toast-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(30px);
}
</style>