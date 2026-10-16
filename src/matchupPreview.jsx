import {createRoot} from 'react-dom/client'
import App from './App'
import './index.css'
import './home.css'
import './components/ResourcesPage.css'
import './matchupPreview.css'

createRoot(document.getElementById('root')).render(<App battleDesign initialPage="battle"/>)
