export const DEFAULT_PROMPT_TEMPLATES: Record<string, string> = {
  paraphrase_formal: 'Перефразируй следующий текст в формальном стиле, сохранив смысл: {text}',
  paraphrase_casual: 'Перефразируй следующий текст в разговорном стиле: {text}',
  paraphrase_compress: 'Сократи следующий текст до 50% объёма, сохранив ключевые факты: {text}',
  paraphrase_academic: 'Перепиши следующий текст в академическом стиле с точными формулировками: {text}',
  recommend_sad: 'На основе моей истории просмотра, порекомендуй грустные аниме похожие по настроению.',
  recommend_action: 'Порекомендуй аниме с интенсивным экшеном на основе моих оценок.',
  recommend_similar: 'Найди аниме похожее на "{title}". Объясни почему.',
}

export function fillTemplate(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => params[key] ?? match)
}
