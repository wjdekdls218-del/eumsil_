import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined=로딩, null=미로그인
  const [banInfo, setBanInfo] = useState({ isBanned: false, isPermanent: false, until: null })

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null)
        setBanInfo({ isBanned: false, isPermanent: false, until: null })
        return
      }
      setUser(u)
      try {
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) {
          const banUntil = snap.data().banUntil
          if (!banUntil) {
            setBanInfo({ isBanned: false, isPermanent: false, until: null })
          } else if (banUntil === 'permanent') {
            setBanInfo({ isBanned: true, isPermanent: true, until: null })
          } else {
            const until = banUntil.toDate ? banUntil.toDate() : new Date(banUntil)
            setBanInfo({ isBanned: until > new Date(), isPermanent: false, until })
          }
        }
      } catch {}
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, banInfo }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
