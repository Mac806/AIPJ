import test from 'node:test';
import assert from 'node:assert/strict';

import { pickSummaryAiId } from '../lib/aiSelectionPolicy.js';
import {
  buildSessionMessageHistory,
  MAX_CONTEXT_MESSAGES,
  sanitizeMessageHistory,
} from '../lib/chatHistory.js';
import {
  buildOpenAICompatibleGenerationPayload,
  resolveModelCapability,
} from '../lib/modelCapabilities.js';
import { getExecutionIntegrationStatus, getProviderIntegrationStatus } from '../lib/providerStatus.js';
import {
  callProviderAdapter,
  parseAnthropicResponse,
  parseGeminiResponse,
  parseOpenAICompatibleResponse,
} from '../lib/providers/serverAdapters.js';
import { normalizeRequestFailure } from '../lib/requestErrors.js';
import { parseChatSessions, serializeChatSessions } from '../lib/hooks/useChatSessions.js';
import {
  MAX_REQUEST_BODY_BYTES,
  sanitizeErrorMessage,
  validateChatRequestMetadata,
  validateProviderSelection,
} from '../lib/apiRequestPolicy.js';

test('요약 AI 선택 규칙은 1개/2개/3개 이상 정책을 지킨다', () => {
  assert.equal(pickSummaryAiId(['openai']), '');
  assert.equal(pickSummaryAiId(['claude', 'gemini']), 'claude');
  assert.equal(pickSummaryAiId(['openai', 'claude', 'gemini'], 'gemini'), 'gemini');
  assert.equal(pickSummaryAiId(['mistral', 'qwen'], 'openai'), 'mistral');
});

test('최근 문맥은 최대 메시지 수를 지키고 Provider 자신의 답변을 우선한다', () => {
  const turns = Array.from({ length: 6 }, (_, index) => ({
    question: `질문 ${index}`,
    answers: {
      openai: { status: 'done', text: `OpenAI 답변 ${index}` },
    },
    summary: { status: 'done', text: `요약 ${index}` },
  }));
  const history = buildSessionMessageHistory(turns, 'openai', 'answer');

  assert.equal(history.length, MAX_CONTEXT_MESSAGES);
  assert.equal(history[0].content, '질문 2');
  assert.equal(history.at(-1).content, 'OpenAI 답변 5');
});

test('Provider 답변이 없으면 완료된 요약을 문맥으로 사용한다', () => {
  const history = buildSessionMessageHistory([
    {
      question: '이전 질문',
      answers: {},
      summary: { status: 'done', text: '이전 요약' },
    },
  ], 'gemini', 'answer');

  assert.deepEqual(history, [
    { role: 'user', content: '이전 질문' },
    { role: 'assistant', content: '이전 요약' },
  ]);
});

test('문맥 sanitizer는 허용 역할만 남기고 assistant로 시작하지 않는다', () => {
  const history = sanitizeMessageHistory([
    { role: 'assistant', content: '고립된 답변' },
    { role: 'system', content: '무시' },
    { role: 'user', content: '질문' },
    { role: 'assistant', content: '답변' },
  ]);

  assert.deepEqual(history, [
    { role: 'user', content: '질문' },
    { role: 'assistant', content: '답변' },
  ]);
});

test('세션 저장 데이터는 API 키 계열 필드를 재귀적으로 제거한다', () => {
  const raw = serializeChatSessions([
    {
      id: 'session-1',
      title: '테스트',
      createdAt: 1,
      isPinned: true,
      turns: [{ question: '질문', apiKey: 'secret', nested: { loadedKeys: { openai: 'secret' } } }],
    },
  ], 'session-1');

  assert.equal(raw.includes('secret'), false);
  const restored = parseChatSessions(raw);
  assert.equal(restored.activeSessionId, 'session-1');
  assert.equal(restored.sessions[0].turns[0].apiKey, undefined);
});

test('손상되거나 버전이 다른 세션 저장 데이터는 거부한다', () => {
  assert.throws(() => parseChatSessions('{"version":999,"sessions":[]}'));
  assert.throws(() => parseChatSessions('not-json'));
});

test('새로고침 시 진행 중이던 저장 응답은 취소 상태로 복구한다', () => {
  const restored = parseChatSessions(JSON.stringify({
    version: 1,
    activeSessionId: 'session-1',
    sessions: [{
      id: 'session-1',
      title: '진행 중',
      createdAt: 1,
      turns: [{
        answers: { openai: { status: 'streaming', text: '일부' } },
        summary: { status: 'loading', text: '' },
      }],
    }],
  }));

  assert.equal(restored.sessions[0].turns[0].answers.openai.status, 'cancelled');
  assert.equal(restored.sessions[0].turns[0].summary.status, 'cancelled');
});

test('고정 sampling 모델과 일반 모델의 generation payload를 구분한다', () => {
  const fixedCapability = resolveModelCapability('openai', 'gpt-5.6-luna');
  const fixedPayload = buildOpenAICompatibleGenerationPayload('answer', {
    temperature: 0.2,
    topP: 0.5,
    maxTokens: 99999,
  }, fixedCapability);

  assert.equal(fixedPayload.max_completion_tokens, 8192);
  assert.equal('temperature' in fixedPayload, false);
  assert.equal('top_p' in fixedPayload, false);

  const normalPayload = buildOpenAICompatibleGenerationPayload('summary', {
    temperature: -1,
    topP: 3,
    maxTokens: 0,
  });
  assert.deepEqual(normalPayload, { max_tokens: 1, temperature: 0, top_p: 1 });
});

