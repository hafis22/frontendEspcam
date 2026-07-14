import React, { useState, useEffect, useCallback } from 'react';

const pillStyle = {
  healthy: { background: '#dcfce7', color: '#166534' },
  warn:    { background: '#fef9c3', color: '#854d0e' },
  danger:  { background: '#fee2e2', color: '#991b1b' },
};

function getStatus(penyakit) {
  if (penyakit === 'Sehat') return 'healthy';
  if (['Busuk akar', 'Hawar daun', 'Soft-rot', 'anthrax'].includes(penyakit)) return 'danger';
  return 'warn';
}

function toInputDate(d) { return d.toISOString().split('T')[0]; }
function formatDate(s)  { return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
function formatTime(s)  { return new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }

export default function History({ isMobile = false }) {
  const [dari, setDari]           = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return toInputDate(d); });
  const [sampai, setSampai]       = useState(() => toInputDate(new Date()));
  const [deteksiData, setDeteksi] = useState([]);
  const [loading, setLoading]     = useState(false);

const API_URL = 'https://backendescam-production-cc88.up.railway.app';
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/history/deteksi?dari=${dari}&sampai=${sampai}`);
      const d   = await res.json();
      setDeteksi(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error('Gagal fetch history:', err);
    }
    setLoading(false);
  }, [dari, sampai]);

  useEffect(() => { 
    fetchData(); 
    // Auto-refresh tiap 30 detik supaya data terbaru masuk tanpa reload
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={styles.sectionLabel}>History</p>
      <div style={styles.card}>

        {/* Filter */}
        <div style={{ ...styles.topRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>Riwayat Deteksi Penyakit</span>
          <div style={styles.filterRow}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
            <input type="date" value={dari}   onChange={e => setDari(e.target.value)}   style={styles.dateInput} />
            <span style={{ fontSize: 12, color: '#64748b' }}>—</span>
            <input type="date" value={sampai} onChange={e => setSampai(e.target.value)} style={styles.dateInput} />
            <button onClick={fetchData} disabled={loading} style={styles.refreshBtn} title="Refresh">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={styles.empty}>Memuat data...</div>
        ) : (
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{deteksiData.length} data ditemukan</div>

            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {deteksiData.length === 0 ? (
                  <div style={styles.empty}>Tidak ada data</div>
                ) : deteksiData.map((d, i) => {
                  const status = getStatus(d.penyakit);
                  return (
                    <div key={i} style={styles.mobileCard}>
                      <div style={styles.mobileCardHeader}>
                        <span style={{ fontWeight: 500, color: '#1e293b', fontSize: 12 }}>{formatDate(d.timestamp)}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatTime(d.timestamp)}</span>
                      </div>
                      {d.foto_url && (
                        <img src={API_URL + d.foto_url} alt="deteksi"
                          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8, display: 'block' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ ...styles.pill, ...pillStyle[status] }}>{d.penyakit}</span>
                        <span style={{ fontWeight: 500, color: '#1e293b', fontSize: 13 }}>{d.confidence}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.theadRow}>
                      <th style={styles.th}>Foto</th>
                      <th style={styles.th}>Waktu</th>
                      <th style={styles.th}>Hasil Deteksi</th>
                      <th style={styles.th}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deteksiData.length === 0 ? (
                      <tr><td colSpan={4} style={styles.empty}>Tidak ada data</td></tr>
                    ) : deteksiData.map((d, i) => {
                      const status = getStatus(d.penyakit);
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                          <td style={styles.td}>
                            {d.foto_url
                              ? <img src={API_URL + d.foto_url} alt="deteksi"
                                  style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                              : <div style={{ width: 56, height: 42, background: '#f1f5f9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                </div>
                            }
                          </td>
                          <td style={styles.td}>
                            <div style={{ fontWeight: 500, color: '#1e293b' }}>{formatDate(d.timestamp)}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatTime(d.timestamp)}</div>
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.pill, ...pillStyle[status] }}>{d.penyakit}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontWeight: 500, color: '#1e293b' }}>{d.confidence}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  sectionLabel:    { fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
  card:            { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  topRow:          { display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  filterRow:       { display: 'flex', alignItems: 'center', gap: 6 },
  dateInput:       { border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 6px', fontSize: 11, color: '#334155', background: '#f8fafc' },
  refreshBtn:      { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', color: '#64748b' },
  tableWrap:       { overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', maxHeight: 500, overflowY: 'auto' },
  table:           { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  theadRow:        { background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 },
  th:              { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' },
  td:              { padding: '8px 12px', borderBottom: '0.5px solid #f1f5f9', verticalAlign: 'middle' },
  empty:           { textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 },
  pill:            { fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 999 },
  mobileCard:      { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 8 },
  mobileCardHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
};