<script setup lang="ts">
import Message from 'primevue/message'

const props = defineProps<{ message: string | null }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Message
    v-if="props.message"
    severity="error"
    closable
    @close="emit('close')"
  >
    {{ props.message }}
  </Message>
</template>
