'use client';

import { useEffect, useMemo, useState } from 'react';
import { MOCK_AI_PROVIDERS, getDefaultModelId } from '@/lib/mockAis';
import { pickSummaryAiId } from '@/lib/aiSelectionPolicy';

function createStatusMap(defaultValue = '') {
  return MOCK_AI_PROVIDERS.reduce((accumulator, provider) => {
    accumulator[provider.id] = defaultValue;
    return accumulator;
  }, {});
}

function createKeyMap(defaultValue = '') {
  return MOCK_AI_PROVIDERS.reduce((accumulator, provider) => {
    accumulator[provider.id] = defaultValue;
    return accumulator;
  }, {});
}

function createModelMap() {
  return MOCK_AI_PROVIDERS.reduce((accumulator, provider) => {
    accumulator[provider.id] = getDefaultModelId(provider.id);
    return accumulator;
  }, {});
}

export default function useAiSelection() {
  const [selectedIds, setSelectedIds] = useState(['openai', 'claude', 'gemini']);
  const [summaryAiId, setSummaryAiId] = useState('perplexity');
  const [isSummaryRequested, setIsSummaryRequested] = useState(true);
  const [selectedModels, setSelectedModels] = useState(() => createModelMap());
  const [loadedKeys, setLoadedKeys] = useState(() => createKeyMap(''));
  const [keyInputs, setKeyInputs] = useState(() => createKeyMap(''));
  const [keyStatuses, setKeyStatuses] = useState(() => createStatusMap('아직 불러오지 않음'));

  const selectedProviders = useMemo(
    () => MOCK_AI_PROVIDERS.filter((provider) => selectedIds.includes(provider.id)),
    [selectedIds],
  );

  const isSummaryEnabled = isSummaryRequested && selectedIds.length >= 2;
  const isSummaryAutoMode = isSummaryEnabled && selectedIds.length === 2;
  const canSelectSummaryAi = isSummaryEnabled && selectedIds.length >= 3;

  const resolvedSummaryAiId = useMemo(() => {
    if (!isSummaryEnabled) {
      return '';
    }

    if (isSummaryAutoMode) {
      return pickSummaryAiId(selectedIds, summaryAiId);
    }

    if (summaryAiId && selectedIds.includes(summaryAiId)) {
      return summaryAiId;
    }

    return pickSummaryAiId(selectedIds, summaryAiId);
  }, [isSummaryAutoMode, isSummaryEnabled, selectedIds, summaryAiId]);

  useEffect(() => {
    if (!isSummaryRequested || selectedIds.length <= 1) {
      return;
    }

    if (isSummaryAutoMode) {
      const autoSummaryAiId = pickSummaryAiId(selectedIds, summaryAiId);
      if (autoSummaryAiId !== summaryAiId) {
        setSummaryAiId(autoSummaryAiId);
      }
      return;
    }

    if (!summaryAiId || !selectedIds.includes(summaryAiId)) {
      setSummaryAiId(pickSummaryAiId(selectedIds, summaryAiId));
    }
  }, [isSummaryAutoMode, isSummaryRequested, selectedIds, summaryAiId]);

  function handleProviderToggle(providerId) {
    setSelectedIds((currentIds) => {
      if (currentIds.includes(providerId)) {
        const nextIds = currentIds.filter((id) => id !== providerId);

        if (nextIds.length === 0) {
          return currentIds;
        }

        return nextIds;
      }

      return [...currentIds, providerId];
    });
  }

  function handleModelChange(providerId, modelId) {
    setSelectedModels((previousModels) => ({
      ...previousModels,
      [providerId]: modelId,
    }));
  }

  function handleLoadKey(providerId) {
    const value = keyInputs[providerId].trim();

    if (!value) {
      setLoadedKeys((previous) => ({
        ...previous,
        [providerId]: '',
      }));
      setKeyStatuses((previous) => ({
        ...previous,
        [providerId]: 'API 키가 입력되지 않았습니다.',
      }));
      return;
    }

    setLoadedKeys((previous) => ({
      ...previous,
      [providerId]: value,
    }));

    setKeyStatuses((previous) => ({
      ...previous,
      [providerId]: value === 'TEST' ? 'TEST 실행중' : 'API 키가 불러와졌습니다',
    }));
  }

  return {
    selectedIds,
    summaryAiId: resolvedSummaryAiId,
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
  };
}
