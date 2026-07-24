'use client';

import { useEffect, useRef, useState } from 'react';
import { getModelLabel, getProviderById, splitIntoChunks } from '@/lib/mockAis';

function buildSummaryAnswersPayload(providerSnapshots, providerResults) {
  return providerSnapshots.reduce((accumulator, provider) => {
    const result = providerResults.find((item) => item.providerId === provider.id);
    accumulator[provider.id] = {
      providerName: provider.name,
      modelId: provider.modelId,
      modelName: provider.modelName,
      text: result?.text ?? '',
    };
    return accumulator;
  }, {});
}

async function requestChatResponse(payload) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || 'API 요청에 실패했습니다.');
  }

  return data;
}

export default function useChatOrchestrator({
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
  generationOptions,
  summaryInstruction,
  answerInstructionMap,
}) {
  const [question, setQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const timerRef = useRef([]);

  useEffect(
    () => () => {
      timerRef.current.forEach((timerId) => clearTimeout(timerId));
    },
    [],
  );

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || selectedProviders.length === 0 || isGenerating) {
      return;
    }

    let targetSessionId = activeSessionId;

    if (!targetSessionId || !sessions.some((session) => session.id === targetSessionId)) {
      const newSession = createSession('새 대화');
      targetSessionId = newSession.id;
    }

    const turnId = Date.now();
    const providerSnapshots = selectedProviders.map((provider) => {
      const modelId = selectedModels[provider.id];
      return {
        ...provider,
        modelId,
        modelName: getModelLabel(provider.id, modelId),
      };
    });

    const summaryModelId = summaryAiId ? selectedModels[summaryAiId] : '';
    const summaryProvider = summaryAiId ? getProviderById(summaryAiId) : null;
    const summarySupportsChat = Boolean(summaryProvider?.supportsChat);

    const providerKeys = providerSnapshots.reduce((accumulator, provider) => {
      if (userMode === 'general') {
        accumulator[provider.id] = 'TEST';
      } else {
        accumulator[provider.id] = loadedKeys[provider.id].trim();
      }
      return accumulator;
    }, {});

    timerRef.current.forEach((timerId) => clearTimeout(timerId));
    timerRef.current = [];

    const initialAnswers = providerSnapshots.reduce((accumulator, provider) => {
      const apiKey = providerKeys[provider.id];

      accumulator[provider.id] = !provider.supportsChat
        ? {
            status: 'blocked',
            text: '현재 텍스트 채팅을 지원하지 않는 서비스입니다.',
            chunks: [],
            cost: {
              label: '텍스트 미지원',
              currency: 'USD',
              totalUsd: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
            modelId: provider.modelId,
            modelName: provider.modelName,
            source: 'unsupported',
          }
        : apiKey
          ? {
              status: 'loading',
              text: '',
              chunks: [],
              cost: {
                label: apiKey === 'TEST' ? 'TEST 비용' : '실제 비용',
                currency: 'USD',
                totalUsd: 0,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
              },
              modelId: provider.modelId,
              modelName: provider.modelName,
              source: apiKey === 'TEST' ? 'test' : 'api',
            }
          : {
              status: 'blocked',
              text: 'API 키가 불러와지지 않았습니다.',
              chunks: [],
              cost: {
                label: 'API 키 미입력',
                currency: 'USD',
                totalUsd: 0,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
              },
              modelId: provider.modelId,
              modelName: provider.modelName,
              source: 'missing',
            };

      return accumulator;
    }, {});

    const initialSummaryKey =
      isSummaryEnabled && summaryAiId && summarySupportsChat
        ? userMode === 'general'
          ? 'TEST'
          : loadedKeys[summaryAiId].trim()
        : '';

    setIsGenerating(true);

    updateSession(targetSessionId, (session) => {
      const newTurn = {
        id: turnId,
        question: trimmedQuestion,
        providerIds: providerSnapshots.map((provider) => provider.id),
        providerModels: providerSnapshots.reduce((accumulator, provider) => {
          accumulator[provider.id] = provider.modelId;
          return accumulator;
        }, {}),
        summaryProviderId: summaryAiId,
        summaryModelId,
        mainProviderId: summaryAiId,
        mainModelId: summaryModelId,
        createdAt: Date.now(),
        answers: initialAnswers,
        summary: {
          status: !isSummaryEnabled
            ? 'disabled'
            : initialSummaryKey
              ? 'loading'
              : 'blocked',
          text: !isSummaryEnabled
            ? '요약이 비활성화되었습니다. 원본 대화 보기에서 각 AI 응답을 확인하세요.'
            : !summarySupportsChat
              ? '선택된 요약 AI는 텍스트 채팅을 지원하지 않습니다.'
              : initialSummaryKey
                ? '요약 AI가 답변들을 정리하는 중입니다...'
                : '요약 AI 키가 불러와지지 않았습니다.',
          cost: {
            label: !isSummaryEnabled
              ? '요약 비활성화'
              : initialSummaryKey === 'TEST'
                ? 'TEST 비용'
                : '실제 비용',
            currency: 'USD',
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            totalUsd: 0,
          },
        },
        cost: {
          label: '실제 비용',
          currency: 'USD',
          totalUsd: 0,
        },
      };

      return { ...session, turns: [...session.turns, newTurn] };
    });

    try {
      const providerResults = await Promise.all(
        providerSnapshots.map(async (provider) => {
          const apiKey = providerKeys[provider.id];

          if (!provider.supportsChat) {
            return {
              providerId: provider.id,
              status: 'blocked',
              text: '현재 텍스트 채팅을 지원하지 않는 서비스입니다.',
              modelId: provider.modelId,
              modelName: provider.modelName,
            };
          }

          if (!apiKey) {
            return {
              providerId: provider.id,
              status: 'blocked',
              text: 'API 키가 불러와지지 않았습니다.',
              modelId: provider.modelId,
              modelName: provider.modelName,
            };
          }

          try {
            const data = await requestChatResponse({
              providerId: provider.id,
              modelId: provider.modelId,
              apiKey,
              purpose: 'answer',
              question: trimmedQuestion,
              generationOptions,
              answerInstruction: answerInstructionMap?.[provider.id] ?? '',
            });

            return {
              providerId: provider.id,
              status: 'ready',
              text: data.text || '',
              mode: data.mode || (apiKey === 'TEST' ? 'test' : 'api'),
              modelId: provider.modelId,
              modelName: provider.modelName,
              cost: data.cost || {
                label: apiKey === 'TEST' ? 'TEST 비용' : '실제 비용',
                currency: 'USD',
                totalUsd: 0,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
              },
            };
          } catch (error) {
            return {
              providerId: provider.id,
              status: 'error',
              text: error instanceof Error ? `요청 실패: ${error.message}` : '요청 실패',
              modelId: provider.modelId,
              modelName: provider.modelName,
              cost: {
                label: '오류',
                currency: 'USD',
                totalUsd: 0,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
              },
            };
          }
        }),
      );

      providerResults.forEach((result) => {
        if (result.status !== 'ready') {
          updateSessionTurn(targetSessionId, turnId, (turn) => ({
            ...turn,
            answers: {
              ...turn.answers,
              [result.providerId]: {
                ...turn.answers[result.providerId],
                status: result.status,
                text: result.text,
                cost: result.cost ?? turn.answers[result.providerId]?.cost,
              },
            },
          }));
        }
      });

      const readyResults = providerResults.filter((result) => result.status === 'ready');
      let maxDelay = 0;

      readyResults.forEach((result, providerIndex) => {
        const chunks = splitIntoChunks(result.text || '응답이 비어 있습니다.', 5);
        const providerDelay = 250 + providerIndex * 500;

        chunks.forEach((chunk, chunkIndex) => {
          const timerId = window.setTimeout(() => {
            updateSessionTurn(targetSessionId, turnId, (turn) => {
              const currentAnswer = turn.answers[result.providerId];
              const nextText = `${currentAnswer?.text ?? ''}${currentAnswer?.text ? ' ' : ''}${chunk}`.trim();
              const isLastChunk = chunkIndex === chunks.length - 1;

              return {
                ...turn,
                answers: {
                  ...turn.answers,
                  [result.providerId]: {
                    ...currentAnswer,
                    text: nextText,
                    status: isLastChunk ? 'done' : 'streaming',
                    cost: result.cost,
                    mode: result.mode,
                  },
                },
              };
            });
          }, providerDelay + chunkIndex * 260);

          timerRef.current.push(timerId);
          maxDelay = Math.max(maxDelay, providerDelay + chunkIndex * 260);
        });
      });

      let summaryResult = {
        status: 'disabled',
        text: '요약이 비활성화되었습니다. 원본 대화 보기에서 각 AI 응답을 확인하세요.',
        cost: {
          label: '요약 비활성화',
          currency: 'USD',
          totalUsd: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
        },
      };

      if (isSummaryEnabled) {
        if (!summaryAiId || !summaryModelId) {
          summaryResult = {
            status: 'blocked',
            text: '요약 AI가 지정되지 않았습니다.',
            cost: {
              label: '요약 AI 미지정',
              currency: 'USD',
              totalUsd: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          };
        } else if (!summarySupportsChat) {
          summaryResult = {
            status: 'blocked',
            text: '선택된 요약 AI는 텍스트 채팅을 지원하지 않습니다.',
            cost: {
              label: '텍스트 미지원',
              currency: 'USD',
              totalUsd: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          };
        } else if (!initialSummaryKey) {
          summaryResult = {
            status: 'blocked',
            text: '요약 AI 키가 불러와지지 않았습니다.',
            cost: {
              label: 'API 키 미입력',
              currency: 'USD',
              totalUsd: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
            },
          };
        } else {
          try {
            const summaryData = await requestChatResponse({
              providerId: summaryAiId,
              modelId: summaryModelId,
              apiKey: initialSummaryKey,
              purpose: 'summary',
              question: trimmedQuestion,
              answers: buildSummaryAnswersPayload(providerSnapshots, providerResults),
              generationOptions,
              summaryInstruction,
            });

            summaryResult = {
              status: 'ready',
              text: summaryData.text || '',
              mode: summaryData.mode || (initialSummaryKey === 'TEST' ? 'test' : 'api'),
              cost: summaryData.cost || {
                label: initialSummaryKey === 'TEST' ? 'TEST 비용' : '실제 비용',
                currency: 'USD',
                totalUsd: 0,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
              },
            };
          } catch (error) {
            summaryResult = {
              status: 'error',
              text: error instanceof Error ? `요청 실패: ${error.message}` : '요청 실패',
              cost: {
                label: '오류',
                currency: 'USD',
                totalUsd: 0,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
              },
            };
          }
        }
      }

      const providerCostSumUsd = providerResults.reduce((sum, result) => sum + (result.cost?.totalUsd ?? 0), 0);
      const roundedProviderCostSumUsd = Math.round(providerCostSumUsd * 100) / 100;
      const totalCostUsd = roundedProviderCostSumUsd + (summaryResult.cost?.totalUsd ?? 0);

      updateSessionTurn(targetSessionId, turnId, (turn) => ({
        ...turn,
        cost: {
          label: '실제 비용',
          currency: 'USD',
          totalUsd: totalCostUsd,
        },
      }));

      if (summaryResult.status !== 'ready') {
        updateSessionTurn(targetSessionId, turnId, (turn) => ({
          ...turn,
          summary: {
            status: summaryResult.status,
            text: summaryResult.text,
            cost: {
              ...summaryResult.cost,
              label: summaryResult.status === 'disabled' ? '요약 비활성화' : '실제 비용',
              totalUsd:
                summaryResult.status === 'disabled'
                  ? 0
                  : roundedProviderCostSumUsd,
            },
          },
        }));
      } else {
        updateSessionTurn(targetSessionId, turnId, (turn) => ({
          ...turn,
          summary: {
            ...turn.summary,
            text: '',
            status: 'streaming',
            cost: {
              ...summaryResult.cost,
              label: '실제 비용',
              totalUsd: roundedProviderCostSumUsd,
            },
          },
        }));

        const summaryChunks = splitIntoChunks(summaryResult.text || '요약이 비어 있습니다.', 4);
        const summaryStart = maxDelay + 700;

        summaryChunks.forEach((chunk, chunkIndex) => {
          const timerId = window.setTimeout(() => {
            updateSessionTurn(targetSessionId, turnId, (turn) => {
              const currentSummary = turn.summary;
              const nextText = `${currentSummary?.text ?? ''}${currentSummary?.text ? ' ' : ''}${chunk}`.trim();
              const isLastChunk = chunkIndex === summaryChunks.length - 1;

              return {
                ...turn,
                summary: {
                  ...currentSummary,
                  text: nextText,
                  status: isLastChunk ? 'done' : 'streaming',
                  mode: summaryResult.mode,
                  cost: {
                    ...summaryResult.cost,
                    label: '실제 비용',
                    totalUsd: roundedProviderCostSumUsd,
                  },
                },
              };
            });
          }, summaryStart + chunkIndex * 260);

          timerRef.current.push(timerId);
        });

        maxDelay = summaryStart + summaryChunks.length * 260;
      }

      const finishTimerId = window.setTimeout(() => {
        setIsGenerating(false);
      }, maxDelay + 300);

      timerRef.current.push(finishTimerId);
    } finally {
      setQuestion('');
    }
  }

  return {
    question,
    setQuestion,
    isGenerating,
    handleSubmit,
  };
}
