// src/index.js
import React, { Suspense } from 'react'; // 1. Import Suspense
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';

import App from './App';
import { ThemeProvider } from './ThemeContext';
import { PremiumProvider } from "./context/PremiumContext";
import './i18n'; // Your i18n configuration
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {/* 2. Wrap your app in the Suspense component */}
    <Suspense fallback={<div>Loading translations...</div>}>
      <BrowserRouter>
        <CookiesProvider>
          <ThemeProvider>
            <PremiumProvider>
              <App />
            </PremiumProvider>
          </ThemeProvider>
        </CookiesProvider>
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>
);
