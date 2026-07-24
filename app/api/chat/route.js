import { NextResponse } from 'next/server';
import {
  buildMockAnswer,
  buildMockSummary,
  calculateUsageCostUsd,
  getModelById,
  getProviderById,
} from '@/lib/mockAis';
import {
  buildOpenAICompatibleGenerationPayload,
  resolveModelCapability,
} from '@/lib/modelCapabilities';


const SYSTEM_PROMPTS = {
  openai: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  claude: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  gemini: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  perplexity: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  deepseek: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  mistral: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
  groq: 'You are a concise and helpful assistant. Answer in Korean unless the user requests otherwise.',
};

function sanitizeAnswerInstruction(answerInstruction = '') {
  if (typeof answerInstruction !== 'string') {
    return '';
  }

  return answerInstruction.slice(0, 1000).trim();
}

function resolveSystemPrompt(providerId, purpose, answerInstruction = '') {
  const basePrompt = SYSTEM_PROMPTS[providerId] ?? SYSTEM_PROMPTS.openai;

  if (purpose !== 'answer') {
    return basePrompt;
  }

  const sanitizedInstruction = sanitizeAnswerInstruction(answerInstruction);
  if (!sanitizedInstruction) {
    return basePrompt;
  }

  return `${basePrompt}\n\n[Persona Instruction]\n${sanitizedInstruction}`;
}

function sanitizeSummaryInstruction(summaryInstruction = '') {
  if (typeof summaryInstruction !== 'string') {
    return '';
  }

  return summaryInstruction.slice(0, 1500).trim();
}

function buildSummaryPrompt(question, answers, summaryInstruction = '') {
  const lines = Object.entries(answers).map(([providerId, answer]) => {
    const provider = getProviderById(providerId);
    const model = getModelById(providerId, answer?.modelId);
    return `- ${provider.name} / ${model.name}: ${answer?.text ?? ''}`;
  });

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
    summaryInstruction ? `[페르소나 지시]\n${sanitizeSummaryInstruction(summaryInstruction)}` : '',
    `질문: ${question}`,

    '',
    'AI 답변:',
    ...lines,
  ].join('\n');
}

function getPromptForRequest(purpose, question, answers, summaryInstruction) {
  if (purpose === 'summary') {
    return buildSummaryPrompt(question, answers, summaryInstruction);
  }

  return question;
}

function resolveGenerationOptions(purpose, generationOptions = {}) {
  const defaultTemperature = purpose === 'summary' ? 0.3 : 0.7;
  const temperature = Number.isFinite(Number(generationOptions.temperature))
    ? Math.min(2, Math.max(0, Number(generationOptions.temperature)))
    : defaultTemperature;
  const topP = Number.isFinite(Number(generationOptions.topP))
    ? Math.min(1, Math.max(0, Number(generationOptions.topP)))
    : 1;
  const maxTokens = Number.isFinite(Number(generationOptions.maxTokens))
    ? Math.min(8192, Math.max(1, Math.round(Number(generationOptions.maxTokens))))
    : 1024;

  return {
    temperature,
    topP,
    maxTokens,
  };
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
    label: mode === 'test' ? 'TEST 비용' : '실제 비용',
    inputTokens,
    outputTokens,
    totalTokens,
    totalUsd,
  };
}

async function callOpenAICompatible(
  providerId,
  apiUrl,
  modelId,
  apiKey,
  prompt,
  purpose,
  generationOptions,
  systemPrompt,
  errorFallbackMessage,
) {
  const capability = resolveModelCapability(providerId, modelId);
  const generationPayload = buildOpenAICompatibleGenerationPayload(purpose, generationOptions, capability);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      ...generationPayload,
    }),
  });



  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || errorFallbackMessage);
  }

  return {
    text: data?.choices?.[0]?.message?.content?.trim() || '',
    usage: data?.usage || {},
  };
}

async function callOpenAI(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt) {
  return callOpenAICompatible(
    'openai',
    'https://api.openai.com/v1/chat/completions',
    modelId,
    apiKey,
    prompt,
    purpose,
    generationOptions,
    systemPrompt,
    'OpenAI API 요청에 실패했습니다.',
  );
}





async function callAnthropic(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt) {
  const options = resolveGenerationOptions(purpose, generationOptions);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
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
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Claude API 요청에 실패했습니다.');
  }

  return {
    text: (data?.content || [])
      .map((part) => part?.text || '')
      .join('')
      .trim(),
    usage: data?.usage || {},
  };
}


