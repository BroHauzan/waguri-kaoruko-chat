import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Tangani error chunk loading saat update baru di-deploy (mencegah layar blank akibat hash JS lama)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected (stale chunk hash), reloading window...', event);
  window.location.reload();
});

// Tangani uncaught module script error jika file JS 404 dari deployment sebelumnya
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('Loading chunk') || e.message.includes('dynamically imported module') || e.message.includes('Failed to fetch'))) {
    console.warn('Chunk loading error caught on window, triggering reload...', e.message);
    const hasReloaded = sessionStorage.getItem('chunk_reload_lock');
    if (!hasReloaded) {
      sessionStorage.setItem('chunk_reload_lock', 'true');
      window.location.reload();
    }
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
