import {
  buildOpenAICompatibleGenerationPayload,
  resolveModelCapability,
} from '../modelCapabilities.js';
import { sanitizeMessageHistory } from '../chatHistory.js';

const DEFAULT_REQUEST_TIMEOUT_MS = 45_000;

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
        throw new Error(response.ok ? 'Provider가 JSON이 아닌 응답을 반환했습니다.' : errorFallbackMessage);
      }
    }

    if (!response.ok) {
      throw new Error(data?.error?.message || data?.message || errorFallbackMessage);
    }

    return data;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new DOMException(
        upstreamSignal?.aborted ? '요청이 취소되었습니다.' : 'Provider 응답 시간이 초과되었습니다.',
        'AbortError',
      );
    }

    throw error;
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
    throw new Error('Provider가 빈 응답을 반환했습니다.');
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
    throw new Error('현재 텍스트 채팅 API adapter를 지원하지 않는 provider입니다.');
  }

  return adapter(request);
}
