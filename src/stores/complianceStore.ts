import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BotCompliance } from '@/utils/botValidator'

export interface ComplianceEntry {
  compliance: BotCompliance
  lastModified: string
}

export const useComplianceStore = defineStore('compliance', () => {
  // botId → { compliance, lastModified }
  const entries = ref<Record<string, ComplianceEntry>>({})

  function get(botId: string, lastModified: string): BotCompliance | null {
    const entry = entries.value[botId]
    if (entry && entry.lastModified === lastModified) return entry.compliance
    return null
  }

  function set(botId: string, lastModified: string, compliance: BotCompliance) {
    entries.value[botId] = { compliance, lastModified }
  }

  function remove(botId: string) {
    delete entries.value[botId]
  }

  function clear() {
    entries.value = {}
  }

  return { entries, get, set, remove, clear }
}, {
  persist: true,
})
