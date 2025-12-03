import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'weekly_report_rows_v1';

const DEFAULT_COLUMNS = [
  'SE','Project name','Support','PIC','Project','Segment','Owner','Est.units','Model','Location','Delivery Time','Action Items','Next Step','PIC'
];

export default function WeeklyReport({ projects = [] }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setRows(JSON.parse(raw)); return; } catch (e) { /* ignore */ }
    }
    // start with one empty row
    setRows([{ id: Date.now(), data: DEFAULT_COLUMNS.reduce((acc, c) => ({ ...acc, [c]: '' }), {}) }]);
  }, []);

  function addRow() {
    setRows(r => [...r, { id: Date.now() + Math.random(), data: DEFAULT_COLUMNS.reduce((acc, c) => ({ ...acc, [c]: '' }), {}) }]);
  }

  function updateCell(rowId, col, value) {
    setRows(r => r.map(row => row.id === rowId ? { ...row, data: { ...row.data, [col]: value } } : row));
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    alert('Weekly report saved locally');
  }

  function importFromProject(rowId, projectIndex) {
    const p = projects[projectIndex];
    if (!p) return;
    setRows(r => r.map(row => row.id === rowId ? { ...row, data: { ...row.data, 'Project name': p[5] || '', 'Project': p[5] || '', 'Location': p[13] || '' } } : row));
  }

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>Weekly Report</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addRow} style={{ padding: '8px 10px' }}>+ Add row</button>
          <button onClick={save} className="btn-primary">Save</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {DEFAULT_COLUMNS.map(c => (
                <th key={c} style={{ border: '1px solid #eee', padding: 8, background: '#fafafa', fontSize: 12 }}>{c}</th>
              ))}
              <th style={{ border: '1px solid #eee', padding: 8, background: '#fafafa' }}>Project</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                {DEFAULT_COLUMNS.map(col => (
                  <td key={col} style={{ border: '1px solid #eee', padding: 6 }}>
                    <input value={row.data[col] || ''} onChange={e => updateCell(row.id, col, e.target.value)} style={{ width: 220, padding: 6 }} />
                  </td>
                ))}
                <td style={{ border: '1px solid #eee', padding: 6 }}>
                  <select onChange={e => importFromProject(row.id, Number(e.target.value))} defaultValue="">
                    <option value="">— choose project to import —</option>
                    {projects.map((p, idx) => (
                      <option key={idx} value={idx}>{p[5]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
