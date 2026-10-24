import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Alert, Button, MenuItem, TextField } from '@mui/material'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { api, errorMessage } from './api'
import { categories, type Idea } from './types'
import { ErrorBox, Loading, PageHeading } from './ui'

export default function IdeaEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [values, setValues] = useState({ title: '', summary: '', content: '', category: 'Technology', visibility: 'private', tags: '' })
  const [loading, setLoading] = useState(!!id)
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const dirty = useRef(false)
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])
  useEffect(() => {
    if (!id) return
    let current = true
    setLoading(true); setLoadError('')
    api.get<{ idea: Idea }>(`/ideas/${id}/owned`).then(({ data }) => {
      if (current) setValues({ title: data.idea.title, summary: data.idea.summary, content: data.idea.content || '', category: data.idea.category, visibility: data.idea.visibility, tags: data.idea.tags.join(', ') })
    }).catch(error => { if (current) setLoadError(errorMessage(error)) }).finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [id, revision])
  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { dirty.current = true; setValues({ ...values, [event.target.name]: event.target.value }) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const input = z.object({ title: z.string().trim().min(5).max(160), summary: z.string().trim().min(10).max(300), content: z.string().trim().min(20).max(20000), category: z.enum(categories), visibility: z.enum(['private', 'public']), tags: z.array(z.string().min(1).max(30)).max(8) }).parse({ ...values, tags: [...new Set(values.tags.split(',').map(tag => tag.trim()).filter(Boolean))] })
      const { data } = id ? await api.patch(`/ideas/${id}`, input) : await api.post('/ideas', input)
      dirty.current = false; toast.success(id ? 'Your idea is updated' : 'Your idea has a home'); navigate(`/ideas/${data.idea._id}?view=owned`, { replace: true })
    } catch (error) { setError(error instanceof z.ZodError ? error.issues[0].message : errorMessage(error)) }
    finally { setBusy(false) }
  }
  if (loading) return <Loading/>
  if (loadError) return <div className="container page"><ErrorBox message={loadError} retry={() => setRevision(value => value + 1)}/></div>
  return <div className="container page editor-page"><Button component={Link} to="/dashboard" startIcon={<ArrowLeft size={16}/>}>Back to my vault</Button><PageHeading eyebrow="FOLLOW THAT SPARK" title={id ? 'A little room to refine.' : 'What’s on your mind?'} description="A rough thought today could be something remarkable tomorrow."/>
    <form className="editor-layout" onSubmit={submit}><div className="panel form-stack">{error && <Alert severity="error">{error}</Alert>}<TextField label="Give your idea a title" name="title" value={values.title} onChange={change} required fullWidth slotProps={{ htmlInput: { minLength: 5, maxLength: 160 } }}/><TextField label="The idea in a nutshell" name="summary" value={values.summary} onChange={change} required fullWidth multiline rows={2} helperText={`${values.summary.length}/300 characters`} slotProps={{ htmlInput: { minLength: 10, maxLength: 300 } }}/><TextField label="Tell the whole story" name="content" value={values.content} onChange={change} required fullWidth multiline minRows={12} helperText="Describe the problem, your approach, and what could happen next. Plain text keeps your idea clear." slotProps={{ htmlInput: { minLength: 20, maxLength: 20000 } }}/></div><aside className="panel form-stack editor-sidebar"><h2>The finishing touches</h2><TextField select label="Category" name="category" value={values.category} onChange={change}>{categories.map(category => <MenuItem key={category} value={category}>{category}</MenuItem>)}</TextField><TextField label="Tags" name="tags" value={values.tags} onChange={change} helperText="Separate with commas. Up to 8 tags, 30 characters each."/><TextField select label="Who can see this?" name="visibility" value={values.visibility} onChange={change}><MenuItem value="private">Only me — private vault</MenuItem><MenuItem value="public">Everyone — community</MenuItem></TextField><Alert severity={values.visibility === 'private' ? 'info' : 'warning'} icon={values.visibility === 'private' ? <LockKeyhole size={20}/> : undefined}>{values.visibility === 'private' ? 'Only you can read this idea. You can publish it whenever you’re ready.' : 'Publishing makes the full idea visible to everyone and enables community comments.'}</Alert><Button type="submit" variant="contained" size="large" disabled={busy} startIcon={<Check size={17}/>}>{busy ? 'Saving…' : values.visibility === 'public' ? 'Save and publish' : 'Save to my vault'}</Button></aside></form>
  </div>
}
