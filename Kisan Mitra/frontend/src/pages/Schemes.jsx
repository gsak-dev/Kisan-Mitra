import { useState, useEffect } from 'react'
import Layout from '../components/Layout/Navbar'
import { useUser } from '../context/UserContext'
import { useTranslation } from '../hooks/useTranslation'
import { useLanguage } from '../context/LanguageContext'
import { Search, X, ExternalLink, CheckCircle, XCircle, AlertCircle, Bookmark, BookmarkCheck, Share2 } from 'lucide-react'

import { toggleBookmark as apiToggleBookmark, getUserBookmarks } from '../utils/api'
import toast from 'react-hot-toast'

const CATEGORIES = ['all', 'agriculture', 'housing', 'finance', 'education', 'health', 'women', 'labor', 'artisan', 'welfare']

export default function Schemes() {
    const { eligibilityResults, profile, user } = useUser()
    const { t } = useTranslation()
    const { language } = useLanguage()
    const [filter, setFilter] = useState('all')
    const [catFilter, setCatFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('priority')
    const [selected, setSelected] = useState(null)

    // ── Bookmarks (Database) ─────────────────────────────────────────────
    const [bookmarks, setBookmarks] = useState([])

    useEffect(() => {
        if (user?.id) {
            getUserBookmarks(user.id)
                .then(res => { if (res.data?.success) setBookmarks(res.data.bookmarks) })
                .catch(console.error)
        }
    }, [user?.id])

    const isBookmarked = (id) => bookmarks.includes(id)

    const toggleBookmark = async (e, id, name) => {
        e.stopPropagation()
        if (!user?.id) return toast.error("Please act as logged in to save schemes")

        const isSaving = !bookmarks.includes(id)
        // Optimistic update
        setBookmarks(prev => isSaving ? [...prev, id] : prev.filter(b => b !== id))

        try {
            await apiToggleBookmark(user.id, id)
            toast.success(isSaving ? `🔖 Saved: ${name}` : `Removed bookmark`, { duration: 1500 })
        } catch (err) {
            // Revert on failure
            setBookmarks(prev => !isSaving ? [...prev, id] : prev.filter(b => b !== id))
            toast.error("Failed to sync bookmark")
        }
    }

    // ── WhatsApp share ───────────────────────────────────────────────────────
    const shareOnWhatsApp = (e, s) => {
        e.stopPropagation()
        const text = `🌾 *${s.scheme_name}*\n💰 Benefit: ₹${s.benefit_amount.toLocaleString('en-IN')}/yr\n📋 ${s.benefit_description?.slice(0, 120)}\n🔗 Apply: ${s.apply_url || 'kisanmitra.in'}\n\nCheck your eligibility at Kisan Mitra!`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const getName = (s) => language === 'hi' ? (s.scheme_name_hi || s.scheme_name) : language === 'mr' ? (s.scheme_name_mr || s.scheme_name) : s.scheme_name

    let results = [...eligibilityResults]
    if (filter === 'eligible') results = results.filter(r => r.eligible)
    if (filter === 'partial') results = results.filter(r => r.partially_eligible && !r.eligible)
    if (filter === 'saved') results = results.filter(r => bookmarks.includes(r.scheme_id))
    if (catFilter !== 'all') results = results.filter(r => r.category?.includes(catFilter))
    if (search) results = results.filter(r => getName(r).toLowerCase().includes(search.toLowerCase()))
    if (sort === 'benefit') results.sort((a, b) => b.benefit_amount - a.benefit_amount)
    if (sort === 'match') results.sort((a, b) => b.match_percent - a.match_percent)
    if (sort === 'deadline') results.sort((a, b) => new Date(a.deadline || '9999') - new Date(b.deadline || '9999'))

    const getDaysLeft = (deadline) => {
        if (!deadline) return null
        return Math.round((new Date(deadline) - new Date()) / 86400000)
    }

    return (
        <Layout>
            <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h1 style={{ fontWeight: 800, fontSize: '1.4rem' }}>🗂️ {t('schemes')} ({results.length})</h1>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <select className="input" style={{ width: 140 }} value={sort} onChange={e => setSort(e.target.value)}>
                            <option value="priority">By Priority</option>
                            <option value="benefit">By Benefit ₹</option>
                            <option value="match">By Match %</option>
                            <option value="deadline">By Deadline</option>
                        </select>
                    </div>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 16 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input className="input" placeholder="Search schemes..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
                </div>

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    {[['all', 'All'], ['eligible', '✅ Eligible'], ['partial', '🟡 Partial'], ['saved', '🔖 Saved']].map(([v, l]) => (
                        <button key={v} onClick={() => setFilter(v)} className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
                    ))}
                </div>

                {/* Category filter */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                    {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setCatFilter(c)}
                            style={{ padding: '4px 12px', borderRadius: 20, fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', border: catFilter === c ? '1.5px solid #16a34a' : '1.5px solid #e5e7eb', background: catFilter === c ? '#dcfce7' : 'white', color: catFilter === c ? '#15803d' : '#6b7280', textTransform: 'capitalize' }}>
                            {t(c) || c}
                        </button>
                    ))}
                </div>

                {/* Scheme cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {results.map(s => {
                        const daysLeft = getDaysLeft(s.deadline)
                        const urgentDead = daysLeft !== null && daysLeft < 30 && daysLeft > 0
                        return (
                            <div key={s.scheme_id} className={`card ${s.eligible ? 'scheme-eligible' : s.partially_eligible ? 'scheme-partial' : 'scheme-ineligible'}`}
                                style={{ padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}
                                onClick={() => setSelected(s)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{ fontWeight: 700, fontSize: '.9rem', lineHeight: 1.3 }}>{getName(s)}</div>
                                    <span className={`badge ${s.eligible ? 'badge-green' : s.partially_eligible ? 'badge-amber' : 'badge-gray'}`}>
                                        {s.match_percent}%
                                    </span>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#16a34a' }}>
                                    ₹{s.benefit_amount.toLocaleString('en-IN')}
                                    <span style={{ fontSize: '.72rem', color: '#6b7280', fontWeight: 400, marginLeft: 4 }}>/yr</span>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {s.category?.slice(0, 2).map(c => <span key={c} className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{c}</span>)}
                                    {urgentDead && <span className="badge badge-red">⏰ {daysLeft}d left</span>}
                                </div>
                                <div style={{ fontSize: '.78rem', color: '#6b7280', lineHeight: 1.4 }}>{s.benefit_description?.slice(0, 80)}…</div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', alignItems: 'center' }}>
                                    <button className="btn btn-sm btn-outline" onClick={e => { e.stopPropagation(); setSelected(s) }}>Why?</button>
                                    <button
                                        onClick={e => toggleBookmark(e, s.scheme_id, getName(s))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, color: isBookmarked(s.scheme_id) ? '#16a34a' : '#9ca3af' }}
                                        title={isBookmarked(s.scheme_id) ? 'Remove bookmark' : 'Bookmark this scheme'}>
                                        {isBookmarked(s.scheme_id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                    </button>
                                    <button
                                        onClick={e => shareOnWhatsApp(e, s)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, color: '#25d366' }}
                                        title="Share on WhatsApp">
                                        <Share2 size={16} />
                                    </button>
                                    {s.eligible && <a href={s.apply_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary" onClick={e => e.stopPropagation()} style={{ flex: 1, justifyContent: 'center' }}>Apply <ExternalLink size={12} /></a>}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {results.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
                        <p>No schemes match your filters. Try removing filters or update your profile.</p>
                    </div>
                )}
            </div>

            {/* Scheme detail drawer */}
            {selected && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelected(null)}>
                    <div style={{ width: 480, background: 'white', height: '100vh', overflowY: 'auto', padding: 28, boxShadow: '-4px 0 20px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'flex-start', gap: 10 }}>
                            <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{getName(selected)}</h2>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                <button
                                    onClick={e => toggleBookmark(e, selected.scheme_id, getName(selected))}
                                    className={`btn btn-sm ${isBookmarked(selected.scheme_id) ? 'btn-primary' : 'btn-secondary'}`}
                                    title="Bookmark">
                                    {isBookmarked(selected.scheme_id) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                                    {isBookmarked(selected.scheme_id) ? 'Saved' : 'Save'}
                                </button>
                                <button
                                    onClick={e => shareOnWhatsApp(e, selected)}
                                    className="btn btn-sm"
                                    style={{ background: '#25d366', color: 'white', border: 'none' }}
                                    title="Share on WhatsApp">
                                    <Share2 size={14} /> WhatsApp
                                </button>
                                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                        </div>

                        {/* Eligibility badge */}
                        <div className={`badge ${selected.eligible ? 'badge-green' : selected.partially_eligible ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: '.85rem', padding: '6px 14px', marginBottom: 16 }}>
                            {selected.eligible ? '✅ Fully Eligible' : selected.partially_eligible ? '🟡 Partially Eligible' : '❌ Not Eligible'}
                            {' · '}Match: {selected.match_percent}%
                        </div>

                        <p style={{ color: '#6b7280', fontSize: '.88rem', lineHeight: 1.6, marginBottom: 16 }}>
                            {language === 'hi' ? selected.description_hi : language === 'mr' ? selected.description_mr : selected.description}
                        </p>

                        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>💰 Benefit</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#16a34a' }}>₹{selected.benefit_amount.toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: '.82rem', color: '#6b7280' }}>{selected.benefit_description}</div>
                        </div>

                        {/* Failure reasons */}
                        {selected.failure_reasons?.length > 0 && (
                            <div style={{ background: '#fef2f2', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                                <div style={{ fontWeight: 700, marginBottom: 8, color: '#dc2626' }}>❌ Why Not Eligible</div>
                                {selected.failure_reasons.map((r, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '.85rem' }}>
                                        <XCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                                        <span>{r}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Documents */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, marginBottom: 8 }}>📄 Documents</div>
                            {selected.documents_you_have?.map(d => (
                                <div key={d.id} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: '.84rem', color: '#15803d' }}>
                                    <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {d.label}
                                </div>
                            ))}
                            {selected.missing_documents?.map(d => (
                                <div key={d.id} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: '.84rem', color: '#ef4444' }}>
                                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {d.label} <span style={{ color: '#9ca3af' }}>(need to get)</span>
                                </div>
                            ))}
                        </div>

                        {/* Apply button */}
                        {selected.apply_url && (
                            <a href={selected.apply_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                Apply Now <ExternalLink size={16} />
                            </a>
                        )}
                        <div style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>{selected.ministry}</div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
