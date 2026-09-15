export const MAX_REQUEST_BODY_BYTES = 1_000_000;
export const MAX_QUESTION_CHARACTERS = 12_000;
export const MAX_API_KEY_CHARACTERS = 4_096;

export function validateChatRequestMetadata(body = {}, contentLength = 0) {
  const { providerId, modelId, apiKey, purpose = 'answer', question = '' } = body || {};

  if (Number(contentLength) > MAX_REQUEST_BODY_BYTES) {
    return { status: 413, error: '요청 본문이 너무 큽니다.' };
  }

  if (!providerId || !modelId) {
    return { status: 400, error: 'providerId와 modelId가 필요합니다.' };
  }

  if (typeof providerId !== 'string' || providerId.length > 64 || typeof modelId !== 'string' || modelId.length > 200) {
    return { status: 400, error: 'providerId 또는 modelId 형식이 올바르지 않습니다.' };
  }

  if (purpose !== 'answer' && purpose !== 'summary') {
    return { status: 400, error: '지원하지 않는 요청 목적입니다.' };
  }

  if (typeof question !== 'string' || question.length > MAX_QUESTION_CHARACTERS) {
    return { status: 400, error: `질문은 ${MAX_QUESTION_CHARACTERS.toLocaleString()}자 이하여야 합니다.` };
  }

  const trimmedApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!trimmedApiKey) {
    return { status: 400, error: 'API 키가 입력되지 않았습니다.' };
  }

  if (trimmedApiKey.length > MAX_API_KEY_CHARACTERS) {
    return { status: 400, error: 'API 키 형식이 올바르지 않습니다.' };
  }

  return null;
}

export function sanitizeErrorMessage(error, apiKey = '') {
  let message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

  if (apiKey.length >= 4) {
    message = message.replaceAll(apiKey, '[API_KEY]');
  }

  return message
    .replace(/\b(?:sk|pplx|gsk)[-_][a-z0-9_-]{8,}\b/gi, '[API_KEY]')
    .replace(/([?&]key=)[^&\s]+/gi, '$1[API_KEY]')
    .replace(/(bearer\s+)[^\s]+/gi, '$1[API_KEY]')
    .slice(0, 500);
}
