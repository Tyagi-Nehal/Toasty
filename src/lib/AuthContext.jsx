import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { getAccount, syncAccountFromSupabaseUser, clearAccount } from './mockAuth.js'

const AuthContext = createContext({ account: null, loading: true })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ account: getAccount(), loading: true })

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) await syncAccountFromSupabaseUser(session.user)
      if (!cancelled) setState({ account: getAccount(), loading: false })
    })

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        clearAccount()
        setState({ account: null, loading: false })
        return
      }
      if (session) {
        await syncAccountFromSupabaseUser(session.user)
        setState({ account: getAccount(), loading: false })
      }
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
