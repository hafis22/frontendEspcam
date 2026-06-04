import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const now = new Date();
const buatHistori = (base, amplitude, noise) =>
  Array.from({ length: 12 }, (_, i) => ({
    v: +(base + Math.sin(i * 0.7) * amplitude + Math.random() * noise).toFixed(2),
    time: new Date(now - (11 - i) * 5 * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    date: new Date(now - (11 - i) * 5 * 60000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
  }));

const histori = {
  temperature: buatHistori(26, 1.5, 0.5),
  humidity:    buatHistori(80, 4, 1),
  ph:          buatHistori(6.5, 0.3, 0.1),
  ec:          buatHistori(1.2, 0.2, 0.05),
  nitrogen:    buatHistori(150, 20, 5),
  fosfor:      buatHistori(45, 8, 2),
  kalium:      buatHistori(200, 25, 5),
};

const params = [
  { key: 'temperature', label: 'Temp',     unit: '°C',    color: '#ef4444' },
  { key: 'humidity',    label: 'Humidity', unit: '%',     color: '#0ea5e9' },
  { key: 'ph',          label: 'pH',       unit: '',      color: '#16a34a' },
  { key: 'ec',          label: 'EC',       unit: 'mS/cm', color: '#8b5cf6' },
  { key: 'nitrogen',    label: 'Nitrogen', unit: 'mg/L',  color: '#22c55e' },
  { key: 'fosfor',      label: 'Fosfor',   unit: 'mg/L',  color: '#3b82f6' },
  { key: 'kalium',      label: 'Kalium',   unit: 'mg/L',  color: '#a855f7' },
];

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

function BarRow({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: '#475569', width: 70 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, width: 44, textAlign: 'right', color: '#1e293b' }}>{value}</span>
    </div>
  );
}

function SensorTanaman({ data, isMobile = false }) {
  const [active, setActive] = useState('temperature');
  const activeParam = params.find(p => p.key === active);
  const activeData  = histori[active];
  const latest      = activeData[activeData.length - 1];

  // Hanya 4 parameter di pill (NPK sudah ada di bar bawah)
  const metrics = [
    { key: 'temperature', label: 'Temp',     value: data.temperature, unit: '°C' },
    { key: 'humidity',    label: 'Humidity', value: data.humidity,    unit: '%' },
    { key: 'ph',          label: 'pH',       value: data.ph,          unit: '', highlight: true },
    { key: 'ec',          label: 'EC',       value: data.ec,          unit: 'mS/cm' },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={styles.sectionLabel}>Sensor tanaman</p>
      <div style={styles.card}>

        {/* Pill row */}
        <div style={isMobile ? styles.pillScroll : styles.pillRow}>
          {metrics.map((m) => {
            const p = params.find(p => p.key === m.key);
            const isActive = active === m.key;
            return (
              <div key={m.key} onClick={() => setActive(m.key)} style={{
                ...styles.pillItem,
                borderColor: isActive ? p.color : '#e2e8f0',
                background:  isActive ? p.color + '18' : '#f8fafc',
                ...(isMobile ? { minWidth: 80 } : {}),
              }}>
                <div style={{ fontSize: isMobile ? 10 : 11, color: '#475569', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 500, color: isActive ? p.color : '#1e293b' }}>{m.value}</div>
                <div style={{ fontSize: isMobile ? 9 : 10, color: '#64748b' }}>{m.unit || (m.highlight ? 'normal' : '')}</div>
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: '0.5px solid #e2e8f0', paddingTop: 16, marginTop: 4 }}>

          {/* Header grafik */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: activeParam.color }}>{latest.v}</span>
            <span style={{ fontSize: 13, color: '#475569' }}>{activeParam.unit}</span>
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>
              {activeParam.label} — {latest.time}, {latest.date}
            </span>
          </div>

          {/* Grafik */}
          <ResponsiveContainer width="100%" height={isMobile ? 140 : 180}>
            <LineChart data={activeData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="natural"
                dataKey="v"
                stroke={activeParam.color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: activeParam.color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                unit={activeParam.unit}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* NPK Bar */}
          <div style={{ marginTop: 16, borderTop: '0.5px solid #e2e8f0', paddingTop: 14 }}>
            <BarRow label="Nitrogen" value={data.nitrogen} max={250} color="#22c55e" />
            <BarRow label="Fosfor"   value={data.fosfor}   max={200} color="#3b82f6" />
            <BarRow label="Kalium"   value={data.kalium}   max={250} color="#a855f7" />
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  sectionLabel: { fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
  card:         { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  pillRow:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 },
  pillScroll:   { display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 },
  pillItem:     { border: '1.5px solid', borderRadius: 10, padding: '8px 10px', textAlign: 'center', transition: 'all 0.15s', cursor: 'pointer' },
};

export default SensorTanaman;