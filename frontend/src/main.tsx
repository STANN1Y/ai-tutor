import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/spectral/latin-400.css';
import '@fontsource/spectral/latin-400-italic.css';
import '@fontsource/spectral/latin-500.css';
import '@fontsource/spectral/latin-600.css';
import '@fontsource-variable/familjen-grotesk';
import App from './App.tsx';

const mocksEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true';

async function startMocks() {
  if (!mocksEnabled) return;
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledFrame: 'bypass' });
}

void (async () => {
  try {
    await startMocks();
  } catch (error) {
    console.error('Failed to start the mock service worker', error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
})();
