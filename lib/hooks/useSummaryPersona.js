'use client';

import { useEffect, useMemo, useState } from 'react';

const SUMMARY_PERSONA_PRESET_KEY = 'aipj-summary-persona-preset';
const SUMMARY_PERSONA_USE_CUSTOM_KEY = 'aipj-summary-persona-use-custom';
const SUMMARY_PERSONA_CUSTOM_TEXT_KEY = 'aipj-summary-persona-custom-text';
const CUSTOM_INSTRUCTION_MAX_LENGTH = 1500;
const DEFAULT_SUMMARY_PRESET = 'basic';

const SUMMARY_PERSONA_PRESETS = {
  basic: {
    label: '기본',
    instruction:
      '여러 AI 답변의 공통점과 차이점을 간결하게 정리하고, 상충되는 주장과 확인이 필요한 항목을 분리해서 보여주세요.',
  },
  expert: {
    label: '전문가',
    instruction:
      '답변 간 논리 구조와 전제 차이를 분석적으로 정리하고, 리스크/불확실성/선택 기준을 우선순위로 제시하세요.',
  },
};

function sanitizeCustomInstruction(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.slice(0, CUSTOM_INSTRUCTION_MAX_LENGTH).trim();
}

export default function useSummaryPersona(userMode) {
  const [summaryPersonaPreset, setSummaryPersonaPreset] = useState(DEFAULT_SUMMARY_PRESET);
  const [useCustomSummaryInstruction, setUseCustomSummaryInstruction] = useState(false);
  const [customSummaryInstruction, setCustomSummaryInstruction] = useState('');

  useEffect(() => {
    try {
      const storedPreset = window.localStorage.getItem(SUMMARY_PERSONA_PRESET_KEY);
      if (storedPreset && SUMMARY_PERSONA_PRESETS[storedPreset]) {
        setSummaryPersonaPreset(storedPreset);
      }

      const storedUseCustom = window.localStorage.getItem(SUMMARY_PERSONA_USE_CUSTOM_KEY);
      if (storedUseCustom === 'true') {
        setUseCustomSummaryInstruction(true);
      }

      const storedCustomInstruction = window.localStorage.getItem(SUMMARY_PERSONA_CUSTOM_TEXT_KEY);
      if (storedCustomInstruction) {
        setCustomSummaryInstruction(sanitizeCustomInstruction(storedCustomInstruction));
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SUMMARY_PERSONA_PRESET_KEY, summaryPersonaPreset);
    } catch {
      // noop
    }
  }, [summaryPersonaPreset]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SUMMARY_PERSONA_USE_CUSTOM_KEY, String(useCustomSummaryInstruction));
    } catch {
      // noop
    }
  }, [useCustomSummaryInstruction]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SUMMARY_PERSONA_CUSTOM_TEXT_KEY, customSummaryInstruction);
    } catch {
      // noop
    }
  }, [customSummaryInstruction]);

  function handleSetCustomSummaryInstruction(value) {
    setCustomSummaryInstruction(sanitizeCustomInstruction(value));
  }

  const activeSummaryInstruction = useMemo(() => {
    if (userMode === 'developer') {
      if (!useCustomSummaryInstruction) {
        return '';
      }
      return customSummaryInstruction;
    }

    return SUMMARY_PERSONA_PRESETS[summaryPersonaPreset]?.instruction ?? SUMMARY_PERSONA_PRESETS[DEFAULT_SUMMARY_PRESET].instruction;
  }, [customSummaryInstruction, summaryPersonaPreset, useCustomSummaryInstruction, userMode]);

  return {
    summaryPersonaPreset,
    setSummaryPersonaPreset,
    summaryPersonaPresets: SUMMARY_PERSONA_PRESETS,
    useCustomSummaryInstruction,
    setUseCustomSummaryInstruction,
    customSummaryInstruction,
    setCustomSummaryInstruction: handleSetCustomSummaryInstruction,
    activeSummaryInstruction,
    customInstructionMaxLength: CUSTOM_INSTRUCTION_MAX_LENGTH,
  };
}
