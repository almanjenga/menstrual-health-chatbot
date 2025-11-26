import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DarkModeProvider } from './contexts/DarkModeContext'
import { LanguageProvider } from './contexts/LanguageContext'

createRoot(document.getElementById('root')).render(
  <DarkModeProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </DarkModeProvider>
)
