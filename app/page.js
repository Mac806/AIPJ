
'use client';

import { useEffect, useMemo, useState } from 'react';

import ConversationList from '@/components/ConversationList';
import AiSettingsPanel from '@/components/AiSettingsPanel';
import ChatWindow from '@/components/ChatWindow';
import ChatInput from '@/components/ChatInput';
import AppSettingsModal from '@/components/AppSettingsModal';

import useAiSelection from '@/lib/hooks/useAiSelection';
import useChatSessions from '@/lib/hooks/useChatSessions';
import useSidebarDrawer from '@/lib/hooks/useSidebarDrawer';
import useChatOrchestrator from '@/lib/hooks/useChatOrchestrator';
import useUserMode from '@/lib/hooks/useUserMode';
import useGenerationSettings from '@/lib/hooks/useGenerationSettings';
import useSummaryPersona from '@/lib/hooks/useSummaryPersona';
import useAnswerPersonas from '@/lib/hooks/useAnswerPersonas';

export default function HomePage() {
  const [isAiSettingsPanelOpen, setIsAiSettingsPanelOpen] = useState(false);
  const [isPlaceholderSettingsOpen, setIsPlaceholderSettingsOpen] = useState(false);
  const [chatFontSize, setChatFontSize] = useState('md');




    const { userMode, setUserMode } = useUserMode();
    const {
    developerParams,
    setDeveloperParam,
    activeGenerationOptions,
    developerParamRules,
  } = useGenerationSettings(userMode);
  const {
    summaryPersonaPreset,
    setSummaryPersonaPreset,
    summaryPersonaPresets,
    useCustomSummaryInstruction,
    setUseCustomSummaryInstruction,
    customSummaryInstruction,
    setCustomSummaryInstruction,
    activeSummaryInstruction,
    customInstructionMaxLength,
  } = useSummaryPersona(userMode);


    const {
    selectedIds,
    summaryAiId,
    setSummaryAiId,
        isSummaryRequested,
    setIsSummaryRequested,
    isSummaryEnabled,
    isSummaryAutoMode,
    canSelectSummaryAi,

    selectedModels,
    loadedKeys,
    keyInputs,
    setKeyInputs,
    keyStatuses,
    selectedProviders,
    handleProviderToggle,
    handleModelChange,
    handleLoadKey,
  } = useAiSelection();

  const {
    answerPresetMap,
    setProviderAnswerPreset,
    answerPresetOptions,
    useCustomAnswerInstructionMap,
    setProviderCustomAnswerInstructionEnabled,
    answerInstructionInputMap,
    setProviderAnswerInstructionInput,
    answerInstructionMap,
    answerInstructionMaxLength,
  } = useAnswerPersonas(userMode, summaryAiId, activeSummaryInstruction);

  const {
    sessions,
    createSession,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    activeTurns,
    editingSessionId,
    editingTitle,
    setEditingTitle,
    updateSession,
    updateSessionTurn,
    handleNewConversation,
    handlePinConversation,
    handleDeleteConversation,
    handleStartRename,
    handleSaveRename,
  } = useChatSessions();

  const {
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isCollapsedView,
    handleSidebarTouchStart,
    handleSidebarTouchMove,
    handleSidebarTouchEnd,
  } = useSidebarDrawer();

      const { question, setQuestion, isGenerating, handleSubmit, handleCancel } = useChatOrchestrator({
    sessions,
    activeSessionId,
    createSession,
    selectedProviders,
    selectedModels,
    loadedKeys,
    summaryAiId,
    isSummaryEnabled,
        updateSession,
    updateSessionTurn,
    userMode,
    generationOptions: activeGenerationOptions,
    summaryInstruction: activeSummaryInstruction,
    answerInstructionMap,
  });



  

    const formattedActiveSessionCreatedAt = useMemo(() => {
    if (!activeSession?.createdAt) {
      return '대기 중';
    }

    return new Date(activeSession.createdAt).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [activeSession]);

  const totalUsageUsd = useMemo(() => {
    return sessions.reduce((sessionSum, session) => {
      const turnSum = (session.turns ?? []).reduce(
        (sum, turn) => sum + (Number(turn?.cost?.totalUsd) || 0),
        0,
      );

      return sessionSum + turnSum;
    }, 0);
  }, [sessions]);

  const formattedTotalUsageUsd = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(totalUsageUsd);
  }, [totalUsageUsd]);


    useEffect(() => {
    try {
      const stored = window.localStorage.getItem('aipj-chat-font-size');
      if (stored === 'sm' || stored === 'md' || stored === 'lg') {
        setChatFontSize(stored);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('aipj-chat-font-size', chatFontSize);
    } catch {
      // ignore localStorage errors
    }
  }, [chatFontSize]);

  function startNewConversation() {
    handleNewConversation();
    setQuestion('');
  }


  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-slate-950 text-slate-100">
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="사이드바 닫기"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 min-w-72 flex-col border-r border-white/10 bg-slate-900 p-4 transition-transform duration-200 md:relative md:inset-auto md:z-auto md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarCollapsed ? 'md:w-16 md:min-w-16 md:p-3' : 'md:w-72 md:min-w-72'}`}
        onTouchStart={handleSidebarTouchStart}
        onTouchMove={handleSidebarTouchMove}
        onTouchEnd={handleSidebarTouchEnd}
      >
        <div className="mb-3 flex items-center justify-between">
          {!isCollapsedView && <p className="text-xs font-medium text-slate-400">대화</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-sm text-slate-200 transition hover:border-cyan-400/30 md:hidden"
              aria-label="사이드바 닫기"
              title="사이드바 닫기"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((previous) => !previous)}
              className="hidden rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-sm text-slate-200 transition hover:border-cyan-400/30 md:block"
              aria-label={isCollapsedView ? '사이드바 펼치기' : '사이드바 접기'}
              title={isCollapsedView ? '사이드바 펼치기' : '사이드바 접기'}
            >
              {isCollapsedView ? '›' : '‹'}
            </button>
          </div>
        </div>

        {!isCollapsedView ? (
          <ConversationList
            sessions={sessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={(sessionId) => {
              setActiveSessionId(sessionId);
              setIsMobileSidebarOpen(false);
            }}
            handleNewConversation={() => {
              startNewConversation();
              setIsMobileSidebarOpen(false);
            }}
            handlePinConversation={handlePinConversation}
            handleDeleteConversation={handleDeleteConversation}
            handleStartRename={handleStartRename}
            handleSaveRename={handleSaveRename}
            editingSessionId={editingSessionId}
            editingTitle={editingTitle}
            setEditingTitle={setEditingTitle}
          />
        ) : (
          <div className="flex flex-1 items-start justify-center pt-2">
            <button
              type="button"
              onClick={startNewConversation}
              className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-100"
              title="새 대화"
              aria-label="새 대화"
            >
              +
            </button>
          </div>
        )}

                <div className="mt-auto border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAiSettingsPanelOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/30"
            >
              {isCollapsedView ? '모델' : '모델 설정'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaceholderSettingsOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-sm text-slate-200 transition hover:border-cyan-400/30"
              aria-label="추가 설정"
              title="추가 설정"
            >
              ⚙
            </button>
          </div>
        </div>

      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-gray-800 p-0">
        <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/70 px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-sm text-slate-200 transition hover:border-cyan-400/30"
            aria-label="사이드바 열기"
            title="사이드바 열기"
          >
            ☰
          </button>
          <p className="truncate text-sm font-medium text-slate-200">{activeSession?.title ?? '대화'}</p>
        </div>

                <ChatWindow
          activeSession={activeSession}
          activeTurns={activeTurns}
          formattedActiveSessionCreatedAt={formattedActiveSessionCreatedAt}
          chatFontSize={chatFontSize}
          userMode={userMode}
          onReuseQuestion={setQuestion}
        />

        <ChatInput
          question={question}
          setQuestion={setQuestion}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
          isGenerating={isGenerating}
        />
      </main>

            {isAiSettingsPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-[95vw] max-w-7xl overflow-y-auto rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-glow">
            <button
              type="button"
              onClick={() => setIsAiSettingsPanelOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
                        </button>
                                    <AiSettingsPanel
              userMode={userMode}
              setUserMode={setUserMode}
              developerParams={developerParams}
              setDeveloperParam={setDeveloperParam}
              developerParamRules={developerParamRules}
              selectedIds={selectedIds}
              summaryAiId={summaryAiId}
              setSummaryAiId={setSummaryAiId}
                            isSummaryRequested={isSummaryRequested}
              setIsSummaryRequested={setIsSummaryRequested}
              isSummaryEnabled={isSummaryEnabled}
              isSummaryAutoMode={isSummaryAutoMode}
              canSelectSummaryAi={canSelectSummaryAi}

              selectedModels={selectedModels}
              keyInputs={keyInputs}
              keyStatuses={keyStatuses}
              handleProviderToggle={handleProviderToggle}
              handleModelChange={handleModelChange}
              setKeyInputs={setKeyInputs}
              handleLoadKey={handleLoadKey}
                                          summaryPersonaPreset={summaryPersonaPreset}
              setSummaryPersonaPreset={setSummaryPersonaPreset}
              summaryPersonaPresets={summaryPersonaPresets}
              useCustomSummaryInstruction={useCustomSummaryInstruction}
              setUseCustomSummaryInstruction={setUseCustomSummaryInstruction}
              customSummaryInstruction={customSummaryInstruction}
              setCustomSummaryInstruction={setCustomSummaryInstruction}
              customInstructionMaxLength={customInstructionMaxLength}
              answerPresetMap={answerPresetMap}
              setProviderAnswerPreset={setProviderAnswerPreset}
              answerPresetOptions={answerPresetOptions}
              useCustomAnswerInstructionMap={useCustomAnswerInstructionMap}
              setProviderCustomAnswerInstructionEnabled={setProviderCustomAnswerInstructionEnabled}
              answerInstructionInputMap={answerInstructionInputMap}
              setProviderAnswerInstructionInput={setProviderAnswerInstructionInput}
              answerInstructionMaxLength={answerInstructionMaxLength}
            />
          </div>
        </div>
      )}

            <AppSettingsModal
              isOpen={isPlaceholderSettingsOpen}
              onClose={() => setIsPlaceholderSettingsOpen(false)}
                            formattedTotalUsageUsd={formattedTotalUsageUsd}
              chatFontSize={chatFontSize}
              setChatFontSize={setChatFontSize}
            />


    </div>
  );
}










