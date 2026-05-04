import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { C, FONT } from '../../theme'
import { db } from '../../firebase'
import AdminNav from '../../components/AdminNav'

const STATUS = {
  pending:  { label: '처리중',   bg: '#FFF3CD', color: '#856404' },
  reviewed: { label: '검토중',   bg: '#D1ECF1', color: '#0C5460' },
  resolved: { label: '처리완료', bg: '#D4EDDA', color: '#155724' },
}
const TYPE = { product: '상품', community: '커뮤니티', chat: '채팅' }
const TABS = ['전체', '처리중', '처리완료']

const fmtDate = (ts) =>
  ts?.toDate?.().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) ?? ''

export default function AdminReports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [tab, setTab] = useState('전체')
  const [userMap, setUserMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, async snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setReports(list)
      setLoading(false)

      const uids = new Set()
      list.forEach(r => { if (r.reporterId) uids.add(r.reporterId); if (r.reportedId) uids.add(r.reportedId) })
      const pairs = await Promise.all(
        [...uids].map(uid =>
          getDoc(doc(db, 'users', uid)).then(s => [uid, s.exists() ? (s.data().displayName || uid.slice(0, 8)) : uid.slice(0, 8)])
        )
      )
      setUserMap(Object.fromEntries(pairs))
    })
  }, [])

  const filtered = reports.filter(r => {
    if (tab === '처리중')   return r.status === 'pending' || r.status === 'reviewed'
    if (tab === '처리완료') return r.status === 'resolved'
    return true
  })

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
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>신고 관리</h1>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.point }}>{filtered.length}건</span>
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
          <p style={{ textAlign: 'center', color: C.gray, padding: '60px 0', fontSize: 14 }}>신고가 없어요.</p>
        ) : filtered.map(r => {
          const st = STATUS[r.status] ?? STATUS.pending
          const reporterName = userMap[r.reporterId] ?? '알 수 없음'
          const reportedName = userMap[r.reportedId] ?? '알 수 없음'
          return (
            <div
              key={r.id}
              onClick={() => navigate(`/admin/reports/${r.id}`)}
              style={{ background: C.white, borderRadius: 14, padding: '14px 16px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, background: '#F0EBE5', color: C.gray, padding: '2px 8px', borderRadius: 999 }}>
                    {TYPE[r.targetType] ?? r.targetType}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, padding: '2px 8px', borderRadius: 999 }}>
                    {st.label}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: C.gray }}>{fmtDate(r.createdAt)}</span>
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: C.gray }}>
                <span style={{ fontWeight: 700, color: C.text }}>{reporterName}</span>
                <span style={{ margin: '0 6px', color: C.border }}>→</span>
                <span style={{ fontWeight: 700, color: '#E53E3E' }}>{reportedName}</span>
              </p>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.text }}>{r.reason}</p>
              {r.description ? (
                <p style={{ margin: 0, fontSize: 12, color: C.gray, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.description}
                </p>
              ) : null}
              {r.evidenceUrls?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {r.evidenceUrls.slice(0, 3).map((url, i) => (
                    <img key={i} src={url} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <AdminNav />
    </div>
  )
}
