const list = document.getElementById('messages');
const empty = document.getElementById('empty');

window.electronAPI.onNotification((payload) => {
  empty.style.display = 'none';

  const item = document.createElement('li');
  item.textContent = payload.text ?? 'Urgent message';
  list.prepend(item);
});
