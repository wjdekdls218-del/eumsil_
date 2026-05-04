import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import {
  doc, getDoc, deleteDoc, updateDoc, increment,
  collection, query, orderBy, onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import { C, FONT } from '../../theme'
import { db } from '../../firebase'
import AdminNav from '../../components/AdminNav'

function ConfirmModal({ title, desc, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 390, background: C.white, borderRadius: '20px 20px 0 0', padding: '28px 24px 36px', fontFamily: FONT }}>
        <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: C.text }}>{title}</p>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: C.gray }}>{desc}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', borderRadius: 999, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 15, fontWeight: 600, color: C.text, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '13px', borderRadius: 999, border: 'none', background: '#E53E3E', fontSize: 15, fontWeight: 700, color: C.white, cursor: 'pointer', fontFamily: 'inherit' }}>삭제하기</button>
        </div>
      </div>
    </div>
  )
}

const fmtDate = (ts) => {
  if (!ts?.toDate) return ''
  const diff = Date.now() - ts.toDate().getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export default function AdminCommunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null) // { type: 'question' } | { type: 'answer', answerId }
  const [working, setWorking] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'community', id))
      .then(snap => { if (snap.exists()) setQuestion({ id: snap.id, ...snap.data() }) })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const q = query(collection(db, 'community', id, 'answers'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => setAnswers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [id])

  const handleDeleteQuestion = async () => {
    setWorking(true)
    try {
      const batch = writeBatch(db)
      answers.forEach(a => batch.delete(doc(db, 'community', id, 'answers', a.id)))
      batch.delete(doc(db, 'community', id))
      await batch.commit()
      navigate('/admin/community', { replace: true })
    } finally {
      setWorking(false)
    }
  }

  const handleDeleteAnswer = async (answerId) => {
    setWorking(true)
    try {
      await deleteDoc(doc(db, 'community', id, 'answers', answerId))
      await updateDoc(doc(db, 'community', id), { answerCount: increment(-1) })
    } finally {
      setWorking(false)
      setConfirm(null)
    }
  }

  if (loading) return (
    <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
    </div>
  )

  if (!question) return (
    <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 700 }}>질문을 찾을 수 없어요</p>
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: C.point, color: C.white, borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>뒤로가기</button>
    </div>
  )

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, paddingBottom: 90 }}>
      <header style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/admin/community')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>질문 상세</h1>
      </header>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 질문 */}
        <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.4 }}>
                {question.title}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.gray }}>
                {question.author?.name ?? question.nickname ?? '익명'} · {fmtDate(question.createdAt)}
              </p>
            </div>
            <button
              onClick={() => setConfirm({ type: 'question' })}
              style={{ border: 'none', background: '#FFE8E8', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', flexShrink: 0, marginLeft: 10 }}
            >
              <Trash2 size={14} color="#E53E3E" strokeWidth={2} />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.75 }}>{question.body}</p>
        </div>

        {/* 답변 */}
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: C.gray }}>답변 {answers.length}개</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {answers.length === 0 ? (
              <p style={{ textAlign: 'center', color: C.gray, fontSize: 13, padding: '20px 0' }}>답변이 없어요.</p>
            ) : answers.map(a => (
              <div key={a.id} style={{ background: C.white, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.nickname ?? '익명'}</span>
                    <span style={{ fontSize: 11, color: C.gray, marginLeft: 6 }}>{fmtDate(a.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => setConfirm({ type: 'answer', answerId: a.id })}
                    style={{ border: 'none', background: '#FFE8E8', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Trash2 size={13} color="#E53E3E" strokeWidth={2} />
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.7 }}>{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {confirm?.type === 'question' && (
        <ConfirmModal
          title="질문을 삭제할까요?"
          desc="답변까지 모두 삭제돼요."
          onConfirm={handleDeleteQuestion}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'answer' && (
        <ConfirmModal
          title="답변을 삭제할까요?"
          desc="삭제된 답변은 복구할 수 없어요."
          onConfirm={() => handleDeleteAnswer(confirm.answerId)}
          onCancel={() => setConfirm(null)}
        />
      )}

      <AdminNav />
    </div>
  )
}
