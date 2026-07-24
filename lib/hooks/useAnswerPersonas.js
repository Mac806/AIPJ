'use client';

import { useEffect, useMemo, useState } from 'react';
import { MOCK_AI_PROVIDERS } from '@/lib/mockAis';

const ANSWER_PRESET_STORAGE_KEY = 'aipj-answer-preset-map';
const ANSWER_PERSONA_ENABLED_STORAGE_KEY = 'aipj-answer-persona-enabled-map';
const ANSWER_PERSONA_TEXT_STORAGE_KEY = 'aipj-answer-persona-text-map';
const CUSTOM_INSTRUCTION_MAX_LENGTH = 1000;
const DEFAULT_ANSWER_PRESET = 'default';

const ANSWER_PRESET_OPTIONS = {
  default: {
    label: '기본',
    instruction: '질문에 맞는 핵심 답을 간결하고 정확하게 제시하세요.',
  },
  empathy: {
    label: '공감형',
    instruction: '사용자의 맥락과 감정을 먼저 짚고, 부드럽고 실용적인 제안을 제공하세요.',
  },
  expert: {
    label: '전문가',
    instruction: '전제와 근거를 구조화하여 설명하고, 장단점과 리스크를 함께 제시하세요.',
  },
};

function createBooleanMap(defaultValue = false) {
  return MOCK_AI_PROVIDERS.reduce((accumulator, provider) => {
    accumulator[provider.id] = defaultValue;
    return accumulator;
  }, {});
}

function createStringMap(defaultValue = '') {
  return MOCK_AI_PROVIDERS.reduce((accumulator, provider) => {
    accumulator[provider.id] = defaultValue;
    return accumulator;
  }, {});
}

function createPresetMap(defaultPreset = DEFAULT_ANSWER_PRESET) {
  return MOCK_AI_PROVIDERS.reduce((accumulator, provider) => {
    accumulator[provider.id] = defaultPreset;
    return accumulator;
  }, {});
}

function sanitizeInstructionText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.slice(0, CUSTOM_INSTRUCTION_MAX_LENGTH).trim();
}

function sanitizeBooleanMap(value) {
  const fallback = createBooleanMap(false);

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  return Object.keys(fallback).reduce((accumulator, providerId) => {
    accumulator[providerId] = Boolean(value[providerId]);
    return accumulator;
  }, {});
}

function sanitizeTextMap(value) {
  const fallback = createStringMap('');

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  return Object.keys(fallback).reduce((accumulator, providerId) => {
    accumulator[providerId] = sanitizeInstructionText(value[providerId]);
    return accumulator;
  }, {});
}

function sanitizePresetMap(value) {
  const fallback = createPresetMap(DEFAULT_ANSWER_PRESET);

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  return Object.keys(fallback).reduce((accumulator, providerId) => {
    const candidate = value[providerId];
    accumulator[providerId] = ANSWER_PRESET_OPTIONS[candidate] ? candidate : DEFAULT_ANSWER_PRESET;
    return accumulator;
  }, {});
}

export default function useAnswerPersonas(userMode, summaryAiId, summaryInstruction) {
  const [answerPresetMap, setAnswerPresetMap] = useState(() => createPresetMap(DEFAULT_ANSWER_PRESET));
  const [useCustomAnswerInstructionMap, setUseCustomAnswerInstructionMap] = useState(() => createBooleanMap(false));
  const [answerInstructionInputMap, setAnswerInstructionInputMap] = useState(() => createStringMap(''));

  useEffect(() => {
    try {
      const presetRaw = window.localStorage.getItem(ANSWER_PRESET_STORAGE_KEY);
      if (presetRaw) {
        setAnswerPresetMap(sanitizePresetMap(JSON.parse(presetRaw)));
      }

      const enabledRaw = window.localStorage.getItem(ANSWER_PERSONA_ENABLED_STORAGE_KEY);
      if (enabledRaw) {
        setUseCustomAnswerInstructionMap(sanitizeBooleanMap(JSON.parse(enabledRaw)));
      }

      const textRaw = window.localStorage.getItem(ANSWER_PERSONA_TEXT_STORAGE_KEY);
      if (textRaw) {
        setAnswerInstructionInputMap(sanitizeTextMap(JSON.parse(textRaw)));
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(ANSWER_PRESET_STORAGE_KEY, JSON.stringify(answerPresetMap));
    } catch {
      // noop
    }
  }, [answerPresetMap]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ANSWER_PERSONA_ENABLED_STORAGE_KEY, JSON.stringify(useCustomAnswerInstructionMap));
    } catch {
      // noop
    }
  }, [useCustomAnswerInstructionMap]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ANSWER_PERSONA_TEXT_STORAGE_KEY, JSON.stringify(answerInstructionInputMap));
    } catch {
      // noop
    }
  }, [answerInstructionInputMap]);

  function setProviderAnswerPreset(providerId, presetId) {
    if (!ANSWER_PRESET_OPTIONS[presetId]) {
      return;
    }

    setAnswerPresetMap((previous) => ({
      ...previous,
      [providerId]: presetId,
    }));
  }

  function setProviderCustomAnswerInstructionEnabled(providerId, enabled) {
    setUseCustomAnswerInstructionMap((previous) => ({
      ...previous,
      [providerId]: Boolean(enabled),
    }));
  }

  function setProviderAnswerInstructionInput(providerId, instructionText) {
    setAnswerInstructionInputMap((previous) => ({
      ...previous,
      [providerId]: sanitizeInstructionText(instructionText),
    }));
  }

  const answerInstructionMap = useMemo(
    () =>
      Object.keys(answerInstructionInputMap).reduce((accumulator, providerId) => {
        if (userMode === 'developer') {
          if (!useCustomAnswerInstructionMap[providerId]) {
            accumulator[providerId] = '';
            return accumulator;
          }

          accumulator[providerId] = answerInstructionInputMap[providerId] || '';
          return accumulator;
        }

        if (providerId === summaryAiId) {
          accumulator[providerId] = summaryInstruction || '';
          return accumulator;
        }

        const presetId = answerPresetMap[providerId];
        accumulator[providerId] =
          ANSWER_PRESET_OPTIONS[presetId]?.instruction ?? ANSWER_PRESET_OPTIONS[DEFAULT_ANSWER_PRESET].instruction;
        return accumulator;
      }, {}),
    [
      answerInstructionInputMap,
      answerPresetMap,
      summaryAiId,
      summaryInstruction,
      useCustomAnswerInstructionMap,
      userMode,
    ],
  );

  return {
    answerPresetMap,
    setProviderAnswerPreset,
    answerPresetOptions: ANSWER_PRESET_OPTIONS,
    useCustomAnswerInstructionMap,
    setProviderCustomAnswerInstructionEnabled,
    answerInstructionInputMap,
    setProviderAnswerInstructionInput,
    answerInstructionMap,
    answerInstructionMaxLength: CUSTOM_INSTRUCTION_MAX_LENGTH,
  };
}
