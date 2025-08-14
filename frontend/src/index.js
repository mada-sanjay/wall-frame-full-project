import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// Removed hard reload cache buster to avoid reload loops in normal mode

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
