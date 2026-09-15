export function normalizeRequestFailure(error) {
  const isCancelled = error?.name === 'AbortError';

  return {
    status: isCancelled ? 'cancelled' : 'error',
    text: isCancelled
      ? '사용자가 요청을 취소했습니다.'
      : error instanceof Error
        ? `요청 실패: ${error.message}`
        : '요청 실패',
  };
}
