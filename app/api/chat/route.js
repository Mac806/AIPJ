import { NextResponse } from 'next/server';
import {
  buildMockAnswer,
  buildMockSummary,
  calculateUsageCostUsd,
  getModelById,
  getProviderById,
} from '@/lib/mockAis';
import { callProviderAdapter } from '@/lib/providers/serverAdapters';
import { getExecutionIntegrationStatus } from '@/lib/providerStatus';
import { sanitizeMessageHistory } from '@/lib/chatHistory';
import { sanitizeErrorMessage, validateChatRequestMetadata } from '@/lib/apiRequestPolicy';

const SYSTEM_PROMPTS = {
  openai: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  claude: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  gemini: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  perplexity: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  deepseek: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  mistral: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  groq: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  qwen: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
};

function sanitizeInstruction(instruction, maxLength) {
  return typeof instruction === 'string' ? instruction.slice(0, maxLength).trim() : '';
}

function resolveSystemPrompt(providerId, purpose, answerInstruction = '') {
  const basePrompt = SYSTEM_PROMPTS[providerId] ?? SYSTEM_PROMPTS.openai;

  if (purpose !== 'answer') {
    return basePrompt;
  }

  const sanitizedInstruction = sanitizeInstruction(answerInstruction, 1000);
  return sanitizedInstruction
    ? `${basePrompt}\n\n[Persona Instruction]\n${sanitizedInstruction}`
    : basePrompt;
}

function buildSummaryPrompt(question, answers, summaryInstruction = '') {
  const lines = Object.entries(answers).map(([providerId, answer]) => {
    const provider = getProviderById(providerId);
    const model = getModelById(providerId, answer?.modelId);
    return `- ${provider.name} / ${model.name}: ${sanitizeInstruction(answer?.text, 4000)}`;
  });
  const sanitizedSummaryInstruction = sanitizeInstruction(summaryInstruction, 1500);

  return [
    '다음 질문에 대해 여러 AI가 답변했습니다.',
    '당신의 역할은 판단자가 아니라 요약 정리자입니다.',
    '정답 판정이나 우열 판단을 하지 말고, 아래 형식으로 한국어로 정리하세요.',
    '',
    '[출력 형식]',
    '1) 공통점',
    '2) 차이점',
    '3) 상충되는 주장(있을 때만)',
    '4) 확인이 필요한 항목',
    '5) 사용자 선택 포인트',
    '',
    sanitizedSummaryInstruction ? `[페르소나 지시]\n${sanitizedSummaryInstruction}` : '',
    `질문: ${question}`,
    '',
    'AI 답변:',
    ...lines,
  ].join('\n');
}

function getPromptForRequest(purpose, question, answers, summaryInstruction) {
  return purpose === 'summary'
    ? buildSummaryPrompt(question, answers, summaryInstruction)
    : question;
}

function buildCostPayload(providerId, modelId, usage = {}, mode = 'api') {
  const inputTokens = usage.inputTokens ?? usage.promptTokens ?? usage.promptTokenCount ?? usage.prompt_token_count ?? 0;
  const outputTokens = usage.outputTokens ?? usage.completionTokens ?? usage.candidatesTokenCount ?? usage.candidates_token_count ?? 0;
  const totalTokens = usage.totalTokens ?? usage.total_tokens ?? inputTokens + outputTokens;
  const totalUsd = mode === 'test' ? 0 : calculateUsageCostUsd(providerId, modelId, {
    inputTokens,
    outputTokens,
  });

  return {
    mode,
    currency: 'USD',
    label: mode === 'test' ? 'TEST 비용' : '예상 비용(단가 미검증)',
    inputTokens,
    outputTokens,
    totalTokens,
    totalUsd,
  };
}

export async function POST(request) {
  let sensitiveApiKey = '';

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    const sizeValidationError = validateChatRequestMetadata({}, contentLength);
    if (sizeValidationError?.status === 413) {
      return NextResponse.json({ error: sizeValidationError.error }, { status: sizeValidationError.status });
    }

    const body = await request.json();
    const {
      providerId,
      modelId,
      apiKey,
      question = '',
      purpose = 'answer',
      answers = {},
      generationOptions = {},
      summaryInstruction = '',
      answerInstruction = '',
      history = [],
    } = body || {};

    const validationError = validateChatRequestMetadata(body, contentLength);
    if (validationError) {
      return NextResponse.json({ error: validationError.error }, { status: validationError.status });
    }

    const trimmedApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    sensitiveApiKey = trimmedApiKey;

    if (trimmedApiKey === 'TEST') {
      const text = purpose === 'summary'
        ? buildMockSummary(providerId, modelId, question, answers)
        : buildMockAnswer(providerId, modelId, question, answerInstruction);
      const mode = 'test';

      return NextResponse.json({
        mode,
        integrationStatus: getExecutionIntegrationStatus(mode, providerId),
        providerId,
        modelId,
        text,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
        cost: buildCostPayload(providerId, modelId, {}, mode),
      });
    }

    const prompt = getPromptForRequest(purpose, question, answers, summaryInstruction);
    const result = await callProviderAdapter({
      providerId,
      modelId,
      apiKey: trimmedApiKey,
      prompt,
      purpose,
      generationOptions,
      systemPrompt: resolveSystemPrompt(providerId, purpose, answerInstruction),
      history: sanitizeMessageHistory(history),
      signal: request.signal,
    });
    const mode = 'api';

    return NextResponse.json({
      mode,
      integrationStatus: getExecutionIntegrationStatus(mode, providerId),
      providerId: result.providerId,
      modelId: result.modelId,
      text: result.text,
      usage: result.usage,
      cost: buildCostPayload(providerId, modelId, result.usage, mode),
    });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, sensitiveApiKey) },
      { status: 500 },
    );
  }
}
