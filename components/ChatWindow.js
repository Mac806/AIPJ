// components/ChatWindow.js
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MOCK_AI_PROVIDERS, getModelLabel } from '@/lib/mockAis';
import { formatUSD, getResponseStatusLabel } from '@/lib/utils';

function getProviderName(providerId) {
  return MOCK_AI_PROVIDERS.find((provider) => provider.id === providerId)?.name ?? providerId;
}

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

const STATUS_LABELS = {
  all: '전체',
  done: '완료',
  streaming: '생성중',
  loading: '로딩',
  blocked: '차단',
  error: '오류',
};

const CATEGORY_LABELS = {
  all: '전체',
  text: '텍스트',
  audio: '오디오',
  image: '이미지',
  video: '비디오',
};

const VIRTUAL_ROW_HEIGHT = 320;
const VIRTUAL_ROW_GAP = 12;
const VIRTUAL_OVERSCAN_ROWS = 2;
const VIRTUALIZATION_THRESHOLD = 10;
const DEFAULT_ANSWER_VIEW_MODE = 'focus';
const DEFAULT_ANSWER_SORT_MODE = 'default';
const DEFAULT_ANSWER_STATUS_FILTER = 'all';
const DEFAULT_ANSWER_CATEGORY_FILTER = 'all';
const CHAT_FONT_SIZE_MAP = {
  sm: {
    question: 'text-sm',
    answer: 'text-sm leading-6',
    summary: 'text-sm leading-6',
    modal: 'text-sm leading-6',
  },
  md: {
    question: 'text-base',
    answer: 'text-base leading-7',
    summary: 'text-base leading-7',
    modal: 'text-base leading-7',
  },
  lg: {
    question: 'text-lg',
    answer: 'text-lg leading-8',
    summary: 'text-lg leading-8',
    modal: 'text-lg leading-8',
  },
};

function getColumnsForViewMode(viewMode, viewportWidth) {
  if (viewMode === 'split') {
    return viewportWidth >= 768 ? 2 : 1;
  }

  if (viewMode === 'grid') {
    if (viewportWidth >= 1280) {
      return 3;
    }

    if (viewportWidth >= 640) {
      return 2;
    }

    return 1;
  }

  return 1;
}

