import { getProviderIntegrationStatus } from '@/lib/providerStatus';

const PROVIDER_DEFINITIONS = [
  
  {
    id: 'openai',
    name: 'OpenAI',
    shortName: 'GPT',
    focus: '구조화된 답변과 종합 정리',
    accent: 'from-cyan-400 to-sky-500',
    supportsChat: true,
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    shortName: 'Claude',
    focus: '긴 문맥과 세밀한 해석',
    accent: 'from-amber-300 to-orange-500',
    supportsChat: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    shortName: 'Gemini',
    focus: '탐색형 아이디어와 폭넓은 관점',
    accent: 'from-emerald-300 to-teal-500',
    supportsChat: true,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    shortName: 'Search',
    focus: '검색 스타일의 요약과 비교',
    accent: 'from-violet-300 to-fuchsia-500',
    supportsChat: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    shortName: 'DeepSeek',
    focus: '코드/추론 중심 답변',
    accent: 'from-blue-300 to-indigo-500',
    supportsChat: true,
  },
  {
    id: 'mistral',
    name: 'Mistral',
    shortName: 'Mistral',
    focus: '빠르고 균형 잡힌 생성',
    accent: 'from-lime-300 to-green-500',
    supportsChat: true,
  },
  {
    id: 'qwen',
    name: 'Qwen',
    shortName: 'Qwen',
    focus: '다국어/코드 지향 생성',
    accent: 'from-indigo-300 to-purple-500',
    supportsChat: true,
  },
  {
    id: 'cohere',
    name: 'Cohere',
    shortName: 'Cohere',
    focus: '문서 기반 생성과 분류',
    accent: 'from-orange-300 to-amber-500',
    supportsChat: false,
  },
  {
    id: 'groq',
    name: 'Groq',
    shortName: 'Groq',
    focus: '초저지연 추론 응답',
    accent: 'from-pink-300 to-rose-500',
    supportsChat: true,
  },
  {
    id: 'suno',
    name: 'Suno',
    shortName: 'Suno',
    focus: '오디오/음악 생성',
    accent: 'from-fuchsia-300 to-pink-500',
    supportsChat: false,
  },
  {
    id: 'udio',
    name: 'Udio',
    shortName: 'Udio',
    focus: '음악 생성',
    accent: 'from-purple-300 to-violet-500',
    supportsChat: false,
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    shortName: 'Eleven',
    focus: 'TTS/음성 합성',
    accent: 'from-sky-300 to-cyan-500',
    supportsChat: false,
  },
  {
    id: 'whisper',
    name: 'Whisper',
    shortName: 'Whisper',
    focus: '음성 인식(STT)',
    accent: 'from-slate-300 to-gray-500',
    supportsChat: false,
  },
  {
    id: 'flux',
    name: 'FLUX',
    shortName: 'FLUX',
    focus: '이미지 생성',
    accent: 'from-emerald-300 to-lime-500',
    supportsChat: false,
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    shortName: 'SD',
    focus: '텍스트-이미지 생성',
    accent: 'from-blue-300 to-cyan-500',
    supportsChat: false,
  },
  {
    id: 'roboflow',
    name: 'Roboflow',
    shortName: 'Roboflow',
    focus: '비전 분석/탐지',
    accent: 'from-amber-300 to-yellow-500',
    supportsChat: false,
  },
  {
    id: 'runway',
    name: 'Runway',
    shortName: 'Runway',
    focus: '비디오 생성/편집',
    accent: 'from-rose-300 to-red-500',
    supportsChat: false,
  },
  {
    id: 'luma',
    name: 'Luma',
    shortName: 'Luma',
    focus: '영상/3D 생성',
    accent: 'from-teal-300 to-emerald-500',
    supportsChat: false,
  },
];

export const MOCK_AI_PROVIDERS = PROVIDER_DEFINITIONS.map((provider) => ({
  ...provider,
  integrationStatus: getProviderIntegrationStatus(provider.id),
}));

