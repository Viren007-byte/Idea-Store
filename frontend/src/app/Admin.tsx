import { useState } from 'react'
import { Alert, Button, Chip, Tab, Tabs, TextField } from '@mui/material'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api, errorMessage } from './api'
import type { Idea, User } from './types'
import { ConfirmDialog, dateLabel, Empty, ErrorBox, fullName, Loading, PageHeading, Pager, useLoad } from './ui'

interface Stats { users: number; activeUsers: number; ideas: number; publicIdeas: number; comments: number; database: string }
export default function Admin() {
  const [tab, setTab] = useState(0)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState<{ id: string; type: 'idea' | 'user'; active?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const stats = useLoad(async () => (await api.get<{ stats: Stats }>('/admin/stats')).data.stats, [])
  const records = useLoad(async () => (await api.get<{ users?: User[]; ideas?: Idea[]; pages: number; total: number }>(tab === 0 ? '/admin/users' : '/admin/ideas', { params: { q, page } })).data, [tab, q, page])
  async function confirm() {
    if (!target) return
    setBusy(true)
    try {
      if (target.type === 'idea') await api.delete(`/admin/ideas/${target.id}`)
      else await api.patch(`/admin/users/${target.id}`, { active: target.active })
      records.reload(); stats.reload(); toast.success(target.type === 'idea' ? 'Published idea removed' : target.active ? 'Account restored' : 'Account suspended')
    } catch (error) { toast.error(errorMessage(error)) }
    finally { setBusy(false); setTarget(null) }
  }
  return <div className="container page"><PageHeading eyebrow="COMMUNITY STEWARDSHIP" title="Keep good ideas growing." description="Monitor platform health, manage accounts, and moderate published content."/>{stats.error ? <ErrorBox message={stats.error} retry={stats.reload}/> : <><Alert severity="success">Database: {stats.data?.database || 'checking…'}. Private idea contents remain accessible only to their owners.</Alert><div className="stats-grid admin-stats">{[['Members', stats.data?.users], ['Active accounts', stats.data?.activeUsers], ['Saved ideas', stats.data?.ideas], ['Published ideas', stats.data?.publicIdeas], ['Comments', stats.data?.comments]].map(([label, value]) => <div className="stat" key={label}><span>{label}<strong>{value ?? '—'}</strong></span></div>)}</div></>}
    <Tabs value={tab} onChange={(_, value) => { setTab(value); setPage(1); setQ(''); setSearch('') }} aria-label="Administration sections"><Tab label="Member accounts"/><Tab label="Published content"/></Tabs><form className="admin-search" onSubmit={event => { event.preventDefault(); setQ(search); setPage(1) }}><TextField label={tab === 0 ? 'Search members' : 'Search published ideas'} value={search} onChange={event => setSearch(event.target.value)} size="small"/><Button type="submit" variant="outlined">Search</Button></form>
    {records.loading ? <Loading/> : records.error ? <ErrorBox message={records.error} retry={records.reload}/> : !records.data?.total ? <Empty title="Nothing to review here.">Records matching your search will appear here.</Empty> : <><div className="table-scroll"><table><thead><tr><th>{tab === 0 ? 'Member' : 'Idea'}</th><th>{tab === 0 ? 'Role & status' : 'Author'}</th><th>{tab === 0 ? 'Joined' : 'Published'}</th><th>Action</th></tr></thead><tbody>{tab === 0 ? records.data.users?.map(user => <tr key={user._id}><td><strong>{fullName(user)}</strong><small>{user.email}</small></td><td><Chip size="small" label={user.role === 'admin' ? 'Administrator' : user.active ? 'Active' : 'Suspended'} color={user.active ? 'success' : 'default'} variant="outlined"/></td><td>{dateLabel(user.createdAt)}</td><td><Button size="small" disabled={user.role === 'admin'} color={user.active ? 'error' : 'primary'} onClick={() => setTarget({ id: user._id, type: 'user', active: !user.active })}>{user.active ? 'Suspend' : 'Restore'}</Button></td></tr>) : records.data.ideas?.map(idea => <tr key={idea._id}><td><Link to={`/ideas/${idea._id}`}>{idea.title}</Link><small>{idea.category}</small></td><td>{fullName(idea.owner)}</td><td>{dateLabel(idea.createdAt)}</td><td><Button size="small" color="error" onClick={() => setTarget({ id: idea._id, type: 'idea' })}>Remove</Button></td></tr>)}</tbody></table></div><Pager page={page} pages={records.data.pages} onChange={setPage}/></>}
    <ConfirmDialog open={!!target} busy={busy} title={target?.type === 'idea' ? 'Remove published idea?' : target?.active ? 'Restore this account?' : 'Suspend this account?'} description={target?.type === 'idea' ? 'The idea and all its comments will be permanently deleted.' : target?.active ? 'This member will be able to log in again.' : 'The member will lose access immediately. Their saved content is preserved, and you can restore access later.'} onClose={() => setTarget(null)} onConfirm={confirm}/></div>
}
