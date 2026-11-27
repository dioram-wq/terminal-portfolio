import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { applyTheme, readStoredTheme } from './theme.ts'
import './index.css'

// Apply the saved theme before the first paint.
applyTheme(readStoredTheme())

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root is missing')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
