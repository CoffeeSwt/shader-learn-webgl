import { defineStore } from 'pinia'
import { ref } from 'vue'

// 第一个参数是应用程序中 store 的唯一 id
const useUserStore = defineStore('user', () => {
  const ID = ref(0)
  const token = ref('Eduardo')
  
  return { ID, token }
})

export { useUserStore } 
