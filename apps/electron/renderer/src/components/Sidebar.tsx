import type { Message } from '../types';
import MessageCard from './MessageCard';

interface Props {
  messages: Message[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFocus30: () => void;
  onFocus60: () => void;
}

export default function Sidebar({ messages, selectedId, onSelect, onFocus30, onFocus60 }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-toolbar">
        <button className="focus-time-btn" onClick={onFocus30}>
          Focus 30
        </button>
        <button className="focus-time-btn" onClick={onFocus60}>
          Focus 60
        </button>
        <button className="stats-btn">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </button>
      </div>
      <ul className="message-list">
        {messages.map((msg) => (
          <MessageCard key={msg.id} message={msg} selected={msg.id === selectedId} onClick={() => onSelect(msg.id)} />
        ))}
      </ul>
    </div>
  );
}
