import React, { useState, useMemo } from 'react';
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

function buildEventsFromProjects(projects = [], year, month) {
  const events = [];
  
  console.log('[Calendar] Building events for', { year, month, projectCount: projects.length });
  
  projects.forEach((proj, idx) => {
    const nd = proj[25];
    const projectName = proj[5] || `Project ${idx + 1}`;
    const status = proj[21] || '';
    const winningRate = proj[20] || '';
    
    // Next Delivery event - show in the month it occurs
    if (nd) {
      const d = parseISODate(nd);
      if (d) {
        console.log('[Calendar] Project', projectName, 'next delivery:', nd, '-> parsed:', d);
        if (d.getFullYear() === year && d.getMonth() === month) {
          events.push({
            id: `nd-${idx}`,
            title: `${projectName} - Delivery`,
            date: d.getDate() || 1,
            time: 'Delivery',
            type: 'delivery',
            status,
            winningRate,
            projectIndex: idx
          });
        }
      }
    }

    // Monthly forecasts - always show forecasts for each month regardless of year
    // Monthly forecast columns represent planned quantities, not dated events
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const currentMonthName = monthNames[month];
    const col = monthHeaderIndex[currentMonthName];
    const qty = Number(proj[col] || 0);
    
    if (qty > 0) {
      console.log('[Calendar] Project', projectName, 'forecast for', currentMonthName, ':', qty);
      events.push({
        id: `forecast-${idx}-${currentMonthName}`,
        title: `${projectName} (${qty} units)`,
        date: 1,
        time: `${qty} units`,
        type: 'forecast',
        status,
        winningRate,
        qty,
        projectIndex: idx,
        monthName: currentMonthName
      });
    }
  });
  
  console.log('[Calendar] Total events built:', events.length);
  return events;
}

