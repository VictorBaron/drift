interface Props {
  focusActive: boolean;
  focusMinutesLeft: number;
  digestMinutesLeft: number;
  onToggleFocus: () => void;
}

export default function Header({ focusActive, focusMinutesLeft, digestMinutesLeft, onToggleFocus }: Props) {
  return (
    <div className="header">
      <button className="workspace-btn">
        Acme Corp
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className="focus-status">
        <FocusStatus focusActive={focusActive} focusMinutesLeft={focusMinutesLeft} onToggle={onToggleFocus} />
      </div>

      <div className="header-right">
        <button className="digest-btn">
          <span>{digestMinutesLeft > 0 ? `Next Digest in ${digestMinutesLeft}m` : 'Digest ready'}</span>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button className="settings-btn">
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface FocusStatusProps {
  focusActive: boolean;
  focusMinutesLeft: number;
  onToggle: () => void;
}

function FocusStatus({ focusActive, focusMinutesLeft, onToggle }: FocusStatusProps) {
  const PlayIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );

  if (focusActive && focusMinutesLeft > 0) {
    return (
      <div className="focus-indicator">
        <div className="slack-dot">S</div>
        <span>Focus Mode: {focusMinutesLeft}m left</span>
        <button className="focus-toggle-btn" onClick={onToggle}>
          <PlayIcon />
        </button>
      </div>
    );
  }

  if (!focusActive && focusMinutesLeft > 0) {
    return (
      <div className="focus-indicator" style={{ color: 'var(--text-muted)' }}>
        <div className="slack-dot" style={{ background: 'var(--text-muted)' }}>
          S
        </div>
        <span>Focus paused: {focusMinutesLeft}m left</span>
        <button className="focus-toggle-btn" onClick={onToggle} style={{ color: 'var(--text-muted)' }}>
          <PlayIcon />
        </button>
      </div>
    );
  }

  return <span className="focus-idle">No active focus block</span>;
}