export const MOCK_MODEL_OPTIONS = {
    openai: [
    { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', note: '라이트' },
    { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', note: '노말' },
    { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', note: '헤비' },
    { id: 'gpt-5.5-instant', name: 'GPT-5.5 Instant', note: '일상형' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini', note: '레거시 라이트' },
    { id: 'gpt-4.1', name: 'GPT-4.1', note: '레거시 노말' },
    { id: 'o3', name: 'o3', note: '레거시 추론' },
    { id: 'gpt-4o', name: 'GPT-4o', note: '레거시 멀티모달' },
    { id: 'gpt-4o-mini', name: 'GPT-4o mini', note: '레거시 경량' },
  ],
    claude: [
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', note: '에이전트 특화' },
    { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', note: '안정형' },
    { id: 'claude-fable-5', name: 'Claude Fable 5', note: '최상위 추론' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', note: '레거시 경량' },
    { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', note: '이전 세대' },
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', note: '이전 세대' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', note: '이전 세대' },
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', note: '레거시' },
    { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', note: '레거시' },
  ],
    gemini: [
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', note: '최신 고속' },
    { id: 'gemini-omni', name: 'Gemini Omni', note: '통합형 멀티모달' },
    { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', note: '2M 컨텍스트' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', note: '레거시 라이트' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', note: '레거시 노말' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', note: '레거시 헤비' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', note: '레거시 워크호스' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', note: '레거시' },
  ],
    perplexity: [
    { id: 'sonar', name: 'Sonar', note: '라이트 검색' },
    { id: 'sonar-pro', name: 'Sonar Pro', note: '노말 검색' },
    { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', note: '헤비 추론' },
    { id: 'sonar-deep-research', name: 'Sonar Deep Research', note: '심층 리서치' },
    { id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small 128k', note: '레거시' },
  ],
    deepseek: [
    { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', note: '라이트' },
    { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', note: '헤비' },
    { id: 'deepseek-chat', name: 'DeepSeek Chat', note: '호환 별칭' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', note: '호환 별칭' },
    { id: 'deepseek-chat-v2.5', name: 'DeepSeek Chat V2.5', note: '레거시' },
  ],
    mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large Latest', note: '헤비' },
    { id: 'mistral-small-latest', name: 'Mistral Small Latest', note: '라이트' },
    { id: 'codestral-latest', name: 'Codestral Latest', note: '코딩 특화' },
    { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B', note: '레거시 대형' },
    { id: 'open-mixtral-8x7b', name: 'Mixtral 8x7B', note: '레거시 중형' },
  ],
    qwen: [
    { id: 'qwen3.6-flash', name: 'Qwen 3.6 Flash', note: '라이트' },
    { id: 'qwen3.7-plus', name: 'Qwen 3.7 Plus', note: '노말' },
    { id: 'qwen3.7-max', name: 'Qwen 3.7 Max', note: '헤비' },
    { id: 'qwen-plus', name: 'Qwen Plus', note: '레거시 노말' },
    { id: 'qwen-max', name: 'Qwen Max', note: '레거시 헤비' },
  ],
  cohere: [
    { id: 'command-a-plus-05-2026', name: 'Command A+ 05-2026', note: '플래그십' },
    { id: 'command-a-03-2025', name: 'Command A 03-2025', note: '고성능' },
    { id: 'command-r-plus-08-2024', name: 'Command R+ 08-2024', note: '헤비' },
    { id: 'command-r-08-2024', name: 'Command R 08-2024', note: '노말' },
    { id: 'command-r7b-12-2024', name: 'Command R7B', note: '라이트' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', note: '헤비' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', note: '라이트' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', note: '노말' },
    { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B', note: '오픈모델 대형' },
    { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B', note: '오픈모델' },
  ],
    suno: [
    { id: 'suno-v3.5', name: 'Suno v3.5', note: '기본' },
    { id: 'suno-v4', name: 'Suno v4', note: '고품질' },
    { id: 'suno-v4.5', name: 'Suno v4.5', note: '레거시 최신' },
  ],
    udio: [
    { id: 'udio-32', name: 'Udio 32', note: '기본' },
    { id: 'udio-130', name: 'Udio 130', note: '확장형' },
    { id: 'udio-v2', name: 'Udio v2', note: '레거시' },
    { id: 'udio-v1.5', name: 'Udio v1.5', note: '레거시' },
  ],
    elevenlabs: [
    { id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2', note: '다국어' },
    { id: 'eleven_turbo_v2_5', name: 'Eleven Turbo v2.5', note: '저지연' },
    { id: 'eleven_monolingual_v1', name: 'Eleven Monolingual v1', note: '단일언어' },
    { id: 'eleven-turbo-v2', name: 'Eleven Turbo v2', note: '레거시' },
    { id: 'eleven-multilingual-v2', name: 'Eleven Multilingual v2', note: '레거시 표기' },
  ],
  whisper: [
    { id: 'whisper-1', name: 'Whisper-1', note: '기본' },
    { id: 'whisper-large-v3', name: 'Whisper Large v3', note: '고정확도' },
  ],
    flux: [
    { id: 'flux-pro', name: 'FLUX Pro', note: '고품질' },
    { id: 'flux-dev', name: 'FLUX Dev', note: '개발형' },
    { id: 'flux-schnell', name: 'FLUX Schnell', note: '고속' },
    { id: 'flux-1-pro', name: 'FLUX.1 Pro', note: '레거시' },
    { id: 'flux-1-schnell', name: 'FLUX.1 Schnell', note: '레거시' },
  ],
    'stable-diffusion': [
    { id: 'sd3-large', name: 'SD3 Large', note: '고품질' },
    { id: 'sd3-large-turbo', name: 'SD3 Large Turbo', note: '고속' },
    { id: 'sd-core', name: 'SD Core', note: '기본형' },
    { id: 'sd-3.5-large', name: 'SD 3.5 Large', note: '레거시' },
    { id: 'sdxl-1.0', name: 'SDXL 1.0', note: '레거시' },
  ],
    roboflow: [
    { id: 'roboflow-object-detection', name: 'Roboflow Object Detection', note: '탐지' },
    { id: 'roboflow-instance-segmentation', name: 'Roboflow Instance Segmentation', note: '분할' },
    { id: 'roboflow-workflows-v2', name: 'Roboflow Workflows v2', note: '레거시' },
    { id: 'roboflow-universe-v1', name: 'Roboflow Universe v1', note: '레거시' },
  ],
    runway: [
    { id: 'gen3-alpha', name: 'Gen3 Alpha', note: '기본' },
    { id: 'gen3-turbo', name: 'Gen3 Turbo', note: '고속' },
    { id: 'gen-3-alpha', name: 'Gen-3 Alpha', note: '레거시 표기' },
    { id: 'gen-3-turbo', name: 'Gen-3 Turbo', note: '레거시 표기' },
  ],
    luma: [
    { id: 'dream-machine-v1', name: 'Dream Machine v1', note: '기본' },
    { id: 'dream-machine-v1.5', name: 'Dream Machine v1.5', note: '개선형' },
    { id: 'dream-machine', name: 'Dream Machine', note: '레거시' },
    { id: 'ray2', name: 'Ray2', note: '레거시' },
  ],
};

const GENERAL_MODE_MODEL_IDS = {
  openai: ['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol'],
  claude: ['claude-sonnet-5', 'claude-opus-4-8', 'claude-fable-5'],
  gemini: ['gemini-3.6-flash', 'gemini-omni', 'gemini-3.1-pro'],
  perplexity: ['sonar', 'sonar-pro', 'sonar-reasoning-pro'],
  deepseek: ['deepseek-v4-flash', 'deepseek-v4-pro'],
  mistral: ['mistral-small-latest', 'codestral-latest', 'mistral-large-latest'],
  qwen: ['qwen3.6-flash', 'qwen3.7-plus', 'qwen3.7-max'],
  cohere: ['command-r7b-12-2024', 'command-r-08-2024', 'command-r-plus-08-2024'],
  groq: ['llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'llama-3.3-70b-versatile'],
  suno: ['suno-v4'],
  udio: ['udio-32'],
  elevenlabs: ['eleven_turbo_v2_5'],
  whisper: ['whisper-large-v3'],
  flux: ['flux-schnell'],
  'stable-diffusion': ['sd3-large-turbo'],
  roboflow: ['roboflow-object-detection'],
  runway: ['gen3-turbo'],
  luma: ['dream-machine-v1.5'],
};

export const MODEL_PRICING_USD = {
    openai: {
    'gpt-5.6-luna': { input: 0, output: 0 },
    'gpt-5.6-terra': { input: 0, output: 0 },
    'gpt-5.6-sol': { input: 0, output: 0 },
    'gpt-5.5-instant': { input: 0, output: 0 },
    'gpt-4.1-mini': { input: 0.4, output: 1.6 },
    'gpt-4.1': { input: 2.0, output: 8.0 },
    o3: { input: 10.0, output: 40.0 },
    'gpt-4o': { input: 2.5, output: 10.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
  },
    claude: {
    'claude-sonnet-5': { input: 3.0, output: 15.0 },
    'claude-opus-4-8': { input: 5.0, output: 25.0 },
    'claude-fable-5': { input: 10.0, output: 50.0 },
    'claude-haiku-4-5': { input: 1.0, output: 5.0 },
    'claude-opus-4-7': { input: 5.0, output: 25.0 },
    'claude-opus-4-6': { input: 5.0, output: 25.0 },
    'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
    'claude-3-7-sonnet-20250219': { input: 3.0, output: 15.0 },
    'claude-3-5-haiku-latest': { input: 0.25, output: 1.25 },
  },
    gemini: {
    'gemini-3.6-flash': { input: 0, output: 0 },
    'gemini-omni': { input: 0, output: 0 },
    'gemini-3.1-pro': { input: 0, output: 0 },
    'gemini-2.5-flash-lite': { input: 0.2, output: 0.6 },
    'gemini-2.5-flash': { input: 0.35, output: 1.05 },
    'gemini-2.5-pro': { input: 1.25, output: 10.0 },
    'gemini-2.0-flash': { input: 0.3, output: 0.9 },
    'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  },
    perplexity: {
    sonar: { input: 5.0, output: 5.0 },
    'sonar-pro': { input: 8.0, output: 8.0 },
    'sonar-reasoning-pro': { input: 10.0, output: 10.0 },
    'sonar-deep-research': { input: 0, output: 0 },
    'llama-3.1-sonar-small-128k-online': { input: 5.0, output: 5.0 },
  },
    deepseek: {
    'deepseek-v4-flash': { input: 0.14, output: 0.28 },
    'deepseek-v4-pro': { input: 0.435, output: 0.87 },
    'deepseek-chat': { input: 0.14, output: 0.28 },
    'deepseek-reasoner': { input: 0.14, output: 0.28 },
    'deepseek-chat-v2.5': { input: 0.27, output: 1.1 },
  },
    mistral: {
    'mistral-large-latest': { input: 2.0, output: 6.0 },
    'mistral-small-latest': { input: 0.2, output: 0.6 },
    'codestral-latest': { input: 0, output: 0 },
    'open-mixtral-8x22b': { input: 2.0, output: 6.0 },
    'open-mixtral-8x7b': { input: 0.7, output: 2.1 },
  },
    qwen: {
    'qwen3.6-flash': { input: 0, output: 0 },
    'qwen3.7-plus': { input: 0, output: 0 },
    'qwen3.7-max': { input: 0, output: 0 },
    'qwen-plus': { input: 0.4, output: 1.2 },
    'qwen-max': { input: 1.6, output: 4.8 },
  },
  cohere: {
    'command-a-plus-05-2026': { input: 0, output: 0 },
    'command-a-03-2025': { input: 0, output: 0 },
    'command-r-plus-08-2024': { input: 2.5, output: 7.5 },
    'command-r-08-2024': { input: 0.5, output: 1.5 },
    'command-r7b-12-2024': { input: 0.15, output: 0.6 },
  },
  groq: {
    'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
    'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
    'mixtral-8x7b-32768': { input: 0.27, output: 0.27 },
    'openai/gpt-oss-120b': { input: 0.15, output: 0.6 },
    'openai/gpt-oss-20b': { input: 0.075, output: 0.3 },
  },
    suno: {
    'suno-v3.5': { input: 0, output: 0 },
    'suno-v4': { input: 0, output: 0 },
    'suno-v4.5': { input: 0, output: 0 },
  },
    udio: {
    'udio-32': { input: 0, output: 0 },
    'udio-130': { input: 0, output: 0 },
    'udio-v2': { input: 0, output: 0 },
    'udio-v1.5': { input: 0, output: 0 },
  },
    elevenlabs: {
    eleven_multilingual_v2: { input: 0, output: 0 },
    eleven_turbo_v2_5: { input: 0, output: 0 },
    eleven_monolingual_v1: { input: 0, output: 0 },
    'eleven-turbo-v2': { input: 0, output: 0 },
    'eleven-multilingual-v2': { input: 0, output: 0 },
  },
  whisper: {
    'whisper-1': { input: 0, output: 0 },
    'whisper-large-v3': { input: 0, output: 0 },
  },
    flux: {
    'flux-pro': { input: 0, output: 0 },
    'flux-dev': { input: 0, output: 0 },
    'flux-schnell': { input: 0, output: 0 },
    'flux-1-pro': { input: 0, output: 0 },
    'flux-1-schnell': { input: 0, output: 0 },
  },
    'stable-diffusion': {
    'sd3-large': { input: 0, output: 0 },
    'sd3-large-turbo': { input: 0, output: 0 },
    'sd-core': { input: 0, output: 0 },
    'sd-3.5-large': { input: 0, output: 0 },
    'sdxl-1.0': { input: 0, output: 0 },
  },
    roboflow: {
    'roboflow-object-detection': { input: 0, output: 0 },
    'roboflow-instance-segmentation': { input: 0, output: 0 },
    'roboflow-workflows-v2': { input: 0, output: 0 },
    'roboflow-universe-v1': { input: 0, output: 0 },
  },
    runway: {
    'gen3-alpha': { input: 0, output: 0 },
    'gen3-turbo': { input: 0, output: 0 },
    'gen-3-alpha': { input: 0, output: 0 },
    'gen-3-turbo': { input: 0, output: 0 },
  },
    luma: {
    'dream-machine-v1': { input: 0, output: 0 },
    'dream-machine-v1.5': { input: 0, output: 0 },
    'dream-machine': { input: 0, output: 0 },
    ray2: { input: 0, output: 0 },
  },
};

export function getProviderById(providerId) {
  return MOCK_AI_PROVIDERS.find((provider) => provider.id === providerId) ?? MOCK_AI_PROVIDERS[0];
}

function pickModelsForGeneralMode(providerId) {
  const allModels = MOCK_MODEL_OPTIONS[providerId] ?? [];
  const preferredModelIds = GENERAL_MODE_MODEL_IDS[providerId] ?? [];

  if (preferredModelIds.length === 0) {
    return allModels;
  }

  const selected = preferredModelIds
    .map((modelId) => allModels.find((model) => model.id === modelId))
    .filter(Boolean);

  return selected.length > 0 ? selected : allModels.slice(0, 3);
}

export function getModelsForProvider(providerId, userMode = 'developer') {
  if (userMode === 'general') {
    return pickModelsForGeneralMode(providerId);
  }

  return MOCK_MODEL_OPTIONS[providerId] ?? [];
}

export function getDefaultModelId(providerId, userMode = 'developer') {
  return getModelsForProvider(providerId, userMode)[0]?.id ?? 'default';
}

export function getModelById(providerId, modelId) {
  const allModels = MOCK_MODEL_OPTIONS[providerId] ?? [];

  return allModels.find((model) => model.id === modelId) ?? allModels[0] ?? {
    id: modelId || 'default',
    name: '기본 모델',
    note: '모델 정보 없음',
  };
}

export function getModelLabel(providerId, modelId) {
  const model = getModelById(providerId, modelId);
  return model.name;
}

export function buildMockAnswer(providerId, modelId, question, answerInstruction = '') {
  const provider = getProviderById(providerId);
  const model = getModelById(providerId, modelId);
  const highlights = [
    '핵심 문제를 한 문장으로 정리하면',
    '선택한 AI들의 관점을 묶으면',
    '실서비스로 바꾸기 전에는',
  ];
  const highlight = highlights[question.length % highlights.length];
  const sanitizedInstruction = typeof answerInstruction === 'string' ? answerInstruction.slice(0, 140).trim() : '';

  return `${provider.name} · ${model.name} 관점의 더미 응답입니다. ${highlight} ${question.slice(0, 36) || '질문'} 흐름을 먼저 분해하고, 실행 가능한 단계로 정리하는 방식이 적합합니다. ${provider.focus}를 기준으로 보면 이번 질문은 빠른 실험과 정교한 후속 검증이 함께 필요합니다.${sanitizedInstruction ? `\n\n(적용 페르소나) ${sanitizedInstruction}` : ''}`;
}

export function buildMockSummary(mainProviderId, mainModelId, question, answers) {
  const mainProvider = getProviderById(mainProviderId);
  const mainModel = getModelById(mainProviderId, mainModelId);
  const involvedNames = Object.keys(answers)
    .map((providerId) => getProviderById(providerId).name)
    .join(', ');

  return `${mainProvider.name} · ${mainModel.name}가 최종 정리한 mock 요약입니다. 질문 "${question}"에 대해 ${involvedNames}의 관점을 합치면, 공통적으로는 요구사항 분해, mock 검증, 실제 API 교체 지점 분리가 핵심입니다. 다음 단계는 UI, 상태관리, API 어댑터를 분리해서 실서비스 연결 준비를 하는 것입니다.`;
}



export function calculateUsageCostUsd(providerId, modelId, usage = {}) {
  const pricing = MODEL_PRICING_USD[providerId]?.[modelId];

  if (!pricing) {
    return 0;
  }

  const inputTokens = usage.inputTokens ?? usage.promptTokens ?? usage.promptTokenCount ?? usage.prompt_token_count ?? 0;
  const outputTokens = usage.outputTokens ?? usage.completionTokens ?? usage.candidatesTokenCount ?? usage.candidates_token_count ?? 0;

  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

export function splitIntoChunks(text, chunkCount = 5) {
  const words = text.split(' ');
  const size = Math.max(1, Math.ceil(words.length / chunkCount));
  const chunks = [];

  for (let index = 0; index < words.length; index += size) {
    chunks.push(words.slice(index, index + size).join(' '));
  }

  return chunks;
}
