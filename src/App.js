import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SensorLingkungan from './components/SensorLingkungan';
import SensorTanaman from './components/SensorTanaman';
import DeteksiPenyakit from './components/DeteksiPenyakit';
import History from './components/History';

export const API = 'https://backendescam-production.up.railway.app';

function DashboardIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fff' : '#86efac'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function CameraIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fff' : '#86efac'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function HistoryIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fff' : '#86efac'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a9 9 0 0 1 9 9c0 3.5-2 6.5-5 8l-4 3-4-3c-3-1.5-5-4.5-5-8a9 9 0 0 1 9-9z"/>
      <path d="M12 6v6l3 2"/>
    </svg>
  );
}

const tabs = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'kamera',    label: 'Deteksi' },
  { key: 'history',   label: 'History' },
];

export default function App() {
  const [page, setPage]         = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sensor, setSensor]     = useState({
    lingkungan: { temperature: 0, humidity: 0, lux: 0 },
    tanaman:    { temperature: 0, humidity: 0, ph: 0, ec: 0, nitrogen: 0, fosfor: 0, kalium: 0 },
  });

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/api/sensor`);
        setSensor(res.data);
      } catch {
        console.log('Gagal ambil data sensor');
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const TabIcon = ({ tabKey, active }) => {
    if (tabKey === 'dashboard') return <DashboardIcon active={active} />;
    if (tabKey === 'kamera')    return <CameraIcon    active={active} />;
    if (tabKey === 'history')   return <HistoryIcon   active={active} />;
    return null;
  };

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>

        {/* Kiri: logo + judul */}
        <div style={styles.headerLeft}>
          <div style={styles.logoWrap}><LogoIcon /></div>
          <div>
            <div style={styles.headerSub}>Monitoring Sistem</div>
            <div style={styles.headerTitle}>
              {isMobile ? 'Smart Farm' : 'Smart Farm Dashboard'}
            </div>
          </div>
        </div>

        {/* Tengah: tab — desktop only */}
        {!isMobile && (
          <div style={styles.tabWrap}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setPage(t.key)}
                style={{ ...styles.tabBtn, ...(page === t.key ? styles.tabActive : {}) }}>
                <TabIcon tabKey={t.key} active={page === t.key} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Kanan */}
        <div style={styles.headerRight}>
          {!isMobile && <span style={styles.headerDate}>{today}</span>}
          <span style={styles.badgeLive}>● Live</span>

          {/* Hamburger — mobile only */}
          {isMobile && (
            <button style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="#86efac" strokeWidth="2" strokeLinecap="round">
                {menuOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                }
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={styles.mobileMenu}>
          {tabs.map(t => (
            <button key={t.key}
              onClick={() => { setPage(t.key); setMenuOpen(false); }}
              style={{ ...styles.mobileItem, ...(page === t.key ? styles.mobileItemActive : {}) }}>
              <TabIcon tabKey={t.key} active={page === t.key} />
              <span style={{ marginLeft: 10, fontSize: 14 }}>{t.label}</span>
            </button>
          ))}
          <div style={{ fontSize: 11, color: '#86efac', padding: '8px 20px 12px' }}>{today}</div>
        </div>
      )}

      {/* Konten */}
      <div style={styles.content}>
        {page === 'dashboard' && (
          <>
            <SensorLingkungan data={sensor.lingkungan} isMobile={isMobile} />
            <SensorTanaman    data={sensor.tanaman}    isMobile={isMobile} />
          </>
        )}
        {page === 'kamera'  && <DeteksiPenyakit isMobile={isMobile} />}
        {page === 'history' && <History         isMobile={isMobile} />}
      </div>

    </div>
  );
}

const styles = {
  page:            { minHeight: '100vh', background: '#e5ecd9', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' },
  header:          { background: '#227242', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 0 16px 16px', position: 'sticky', top: 0, zIndex: 100 },
  headerLeft:      { display: 'flex', alignItems: 'center', gap: 10 },
  logoWrap:        { width: 36, height: 36, background: '#166534', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerSub:       { fontSize: 10, color: '#86efac', marginBottom: 1 },
  headerTitle:     { fontSize: 14, fontWeight: 600, color: '#f0fdf4' },
  tabWrap:         { display: 'flex', background: '#0f3d1a', borderRadius: 10, padding: 3, gap: 2 },
  tabBtn:          { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: 'transparent', color: '#86efac', fontWeight: 400 },
  tabActive:       { background: '#166534', color: '#fff', fontWeight: 500 },
  headerRight:     { display: 'flex', alignItems: 'center', gap: 10 },
  headerDate:      { fontSize: 11, color: '#86efac' },
  badgeLive:       { background: '#166534', color: '#86efac', fontSize: 11, padding: '3px 8px', borderRadius: 999, fontWeight: 500 },
  hamburger:       { background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: 4 },
  content:         { padding: '16px 20px' },
  mobileMenu:      { background: '#227242', display: 'flex', flexDirection: 'column', borderRadius: '0 0 12px 12px', overflow: 'hidden', position: 'sticky', top: 60, zIndex: 99 },
  mobileItem:      { display: 'flex', alignItems: 'center', padding: '13px 20px', border: 'none', background: 'transparent', color: '#86efac', cursor: 'pointer' },
  mobileItemActive:{ background: '#166534', color: '#fff' },
};