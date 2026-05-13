import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { db } from '../firebase'

const fmtDate = (ts) =>
  ts?.toDate?.().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) ?? ''

export default function Notice() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(searchParams.get('id') ?? null)

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const sorted = [...notices].sort((a, b) => {
    if (a.isImportant && !b.isImportant) return -1
    if (!a.isImportant && b.isImportant) return 1
    return 0
  })

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px', borderBottom: `1px solid ${C.border}`,
        background: C.bg, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>공지사항</span>
      </header>

      <div style={{ padding: '16px 16px 60px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: C.gray, padding: '60px 0', fontSize: 14 }}>불러오는 중...</p>
        ) : sorted.length === 0 ? (
          <p style={{ textAlign: 'center', color: C.gray, padding: '60px 0', fontSize: 14 }}>공지사항이 없어요.</p>
        ) : sorted.map(notice => {
          const open = expanded === notice.id
          return (
            <div
              key={notice.id}
              style={{
                background: C.white, borderRadius: 16,
                overflow: 'hidden',
                borderLeft: notice.isImportant ? `4px solid #D97706` : 'none',
              }}
            >
              <button
                onClick={() => setExpanded(open ? null : notice.id)}
                style={{
                  width: '100%', padding: '18px 20px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                {notice.isImportant && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#D97706',
                    background: '#FEF3C7', padding: '2px 8px', borderRadius: 999,
                    flexShrink: 0,
                  }}>
                    중요
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.4, textAlign: 'left' }}>
                    {notice.title}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.gray, textAlign: 'left' }}>
                    {fmtDate(notice.createdAt)}
                  </p>
                </div>
                {open
                  ? <ChevronUp size={16} color={C.gray} strokeWidth={2} style={{ flexShrink: 0 }} />
                  : <ChevronDown size={16} color={C.gray} strokeWidth={2} style={{ flexShrink: 0 }} />
                }
              </button>

              {open && (
                <div style={{ padding: '0 20px 20px' }}>
                  <div style={{ height: 1, background: C.border, marginBottom: 16 }} />
                  <p style={{
                    margin: 0, fontSize: 14, color: '#4A4A4A',
                    lineHeight: 1.85, letterSpacing: '-0.01em',
                    whiteSpace: 'pre-line',
                  }}>
                    {notice.content || notice.body}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
