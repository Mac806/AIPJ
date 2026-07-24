'use client';

import { useEffect, useState } from 'react';

const DEV_PARAMS_STORAGE_KEY = 'aipj-developer-params';

const DEFAULT_GENERAL_OPTIONS = {
  temperature: 0.7,
  topP: 1,
  maxTokens: 1024,
};

const DEFAULT_DEV_PARAMS = {
  temperature: 0.7,
  topP: 1,
  maxTokens: 1024,
};

const DEV_PARAM_RULES = {
  temperature: {
    min: 0,
    max: 2,
    step: 0.1,
    precision: 1,
  },
  topP: {
    min: 0,
    max: 1,
    step: 0.1,
    precision: 1,
  },
  maxTokens: {
    min: 1,
    max: 8192,
    step: 1,
    precision: 0,
  },
};

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function normalizeParamValue(key, value, fallback) {
  const rule = DEV_PARAM_RULES[key];

  if (!rule) {
    return fallback;
  }

  const clamped = clampNumber(value, rule.min, rule.max, fallback);

  if (rule.precision === 0) {
    return Math.round(clamped);
  }

  return Number(clamped.toFixed(rule.precision));
}

export default function useGenerationSettings(userMode) {
  const [developerParams, setDeveloperParams] = useState(DEFAULT_DEV_PARAMS);

  useEffect(() => {
    try {
      const storedParamsRaw = window.localStorage.getItem(DEV_PARAMS_STORAGE_KEY);
      if (storedParamsRaw) {
        const storedParams = JSON.parse(storedParamsRaw);
        setDeveloperParams({
          temperature: normalizeParamValue('temperature', storedParams.temperature, DEFAULT_DEV_PARAMS.temperature),
          topP: normalizeParamValue('topP', storedParams.topP, DEFAULT_DEV_PARAMS.topP),
          maxTokens: normalizeParamValue('maxTokens', storedParams.maxTokens, DEFAULT_DEV_PARAMS.maxTokens),
        });
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(DEV_PARAMS_STORAGE_KEY, JSON.stringify(developerParams));
    } catch {
      // noop
    }
  }, [developerParams]);

  function setDeveloperParam(key, value) {
    setDeveloperParams((previous) => {
      const next = { ...previous };

      if (key === 'temperature') {
        next.temperature = normalizeParamValue('temperature', value, previous.temperature);
      }

      if (key === 'topP') {
        next.topP = normalizeParamValue('topP', value, previous.topP);
      }

      if (key === 'maxTokens') {
        next.maxTokens = normalizeParamValue('maxTokens', value, previous.maxTokens);
      }

      return next;
    });
  }

  const activeGenerationOptions = userMode === 'developer' ? developerParams : DEFAULT_GENERAL_OPTIONS;

  return {
    developerParams,
    setDeveloperParam,
    activeGenerationOptions,
    developerParamRules: DEV_PARAM_RULES,
  };
}
