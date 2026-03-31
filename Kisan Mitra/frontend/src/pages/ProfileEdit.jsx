import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useTranslation } from '../hooks/useTranslation'
import {
    Check, Edit3, ArrowLeft, Sprout, HardHat, Hammer, Briefcase,
    Pickaxe, Home, GraduationCap, FileQuestion, IdCard, CreditCard,
    Map as MapIcon, FileText, Users, Landmark, ShoppingCart, Tag, Baby, Wrench, Save
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']
const CROPS = ['Wheat', 'Rice', 'Jowar', 'Bajra', 'Cotton', 'Sugarcane', 'Soybean', 'Onion', 'Tomato', 'Maize', 'Tur/Arhar', 'Gram/Chana', 'Groundnut', 'Other']
const OCCUPATIONS = [
    { value: 'farmer', label: 'Landowning Farmer', icon: Sprout },
    { value: 'tenant_farmer', label: 'Tenant Farmer', icon: Sprout },
    { value: 'agricultural_laborer', label: 'Agricultural Laborer', icon: HardHat },
]

export default function ProfileEdit() {
    const navigate = useNavigate()
    const { profile: currentProfile, saveProfileToSupabase } = useUser()
    const { t } = useTranslation()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(null)

    useEffect(() => {
        if (currentProfile) {
            setForm({
                ...currentProfile,
                crops: currentProfile.crops || [],
            })
        }
    }, [currentProfile])

    if (!form) return <div className="p-10 text-center">Loading profile...</div>

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
    const toggleCrop = (crop) => setForm(f => ({
        ...f, crops: f.crops.includes(crop) ? f.crops.filter(c => c !== crop) : [...f.crops, crop]
    }))

    const handleSubmit = async () => {
        if (!form.name) { toast.error('Please enter your name'); return }
        setSaving(true)

        const updateData = {
            ...form,
            has_aadhaar: form.has_aadhaar_doc,
        }

        try {
            // Run eligibility diff
            const oldResults = runEligibility(currentProfile)
            const newResults = runEligibility(updateData)

            const oldEligible = oldResults.filter(r => r.eligible).map(r => r.scheme_id)
            const newEligible = newResults.filter(r => r.eligible).map(r => r.scheme_id)

            const gained = newEligible.filter(id => !oldEligible.includes(id)).length
            const lost = oldEligible.filter(id => !newEligible.includes(id)).length

            // Call UserContext to save to Supabase and trigger global re-render
            await saveProfileToSupabase(updateData)

            // Backend endpoint fallback sync if needed based on spec
            if (currentProfile.id && currentProfile.id !== 'demo') {
                try {
                    await fetch('/api/profile/update', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: currentProfile.id, profile: updateData })
                    })
                } catch (e) { }
            }

            toast.success(
                <div>
                    Profile saved successfully!
                    <div style={{ marginTop: 4, fontSize: '0.8rem' }}>
                        {gained > 0 ? `+ Gained eligibility for ${gained} schemes.\n` : ''}
                        {lost > 0 ? `- Lost eligibility for ${lost} schemes.` : ''}
                        {gained === 0 && lost === 0 ? 'No changes in scheme eligibility.' : ''}
                    </div>
                </div>,
                { duration: 4000 }
            )

            setTimeout(() => navigate('/dashboard'), 1500)
        } catch (e) {
            toast.error('Failed to save profile.')
        } finally {
            setSaving(false)
        }
    }

    const isFarmer = form.occupation === 'farmer' || form.occupation === 'tenant_farmer' || form.occupation === 'agricultural_laborer'

    return (
        <div style={{ maxWidth: 800, margin: '30px auto', padding: '0 20px', paddingBottom: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
                    <ArrowLeft size={18} />
                </button>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Edit3 size={24} color="#16a34a" /> Edit Profile
                </h1>
            </div>

            <div className="card" style={{ padding: 30, display: 'grid', gap: 32 }}>

                {/* 1. Personal Info */}
                <section>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d', borderBottom: '2px solid #dcfce7', paddingBottom: 8, marginBottom: 16 }}>1. Personal Information</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        <div>
                            <label className="label">Full Name *</label>
                            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
                        </div>
                        <div>
                            <label className="label">Age *</label>
                            <input className="input" type="number" value={form.age} onChange={e => set('age', e.target.value)} />
                        </div>
                        <div>
                            <label className="label">Gender</label>
                            <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Caste Category</label>
                            <select className="input" value={form.caste} onChange={e => set('caste', e.target.value)}>
                                <option value="General">General</option>
                                <option value="OBC">OBC</option>
                                <option value="SC">SC</option>
                                <option value="ST">ST</option>
                                <option value="NT">NT</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">State</label>
                            <select className="input" value={form.state} onChange={e => set('state', e.target.value)}>
                                {STATES.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">District</label>
                            <input className="input" value={form.district} onChange={e => set('district', e.target.value)} />
                        </div>
                    </div>
                </section>

                {/* 2. Livelihood */}
                <section>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d', borderBottom: '2px solid #dcfce7', paddingBottom: 8, marginBottom: 16 }}>2. Livelihood</h2>
                    <div style={{ marginBottom: 16 }}>
                        <label className="label">Primary Occupation *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {OCCUPATIONS.map(o => (
                                <button key={o.value} onClick={() => set('occupation', o.value)} type="button"
                                    style={{
                                        padding: '10px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', fontSize: '.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                                        border: form.occupation === o.value ? '2px solid #16a34a' : '1.5px solid #e5e7eb',
                                        background: form.occupation === o.value ? '#f0fdf4' : 'white', color: form.occupation === o.value ? '#15803d' : '#374151'
                                    }}>
                                    <o.icon size={16} color={form.occupation === o.value ? '#16a34a' : '#9ca3af'} />
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    </div>



                    {isFarmer && (
                        <div style={{ padding: 16, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label className="label">Land Ownership</label>
                                    <select className="input" value={form.land_ownership} onChange={e => set('land_ownership', e.target.value)}>
                                        <option value="owned">Owned</option>
                                        <option value="leased">Leased</option>
                                        <option value="both">Owned + Leased</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Land Size: {form.land_acres} acres</label>
                                    <input type="range" min="0" max="50" step="0.5" value={form.land_acres}
                                        onChange={e => set('land_acres', +e.target.value)}
                                        style={{ width: '100%', accentColor: '#16a34a', marginTop: 8 }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: 14 }}>
                                <label className="label">Crops Grown</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {CROPS.map(c => (
                                        <button key={c} type="button" onClick={() => toggleCrop(c)}
                                            style={{
                                                padding: '5px 12px', borderRadius: 20, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer',
                                                border: form.crops.includes(c) ? '1.5px solid #16a34a' : '1.5px solid #e5e7eb',
                                                background: form.crops.includes(c) ? '#dcfce7' : 'white',
                                                color: form.crops.includes(c) ? '#15803d' : '#6b7280'
                                            }}>
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="label">Irrigation Type</label>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {['Rainfed', 'Canal', 'Borewell', 'Drip'].map(ir => (
                                        <button key={ir} type="button" onClick={() => set('irrigation', ir.toLowerCase())}
                                            style={{
                                                padding: '6px 14px', borderRadius: 20, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
                                                border: form.irrigation === ir.toLowerCase() ? '1.5px solid #16a34a' : '1.5px solid #e5e7eb',
                                                background: form.irrigation === ir.toLowerCase() ? '#dcfce7' : 'white',
                                                color: form.irrigation === ir.toLowerCase() ? '#15803d' : '#6b7280'
                                            }}>
                                            {ir}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* 3. Financial & Demographics */}
                <section>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d', borderBottom: '2px solid #dcfce7', paddingBottom: 8, marginBottom: 16 }}>3. Financial & Special Categories</h2>
                    <div style={{ marginBottom: 20 }}>
                        <label className="label">Annual Household Income: ₹{form.annual_income.toLocaleString('en-IN')}</label>
                        <input type="range" min="0" max="1000000" step="5000" value={form.annual_income}
                            onChange={e => set('annual_income', +e.target.value)}
                            style={{ width: '100%', accentColor: '#16a34a' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                        {[
                            ['has_bank_account', 'Bank Account ✓'],
                            ['is_income_tax_payer', 'Income Tax Payer'],
                            ['is_government_employee', 'Government Employee'],
                            ['has_kcc', 'Kisan Credit Card (KCC)'],
                            ['has_farm_loan', 'Outstanding Farm Loan'],
                            ['has_tractor', 'Owns a Tractor'],
                            ['is_fpo_member', 'Member of an FPO'],
                        ].map(([key, label]) => (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: form[key] ? '#f0fdf4' : '#f9fafb', border: form[key] ? '1.5px solid #16a34a' : '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '.85rem', fontWeight: 600 }}>
                                <input type="checkbox" checked={!!form[key]} onChange={e => set(key, e.target.checked)} style={{ accentColor: '#16a34a', width: 16, height: 16 }} />
                                {label}
                            </label>
                        ))}
                    </div>
                </section>

                {/* 4. Documents */}
                <section>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d', borderBottom: '2px solid #dcfce7', paddingBottom: 8, marginBottom: 16 }}>4. Documents Currently Held</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                        {[
                            ['has_aadhaar_doc', 'Aadhaar Card', IdCard],
                            ['has_pan', 'PAN Card', CreditCard],
                            ['has_land_record', 'Land Record / 7-12', MapIcon],
                            ['has_income_certificate', 'Income Certificate', FileText],
                            ['has_caste_certificate', 'Caste Certificate', Users],
                            ['has_bank_account', 'Bank Passbook', Landmark],
                            ['has_ration_card', 'Ration Card', ShoppingCart],
                        ].map(([key, label, Icon]) => (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 14px', background: form[key] ? '#f0fdf4' : 'white', border: form[key] ? '1.5px solid #16a34a' : '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '.85rem', fontWeight: 600 }}>
                                <input type="checkbox" checked={!!form[key]} onChange={e => set(key, e.target.checked)} style={{ accentColor: '#16a34a', width: 16, height: 16 }} />
                                <Icon size={16} color={form[key] ? '#16a34a' : '#9ca3af'} />
                                <span style={{ color: form[key] ? '#15803d' : '#374151' }}>{label}</span>
                            </label>
                        ))}
                    </div>
                </section>

                {/* Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
                    <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={saving} style={{ padding: '14px 40px', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Save size={18} /> {saving ? 'Saving Profile...' : 'Save Profile'}
                    </button>
                </div>

            </div>
        </div>
    )
}
