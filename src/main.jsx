import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './home.css'
import App from './App.jsx'
import {startAppUpdates} from './utils/appUpdates.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD) startAppUpdates({baseUrl:import.meta.env.BASE_URL})
