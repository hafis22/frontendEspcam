import React, { useState, useRef, useCallback, useEffect } from 'react';

function CameraIcon({ size = 32, color = '#94a3b8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

const pillStyle = {
  healthy: { background: '#16a34a', color: '#fff' },
  warn:    { background: '#d97706', color: '#fff' },
  danger:  { background: '#dc2626', color: '#fff' },
};

function getStatus(penyakit) {
  if (!penyakit) return 'warn';
  const p = penyakit.toLowerCase();
  if (p.includes('sehat') || p.includes('healthy')) return 'healthy';
  if (['busuk akar', 'hawar daun', 'soft-rot', 'anthrax'].includes(p)) return 'danger';
  return 'warn';
}

const VPS = 'https://backendescam-production-cc88.up.railway.app';

function ModalFoto({ item, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...styles.pill, ...pillStyle[getStatus(item.penyakit)] }}>{item.penyakit}</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>{item.confidence}% akurasi</span>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {item.foto
          ? <img src={item.foto} alt="hasil" style={styles.modalImg} />
          : <div style={styles.modalPlaceholder}>
              <CameraIcon size={40} color="#cbd5e1" />
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Foto tidak tersedia</div>
            </div>
        }
        <div style={styles.modalInfo}>
          <div style={styles.modalInfoRow}>
            <span style={styles.modalInfoLabel}>Hasil</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{item.penyakit}</span>
          </div>
          <div style={styles.modalInfoRow}>
            <span style={styles.modalInfoLabel}>Akurasi</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{item.confidence}%</span>
          </div>
          <div style={styles.modalInfoRow}>
            <span style={styles.modalInfoLabel}>Waktu</span>
            <span style={{ fontSize: 13, color: '#475569' }}>{item.waktu}, {item.tanggal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeteksiPenyakit({ isMobile = false }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pollRef   = useRef(null);

  const [mode, setMode]               = useState('idle');
  const [preview, setPreview]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [hasil, setHasil]             = useState(null);
  const [riwayat, setRiwayat]         = useState([]);
  const [modalItem, setModalItem]     = useState(null);
  const [esp32Online, setEsp32Online] = useState(false);
  const [esp32IP, setEsp32IP]         = useState('');
  const [lastHasil, setLastHasil]     = useState('');
  const [esp32Frame, setEsp32Frame]   = useState(null);
  const [esp32Processing, setEsp32Processing] = useState(false); // freeze saat deteksi
  const [esp32Status, setEsp32Status] = useState('idle'); // idle | connecting | live | no-frame | error
  const [frozenFrame, setFrozenFrame] = useState(null); // frame yang di-freeze
  const frameRef = useRef(null);

  // ── Cek ESP32 via backend ─────────────────────────
  const cekEsp32 = async () => {
    try {
      const res  = await fetch(`${VPS}/api/esp32/ip`, {
        signal: AbortSignal.timeout(5000)
      });
      const data = await res.json();
      setEsp32IP(data.ip || '');
      setEsp32Online(data.online || false);
      // Tetap lanjut koneksi kalau ada IP, meski online=false
      // (ESP32 mungkin baru nyala dan belum kirim frame)
      return !!data.ip;
    } catch {}
    setEsp32Online(false);
    return false;
  };

  // ── Poll frame capture tiap 500ms sebagai live view ──
  const stopPolling = () => {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (frameRef.current) { clearInterval(frameRef.current); frameRef.current = null; }
  };

  const startFramePolling = () => {
    if (frameRef.current) return;
    setEsp32Status('connecting');
    frameRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${VPS}/api/esp32/frame?t=${Date.now()}`);
        if (!res.ok) {
          if (res.status === 503) {
            // Backend belum punya frame dari ESP32
            setEsp32Status('no-frame');
            setEsp32Online(false);
          } else {
            setEsp32Status('error');
            setEsp32Online(false);
          }
          return;
        }
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        setEsp32Frame(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
        setFrozenFrame(url);
        setEsp32Online(true);
        setEsp32Status('live');
        setEsp32Processing(false);
      } catch {
        setEsp32Online(false);
        setEsp32Status('error');
      }
    }, 1000);
  };



  const startPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${VPS}/api/esp32/hasil`);
        const data = await res.json();
        if (data.penyakit && data.penyakit !== lastHasil) {
          setLastHasil(data.penyakit);
          setHasil(data);
          const now = new Date(data.timestamp || Date.now());
          setRiwayat(prev => [{
            foto:       null,
            penyakit:   data.penyakit,
            confidence: data.confidence,
            waktu:      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            tanggal:    now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          }, ...prev.slice(0, 9)]);
        }
      } catch {}
    }, 3000);
  };

  // Load riwayat deteksi dari DB saat pertama kali
  useEffect(() => {
    fetch(`${VPS}/api/history/deteksi`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRiwayat(data.map(d => ({
            foto:       null,
            penyakit:   d.penyakit,
            confidence: d.confidence,
            waktu:      new Date(d.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            tanggal:    new Date(d.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => () => stopPolling(), []);

  // ── Konek ESP32 ───────────────────────────────────
  const handleKonekEsp32 = async () => {
    const ok = await cekEsp32();
    if (ok) {
      setMode('esp32');
      startPolling();
      startFramePolling();
    } else {
      alert('ESP32-CAM tidak terdeteksi!\nPastikan ESP32 sudah nyala dan terhubung ke WiFi.');
    }
  };

  const handleDiskonekEsp32 = () => {
    stopPolling();
    setMode('idle');
    setEsp32Online(false);
    setHasil(null);
    setLastHasil('');
    setEsp32IP('');
    setEsp32Frame(null);
    setEsp32Status('idle');
  };

  // ── Kamera HP ─────────────────────────────────────
  const bukaKamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setMode('camera');
      setHasil(null);
      setPreview(null);
    } catch {
      alert('Tidak bisa akses kamera.');
    }
  };

  const tutupKamera = (e) => {
    e?.stopPropagation();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setMode('idle');
  };

  const ambilFoto = useCallback((e) => {
    e?.stopPropagation();
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setPreview(canvas.toDataURL('image/jpeg'));
    setMode('captured');
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const ulangi = () => {
    setPreview(null); setHasil(null); setMode('idle');
    setTimeout(() => bukaKamera(), 100);
  };

  const deteksi = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const res  = await fetch(preview);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('foto', blob, 'foto.jpg');
      const response = await fetch(`${VPS}/api/deteksi`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setHasil(data);
      const now = new Date();
      setRiwayat(prev => [{
        foto:       preview,
        penyakit:   data.penyakit,
        confidence: data.confidence,
        waktu:      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        tanggal:    now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      }, ...prev]);
    } catch { alert('Gagal konek ke server!'); }
    setLoading(false);
  };

  const cameraBoxStyle = {
    ...styles.cameraBox,
    cursor: mode === 'idle' ? 'pointer' : 'default',
    borderColor: mode === 'camera' ? '#16a34a' : mode === 'esp32' ? '#3b82f6' : '#cbd5e1',
    borderStyle: mode === 'esp32' ? 'solid' : 'dashed',
    ...(mode === 'camera' && isMobile ? {
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      aspectRatio: 'unset', borderRadius: 0,
      zIndex: 999, border: 'none', background: '#000',
    } : {})
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={styles.sectionLabel}>Deteksi penyakit</p>
      <div style={styles.card}>

        {/* Tab mode */}
        <div style={styles.modeTab}>
          <button
            onClick={() => { if (mode === 'esp32') handleDiskonekEsp32(); else setMode('idle'); }}
            style={{ ...styles.modeBtn, ...(mode !== 'esp32' ? styles.modeBtnActive : {}) }}
          >
            📱 Kamera HP
          </button>
          <button
            onClick={() => mode === 'esp32' ? handleDiskonekEsp32() : handleKonekEsp32()}
            style={{ ...styles.modeBtn, ...(mode === 'esp32' ? styles.modeBtnActiveBlue : {}) }}
          >
            📷 ESP32-CAM {mode === 'esp32' && esp32Online ? '🟢' : ''}
          </button>
        </div>

        <div style={styles.grid2} className="grid-2">

          {/* Kiri */}
          <div>

            {/* Mode ESP32 */}
            {mode === 'esp32' && (
              <div>
                <div style={{
                  ...styles.cameraBox,
                  borderColor: '#3b82f6',
                  borderStyle: 'solid',
                  cursor: 'default',
                  background: '#000',
                }}>
                  {/* Tampilkan frozen frame saat proses, live frame saat normal */}
                  {(esp32Processing ? frozenFrame : esp32Frame)
                    ? <img
                        src={esp32Processing ? frozenFrame : esp32Frame}
                        alt="ESP32 Live"
                        style={{ width: '100%', height: '100%', objectFit: 'cover',
                          filter: esp32Processing ? 'brightness(0.6)' : 'none',
                          transition: 'filter 0.3s'
                        }}
                      />
                    : <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '0 16px' }}>
                        {esp32Status === 'connecting' && <>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
                          <div>Menghubungkan ke ESP32-CAM...</div>
                        </>}
                        {esp32Status === 'no-frame' && <>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                          <div style={{ color: '#fbbf24' }}>ESP32 terdaftar tapi belum kirim frame.</div>
                          <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>Pastikan ESP32 menyala & terhubung WiFi.</div>
                        </>}
                        {esp32Status === 'error' && <>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
                          <div style={{ color: '#f87171' }}>Gagal konek ke kamera.</div>
                          <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>Coba diskonek lalu konek ulang.</div>
                        </>}
                        {(esp32Status === 'live' || esp32Status === 'connecting') && esp32Status !== 'no-frame' && esp32Status !== 'error' && <>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
                          <div>Menunggu frame pertama...</div>
                        </>}
                      </div>
                  }

                  {/* Overlay loading saat deteksi */}
                  {esp32Processing && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 8
                    }}>
                      <div style={{
                        width: 36, height: 36, border: '3px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 500,
                        background: 'rgba(0,0,0,0.5)', padding: '3px 10px', borderRadius: 999 }}>
                        Mendeteksi...
                      </span>
                    </div>
                  )}

                  {/* Badge status */}
                  <div style={styles.esp32Badge}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: esp32Status === 'live' ? '#4ade80' : esp32Status === 'error' ? '#f87171' : '#fbbf24'
                    }} />
                    <span style={{ fontSize: 11, color: '#fff' }}>
                      {esp32Processing ? 'Mendeteksi...'
                        : esp32Status === 'live'       ? 'Live'
                        : esp32Status === 'no-frame'   ? 'Menunggu frame...'
                        : esp32Status === 'error'      ? 'Error'
                        : 'Menghubungkan...'}
                    </span>
                    {esp32IP && (
                      <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>
                        {esp32IP}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleDiskonekEsp32}
                  style={{ ...styles.btnGray, marginTop: 10, width: '100%', borderColor: '#fca5a5', color: '#dc2626' }}
                >
                  Diskonek ESP32
                </button>

                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, textAlign: 'center' }}>
                  Tekan tombol fisik ESP32 untuk foto & deteksi
                </div>
              </div>
            )}

            {/* Mode kamera HP */}
            {mode !== 'esp32' && (
              <div>
                <div style={cameraBoxStyle} onClick={mode === 'idle' ? bukaKamera : undefined}>
                  <video ref={videoRef} autoPlay playsInline
                    style={{ ...styles.media, display: mode === 'camera' ? 'block' : 'none' }} />
                  {preview && <img src={preview} alt="preview" style={styles.media} />}
                  {mode === 'idle' && (
                    <div style={{ textAlign: 'center' }}>
                      <CameraIcon size={36} color="#94a3b8" />
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Ketuk untuk mulai</div>
                    </div>
                  )}
                  {mode === 'camera' && (
                    <>
                      <div style={{ ...styles.hintOverlay, top: isMobile ? 50 : 10 }}>
                        Ketuk tombol kamera untuk foto
                      </div>
                      <div style={{ ...styles.camControls, bottom: isMobile ? 60 : 14 }}>
                        <button onClick={ambilFoto} style={styles.captureBtn}>
                          <CameraIcon size={22} color="#fff" />
                        </button>
                        <button onClick={tutupKamera} style={styles.endCallBtn}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {mode === 'idle' && (
                  <div style={styles.hintText}>Ketuk untuk buka kamera HP</div>
                )}

                {mode === 'captured' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={deteksi} disabled={loading} style={styles.btnGreen}>
                      {loading ? 'Mendeteksi...' : 'Deteksi'}
                    </button>
                    <button onClick={ulangi} style={styles.btnGray}>Ulangi</button>
                  </div>
                )}
              </div>
            )}

            {/* Hasil deteksi */}
            {hasil && hasil.penyakit && (
              <div style={{ ...styles.hasilBox, ...pillStyle[getStatus(hasil.penyakit)] }}>
                <strong>{hasil.penyakit}</strong> — akurasi {hasil.confidence}%
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Kanan: riwayat */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={styles.galeriTitle}>Riwayat Deteksi</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{riwayat.length} hasil</span>
            </div>
            <div style={styles.listWrap}>
              {riwayat.length === 0 ? (
                <div style={styles.emptyList}>
                  <CameraIcon size={24} color="#cbd5e1" />
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Belum ada hasil</div>
                </div>
              ) : riwayat.map((r, i) => {
                const status = getStatus(r.penyakit);
                return (
                  <div key={i} onClick={() => setModalItem(r)} style={styles.listRow}>
                    <div style={styles.listThumb}>
                      {r.foto
                        ? <img src={r.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                        : <CameraIcon size={16} color="#cbd5e1" />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ ...styles.pill, ...pillStyle[status] }}>{r.penyakit}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.confidence}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.waktu} · {r.tanggal}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {modalItem && <ModalFoto item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}

const styles = {
  sectionLabel:      { fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
  card:              { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  modeTab:           { display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2, marginBottom: 12 },
  modeBtn:           { flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'transparent', color: '#64748b' },
  modeBtnActive:     { background: '#fff', color: '#1e293b', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  modeBtnActiveBlue: { background: '#eff6ff', color: '#1d4ed8', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  grid2:             { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  cameraBox:         { width: '100%', aspectRatio: '4/3', background: '#f8fafc', border: '1.5px dashed', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'border-color 0.2s' },
  media:             { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  hintOverlay:       { position: 'absolute', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 12, padding: '4px 12px', borderRadius: 999, whiteSpace: 'nowrap', zIndex: 1000 },
  camControls:       { position: 'absolute', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 1000 },
  captureBtn:        { width: 64, height: 64, background: '#16a34a', border: '3px solid #fff', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  endCallBtn:        { width: 50, height: 50, background: '#ef4444', border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  hintText:          { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 6 },
  btnGreen:          { flex: 1, padding: '8px 0', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  btnGray:           { flex: 1, padding: '8px 0', background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  hasilBox:          { marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13 },
  galeriTitle:       { fontSize: 13, fontWeight: 500, color: '#334155' },
  listWrap:          { display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 300, overflowY: 'auto' },
  listRow:           { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderBottom: '0.5px solid #f1f5f9', cursor: 'pointer', borderRadius: 8 },
  listThumb:         { width: 40, height: 40, background: '#f1f5f9', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  emptyList:         { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 },
  pill:              { fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, display: 'inline-block' },
  esp32Badge:        { position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: 999 },
  overlay:           { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:             { background: '#fff', borderRadius: 16, padding: 20, width: '90%', maxWidth: 380 },
  modalHeader:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  closeBtn:          { background: '#f1f5f9', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalImg:          { width: '100%', borderRadius: 10, objectFit: 'cover', maxHeight: 240, display: 'block', marginBottom: 14 },
  modalPlaceholder:  { width: '100%', height: 180, background: '#f8fafc', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  modalInfo:         { display: 'flex', flexDirection: 'column', gap: 8 },
  modalInfoRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #f1f5f9' },
  modalInfoLabel:    { fontSize: 12, color: '#94a3b8' },
};

export default DeteksiPenyakit;