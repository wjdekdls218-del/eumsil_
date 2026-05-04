import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { C, FONT } from '../../theme'
import { db } from '../../firebase'
import AdminNav from '../../components/AdminNav'

const TABS = ['전체', '신고된 글']

const fmtDate = (ts) =>
  ts?.toDate?.().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) ?? ''

export default function AdminCommunity() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [reportedIds, setReportedIds] = useState(new Set())
  const [tab, setTab] = useState('전체')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'community'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    getDocs(collection(db, 'reports')).then(snap => {
      const ids = new Set(
        snap.docs.filter(d => d.data().targetType === 'community').map(d => d.data().targetId)
      )
      setReportedIds(ids)
    })
  }, [])

  const filtered = tab === '신고된 글'
    ? questions.filter(q => reportedIds.has(q.id))
    : questions

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, paddingBottom: 90 }}>
      <header style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/admin')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>질문방 관리</h1>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.point }}>{filtered.length}개</span>
      </header>

      <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 16px', borderRadius: 999, border: 'none',
            fontSize: 13, fontWeight: tab === t ? 700 : 500,
            background: tab === t ? C.point : C.white,
            color: tab === t ? C.white : C.gray,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: C.gray, padding: '60px 0', fontSize: 14 }}>불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: C.gray, padding: '60px 0', fontSize: 14 }}>질문이 없어요.</p>
        ) : filtered.map(q => (
          <div
            key={q.id}
            onClick={() => navigate(`/admin/community/${q.id}`)}
            style={{ background: C.white, borderRadius: 14, padding: '14px 16px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, flex: 1, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
                {q.title}
              </p>
              {reportedIds.has(q.id) && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#E53E3E', background: '#FFE8E8', padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                  신고
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.gray }}>{q.author?.name ?? q.nickname ?? '익명'}</span>
              <span style={{ fontSize: 12, color: C.border }}>·</span>
              <span style={{ fontSize: 12, color: C.gray }}>답변 {q.answerCount ?? 0}개</span>
              <span style={{ fontSize: 12, color: C.border }}>·</span>
              <span style={{ fontSize: 12, color: C.gray }}>{fmtDate(q.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      <AdminNav />
    </div>
  )
}
