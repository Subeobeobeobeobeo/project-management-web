import React from 'react';

function Sidebar({ onAddProject, onOpenCalendar, onOpenProjects, onOpenWeekly, active, onChange }) {
  return (
    <header className="top-header">
      <div className="top-container">
        <div className="floating-nav-shell">
          <div className="floating-nav-title">Sales Management System</div>
          <nav className="top-nav">
            <button
              onClick={() => {
                onChange?.('home');
                onOpenProjects && onOpenProjects();
              }}
              className={`nav-btn ${active === 'home' ? 'active' : ''}`}
            >Home</button>
            <button
              onClick={() => {
                onChange?.('projects');
                onOpenProjects && onOpenProjects();
              }}
              className={`nav-btn ${active === 'projects' ? 'active' : ''}`}
            >Danh sách dự án</button>
            <button
              onClick={() => {
                onAddProject && onAddProject();
              }}
              className={`nav-btn ${active === 'add' ? 'active' : ''}`}
            >Thêm dự án</button>
            <button
              onClick={() => {
                onChange?.('calendar');
                onOpenCalendar && onOpenCalendar();
              }}
              className={`nav-btn ${active === 'calendar' ? 'active' : ''}`}
            >Calendar</button>
          </nav>
        </div>
        <div className="top-avatar" />
      </div>
    </header>
  );
}

export default Sidebar;