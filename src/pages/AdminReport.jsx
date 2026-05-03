import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { db } from '../firebase'

const SANCTIONS = [
  { key: 'warning',   label: '경고',      desc: '경고 조치' },
  { key: 'ban7',      label: '7일 정지',  desc: '7일 이용 정지' },
  { key: 'ban30',     label: '30일 정지', desc: '30일 이용 정지' },
  { key: 'permanent', label: '영구 정지', desc: '영구 이용 정지', danger: true },
  { key: 'none',      label: '기각',      desc: '조치 없음', muted: true },
]

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
  return ts.toDate().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function AdminReport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'reports', id))
      .then(snap => { if (snap.exists()) setReport({ id: snap.id, ...snap.data() }) })
      .finally(() => setLoading(false))
  }, [id])

  const handleSanction = async (sanctionKey) => {
    if (applying || !report) return
    setApplying(true)
    try {
      if (sanctionKey !== 'none' && sanctionKey !== 'warning' && report.reportedId) {
        let banUntil
        if (sanctionKey === 'permanent') {
          banUntil = 'permanent'
        } else {
          const d = new Date()
          d.setDate(d.getDate() + (sanctionKey === 'ban7' ? 7 : 30))
          banUntil = d
        }
        await updateDoc(doc(db, 'users', report.reportedId), { banUntil })
      }

      await updateDoc(doc(db, 'reports', id), {
        status: 'resolved',
        sanctionType: sanctionKey,
        resolvedAt: serverTimestamp(),
      })
      setReport(prev => ({ ...prev, status: 'resolved', sanctionType: sanctionKey }))
    } catch (e) {
      console.error('[AdminReport] 제재 실패:', e)
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 700 }}>신고를 찾을 수 없어요</p>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: C.point, color: C.white, borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          뒤로가기
        </button>
      </div>
    )
  }

  const st = STATUS_MAP[report.status] ?? STATUS_MAP.pending

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
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>신고 상세</h1>
      </header>

      <div style={{ padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: C.white, borderRadius: 14, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 999 }}>
              {st.label}
            </span>
            <span style={{ fontSize: 12, color: C.gray }}>{formatDate(report.createdAt)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['대상 유형', TYPE_MAP[report.targetType] ?? report.targetType],
              ['신고 이유', report.reason],
              ['피신고자 UID', report.reportedId],
              ['신고자 UID', report.reporterId],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 12, color: C.gray, width: 70, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text, wordBreak: 'break-all' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {report.description ? (
          <div style={{ background: C.white, borderRadius: 14, padding: '16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.gray }}>상세 설명</p>
            <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.7 }}>{report.description}</p>
          </div>
        ) : null}

        {report.evidenceUrls?.length > 0 && (
          <div style={{ background: C.white, borderRadius: 14, padding: '16px' }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: C.gray }}>증거 사진</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {report.evidenceUrls.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover' }} />
              ))}
            </div>
          </div>
        )}

        {report.status === 'resolved' ? (
          <div style={{ background: C.white, borderRadius: 14, padding: '16px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: C.text }}>처리 완료</p>
            <p style={{ margin: 0, fontSize: 13, color: C.gray }}>
              {SANCTIONS.find(s => s.key === report.sanctionType)?.label ?? '처리됨'}
            </p>
          </div>
        ) : (
          <div style={{ background: C.white, borderRadius: 14, padding: '16px' }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: C.text }}>제재 조치</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SANCTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => handleSanction(s.key)}
                  disabled={applying}
                  style={{
                    padding: '13px 16px', borderRadius: 12,
                    border: `1.5px solid ${s.danger ? '#E53E3E' : s.muted ? C.border : C.point}`,
                    background: C.white,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: applying ? 'default' : 'pointer', fontFamily: 'inherit',
                    opacity: applying ? 0.6 : 1, transition: 'opacity 0.15s',
                  }}
                >
                  <span style={{
                    fontSize: 14, fontWeight: 700,
                    color: s.danger ? '#E53E3E' : s.muted ? C.gray : C.text,
                  }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: 12, color: C.gray }}>{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
