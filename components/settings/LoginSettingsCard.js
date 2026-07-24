// components/settings/LoginSettingsCard.js
'use client';

export default function LoginSettingsCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-sm font-semibold text-white">로그인</p>
      <p className="mt-1 text-xs text-slate-400">계정 연동/OAuth 영역 (준비중)</p>
      <button
        type="button"
        disabled
        className="mt-3 rounded-full border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400"
      >
        로그인 (준비중)
      </button>
    </div>
  );
}
