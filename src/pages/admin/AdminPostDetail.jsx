import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Trash2 } from 'lucide-react'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { C, FONT } from '../../theme'
import { db } from '../../firebase'
import AdminNav from '../../components/AdminNav'

function ConfirmModal({ title, desc, confirmLabel, confirmColor, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 390, background: C.white, borderRadius: '20px 20px 0 0', padding: '28px 24px 36px', fontFamily: FONT }}>
        <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: C.text }}>{title}</p>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: C.gray }}>{desc}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', borderRadius: 999, border: `1.5px solid ${C.border}`, background: C.white, fontSize: 15, fontWeight: 600, color: C.text, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '13px', borderRadius: 999, border: 'none', background: confirmColor, fontSize: 15, fontWeight: 700, color: C.white, cursor: 'pointer', fontFamily: 'inherit' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null) // 'delete' | 'hide' | 'show'
  const [working, setWorking] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'posts', id))
      .then(snap => { if (snap.exists()) setPost({ id: snap.id, ...snap.data() }) })
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    setWorking(true)
    await deleteDoc(doc(db, 'posts', id))
    navigate('/admin/posts', { replace: true })
  }

  const handleToggleHidden = async () => {
    setWorking(true)
    const next = !post.hidden
    await updateDoc(doc(db, 'posts', id), { hidden: next })
    setPost(prev => ({ ...prev, hidden: next }))
    setConfirm(null)
    setWorking(false)
  }

  if (loading) return (
    <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
    </div>
  )

  if (!post) return (
    <div style={{ maxWidth: 390, margin: '0 auto', height: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 700 }}>게시글을 찾을 수 없어요</p>
      <button onClick={() => navigate(-1)} style={{ border: 'none', background: C.point, color: C.white, borderRadius: 999, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>뒤로가기</button>
    </div>
  )

  const date = post.createdAt?.toDate().toLocaleDateString('ko-KR') ?? ''

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, paddingBottom: 90 }}>
      <header style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/admin/posts')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', flex: 1 }}>게시글 상세</h1>
        {post.hidden && (
          <span style={{ fontSize: 11, fontWeight: 600, color: C.gray, background: C.grayLight, padding: '3px 10px', borderRadius: 999 }}>
            숨김
          </span>
        )}
      </header>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 이미지 */}
        {(post.imageUrl || post.image) && (
          <img
            src={post.imageUrl || post.image}
            alt={post.title}
            style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 16, display: 'block', opacity: post.hidden ? 0.5 : 1 }}
          />
        )}

        {/* 정보 */}
        <div style={{ background: C.white, borderRadius: 16, padding: '16px' }}>
          <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
            {post.title}
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: post.type === 'share' ? C.point : C.text }}>
            {post.type === 'share' ? '나눔' : `${Number(post.price ?? 0).toLocaleString()}원`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['작성자', post.nickname ?? '익명'],
              ['지역', post.region],
              ['카테고리', post.category],
              ['무게', post.weight ? `${post.weight}g` : null],
              ['등록일', date],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 12, color: C.gray, width: 52, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v}</span>
              </div>
            ))}
          </div>
          {post.description ? (
            <p style={{ margin: '12px 0 0', fontSize: 14, color: '#4A4A4A', lineHeight: 1.75 }}>{post.description}</p>
          ) : null}
        </div>

        {/* 관리 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => setConfirm(post.hidden ? 'show' : 'hide')}
            disabled={working}
            style={{
              padding: '14px', borderRadius: 14, border: `1.5px solid ${C.border}`,
              background: C.white, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 15, fontWeight: 700, color: C.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: working ? 0.6 : 1,
            }}
          >
            {post.hidden ? <Eye size={18} strokeWidth={1.8} /> : <EyeOff size={18} strokeWidth={1.8} />}
            {post.hidden ? '숨김 해제' : '숨김 처리'}
          </button>
          <button
            onClick={() => setConfirm('delete')}
            disabled={working}
            style={{
              padding: '14px', borderRadius: 14, border: 'none',
              background: '#E53E3E', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 15, fontWeight: 700, color: C.white,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: working ? 0.6 : 1,
            }}
          >
            <Trash2 size={18} strokeWidth={1.8} />
            게시글 삭제
          </button>
        </div>
      </div>

      {confirm === 'delete' && (
        <ConfirmModal
          title="게시글을 삭제할까요?"
          desc="삭제된 게시글은 복구할 수 없어요."
          confirmLabel="삭제하기"
          confirmColor="#E53E3E"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      {(confirm === 'hide' || confirm === 'show') && (
        <ConfirmModal
          title={confirm === 'hide' ? '게시글을 숨길까요?' : '숨김을 해제할까요?'}
          desc={confirm === 'hide' ? '숨김 처리된 게시글은 일반 사용자에게 보이지 않아요.' : '게시글이 다시 공개돼요.'}
          confirmLabel={confirm === 'hide' ? '숨김 처리' : '숨김 해제'}
          confirmColor={C.point}
          onConfirm={handleToggleHidden}
          onCancel={() => setConfirm(null)}
        />
      )}

      <AdminNav />
    </div>
  )
}
