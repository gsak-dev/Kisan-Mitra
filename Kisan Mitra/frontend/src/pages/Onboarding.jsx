import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { useTranslation } from '../hooks/useTranslation'
import { Leaf, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']
const CROPS = ['Wheat', 'Rice', 'Jowar', 'Bajra', 'Cotton', 'Sugarcane', 'Soybean', 'Onion', 'Tomato', 'Maize', 'Tur/Arhar', 'Gram/Chana', 'Groundnut', 'Other']
const OCCUPATIONS = [
    { value: 'farmer', label: '🌾 Landowning Farmer' },
    { value: 'tenant_farmer', label: '🚜 Tenant Farmer' },
    { value: 'agricultural_laborer', label: '👷 Agricultural Laborer' },
]

const STEPS = ['Personal Info', 'Livelihood', 'Financial', 'Documents']

export default function Onboarding() {
    const navigate = useNavigate()
    const { saveProfileToSupabase, setDemoProfile } = useUser()
    const { t } = useTranslation()
    const [step, setStep] = useState(0)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        name: '', age: '', state: 'Maharashtra', district: '', language: 'hi', gender: 'male', caste: 'OBC',
        occupation: 'farmer', land_ownership: 'owned', land_acres: 2, crops: [], irrigation: 'borewell',
        annual_income: 100000, has_bank_account: true, has_aadhaar: true, is_income_tax_payer: false,
        is_government_employee: false, has_kcc: false, has_farm_loan: false, has_tractor: false, is_fpo_member: false,
        has_aadhaar_doc: true, has_pan: false, has_land_record: true, has_income_certificate: false,
        has_caste_certificate: false, has_ration_card: false, is_rural: true,
    })

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
    const toggleCrop = (crop) => setForm(f => ({
        ...f, crops: f.crops.includes(crop) ? f.crops.filter(c => c !== crop) : [...f.crops, crop]
    }))

    const validate = () => {
        if (step === 0 && (!form.name || !form.age)) { toast.error('Please fill name and age'); return false }
        return true
    }

    const handleNext = () => { if (validate()) setStep(s => s + 1) }
    const handleBack = () => setStep(s => s - 1)

    const handleSubmit = async () => {
        if (!form.name) {
            toast.error('Please complete your profile')
            return
        }

        setSaving(true)

        const profile = {
            ...form,

            // ✅ FIX 1: normalize occupation
            occupation: form.occupation.replace('_', ' '),

            // ✅ FIX 2: lowercase crops
            crops: form.crops.map(c => c.toLowerCase()),

            // ✅ FIX 3: irrigation already lowercase but safe
            irrigation: (form.irrigation || '').toLowerCase(),

            // ✅ FIX 4: backend expects this
            has_aadhaar: form.has_aadhaar_doc
        }

        console.log("🚀 FINAL PROFILE SENT:", profile) // DEBUG

        try {
            await saveProfileToSupabase(profile)
            toast.success('Profile saved! Finding your schemes...')
            navigate('/dashboard')
        } catch (e) {
            console.log("Demo mode profile:", profile)
            setDemoProfile(profile)
            navigate('/dashboard')
        } finally {
            setSaving(false)
        }
    }

    const isFarmer = form.occupation === 'farmer' || form.occupation === 'tenant_farmer' || form.occupation === 'agricultural_laborer'

    const pct = Math.round(((step + 1) / 4) * 100)

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0fdf4,#e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 680 }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 36, height: 36, background: '#16a34a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Leaf size={18} color="white" /></div>
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#16a34a' }}>Kisan Mitra</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.3rem', color: '#111827' }}>{t('onboarding_title')}</div>
                    <div style={{ color: '#6b7280', fontSize: '.85rem', marginTop: 4 }}>Step {step + 1} of 4 — {STEPS[step]}</div>
                </div>

                {/* Progress */}
                <div className="progress-bar" style={{ marginBottom: 28 }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>

                {/* Step tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
                    {STEPS.map((s, i) => (
                        <div key={s} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: '.75rem', fontWeight: 700,
                            background: i < step ? '#dcfce7' : i === step ? '#16a34a' : '#f3f4f6',
                            color: i < step ? '#15803d' : i === step ? 'white' : '#9ca3af'
                        }}>
                            {i < step ? <Check size={12} /> : null}{s}
                        </div>
                    ))}
                </div>

                {/* Form card */}
                <div className="card fade-in" style={{ padding: 32 }}>

                    {/* STEP 0: Personal Info */}
                    {step === 0 && (
                        <div style={{ display: 'grid', gap: 18 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label className="label">Full Name *</label>
                                    <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ramesh Kumar Patil" />
                                </div>
                                <div>
                                    <label className="label">Age *</label>
                                    <input className="input" type="number" value={form.age} onChange={e => set('age', e.target.value)} placeholder="38" min="10" max="100" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label className="label">State</label>
                                    <select className="input" value={form.state} onChange={e => set('state', e.target.value)}>
                                        {STATES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">District</label>
                                    <input className="input" value={form.district} onChange={e => set('district', e.target.value)} placeholder="Nashik" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
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
                                    <label className="label">Language Preference</label>
                                    <select className="input" value={form.language} onChange={e => set('language', e.target.value)}>
                                        <option value="en">English</option>
                                        <option value="hi">हिंदी</option>
                                        <option value="mr">मराठी</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: Livelihood */}
                    {step === 1 && (
                        <div style={{ display: 'grid', gap: 18 }}>
                            <div>
                                <label className="label">Primary Occupation *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {OCCUPATIONS.map(o => (
                                        <button key={o.value} onClick={() => set('occupation', o.value)} type="button"
                                            style={{
                                                padding: '10px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', fontSize: '.85rem', fontWeight: 600,
                                                border: form.occupation === o.value ? '2px solid #16a34a' : '1.5px solid #e5e7eb',
                                                background: form.occupation === o.value ? '#f0fdf4' : 'white', color: form.occupation === o.value ? '#15803d' : '#374151'
                                            }}>
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>



                            {isFarmer && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                                    <div>
                                        <label className="label">Crops Grown (select all that apply)</label>
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
                                </>
                            )}

                            {form.occupation === 'agricultural_laborer' && (
                                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: '.88rem' }}>
                                        <input type="checkbox" checked={!!form.has_job_card} onChange={e => set('has_job_card', e.target.checked)} style={{ accentColor: '#16a34a' }} />
                                        Have MGNREGA Job Card
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: Financial */}
                    {step === 2 && (
                        <div style={{ display: 'grid', gap: 20 }}>
                            <div>
                                <label className="label">Annual Household Income: ₹{form.annual_income.toLocaleString('en-IN')}</label>
                                <input type="range" min="0" max="1000000" step="5000" value={form.annual_income}
                                    onChange={e => set('annual_income', +e.target.value)}
                                    style={{ width: '100%', accentColor: '#16a34a' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: '#9ca3af', marginTop: 4 }}>
                                    <span>₹0</span><span>₹5L</span><span>₹10L+</span>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {[
                                    ['has_bank_account', 'Bank Account ✓'],
                                    ['has_aadhaar_doc', 'Aadhaar Card ✓'],
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
                        </div>
                    )}

                    {/* STEP 3: Documents */}
                    {step === 3 && (
                        <div style={{ display: 'grid', gap: 12 }}>
                            <p style={{ color: '#6b7280', fontSize: '.88rem', marginBottom: 6 }}>Check all documents you currently have:</p>
                            {[
                                ['has_aadhaar_doc', '🪪 Aadhaar Card'],
                                ['has_pan', '🗂️ PAN Card'],
                                ['has_land_record', '📋 Land Record / 7-12 Extract'],
                                ['has_income_certificate', '📄 Income Certificate'],
                                ['has_caste_certificate', '📜 Caste Certificate'],
                                ['has_bank_account', '🏦 Bank Passbook'],
                                ['has_ration_card', '🧾 Ration Card'],
                            ].map(([key, label]) => (
                                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 16px', background: form[key] ? '#f0fdf4' : 'white', border: form[key] ? '1.5px solid #16a34a' : '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '.88rem', fontWeight: 600 }}>
                                    <input type="checkbox" checked={!!form[key]} onChange={e => set(key, e.target.checked)} style={{ accentColor: '#16a34a', width: 18, height: 18 }} />
                                    {label}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                    <button className={`btn btn-secondary ${step === 0 ? 'btn' : ''}`} onClick={handleBack} disabled={step === 0}>
                        {t('back')}
                    </button>
                    {step < 3 ? (
                        <button className="btn btn-primary" onClick={handleNext}>{t('next')} →</button>
                    ) : (
                        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={saving}>
                            {saving ? 'Saving...' : '🔍 ' + t('submit')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
