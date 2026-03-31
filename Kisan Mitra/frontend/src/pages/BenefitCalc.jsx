import { useState, useEffect } from 'react'
import Layout from '../components/Layout/Navbar'
import { useUser } from '../context/UserContext'
import { whatIfAPI } from '../utils/api'
import { Sliders, TrendingUp, TrendingDown, ArrowRight, XCircle } from 'lucide-react'

export default function BenefitCalc() {
    const { profile, totalBenefit } = useUser()

    const [changes, setChanges] = useState({
        land_acres: profile?.land_acres || '',
        annual_income: profile?.annual_income || '',
        caste: profile?.caste || '',
        occupation: profile?.occupation || '',
        age: profile?.age || '',
        state: profile?.state || '',
        gender: profile?.gender || '',
        is_bpl: !!profile?.is_bpl,
        has_income_certificate: !!profile?.has_income_certificate,
        has_caste_certificate: !!profile?.has_caste_certificate,
        is_shg_member: !!profile?.is_shg_member
    })

    const [result, setResult] = useState(null)

    // Run simulation via backend API when sliders/inputs change
    useEffect(() => {
        if (!profile) return
        const parsedChanges = { ...changes }
        if (parsedChanges.land_acres !== '') parsedChanges.land_acres = Number(parsedChanges.land_acres)
        if (parsedChanges.annual_income !== '') parsedChanges.annual_income = Number(parsedChanges.annual_income)
        if (parsedChanges.age !== '') parsedChanges.age = Number(parsedChanges.age)

        whatIfAPI(profile, parsedChanges)
            .then(res => {
                const sim = res.data
                const gainedAmt = (sim.gained || []).reduce((sum, s) => sum + (s.benefit_amount || 0), 0)
                const lostAmt = (sim.lost || []).reduce((sum, s) => sum + (s.benefit_amount || 0), 0)
                setResult({ ...sim, gainedAmt, lostAmt, netDiff: gainedAmt - lostAmt })
            })
            .catch(err => console.error('What-if API error:', err))
    }, [changes, profile])

    if (!profile) return null

    const handleReset = () => {
        setChanges({
            land_acres: profile.land_acres || '',
            annual_income: profile.annual_income || '',
            caste: profile.caste || '',
            occupation: profile.occupation || '',
            age: profile.age || '',
            state: profile.state || '',
            gender: profile.gender || '',
            is_bpl: !!profile.is_bpl,
            has_income_certificate: !!profile.has_income_certificate,
            has_caste_certificate: !!profile.has_caste_certificate,
            is_shg_member: !!profile.is_shg_member
        })
    }

    return (
        <Layout>
            <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: 6 }}>
                            🔮 What-If Simulator
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: '.9rem' }}>
                            Test different scenarios to see how it affects your scheme eligibility and total benefits.
                        </p>
                    </div>
                    <button className="btn btn-outline" onClick={handleReset}>Reset to Real Profile</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>

                    {/* ── Left Column: The Controls ────────────────────────────────────────── */}
                    <div className="card" style={{ padding: 24, background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
                            <Sliders size={18} color="#3b82f6" /> Adjust Your Profile
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {/* Annual Income */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <label className="label" style={{ marginBottom: 0 }}>Annual Income</label>
                                    <span style={{ fontWeight: 700, color: '#16a34a' }}>₹{Number(changes.annual_income || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <input type="range" min="0" max="1000000" step="10000"
                                    style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }}
                                    value={changes.annual_income}
                                    onChange={e => setChanges(p => ({ ...p, annual_income: e.target.value }))}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: '#9ca3af', marginTop: 4 }}>
                                    <span>₹0</span><span>₹10L+</span>
                                </div>
                            </div>

                            {/* Land Size */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <label className="label" style={{ marginBottom: 0 }}>Land Ownership (Acres)</label>
                                    <span style={{ fontWeight: 700, color: '#0ea5e9' }}>{changes.land_acres || 0} acres</span>
                                </div>
                                <input type="range" min="0" max="50" step="0.5"
                                    style={{ width: '100%', cursor: 'pointer', accentColor: '#0ea5e9' }}
                                    value={changes.land_acres}
                                    onChange={e => setChanges(p => ({ ...p, land_acres: e.target.value }))}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: '#9ca3af', marginTop: 4 }}>
                                    <span>0</span><span>50</span>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />

                            {/* Demographics Row (Age, Gender) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label className="label">Age</label>
                                    <input className="input" type="number" value={changes.age} onChange={e => setChanges(p => ({ ...p, age: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="label">Gender</label>
                                    <select className="input" value={changes.gender} onChange={e => setChanges(p => ({ ...p, gender: e.target.value }))}>
                                        <option value="">--</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Transgender">Transgender</option>
                                    </select>
                                </div>
                            </div>

                            {/* Location & Caste */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label className="label">State</label>
                                    <select className="input" value={changes.state} onChange={e => setChanges(p => ({ ...p, state: e.target.value }))}>
                                        <option value="">--</option>
                                        <option value="Maharashtra">Maharashtra</option>
                                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                                        <option value="Rajasthan">Rajasthan</option>
                                        <option value="All India">All India</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Caste Category</label>
                                    <select className="input" value={changes.caste} onChange={e => setChanges(p => ({ ...p, caste: e.target.value }))}>
                                        <option value="General">General</option>
                                        <option value="OBC">OBC</option>
                                        <option value="SC">SC</option>
                                        <option value="ST">ST</option>
                                    </select>
                                </div>
                            </div>

                            {/* Occupation */}
                            <div>
                                <label className="label">Occupation / Group</label>
                                <select className="input" value={changes.occupation} onChange={e => setChanges(p => ({ ...p, occupation: e.target.value }))}>
                                    <option value="">(None)</option>
                                    <option value="Farmer">Farmer</option>
                                    <option value="Student">Student</option>
                                    <option value="Laborer">Unorganized Worker / Laborer</option>
                                    <option value="Artisan">Artisan / Weaver</option>
                                    <option value="Self Employed">Self Employed / Micro-enterprise</option>
                                </select>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />

                            {/* Critical Flags */}
                            <div>
                                <label className="label" style={{ marginBottom: 12 }}>Critical Status & Documents</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        { key: 'is_bpl', label: 'Household is Below Poverty Line (BPL)' },
                                        { key: 'has_income_certificate', label: 'Have an Income Certificate' },
                                        { key: 'has_caste_certificate', label: 'Have a Caste Certificate' },
                                        { key: 'is_shg_member', label: 'Member of a Women\'s Self Help Group (SHG)' }
                                    ].map(flag => (
                                        <label key={flag.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem', color: '#334155', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={changes[flag.key]}
                                                onChange={e => setChanges(p => ({ ...p, [flag.key]: e.target.checked }))}
                                                style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
                                            />
                                            {flag.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ── Right Column: The Impact ────────────────────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Summary KPI */}
                        <div className="card" style={{ padding: 24, textAlign: 'center', background: result?.netDiff > 0 ? '#f0fdf4' : result?.netDiff < 0 ? '#fef2f2' : 'white', border: `1.5px solid ${result?.netDiff > 0 ? '#86efac' : result?.netDiff < 0 ? '#fecaca' : '#e5e7eb'}`, transition: 'all 0.3s' }}>
                            <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Simulated Annual Benefit
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                ₹{((totalBenefit || 0) + (result?.netDiff || 0)).toLocaleString('en-IN')}
                                {result?.netDiff > 0 && <span style={{ fontSize: '1.2rem', color: '#16a34a', fontWeight: 800, background: '#dcfce7', padding: '4px 12px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={20} /> +₹{result.netDiff.toLocaleString('en-IN')}</span>}
                                {result?.netDiff < 0 && <span style={{ fontSize: '1.2rem', color: '#dc2626', fontWeight: 800, background: '#fee2e2', padding: '4px 12px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}><TrendingDown size={20} /> -₹{Math.abs(result.netDiff).toLocaleString('en-IN')}</span>}
                            </div>
                            <div style={{ fontSize: '.85rem', color: '#6b7280', marginTop: 10 }}>
                                Original Profile Benefit: ₹{(totalBenefit || 0).toLocaleString('en-IN')} • Eligible Schemes: {result?.modified_eligible_count || 0}
                            </div>
                        </div>

                        {/* Result Breakdown Columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                            {/* Gained Schemes */}
                            <div className="card" style={{ padding: 20, borderTop: '4px solid #16a34a' }}>
                                <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#16a34a', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <TrendingUp size={18} /> New Schemes Unlocked ({result?.gained?.length || 0})
                                </h3>
                                {result?.gained?.length === 0 ? (
                                    <div style={{ color: '#9ca3af', fontSize: '.85rem', fontStyle: 'italic' }}>No new schemes activated by these changes.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {result?.gained?.map(s => (
                                            <div key={s.scheme_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f0fdf4', borderRadius: 8 }}>
                                                <div style={{ flex: 1, paddingRight: 10 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#15803d' }}>{s.scheme_name}</div>
                                                </div>
                                                <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '.9rem', textAlign: 'right' }}>
                                                    +₹{s.benefit_amount.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Lost Schemes */}
                            <div className="card" style={{ padding: 20, borderTop: '4px solid #ef4444' }}>
                                <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#ef4444', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <TrendingDown size={18} /> Schemes Lost ({result?.lost?.length || 0})
                                </h3>
                                {result?.lost?.length === 0 ? (
                                    <div style={{ color: '#9ca3af', fontSize: '.85rem', fontStyle: 'italic' }}>Your current eligible schemes are secure.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {result?.lost?.map(s => (
                                            <div key={s.scheme_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fef2f2', borderRadius: 8 }}>
                                                <div style={{ flex: 1, paddingRight: 10 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#b91c1c' }}>{s.scheme_name}</div>
                                                    <div style={{ fontSize: '.7rem', color: '#ef4444', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <XCircle size={12} /> {s.failure_reasons[0]?.slice(0, 50)}...
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '.9rem', textAlign: 'right' }}>
                                                    -₹{s.benefit_amount.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    )
}
