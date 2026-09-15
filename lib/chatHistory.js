export const MAX_CONTEXT_TURNS = 4;
export const MAX_CONTEXT_MESSAGES = MAX_CONTEXT_TURNS * 2;
export const MAX_CONTEXT_CHARACTERS = 12_000;
const MAX_MESSAGE_CHARACTERS = 4_000;

export function sanitizeMessageHistory(history = []) {
  if (!Array.isArray(history)) {
    return [];
  }

  const candidates = history
    .filter((message) => message?.role === 'user' || message?.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: typeof message.content === 'string'
        ? message.content.slice(0, MAX_MESSAGE_CHARACTERS).trim()
        : '',
    }))
    .filter((message) => message.content)
    .slice(-MAX_CONTEXT_MESSAGES);

  const selected = [];
  let usedCharacters = 0;

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const message = candidates[index];
    const remainingCharacters = MAX_CONTEXT_CHARACTERS - usedCharacters;

    if (remainingCharacters <= 0) {
      break;
    }

    selected.unshift({
      ...message,
      content: message.content.slice(-remainingCharacters),
    });
    usedCharacters += Math.min(message.content.length, remainingCharacters);
  }

  while (selected[0]?.role === 'assistant') {
    selected.shift();
  }

  return selected;
}

export function buildSessionMessageHistory(turns = [], providerId, purpose = 'answer') {
  const recentTurns = Array.isArray(turns) ? turns.slice(-MAX_CONTEXT_TURNS) : [];
  const messages = [];

  recentTurns.forEach((turn) => {
    const question = typeof turn?.question === 'string' ? turn.question.trim() : '';
    const providerAnswer = turn?.answers?.[providerId];
    const ownAnswer = providerAnswer?.status === 'done' ? providerAnswer.text : '';
    const completedSummary = turn?.summary?.status === 'done' ? turn.summary.text : '';
    const assistantText = purpose === 'summary' ? completedSummary : ownAnswer || completedSummary;

    if (question && assistantText) {
      messages.push(
        { role: 'user', content: question },
        { role: 'assistant', content: assistantText },
      );
    }
  });

  return sanitizeMessageHistory(messages);
}
