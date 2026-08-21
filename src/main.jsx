import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { theme } from '@/data/profile'
import { watchColorScheme } from '@/lib/theme'

// The .dark class is set before first paint by an inline script (see
// vite.config.js). This only keeps it in step if the OS flips to dark while
// the page is already open.
watchColorScheme(theme.mode)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
