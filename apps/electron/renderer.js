const list = document.getElementById('messages');
const empty = document.getElementById('empty');

window.electronAPI.onNotification((payload) => {
  empty.style.display = 'none';

  const senderLabel = payload.sender.name ?? payload.sender.email;
  const channelLabel = payload.channel.name ? `#${payload.channel.name}` : 'DM';

  const card = document.createElement('li');
  card.className = 'message-card';
  card.innerHTML = `
    <div class="message-meta">
      <span class="sender">${escapeHtml(senderLabel)}</span>
      <span class="channel">${escapeHtml(channelLabel)}</span>
    </div>
    <div class="message-text">${escapeHtml(payload.text)}</div>
    <div class="reasoning">${escapeHtml(payload.reasoning)}</div>
    <a class="slack-link" href="${escapeHtml(payload.slackLink)}">Open in Slack</a>
  `;

  list.prepend(card);
});

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
