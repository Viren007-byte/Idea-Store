import { useState, type FormEvent } from 'react'
import { Alert, Avatar, Button, TextField } from '@mui/material'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from './api'
import { setUser, useAppDispatch, useAppSelector } from './store'
import type { User } from './types'
import { PageHeading } from './ui'

export default function Profile() {
  const user = useAppSelector(state => state.auth.user)!
  const dispatch = useAppDispatch()
  const [values, setValues] = useState({ firstName: user.firstName, lastName: user.lastName, occupation: user.occupation || '', bio: user.bio || '', photoUrl: user.photoUrl || '', github: user.github || '', linkedin: user.linkedin || '', instagram: user.instagram || '', facebook: user.facebook || '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues({ ...values, [event.target.name]: event.target.value })
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try { const { data } = await api.patch<{ user: User }>('/user/profile', values); dispatch(setUser(data.user)); toast.success('Your profile is up to date') }
    catch (error) { setError(errorMessage(error)) }
    finally { setBusy(false) }
  }
  return <div className="container page"><PageHeading eyebrow="THE PERSON BEHIND THE IDEAS" title="Make yourself at home." description="A little about you helps the community connect with your thinking."/><form className="profile-layout" onSubmit={submit}><aside className="panel profile-preview"><Avatar src={values.photoUrl} sx={{ width: 90, height: 90, bgcolor: 'primary.main', fontSize: 30 }}>{values.firstName[0]}{values.lastName[0]}</Avatar><h2>{values.firstName} {values.lastName}</h2><p>{values.occupation || 'A curious mind'}</p><span className="category">{user.role === 'admin' ? 'Administrator' : 'Community member'}</span><small>{user.email}</small></aside><div className="panel form-stack">{error && <Alert severity="error">{error}</Alert>}<h2>Your details</h2><div className="form-row"><TextField label="First name" name="firstName" required value={values.firstName} onChange={change} slotProps={{ htmlInput: { maxLength: 60 } }} fullWidth/><TextField label="Last name" name="lastName" required value={values.lastName} onChange={change} slotProps={{ htmlInput: { maxLength: 60 } }} fullWidth/></div><TextField label="Occupation" name="occupation" value={values.occupation} onChange={change} slotProps={{ htmlInput: { maxLength: 120 } }}/><TextField label="A little about you" name="bio" value={values.bio} onChange={change} multiline minRows={4} slotProps={{ htmlInput: { maxLength: 1000 } }} helperText={`${values.bio.length}/1000 characters`}/><TextField label="Profile image URL" name="photoUrl" type="url" value={values.photoUrl} onChange={change} helperText="Optional. Use an HTTP or HTTPS image link."/><h2>Find you elsewhere</h2><div className="form-row"><TextField label="GitHub URL" name="github" type="url" value={values.github} onChange={change} fullWidth/><TextField label="LinkedIn URL" name="linkedin" type="url" value={values.linkedin} onChange={change} fullWidth/></div><div className="form-row"><TextField label="Instagram URL" name="instagram" type="url" value={values.instagram} onChange={change} fullWidth/><TextField label="Facebook URL" name="facebook" type="url" value={values.facebook} onChange={change} fullWidth/></div><div><Button type="submit" variant="contained" disabled={busy} startIcon={<Check size={17}/>}>{busy ? 'Saving…' : 'Save profile'}</Button></div></div></form></div>
}
