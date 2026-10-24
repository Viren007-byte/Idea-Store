import { useState, type FormEvent } from 'react'
import { Alert, Button, IconButton, InputAdornment, TextField } from '@mui/material'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lightbulb, LockKeyhole, ArrowUpRight } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { api, errorMessage } from './api'
import { setUser, useAppDispatch, useAppSelector } from './store'
import type { User } from './types'

export default function Auth({ signup = false }: { signup?: boolean }) {
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const user = useAppSelector(state => state.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  if (user) return <Navigate to="/dashboard" replace/>
  const update = (event: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [event.target.name]: event.target.value })
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      const common = { email: z.string().trim().email().parse(values.email).toLowerCase(), password: values.password }
      if (signup) {
        const input = z.object({ firstName: z.string().trim().min(1).max(60), lastName: z.string().trim().min(1).max(60), email: z.string().email(), password: z.string().min(8).max(72) }).parse({ ...values, ...common })
        await api.post('/user/register', input)
        toast.success('Your account is ready. Log in to get started.'); navigate('/login', { replace: true })
      } else {
        const { data } = await api.post<{ user: User; message: string }>('/user/login', common)
        dispatch(setUser(data.user)); toast.success(data.message)
        const next = (location.state as { from?: string } | null)?.from
        navigate(next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard', { replace: true })
      }
    } catch (error) { setError(error instanceof z.ZodError ? error.issues[0].message : errorMessage(error)) }
    finally { setBusy(false) }
  }
  return <div className="container auth-layout"><aside className="auth-aside"><span className="eyebrow">A LITTLE SPACE. A BIG POSSIBILITY.</span><Lightbulb size={68} strokeWidth={1}/><h1>{signup ? 'Your next chapter starts with an idea.' : 'Good to have your curious mind back.'}</h1><p>A private vault for the thoughts you’re growing, and a community for the ones you’re ready to share.</p><span className="hero-note"><LockKeyhole size={15}/> Your private ideas stay yours.</span></aside><section className="auth-form"><span className="eyebrow">{signup ? 'MAKE ROOM FOR INSPIRATION' : 'BACK TO YOUR NOTEBOOK'}</span><h2>{signup ? 'Create your account' : 'Welcome back.'}</h2><p>{signup ? 'A new home for your next big thing.' : 'Log in to pick up where you left off.'}</p>{error && <Alert severity="error">{error}</Alert>}<form onSubmit={submit} className="form-stack">{signup && <div className="form-row"><TextField label="First name" name="firstName" value={values.firstName} onChange={update} required fullWidth slotProps={{ htmlInput: { maxLength: 60 } }} autoComplete="given-name"/><TextField label="Last name" name="lastName" value={values.lastName} onChange={update} required fullWidth slotProps={{ htmlInput: { maxLength: 60 } }} autoComplete="family-name"/></div>}<TextField label="Email address" name="email" type="email" value={values.email} onChange={update} required fullWidth autoComplete="email"/><TextField id="auth-password" label="Password" name="password" type={show ? 'text' : 'password'} value={values.password} onChange={update} required fullWidth autoComplete={signup ? 'new-password' : 'current-password'} helperText={signup ? 'Use 8–72 characters.' : undefined} slotProps={{ htmlInput: { minLength: signup ? 8 : 1, maxLength: signup ? 72 : 200 }, input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} edge="end">{show ? <EyeOff size={18}/> : <Eye size={18}/>}</IconButton></InputAdornment> } }}/><Button type="submit" variant="contained" size="large" disabled={busy} endIcon={<ArrowUpRight size={17}/>}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}</Button></form><p className="auth-switch">{signup ? 'Already have an account?' : 'New around here?'} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Create an account'}</Link></p></section></div>
}
