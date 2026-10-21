import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('qr-studio-root');

if (rootElement && (window.qrStudioData?.isAdmin || import.meta.env.DEV)) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else if (rootElement) {
  rootElement.textContent = 'Open 4QR Studio from your WordPress admin dashboard.';
}
