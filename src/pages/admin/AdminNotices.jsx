import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { C, FONT } from '../../theme'
import { db } from '../../firebase'
import AdminNav from '../../components/AdminNav'

function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 390, background: C.white, borderRadius: '20px 20px 0 0', padding: '28px 24px 36px', fontFamily: FONT }}>
        <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: C.text }}>공지를 삭제할까요?</p>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: C.gray }}>삭제된 공지는 복구할 수 없어요.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', borderRadius: 999, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 15, fontWeight: 600, color: C.text, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '13px', borderRadius: 999, border: 'none', background: '#E53E3E', fontSize: 15, fontWeight: 700, color: C.white, cursor: 'pointer', fontFamily: 'inherit' }}>삭제하기</button>
        </div>
      </div>
    </div>
  )
}

const fmtDate = (ts) =>
  ts?.toDate?.().toLocaleDateString('ko-KR', { year: '2-digit', month: 'short', day: 'numeric' }) ?? ''

export default function AdminNotices() {
  const navigate = useNavigate()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteDoc(doc(db, 'notices', deleteTarget))
    setDeleteTarget(null)
  }

  const sorted = [...notices].sort((a, b) => {
    if (a.isImportant && !b.isImportant) return -1
    if (!a.isImportant && b.isImportant) return 1
    return 0
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
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>공지사항 관리</h1>
        <button
          onClick={() => navigate('/admin/notices/write')}
          style={{
            border: 'none', background: C.point, borderRadius: 999,
            padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 700, color: C.white,
          }}
        >
          <Plus size={14} strokeWidth={2.5} />
          작성
        </button>
      </header>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: C.gray, padding: '60px 0', fontSize: 14 }}>불러오는 중...</p>
        ) : sorted.length === 0 ? (
          <p style={{ textAlign: 'center', color: C.gray, padding: '60px 0', fontSize: 14 }}>공지사항이 없어요.</p>
        ) : sorted.map(notice => (
          <div key={notice.id} style={{
            background: C.white, borderRadius: 14, padding: '14px 16px',
            borderLeft: notice.isImportant ? `4px solid #D97706` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {notice.isImportant && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '1px 7px', borderRadius: 999, flexShrink: 0 }}>
                      중요
                    </span>
                  )}
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {notice.title}
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: C.gray }}>{fmtDate(notice.createdAt)}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => navigate(`/admin/notices/${notice.id}`)}
                  style={{ border: 'none', background: '#EDF2FF', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}
                >
                  <Pencil size={13} color="#3B82F6" strokeWidth={2} />
                </button>
                <button
                  onClick={() => setDeleteTarget(notice.id)}
                  style={{ border: 'none', background: '#FFE8E8', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}
                >
                  <Trash2 size={13} color="#E53E3E" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <AdminNav />
    </div>
  )
}
