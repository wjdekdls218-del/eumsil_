import { useState } from 'react'
import { X, Camera } from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { C, FONT } from '../theme'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const REASONS = ['스팸/도배', '욕설/혐오 발언', '사기/허위 정보', '개인정보 노출', '기타']

export default function ReportModal({ targetType, targetId, reportedId, onClose }) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleImageAdd = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setImages(prev => [...prev, { preview: ev.target.result }])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const uploadToCloudinary = async (base64) => {
    const fd = new FormData()
    fd.append('file', base64)
    fd.append('upload_preset', 'ai5j2gjk')
    const res = await fetch('https://api.cloudinary.com/v1_1/dw4hwiskc/image/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error('upload failed')
    return (await res.json()).secure_url
  }

  const handleSubmit = async () => {
    if (!reason || uploading) return
    setUploading(true)
    try {
      const evidenceUrls = await Promise.all(images.map(img => uploadToCloudinary(img.preview)))
      await addDoc(collection(db, 'reports'), {
        reporterId: user?.uid ?? '',
        reportedId: reportedId ?? '',
        reason,
        description: description.trim(),
        evidenceUrls,
        targetType,
        targetId,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setSubmitted(true)
    } catch (e) {
      console.error('[ReportModal] 신고 실패:', e)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 390,
        background: C.white, borderRadius: '20px 20px 0 0',
        padding: '24px 20px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        fontFamily: FONT,
        maxHeight: '90dvh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
            {submitted ? '신고 완료' : '신고하기'}
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={20} color={C.gray} strokeWidth={1.8} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: C.text }}>신고가 접수되었어요</p>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: C.gray, lineHeight: 1.6 }}>검토 후 조치하겠습니다.</p>
            <button onClick={onClose} style={{
              width: '100%', padding: '14px', borderRadius: 999,
              background: C.point, color: C.white, border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              확인
            </button>
          </div>
        ) : (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: C.gray }}>신고 이유</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  style={{
                    padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                    border: reason === r ? `1.5px solid ${C.point}` : `1.5px solid ${C.border}`,
                    background: reason === r ? `${C.point}10` : C.white,
                    fontSize: 14, fontWeight: reason === r ? 600 : 400,
                    color: reason === r ? C.point : C.text,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: C.gray }}>상세 설명 (선택)</p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="신고 내용을 자세히 적어주세요"
              rows={3}
              style={{
                width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 12,
                padding: '12px', fontSize: 13, fontFamily: 'inherit',
                background: C.bg, color: C.text, outline: 'none',
                resize: 'none', letterSpacing: '-0.01em', boxSizing: 'border-box',
                marginBottom: 16,
              }}
            />

            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: C.gray }}>
              증거 사진 (선택, 최대 3장)
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                  <img src={img.preview} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }} />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 18, height: 18, borderRadius: 999,
                      background: C.text, border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={10} color={C.white} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label style={{
                  width: 72, height: 72, borderRadius: 10,
                  border: `2px dashed ${C.border}`, background: '#FAF7F3',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  cursor: 'pointer', flexShrink: 0,
                }}>
                  <Camera size={18} color={C.gray} strokeWidth={1.8} />
                  <span style={{ fontSize: 10, color: C.gray, fontFamily: 'inherit' }}>사진 추가</span>
                  <input type="file" accept="image/*" hidden onChange={handleImageAdd} />
                </label>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!reason || uploading}
              style={{
                width: '100%', padding: '14px', borderRadius: 999,
                background: reason && !uploading ? '#E53E3E' : C.border,
                color: reason && !uploading ? C.white : C.gray,
                border: 'none', fontSize: 15, fontWeight: 700,
                cursor: reason && !uploading ? 'pointer' : 'default',
                fontFamily: 'inherit', letterSpacing: '-0.01em', transition: 'background 0.15s',
              }}
            >
              {uploading ? '신고 중...' : '신고하기'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
