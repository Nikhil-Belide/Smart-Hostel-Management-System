import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1c1c28',
            color: '#f0f0ff',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#00e676', secondary: '#000' } },
          error: { iconTheme: { primary: '#ff4d6d', secondary: '#000' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
