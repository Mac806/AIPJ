// components/settings/TextSizeCard.js
'use client';

const OPTIONS = [
  { id: 'sm', label: '작게' },
  { id: 'md', label: '보통' },
  { id: 'lg', label: '크게' },
];

export default function TextSizeCard({ chatFontSize, setChatFontSize }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-sm font-semibold text-white">글자 크기</p>
      <p className="mt-1 text-xs text-slate-400">채팅 본문 크기를 조절합니다.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setChatFontSize(option.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              chatFontSize === option.id
                ? 'border border-cyan-400/40 bg-cyan-400/20 text-cyan-100'
                : 'border border-white/10 bg-slate-800 text-slate-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
