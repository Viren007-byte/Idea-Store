import { useEffect, useState, type ReactNode } from 'react'
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Pagination } from '@mui/material'
import { Link } from 'react-router-dom'
import { ArrowUpRight, LockKeyhole, MessageSquare, Sparkles } from 'lucide-react'
import { errorMessage } from './api'
import type { Author, Idea } from './types'

export const fullName = (author: Author | null | undefined) => author ? `${author.firstName} ${author.lastName}` : 'Former member'
export const dateLabel = (value: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
export function Loading() { return <div className="loading" role="status"><CircularProgress size={28}/><span>Loading your workspace…</span></div> }
export function Empty({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty"><span className="empty-icon"><Sparkles size={28}/></span><h2>{title}</h2><p>{children}</p>{action}</div>
}
export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return <Alert severity="error" action={retry ? <Button color="inherit" size="small" onClick={retry}>Retry</Button> : undefined}>{message}</Alert>
}
export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>
}
export function IdeaCard({ idea, owned = false }: { idea: Idea; owned?: boolean }) {
  return <article className="idea-card"><div className="card-top"><span className="category">{idea.category}</span>{idea.visibility === 'private' && <span className="privacy"><LockKeyhole size={12}/> Private</span>}</div>
    <Link className="card-title" to={`/ideas/${idea._id}${owned ? '?view=owned' : ''}`}><h2>{idea.title}</h2><ArrowUpRight size={20}/></Link>
    <p className="card-summary">{idea.summary}</p><div className="tags">{idea.tags.slice(0, 4).map(tag => <span key={tag}>#{tag}</span>)}</div>
    <div className="card-footer"><span className="author-avatar">{idea.owner?.firstName?.[0] || 'I'}</span><div><strong>{fullName(idea.owner)}</strong><small>{dateLabel(idea.updatedAt)}</small></div><MessageSquare size={16}/></div>
  </article>
}
export function Pager({ pages, page, onChange }: { pages: number; page: number; onChange: (page: number) => void }) {
  return pages > 1 ? <div className="pager"><Pagination count={pages} page={page} color="primary" onChange={(_, value) => onChange(value)}/></div> : null
}
export function ConfirmDialog({ open, title, description, busy, onClose, onConfirm }: {
  open: boolean; title: string; description: string; busy?: boolean; onClose: () => void; onConfirm: () => void
}) {
  return <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth><DialogTitle>{title}</DialogTitle><DialogContent><DialogContentText>{description}</DialogContentText></DialogContent><DialogActions><Button disabled={busy} onClick={onClose}>Cancel</Button><Button color="error" variant="contained" disabled={busy} onClick={onConfirm}>{busy ? 'Please wait…' : 'Confirm'}</Button></DialogActions></Dialog>
}
export function useLoad<T>(loader: () => Promise<T>, dependencies: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let current = true
    setLoading(true); setError('')
    loader().then(value => { if (current) setData(value) }).catch(error => { if (current) setError(errorMessage(error)) }).finally(() => { if (current) setLoading(false) })
    return () => { current = false }
    // Callers supply the values that define the request; stale responses are discarded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, revision])
  return { data, error, loading, reload: () => setRevision(value => value + 1) }
}
