import { useState } from 'react'
import { Alert, Button, IconButton, Tooltip } from '@mui/material'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { ArrowUpRight, Lightbulb, Menu, Moon, Plus, Sun, X } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from './api'
import { setUser, useAppDispatch, useAppSelector } from './store'
import { useLoad } from './ui'

export default function Layout() {
  const user = useAppSelector(state => state.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const health = useLoad(async () => { await api.get('/health', { baseURL: api.defaults.baseURL?.replace(/\/v1\/?$/, '') }); return true }, [])
  async function logout() {
    setLoggingOut(true)
    try { await api.post('/user/logout'); dispatch(setUser(null)); navigate('/'); toast.success('You have been logged out') }
    catch (error) { toast.error(errorMessage(error)) }
    finally { setLoggingOut(false) }
  }
  const close = () => setOpen(false)
  return <><header className="site-header"><div className="nav-inner"><Link to="/" className="brand" onClick={close}><span><Lightbulb size={22}/></span>idea<span className="brand-light">store</span><i/></Link>
    <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation"><NavLink to="/ideas" onClick={close}>Explore ideas</NavLink><NavLink to="/about" onClick={close}>Our purpose</NavLink>{user && <><NavLink to="/dashboard" onClick={close}>My vault</NavLink><NavLink to="/profile" onClick={close}>Profile</NavLink></>}{user?.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}</nav>
    <div className="nav-actions"><Tooltip title="Toggle color theme"><IconButton aria-label="Toggle color theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>{resolvedTheme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}</IconButton></Tooltip>
      {user ? <><Button component={Link} to="/ideas/new" variant="contained" startIcon={<Plus size={16}/>} className="desktop-action">New idea</Button><Button onClick={logout} disabled={loggingOut}>Log out</Button></> : <><Button component={Link} to="/login">Log in</Button><Button component={Link} to="/signup" variant="contained" endIcon={<ArrowUpRight size={16}/>} className="desktop-action">Get started</Button></>}
      <IconButton className="mobile-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</IconButton></div>
  </div></header>
  {health.error && <div className="health-banner"><Alert severity="warning" action={<Button onClick={health.reload} size="small" color="inherit">Retry</Button>}>The database is currently unavailable. Saved ideas and account features will return when the connection is restored.</Alert></div>}
  <main id="main-content"><Outlet/></main><footer className="site-footer"><div className="container footer-inner"><Link to="/" className="brand"><Lightbulb size={20}/>ideastore<i/></Link><p>A little space for your next big thing.</p><span>Think freely. Share intentionally.</span></div></footer></>
}
