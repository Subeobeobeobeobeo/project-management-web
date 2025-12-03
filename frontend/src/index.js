// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
// Use AppClean while the original App.js file is being fixed
import App from './AppClean';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);