import DetailPanel from './components/DetailPanel';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Titlebar from './components/Titlebar';
import { useFocusTimer } from './hooks/useFocusTimer';
import { useMessages } from './hooks/useMessages';

export default function App() {
  const { focusActive, focusMinutesLeft, digestMinutesLeft, startFocus, toggleFocus } = useFocusTimer();
  const { messages, selectedId, setSelectedId, markRead, snoozeMessage, markNotUrgent } = useMessages();

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
