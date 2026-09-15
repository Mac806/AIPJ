export const MAX_REQUEST_BODY_BYTES = 1_000_000;
export const MAX_QUESTION_CHARACTERS = 12_000;
export const MAX_API_KEY_CHARACTERS = 4_096;
export const MIN_SUMMARY_ANSWERS = 2;
export const MAX_SUMMARY_ANSWERS = 20;
export const MAX_SUMMARY_ANSWER_CHARACTERS = 4_000;

function validationError(status, code, error) {
  return { status, code, error };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateSummaryAnswers(answers) {
  if (!isPlainObject(answers)) {
    return validationError(400, 'INVALID_SUMMARY_ANSWERS', '요약할 AI 답변 형식이 올바르지 않습니다.');
  }

  const entries = Object.entries(answers);
  if (entries.length < MIN_SUMMARY_ANSWERS) {
    return validationError(
      400,
      'INSUFFICIENT_SUMMARY_ANSWERS',
      `요약하려면 정상 답변이 최소 ${MIN_SUMMARY_ANSWERS}개 필요합니다.`,
    );
  }

  if (entries.length > MAX_SUMMARY_ANSWERS) {
    return validationError(400, 'TOO_MANY_SUMMARY_ANSWERS', '한 번에 요약할 수 있는 AI 답변 수를 초과했습니다.');
  }

  const hasInvalidAnswer = entries.some(([providerId, answer]) => (
    typeof providerId !== 'string'
    || !providerId
    || providerId.length > 64
    || !isPlainObject(answer)
    || typeof answer.modelId !== 'string'
    || !answer.modelId
    || typeof answer.text !== 'string'
    || !answer.text.trim()
    || answer.text.length > MAX_SUMMARY_ANSWER_CHARACTERS
  ));

  return hasInvalidAnswer
    ? validationError(400, 'INVALID_SUMMARY_ANSWERS', '요약할 AI 답변에 비어 있거나 잘못된 항목이 있습니다.')
    : null;
}

export function validateChatRequestMetadata(body = {}, contentLength = 0) {
  const { providerId, modelId, apiKey, purpose = 'answer', question = '' } = body || {};

  if (Number(contentLength) > MAX_REQUEST_BODY_BYTES) {
    return validationError(413, 'REQUEST_TOO_LARGE', '요청 본문이 너무 큽니다. 질문이나 대화 기록을 줄여주세요.');
  }

  if (!providerId || !modelId) {
    return validationError(400, 'MISSING_PROVIDER_OR_MODEL', 'AI 서비스와 모델을 선택해주세요.');
  }

  if (typeof providerId !== 'string' || providerId.length > 64 || typeof modelId !== 'string' || modelId.length > 200) {
    return validationError(400, 'INVALID_PROVIDER_OR_MODEL', 'AI 서비스 또는 모델 형식이 올바르지 않습니다.');
  }

  if (purpose !== 'answer' && purpose !== 'summary') {
    return validationError(400, 'INVALID_PURPOSE', '지원하지 않는 요청 목적입니다.');
  }

  if (typeof question !== 'string' || !question.trim()) {
    return validationError(400, 'EMPTY_QUESTION', '질문을 입력해주세요.');
  }

  if (question.length > MAX_QUESTION_CHARACTERS) {
    return validationError(400, 'QUESTION_TOO_LONG', `질문은 ${MAX_QUESTION_CHARACTERS.toLocaleString()}자 이하여야 합니다.`);
  }

  const trimmedApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!trimmedApiKey) {
    return validationError(400, 'MISSING_API_KEY', 'API 키가 입력되지 않았습니다. 모델 설정에서 키를 입력해주세요.');
  }

  if (trimmedApiKey.length > MAX_API_KEY_CHARACTERS) {
    return validationError(400, 'INVALID_API_KEY', 'API 키 형식이 올바르지 않습니다.');
  }

  if (purpose === 'summary') {
    return validateSummaryAnswers(body.answers);
  }

  return null;
}

export function validateProviderSelection(provider, model) {
  if (!provider) {
    return validationError(400, 'UNKNOWN_PROVIDER', '지원 목록에 없는 AI 서비스입니다. 모델 설정을 다시 확인해주세요.');
  }

  if (!provider.supportsChat) {
    return validationError(400, 'UNSUPPORTED_PROVIDER', '선택한 AI 서비스는 현재 텍스트 채팅을 지원하지 않습니다.');
  }

  if (!model) {
    return validationError(400, 'UNKNOWN_MODEL', '선택한 모델을 찾을 수 없습니다. 모델 설정을 다시 선택해주세요.');
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
