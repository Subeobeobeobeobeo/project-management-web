import React, { useState, useMemo, useEffect } from 'react';
import './CalendarView.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const monthHeaderIndex = {
  JAN: 32, FEB: 33, MAR: 34, APR: 35, MAY: 36, JUN: 37,
  JUL: 38, AUG: 39, SEP: 40, OCT: 41, NOV: 42, DEC: 43,
};

function parseISODate(s) {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d)) {
    const p = s.split(/[-/]/).map(Number);
    if (p.length >= 3) return new Date(p[0], p[1] - 1, p[2]);
    return null;
  }
  return d;
}

function buildEventsFromProjects(projects = [], year, month, recentlyMovedMap = new Map()) {
  const events = [];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const currentMonthName = monthNames[month];

  projects.forEach((proj, idx) => {
    const projectName = proj[5] || `Project ${idx + 1}`;
    const nd = proj[25];
    const status = proj[21] || '';
    const winningRate = proj[20] || '';

    if (nd) {
      const d = parseISODate(nd);
      if (d && d.getFullYear() === year && d.getMonth() === month) {
        events.push({ id: `nd-${idx}`, title: `${projectName} - Delivery`, date: d.getDate() || 1, time: 'Delivery', type: 'delivery', status, winningRate, projectIndex: idx, projectName, monthName: currentMonthName });
      }
    }

    const col = monthHeaderIndex[currentMonthName];
    const rawValue = proj[col];
    const qty = Number(rawValue || 0);
    const invalids = ['-', '0', 0, '', null, undefined, ' ', 'N/A', 'n/a', 'NA', 'na', 'null', 'undefined'];
    if (qty > 0 && !invalids.includes(String(rawValue).trim())) {
      events.push({ id: `forecast-${idx}-${currentMonthName}`, title: `${projectName} (${qty} units)`, projectName, date: 1, time: `${qty} units`, type: 'forecast', status, winningRate, qty, projectIndex: idx, monthName: currentMonthName });
    }
  });

  events.sort((a, b) => {
    const aMoved = Array.from(recentlyMovedMap.values()).some(v => v.projectName === a.projectName && v.targetMonth === month);
    const bMoved = Array.from(recentlyMovedMap.values()).some(v => v.projectName === b.projectName && v.targetMonth === month);
    if (aMoved !== bMoved) return aMoved ? -1 : 1;
    const aQty = a.qty || 0;
    const bQty = b.qty || 0;
    if (aQty !== bQty) return bQty - aQty;
    return (a.projectName || '').localeCompare(b.projectName || '');
  });

  return events;
}

