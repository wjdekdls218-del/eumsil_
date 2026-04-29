import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { db } from '../firebase'

const CATEGORIES = ['실', '도구', '도안', '자유게시판']

export default function CommunityWrite() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const isValid = category !== '' && title.trim() !== '' && body.trim() !== ''

  const handleSubmit = async () => {
    if (!isValid || saving) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'community'), {
        category,
        title: title.trim(),
        body: body.trim(),
        author: { id: 'me', name: '실뭉치' },
        likes: 0,
        answers: [],
        createdAt: serverTimestamp(),
      })
      navigate('/community')
    } catch (e) {
      console.error('저장 실패:', e)
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          질문 올리기
        </span>
        <button
          onClick={handleSubmit}
          disabled={!isValid || saving}
          style={{
            background: isValid && !saving ? C.point : C.border,
            color: isValid && !saving ? C.white : C.gray,
            border: 'none', borderRadius: 999,
            padding: '7px 20px',
            fontSize: 14, fontWeight: 700,
            cursor: isValid && !saving ? 'pointer' : 'default',
            fontFamily: 'inherit', letterSpacing: '-0.01em',
            transition: 'background 0.15s',
          }}
        >
          {saving ? '올리는 중...' : '올리기'}
        </button>
      </header>

      {/* Form */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Category */}
        <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: C.gray }}>카테고리 *</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: '7px 16px', borderRadius: 999,
                  border: category === c ? 'none' : `1.5px solid ${C.border}`,
                  background: category === c ? C.point : C.white,
                  color: category === c ? C.white : C.text,
                  fontSize: 13, fontWeight: category === c ? 700 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Title + Body */}
        <div style={{ background: C.white, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.gray }}>제목 *</p>
            <input
              type="text"
              placeholder="질문 제목을 입력해주세요"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: '100%', border: 'none', outline: 'none',
                background: 'transparent', fontFamily: 'inherit',
                fontSize: 14, color: C.text, letterSpacing: '-0.01em',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ height: 1, background: C.border, margin: '0 16px' }} />

          <div style={{ padding: '14px 16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.gray }}>내용 *</p>
            <textarea
              placeholder="궁금한 점을 자세히 적어주세요"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={7}
              style={{
                width: '100%', border: 'none', outline: 'none',
                background: 'transparent', fontFamily: 'inherit',
                fontSize: 14, color: C.text, letterSpacing: '-0.01em',
                lineHeight: 1.7, resize: 'none', display: 'block',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
