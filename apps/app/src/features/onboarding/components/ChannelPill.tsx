import type { SlackChannel } from '@/common/services/api';

interface ChannelPillProps {
  channel: SlackChannel;
  selected: boolean;
  onClick: () => void;
}

export function ChannelPill({ channel, selected, onClick }: ChannelPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 20,
        border: '1px solid',
        borderColor: selected ? '#1A1A1A' : '#E8E6E1',
        background: selected ? '#1A1A1A' : '#FFF',
        color: selected ? '#FFF' : '#6B6560',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      #{channel.name}
    </button>
  );
}
