import { lazy, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, Link } from 'react-router-dom'
import { Button, CssBaseline, ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material'
import { useTheme } from 'next-themes'
import { Toaster } from 'sonner'
import { restoreSession, useAppDispatch, useAppSelector } from './store'
import Layout from './Layout'
import Home from './Home'
import { Empty, Loading } from './ui'

const Auth = lazy(() => import('./Auth'))
const Ideas = lazy(() => import('./Ideas'))
const IdeaEditor = lazy(() => import('./IdeaEditor'))
const IdeaDetail = lazy(() => import('./IdeaDetail'))
const Profile = lazy(() => import('./Profile'))
const Admin = lazy(() => import('./Admin'))
const About = lazy(() => import('./About'))

function Protected({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, ready } = useAppSelector(state => state.auth)
  const location = useLocation()
  if (!ready) return <Loading/>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace/>
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace/>
  return children
}
function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
export default function App() {
  const dispatch = useAppDispatch()
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  useEffect(() => { void dispatch(restoreSession()) }, [dispatch])
  const theme = useMemo(() => createTheme({
    palette: { mode: dark ? 'dark' : 'light', primary: { main: dark ? '#d1ef83' : '#344d27', contrastText: dark ? '#202b18' : '#ffffff' }, background: { default: dark ? '#151b16' : '#fafbf7', paper: dark ? '#1e271f' : '#ffffff' } },
    typography: { fontFamily: '"Geist Variable", sans-serif', button: { textTransform: 'none', fontWeight: 600 } },
    shape: { borderRadius: 12 }, components: { MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { padding: '10px 20px' } } }, MuiTextField: { defaultProps: { variant: 'outlined' } } },
  }), [dark])
  return <MuiThemeProvider theme={theme}><CssBaseline/><BrowserRouter><a href="#main-content" className="skip-link">Skip to content</a><ScrollReset/><Suspense fallback={<Loading/>}><Routes><Route element={<Layout/>}>
    <Route index element={<Home/>}/><Route path="ideas" element={<Ideas/>}/><Route path="about" element={<About/>}/><Route path="login" element={<Auth/>}/><Route path="signup" element={<Auth signup/>}/>
    <Route path="dashboard" element={<Protected><Ideas mine/></Protected>}/><Route path="ideas/new" element={<Protected><IdeaEditor/></Protected>}/><Route path="ideas/:id/edit" element={<Protected><IdeaEditor/></Protected>}/><Route path="ideas/:id" element={<IdeaDetail/>}/><Route path="profile" element={<Protected><Profile/></Protected>}/><Route path="admin" element={<Protected admin><Admin/></Protected>}/>
    <Route path="*" element={<div className="container page"><Empty title="This page took a different path." action={<Button component={Link} to="/" variant="contained">Back home</Button>}>The page you’re looking for doesn’t exist.</Empty></div>}/>
  </Route></Routes></Suspense></BrowserRouter><Toaster richColors position="bottom-right" theme={dark ? 'dark' : 'light'}/></MuiThemeProvider>
}
