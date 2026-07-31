<script setup lang="ts">
import { watch } from 'vue'
import { useAppI18n } from '@/composables/useAppI18n'
import { useVoiceInput, type VoiceLanguage } from '@/composables/useVoiceInput'

const props = withDefaults(
  defineProps<{ continuous?: boolean, lang?: VoiceLanguage, showLanguage?: boolean }>(),
  { continuous: true, lang: undefined, showLanguage: false },
)
const emit = defineEmits<{ transcript: [string] }>()

const { translate } = useAppI18n()

const voice = useVoiceInput({
  continuous: props.continuous,
  lang: props.lang,
  onFinal: (text) => emit('transcript', text),
})

const LANGUAGES: VoiceLanguage[] = ['ru-RU', 'en-US']

watch(
  () => props.lang,
  (lang) => {
    if (lang) voice.language.value = lang
  },
)
</script>

<template>
  <span
    v-if="!voice.isSupported.value"
    class="text-xs text-gray-400 dark:text-gray-600"
  >
    <i
      class="pi pi-microphone-slash"
      :title="translate('voice.notSupported')"
    />
  </span>

  <span
    v-else
    class="inline-flex items-center gap-1"
  >
    <button
      type="button"
      class="relative rounded p-1.5 transition-colors"
      :class="voice.isRecording.value
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
      :aria-pressed="voice.isRecording.value"
      :aria-label="voice.isRecording.value ? translate('voice.stop') : translate('voice.start')"
      :title="translate('voice.toggle')"
      @click="voice.toggle"
    >
      <i class="pi pi-microphone" />
      <span
        v-if="voice.isRecording.value"
        class="absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full bg-red-600 motion-reduce:animate-none"
      />
    </button>

    <select
      v-if="props.showLanguage"
      v-model="voice.language.value"
      class="rounded border border-gray-200 bg-transparent px-1 py-0.5 text-xs dark:border-gray-700"
      :aria-label="translate('voice.language')"
    >
      <option
        v-for="option in LANGUAGES"
        :key="option"
        :value="option"
      >
        {{ option }}
      </option>
    </select>

    <span
      v-if="voice.interimTranscript.value"
      class="max-w-40 truncate text-xs text-gray-400 dark:text-gray-500"
    >
      {{ voice.interimTranscript.value }}
    </span>
    <span
      v-else-if="voice.isRecording.value"
      class="text-xs text-gray-400 dark:text-gray-500"
    >
      {{ translate('voice.listening') }}
    </span>

    <span
      v-if="voice.errorMessage.value"
      class="text-xs text-red-500"
      :title="translate('voice.error', { reason: voice.errorMessage.value })"
    >
      <i class="pi pi-exclamation-triangle" />
    </span>
  </span>
</template>
