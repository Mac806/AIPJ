'use client';

import { useMemo, useState } from 'react';

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

export default function useChatSessions() {
  const [sessions, setSessions] = useState(() => [initialConversation]);
  const [activeSessionId, setActiveSessionId] = useState(initialConversation.id);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

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
