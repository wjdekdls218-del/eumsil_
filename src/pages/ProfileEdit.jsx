import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera } from 'lucide-react'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { C, FONT } from '../theme'
import { useAuth } from '../context/AuthContext'
import { db, auth } from '../firebase'

const uploadToCloudinary = async (base64) => {
  const formData = new FormData()
  formData.append('file', base64)
  formData.append('upload_preset', 'ai5j2gjk')
  const res = await fetch('https://api.cloudinary.com/v1_1/dw4hwiskc/image/upload', {
    method: 'POST', body: formData,
  })
  if (!res.ok) throw new Error('이미지 업로드 실패')
  return (await res.json()).secure_url
}

export default function ProfileEdit() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [displayName, setDisplayName] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null) // base64 미리보기
  const [savedPhotoURL, setSavedPhotoURL] = useState('')  // 기존 저장된 URL
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Firestore에서 현재 프로필 로드
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data()
        setDisplayName(data.displayName || user.displayName || '')
        setSavedPhotoURL(data.photoURL || user.photoURL || '')
      } else {
        setDisplayName(user.displayName || '')
        setSavedPhotoURL(user.photoURL || '')
      }
      setLoading(false)
    })
  }, [user])

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!displayName.trim() || saving) return
    setSaving(true)
    try {
      let photoURL = savedPhotoURL
      if (photoPreview) {
        photoURL = await uploadToCloudinary(photoPreview)
      }

      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        photoURL,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL,
      })

      navigate(-1)
    } catch (e) {
      console.error('저장 실패:', e)
      setSaving(false)
    }
  }

  const isValid = displayName.trim() !== ''
  const avatarSrc = photoPreview || savedPhotoURL

  if (loading) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.gray, fontSize: 14 }}>불러오는 중...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>
      {/* 헤더 */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          프로필 수정
        </span>
        <button
          onClick={handleSave}
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
          {saving ? '저장 중...' : '저장'}
        </button>
      </header>

      <div style={{ padding: '36px 16px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

        {/* 프로필 사진 */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 96, height: 96, borderRadius: '50%',
              background: C.grayLight, overflow: 'hidden',
              border: `3px solid ${C.point}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, cursor: 'pointer',
            }}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="프로필"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                referrerPolicy="no-referrer"
              />
            ) : '🧶'}
          </div>

          {/* 카메라 아이콘 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 30, height: 30, borderRadius: '50%',
              background: C.point, border: `2px solid ${C.white}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Camera size={14} color={C.white} strokeWidth={2} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhotoSelect}
          />
        </div>

        {/* 닉네임 입력 */}
        <div style={{ width: '100%', background: C.white, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: C.gray }}>닉네임</p>
            <input
              type="text"
              placeholder="닉네임을 입력해주세요"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={20}
              style={{
                width: '100%', border: 'none', outline: 'none',
                background: 'transparent', fontFamily: 'inherit',
                fontSize: 15, color: C.text, letterSpacing: '-0.01em',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ padding: '0 16px 10px', textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: C.gray }}>{displayName.length}/20</span>
          </div>
        </div>

      </div>
    </div>
  )
}
