import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, MessageCircle } from 'lucide-react'
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { C, FONT } from '../theme'

const formatTime = (ts) => {
  if (!ts?.toDate) return ''
  const diff = Date.now() - ts.toDate().getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export default function Notifications() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid)
    )
    return onSnapshot(q, snap => {
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const tA = a.createdAt?.toDate?.()?.getTime() ?? 0
          const tB = b.createdAt?.toDate?.()?.getTime() ?? 0
          return tB - tA
        })
      setNotifications(all)
    })
  }, [user?.uid])

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await updateDoc(doc(db, 'notifications', notif.id), { isRead: true })
    }
    if (notif.type === 'chat') {
      navigate(`/chat/${notif.relatedId}`)
    } else if (notif.type === 'answer') {
      navigate(`/community/${notif.relatedId}`)
    }
  }

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead)
    if (!unread.length) return
    const batch = writeBatch(db)
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { isRead: true }))
    await batch.commit()
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px', borderBottom: `1px solid ${C.border}`,
        background: C.bg, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>알림</span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, color: C.point, fontWeight: 600, padding: 0,
            }}
          >
            모두 읽음
          </button>
        )}
      </header>

      <div style={{ padding: '12px 16px 60px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.gray, fontSize: 14 }}>
            알림이 없어요
          </div>
        ) : notifications.map(notif => (
          <div
            key={notif.id}
            onClick={() => handleClick(notif)}
            style={{
              background: C.white, borderRadius: 16,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
              overflow: 'hidden', position: 'relative',
            }}
          >
            {/* 읽지 않은 포인트 바 */}
            {!notif.isRead && (
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                background: C.point,
              }} />
            )}

            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px', paddingLeft: !notif.isRead ? 20 : 16,
              width: '100%',
            }}>
              {/* 타입 아이콘 */}
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: notif.type === 'chat' ? '#E8F8F7' : '#EEEEFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {notif.type === 'chat' ? (
                  <MessageSquare size={18} color={C.point} strokeWidth={1.8} />
                ) : (
                  <MessageCircle size={18} color="#6366F1" strokeWidth={1.8} />
                )}
              </div>

              {/* 메시지 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: '0 0 4px', fontSize: 14, lineHeight: 1.4,
                  fontWeight: notif.isRead ? 400 : 600,
                  color: C.text, letterSpacing: '-0.01em',
                }}>
                  {notif.message}
                </p>
                <span style={{ fontSize: 11, color: C.gray }}>
                  {formatTime(notif.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
