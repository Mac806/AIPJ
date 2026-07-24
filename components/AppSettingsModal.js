// components/AppSettingsModal.js
'use client';

import { LoginSettingsCard, UsageSummaryCard, TextSizeCard } from '@/components/settings';

export default function AppSettingsModal({
  isOpen,
  onClose,
  formattedTotalUsageUsd,
  chatFontSize,
  setChatFontSize,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <button
        type="button"
        aria-label="임시 설정창 닫기"
        onClick={onClose}
        className="absolute inset-0"
      />
      <section className="relative z-10 w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-glow">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">추가 설정 (임시)</h3>
            <p className="mt-1 text-sm text-slate-400">
              로그인/사용량/글자 크기 설정 공간만 먼저 구성한 더미 창입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-300 hover:border-cyan-400/30"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <LoginSettingsCard />
          <UsageSummaryCard formattedTotalUsageUsd={formattedTotalUsageUsd} />
          <TextSizeCard chatFontSize={chatFontSize} setChatFontSize={setChatFontSize} />
        </div>
      </section>
    </div>
  );
}
