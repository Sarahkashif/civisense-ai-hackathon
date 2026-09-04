import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Detect the Capacitor native runtime (bridge is injected into the WebView).
// Inside the APK all assets are bundled locally, so the service worker adds
// no value there and is skipped to avoid WebView cache quirks.
const isNativeCapacitor = (): boolean => {
  try {
    const cap = (window as any).Capacitor;
    return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform();
  } catch {
    return false;
  }
};

// Register service worker for PWA support (web only)
if ('serviceWorker' in navigator && !isNativeCapacitor()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
