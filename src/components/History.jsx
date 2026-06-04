import React, { useState, useEffect } from 'react';

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
  const [tab, setTab]             = useState('sensor');
  const [dari, setDari]           = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return toInputDate(d); });
  const [sampai, setSampai]       = useState(() => toInputDate(new Date()));
  const [sensorData, setSensor]   = useState([]);
  const [deteksiData, setDeteksi] = useState([]);
  const [loading, setLoading]     = useState(false);

const API_URL = 'https://backendescam-production.up.railway.app';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        fetch(`${API_URL}/api/history/sensor?dari=${dari}&sampai=${sampai}`).then(r => r.json()),
        fetch(`${API_URL}/api/history/deteksi?dari=${dari}&sampai=${sampai}`).then(r => r.json()),
      ]);
      setSensor(Array.isArray(s) ? s : []);
      setDeteksi(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error('Gagal fetch history:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [dari, sampai]);

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={styles.sectionLabel}>History</p>
      <div style={styles.card}>

        {/* Tab + Filter */}
        <div style={{ ...styles.topRow, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
          <div style={styles.tabRow}>
            <button onClick={() => setTab('sensor')}  style={{ ...styles.tabBtn, ...(tab === 'sensor'  ? styles.tabActive : {}) }}>Data Sensor</button>
            <button onClick={() => setTab('deteksi')} style={{ ...styles.tabBtn, ...(tab === 'deteksi' ? styles.tabActive : {}) }}>Deteksi Penyakit</button>
          </div>
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
          </div>
        </div>

        {loading ? (
          <div style={styles.empty}>Memuat data...</div>
        ) : (
          <>
            {/* ── TAB SENSOR ── */}
            {tab === 'sensor' && (
              <>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                  {sensorData.length} data ditemukan
                </div>

                {isMobile ? (
                  /* Mobile: list card */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Lingkungan */}
                    <div>
                      <div style={styles.tableTitle}>
                        <div style={{ ...styles.dot, background: '#3b82f6' }} />
                        Sensor Lingkungan
                      </div>
                      {sensorData.length === 0 ? (
                        <div style={styles.empty}>Tidak ada data</div>
                      ) : sensorData.map((d, i) => (
                        <div key={i} style={styles.mobileCard}>
                          <div style={styles.mobileCardHeader}>
                            <span style={{ fontWeight: 500, color: '#1e293b', fontSize: 12 }}>{formatDate(d.timestamp)}</span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatTime(d.timestamp)}</span>
                          </div>
                          <div style={styles.mobileCardRow}>
                            <span style={styles.mobileCardLabel}>Temp</span>
                            <span style={styles.mobileChip}>{d.lingkungan?.temperature}°C</span>
                          </div>
                          <div style={styles.mobileCardRow}>
                            <span style={styles.mobileCardLabel}>Humidity</span>
                            <span style={styles.mobileChip}>{d.lingkungan?.humidity}%</span>
                          </div>
                          <div style={styles.mobileCardRow}>
                            <span style={styles.mobileCardLabel}>Lux</span>
                            <span style={styles.mobileChip}>{d.lingkungan?.lux} lx</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tanaman */}
                    <div>
                      <div style={styles.tableTitle}>
                        <div style={{ ...styles.dot, background: '#22c55e' }} />
                        Sensor Tanaman
                      </div>
                      {sensorData.length === 0 ? (
                        <div style={styles.empty}>Tidak ada data</div>
                      ) : sensorData.map((d, i) => (
                        <div key={i} style={styles.mobileCard}>
                          <div style={styles.mobileCardHeader}>
                            <span style={{ fontWeight: 500, color: '#1e293b', fontSize: 12 }}>{formatDate(d.timestamp)}</span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatTime(d.timestamp)}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            <div style={styles.mobileCardRow}>
                              <span style={styles.mobileCardLabel}>Temp</span>
                              <span style={styles.mobileChip}>{d.tanaman?.temperature}°C</span>
                            </div>
                            <div style={styles.mobileCardRow}>
                              <span style={styles.mobileCardLabel}>Humidity</span>
                              <span style={styles.mobileChip}>{d.tanaman?.humidity}%</span>
                            </div>
                            <div style={styles.mobileCardRow}>
                              <span style={styles.mobileCardLabel}>pH</span>
                              <span style={styles.mobileChip}>{d.tanaman?.ph}</span>
                            </div>
                            <div style={styles.mobileCardRow}>
                              <span style={styles.mobileCardLabel}>EC</span>
                              <span style={styles.mobileChip}>{d.tanaman?.ec}</span>
                            </div>
                            <div style={styles.mobileCardRow}>
                              <span style={styles.mobileCardLabel}>N</span>
                              <span style={{ ...styles.mobileChip, background: '#f0fdf4', color: '#166534' }}>{d.tanaman?.nitrogen}</span>
                            </div>
                            <div style={styles.mobileCardRow}>
                              <span style={styles.mobileCardLabel}>P</span>
                              <span style={{ ...styles.mobileChip, background: '#eff6ff', color: '#1d4ed8' }}>{d.tanaman?.fosfor}</span>
                            </div>
                            <div style={styles.mobileCardRow}>
                              <span style={styles.mobileCardLabel}>K</span>
                              <span style={{ ...styles.mobileChip, background: '#faf5ff', color: '#7e22ce' }}>{d.tanaman?.kalium}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Desktop: 2 kolom tabel */
                  <div style={styles.sensorGrid}>
                    <div>
                      <div style={styles.tableTitle}>
                        <div style={{ ...styles.dot, background: '#3b82f6' }} />
                        Sensor Lingkungan
                      </div>
                      <div style={styles.tableWrap}>
                        <table style={styles.table}>
                          <thead>
                            <tr style={styles.theadRow}>
                              <th style={styles.th}>Waktu</th>
                              <th style={styles.th}>Temp</th>
                              <th style={styles.th}>Humidity</th>
                              <th style={styles.th}>Lux</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sensorData.length === 0 ? (
                              <tr><td colSpan={4} style={styles.empty}>Tidak ada data</td></tr>
                            ) : sensorData.map((d, i) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                                <td style={styles.td}>
                                  <div style={{ fontWeight: 500, color: '#1e293b', fontSize: 12 }}>{formatDate(d.timestamp)}</div>
                                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatTime(d.timestamp)}</div>
                                </td>
                                <td style={styles.td}><span style={styles.chip}>{d.lingkungan?.temperature}°C</span></td>
                                <td style={styles.td}><span style={styles.chip}>{d.lingkungan?.humidity}%</span></td>
                                <td style={styles.td}><span style={styles.chip}>{d.lingkungan?.lux} lx</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <div style={styles.tableTitle}>
                        <div style={{ ...styles.dot, background: '#22c55e' }} />
                        Sensor Tanaman
                      </div>
                      <div style={styles.tableWrap}>
                        <table style={styles.table}>
                          <thead>
                            <tr style={styles.theadRow}>
                              <th style={styles.th}>Waktu</th>
                              <th style={styles.th}>Temp</th>
                              <th style={styles.th}>Hum</th>
                              <th style={styles.th}>pH</th>
                              <th style={styles.th}>EC</th>
                              <th style={{ ...styles.th, color: '#166534' }}>N</th>
                              <th style={{ ...styles.th, color: '#1d4ed8' }}>P</th>
                              <th style={{ ...styles.th, color: '#7e22ce' }}>K</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sensorData.length === 0 ? (
                              <tr><td colSpan={8} style={styles.empty}>Tidak ada data</td></tr>
                            ) : sensorData.map((d, i) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                                <td style={styles.td}>
                                  <div style={{ fontWeight: 500, color: '#1e293b', fontSize: 12 }}>{formatDate(d.timestamp)}</div>
                                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatTime(d.timestamp)}</div>
                                </td>
                                <td style={styles.td}><span style={styles.chip}>{d.tanaman?.temperature}°C</span></td>
                                <td style={styles.td}><span style={styles.chip}>{d.tanaman?.humidity}%</span></td>
                                <td style={styles.td}><span style={styles.chip}>{d.tanaman?.ph}</span></td>
                                <td style={styles.td}><span style={styles.chip}>{d.tanaman?.ec}</span></td>
                                <td style={styles.td}><span style={{ ...styles.chip, background: '#f0fdf4', color: '#166534' }}>{d.tanaman?.nitrogen}</span></td>
                                <td style={styles.td}><span style={{ ...styles.chip, background: '#eff6ff', color: '#1d4ed8' }}>{d.tanaman?.fosfor}</span></td>
                                <td style={styles.td}><span style={{ ...styles.chip, background: '#faf5ff', color: '#7e22ce' }}>{d.tanaman?.kalium}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── TAB DETEKSI ── */}
            {tab === 'deteksi' && (
              <div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{deteksiData.length} data ditemukan</div>

                {isMobile ? (
                  /* Mobile: list card */
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                            <span style={{ ...styles.pill, ...pillStyle[status] }}>{d.penyakit}</span>
                            <span style={{ fontWeight: 500, color: '#1e293b', fontSize: 13 }}>{d.confidence}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Desktop: tabel */
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.theadRow}>
                          <th style={styles.th}>Waktu</th>
                          <th style={styles.th}>Hasil Deteksi</th>
                          <th style={styles.th}>Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deteksiData.length === 0 ? (
                          <tr><td colSpan={3} style={styles.empty}>Tidak ada data</td></tr>
                        ) : deteksiData.map((d, i) => {
                          const status = getStatus(d.penyakit);
                          return (
                            <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
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
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  sectionLabel:    { fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
  card:            { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  topRow:          { display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' },
  tabRow:          { display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 },
  tabBtn:          { padding: '6px 14px', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'transparent', color: '#64748b' },
  tabActive:       { background: '#fff', color: '#1e293b', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  filterRow:       { display: 'flex', alignItems: 'center', gap: 6 },
  dateInput:       { border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 6px', fontSize: 11, color: '#334155', background: '#f8fafc' },
  sensorGrid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  tableTitle:      { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 },
  dot:             { width: 8, height: 8, borderRadius: '50%' },
  tableWrap:       { overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', maxHeight: 400, overflowY: 'auto' },
  table:           { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  theadRow:        { background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 },
  th:              { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' },
  td:              { padding: '8px 12px', borderBottom: '0.5px solid #f1f5f9', verticalAlign: 'middle' },
  chip:            { background: '#f1f5f9', color: '#334155', padding: '2px 7px', borderRadius: 6, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' },
  empty:           { textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 },
  pill:            { fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 999 },

  // Mobile card styles
  mobileCard:      { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 8 },
  mobileCardHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mobileCardRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  mobileCardLabel: { fontSize: 11, color: '#64748b' },
  mobileChip:      { background: '#fff', border: '1px solid #e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 },
};