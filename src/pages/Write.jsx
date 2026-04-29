import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, X, MapPin } from 'lucide-react'
import { C, FONT } from '../theme'
import { usePosts } from '../context/PostsContext'

export default function Write() {
  const navigate = useNavigate()
  const { addPost } = usePosts()
  const fileInputRef = useRef(null)

  // ─── 폼 상태
  const [photos,      setPhotos]      = useState([])
  const [postType,    setPostType]    = useState('share')
  const [title,       setTitle]       = useState('')
  const [category,    setCategory]    = useState('')
  const [weight,      setWeight]      = useState('')
  const [price,       setPrice]       = useState('')
  const [region,      setRegion]      = useState('')
  const [description, setDescription] = useState('')

  // ─── 지도 모달 상태
  const [showMap,     setShowMap]     = useState(false)
  const [geoStatus,   setGeoStatus]   = useState('idle') // idle | loading | granted | denied
  const [mapMode,     setMapMode]     = useState('current') // current | drag
  const [displayAddr, setDisplayAddr] = useState('')
  const [gpsCoords,   setGpsCoords]   = useState(null)
  const mapContainerRef = useRef(null)
  const kakaoMapRef     = useRef(null)
  const gpsMarkerRef    = useRef(null)
  const mapModeRef      = useRef('current')

  // ─── 지도 모달 열기
  const openLocationModal = () => {
    setShowMap(true)
    if (geoStatus === 'granted') return
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoStatus('granted')
      },
      () => setGeoStatus('denied'),
      { timeout: 10000 }
    )
  }

  // ─── 모달 닫힐 때 지도 인스턴스 초기화
  useEffect(() => {
    if (!showMap) {
      kakaoMapRef.current = null
      gpsMarkerRef.current = null
      setMapMode('current')
      mapModeRef.current = 'current'
    }
  }, [showMap])

  // ─── 지도 초기화 (granted 상태 + 모달 열림 + 좌표 준비 시)
  useEffect(() => {
    if (!showMap || geoStatus !== 'granted' || !gpsCoords || kakaoMapRef.current) return

    let cancelled = false

    const initMap = () => {
      if (cancelled || !mapContainerRef.current) return

      const K = window.kakao.maps
      const center = new K.LatLng(gpsCoords.lat, gpsCoords.lng)
      const map = new K.Map(mapContainerRef.current, { center, level: 3 })
      kakaoMapRef.current = map

      const marker = new K.Marker({ position: center })
      marker.setMap(map)
      gpsMarkerRef.current = marker

      reverseGeocode(gpsCoords.lat, gpsCoords.lng)

      K.event.addListener(map, 'dragend', () => {
        if (mapModeRef.current !== 'drag') return
        const c = map.getCenter()
        reverseGeocode(c.getLat(), c.getLng())
      })
    }

    // window.kakao가 아직 로드되지 않았을 경우 폴백 폴링
    const waitForKakao = (retries = 20) => {
      if (cancelled) return
      if (window.kakao?.maps) {
        initMap()
      } else if (retries > 0) {
        setTimeout(() => waitForKakao(retries - 1), 100)
      }
    }

    // DOM 렌더링 완료 후 실행
    const timer = setTimeout(() => waitForKakao(), 50)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [showMap, geoStatus, gpsCoords])

  // ─── 좌표 → 동 이름 변환
  const reverseGeocode = (lat, lng) => {
    if (!window.kakao?.maps?.services) return
    const geocoder = new window.kakao.maps.services.Geocoder()
    geocoder.coord2RegionCode(lng, lat, (result, status) => {
      if (status !== window.kakao.maps.services.Status.OK) return
      const region = result.find(r => r.region_type === 'H') || result.find(r => r.region_type === 'B')
      if (region) setDisplayAddr(region.region_3depth_name || region.region_2depth_name)
    })
  }

  // ─── 다른 동네 고르기 모드 전환
  const switchToDragMode = () => {
    setMapMode('drag')
    mapModeRef.current = 'drag'
    if (gpsMarkerRef.current) gpsMarkerRef.current.setMap(null)
    if (kakaoMapRef.current) {
      const c = kakaoMapRef.current.getCenter()
      reverseGeocode(c.getLat(), c.getLng())
    }
  }

  // ─── 위치 확정
  const handleSetLocation = () => {
    if (!displayAddr) return
    setRegion(displayAddr)
    setShowMap(false)
  }

  // ─── 사진 처리
  const handlePhotoAdd = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => setPhotos(prev => [...prev, ev.target.result])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }
  const removePhoto = (i) => setPhotos(prev => prev.filter((_, idx) => idx !== i))

  // ─── 유효성 검사
  const weightNum = parseFloat(weight) || 0
  const isSellLowWeight = postType === 'sell' && weight !== '' && weightNum < 50

  const isValid =
    photos.length > 0 &&
    title.trim()       !== '' &&
    category           !== '' &&
    weight.trim()      !== '' &&
    (postType === 'share' || price.trim() !== '') &&
    region.trim()      !== '' &&
    description.trim() !== '' &&
    !isSellLowWeight

  const [uploading, setUploading] = useState(false)

  const uploadToCloudinary = async (base64Image) => {
    const formData = new FormData()
    formData.append('file', base64Image)
    formData.append('upload_preset', 'ai5j2gjk')
    const res = await fetch(
      'https://api.cloudinary.com/v1_1/dw4hwiskc/image/upload',
      { method: 'POST', body: formData }
    )
    if (!res.ok) throw new Error('Cloudinary 업로드 실패')
    const data = await res.json()
    return data.secure_url
  }

  const handleSubmit = async () => {
    if (!isValid || uploading) return
    setUploading(true)
    try {
      const imageUrl = await uploadToCloudinary(photos[0])
      await addPost({
        title,
        type:     postType,
        price:    postType === 'sell' ? parseInt(price, 10) : 0,
        region,
        status:   postType === 'share' ? '나눔' : '판매중',
        imageUrl,
      })
      navigate('/')
    } catch (e) {
      console.error('업로드 실패:', e)
      setUploading(false)
    }
  }

  // ─── 공통 스타일
  const inputStyle = {
    width: '100%', border: 'none', outline: 'none',
    background: 'transparent', fontFamily: 'inherit',
    fontSize: 14, color: C.text, letterSpacing: '-0.01em',
  }
  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: C.gray,
    display: 'block', marginBottom: 8,
  }

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100dvh', background: C.bg, fontFamily: FONT }}>

      {/* ─── 헤더 */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate(-1)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
          글 올리기
        </span>
        <button onClick={handleSubmit} disabled={!isValid || uploading} style={{
          background: isValid && !uploading ? C.point : C.border,
          color: isValid && !uploading ? C.white : C.gray,
          border: 'none', borderRadius: 999,
          padding: '7px 20px',
          fontSize: 14, fontWeight: 700,
          cursor: isValid && !uploading ? 'pointer' : 'default',
          fontFamily: 'inherit', letterSpacing: '-0.01em',
          transition: 'background 0.15s ease',
        }}>
          {uploading ? '올리는 중...' : '올리기'}
        </button>
      </header>

      {/* ─── 본문 */}
      <div style={{ padding: '20px 16px 60px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* 사진 업로드 */}
        <div style={{ background: C.white, borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {photos.map((photo, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                <img src={photo} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', display: 'block' }} />
                <button onClick={() => removePhoto(i)} style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 20, height: 20, borderRadius: 999,
                  background: C.text, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                  <X size={11} color={C.white} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            <button onClick={() => fileInputRef.current?.click()} style={{
              width: 80, height: 80, borderRadius: 12,
              border: `2px dashed ${C.border}`,
              background: '#FAF7F3',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 5,
              cursor: 'pointer', flexShrink: 0,
            }}>
              <Camera size={20} color={C.gray} strokeWidth={1.8} />
              <span style={{ fontSize: 10, color: C.gray, fontFamily: 'inherit', fontWeight: 500 }}>사진 추가</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoAdd} />
          </div>
          {photos.length === 0 && (
            <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 600, color: C.point }}>사진은 필수예요</p>
          )}
        </div>

        {/* 거래 유형 토글 */}
        <div style={{ background: C.white, borderRadius: 16, padding: '14px 16px' }}>
          <p style={{ ...labelStyle, marginBottom: 10 }}>거래 유형</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ key: 'share', label: '나눠보기' }, { key: 'sell', label: '실 올리기' }].map(t => (
              <button key={t.key}
                onClick={() => { setPostType(t.key); if (t.key === 'share') setPrice('') }}
                style={{
                  borderRadius: 999, padding: '8px 20px',
                  fontSize: 13, fontWeight: postType === t.key ? 700 : 400,
                  border: postType === t.key ? 'none' : `1.5px solid ${C.border}`,
                  background: postType === t.key ? C.point : C.white,
                  color: postType === t.key ? C.white : C.text,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 입력 폼 */}
        <div style={{ background: C.white, borderRadius: 16, overflow: 'hidden' }}>

          {/* 제목 */}
          <div style={{ padding: '14px 16px' }}>
            <label style={labelStyle}>제목 *</label>
            <input type="text" placeholder="제목을 입력해주세요"
              value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </div>
          <Divider />

          {/* 카테고리 */}
          <div style={{ padding: '14px 16px' }}>
            <label style={{ ...labelStyle, marginBottom: 10 }}>카테고리 *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ key: 'yarn', label: '실' }, { key: 'tool', label: '도구' }].map(c => (
                <button key={c.key} onClick={() => setCategory(c.key)} style={{
                  borderRadius: 999, padding: '7px 20px',
                  fontSize: 13, fontWeight: category === c.key ? 700 : 400,
                  border: category === c.key ? 'none' : `1.5px solid ${C.border}`,
                  background: category === c.key ? C.text : C.white,
                  color: category === c.key ? C.white : C.text,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease',
                }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <Divider />

          {/* 무게 */}
          <div style={{ padding: '14px 16px' }}>
            <label style={labelStyle}>무게 *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="text" inputMode="decimal" placeholder="숫자만 입력"
                value={weight}
                onChange={e => setWeight(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                style={{ ...inputStyle, flex: 1 }} />
              <span style={{ fontSize: 13, color: C.gray, flexShrink: 0 }}>g</span>
            </div>
            {isSellLowWeight && (
              <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 600, color: C.point }}>
                50g 미만은 나눔만 가능해요!
              </p>
            )}
          </div>

          {/* 가격 (실 올리기 전용) */}
          {postType === 'sell' && <>
            <Divider />
            <div style={{ padding: '14px 16px' }}>
              <label style={labelStyle}>가격 *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="text" inputMode="numeric" placeholder="숫자만 입력"
                  value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))}
                  style={{ ...inputStyle, flex: 1 }} />
                <span style={{ fontSize: 13, color: C.gray, flexShrink: 0 }}>원</span>
              </div>
            </div>
          </>}
          <Divider />

          {/* 지역 */}
          <div style={{ padding: '14px 16px' }}>
            <label style={labelStyle}>지역 *</label>
            <button onClick={openLocationModal} style={{
              width: '100%', textAlign: 'left', border: 'none',
              background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: 0,
            }}>
              <MapPin size={16} color={region ? C.point : C.gray} strokeWidth={1.8} />
              <span style={{ fontSize: 14, color: region ? C.text : '#BCBCBC', letterSpacing: '-0.01em' }}>
                {region || '위치를 선택해주세요'}
              </span>
            </button>
          </div>
          <Divider />

          {/* 상품 설명 */}
          <div style={{ padding: '14px 16px' }}>
            <label style={labelStyle}>상품 설명 *</label>
            <textarea placeholder="실의 소재, 색상, 상태 등을 자세히 적어주세요"
              value={description} onChange={e => setDescription(e.target.value)}
              rows={5} style={{ ...inputStyle, resize: 'none', lineHeight: 1.7, display: 'block' }} />
          </div>

        </div>
      </div>

      {/* ─── 지도 모달 */}
      {showMap && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowMap(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div style={{
            width: '100%', maxWidth: 390,
            background: C.white,
            borderRadius: '20px 20px 0 0',
            overflow: 'hidden',
          }}>
            {/* 모달 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>
                {mapMode === 'drag' ? '동네 고르기' : '위치 설정'}
              </span>
              <button onClick={() => setShowMap(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', padding: 4 }}>
                <X size={22} color={C.text} strokeWidth={1.8} />
              </button>
            </div>

            {/* 로딩 */}
            {geoStatus === 'loading' && (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, color: C.gray }}>현재 위치를 가져오는 중이에요...</p>
              </div>
            )}

            {/* 거부 */}
            {geoStatus === 'denied' && (
              <div style={{ padding: '40px 20px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <MapPin size={32} color={C.border} strokeWidth={1.5} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>위치 권한이 필요해요</p>
                <p style={{ margin: 0, fontSize: 13, color: C.gray, lineHeight: 1.5 }}>
                  기기 설정에서 브라우저의<br />위치 접근을 허용해주세요
                </p>
              </div>
            )}

            {/* 지도 */}
            {geoStatus === 'granted' && (
              <>
                <div style={{ position: 'relative' }}>
                  <div ref={mapContainerRef} style={{ width: '100%', height: 400, position: 'relative' }} />

                  {/* 드래그 모드 중앙 고정 핀 */}
                  {mapMode === 'drag' && (
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -100%)',
                      pointerEvents: 'none', zIndex: 10,
                    }}>
                      <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
                        <path d="M14 0C6.27 0 0 6.27 0 14C0 24.5 14 36 14 36C14 36 28 24.5 28 14C28 6.27 21.73 0 14 0Z" fill={C.point} />
                        <circle cx="14" cy="14" r="5.5" fill="white" />
                      </svg>
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px 20px 28px' }}>
                  {/* 현재 주소 표시 */}
                  <p style={{ margin: '0 0 14px', fontSize: 14, color: C.gray, letterSpacing: '-0.01em' }}>
                    {displayAddr
                      ? <><span style={{ color: C.text, fontWeight: 700 }}>{displayAddr}</span>으로 설정할까요?</>
                      : '주소를 불러오는 중...'}
                  </p>

                  {/* 이 위치로 설정 */}
                  <button onClick={handleSetLocation} disabled={!displayAddr} style={{
                    width: '100%', padding: '14px',
                    background: displayAddr ? C.point : C.border,
                    color: displayAddr ? C.white : C.gray,
                    border: 'none', borderRadius: 999,
                    fontSize: 15, fontWeight: 700,
                    cursor: displayAddr ? 'pointer' : 'default',
                    fontFamily: 'inherit', letterSpacing: '-0.01em',
                    marginBottom: mapMode === 'current' ? 10 : 0,
                    transition: 'background 0.15s ease',
                  }}>
                    이 위치로 설정
                  </button>

                  {/* 다른 동네 고르기 (current 모드에서만) */}
                  {mapMode === 'current' && (
                    <button onClick={switchToDragMode} style={{
                      width: '100%', padding: '14px',
                      background: 'transparent',
                      color: C.text,
                      border: `1.5px solid ${C.border}`, borderRadius: 999,
                      fontSize: 15, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                    }}>
                      다른 동네 고르기
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '0 16px' }} />
}
