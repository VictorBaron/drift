import { useCallback, useEffect, useRef, useState } from 'react';
import DetailPanel from './components/DetailPanel';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Titlebar from './components/Titlebar';
import type { Message } from './types';

let nextId = 100;
function uid(): string {
  return String(nextId++);
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    title: 'Server Outage',
    description: 'Blocking 3 engineers (prod incident)',
    body: 'Production server is down, impacting the app. Need assistance ASAP!',
    source: 'Slack',
    timeAgo: '5m ago',
    score: 91,
    channelLabel: 'Blocking 3 engineers (prod incident)',
    slackLink: 'https://app.slack.com',
  },
  {
    id: '2',
    title: 'VIP Customer Issue',
    description: 'Client waiting on urgent response',
    body: 'A VIP client is waiting for an urgent response. They have raised a critical support ticket that needs immediate attention.',
    source: 'Slack',
    timeAgo: '10m ago',
    score: 85,
    channelLabel: 'vip-customers',
    slackLink: 'https://app.slack.com',
  },
  {
    id: '3',
    title: 'Code Review Needed',
    description: 'PR stuck, waiting on approval',
    body: "This PR has been waiting for code review. It's blocking the release pipeline for the v2 launch.",
    source: 'Slack',
    timeAgo: '20m ago',
    score: 78,
    channelLabel: 'engineering',
    slackLink: 'https://app.slack.com',
  },
  {
    id: '4',
    title: 'Meeting Reminder',
    description: 'Team sync in 20 minutes',
    body: 'Your team sync meeting starts in 20 minutes. Agenda: sprint review, blockers, and Q2 planning.',
    source: 'Calendar',
    timeAgo: '25m ago',
    score: 60,
    channelLabel: null,
    slackLink: null,
  },
  {
    id: '5',
    title: 'Article to Review',
    description: 'FYI: New draft for feedback',
    body: "A new blog article draft has been shared for your review and feedback before next week's release.",
    source: 'Slack',
    timeAgo: '40m ago',
    score: 45,
    channelLabel: 'content-team',
    slackLink: 'https://app.slack.com',
  },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_MESSAGES[0].id);
  const [focusActive, setFocusActive] = useState(false);
  const [focusMinutesLeft, setFocusMinutesLeft] = useState(0);
  const [digestMinutesLeft, setDigestMinutesLeft] = useState(12);

  // Refs so interval callbacks always see current values without stale closures
  const focusActiveRef = useRef(false);
  const focusMinutesLeftRef = useRef(0);
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function syncFocusActive(val: boolean) {
    focusActiveRef.current = val;
    setFocusActive(val);
  }

  function syncFocusMinutesLeft(val: number) {
    focusMinutesLeftRef.current = val;
    setFocusMinutesLeft(val);
  }

  function startFocusInterval() {
    if (focusIntervalRef.current !== null) clearInterval(focusIntervalRef.current);
    focusIntervalRef.current = setInterval(() => {
      const next = Math.max(0, focusMinutesLeftRef.current - 1);
      syncFocusMinutesLeft(next);
      if (next === 0) {
        syncFocusActive(false);
        clearInterval(focusIntervalRef.current!);
        focusIntervalRef.current = null;
      }
    }, 60000);
  }

  // IPC subscription
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

  // Digest timer
  useEffect(() => {
    const id = setInterval(() => {
      setDigestMinutesLeft((prev) => Math.max(0, prev - 1));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const startFocus = useCallback((minutes: number) => {
    syncFocusActive(true);
    syncFocusMinutesLeft(minutes);
    startFocusInterval();
    window.shouldertap?.setFocus(minutes);
  }, []);

  const toggleFocus = useCallback(() => {
    if (focusActiveRef.current) {
      if (focusIntervalRef.current !== null) {
        clearInterval(focusIntervalRef.current);
        focusIntervalRef.current = null;
      }
      syncFocusActive(false);
    } else if (focusMinutesLeftRef.current > 0) {
      syncFocusActive(true);
      startFocusInterval();
    }
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

  return (
    <div id="app">
      <Titlebar />
      <Header
        focusActive={focusActive}
        focusMinutesLeft={focusMinutesLeft}
        digestMinutesLeft={digestMinutesLeft}
        onToggleFocus={toggleFocus}
      />
      <div className="content">
        <Sidebar
          messages={messages}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onFocus30={() => startFocus(30)}
          onFocus60={() => startFocus(60)}
        />
        <DetailPanel
          messages={messages}
          selectedId={selectedId}
          onMarkRead={markRead}
          onSnooze={snoozeMessage}
          onMarkNotUrgent={markNotUrgent}
        />
      </div>
    </div>
  );
}
