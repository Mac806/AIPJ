export const SUMMARY_PRIORITY = Object.freeze([
  'openai',
  'claude',
  'gemini',
  'perplexity',
  'deepseek',
  'mistral',
  'qwen',
  'groq',
  'cohere',
]);

export function pickSummaryAiId(selectedIds = [], preferredId = '') {
  if (selectedIds.length <= 1) {
    return '';
  }

  if (preferredId && selectedIds.includes(preferredId)) {
    return preferredId;
  }

  const selectedPriorityId = SUMMARY_PRIORITY.find((providerId) => selectedIds.includes(providerId));
  return selectedPriorityId ?? selectedIds[0] ?? '';
}
