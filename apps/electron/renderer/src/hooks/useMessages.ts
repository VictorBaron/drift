import { useCallback, useEffect, useState } from 'react';
import type { UrgentMessageDTO } from '../lib/message';
import { dtoToMessage, MOCK_MESSAGES, uid } from '../lib/message';
import type { Message } from '../types';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_MESSAGES[0].id);

  useEffect(() => {
    window.shouldertap?.listInterrupts().then((dtos: UrgentMessageDTO[]) => {
      if (dtos.length === 0) return;
      const loaded = dtos.map(dtoToMessage);
      setMessages(loaded);
      setSelectedId(loaded[0].id);
    });
  }, []);

  useEffect(() => {
    const cleanup = window.electronAPI.onNotification((payload) => {
      const msg: Message = {
        id: uid(),
        title: payload.sender.name ?? payload.sender.email,
        description: payload.text.length > 70 ? payload.text.slice(0, 70) + '…' : payload.text,
        body: payload.text,
        source: 'Slack',
        timeAgo: 'just now',
        score: 90,
        channelLabel: payload.channel.name ? `#${payload.channel.name}` : null,
        slackLink: payload.slackLink,
      };
      setMessages((prev) => [msg, ...prev]);
      setSelectedId((prev) => prev ?? msg.id);
    });
    return cleanup;
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => {
      const remaining = prev.filter((m) => m.id !== id);
      setSelectedId((currentSelected) => {
        if (currentSelected !== id) return currentSelected;
        const idx = prev.findIndex((m) => m.id === id);
        return remaining[idx]?.id ?? remaining[0]?.id ?? null;
      });
      return remaining;
    });
  }, []);

  const markRead = useCallback(
    (id: string) => {
      removeMessage(id);
      window.shouldertap?.markRead(id);
    },
    [removeMessage],
  );

  const snoozeMessage = useCallback(
    (id: string, minutes: number) => {
      removeMessage(id);
      window.shouldertap?.snooze(id, minutes);
    },
    [removeMessage],
  );

  const markNotUrgent = useCallback(
    (id: string) => {
      removeMessage(id);
    },
    [removeMessage],
  );

  return { messages, selectedId, setSelectedId, markRead, snoozeMessage, markNotUrgent };
}
