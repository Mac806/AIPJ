// lib/utils.js
'use client';

export function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 6,
  }).format(amount);
}

export function getResponseStatusLabel(status) {
  switch (status) {
    case 'done':
      return '완료';
    case 'loading':
      return '응답 준비 중';
    case 'streaming':
      return '스트리밍 중';
    case 'blocked':
      return 'API 키 미입력';
    case 'error':
      return '오류';
    case 'cancelled':
      return '취소됨';
    default:
      return '대기 중';
  }
}
