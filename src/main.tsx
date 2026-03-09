import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GlobalVariableProvider } from './context/GlobalVariable.context.tsx'

createRoot(document.getElementById('root')!).render(
  <GlobalVariableProvider>
    <App />
  </GlobalVariableProvider>
)
