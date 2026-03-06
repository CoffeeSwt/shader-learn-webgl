import { ref, computed } from 'vue';

const currentEditorTime = ref(0);
const isEditorPlaying = ref(false);
const editorStartTime = ref(0); // number

const formattedEditorTime = computed(() => {
    const t = currentEditorTime.value;
    const s = Math.floor(t);
    const ms = Math.floor((t - s) * 10);
    return `00:${s.toString().padStart(2, '0')}.${ms}`;
});

export function useEditorState() {
    return {
        currentEditorTime,
        isEditorPlaying,
        editorStartTime,
        formattedEditorTime
    };
}
