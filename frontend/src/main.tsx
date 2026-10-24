import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ThemeProvider } from 'next-themes'
import { store } from './app/store'
import App from './app/App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><Provider store={store}><ThemeProvider attribute="class" defaultTheme="light" enableSystem><App/></ThemeProvider></Provider></StrictMode>,
)
