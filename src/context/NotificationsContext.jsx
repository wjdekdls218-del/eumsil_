import { createContext, useContext, useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const NotificationsContext = createContext({ unreadCount: 0, chatCount: 0, answerCount: 0 })

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [unread, setUnread] = useState([])

  useEffect(() => {
    if (!user) { setUnread([]); return }
    // isRead==false 두 equality 조합은 복합 인덱스 필요 → uid만 필터 후 클라이언트 필터
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid)
    )
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setUnread(all.filter(n => !n.isRead))
    }, err => {
      console.error('[Notifications] 구독 실패:', err)
    })
  }, [user?.uid])

  const chatCount   = unread.filter(n => n.type === 'chat').length
  const answerCount = unread.filter(n => n.type === 'answer').length
  const unreadCount = unread.length

  return (
    <NotificationsContext.Provider value={{ unreadCount, chatCount, answerCount }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
