// components/ChatInput.js
'use client';

import { useRef, useEffect } from 'react';

export default function ChatInput({
  question,
  setQuestion,
  handleSubmit,
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
          placeholder="메시지를 입력하세요..."
          rows={1}
          className="min-h-[40px] max-h-40 w-full resize-none bg-transparent py-2 pl-4 pr-12 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={isGenerating || !question.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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