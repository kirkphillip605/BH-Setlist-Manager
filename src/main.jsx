import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PageTitleProvider } from './context/PageTitleContext';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <PageTitleProvider>
        <App />
      </PageTitleProvider>
    </AuthProvider>
  </BrowserRouter>
);