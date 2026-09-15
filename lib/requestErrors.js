export function normalizeRequestFailure(error) {
  const isCancelled = error?.name === 'AbortError';
  const failureText = error instanceof TypeError
    ? '네트워크 연결을 확인한 뒤 다시 시도해주세요.'
    : error instanceof Error && error.message
      ? error.message
      : '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

  return {
    status: isCancelled ? 'cancelled' : 'error',
    errorCode: typeof error?.code === 'string' ? error.code : undefined,
    text: isCancelled
      ? '사용자가 요청을 취소했습니다.'
      : failureText,
  };
}
