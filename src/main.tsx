import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './lib/pushNotification';

// Register Service Worker for background notifications & offline task handling
registerServiceWorker().catch((err) => {
  console.warn('SW registration failed:', err);
});

createRoot(document.getElementById('root')!).render(<App />);
