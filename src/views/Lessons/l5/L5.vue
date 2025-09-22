<template>
    <div w-screen h-screen ref="canvasTarget">
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { BasicEngine } from "@/ts/BasicEngine"
import { BasicObjGenerator } from '@/ts/BasicObjGenerator';
import { TextureLoader } from 'three';
import fragmentShader from './fragmentShader.glsl?raw'
import vertexShader from './vertexShader.glsl?raw'
import iChannel0Texture from './iChannel0.png'
import bg1Music from './bg1.mp3'
import bg2Music from './bg2.mp3'

const canvasTarget = ref<HTMLDivElement | null>(null);
const engine = new BasicEngine()

// 音频相关
const audio1 = ref<HTMLAudioElement | null>(null);
const audio2 = ref<HTMLAudioElement | null>(null);

engine.animate()

const plane = BasicObjGenerator.createScreenShaderPlane(
    vertexShader, fragmentShader, engine.getUniforms()
)
engine.addObj(plane)

const main = async () => {
    engine.init(canvasTarget.value!)
    
    // 加载纹理
    const textureLoader = new TextureLoader();
    const texture = await textureLoader.loadAsync(iChannel0Texture);
    engine.uniforms.set("iChannel0", texture);
    
    // 初始化音频
    initAudio();
    
    // 自动全屏
    await requestFullscreen();
}

const initAudio = () => {
    // 创建音频元素
    audio1.value = new Audio(bg1Music);
    audio2.value = new Audio(bg2Music);
    
    // 设置音频属性
    if (audio1.value) {
        audio1.value.loop = true;
        audio1.value.volume = 0.5; // 音量50%
    }
    
    if (audio2.value) {
        audio2.value.loop = true;
        audio2.value.volume = 0.3; // 音量30%
    }
    
    // 播放音频
    playAudio();
}

const playAudio = async () => {
    try {
        if (audio1.value) {
            await audio1.value.play();
        }
        if (audio2.value) {
            await audio2.value.play();
        }
    } catch (error) {
        console.log('音频播放需要用户交互后才能开始:', error);
        // 如果自动播放失败，可以添加一个点击事件来开始播放
        document.addEventListener('click', () => {
            if (audio1.value && audio1.value.paused) {
                audio1.value.play();
            }
            if (audio2.value && audio2.value.paused) {
                audio2.value.play();
            }
        }, { once: true });
    }
}

const requestFullscreen = async () => {
    try {
        // 请求全屏
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
            await (document.documentElement as any).msRequestFullscreen();
        }
        
        // 隐藏鼠标光标
        document.body.style.cursor = 'none';
        
        // 监听全屏状态变化
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
        
    } catch (error) {
        console.log('全屏请求失败:', error);
        // 即使全屏失败，也隐藏鼠标
        document.body.style.cursor = 'none';
    }
}

const handleFullscreenChange = () => {
    const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
    );
    
    if (!isFullscreen) {
        // 退出全屏时恢复鼠标
        document.body.style.cursor = 'auto';
    }
}

onMounted(() => {
    main();
});

onUnmounted(() => {
    // 停止音频播放
    if (audio1.value) {
        audio1.value.pause();
        audio1.value = null;
    }
    if (audio2.value) {
        audio2.value.pause();
        audio2.value = null;
    }
    
    // 恢复鼠标光标
    document.body.style.cursor = 'auto';
    
    // 移除全屏事件监听器
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    
    engine.dispose();
});


</script>

<style scoped>
canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
    max-width: 100%;
    max-height: 100%;
}

/* 全屏时的样式 */
:fullscreen {
    background: black;
}

:-webkit-full-screen {
    background: black;
}

:-moz-full-screen {
    background: black;
}

:-ms-fullscreen {
    background: black;
}
</style>