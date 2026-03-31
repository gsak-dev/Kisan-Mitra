/**
 * UserContext — Supabase auth, profile persistence, eligibility auto-run.
 * Now includes loadProfileFromSupabase for restoring state on login.
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { checkEligibilityAPI } from '../utils/api'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
    import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'
)

const UserContext = createContext(null)

export function UserProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(() => {
        try { return JSON.parse(localStorage.getItem('km_profile') || 'null') } catch { return null }
    })
    const [eligibilityResults, setEligibilityResults] = useState([])
    const [loading, setLoading] = useState(true)

    // Bootstrap: restore session from Supabase
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    const fetchEligibility = async (profile) => {
        try {
            setLoading(true)
            const res = await checkEligibilityAPI(profile)
            setEligibilityResults(res.data.results || [])
        } catch (err) {
            console.error("Eligibility API error:", err)
        } finally {
            setLoading(false)
        }
    }

    // Re-run eligibility when profile changes
    useEffect(() => {
        if (profile) {
            fetchEligibility(profile)
            localStorage.setItem('km_profile', JSON.stringify(profile))
        } else {
            setEligibilityResults([])
        }
    }, [profile])

    /** Load user profile from Supabase after login. Returns true if profile exists. */
    const loadProfileFromSupabase = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('profile, name, language_preference')
                .eq('id', userId)
                .single()
            if (error || !data) return false
            const profileData = data.profile || {}
            // Merge name into profile if profile.name is missing
            if (data.name && !profileData.name) profileData.name = data.name
            if (Object.keys(profileData).length < 3) return false  // profile not filled yet
            setProfile(profileData)
            return true
        } catch {
            // Fallback: check localStorage
            const cached = localStorage.getItem('km_profile')
            if (cached) { setProfile(JSON.parse(cached)); return true }
            return false
        }
    }

    const updateProfile = (newData) => setProfile(prev => ({ ...prev, ...newData }))

    const saveProfileToSupabase = async (profileData) => {
        if (user && user.id !== 'demo') {
            try {
                await supabase.from('users').upsert({
                    id: user.id,
                    email: user.email,
                    name: profileData.name,
                    language_preference: profileData.language || 'en',
                    profile: profileData,
                })
            } catch (e) { console.warn('Supabase save failed:', e.message) }
        }
        setProfile(profileData)
    }

    const setDemoProfile = (profileData) => {
        setUser({ id: 'demo', email: 'demo@kisanmitra.in' })
        setProfile(profileData)
    }

    const logout = async () => {
        if (user?.id !== 'demo') await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        localStorage.removeItem('km_profile')
        sessionStorage.removeItem('km_admin')
    }

    const eligibleSchemes = eligibilityResults.filter(r => r.eligible)
    const partialSchemes = eligibilityResults.filter(r => r.partially_eligible && !r.eligible)
    const totalBenefit = eligibleSchemes.reduce((s, r) => s + (r.benefit_amount || 0), 0)

    return (
        <UserContext.Provider value={{
            user, profile, loading, supabase,
            eligibilityResults, eligibleSchemes, partialSchemes, totalBenefit,
            updateProfile, saveProfileToSupabase, loadProfileFromSupabase,
            setDemoProfile, logout,
        }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => {
    const ctx = useContext(UserContext)
    if (!ctx) throw new Error('useUser must be used within UserProvider')
    return ctx
}
