import type { Message } from '../types';

interface Props {
  message: Message;
  selected: boolean;
  onClick: () => void;
}

function urgencyColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#06b6d4';
  if (score >= 55) return '#3b82f6';
  if (score >= 40) return '#6366f1';
  return '#a78bfa';
}

export default function MessageCard({ message, selected, onClick }: Props) {
  return (
    <li
      className={`message-card${selected ? ' selected' : ''}`}
      style={{ borderLeftColor: urgencyColor(message.score) }}
      onClick={onClick}
    >
      <div className="message-card-inner">
        <div className="message-card-body">
          <div className="message-card-title">{message.title}</div>
          <div className="message-card-desc">{message.description}</div>
          <div className="message-card-meta">
            {message.source} · <span style={{ color: 'var(--text-secondary)' }}>{message.timeAgo}</span>
          </div>
        </div>
        <div className="score-badge">{message.score}</div>
      </div>
    </li>
  );
}
