// components/AiSettingsPanel.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { MOCK_AI_PROVIDERS, getModelsForProvider } from '@/lib/mockAis';
import useAccessibleDialog from '@/lib/hooks/useAccessibleDialog';

const FILTER_OPTIONS = [
  { id: 'all', label: '전체' },
  { id: 'text', label: '텍스트/코딩' },
  { id: 'audio', label: '오디오/음악' },
  { id: 'image', label: '이미지/비전' },
  { id: 'video', label: '비디오' },
];

const PROVIDER_CATEGORY_MAP = {
  openai: 'text',
  claude: 'text',
  gemini: 'text',
  perplexity: 'text',
  deepseek: 'text',
  mistral: 'text',
  qwen: 'text',
  cohere: 'text',
  groq: 'text',
  suno: 'audio',
  udio: 'audio',
  elevenlabs: 'audio',
  whisper: 'audio',
  flux: 'image',
  'stable-diffusion': 'image',
  roboflow: 'image',
  runway: 'video',
  luma: 'video',
};

const INTEGRATION_STATUS_META = {
  mock: { label: 'Mock', className: 'border-sky-300/30 bg-sky-300/10 text-sky-200' },
  verified: { label: '실연동 확인', className: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200' },
  unverified: { label: 'BYOK 미검증', className: 'border-amber-300/30 bg-amber-300/10 text-amber-200' },
  unsupported: { label: '미지원', className: 'border-rose-300/30 bg-rose-300/10 text-rose-200' },
};

function getVisibleIntegrationStatus(provider, userMode) {
  if (!provider.supportsChat) {
    return 'unsupported';
  }

  return userMode === 'general' ? 'mock' : provider.integrationStatus;
}

export default function AiSettingsPanel({
  dialogTitleId,
  userMode,
  setUserMode,
  developerParams,
  setDeveloperParam,
  developerParamRules,
  selectedIds,
  summaryAiId,
  setSummaryAiId,
  isSummaryRequested,
  setIsSummaryRequested,
  isSummaryEnabled,
  isSummaryAutoMode,
  canSelectSummaryAi,
  selectedModels,
  keyInputs,
  keyStatuses,
  handleProviderToggle,
  handleModelChange,
  setKeyInputs,
  handleLoadKey,
  summaryPersonaPreset,
  setSummaryPersonaPreset,
  summaryPersonaPresets,
  useCustomSummaryInstruction,
  setUseCustomSummaryInstruction,
  customSummaryInstruction,
  setCustomSummaryInstruction,
  customInstructionMaxLength,
  answerPresetMap,
  setProviderAnswerPreset,
  answerPresetOptions,
  useCustomAnswerInstructionMap,
  setProviderCustomAnswerInstructionEnabled,
  answerInstructionInputMap,
  setProviderAnswerInstructionInput,
  answerInstructionMaxLength,
}) {
  const [isSummaryPersonaModalOpen, setIsSummaryPersonaModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [developerParamInputs, setDeveloperParamInputs] = useState({
    temperature: String(developerParams.temperature),
    topP: String(developerParams.topP),
    maxTokens: String(developerParams.maxTokens),
  });
  const summaryPersonaDialogRef = useAccessibleDialog(
    userMode === 'developer' && isSummaryPersonaModalOpen,
    () => setIsSummaryPersonaModalOpen(false),
  );

  useEffect(() => {
    setDeveloperParamInputs({
      temperature: String(developerParams.temperature),
      topP: String(developerParams.topP),
      maxTokens: String(developerParams.maxTokens),
    });
  }, [developerParams.maxTokens, developerParams.temperature, developerParams.topP]);

  function handleDeveloperParamInputChange(key, value) {
    setDeveloperParamInputs((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function handleDeveloperParamInputBlur(key) {
    setDeveloperParam(key, developerParamInputs[key]);
  }

  const filteredProviders = useMemo(() => {
    if (selectedCategory === 'all') {
      return MOCK_AI_PROVIDERS;
    }

    return MOCK_AI_PROVIDERS.filter(
      (provider) => PROVIDER_CATEGORY_MAP[provider.id] === selectedCategory,
    );
  }, [selectedCategory]);

  useEffect(() => {
    MOCK_AI_PROVIDERS.forEach((provider) => {
      const availableModels = getModelsForProvider(provider.id, userMode);
      if (availableModels.length === 0) {
        return;
      }

      const currentModelId = selectedModels[provider.id];
      const isCurrentModelAvailable = availableModels.some((model) => model.id === currentModelId);

      if (!isCurrentModelAvailable) {
        handleModelChange(provider.id, availableModels[0].id);
      }
    });
  }, [handleModelChange, selectedModels, userMode]);

  return (
    <aside className="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
      <div>
        <h2 id={dialogTitleId} className="font-display text-xl font-semibold text-white">비교 AI 선택 / 요약 AI</h2>
        <p className="mt-1 text-sm text-slate-400">
          비교할 AI를 선택하고, 요약 전용 AI를 별도로 지정할 수 있습니다.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">사용 모드</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setUserMode('general')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              userMode === 'general'
                ? 'border border-cyan-400/40 bg-cyan-400/20 text-cyan-100'
                : 'border border-white/10 bg-slate-900 text-slate-300 hover:border-cyan-400/30'
            }`}
          >
            일반 모드
          </button>
          <button
            type="button"
            onClick={() => setUserMode('developer')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              userMode === 'developer'
                ? 'border border-cyan-400/40 bg-cyan-400/20 text-cyan-100'
                : 'border border-white/10 bg-slate-900 text-slate-300 hover:border-cyan-400/30'
            }`}
          >
            개발자 모드
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {userMode === 'developer'
            ? '개발자 모드: API 키(BYOK), 파라미터, 과거~현재 전체 모델을 직접 설정합니다.'
            : '일반 모드: 비용이 발생하지 않는 TEST mock으로 제품 흐름을 체험합니다. 실제 AI 응답이 아닙니다.'}
        </p>

        <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSummaryRequested}
              onChange={(event) => setIsSummaryRequested(event.target.checked)}
              className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-400"
            />
            요약 AI 사용
          </label>

          {!isSummaryRequested ? (
            <p>요약 OFF: 원본 비교 모드로 동작합니다. (요약 카드 미생성)</p>
          ) : (
            <>
              {selectedIds.length <= 1 && <p>AI 2개 이상 선택 시 요약 AI가 활성화됩니다.</p>}
              {isSummaryAutoMode && isSummaryEnabled && (
                <p>AI 2개 선택 상태: 요약 AI 자동 지정 ({summaryAiId || '미지정'})</p>
              )}
              {canSelectSummaryAi && isSummaryEnabled && <p>AI 3개 이상 선택 상태: 요약 AI를 직접 지정할 수 있습니다.</p>}
            </>
          )}
        </div>

        {userMode === 'developer' && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <p className="mb-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-2 text-[11px] leading-5 text-cyan-100">
              BYOK 키는 현재 탭의 메모리에만 유지되며 대화 저장소나 서버에 보관되지 않습니다. 새로고침하면 삭제됩니다.
            </p>
            <p className="text-xs font-medium text-slate-300">개발자 파라미터</p>
            <p className="mt-1 text-[11px] text-slate-500">
              허용 범위를 벗어난 값은 자동 보정됩니다. (temperature: 0~2, topP: 0~1, maxTokens: 1~8192)
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="space-y-1 text-xs text-slate-400">
                <span>Temperature</span>
                <input
                  type="number"
                  min={developerParamRules.temperature.min}
                  max={developerParamRules.temperature.max}
                  step={developerParamRules.temperature.step}
                  value={developerParamInputs.temperature}
                  onChange={(event) => handleDeveloperParamInputChange('temperature', event.target.value)}
                  onBlur={() => handleDeveloperParamInputBlur('temperature')}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                <span>Top P</span>
                <input
                  type="number"
                  min={developerParamRules.topP.min}
                  max={developerParamRules.topP.max}
                  step={developerParamRules.topP.step}
                  value={developerParamInputs.topP}
                  onChange={(event) => handleDeveloperParamInputChange('topP', event.target.value)}
                  onBlur={() => handleDeveloperParamInputBlur('topP')}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                <span>Max Tokens</span>
                <input
                  type="number"
                  min={developerParamRules.maxTokens.min}
                  max={developerParamRules.maxTokens.max}
                  step={developerParamRules.maxTokens.step}
                  value={developerParamInputs.maxTokens}
                  onChange={(event) => handleDeveloperParamInputChange('maxTokens', event.target.value)}
                  onBlur={() => handleDeveloperParamInputBlur('maxTokens')}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
                />
              </label>
            </div>
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs font-medium text-slate-300">카테고리 필터</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((filterOption) => {
            const isActive = selectedCategory === filterOption.id;

            return (
              <button
                key={filterOption.id}
                type="button"
                onClick={() => setSelectedCategory(filterOption.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'border border-cyan-400/40 bg-cyan-400/20 text-cyan-100'
                    : 'border border-white/10 bg-slate-900 text-slate-300 hover:border-cyan-400/30'
                }`}
              >
                {filterOption.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {filteredProviders.map((provider) => {
          const isSelected = selectedIds.includes(provider.id);
          const isSummary = summaryAiId === provider.id && isSummaryEnabled;
          const visibleIntegrationStatus = getVisibleIntegrationStatus(provider, userMode);
          const integrationStatusMeta = INTEGRATION_STATUS_META[visibleIntegrationStatus];
          const providerModels = getModelsForProvider(provider.id, userMode);
          const selectedModelId = providerModels.some((model) => model.id === selectedModels[provider.id])
            ? selectedModels[provider.id]
            : providerModels[0]?.id ?? '';

          return (
            <article
              key={provider.id}
              className={`rounded-2xl border p-4 transition ${
                isSelected ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  id={`provider-${provider.id}`}
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleProviderToggle(provider.id)}
                  disabled={!provider.supportsChat}
                  className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                />
                <div className="min-w-0 flex-1">
                  <label htmlFor={`provider-${provider.id}`} className="cursor-pointer">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-words font-semibold text-white">{provider.name}</span>
                      <span
                        className={`rounded-full bg-gradient-to-r ${provider.accent} px-2.5 py-1 text-[11px] font-semibold text-slate-950`}
                      >
                        {provider.shortName}
                      </span>
                      {isSummary && (
                        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                          Summary AI
                        </span>
                      )}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${integrationStatusMeta.className}`}>
                        {integrationStatusMeta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{provider.focus}</p>
                    {!provider.supportsChat && (
                      <p className="mt-1 text-[11px] text-rose-300/90">목록만 제공되며 현재 실행할 수 없습니다.</p>
                    )}
                  </label>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label htmlFor={`model-${provider.id}`} className="block text-xs font-medium text-slate-300">
                  모델 선택
                </label>
                <select
                  id={`model-${provider.id}`}
                  value={selectedModelId}
                  onChange={(event) => handleModelChange(provider.id, event.target.value)}
                  disabled={!provider.supportsChat}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
                >
                  {providerModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} · {model.note}
                    </option>
                  ))}
                </select>
              </div>

              {userMode === 'general' && !isSummary && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  <label className="block text-xs font-medium text-slate-300">응답 인터렉션 프리셋</label>
                  <select
                    value={answerPresetMap[provider.id]}
                    onChange={(event) => setProviderAnswerPreset(provider.id, event.target.value)}
                    disabled={!provider.supportsChat}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
                  >
                    {Object.entries(answerPresetOptions).map(([presetId, preset]) => (
                      <option key={presetId} value={presetId}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {answerPresetOptions[answerPresetMap[provider.id]]?.instruction}
                  </p>
                </div>
              )}

                            {userMode === 'general' && isSummary && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  <label className="block text-xs font-medium text-slate-300">요약 인터렉션 프리셋</label>
                  <select
                    value={summaryPersonaPreset}
                    onChange={(event) => setSummaryPersonaPreset(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
                  >
                    {Object.entries(summaryPersonaPresets).map(([presetId, preset]) => (
                      <option key={presetId} value={presetId}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {summaryPersonaPresets[summaryPersonaPreset]?.instruction}
                  </p>
                </div>
              )}

              {userMode === 'developer' && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(useCustomAnswerInstructionMap[provider.id])}
                      onChange={(event) =>
                        setProviderCustomAnswerInstructionEnabled(provider.id, event.target.checked)
                      }
                      disabled={!provider.supportsChat}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-400"
                    />
이 AI에 커스텀 응답 인터렉션 사용
                  </label>
                  <textarea
                    value={answerInstructionInputMap[provider.id] ?? ''}
                    onChange={(event) =>
                      setProviderAnswerInstructionInput(provider.id, event.target.value)
                    }
                    disabled={!useCustomAnswerInstructionMap[provider.id]}
                    placeholder="예: 사용자의 감정을 먼저 반영한 뒤, 해결 단계를 3개로 제시하세요."
                    rows={4}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-500">
                    {(answerInstructionInputMap[provider.id] ?? '').length}/{answerInstructionMaxLength}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSummaryAiId(provider.id)}
                  disabled={!isSummaryEnabled || !canSelectSummaryAi || !isSelected}
                  className="w-full rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  {!isSummaryRequested
                    ? '요약 OFF'
                    : isSummary
                      ? '요약 AI로 선택됨'
                      : isSummaryAutoMode
                        ? '2개 선택 시 자동 지정'
                        : '요약 AI로 지정'}
                </button>
                {userMode === 'developer' && isSummary && isSummaryEnabled && (
                  <button
                    type="button"
                    onClick={() => setIsSummaryPersonaModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/30"
                    aria-label="요약 AI 인터렉션 설정"
                    title="요약 AI 인터렉션 설정"
                  >
                    ⚙
                  </button>
                )}
              </div>

              {userMode === 'developer' ? (
                <div className="mt-4 space-y-3">
                  <label htmlFor={`api-key-${provider.id}`} className="block text-xs font-medium text-slate-300">
                    API 키 입력
                  </label>
                  <input
                    id={`api-key-${provider.id}`}
                    type="password"
                    value={keyInputs[provider.id]}
                    onChange={(event) =>
                      setKeyInputs((previous) => ({
                        ...previous,
                        [provider.id]: event.target.value,
                      }))
                    }
                    disabled={!provider.supportsChat}
                    placeholder={`${provider.shortName} 키`}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleLoadKey(provider.id)}
                    disabled={!provider.supportsChat}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/30"
                  >
                    키 불러오기 ({keyStatuses[provider.id]})
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
                  일반 모드에서는 실제 API를 호출하지 않고 TEST mock을 사용합니다.
                </div>
              )}
            </article>
          );
        })}
      </div>

      {filteredProviders.length === 0 && (
        <p className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
          선택한 카테고리에 표시할 AI가 없습니다.
        </p>
      )}

      {userMode === 'developer' && isSummaryPersonaModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <button
            type="button"
aria-label="요약 인터렉션 설정 닫기"
            onClick={() => setIsSummaryPersonaModalOpen(false)}
            className="absolute inset-0"
          />

          <section
            ref={summaryPersonaDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-persona-dialog-title"
            tabIndex={-1}
            className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-glow"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 id="summary-persona-dialog-title" className="text-lg font-semibold text-white">요약 AI 인터렉션 설정</h3>
                <p className="mt-1 text-xs text-slate-400">
                  개발자 모드 전용 설정입니다. 커스텀 인터렉션을 직접 입력할 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryPersonaModalOpen(false)}
                className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-300 hover:border-cyan-400/30"
              >
                닫기
              </button>
            </div>

            <div className="mt-4 space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={useCustomSummaryInstruction}
                    onChange={(event) => setUseCustomSummaryInstruction(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-400"
                  />
                  개발자 모드 커스텀 인터렉션 사용
                </label>

                <p className="mt-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
                  경고: 커스텀 인터렉션은 응답 품질/비용/안전성에 영향을 줄 수 있습니다. 민감정보나 비밀키를 입력하지 마세요.
                </p>
                <textarea
                  value={customSummaryInstruction}
                  onChange={(event) => setCustomSummaryInstruction(event.target.value)}
                  disabled={!useCustomSummaryInstruction}
                  placeholder="요약 AI에 적용할 커스텀 인터렉션을 입력하세요."
                  rows={6}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
                />
                <p className="mt-1 text-right text-[11px] text-slate-500">
                  {customSummaryInstruction.length}/{customInstructionMaxLength}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
