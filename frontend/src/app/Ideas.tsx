import { useState } from 'react'
import { Button, InputAdornment, MenuItem, TextField } from '@mui/material'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, LockKeyhole, Globe2, Lightbulb } from 'lucide-react'
import { api } from './api'
import { categories, type IdeaList } from './types'
import { Empty, ErrorBox, IdeaCard, Loading, PageHeading, Pager, useLoad } from './ui'

export default function Ideas({ mine = false }: { mine?: boolean }) {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const visibility = params.get('visibility') || ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [search, setSearch] = useState(q)
  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  const { data, loading, error, reload } = useLoad(async () => (await api.get<IdeaList>(mine ? '/ideas/mine' : '/ideas', { params: { q, page, ...(category && !mine ? { category } : {}), ...(visibility && mine ? { visibility } : {}) } })).data, [mine, q, page, category, visibility])
  return <div className="container page"><PageHeading eyebrow={mine ? 'YOUR PERSONAL NOTEBOOK' : 'GOOD IDEAS TRAVEL'} title={mine ? 'Room for your next big thing.' : 'A world of what-ifs.'} description={mine ? 'Capture, organize, and grow your ideas. Share only when you’re ready.' : 'Discover fresh thinking from curious people. Join the conversation.'} action={<Button component={Link} to="/ideas/new" variant="contained" startIcon={<Plus size={17}/>}>New idea</Button>}/>
    {mine && <div className="stats-grid"><div className="stat"><Lightbulb/><span>All your ideas<strong>{(data?.privateCount ?? 0) + (data?.publicCount ?? 0)}</strong></span></div><div className="stat"><LockKeyhole/><span>In your private vault<strong>{data?.privateCount ?? 0}</strong></span></div><div className="stat"><Globe2/><span>Shared with the community<strong>{data?.publicCount ?? 0}</strong></span></div></div>}
    <div className="filters"><form onSubmit={event => { event.preventDefault(); update('q', search) }}><TextField size="small" placeholder="Search ideas…" aria-label="Search ideas" value={search} onChange={event => setSearch(event.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={17}/></InputAdornment> } }}/><Button type="submit" variant="outlined">Search</Button></form>{mine ? <TextField select size="small" label="Visibility" value={visibility} onChange={event => update('visibility', event.target.value)}><MenuItem value="">All ideas</MenuItem><MenuItem value="private">Private</MenuItem><MenuItem value="public">Published</MenuItem></TextField> : <TextField select size="small" label="Category" value={category} onChange={event => update('category', event.target.value)}><MenuItem value="">All categories</MenuItem>{categories.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>}</div>
    {loading ? <Loading/> : error ? <ErrorBox message={error} retry={reload}/> : data?.ideas.length ? <><p className="result-count">{data.total} {data.total === 1 ? 'idea' : 'ideas'} to {mine ? 'keep growing' : 'get you thinking'}</p><div className="idea-grid">{data.ideas.map(idea => <IdeaCard key={idea._id} idea={idea} owned={mine}/>)}</div><Pager page={page} pages={data.pages} onChange={value => update('page', String(value))}/></> : <Empty title={q || category || visibility ? 'No ideas match these filters.' : mine ? 'Every great idea starts somewhere.' : 'A fresh page, full of possibility.'} action={<Button component={Link} to="/ideas/new" variant="contained" startIcon={<Plus size={16}/>}>Capture an idea</Button>}>{q || category || visibility ? 'Try another search or remove a filter.' : mine ? 'Save your first thought to your private vault.' : 'Be the first to share an idea with the community.'}</Empty>}
  </div>
}
