const DEFAULT_CAPABILITY = {
  maxTokensField: 'max_tokens',
  maxTokensLimit: 8192,
  supportsTemperature: true,
  supportsTopP: true,
};

function isOpenAIFixedSamplingModel(modelId = '') {
  return /^gpt-5([.-]|$)/i.test(modelId);
}

export function resolveModelCapability(providerId, modelId) {
  const capability = { ...DEFAULT_CAPABILITY };

  if (providerId === 'openai' && isOpenAIFixedSamplingModel(modelId)) {
    return {
      ...capability,
      maxTokensField: 'max_completion_tokens',
      supportsTemperature: false,
      supportsTopP: false,
      fixedTemperature: 1,
      fixedTopP: 1,
    };
  }

  return capability;
}

export function buildOpenAICompatibleGenerationPayload(purpose, generationOptions = {}, capability = DEFAULT_CAPABILITY) {
  const defaultTemperature = purpose === 'summary' ? 0.3 : 0.7;
  const rawTemperature = Number(generationOptions.temperature);
  const rawTopP = Number(generationOptions.topP);
  const rawMaxTokens = Number(generationOptions.maxTokens);

  const temperature = Number.isFinite(rawTemperature)
    ? Math.min(2, Math.max(0, rawTemperature))
    : defaultTemperature;
  const topP = Number.isFinite(rawTopP)
    ? Math.min(1, Math.max(0, rawTopP))
    : 1;
  const maxTokensLimit = capability.maxTokensLimit ?? 8192;
  const maxTokens = Number.isFinite(rawMaxTokens)
    ? Math.min(maxTokensLimit, Math.max(1, Math.round(rawMaxTokens)))
    : 1024;

  const payload = {
    [capability.maxTokensField ?? 'max_tokens']: maxTokens,
  };

  if (capability.supportsTemperature) {
    payload.temperature = temperature;
  }

  if (capability.supportsTopP) {
    payload.top_p = topP;
  }

  return payload;
}
