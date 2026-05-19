import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('dark')
  const homeSortMode = ref<'modified' | 'name'>('name')

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { theme, homeSortMode, toggleTheme }
}, {
  persist: true,
})
