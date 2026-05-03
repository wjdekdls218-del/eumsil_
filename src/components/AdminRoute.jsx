import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(undefined)

  useEffect(() => {
    if (user === undefined) return
    if (!user) { setIsAdmin(false); return }
    getDoc(doc(db, 'users', user.uid))
      .then(snap => setIsAdmin(snap.exists() && snap.data().isAdmin === true))
      .catch(() => setIsAdmin(false))
  }, [user])

  if (user === undefined || isAdmin === undefined) return null
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
