export const PROVIDER_INTEGRATION_STATUS = Object.freeze({
  MOCK: 'mock',
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
  UNSUPPORTED: 'unsupported',
});

const TEXT_ADAPTER_PROVIDER_IDS = new Set([
  'openai',
  'claude',
  'gemini',
  'perplexity',
  'deepseek',
  'mistral',
  'qwen',
  'groq',
]);

export function getProviderIntegrationStatus(providerId) {
  return TEXT_ADAPTER_PROVIDER_IDS.has(providerId)
    ? PROVIDER_INTEGRATION_STATUS.UNVERIFIED
    : PROVIDER_INTEGRATION_STATUS.UNSUPPORTED;
}

export function getExecutionIntegrationStatus(mode, providerId) {
  return mode === 'test' ? PROVIDER_INTEGRATION_STATUS.MOCK : getProviderIntegrationStatus(providerId);
}
