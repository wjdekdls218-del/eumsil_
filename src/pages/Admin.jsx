import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { ArrowLeft } from 'lucide-react'
import { C, FONT } from '../theme'
import { db } from '../firebase'

const TABS = ['전체', '처리중', '처리완료']

const STATUS_MAP = {
  pending:  { label: '처리중',   bg: '#FFF3CD', color: '#856404' },
  reviewed: { label: '검토중',   bg: '#D1ECF1', color: '#0C5460' },
  resolved: { label: '처리완료', bg: '#D4EDDA', color: '#155724' },
}

const TYPE_MAP = {
  product:   '상품',
  community: '커뮤니티',
  chat:      '채팅',
}

const formatDate = (ts) => {
  if (!ts?.toDate) return ''
  return ts.toDate().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function Admin() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [tab, setTab] = useState('전체')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  const filtered = reports.filter(r => {
    if (tab === '처리중')   return r.status === 'pending' || r.status === 'reviewed'
    if (tab === '처리완료') return r.status === 'resolved'
    return true
  })

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      <header style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>
          관리자 페이지
        </h1>
        <span style={{
          fontSize: 11, fontWeight: 700, color: C.white,
          background: C.point, borderRadius: 999, padding: '3px 10px',
        }}>
          ADMIN
        </span>
      </header>

      <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 16px', borderRadius: 999, border: 'none',
              fontSize: 13, fontWeight: tab === t ? 700 : 500,
              background: tab === t ? C.point : C.white,
              color: tab === t ? C.white : C.gray,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 16px 80px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: C.gray, fontSize: 14 }}>
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: C.gray, fontSize: 14 }}>
            신고가 없어요.
          </div>
        ) : filtered.map(report => {
          const st = STATUS_MAP[report.status] ?? STATUS_MAP.pending
          return (
            <div
              key={report.id}
              onClick={() => navigate(`/admin/report/${report.id}`)}
              style={{ background: C.white, borderRadius: 14, padding: '14px 16px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    background: '#F0EBE5', color: C.gray,
                    padding: '2px 8px', borderRadius: 999,
                  }}>
                    {TYPE_MAP[report.targetType] ?? report.targetType}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    background: st.bg, color: st.color,
                    padding: '2px 8px', borderRadius: 999,
                  }}>
                    {st.label}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: C.gray }}>{formatDate(report.createdAt)}</span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.text }}>
                {report.reason}
              </p>
              {report.description ? (
                <p style={{
                  margin: 0, fontSize: 12, color: C.gray,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {report.description}
                </p>
              ) : null}
              {report.evidenceUrls?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {report.evidenceUrls.slice(0, 3).map((url, i) => (
                    <img key={i} src={url} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
