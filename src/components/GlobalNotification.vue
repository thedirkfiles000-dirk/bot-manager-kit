<!-- src/components/GlobalNotification.vue -->
<template>
  <Snackbar.Portal>
    <Snackbar.Queue v-slot="{ items }">
      <template v-for="item in items" :key="item.id">
        <Snackbar.Root
          :id="item.id"
          :role="item.severity === 'error' || item.severity === 'warning' ? 'alert' : 'status'"
          class="global-snackbar"
          :class="`global-snackbar--${item.severity ?? 'info'}`"
        >
          <pre class="global-snackbar__message">{{ item.subject }}</pre>

          <Snackbar.Close class="global-snackbar__close">
            <v-icon icon="mdi-close" size="small" />
          </Snackbar.Close>
        </Snackbar.Root>
      </template>
    </Snackbar.Queue>
  </Snackbar.Portal>
</template>

<script setup lang="ts">
  import { Snackbar } from "@vuetify/v0/components";
</script>

<style scoped>
.global-snackbar {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  min-width: 300px;
  max-width: 600px;
}

.global-snackbar--error {
  background-color: rgb(var(--v-theme-error));
}
.global-snackbar--success {
  background-color: rgb(var(--v-theme-success));
}
.global-snackbar--warning {
  background-color: rgb(var(--v-theme-warning));
}
.global-snackbar--info {
  background-color: rgb(var(--v-theme-info));
}

.global-snackbar__message {
  flex: 1;
  white-space: pre-wrap;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.global-snackbar__close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
}
.global-snackbar__close:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.15);
}
</style>
