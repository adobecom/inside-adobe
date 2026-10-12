export default function init(el) {
  const date = document.createElement('p');
  date.className = 'welcome-date';
  date.textContent = new Date().toLocaleDateString(document.documentElement.lang || 'en', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  el.prepend(date);
}
