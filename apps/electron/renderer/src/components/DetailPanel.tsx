import type { Message } from '../types';

interface Props {
  messages: Message[];
  selectedId: string | null;
  onMarkRead: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onMarkNotUrgent: (id: string) => void;
}

const ChevronRight = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function DetailPanel({ messages, selectedId, onMarkRead, onSnooze, onMarkNotUrgent }: Props) {
  const msg = messages.find((m) => m.id === selectedId);

  if (!msg) {
    return (
      <div className="detail-panel">
        <div className="empty-detail">Select a message to view details</div>
      </div>
    );
  }

  return (
    <div className="detail-panel">
      <div className="detail-content">
        <h2 className="detail-title">{msg.title}</h2>
        <hr className="detail-divider" />
        <p className="detail-body">{msg.body}</p>
        {msg.channelLabel && (
          <>
            <hr className="detail-divider" />
            <div className="detail-channel-row">
              <div className="detail-channel-info">
                <div className="slack-dot">S</div>
                <span className="channel-label">{msg.channelLabel}</span>
              </div>
              {msg.slackLink && (
                <button className="view-slack-btn" onClick={() => window.shouldertap?.openSlackLink(msg.slackLink!)}>
                  View in Slack <ChevronRight />
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <div className="detail-actions">
        <button className="action-btn" onClick={() => onMarkRead(msg.id)}>
          Mark as Read
        </button>
        <button className="action-btn" onClick={() => onSnooze(msg.id, 15)}>
          Snooze 15m
        </button>
        <button className="action-btn" onClick={() => onMarkNotUrgent(msg.id)}>
          Not Urgent <ChevronRight />
        </button>
      </div>
    </div>
  );
}
