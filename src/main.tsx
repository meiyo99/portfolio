import { inject } from '@vercel/analytics'
import { createRoot } from 'react-dom/client'
import '../style.css'
import App from './App'

inject()

createRoot(document.getElementById('root')!).render(<App />)
