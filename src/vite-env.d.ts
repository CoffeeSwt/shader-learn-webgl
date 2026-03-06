/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_BASE_API: string
    readonly VITE_BASE_URL: string
    readonly VITE_SERVER_PORT: string | number
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare module '*.fbx?url' {
    const src: string
    export default src
}

declare module '*.fbx' {
    const src: string
    export default src
}

