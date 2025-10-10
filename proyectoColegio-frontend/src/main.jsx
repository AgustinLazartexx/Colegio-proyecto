import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import "keen-slider/keen-slider.min.css";
import './index.css';

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
     <BrowserRouter>
      <AuthProvider>
        <App />
        <ToastContainer /> {/* 👈 esto lo muestra en toda la app */}
      </AuthProvider>
    </BrowserRouter>
    
  </React.StrictMode>
);