function VirtualizedAnswerGrid({
  providerIds,
  answers,
  columns,
  renderAnswerCard,
  compact,
}) {
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      setViewportHeight(element.clientHeight);
    });

    observer.observe(element);
    setViewportHeight(element.clientHeight);

    return () => observer.disconnect();
  }, []);

  const totalRows = Math.ceil(providerIds.length / columns);
  const rowUnit = VIRTUAL_ROW_HEIGHT + VIRTUAL_ROW_GAP;
  const totalHeight = Math.max(0, totalRows * rowUnit - VIRTUAL_ROW_GAP);
  const startRow = Math.max(0, Math.floor(scrollTop / rowUnit) - VIRTUAL_OVERSCAN_ROWS);
  const visibleRows = Math.ceil((viewportHeight || rowUnit) / rowUnit) + VIRTUAL_OVERSCAN_ROWS * 2;
  const endRow = Math.min(totalRows, startRow + visibleRows);

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      className="max-h-[55vh] overflow-y-auto pr-1"
    >
      <div className="relative" style={{ height: `${totalHeight}px` }}>
        {Array.from({ length: Math.max(0, endRow - startRow) }, (_, index) => {
          const rowIndex = startRow + index;
          const top = rowIndex * rowUnit;
          const startIndex = rowIndex * columns;
          const rowProviderIds = providerIds.slice(startIndex, startIndex + columns);

          return (
            <div
              key={`row-${rowIndex}`}
              className="absolute left-0 right-0"
              style={{
                top: `${top}px`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: `${VIRTUAL_ROW_GAP}px`,
              }}
            >
              {rowProviderIds.map((providerId) => (
                <div key={providerId} style={{ height: `${VIRTUAL_ROW_HEIGHT}px` }}>
                  {renderAnswerCard(providerId, answers?.[providerId], {
                    compact,
                    cardClassName: 'h-full',
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function shouldUseVirtualizedGrid(viewMode, providerCount) {
  return (viewMode === 'split' || viewMode === 'grid') && providerCount >= VIRTUALIZATION_THRESHOLD;
}

function formatSummaryUsd(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStatusChipClass(status = '') {
  if (status === 'done') {
    return 'border-emerald-400/30 bg-emerald-400/15 text-emerald-100';
  }

  if (status === 'streaming' || status === 'loading') {
    return 'border-cyan-400/30 bg-cyan-400/15 text-cyan-100';
  }

  if (status === 'blocked') {
    return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
  }

  if (status === 'error') {
    return 'border-rose-400/30 bg-rose-400/15 text-rose-100';
  }

  return 'border-white/10 bg-slate-800 text-slate-200';
}

function getStatusRank(status = '') {
  switch (status) {
    case 'done':
      return 0;
    case 'streaming':
      return 1;
    case 'loading':
      return 2;
    case 'blocked':
      return 3;
    case 'error':
      return 4;
    default:
      return 5;
  }
}

function getAnswerPreview(text = '', maxLength = 90) {
  if (!text) {
    return '응답 없음';
  }

  const normalizedText = text.replace(/\s+/g, ' ').trim();
  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength)}…`;
}

export default function ChatWindow({
  activeSession,
  activeTurns,
  formattedActiveSessionCreatedAt,
  chatFontSize = 'md',
}) {
  const [openedTurnId, setOpenedTurnId] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [answerViewModeByTurn, setAnswerViewModeByTurn] = useState({});
  const [answerSortModeByTurn, setAnswerSortModeByTurn] = useState({});
  const [answerStatusFilterByTurn, setAnswerStatusFilterByTurn] = useState({});
  const [answerCategoryFilterByTurn, setAnswerCategoryFilterByTurn] = useState({});
  const [focusedProviderByTurn, setFocusedProviderByTurn] = useState({});
  const [viewportWidth, setViewportWidth] = useState(0);
  const messagesEndRef = useRef(null);

  const openedTurn = useMemo(
    () => activeTurns.find((turn) => turn.id === openedTurnId) ?? null,
    [activeTurns, openedTurnId],
  );

  const openedProviderIds = useMemo(() => {
    if (!openedTurn) {
      return [];
    }

    const providerIdsFromTurn = openedTurn.providerIds ?? [];
    const fallbackIds = Object.keys(openedTurn.answers ?? {});
    return providerIdsFromTurn.length > 0 ? providerIdsFromTurn : fallbackIds;
  }, [openedTurn]);

  const selectedProviderAnswer = openedTurn?.answers?.[selectedProviderId] ?? null;
  const fontClasses = CHAT_FONT_SIZE_MAP[chatFontSize] ?? CHAT_FONT_SIZE_MAP.md;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTurns]);

  useEffect(() => {
    if (!openedTurn) {
      setSelectedProviderId('');
      return;
    }

    if (!selectedProviderId || !openedProviderIds.includes(selectedProviderId)) {
      setSelectedProviderId(openedProviderIds[0] ?? '');
    }
  }, [openedTurn, openedProviderIds, selectedProviderId]);

  useEffect(() => {
    if (!openedTurn) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenedTurnId(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [openedTurn]);

  useEffect(() => {
    const syncViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    syncViewportWidth();
    window.addEventListener('resize', syncViewportWidth);
    return () => window.removeEventListener('resize', syncViewportWidth);
  }, []);

  function getTurnProviderIds(turn) {
    const providerIdsFromTurn = turn.providerIds ?? [];
    const fallbackIds = Object.keys(turn.answers ?? {});
    return providerIdsFromTurn.length > 0 ? providerIdsFromTurn : fallbackIds;
  }

  function getVisibleProviderIds(turnProviderIds = [], answers = {}, options = {}) {
    const {
      categoryFilter = DEFAULT_ANSWER_CATEGORY_FILTER,
      statusFilter = DEFAULT_ANSWER_STATUS_FILTER,
    } = options;

    return turnProviderIds
      .filter((providerId) => {
        if (categoryFilter === 'all') {
          return true;
        }

        return PROVIDER_CATEGORY_MAP[providerId] === categoryFilter;
      })
      .filter((providerId) => {
        if (statusFilter === 'all') {
          return true;
        }

        return (answers[providerId]?.status ?? '') === statusFilter;
      });
  }

  function sortProviderIds(providerIds = [], answers = {}, sortMode = DEFAULT_ANSWER_SORT_MODE) {
    const sortable = [...providerIds];

    if (sortMode === 'name') {
      return sortable.sort((a, b) => getProviderName(a).localeCompare(getProviderName(b), 'ko'));
    }

    if (sortMode === 'status') {
      return sortable.sort((a, b) => {
        const rankDiff = getStatusRank(answers[a]?.status) - getStatusRank(answers[b]?.status);
        if (rankDiff !== 0) {
          return rankDiff;
        }

        return getProviderName(a).localeCompare(getProviderName(b), 'ko');
      });
    }

    if (sortMode === 'cost') {
      return sortable.sort((a, b) => (answers[b]?.cost?.totalUsd ?? 0) - (answers[a]?.cost?.totalUsd ?? 0));
    }

    if (sortMode === 'length') {
      return sortable.sort((a, b) => (answers[b]?.text?.length ?? 0) - (answers[a]?.text?.length ?? 0));
    }

    return sortable;
  }

  function buildVisibleAnswerStats(providerIds = [], answers = {}) {
    const statusCounts = {
      done: 0,
      streaming: 0,
      loading: 0,
      blocked: 0,
      error: 0,
    };

    let totalCostUsd = 0;

    providerIds.forEach((providerId) => {
      const answer = answers[providerId] ?? {};
      const status = answer.status ?? '';

      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }

      totalCostUsd += answer?.cost?.totalUsd ?? 0;
    });

    return { statusCounts, totalCostUsd };
  }

  function renderAnswerCard(providerId, answer = {}, options = {}) {
    const {
      compact = false,
      showProvider = true,
      cardClassName = '',
    } = options;

    return (
      <article key={providerId} className={`rounded-2xl border border-white/10 bg-slate-900/60 p-3 ${cardClassName}`}>
        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          {showProvider && <span className="font-semibold text-slate-200">{getProviderName(providerId)}</span>}
          <span>모델: {getModelLabel(providerId, answer.modelId)}</span>
          <span>·</span>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 ${getStatusChipClass(answer.status)}`}>
            {getResponseStatusLabel(answer.status)}
          </span>
          <span>·</span>
          <span>{answer?.cost?.label ?? '비용'} {formatUSD(answer?.cost?.totalUsd ?? 0)}</span>
        </div>

        {compact && (
          <p className="mb-2 text-[11px] text-slate-400">{getAnswerPreview(answer.text)}</p>
        )}

        <p className={`whitespace-pre-wrap break-words text-slate-100 ${fontClasses.answer} ${compact ? 'max-h-40 overflow-y-auto' : ''}`}>
          {answer.text || '응답이 비어 있습니다.'}
        </p>
      </article>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-gray-800 p-4">
      <div className="mb-4 flex items-center justify-between border-b border-gray-600 pb-4">
        <h2 className="font-display max-w-[70%] truncate text-xl font-semibold text-white">
          {activeSession?.title ?? '대화를 선택하세요'}
        </h2>
        <div className="text-sm text-gray-400">{formattedActiveSessionCreatedAt}</div>
      </div>

      <div className="w-full space-y-6 pt-4">
        {activeTurns.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            아직 이 대화에는 질문이 없습니다. 질문을 입력하면 여기서 이어집니다.
          </div>
        ) : (
          activeTurns.map((turn) => {
            const turnProviderIds = getTurnProviderIds(turn);
            const turnAnswers = turn.answers ?? {};
            const turnAnswerViewMode = answerViewModeByTurn[turn.id] ?? DEFAULT_ANSWER_VIEW_MODE;
            const turnAnswerSortMode = answerSortModeByTurn[turn.id] ?? DEFAULT_ANSWER_SORT_MODE;
            const turnAnswerStatusFilter = answerStatusFilterByTurn[turn.id] ?? DEFAULT_ANSWER_STATUS_FILTER;
            const turnAnswerCategoryFilter = answerCategoryFilterByTurn[turn.id] ?? DEFAULT_ANSWER_CATEGORY_FILTER;
            const filteredProviderIds = getVisibleProviderIds(turnProviderIds, turnAnswers, {
              categoryFilter: turnAnswerCategoryFilter,
              statusFilter: turnAnswerStatusFilter,
            });
            const sortedProviderIds = sortProviderIds(filteredProviderIds, turnAnswers, turnAnswerSortMode);
            const summaryIsDisabled = turn.summary?.status === 'disabled';
            const focusedProviderId = sortedProviderIds.includes(focusedProviderByTurn[turn.id])
              ? focusedProviderByTurn[turn.id]
              : (sortedProviderIds[0] ?? '');
            const visibleAnswerStats = buildVisibleAnswerStats(sortedProviderIds, turnAnswers);
            const hasActiveFilters =
              turnAnswerSortMode !== DEFAULT_ANSWER_SORT_MODE
              || turnAnswerStatusFilter !== DEFAULT_ANSWER_STATUS_FILTER
              || turnAnswerCategoryFilter !== DEFAULT_ANSWER_CATEGORY_FILTER;
            const viewColumns = getColumnsForViewMode(turnAnswerViewMode, viewportWidth);
            const useVirtualizedGrid = shouldUseVirtualizedGrid(turnAnswerViewMode, sortedProviderIds.length);

            return (
              <div key={turn.id} className="w-full space-y-4">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl rounded-bl-none bg-blue-600 p-3 text-white shadow-md sm:max-w-[75%]">
                    <p className="font-semibold">나:</p>
                    <p className={`mt-1 whitespace-pre-wrap break-words ${fontClasses.question}`}>{turn.question}</p>
                    <div className="mt-2 text-right text-xs text-blue-200">
                      {new Date(turn.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[95%] rounded-xl rounded-br-none bg-gray-700 p-3 text-slate-100 shadow-md sm:max-w-[90%]">
                    {summaryIsDisabled ? (
                      <div className="space-y-3">
                        <div className="space-y-2 border-b border-gray-600 pb-2 text-xs text-gray-400">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>요약 OFF · 원본 비교 모드</span>
                            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/70 p-1">
                              {[
                                { id: 'focus', label: 'Focus' },
                                { id: 'split', label: 'Split' },
                                { id: 'grid', label: 'Grid' },
                              ].map((mode) => (
                                <button
                                  key={mode.id}
                                  type="button"
                                  onClick={() =>
                                    setAnswerViewModeByTurn((previous) => ({
                                      ...previous,
                                      [turn.id]: mode.id,
                                    }))
                                  }
                                  className={`rounded-full px-2 py-1 text-[11px] font-semibold transition ${
                                    turnAnswerViewMode === mode.id
                                      ? 'bg-cyan-400/20 text-cyan-100'
                                      : 'text-slate-300 hover:text-slate-100'
                                  }`}
                                >
                                  {mode.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid gap-2 md:grid-cols-3">
                            <label className="space-y-1">
                              <span className="text-[11px] text-slate-500">정렬</span>
                              <select
                                value={turnAnswerSortMode}
                                onChange={(event) =>
                                  setAnswerSortModeByTurn((previous) => ({
                                    ...previous,
                                    [turn.id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-200"
                              >
                                <option value="default">기본순</option>
                                <option value="status">상태순</option>
                                <option value="cost">비용 높은순</option>
                                <option value="length">길이 긴순</option>
                                <option value="name">이름순</option>
                              </select>
                            </label>

                            <label className="space-y-1">
                              <span className="text-[11px] text-slate-500">상태 필터</span>
                              <select
                                value={turnAnswerStatusFilter}
                                onChange={(event) =>
                                  setAnswerStatusFilterByTurn((previous) => ({
                                    ...previous,
                                    [turn.id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-200"
                              >
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            </label>

                            <label className="space-y-1">
                              <span className="text-[11px] text-slate-500">카테고리 필터</span>
                              <select
                                value={turnAnswerCategoryFilter}
                                onChange={(event) =>
                                  setAnswerCategoryFilterByTurn((previous) => ({
                                    ...previous,
                                    [turn.id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-200"
                              >
                                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                            <p>
                              표시 중: {sortedProviderIds.length} / 전체 {turnProviderIds.length}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span>완료 {visibleAnswerStats.statusCounts.done}</span>
                              <span>·</span>
                              <span>생성중 {visibleAnswerStats.statusCounts.streaming + visibleAnswerStats.statusCounts.loading}</span>
                              <span>·</span>
                              <span>오류 {visibleAnswerStats.statusCounts.error}</span>
                              <span>·</span>
                              <span>비용 {formatUSD(visibleAnswerStats.totalCostUsd)}</span>
                            </div>
                          </div>

                          {hasActiveFilters && (
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setAnswerSortModeByTurn((previous) => ({
                                    ...previous,
                                    [turn.id]: DEFAULT_ANSWER_SORT_MODE,
                                  }));
                                  setAnswerStatusFilterByTurn((previous) => ({
                                    ...previous,
                                    [turn.id]: DEFAULT_ANSWER_STATUS_FILTER,
                                  }));
                                  setAnswerCategoryFilterByTurn((previous) => ({
                                    ...previous,
                                    [turn.id]: DEFAULT_ANSWER_CATEGORY_FILTER,
                                  }));
                                }}
                                className="rounded-full border border-white/10 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-cyan-400/30"
                              >
                                필터/정렬 초기화
                              </button>
                            </div>
                          )}
                        </div>

                        {sortedProviderIds.length === 0 && (
                          <p className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
                            현재 필터 조건에 해당하는 응답이 없습니다.
                          </p>
                        )}

                        {turnAnswerViewMode === 'focus' && sortedProviderIds.length > 0 && (
                          <>
                            <div className="flex flex-wrap gap-1.5">
                              {sortedProviderIds.map((providerId) => (
                                <button
                                  key={providerId}
                                  type="button"
                                  onClick={() =>
                                    setFocusedProviderByTurn((previous) => ({
                                      ...previous,
                                      [turn.id]: providerId,
                                    }))
                                  }
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                                    focusedProviderId === providerId
                                      ? 'border-cyan-400/50 bg-cyan-400/20 text-cyan-100'
                                      : 'border-white/10 bg-slate-900 text-slate-300 hover:border-cyan-400/30'
                                  }`}
                                >
                                  {getProviderName(providerId)}
                                </button>
                              ))}
                            </div>
                            {focusedProviderId && renderAnswerCard(focusedProviderId, turnAnswers?.[focusedProviderId])}
                          </>
                        )}

                        {(turnAnswerViewMode === 'split' || turnAnswerViewMode === 'grid') && sortedProviderIds.length > 0 && (
                          useVirtualizedGrid ? (
                            <VirtualizedAnswerGrid
                              providerIds={sortedProviderIds}
                              answers={turnAnswers}
                              columns={viewColumns}
                              renderAnswerCard={renderAnswerCard}
                              compact
                            />
                          ) : (
                            <div className={`grid gap-3 ${turnAnswerViewMode === 'split' ? 'md:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
                              {sortedProviderIds.map((providerId) =>
                                renderAnswerCard(providerId, turnAnswers?.[providerId]),
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <>
                        <p className={`mt-2 whitespace-pre-wrap break-words text-slate-200 ${fontClasses.summary}`}>
                          {turn.summary.text || '요약 AI가 답변들을 정리하는 중입니다...'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-600 pt-2 text-xs text-gray-400">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>
                              요약 AI 모델:{' '}
                              {turn.summaryProviderId
                                ? getModelLabel(turn.summaryProviderId, turn.summaryModelId)
                                : turn.mainProviderId
                                  ? getModelLabel(turn.mainProviderId, turn.mainModelId)
                                  : '-'}{' '}
                              · {getResponseStatusLabel(turn.summary.status)}
                            </span>
                            <span>·</span>
                            <span>
                              {turn.summary?.cost?.label ?? '비용'} {formatSummaryUsd(turn.summary?.cost?.totalUsd ?? 0)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOpenedTurnId(turn.id)}
                            className="inline-flex items-center rounded-full border border-gray-600 bg-gray-800 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/30"
                          >
                            원본 대화 보기
                          </button>
                        </div>
                      </>
                    )}

                    {summaryIsDisabled && (
                      <div className="mt-3 border-t border-gray-600 pt-2 text-right">
                        <button
                          type="button"
                          onClick={() => setOpenedTurnId(turn.id)}
                          className="inline-flex items-center rounded-full border border-gray-600 bg-gray-800 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/30"
                        >
                          원본 대화 보기
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {openedTurn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="원본 답변 모달 닫기"
            onClick={() => setOpenedTurnId(null)}
            className="absolute inset-0"
          />

          <section className="relative z-10 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-glow">
            <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-white">원본 답변</h3>
                <p className="mt-1 truncate text-xs text-slate-400">질문: {openedTurn.question}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenedTurnId(null)}
                className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-300 hover:border-cyan-400/30"
              >
                닫기
              </button>
            </header>

            <div className="overflow-x-auto border-b border-white/10 px-3 py-2">
              <div className="flex min-w-max gap-2">
                {openedProviderIds.map((providerId) => {
                  const isActive = providerId === selectedProviderId;
                  return (
                    <button
                      key={providerId}
                      type="button"
                      onClick={() => setSelectedProviderId(providerId)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        isActive
                          ? 'border border-cyan-400/50 bg-cyan-400/20 text-cyan-100'
                          : 'border border-white/10 bg-slate-900 text-slate-300 hover:border-cyan-400/30'
                      }`}
                    >
                      {getProviderName(providerId)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {selectedProviderAnswer ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>
                      모델: {getModelLabel(selectedProviderId, selectedProviderAnswer.modelId)}
                    </span>
                    <span>·</span>
                    <span>상태: {getResponseStatusLabel(selectedProviderAnswer.status)}</span>
                    <span>·</span>
                    <span>
                      {selectedProviderAnswer?.cost?.label ?? '비용'}{' '}
                      {formatUSD(selectedProviderAnswer?.cost?.totalUsd ?? 0)}
                    </span>
                  </div>

                  <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className={`whitespace-pre-wrap break-words text-slate-100 ${fontClasses.modal}`}>
                      {selectedProviderAnswer.text || '응답이 비어 있습니다.'}
                    </p>
                  </article>
                </>
              ) : (
                <p className="text-sm text-slate-400">선택한 AI의 응답이 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
