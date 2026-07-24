// components/settings/UsageSummaryCard.js
'use client';

export default function UsageSummaryCard({ formattedTotalUsageUsd }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-sm font-semibold text-white">누적 사용량 (전체 대화 합산)</p>
      <p className="mt-1 text-xs text-slate-400">모든 세션/턴의 비용 합계</p>
      <p className="mt-3 text-xl font-semibold text-cyan-100">{formattedTotalUsageUsd}</p>
      <p className="mt-1 text-[11px] text-slate-500">(세부 항목/필터는 추후 연결)</p>
    </div>
  );
}
