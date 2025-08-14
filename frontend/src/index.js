import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// NUCLEAR CACHE BUSTER - Force browser to reload everything
const CACHE_BUSTER = Date.now();
console.log('🔥 NUCLEAR CACHE BUSTER ACTIVATED:', CACHE_BUSTER);
console.log('🚀 App Loading at:', new Date().toISOString());

// Force reload if this is an old version
const lastCacheBuster = localStorage.getItem('cacheBuster');
if (lastCacheBuster && parseInt(lastCacheBuster) < (CACHE_BUSTER - 300000)) { // 5 minutes old
  localStorage.setItem('cacheBuster', CACHE_BUSTER.toString());
  console.log('🔄 FORCING COMPLETE RELOAD');
  window.location.reload(true);
} else {
  localStorage.setItem('cacheBuster', CACHE_BUSTER.toString());
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
