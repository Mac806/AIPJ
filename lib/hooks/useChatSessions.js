'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  readBrowserChatStorage,
  removeBrowserChatStorage,
  writeBrowserChatStorage,
} from '../browserChatStorage.js';

const CHAT_STORAGE_KEY = 'aipj-chat-sessions';
const CHAT_STORAGE_VERSION = 1;
const SENSITIVE_FIELD_NAMES = new Set([
  'apikey',
  'api-key',
  'api_key',
  'authorization',
  'keyinputs',
  'loadedkeys',
]);

function createConversationSession(title = '새 대화') {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    createdAt: Date.now(),
    isPinned: false,
    turns: [],
  };
}

const initialConversation = createConversationSession('새 대화');

function stripSensitiveFields(value) {
  if (Array.isArray(value)) {
    return value.map(stripSensitiveFields);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_FIELD_NAMES.has(key.toLowerCase()))
      .map(([key, nestedValue]) => [key, stripSensitiveFields(nestedValue)]),
  );
}

function normalizeInterruptedTurn(turn) {
  if (!turn || typeof turn !== 'object') {
    return turn;
  }

  const answers = Object.fromEntries(
    Object.entries(turn.answers ?? {}).map(([providerId, answer]) => {
      const wasInterrupted = answer?.status === 'loading' || answer?.status === 'streaming' || answer?.status === 'ready';
      return [
        providerId,
        wasInterrupted
          ? { ...answer, status: 'cancelled', text: answer.text || '새로고침으로 이전 요청이 중단되었습니다.' }
          : answer,
      ];
    }),
  );
  const summaryWasInterrupted = turn.summary?.status === 'loading'
    || turn.summary?.status === 'streaming'
    || turn.summary?.status === 'ready';

  return {
    ...turn,
    answers,
    summary: summaryWasInterrupted
      ? {
          ...turn.summary,
          status: 'cancelled',
          text: turn.summary?.text || '새로고침으로 이전 요청이 중단되었습니다.',
        }
      : turn.summary,
  };
}

export function serializeChatSessions(sessions, activeSessionId) {
  return JSON.stringify({
    version: CHAT_STORAGE_VERSION,
    activeSessionId,
    sessions: stripSensitiveFields(sessions),
  });
}

export function parseChatSessions(rawValue) {
  const parsed = JSON.parse(rawValue);

  if (parsed?.version !== CHAT_STORAGE_VERSION || !Array.isArray(parsed.sessions) || parsed.sessions.length === 0) {
    throw new Error('지원하지 않거나 비어 있는 대화 저장 데이터입니다.');
  }

  const sessions = parsed.sessions.map((session) => {
    if (!session || typeof session.id !== 'string' || !session.id) {
      throw new Error('손상된 대화 세션입니다.');
    }

    return {
      id: session.id,
      title: typeof session.title === 'string' && session.title.trim() ? session.title : '새 대화',
      createdAt: Number.isFinite(Number(session.createdAt)) ? Number(session.createdAt) : Date.now(),
      isPinned: Boolean(session.isPinned),
      turns: Array.isArray(session.turns)
        ? stripSensitiveFields(session.turns).map(normalizeInterruptedTurn)
        : [],
    };
  });
  const activeSessionId = sessions.some((session) => session.id === parsed.activeSessionId)
    ? parsed.activeSessionId
    : sessions[0].id;

  return { sessions, activeSessionId };
}

export default function useChatSessions() {
  const [sessions, setSessions] = useState(() => [initialConversation]);
  const [activeSessionId, setActiveSessionId] = useState(initialConversation.id);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const storageWriteQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let isCancelled = false;

    async function restoreSessions() {
      try {
        const storedValue = await readBrowserChatStorage(CHAT_STORAGE_KEY);

        if (storedValue && !isCancelled) {
          const restored = parseChatSessions(storedValue);
          setSessions(restored.sessions);
          setActiveSessionId(restored.activeSessionId);
        }
      } catch {
        if (!isCancelled) {
          setStorageWarning('저장된 대화를 복구하지 못해 새 대화로 시작했습니다. 브라우저 저장 설정을 확인해주세요.');
        }
        await removeBrowserChatStorage(CHAT_STORAGE_KEY);
      } finally {
        if (!isCancelled) {
          setIsStorageReady(true);
        }
      }
    }

    restoreSessions();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }

    const serializedSessions = serializeChatSessions(sessions, activeSessionId);
    storageWriteQueueRef.current = storageWriteQueueRef.current
      .catch(() => {})
      .then(() => writeBrowserChatStorage(CHAT_STORAGE_KEY, serializedSessions))
      .catch(() => {
        setStorageWarning('대화를 브라우저에 저장하지 못했습니다. 현재 화면에서는 유지되지만 새로고침하면 사라질 수 있습니다.');
      });
  }, [activeSessionId, isStorageReady, sessions]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  const activeTurns = activeSession?.turns ?? [];

  function createSession(title = '새 대화') {
    const newSession = createConversationSession(title);

    setSessions((previousSessions) => {
      const pinned = previousSessions.filter((session) => session.isPinned);
      const unpinned = previousSessions.filter((session) => !session.isPinned);
      return [...pinned, newSession, ...unpinned];
    });

    setActiveSessionId(newSession.id);
    return newSession;
  }

  function updateSession(sessionId, updater) {
    setSessions((previousSessions) =>
      previousSessions.map((session) => (session.id === sessionId ? updater(session) : session)),
    );
  }

  function updateSessionTurn(sessionId, turnId, updater) {
    updateSession(sessionId, (session) => ({
      ...session,
      turns: session.turns.map((turn) => (turn.id === turnId ? updater(turn) : turn)),
    }));
  }

  function handleNewConversation() {
    return createSession('새 대화');
  }

  function handlePinConversation(sessionId) {
    setSessions((previousSessions) => {
      const target = previousSessions.find((session) => session.id === sessionId);
      if (!target) {
        return previousSessions;
      }

      const nextPinnedState = !target.isPinned;
      const updatedTarget = {
        ...target,
        isPinned: nextPinnedState,
      };

      const withoutTarget = previousSessions.filter((session) => session.id !== sessionId);
      const pinned = withoutTarget.filter((session) => session.isPinned);
      const unpinned = withoutTarget.filter((session) => !session.isPinned);

      if (nextPinnedState) {
        return [updatedTarget, ...pinned, ...unpinned];
      }

      return [...pinned, updatedTarget, ...unpinned];
    });
  }

  function handleDeleteConversation(sessionId) {
    if (sessions.length === 1) {
      return;
    }

    const nextSessions = sessions.filter((session) => session.id !== sessionId);
    setSessions(nextSessions);

    if (activeSessionId === sessionId) {
      const fallback = nextSessions[0];
      setActiveSessionId(fallback?.id ?? null);
    }
  }

  function handleStartRename(sessionId, currentTitle) {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  }

  function handleSaveRename(sessionId) {
    const nextTitle = editingTitle.trim() || '새 대화';
    setSessions((previousSessions) =>
      previousSessions.map((session) => (session.id === sessionId ? { ...session, title: nextTitle } : session)),
    );
    setEditingSessionId(null);
    setEditingTitle('');
  }

  return {
    sessions,
    setSessions,
    createSession,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    activeTurns,
    isStorageReady,
    storageWarning,
    dismissStorageWarning: () => setStorageWarning(''),
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
  };
}
