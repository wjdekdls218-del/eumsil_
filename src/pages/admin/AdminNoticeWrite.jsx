import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore'
import { C, FONT } from '../../theme'
import { db } from '../../firebase'
import AdminNav from '../../components/AdminNav'

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 28, borderRadius: 999, border: 'none',
        background: value ? '#D97706' : C.border,
        cursor: 'pointer', position: 'relative', flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 4,
        left: value ? 23 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: C.white,
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

export default function AdminNoticeWrite() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    getDoc(doc(db, 'notices', id)).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setTitle(d.title ?? '')
        setBody(d.body ?? '')
        setIsImportant(d.isImportant ?? false)
      }
      setLoading(false)
    })
  }, [id, isEdit])

  const isValid = title.trim() !== '' && body.trim() !== ''

  const handleSave = async () => {
    if (!isValid || saving) return
    setSaving(true)
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'notices', id), {
          title: title.trim(),
          body: body.trim(),
          isImportant,
          updatedAt: serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, 'notices'), {
          title: title.trim(),
          body: body.trim(),
          isImportant,
          createdAt: serverTimestamp(),
        })
      }
      navigate('/admin/notices', { replace: true })
    } catch (e) {
      console.error('[AdminNoticeWrite] 저장 실패:', e)
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, paddingBottom: 90 }}>
      <header style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/admin/notices')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>
          {isEdit ? '공지 수정' : '공지 작성'}
        </h1>
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          style={{
            border: 'none', borderRadius: 999,
            padding: '8px 18px', cursor: isValid && !saving ? 'pointer' : 'default',
            background: isValid && !saving ? C.point : C.border,
            color: isValid && !saving ? C.white : C.gray,
            fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </header>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 제목 */}
        <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 8 }}>제목 *</label>
          <input
            type="text"
            placeholder="공지 제목을 입력해주세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%', border: 'none', outline: 'none',
              background: 'transparent', fontFamily: 'inherit',
              fontSize: 15, fontWeight: 600, color: C.text,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 내용 */}
        <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 8 }}>내용 *</label>
          <textarea
            placeholder="공지 내용을 입력해주세요"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={10}
            style={{
              width: '100%', border: 'none', outline: 'none',
              background: 'transparent', fontFamily: 'inherit',
              fontSize: 14, color: C.text, lineHeight: 1.8,
              resize: 'none', letterSpacing: '-0.01em',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 중요 공지 */}
        <div style={{ background: C.white, borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.text }}>중요 공지로 설정</p>
            <p style={{ margin: 0, fontSize: 12, color: C.gray }}>중요 공지는 목록 최상단에 표시돼요</p>
          </div>
          <Toggle value={isImportant} onChange={setIsImportant} />
        </div>
      </div>

      <AdminNav />
    </div>
  )
}