test('Provider fixture를 공통 text/usage 입력으로 파싱한다', () => {
  assert.deepEqual(
    parseOpenAICompatibleResponse({ choices: [{ message: { content: 'OpenAI' } }], usage: { total_tokens: 3 } }),
    { text: 'OpenAI', usage: { total_tokens: 3 } },
  );
  assert.deepEqual(
    parseAnthropicResponse({ content: [{ text: 'Claude ' }, { text: '답변' }], usage: { output_tokens: 2 } }),
    { text: 'Claude 답변', usage: { output_tokens: 2 } },
  );
  assert.deepEqual(
    parseGeminiResponse({
      candidates: [{ content: { parts: [{ text: 'Gemini' }] } }],
      usageMetadata: { totalTokenCount: 4 },
    }),
    { text: 'Gemini', usage: { totalTokenCount: 4 } },
  );
});

test('Provider 인증 실패와 호출 제한을 사용자용 오류 코드로 변환한다', async () => {
  const originalFetch = globalThis.fetch;
  const request = {
    providerId: 'openai',
    modelId: 'gpt-test',
    apiKey: 'secret',
    prompt: '질문',
    purpose: 'answer',
    generationOptions: {},
    systemPrompt: 'system',
    history: [],
  };

  try {
    globalThis.fetch = async () => new Response('{"error":{"message":"secret upstream detail"}}', { status: 401 });
    await assert.rejects(
      callProviderAdapter(request),
      (error) => error.code === 'PROVIDER_AUTH_FAILED' && error.status === 401 && !error.message.includes('upstream'),
    );

    globalThis.fetch = async () => new Response('{}', { status: 429 });
    await assert.rejects(
      callProviderAdapter(request),
      (error) => error.code === 'PROVIDER_RATE_LIMITED' && error.status === 429,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('실행 상태는 mock, BYOK 미검증, 미지원을 구분한다', () => {
  assert.equal(getExecutionIntegrationStatus('test', 'openai'), 'mock');
  assert.equal(getProviderIntegrationStatus('openai'), 'unverified');
  assert.equal(getProviderIntegrationStatus('cohere'), 'unsupported');
});

test('취소와 일반 오류를 서로 다른 종료 상태로 정규화한다', () => {
  assert.equal(normalizeRequestFailure(new DOMException('cancel', 'AbortError')).status, 'cancelled');
  assert.deepEqual(normalizeRequestFailure(new Error('network')), {
    status: 'error',
    errorCode: undefined,
    text: 'network',
  });
  assert.equal(normalizeRequestFailure(new TypeError('fetch failed')).text, '네트워크 연결을 확인한 뒤 다시 시도해주세요.');
});

test('API route 입력 계약은 크기, 목적, 키, 질문을 검증한다', () => {
  const validBody = {
    providerId: 'openai',
    modelId: 'gpt-test',
    apiKey: 'TEST',
    purpose: 'answer',
    question: '질문',
  };

  assert.equal(validateChatRequestMetadata(validBody, 100), null);
  assert.equal(validateChatRequestMetadata(validBody, MAX_REQUEST_BODY_BYTES + 1).status, 413);
  assert.equal(validateChatRequestMetadata({ ...validBody, purpose: 'invalid' }, 100).status, 400);
  assert.equal(validateChatRequestMetadata({ ...validBody, apiKey: '' }, 100).status, 400);
  assert.equal(validateChatRequestMetadata({ ...validBody, question: '   ' }, 100).code, 'EMPTY_QUESTION');
  assert.equal(validateChatRequestMetadata({ ...validBody, question: 'x'.repeat(12_001) }, 100).status, 400);
});

test('요약 요청은 비어 있지 않은 정상 답변이 최소 2개 필요하다', () => {
  const summaryBody = {
    providerId: 'openai',
    modelId: 'gpt-test',
    apiKey: 'TEST',
    purpose: 'summary',
    question: '질문',
    answers: {
      openai: { modelId: 'gpt-test', text: '첫 답변' },
    },
  };

  assert.equal(validateChatRequestMetadata(summaryBody, 100).code, 'INSUFFICIENT_SUMMARY_ANSWERS');
  assert.equal(validateChatRequestMetadata({
    ...summaryBody,
    answers: {
      ...summaryBody.answers,
      claude: { modelId: 'claude-test', text: '두 번째 답변' },
    },
  }, 100), null);
  assert.equal(validateChatRequestMetadata({
    ...summaryBody,
    answers: {
      openai: { modelId: 'gpt-test', text: '' },
      claude: { modelId: 'claude-test', text: '두 번째 답변' },
    },
  }, 100).code, 'INVALID_SUMMARY_ANSWERS');
});

test('알 수 없거나 텍스트 미지원인 Provider와 모델을 거부한다', () => {
  assert.equal(validateProviderSelection(null, null).code, 'UNKNOWN_PROVIDER');
  assert.equal(validateProviderSelection({ supportsChat: false }, { id: 'model' }).code, 'UNSUPPORTED_PROVIDER');
  assert.equal(validateProviderSelection({ supportsChat: true }, null).code, 'UNKNOWN_MODEL');
  assert.equal(validateProviderSelection({ supportsChat: true }, { id: 'model' }), null);
});

test('API 오류 메시지는 키와 Authorization 값을 마스킹한다', () => {
  const apiKey = 'sk-secret-value-12345678';
  const sanitized = sanitizeErrorMessage(
    new Error(`failed with Bearer ${apiKey} and ?key=${apiKey}`),
    apiKey,
  );

  assert.equal(sanitized.includes(apiKey), false);
  assert.match(sanitized, /\[API_KEY\]/);
});
