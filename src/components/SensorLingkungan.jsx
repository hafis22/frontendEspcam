import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const API = 'https://backendescam-production-cc88.up.railway.app';
const colors = { temperature: '#ef4444', humidity: '#0ea5e9', lux: '#f59e0b' };
const units  = { temperature: '°C', humidity: '%', lux: 'lx' };

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
        <div style={{ fontWeight: 500, color: '#1e293b' }}>{payload[0].value} {payload[0].unit}</div>
        <div style={{ color: '#475569' }}>{d.time}</div>
        <div style={{ color: '#475569' }}>{d.date}</div>
      </div>
    );
  }
  return null;
}

function Modal({ label, icon, chartKey, histori, onClose }) {
  const data   = histori[chartKey] || [];
  const color  = colors[chartKey];
  const unit   = units[chartKey];
  const latest = data[data.length - 1];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#1e293b' }}>{label}</span>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        {latest ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 36, fontWeight: 500, color }}>{latest.v}</span>
              <span style={{ fontSize: 16, color: '#475569' }}>{unit}</span>
            </div>
            <div style={{ fontSize: 12, color: '#000000', marginBottom: 20 }}>{latest.date} — {latest.time}</div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Belum ada data</div>
        )}
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#000000' }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fontSize: 11, fill: '#000000' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="natural" dataKey="v" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} unit={unit} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 20, borderTop: '0.5px solid #e2e8f0', paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 6, padding: '0 4px' }}>
            <span>Waktu</span><span>Tanggal</span><span style={{ textAlign: 'right' }}>Nilai</span>
          </div>
          {[...data].reverse().map((d, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 12, padding: '6px 4px', borderRadius: 6, background: i === 0 ? '#f8fafc' : 'transparent' }}>
              <span style={{ color: '#475569' }}>{d.time}</span>
              <span style={{ color: '#475569' }}>{d.date}</span>
              <span style={{ fontWeight: 500, textAlign: 'right', color }}>{d.v} {unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniLineChart({ chartKey, histori }) {
  const data = histori[chartKey] || [];
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data}>
        <Line type="natural" dataKey="v" stroke={colors[chartKey]} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
        <Tooltip content={<CustomTooltip />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MetricCard({ icon, label, value, unit, chartKey, histori }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={styles.card} onClick={() => setOpen(true)}>
        <div style={{ fontSize: 14, marginBottom: 6 }}>{icon}</div>
        <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: '#1e293b', lineHeight: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{unit}</div>
        <div style={{ marginTop: 8 }}><MiniLineChart chartKey={chartKey} histori={histori} /></div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, textAlign: 'right' }}>Tap untuk detail →</div>
      </div>
      {open && <Modal label={label} icon={icon} chartKey={chartKey} histori={histori} onClose={() => setOpen(false)} />}
    </>
  );
}

function SensorLingkungan({ data }) {
  const [histori, setHistori] = useState({ temperature: [], humidity: [], lux: [] });

  useEffect(() => {
    const fetchHistory = () => {
      fetch(`${API}/api/history/sensor`)
        .then(r => r.json())
        .then(rows => {
          if (!Array.isArray(rows)) return;
          const toPoint = (r, key) => ({
            v:    r.lingkungan?.[key] ?? 0,
            time: new Date(r.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(r.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          });
          const sorted = [...rows].reverse().slice(0, 20);
          setHistori({
            temperature: sorted.map(r => toPoint(r, 'temperature')),
            humidity:    sorted.map(r => toPoint(r, 'humidity')),
            lux:         sorted.map(r => toPoint(r, 'lux')),
          });
        })
        .catch(() => {});
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={styles.sectionLabel}>Sensor lingkungan</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <MetricCard label="Temperature" value={data.temperature} unit="°C" chartKey="temperature" histori={histori} />
        <MetricCard label="Humidity"    value={data.humidity}    unit="%"  chartKey="humidity"    histori={histori} />
        <MetricCard label="Lux"         value={data.lux}         unit="lx" chartKey="lux"         histori={histori} />
      </div>
    </div>
  );
}

const styles = {
  sectionLabel: { fontSize: 11, fontWeight: 600, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
  card:    { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:   { background: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  closeBtn:    { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#64748b', padding: '2px 6px' },
};

export default SensorLingkungan;