export default function CalendarViewFixed2({ projects = [], onEditEvent, recentlyMovedMap = new Map() }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ projectName: '', quantity: '', month: 0, year: today.getFullYear(), searchQuery: '' });

  useEffect(() => {}, [recentlyMovedMap]);

  const allYearEvents = useMemo(() => {
    const map = {};
    for (let m = 0; m < 12; m++) map[m] = buildEventsFromProjects(projects, currentYear, m, recentlyMovedMap);
    return map;
  }, [projects, currentYear, recentlyMovedMap]);

  const goToPreviousYear = () => setCurrentYear(currentYear - 1);
  const goToNextYear = () => setCurrentYear(currentYear + 1);

  const handleSaveEdit = async () => {
    if (!editingEvent || !onEditEvent) return;
    const updated = { 'Project Name': editingEvent.projectName, 'Product Name': editingEvent.productName };
    if (editingEvent.type === 'forecast') updated[editingEvent.monthName] = String(editingEvent.quantity || '0');
    try { await onEditEvent(updated, editingEvent.projectIndex); setEditingEvent(null); } catch (err) { alert('Failed to update: ' + (err?.message || err)); }
  };

  const handleDragStart = (evt, sourceMonth, e) => { const composite = { projectName: evt.projectName, qty: evt.qty, monthName: evt.monthName, type: evt.type, sourceMonth }; e.dataTransfer.effectAllowed = 'move'; setDraggedEvent(composite); };

  const handleDrop = async (targetMonth) => {
    if (!draggedEvent) return setDraggedEvent(null);
    if (!onEditEvent) return setDraggedEvent(null);
    const src = Number(draggedEvent.sourceMonth);
    const tgt = Number(targetMonth);
    if (src === tgt) return setDraggedEvent(null);
    const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const foundIndex = projects.findIndex(p => { const name = (p[5] || '').toString(); const qty = Number(p[monthHeaderIndex[draggedEvent.monthName]] || 0); return name === draggedEvent.projectName && qty === draggedEvent.qty && draggedEvent.monthName === monthNames[src]; });
    if (foundIndex === -1) { setDraggedEvent(null); return; }
    const project = projects[foundIndex];
    if (draggedEvent.type === 'forecast') {
      const monthNamesArr = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const sourceCol = monthHeaderIndex[monthNamesArr[src]];
      const qty = Number(project[sourceCol] || 0);
      if (qty > 0) { const updated = {}; updated[monthNamesArr[src]] = '0'; updated[monthNamesArr[tgt]] = String(qty); try { await onEditEvent(updated, foundIndex, tgt); } catch (err) { console.error('move failed', err); } }
    }
    setDraggedEvent(null);
  };

  const filteredProjects = useMemo(() => {
    if (!newEvent.searchQuery) return [];
    const q = newEvent.searchQuery.toLowerCase();
    return projects.filter(p => { const name = (p[5] || '').toString().toLowerCase(); const product = (p[16] || '').toString().toLowerCase(); return name.includes(q) || product.includes(q); });
  }, [projects, newEvent.searchQuery]);

  const handleEditClick = (evt, monthIdx) => {
    const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const foundIndex = projects.findIndex(p => { const name = (p[5] || '').toString(); const qty = Number(p[monthHeaderIndex[evt.monthName]] || 0); return name === evt.projectName && (evt.type !== 'forecast' || qty === evt.qty) && evt.monthName === monthNames[monthIdx]; });
    if (foundIndex === -1) { alert('Could not find project'); return; }
    const proj = projects[foundIndex];
    setEditingEvent({ projectIndex: foundIndex, projectName: proj[5] || '', productName: proj[16] || '', quantity: evt.qty || 0, monthName: evt.monthName, type: evt.type });
  };

  return (
    <div className="calendar-root">
      <div className="calendar-topbar">
        <div className="topbar-left">
          <button className="nav-arrow" onClick={goToPreviousYear}>‹</button>
          <h2 className="calendar-year-title">{currentYear}</h2>
          <button className="nav-arrow" onClick={goToNextYear}>›</button>
        </div>
        <div className="topbar-right">
          <button className="add-event-btn" onClick={() => setShowAddModal(true)}>+ Add Event</button>
          <input type="text" placeholder="Search projects by name or product..." className="search-input" value={newEvent.searchQuery} onChange={e => setNewEvent({ ...newEvent, searchQuery: e.target.value })} />
        </div>
      </div>

      {newEvent.searchQuery && (
        <div className="calendar-search-results">
          {filteredProjects.length === 0 && <div className="no-results">No matching projects</div>
          }
          {filteredProjects.map((p, i) => (
            <div key={i} className="search-item" onClick={() => setEditingEvent({ projectIndex: projects.indexOf(p), projectName: p[5] || '', productName: p[16] || '', type: 'forecast' })}>
              <div className="event-label">{p[5]}</div>
              <div className="event-meta-text">{p[16]}</div>
            </div>
          ))}
        </div>
      )}

      <div className="year-view">
        {MONTHS.map((monthName, monthIdx) => {
          const monthEvents = allYearEvents[monthIdx] || [];
          return (
            <div key={monthIdx} className="year-month-card" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleDrop(monthIdx); }}>
              <div className="year-month-header"><h3>{monthName} {currentYear}</h3><span className="event-count">{monthEvents.length} projects</span></div>
              <div className="year-month-events">
                {monthEvents.length === 0 && <div className="no-events">No projects this month</div>}
                {monthEvents.map(evt => {
                  const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
                  const foundIndex = projects.findIndex(p => { const name = (p[5] || '').toString(); const qty = Number(p[monthHeaderIndex[evt.monthName]] || 0); return name === evt.projectName && (evt.type !== 'forecast' || qty === evt.qty) && evt.monthName === monthNames[monthIdx]; });
                  if (foundIndex === -1) return null;
                  const proj = projects[foundIndex];
                  const projectName = proj[5] || '';
                  const isRecentlyMoved = Array.from(recentlyMovedMap.values()).some(v => v.projectName === projectName && v.targetMonth === monthIdx);
                  return (
                    <div key={evt.id} className={`year-event ${evt.type} ${isRecentlyMoved ? 'recently-moved' : ''}`} draggable={evt.type === 'forecast'} onDragStart={e => handleDragStart(evt, monthIdx, e)} onClick={() => handleEditClick(evt, monthIdx)}>
                      <span className="event-dot" />
                      <div className="event-content"><div className="event-label">{evt.title}</div><div className="event-meta-text">{evt.time}</div></div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add New Event</h3><button className="close-btn" onClick={() => setShowAddModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-row"><label className="form-label">Project Name</label><input className="form-input" value={newEvent.projectName} onChange={e => setNewEvent({ ...newEvent, projectName: e.target.value })} /></div>
              <div className="form-row"><label className="form-label">Quantity</label><input type="number" className="form-input" value={newEvent.quantity} onChange={e => setNewEvent({ ...newEvent, quantity: e.target.value })} /></div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button><button className="btn-primary" onClick={async () => { if (!onEditEvent) return; try { const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']; const updated = { 'Project Name': newEvent.projectName }; updated[monthNames[newEvent.month || 0]] = String(newEvent.quantity || '0'); const existing = projects.findIndex(p => (p[5] || '').toLowerCase() === (newEvent.projectName || '').toLowerCase()); await onEditEvent(updated, existing >= 0 ? existing : projects.length); setShowAddModal(false); setNewEvent({ projectName: '', quantity: '', month: 0, year: today.getFullYear(), searchQuery: '' }); } catch (err) { alert('Failed to add: ' + (err?.message || err)); } }}>Add</button></div>
          </div>
        </div>
      )}

      {editingEvent && (
        <div className="modal-backdrop" onClick={() => setEditingEvent(null)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Edit Project</h3><button className="close-btn" onClick={() => setEditingEvent(null)}>×</button></div>
            <div className="modal-body">
              <div className="form-row"><label className="form-label">Project Name</label><input className="form-input" value={editingEvent.projectName} onChange={e => setEditingEvent({ ...editingEvent, projectName: e.target.value })} /></div>
              <div className="form-row"><label className="form-label">Product Name</label><input className="form-input" value={editingEvent.productName} onChange={e => setEditingEvent({ ...editingEvent, productName: e.target.value })} /></div>
              {editingEvent.type === 'forecast' && <div className="form-row"><label className="form-label">Quantity</label><input type="number" className="form-input" value={editingEvent.quantity} onChange={e => setEditingEvent({ ...editingEvent, quantity: Number(e.target.value) })} /></div>}
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={() => setEditingEvent(null)}>Cancel</button><button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button></div>
          </div>
        </div>
      )}

    </div>
  );
}