async function callGemini(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt) {
  const options = resolveGenerationOptions(purpose, generationOptions);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
                systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature,
          topP: options.topP,
          maxOutputTokens: options.maxTokens,
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini API 요청에 실패했습니다.');
  }

  return {
    text: (data?.candidates?.[0]?.content?.parts || [])
      .map((part) => part?.text || '')
      .join('')
      .trim(),
    usage: data?.usageMetadata || {},
  };
}


async function callPerplexity(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt) {
  return callOpenAICompatible(
    'perplexity',
    'https://api.perplexity.ai/chat/completions',
    modelId,
    apiKey,
    prompt,
    purpose,
    generationOptions,
    systemPrompt,
    'Perplexity API 요청에 실패했습니다.',
  );
}


async function callDeepSeek(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt) {
  return callOpenAICompatible(
    'deepseek',
    'https://api.deepseek.com/chat/completions',
    modelId,
    apiKey,
    prompt,
    purpose,
    generationOptions,
    systemPrompt,
    'DeepSeek API 요청에 실패했습니다.',
  );
}


async function callMistral(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt) {
  return callOpenAICompatible(
    'mistral',
    'https://api.mistral.ai/v1/chat/completions',
    modelId,
    apiKey,
    prompt,
    purpose,
    generationOptions,
    systemPrompt,
    'Mistral API 요청에 실패했습니다.',
  );
}


async function callGroq(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt) {
  return callOpenAICompatible(
    'groq',
    'https://api.groq.com/openai/v1/chat/completions',
    modelId,
    apiKey,
    prompt,
    purpose,
    generationOptions,
    systemPrompt,
    'Groq API 요청에 실패했습니다.',
  );
}


async function callQwen(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt) {
  return callOpenAICompatible(
    'qwen',
    'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
    modelId,
    apiKey,
    prompt,
    purpose,
    generationOptions,
    systemPrompt,
    'Qwen API 요청에 실패했습니다.',
  );
}





async function callProviderApi(providerId, modelId, apiKey, prompt, purpose, generationOptions, answerInstruction) {
  const systemPrompt = resolveSystemPrompt(providerId, purpose, answerInstruction);

  switch (providerId) {
    case 'openai':
      return callOpenAI(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt);
    case 'claude':
      return callAnthropic(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt);
    case 'gemini':
      return callGemini(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt);
        case 'perplexity':
      return callPerplexity(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt);
    case 'deepseek':
      return callDeepSeek(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt);
    case 'mistral':
      return callMistral(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt);
        case 'groq':
      return callGroq(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt);
    case 'qwen':
      return callQwen(modelId, apiKey, prompt, purpose, generationOptions, systemPrompt);
    case 'cohere':
    case 'suno':
    case 'udio':
    case 'elevenlabs':
    case 'whisper':
    case 'flux':
    case 'stable-diffusion':
    case 'roboflow':
    case 'runway':
    case 'luma':
      throw new Error('현재 텍스트 채팅을 지원하지 않는 provider입니다.');
    default:
      throw new Error('지원하지 않는 provider입니다.');
  }
}


export async function POST(request) {
  try {
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
    } = body || {};


    if (!providerId || !modelId) {
      return NextResponse.json({ error: 'providerId와 modelId가 필요합니다.' }, { status: 400 });
    }

    const trimmedApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (!trimmedApiKey) {
      return NextResponse.json({ error: 'API 키가 입력되지 않았습니다.' }, { status: 400 });
    }

    if (trimmedApiKey === 'TEST') {
            const text =
        purpose === 'summary'
          ? buildMockSummary(providerId, modelId, question, answers)
          : buildMockAnswer(providerId, modelId, question, answerInstruction);

      const cost = buildCostPayload(providerId, modelId, {}, 'test');

      return NextResponse.json({
        mode: 'test',
        providerId,
        modelId,
        text,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
        cost,
      });
    }

        const prompt = getPromptForRequest(purpose, question, answers, summaryInstruction);
    const result = await callProviderApi(
      providerId,
      modelId,
      trimmedApiKey,
      prompt,
      purpose,
      generationOptions,
      answerInstruction,
    );

    const cost = buildCostPayload(providerId, modelId, result.usage, 'api');

    return NextResponse.json({
      mode: 'api',
      providerId,
      modelId,
      text: result.text,
      usage: result.usage,
      cost,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}