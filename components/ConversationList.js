// components/ConversationList.js
'use client';

import { useEffect, useRef, useState } from 'react';

export default function ConversationList({
  sessions,
  activeSessionId,
  setActiveSessionId,
  handleNewConversation,
  handlePinConversation,
  handleDeleteConversation,
  handleStartRename,
  handleSaveRename,
  editingSessionId,
  editingTitle,
  setEditingTitle,
}) {
  const [menuSessionId, setMenuSessionId] = useState(null);
  const activeMenuRef = useRef(null);

  useEffect(() => {
    if (!menuSessionId) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (activeMenuRef.current && !activeMenuRef.current.contains(event.target)) {
        setMenuSessionId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuSessionId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuSessionId]);

  return (
    <aside className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-glow">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-white">대화 목록</h2>
        <button
          type="button"
          onClick={handleNewConversation}
          className="whitespace-nowrap rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"
        >
          새 대화
        </button>
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const isMenuOpen = menuSessionId === session.id;
          const isEditing = editingSessionId === session.id;

          return (
            <div
              key={session.id}
              className={`rounded-2xl border px-3 py-3 transition ${
                isActive ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSessionId(session.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  {isEditing ? (
                    <input
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onBlur={() => handleSaveRename(session.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleSaveRename(session.id);
                        }
                      }}
                      autoFocus
                      className="w-full rounded-xl border border-cyan-400/30 bg-slate-950/70 px-2 py-1 text-sm font-semibold text-white outline-none"
                    />
                  ) : (
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {session.isPinned && <span className="text-amber-300" title="고정됨">📌</span>}
                        <div className="truncate text-sm font-semibold text-white">{session.title}</div>
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-400">
                        {session.turns[0]?.question ? session.turns[0].question : '아직 질문이 없습니다.'}
                      </div>
                    </div>
                  )}
                </button>
                <div className="relative" ref={isMenuOpen ? activeMenuRef : null}>
                  <button
                    type="button"
                    onClick={() => setMenuSessionId(isMenuOpen ? null : session.id)}
                    className="rounded-full border border-white/10 bg-slate-900/80 px-2 py-1 text-sm text-slate-300"
                  >
                    ⋯
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-36 rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          handleStartRename(session.id, session.title);
                          setMenuSessionId(null);
                        }}
                        className="block w-full rounded-xl px-2 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                      >
                        제목 바꾸기
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handlePinConversation(session.id);
                          setMenuSessionId(null);
                        }}
                        className="block w-full rounded-xl px-2 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                      >
                        {session.isPinned ? '고정 해제' : '고정하기'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDeleteConversation(session.id);
                          setMenuSessionId(null);
                        }}
                        className="block w-full rounded-xl px-2 py-2 text-left text-sm text-rose-300 hover:bg-white/10"
                      >
                        삭제하기
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}