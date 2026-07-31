<script setup lang="ts">
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import { computed } from 'vue'

const props = defineProps<{ content: string }>()

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
})

const renderedHtml = computed(() =>
  DOMPurify.sanitize(markdown.render(props.content), {
    ADD_ATTR: ['target', 'rel'],
  }),
)
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- renderedHtml is sanitised with DOMPurify above -->
  <div
    class="markdown-body overflow-auto"
    v-html="renderedHtml"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>
