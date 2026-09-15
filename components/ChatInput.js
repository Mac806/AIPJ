// components/ChatInput.js
'use client';

import { useRef, useEffect } from 'react';

export default function ChatInput({
  question,
  setQuestion,
  handleSubmit,
  handleCancel,
  isGenerating,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [question]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex-shrink-0 border-t border-white/10 bg-slate-900 p-4">
      <div className="relative mx-auto flex w-full max-w-5xl items-end rounded-xl border border-white/10 bg-slate-800 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20">
        <textarea
          ref={textareaRef}
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="메시지"
          placeholder="메시지를 입력하세요..."
          maxLength={12000}
          rows={1}
          className="min-h-[40px] max-h-40 w-full resize-none bg-transparent py-2 pl-4 pr-12 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
        <button
          type={isGenerating ? 'button' : 'submit'}
          onClick={isGenerating ? handleCancel : undefined}
          disabled={!isGenerating && !question.trim()}
          aria-label={isGenerating ? '생성 취소' : '메시지 전송'}
          title={isGenerating ? '생성 취소' : '메시지 전송'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <rect x="5" y="5" width="10" height="10" rx="1" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l4.415-1.104a1 1 0 01.921 0l3.003.75a1 1 0 001.169-1.409l-7-14z" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
