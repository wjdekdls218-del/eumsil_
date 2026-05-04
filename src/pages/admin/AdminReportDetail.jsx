import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { C, FONT } from '../../theme'
import { db } from '../../firebase'
import AdminNav from '../../components/AdminNav'

const SANCTIONS = [
  { key: 'warning',   label: '경고',      desc: '경고 조치',        color: '#D97706' },
  { key: 'ban7',      label: '7일 정지',  desc: '7일 이용 정지',    color: C.point },
  { key: 'ban30',     label: '30일 정지', desc: '30일 이용 정지',   color: '#7C3AED' },
  { key: 'permanent', label: '영구 정지', desc: '영구 이용 정지',    color: '#E53E3E' },
  { key: 'none',      label: '기각',      desc: '조치 없음',         color: C.gray },
]

const STATUS = {
  pending:  { label: '처리중',   bg: '#FFF3CD', color: '#856404' },
  reviewed: { label: '검토중',   bg: '#D1ECF1', color: '#0C5460' },
  resolved: { label: '처리완료', bg: '#D4EDDA', color: '#155724' },
}

const TYPE = { product: '상품', community: '커뮤니티', chat: '채팅' }

const fmtDate = (ts) =>
  ts?.toDate?.().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) ?? ''

export default function AdminReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [reporter, setReporter] = useState(null)
  const [reported, setReported] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'reports', id))
      if (!snap.exists()) { setLoading(false); return }
      const data = { id: snap.id, ...snap.data() }
      setReport(data)

      const [rSnap, dSnap] = await Promise.all([
        data.reporterId ? getDoc(doc(db, 'users', data.reporterId)) : Promise.resolve(null),
        data.reportedId ? getDoc(doc(db, 'users', data.reportedId)) : Promise.resolve(null),
      ])
      if (rSnap?.exists()) setReporter(rSnap.data())
      if (dSnap?.exists()) setReported(dSnap.data())
      setLoading(false)
    }
    load()
  }, [id])

  const handleSanction = async (key) => {
    if (applying || !report) return
    setApplying(true)
    try {
      if (key !== 'none' && key !== 'warning' && report.reportedId) {
        let banUntil
        if (key === 'permanent') {
          banUntil = 'permanent'
        } else {
          const d = new Date()
          d.setDate(d.getDate() + (key === 'ban7' ? 7 : 30))
          banUntil = d
        }
        await updateDoc(doc(db, 'users', report.reportedId), { banUntil })
      }
      await updateDoc(doc(db, 'reports', id), {
        status: 'resolved',
        sanctionType: key,
        resolvedAt: serverTimestamp(),
      })
      setReport(prev => ({ ...prev, status: 'resolved', sanctionType: key }))
    } catch (e) {
      console.error('[AdminReportDetail] 제재 실패:', e)
    } finally {
      setApplying(false)
    }
  }

  if (loading) return (
    <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
    </div>
  )

  if (!report) return (
    <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 700 }}>신고를 찾을 수 없어요</p>
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: C.point, color: C.white, borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>뒤로가기</button>
    </div>
  )

  const st = STATUS[report.status] ?? STATUS.pending

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, paddingBottom: 90 }}>
      <header style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/admin/reports')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>신고 상세</h1>
        <span style={{ fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 999 }}>
          {st.label}
        </span>
      </header>

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 신고자 → 피신고자 */}
        <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: C.gray }}>신고 정보</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <UserChip name={reporter?.displayName ?? report.reporterId?.slice(0, 8) ?? '?'} photo={reporter?.photoURL} label="신고자" />
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.gray, flexShrink: 0 }}>신고</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <UserChip name={reported?.displayName ?? report.reportedId?.slice(0, 8) ?? '?'} photo={reported?.photoURL} label="피신고자" danger />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['대상', TYPE[report.targetType] ?? report.targetType],
              ['신고 이유', report.reason],
              ['신고 일시', fmtDate(report.createdAt)],
            ].map(([k, v]) => v ? (
              <div key={k} style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 12, color: C.gray, width: 56, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v}</span>
              </div>
            ) : null)}
          </div>
        </div>

        {/* 상세 설명 */}
        {report.description ? (
          <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.gray }}>상세 설명</p>
            <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.75 }}>{report.description}</p>
          </div>
        ) : null}

        {/* 증거 사진 */}
        {report.evidenceUrls?.length > 0 && (
          <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: C.gray }}>증거 사진</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {report.evidenceUrls.map((url, i) => (
                <img
                  key={i} src={url} alt=""
                  onClick={() => setLightbox(url)}
                  style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 제재 */}
        {report.status === 'resolved' ? (
          <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: C.text }}>처리 완료</p>
            <p style={{ margin: 0, fontSize: 13, color: C.gray }}>
              {SANCTIONS.find(s => s.key === report.sanctionType)?.label ?? '처리됨'}
            </p>
          </div>
        ) : (
          <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: C.text }}>제재 조치</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SANCTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => handleSanction(s.key)}
                  disabled={applying}
                  style={{
                    padding: '13px 16px', borderRadius: 12,
                    border: `1.5px solid ${s.color}`,
                    background: C.white,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: applying ? 'default' : 'pointer', fontFamily: 'inherit',
                    opacity: applying ? 0.6 : 1, transition: 'opacity 0.15s',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.label}</span>
                  <span style={{ fontSize: 12, color: C.gray }}>{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 사진 라이트박스 */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'transparent', cursor: 'pointer', padding: 8 }}>
            <X size={28} color="white" strokeWidth={2} />
          </button>
          <img src={lightbox} alt="" style={{ maxWidth: '90%', maxHeight: '80dvh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}

      <AdminNav />
    </div>
  )
}

function UserChip({ name, photo, label, danger }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: danger ? '#FFE8E8' : C.grayLight,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: danger ? '2px solid #E53E3E' : 'none',
      }}>
        {photo ? (
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
        ) : (
          <span style={{ fontSize: 16, fontWeight: 700, color: danger ? '#E53E3E' : C.gray }}>
            {name.charAt(0)}
          </span>
        )}
      </div>
      <span style={{ fontSize: 11, color: danger ? '#E53E3E' : C.text, fontWeight: 600, maxWidth: 64, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ fontSize: 10, color: C.gray }}>{label}</span>
    </div>
  )
}
