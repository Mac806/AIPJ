import {
  buildOpenAICompatibleGenerationPayload,
  resolveModelCapability,
} from '../modelCapabilities.js';
import { sanitizeMessageHistory } from '../chatHistory.js';

const DEFAULT_REQUEST_TIMEOUT_MS = 45_000;

export class ProviderRequestError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.name = 'ProviderRequestError';
    this.code = code;
    this.status = status;
  }
}

function createProviderResponseError(response, fallbackMessage) {
  if (response.status === 401 || response.status === 403) {
    return new ProviderRequestError(
      'PROVIDER_AUTH_FAILED',
      'API 키가 올바르지 않거나 해당 모델을 사용할 권한이 없습니다. 키와 계정 권한을 확인해주세요.',
      401,
    );
  }

  if (response.status === 404) {
    return new ProviderRequestError(
      'PROVIDER_MODEL_NOT_FOUND',
      'Provider에서 선택한 모델을 찾지 못했습니다. 모델 설정을 다시 확인해주세요.',
      400,
    );
  }

  if (response.status === 429) {
    return new ProviderRequestError(
      'PROVIDER_RATE_LIMITED',
      'Provider 호출 한도에 도달했습니다. 잠시 후 다시 시도하거나 사용량 한도를 확인해주세요.',
      429,
    );
  }

  if (response.status >= 500) {
    return new ProviderRequestError(
      'PROVIDER_UNAVAILABLE',
      'Provider 서비스가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.',
      502,
    );
  }

  return new ProviderRequestError(
    'PROVIDER_REQUEST_REJECTED',
    `${fallbackMessage} 모델과 요청 설정값을 확인해주세요.`,
    400,
  );
}

async function fetchJson(url, options, errorFallbackMessage) {
  const controller = new AbortController();
  const upstreamSignal = options.signal;
  const abortFromUpstream = () => controller.abort(upstreamSignal?.reason);
  const timeoutId = setTimeout(() => controller.abort(new Error('timeout')), DEFAULT_REQUEST_TIMEOUT_MS);

  if (upstreamSignal?.aborted) {
    abortFromUpstream();
  } else {
    upstreamSignal?.addEventListener('abort', abortFromUpstream, { once: true });
  }

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const rawBody = await response.text();
    let data = {};

    if (rawBody) {
      try {
        data = JSON.parse(rawBody);
      } catch {
        if (!response.ok) {
          throw createProviderResponseError(response, errorFallbackMessage);
        }

        throw new ProviderRequestError(
          'PROVIDER_INVALID_RESPONSE',
          'Provider 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요.',
          502,
        );
      }
    }

    if (!response.ok) {
      throw createProviderResponseError(response, errorFallbackMessage);
    }

    return data;
  } catch (error) {
    if (controller.signal.aborted) {
      if (upstreamSignal?.aborted) {
        throw new DOMException('요청이 취소되었습니다.', 'AbortError');
      }

      throw new ProviderRequestError(
        'PROVIDER_TIMEOUT',
        'Provider 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        504,
      );
    }

    if (error instanceof ProviderRequestError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ProviderRequestError(
        'PROVIDER_NETWORK_ERROR',
        'Provider에 연결하지 못했습니다. 네트워크 상태를 확인하고 다시 시도해주세요.',
        502,
      );
    }

    throw new ProviderRequestError(
      'PROVIDER_UNKNOWN_ERROR',
      'Provider 요청 중 알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      502,
    );
  } finally {
    clearTimeout(timeoutId);
    upstreamSignal?.removeEventListener('abort', abortFromUpstream);
  }
}

function resolveGenerationOptions(purpose, generationOptions = {}) {
  const defaultTemperature = purpose === 'summary' ? 0.3 : 0.7;
  const rawTemperature = Number(generationOptions.temperature);
  const rawTopP = Number(generationOptions.topP);
  const rawMaxTokens = Number(generationOptions.maxTokens);

  return {
    temperature: Number.isFinite(rawTemperature) ? Math.min(2, Math.max(0, rawTemperature)) : defaultTemperature,
    topP: Number.isFinite(rawTopP) ? Math.min(1, Math.max(0, rawTopP)) : 1,
    maxTokens: Number.isFinite(rawMaxTokens) ? Math.min(8192, Math.max(1, Math.round(rawMaxTokens))) : 1024,
  };
}