export default function CalendarViewFixed({ projects = [], onEditEvent }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [recentlyMoved, setRecentlyMoved] = useState(new Map()); // Map of projectName -> targetMonth

  // Build all events for the entire year
  const allYearEvents = useMemo(() => {
    const eventsByMonth = {};
    for (let month = 0; month < 12; month++) {
      eventsByMonth[month] = buildEventsFromProjects(projects, currentYear, month);
    }
    return eventsByMonth;
  }, [projects, currentYear]);

  const goToPreviousYear = () => {
    setCurrentYear(currentYear - 1);
  };

  const goToNextYear = () => {
    setCurrentYear(currentYear + 1);
  };

  const handleEditEvent = (evt, e) => {
    e.stopPropagation();
    const project = projects[evt.projectIndex];
    if (project) {
      const monthIdx = Object.keys(allYearEvents).find(m => allYearEvents[m].some(e => e.id === evt.id));
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      
      setEditingEvent({
        ...evt,
        projectName: project[5] || '',
        productName: project[16] || '',
        quantity: evt.qty || 0,
        originalMonth: monthIdx,
        monthName: monthNames[parseInt(monthIdx)]
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEvent || !onEditEvent) return;
    
    const updatedData = {
      'Project Name': editingEvent.projectName,
      'Product Name': editingEvent.productName
    };

    if (editingEvent.type === 'forecast') {
      updatedData[editingEvent.monthName] = String(editingEvent.quantity);
    }

    try {
      await onEditEvent(updatedData, editingEvent.projectIndex);
      setEditingEvent(null);
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  const handleDragStart = (evt, sourceMonth, e) => {
    console.log('[Calendar] Drag started:', evt.title, 'from month', sourceMonth);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEvent({ ...evt, sourceMonth });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (targetMonth) => {
    if (!draggedEvent || !onEditEvent) {
      console.log('[Calendar] Drop cancelled - no dragged event or onEditEvent');
      return;
    }
    
    const sourceMonthNum = parseInt(draggedEvent.sourceMonth);
    const targetMonthNum = parseInt(targetMonth);
    
    console.log('[Calendar] Dropped on month', targetMonthNum, 'from', sourceMonthNum);
    
    if (sourceMonthNum === targetMonthNum) {
      console.log('[Calendar] Same month, ignoring');
      setDraggedEvent(null);
      return;
    }

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const project = projects[draggedEvent.projectIndex];
    
    if (!project) {
      console.error('[Calendar] Project not found at index', draggedEvent.projectIndex);
      setDraggedEvent(null);
      return;
    }
    
    if (draggedEvent.type === 'forecast') {
      // Get current quantity from source month
      const sourceCol = monthHeaderIndex[monthNames[sourceMonthNum]];
      const targetCol = monthHeaderIndex[monthNames[targetMonthNum]];
      const currentQty = Number(project[sourceCol] || 0);
      const targetCurrentQty = Number(project[targetCol] || 0);
      
      console.log('[Calendar] Moving', currentQty, 'units from', monthNames[sourceMonthNum], '(col', sourceCol, ') to', monthNames[targetMonthNum], '(col', targetCol, ')');
      console.log('[Calendar] Source qty:', currentQty, 'Target current qty:', targetCurrentQty);
      
      if (currentQty > 0) {
        // Calculate new target quantity, handle NaN
        const newTargetQty = (isNaN(targetCurrentQty) ? 0 : targetCurrentQty) + currentQty;
        
        // Update: clear source, add to target
        const updatedData = {};
        updatedData[monthNames[sourceMonthNum]] = '0';
        updatedData[monthNames[targetMonthNum]] = String(newTargetQty);
        
        console.log('[Calendar] Sending update:', updatedData, 'for project index', draggedEvent.projectIndex);
        
        try {
          await onEditEvent(updatedData, draggedEvent.projectIndex);
          console.log('[Calendar] ✓ Move successful, should refetch now');
          
          // Track moved project by name with target month for 5 seconds
          const projectName = project[5] || `Project ${draggedEvent.projectIndex}`;
          const trackKey = `${projectName}-${targetMonthNum}`;
          
          setRecentlyMoved(prev => {
            const next = new Map(prev);
            next.set(trackKey, { projectName, targetMonth: targetMonthNum });
            console.log('[Calendar] Tracking moved project:', trackKey);
            return next;
          });
          
          setTimeout(() => {
            setRecentlyMoved(prev => {
              const next = new Map(prev);
              next.delete(trackKey);
              console.log('[Calendar] Removing highlight for:', trackKey);
              return next;
            });
          }, 5000);
        } catch (err) {
          console.error('[Calendar] ✗ Move failed:', err);
          alert('Failed to move: ' + err.message);
        }
      } else {
        console.log('[Calendar] No quantity to move');
      }
    } else {
      console.log('[Calendar] Not a forecast event, type:', draggedEvent.type);
    }
    
    setDraggedEvent(null);
  };

  // Get current and upcoming events
  const currentMonthEvents = allYearEvents[today.getMonth()] || [];
  const upcomingMonthsEvents = Object.keys(allYearEvents)
    .map(Number)
    .filter(m => m > today.getMonth())
    .flatMap(m => allYearEvents[m])
    .slice(0, 5);



  return (
    <div className="fantastical-calendar">
      <div className="calendar-sidebar">
        <div className="sidebar-header">
          <h2>{currentYear}</h2>
          <div className="view-controls">
            <button onClick={goToPreviousYear} className="nav-btn">‹</button>
            <button onClick={goToNextYear} className="nav-btn">›</button>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <h3>THIS MONTH ({MONTHS[today.getMonth()]})</h3>
            <span className="event-count">{currentMonthEvents.length} events</span>
          </div>
          {currentMonthEvents.length > 0 ? (
            currentMonthEvents.slice(0, 5).map(evt => (
              <div key={evt.id} className="sidebar-event">
                <div className="event-indicator" style={{ background: evt.type === 'delivery' ? '#3b82f6' : '#f59e0b' }}></div>
                <div className="event-details">
                  <div className="event-name">{evt.title}</div>
                  <div className="event-time">{evt.time}</div>
                  {evt.status && <div className="event-meta">{evt.status}</div>}
                </div>
              </div>
            ))
          ) : (
            <div className="no-events">No events this month</div>
          )}
          {currentMonthEvents.length > 5 && (
            <div className="more-events-link">+{currentMonthEvents.length - 5} more events</div>
          )}
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <h3>UPCOMING MONTHS</h3>
          </div>
          {upcomingMonthsEvents.length > 0 ? (
            upcomingMonthsEvents.map(evt => (
              <div key={evt.id} className="sidebar-event">
                <div className="event-indicator" style={{ background: evt.type === 'delivery' ? '#10b981' : '#f59e0b' }}></div>
                <div className="event-details">
                  <div className="event-name">{evt.title}</div>
                  <div className="event-time">{evt.time}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-events">No upcoming events</div>
          )}
        </div>
      </div>

      <div className="calendar-main">
        <div className="calendar-topbar">
          <div className="topbar-left">
            <button onClick={goToPreviousYear} className="nav-arrow">‹</button>
            <h2 className="calendar-year-title">{currentYear}</h2>
            <button onClick={goToNextYear} className="nav-arrow">›</button>
          </div>
          <div className="topbar-right">
            <input type="text" placeholder="Search projects..." className="search-input" />
          </div>
        </div>

        <div className="year-view">
          {MONTHS.map((monthName, monthIdx) => {
            const monthEvents = allYearEvents[monthIdx] || [];
            
            return (
              <div 
                key={monthIdx} 
                className={`year-month-card ${draggedEvent && 'drop-target'}`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => {
                  e.preventDefault();
                  console.log('[Calendar] Drag enter month', monthIdx);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  console.log('[Calendar] Drop detected on month', monthIdx);
                  handleDrop(monthIdx);
                }}
              >
                <div className="year-month-header">
                  <h3>{monthName} {currentYear}</h3>
                  <span className="event-count">{monthEvents.length} projects</span>
                </div>
                <div className="year-month-events">
                  {monthEvents.length > 0 ? (
                    monthEvents.map(evt => {
                      const project = projects[evt.projectIndex];
                      const projectName = project ? (project[5] || `Project ${evt.projectIndex}`) : '';
                      const trackKey = `${projectName}-${monthIdx}`;
                      const isRecentlyMoved = recentlyMoved.has(trackKey);
                      return (
                        <div 
                          key={evt.id} 
                          className={`year-event ${evt.type} ${draggedEvent?.id === evt.id ? 'dragging' : ''} ${isRecentlyMoved ? 'recently-moved' : ''}`}
                          draggable={evt.type === 'forecast'}
                          onDragStart={(e) => handleDragStart(evt, monthIdx, e)}
                        >
                          <span className="event-dot"></span>
                          <div className="event-content">
                            <div className="event-label">
                              {evt.title}
                              {isRecentlyMoved && <span className="moved-badge">✓ Moved</span>}
                            </div>
                            <div className="event-meta-text">{evt.time}</div>
                          </div>
                          {evt.type === 'forecast' && (
                            <button 
                              className="event-edit-btn"
                              onClick={(e) => handleEditEvent(evt, e)}
                              title="Edit project"
                            >
                              ✎
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-events">No projects this month</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingEvent && (
        <div className="modal-backdrop" onClick={() => setEditingEvent(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Project</h3>
              <button className="close-btn" onClick={() => setEditingEvent(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingEvent.projectName}
                  onChange={(e) => setEditingEvent({ ...editingEvent, projectName: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingEvent.productName}
                  onChange={(e) => setEditingEvent({ ...editingEvent, productName: e.target.value })}
                />
              </div>
              {editingEvent.type === 'forecast' && (
                <div className="form-row">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingEvent.quantity}
                    onChange={(e) => setEditingEvent({ ...editingEvent, quantity: Number(e.target.value) })}
                  />
                </div>
              )}
              <div className="form-row">
                <label className="form-label">Month</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingEvent.monthName}
                  disabled
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditingEvent(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
