import { useState, type FormEvent } from 'react'
import { Button, TextField } from '@mui/material'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Globe2, LockKeyhole, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from './api'
import { useAppSelector } from './store'
import type { Comment, Idea } from './types'
import { ConfirmDialog, dateLabel, Empty, ErrorBox, fullName, Loading, Pager, useLoad } from './ui'

export default function IdeaDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const owned = params.get('view') === 'owned'
  const user = useAppSelector(state => state.auth.user)
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const { data, loading, error, reload } = useLoad(async () => (await api.get<{ idea: Idea }>(`/ideas/${id}${owned ? '/owned' : ''}`)).data.idea, [id, owned])
  const isOwner = !!user && data?.owner?._id === user._id
  async function remove() {
    setDeleting(true)
    try { await api.delete(`/ideas/${id}`); toast.success('Idea deleted'); navigate('/dashboard', { replace: true }) }
    catch (error) { toast.error(errorMessage(error)) }
    finally { setDeleting(false); setConfirm(false) }
  }
  if (loading) return <Loading/>
  if (error || !data) return <div className="container page"><ErrorBox message={error || 'Idea not found'} retry={reload}/></div>
  return <div className="container page detail-page"><Button component={Link} to={owned ? '/dashboard' : '/ideas'} startIcon={<ArrowLeft size={16}/>}>{owned ? 'Back to my vault' : 'Back to explore'}</Button><article className="idea-article"><div className="article-meta"><span className="category">{data.category}</span><span className="privacy">{data.visibility === 'private' ? <LockKeyhole size={14}/> : <Globe2 size={14}/>} {data.visibility === 'private' ? 'Private idea' : 'Published idea'}</span></div><h1>{data.title}</h1><p className="article-summary">{data.summary}</p><div className="article-byline"><span className="author-avatar">{data.owner?.firstName?.[0] || 'I'}</span><div><strong>{fullName(data.owner)}</strong><small>Updated {dateLabel(data.updatedAt)}</small></div>{isOwner && <div className="article-actions"><Button component={Link} to={`/ideas/${id}/edit`} startIcon={<Pencil size={15}/>}>Edit</Button><Button color="error" startIcon={<Trash2 size={15}/>} onClick={() => setConfirm(true)}>Delete</Button></div>}</div><div className="article-body">{data.content}</div><div className="tags">{data.tags.map(tag => <span key={tag}>#{tag}</span>)}</div></article>
  {data.visibility === 'public' ? <Comments idea={data}/> : <div className="private-note"><LockKeyhole size={19}/><p>This idea is in your private vault. Publish it to invite community feedback.</p></div>}
  <ConfirmDialog open={confirm} title="Delete this idea?" description="This permanently removes the idea and its comments. This action cannot be undone." busy={deleting} onClose={() => setConfirm(false)} onConfirm={remove}/></div>
}
function Comments({ idea }: { idea: Idea }) {
  const user = useAppSelector(state => state.auth.user)
  const [body, setBody] = useState('')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [target, setTarget] = useState<string | null>(null)
  const { data, loading, error, reload } = useLoad(async () => (await api.get<{ comments: Comment[]; total: number; pages: number }>(`/ideas/${idea._id}/comments`, { params: { page, limit: 10 } })).data, [idea._id, page])
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true)
    try { await api.post(`/ideas/${idea._id}/comments`, { body }); setBody(''); setPage(1); reload(); toast.success('Your perspective is part of the conversation') }
    catch (error) { toast.error(errorMessage(error)) }
    finally { setBusy(false) }
  }
  async function remove() {
    setBusy(true)
    try { await api.delete(`/ideas/${idea._id}/comments/${target}`); reload(); toast.success('Comment removed') }
    catch (error) { toast.error(errorMessage(error)) }
    finally { setBusy(false); setTarget(null) }
  }
  return <section className="comments"><div className="section-title"><h2><MessageSquare size={22}/> The conversation <span>{data?.total ?? 0}</span></h2></div>{user ? <form className="comment-form" onSubmit={submit}><TextField label="Add a fresh perspective" value={body} onChange={event => setBody(event.target.value)} multiline minRows={3} fullWidth required slotProps={{ htmlInput: { maxLength: 2000 } }}/><Button variant="contained" type="submit" disabled={busy || !body.trim()}>Post comment</Button></form> : <div className="panel"><Link to="/login" state={{ from: `/ideas/${idea._id}` }}>Log in</Link> to join the conversation.</div>}
  {loading ? <Loading/> : error ? <ErrorBox message={error} retry={reload}/> : !data?.comments.length ? <Empty title="Start a thoughtful conversation.">Ask a question, share a perspective, or help this idea grow.</Empty> : <>{data.comments.map(comment => <article className="comment" key={comment._id}><div className="comment-heading"><span className="author-avatar">{comment.author?.firstName?.[0] || 'M'}</span><div><strong>{fullName(comment.author)}</strong><small>{dateLabel(comment.createdAt)}</small></div>{user && (comment.author?._id === user._id || idea.owner?._id === user._id || user.role === 'admin') && <Button size="small" color="error" onClick={() => setTarget(comment._id)}>Delete</Button>}</div><p>{comment.body}</p></article>)}<Pager page={page} pages={data.pages} onChange={setPage}/></>}
  <ConfirmDialog open={!!target} title="Remove this comment?" description="The comment will be permanently deleted." busy={busy} onClose={() => setTarget(null)} onConfirm={remove}/></section>
}