function normalizeResult(providerId, modelId, text, usage = {}) {
  const normalizedText = typeof text === 'string' ? text.trim() : '';

  if (!normalizedText) {
    throw new ProviderRequestError(
      'PROVIDER_EMPTY_RESPONSE',
      'Provider가 빈 응답을 반환했습니다. 다시 시도하거나 다른 모델을 선택해주세요.',
      502,
    );
  }

  return {
    providerId,
    modelId,
    text: normalizedText,
    usage: usage && typeof usage === 'object' ? usage : {},
  };
}

export function parseOpenAICompatibleResponse(data = {}) {
  return {
    text: data?.choices?.[0]?.message?.content,
    usage: data?.usage,
  };
}

export function parseAnthropicResponse(data = {}) {
  return {
    text: (data?.content || []).map((part) => part?.text || '').join(''),
    usage: data?.usage,
  };
}

export function parseGeminiResponse(data = {}) {
  return {
    text: (data?.candidates?.[0]?.content?.parts || []).map((part) => part?.text || '').join(''),
    usage: data?.usageMetadata,
  };
}

function createOpenAICompatibleAdapter(apiUrl, errorFallbackMessage) {
  return async ({ providerId, modelId, apiKey, prompt, purpose, generationOptions, systemPrompt, history, signal }) => {
    const capability = resolveModelCapability(providerId, modelId);
    const generationPayload = buildOpenAICompatibleGenerationPayload(purpose, generationOptions, capability);
    const data = await fetchJson(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitizeMessageHistory(history),
          { role: 'user', content: prompt },
        ],
        ...generationPayload,
      }),
      signal,
    }, errorFallbackMessage);

    const result = parseOpenAICompatibleResponse(data);
    return normalizeResult(providerId, modelId, result.text, result.usage);
  };
}

async function callAnthropic({ providerId, modelId, apiKey, prompt, purpose, generationOptions, systemPrompt, history, signal }) {
  const options = resolveGenerationOptions(purpose, generationOptions);
  const data = await fetchJson('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      top_p: options.topP,
      system: systemPrompt,
      messages: [...sanitizeMessageHistory(history), { role: 'user', content: prompt }],
    }),
    signal,
  }, 'Claude API 요청에 실패했습니다.');

  const result = parseAnthropicResponse(data);
  return normalizeResult(providerId, modelId, result.text, result.usage);
}

async function callGemini({ providerId, modelId, apiKey, prompt, purpose, generationOptions, systemPrompt, history, signal }) {
  const options = resolveGenerationOptions(purpose, generationOptions);
  const data = await fetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          ...sanitizeMessageHistory(history).map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          })),
          { role: 'user', parts: [{ text: prompt }] },
        ],
        generationConfig: {
          temperature: options.temperature,
          topP: options.topP,
          maxOutputTokens: options.maxTokens,
        },
      }),
      signal,
    },
    'Gemini API 요청에 실패했습니다.',
  );

  const result = parseGeminiResponse(data);
  return normalizeResult(providerId, modelId, result.text, result.usage);
}

export const PROVIDER_ADAPTERS = Object.freeze({
  openai: createOpenAICompatibleAdapter(
    'https://api.openai.com/v1/chat/completions',
    'OpenAI API 요청에 실패했습니다.',
  ),
  claude: callAnthropic,
  gemini: callGemini,
  perplexity: createOpenAICompatibleAdapter(
    'https://api.perplexity.ai/chat/completions',
    'Perplexity API 요청에 실패했습니다.',
  ),
  deepseek: createOpenAICompatibleAdapter(
    'https://api.deepseek.com/chat/completions',
    'DeepSeek API 요청에 실패했습니다.',
  ),
  mistral: createOpenAICompatibleAdapter(
    'https://api.mistral.ai/v1/chat/completions',
    'Mistral API 요청에 실패했습니다.',
  ),
  groq: createOpenAICompatibleAdapter(
    'https://api.groq.com/openai/v1/chat/completions',
    'Groq API 요청에 실패했습니다.',
  ),
  qwen: createOpenAICompatibleAdapter(
    'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
    'Qwen API 요청에 실패했습니다.',
  ),
});

export function hasProviderAdapter(providerId) {
  return typeof PROVIDER_ADAPTERS[providerId] === 'function';
}

export async function callProviderAdapter(request) {
  const adapter = PROVIDER_ADAPTERS[request.providerId];

  if (!adapter) {
    throw new ProviderRequestError(
      'UNSUPPORTED_PROVIDER',
      '선택한 AI 서비스는 현재 텍스트 채팅을 지원하지 않습니다.',
      400,
    );
  }

  return adapter(request);
}
