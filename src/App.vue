<script setup lang="ts">
import { ref } from 'vue'

const isDark = ref(document.documentElement.classList.contains('dark'))

function toggleTheme(): void {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('anime-statistics:theme', isDark.value ? 'dark' : 'light')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
    <h1 class="text-3xl font-bold text-brand-600 dark:text-brand-300">
      Anime Statistics
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      Проект инициализирован.
    </p>
    <button
      type="button"
      class="rounded-lg bg-brand-600 px-4 py-2 text-white transition-colors hover:bg-brand-700"
      @click="toggleTheme"
    >
      {{ isDark ? 'Светлая тема' : 'Тёмная тема' }}
    </button>
  </div>
</template>
