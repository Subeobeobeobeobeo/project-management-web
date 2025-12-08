import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import AddProjectModal from './components/AddProjectModal';
import WeeklyReport from './components/WeeklyReport';
import CalendarView from './components/CalendarView';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { API_BASE } from './config';

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export default function App() {
  const [projects, setProjects] = useState([]);
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [winningFilter, setWinningFilter] = useState([]);
  const [sortOption, setSortOption] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [showListingControls, setShowListingControls] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);

  const filterBtnRef = useRef(null);
  const popoverRef = useRef(null);
  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);

  const fetchProjects = async () => {
    try {
      console.log('[App] Fetching projects from', `${API_BASE}/api/projects`);
      const res = await fetch(`${API_BASE}/api/projects`);
      console.log('[App] Response status:', res.status);
      const data = await res.json();
      console.log('[App] Data received:', data);
      const rows = data.values || [];
      console.log('[App] Number of rows:', rows.length);
      const normalized = rows.map((row, i) => {
        const copy = Array.isArray(row) ? row.slice() : [];
        const v = copy[4] && copy[4].toString().trim();
        if (!v || !/^https?:\/\//i.test(v)) copy[4] = `https://picsum.photos/seed/${i}/600/360`;
        return copy;
      });
      setProjects(normalized);
      console.log('[App] Projects set:', normalized.length);
    } catch (err) {
      console.error('[App] fetchProjects error:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeFilters = () => {
    setFilterOpen(false);
  };

  useEffect(() => {
    if (!filterOpen) return undefined;
    const handleClickAway = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(event.target)
      ) {
        closeFilters();
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') closeFilters();
    };
    window.addEventListener('mousedown', handleClickAway);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [filterOpen]);

  const handleCreateProject = async (newProject) => {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject)
    });
    if (!res.ok) throw new Error(await res.text());
    const created = await res.json();
    if (Array.isArray(created)) {
      const v = created[4] && created[4].toString().trim();
      if (!v || !/^https?:\/\//i.test(v)) created[4] = `https://picsum.photos/seed/${projects.length}/600/360`;
      setProjects(prev => [...prev, created]);
    }
    setShowAddModal(false);
    setActiveTab('projects');
  };

  const handleUpdateProject = async (updatedProject, rowIdx) => {
    const targetIndex = typeof rowIdx === 'number' ? rowIdx : selectedIndex;
    if (targetIndex == null) return;
    const sheetRow = targetIndex + 7;
    const res = await fetch(`${API_BASE}/api/projects/${sheetRow}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject)
    });
    if (!res.ok) throw new Error(await res.text());
    const updatedArray = await res.json();
    if (Array.isArray(updatedArray)) {
      const v = updatedArray[4] && updatedArray[4].toString().trim();
      if (!v || !/^https?:\/\//i.test(v)) updatedArray[4] = `https://picsum.photos/seed/${targetIndex}/600/360`;
    }
    // Refetch all projects to ensure calendar updates correctly
    await fetchProjects();
    setSelectedProject(updatedArray);
  };

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const bySearch = projects.filter(p => (p[5] || '').toString().toLowerCase().includes(term));

    const byWinning = winningFilter.length > 0
      ? bySearch.filter(p => {
          const rate = (p[20] || '').toString().replace('%', '').trim();
          return winningFilter.includes(rate);
        })
      : bySearch;

    const byDate = rangeFrom || rangeTo
      ? byWinning.filter(p => {
          const nd = p[25];
          if (!nd) return false;
          const parsed = Date.parse(nd);
          if (Number.isNaN(parsed)) return false;
          const d = new Date(parsed);
          if (rangeFrom) {
            const from = new Date(rangeFrom);
            if (d < from) return false;
          }
          if (rangeTo) {
            const to = new Date(rangeTo);
            to.setHours(23, 59, 59, 999);
            if (d > to) return false;
          }
          return true;
        })
      : byWinning;

    if (!sortOption) return byDate;
    const sorted = [...byDate];
    if (sortOption === 'price-desc') sorted.sort((a, b) => Number(b[18] || 0) - Number(a[18] || 0));
    if (sortOption === 'price-asc') sorted.sort((a, b) => Number(a[18] || 0) - Number(b[18] || 0));
    if (sortOption === 'quantity-desc') sorted.sort((a, b) => Number(b[17] || 0) - Number(a[17] || 0));
    if (sortOption === 'quantity-asc') sorted.sort((a, b) => Number(a[17] || 0) - Number(b[17] || 0));
    return sorted;
  }, [projects, searchTerm, winningFilter, rangeFrom, rangeTo, sortOption]);

  const cleanProjects = useMemo(() => {
    return filteredProjects.filter(p => {
      const name = (p[5] || '').toString().trim();
      if (!name) return false;
      return name.toLowerCase() !== 'project name';
    });
  }, [filteredProjects]);

  const homeSummary = useMemo(() => {
    const cleanMetric = (value, headerLabel) => {
      if (value == null) return '—';
      const text = value.toString().trim();
      if (!text) return '—';
      if (headerLabel && text.toLowerCase() === headerLabel.toLowerCase()) return '—';
      return text;
    };

    const totalDeals = cleanProjects.length;
    const totalQty = cleanProjects.reduce((sum, p) => sum + safeNumber(p[17]), 0);
    
    // Calculate average winning rate from all projects
    const winningRates = cleanProjects
      .map(p => parseFloat((p[20] || '').toString().replace('%', '').trim()))
      .filter(v => !isNaN(v) && v > 0);
    const avgWinningRate = winningRates.length > 0
      ? (winningRates.reduce((a, b) => a + b, 0) / winningRates.length).toFixed(1) + '%'
      : '0%';

    // Calculate total forecast from all projects (Forecast FY or Carry-Over Qty)
    const totalForecast = cleanProjects.reduce((sum, p) => {
      const forecast = safeNumber(p[30]) || safeNumber(p[31]) || 0;
      return sum + forecast;
    }, 0);
    const forecastDisplay = totalForecast > 0 
      ? numberFormatter.format(Math.round(totalForecast))
      : '0';

    // Count deliveries in next 30 days
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);
    
    const deliveriesIn30Days = cleanProjects.filter(p => {
      const dateStr = (p[25] || '').toString().trim();
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return !isNaN(date) && date >= now && date <= in30Days;
    }).length;
    
    const nextDelivery = deliveriesIn30Days > 0 
      ? `${deliveriesIn30Days} project${deliveriesIn30Days > 1 ? 's' : ''}`
      : 'None';

    // Count deliveries for next year (Delivery Year column index 24)
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    
    const deliveriesNextYear = cleanProjects.filter(p => {
      const yearStr = (p[24] || '').toString().trim();
      const year = parseInt(yearStr);
      return !isNaN(year) && year === nextYear;
    }).length;
    
    const nextYearDelivery = deliveriesNextYear > 0 
      ? `${deliveriesNextYear} project${deliveriesNextYear > 1 ? 's' : ''}`
      : 'None';

    // Get highlight project (first project for description)
    const highlight = cleanProjects[0];
    const highlightName = cleanMetric(highlight?.[5], 'Project Name');

    return {
      totalDeals,
      totalQty,
      totalQtyLabel: numberFormatter.format(totalQty || 0),
      highlightName,
      winningRate: avgWinningRate,
      forecast: forecastDisplay,
      nextDelivery,
      nextYearDelivery
    };
  }, [cleanProjects, numberFormatter]);

  const openProjects = () => {
    setShowCalendar(false);
    setShowWeekly(false);
    setShowAddModal(false);
  };

  const openCalendar = () => {
    setActiveTab('calendar');
    setShowCalendar(true);
    setShowWeekly(false);
    setShowAddModal(false);
  };

  const openWeekly = () => {
    setActiveTab('weekly');
    setShowWeekly(true);
    setShowCalendar(false);
    setShowAddModal(false);
  };

  const openAddProject = () => {
    setActiveTab('add');
    setShowAddModal(true);
  };

  const renderMain = () => {
    if (showAddModal) {
      return (
        <AddProjectModal
          onClose={() => {
            setShowAddModal(false);
            setActiveTab('projects');
          }}
          onCreate={handleCreateProject}
        />
      );
    }
    if (activeTab === 'home') {
      return <Dashboard projects={filteredProjects} />;
    }
    if (showWeekly) {
      return <WeeklyReport projects={filteredProjects} />;
    }
    if (showCalendar) {
      return (
        <CalendarView
          projects={filteredProjects}
          onEditEvent={(upd, idx) => {
            const proj = filteredProjects[idx];
            const globalIdx = projects.findIndex(p => p === proj);
            if (globalIdx === -1) return;
            handleUpdateProject(upd, globalIdx);
          }}
        />
      );
    }
    return (
      <ProjectList
        projects={filteredProjects}
        onSelect={(p) => {
          let globalIdx = projects.findIndex(item => item === p);
          if (globalIdx === -1) {
            globalIdx = projects.findIndex(pr => (pr[5] || '') === (p[5] || ''));
          }
          setSelectedProject(p);
          setSelectedIndex(globalIdx === -1 ? null : globalIdx);
        }}
      />
    );
  };

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  const showIdentityCard = activeTab === 'home';
  const highlightSentence = homeSummary.highlightName === '—'
    ? 'No highlighted project in the current filters.'
    : `Highlight: ${homeSummary.highlightName}. Winning rate ${homeSummary.winningRate} with next delivery ${homeSummary.nextDelivery}.`;

  return (
    <div className="app-root">
      <Sidebar
        active={activeTab}
        onChange={setActiveTab}
        onAddProject={openAddProject}
        onOpenCalendar={openCalendar}
        onOpenWeekly={openWeekly}
        onOpenProjects={openProjects}
      />

      <div className={`app-main ${showCalendar ? 'calendar-active' : ''}`}>
        <div className="app-main-layout">
          <div className="content-card">
            {showIdentityCard && (
              <section className={`home-identity-block ${profileExpanded ? 'expanded' : 'collapsed'}`}>
                <aside className="identity-card">
                  <div className="identity-card__shine" />
                  <div className="identity-card__avatar">
                    <img 
                      src={require('./assets/loan-avatar.png')}
                      alt="Loan Nguyen - Senior Sales Executive"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://ui-avatars.com/api/?name=Loan+Nguyen&size=400&background=bc0e09&color=fff&bold=true&format=svg';
                      }}
                    />
                  </div>
                  <div className="identity-card__label">★ Top Performer 2025</div>
                  <h3 className="identity-card__name">Loan Nguyen</h3>
                  <p className="identity-card__role">Sales Project Director</p>
                  
                  <div className="identity-card__badges">
                    <span className="identity-card__badge">🏆 Top 5%</span>
                    <span className="identity-card__badge">📈 Q4 Leader</span>
                  </div>
                  
                  <div className="identity-card__divider" />
                  
                  <div className="identity-card__stats">
                    <div>
                      <span>Active Deals</span>
                      <strong>367</strong>
                    </div>
                    <div>
                      <span>Total Volume</span>
                      <strong>$1.000.000.000</strong>
                    </div>
                  </div>
                  
                  <button 
                    className="identity-card__cta"
                    onClick={() => setProfileExpanded(!profileExpanded)}
                  >
                    {profileExpanded ? '← Collapse Profile' : 'View Full Profile →'}
                  </button>
                </aside>

                {profileExpanded && (
                  <div className="home-identity-brief">
                    <div className="sales-pulse-header">
                      <p className="home-identity-chip">💼 Sales Performance Dashboard</p>
                      <div className="sales-pulse-period">December 2025 • Q4 Summary</div>
                    </div>
                    
                    <h2 className="sales-pulse-title">
                      <span className="highlight-number">{homeSummary.totalDeals}</span> Active Opportunities
                    </h2>
                    
                    <div className="sales-pulse-insight">
                      <div className="insight-icon">📊</div>
                      <div>
                        <p className="insight-label">Top Project Highlight</p>
                        <p className="home-identity-sub">{highlightSentence}</p>
                      </div>
                    </div>
                    
                    <div className="home-identity-metrics">
                      <div className="metric-card">
                        <span>Success Rate</span>
                        <strong>{homeSummary.winningRate}</strong>
                        <div className="metric-trend">↑ +12% vs last quarter</div>
                      </div>
                      <div className="metric-card">
                        <span>Pipeline Value</span>
                        <strong>{homeSummary.forecast}</strong>
                        <div className="metric-trend">↑ +8% growth</div>
                      </div>
                      <div className="metric-card">
                        <span>Next 30 Days</span>
                        <strong>{homeSummary.nextDelivery}</strong>
                        <div className="metric-trend">⏰ On schedule</div>
                      </div>
                      <div className="metric-card">
                        <span>Next Year (2026)</span>
                        <strong>{homeSummary.nextYearDelivery}</strong>
                        <div className="metric-trend">📅 Planned ahead</div>
                      </div>
                    </div>
                    
                    <div className="sales-pulse-footer">
                      <div className="achievement-badge">
                        <span className="badge-icon">⚡</span>
                        <div>
                          <div className="badge-title">Performance Streak</div>
                          <div className="badge-desc">5 consecutive quarters exceeding targets</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'projects' && (
              <div className="realest-page">
                <div className="realest-hero">
                  <div className="search-container">
                    <div className="search-icon">🔍</div>
                    <input
                      className="hero-input search-input-enhanced"
                      placeholder="Search projects by name, location, or product..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button 
                        className="search-clear"
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="realest-hero-actions">
                    <button 
                      className={`hero-filter-btn ${showListingControls ? 'active' : ''}`}
                      onClick={() => setShowListingControls(prev => !prev)}
                    >
                      <span className="filter-icon">{showListingControls ? '✓' : '⚙'}</span>
                      {showListingControls ? 'Hide Filters' : 'Show Filters'}
                    </button>
                  </div>
                  {showListingControls && (
                    <div className="hero-controls-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
                      <label style={{ flex: '1 1 180px' }}>
                        <span>Sort by</span>
                        <select
                          value={sortOption}
                          onChange={e => setSortOption(e.target.value)}
                          className="hero-input"
                        >
                          <option value="">Default order</option>
                          <option value="price-desc">Price: High → Low</option>
                          <option value="price-asc">Price: Low → High</option>
                          <option value="quantity-desc">Quantity: High → Low</option>
                          <option value="quantity-asc">Quantity: Low → High</option>
                        </select>
                      </label>
                      <label style={{ flex: '1 1 160px' }}>
                        <span>From date</span>
                        <input type="date" className="hero-input" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} />
                      </label>
                      <label style={{ flex: '1 1 160px' }}>
                        <span>To date</span>
                        <input type="date" className="hero-input" value={rangeTo} onChange={e => setRangeTo(e.target.value)} />
                      </label>
                      <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div className="filter-heading" style={{ marginBottom: 8 }}>Winning Rate</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            onClick={() =>
                              setWinningFilter(prev =>
                                prev.includes('100') ? prev.filter(x => x !== '100') : [...prev, '100']
                              )
                            }
                            style={{
                              padding: '10px 16px',
                              border: '1px solid rgba(15,23,42,0.1)',
                              borderRadius: 8,
                              background: winningFilter.includes('100') ? 'rgba(15,23,42,0.12)' : '#fff',
                              fontWeight: winningFilter.includes('100') ? 600 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            100%
                          </button>
                          <button
                            onClick={() =>
                              setWinningFilter(prev =>
                                prev.includes('50') ? prev.filter(x => x !== '50') : [...prev, '50']
                              )
                            }
                            style={{
                              padding: '10px 16px',
                              border: '1px solid rgba(15,23,42,0.1)',
                              borderRadius: 8,
                              background: winningFilter.includes('50') ? 'rgba(15,23,42,0.12)' : '#fff',
                              fontWeight: winningFilter.includes('50') ? 600 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            50%
                          </button>
                          <button
                            onClick={() =>
                              setWinningFilter(prev =>
                                prev.includes('0') ? prev.filter(x => x !== '0') : [...prev, '0']
                              )
                            }
                            style={{
                              padding: '10px 16px',
                              border: '1px solid rgba(15,23,42,0.1)',
                              borderRadius: 8,
                              background: winningFilter.includes('0') ? 'rgba(15,23,42,0.12)' : '#fff',
                              fontWeight: winningFilter.includes('0') ? 600 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            0%
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}



            <div className="content-body">
              <main className="main-content">{renderMain()}</main>
            </div>
          </div>
        </div>
      </div>

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          rowIndex={selectedIndex}
          onClose={() => setSelectedProject(null)}
          onUpdate={handleUpdateProject}
        />
      )}
    </div>
  );
}
