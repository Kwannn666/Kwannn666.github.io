// Apply a saved preference before the stylesheet paints. Storage is optional.
(() => {
  let saved;
  try { saved = localStorage.getItem('theme'); } catch { /* Private browsing may block storage. */ }
  const theme = saved === 'dark' || saved === 'light'
    ? saved
    : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101312' : '#f5f8f7');
})();
