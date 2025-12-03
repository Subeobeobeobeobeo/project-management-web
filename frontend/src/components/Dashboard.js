import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Dashboard.css';
import { API_BASE } from '../config';

// small city to coordinate map for Vietnam (approximate)
const CITY_COORDS = {
  hanoi: [21.0278, 105.8342],
  "ho chi minh": [10.8231, 106.6297],
  hcm: [10.8231, 106.6297],
  danang: [16.0544, 108.2022],
  "da nang": [16.0544, 108.2022],
  hue: [16.4637, 107.5909],
  nha_trang: [12.2388, 109.1967],
  cantho: [10.0452, 105.7469],
  "can tho": [10.0452, 105.7469],
  haiphong: [20.8449, 106.6881],
  "hai phong": [20.8449, 106.6881],
};

// duplicate of backend headers (must match server.js)
const SHEET_HEADERS = [
  'Sales PIC','Project ID','Sub ID','Project Code','Project Link','Project Name',
  'Project Segment','Project Type','Developer','Contractor','Designer','Competitor',
  'Area','Location','Distributor','Product Code','Product Name','Total Quantity',
  'Price','Total Turnover','Winning Rate','Status','Note','Creation Week','Delivery Year',
  'Next Delivery','MTD Invoice','YTD Invoice','Invoiced PY','Open PL Qty','Forecast FY',
  'Carry-Over Qty','JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC',
  'Specs','Spec Year','SAP name','KEY','PL key','Lat','Lng'
];

function safeNum(v) { 
  if (v === null || v === undefined || v === '') return 0;
  // Remove commas and convert to number
  const cleaned = typeof v === 'string' ? v.replace(/,/g, '') : v;
  const n = Number(cleaned); 
  return Number.isFinite(n) ? n : 0; 
}

export default function Dashboard({ projects = [] }) {
  const [fetchedProjects, setFetchedProjects] = useState(null);
  const [mounted, setMounted] = useState(false);
  const projectsList = useMemo(() => {
    const rawProjects = (projects && projects.length) ? projects : (fetchedProjects || []);
    // Filter out header rows - check if Total Qty column is a number
    return rawProjects.filter(p => {
      const totalQty = p[17];
      // If it's "Total Quantity" text or not a valid number, it's a header
      return totalQty && totalQty !== 'Total Quantity' && !isNaN(Number(totalQty));
    });
  }, [projects, fetchedProjects]);
  const [showDebug] = useState(false);
  // show table by default for Top Projects area
  const [showTable, setShowTable] = useState(true);
  const [chartTip, setChartTip] = useState({ visible: false, x: 0, y: 0, label: '', value: 0 });
  const [monthDetailModal, setMonthDetailModal] = useState({ visible: false, month: '', projects: [] });
  const [selectedMonth, setSelectedMonth] = useState(null); // null = show all year, number = specific month
  

  
  // metrics computed from projectsList (either prop or fetched)
  const totalProjects = projectsList.length;
  const totalQuantity = useMemo(() => projectsList.reduce((s,p)=> s + safeNum(p[17]), 0), [projectsList]);
  const totalTurnover = useMemo(() => projectsList.reduce((s,p)=> s + safeNum(p[19] || p[18]), 0), [projectsList]);
  const avgWinning = useMemo(() => {
    const vals = projectsList.map(p => parseFloat((p[20]||'').toString().replace('%',''))).filter(v=>!isNaN(v));
    if (!vals.length) return 0; return (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
  }, [projectsList]);

  const totalOpenPL = useMemo(() => projectsList.reduce((s,p)=> s + safeNum(p[29]), 0), [projectsList]);
  const avgPrice = useMemo(() => {
    const vals = projectsList.map(p=> safeNum(p[18])).filter(v=>v>0);
    if (!vals.length) return 0; return (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(0);
  }, [projectsList]);

  // YTD Invoice (column 27)
  const ytdInvoice = useMemo(() => projectsList.reduce((s,p)=> s + safeNum(p[27]), 0), [projectsList]);
  
  // MTD Invoice (column 26)
  const mtdInvoice = useMemo(() => projectsList.reduce((s,p)=> s + safeNum(p[26]), 0), [projectsList]);
  
  // Forecast FY (column 30)
  const forecastFY = useMemo(() => projectsList.reduce((s,p)=> s + safeNum(p[30]), 0), [projectsList]);

  const topByQty = useMemo(() => {
    return (projectsList || []).filter(p => safeNum(p[17])>0).slice().sort((a,b)=> safeNum(b[17]) - safeNum(a[17]));
  }, [projectsList]);

  // next delivery related: column 25 holds Next Delivery date string
  const upcomingNextDeliveryCount = useMemo(()=>{
    const now = new Date();
    const in30 = new Date(); in30.setDate(now.getDate()+30);
    return projectsList.reduce((cnt,p)=>{
      const txt = (p[25]|| '').toString().trim();
      if(!txt) return cnt;
      const d = new Date(txt);
      if(!isNaN(d) && d >= now && d <= in30) return cnt+1;
      return cnt;
    },0);
  }, [projectsList]);

  // monthly totals from JAN..DEC (columns assumed 32..43)
  const monthlyTotals = useMemo(()=>{
    const months = Array(12).fill(0);
    projectsList.forEach(p=>{
      for(let i=0;i<12;i++){ const col = 32 + i; months[i] += safeNum(p[col]); }
    });
    return months;
  }, [projectsList]);

  // get projects with values for specific month (with additional metrics)
  const getProjectsForMonth = useCallback((monthIndex) => {
    const col = 32 + monthIndex;
    return projectsList
      .map((p, idx) => {
        const monthQty = safeNum(p[col]);
        const totalProjectQty = safeNum(p[17]);
        const totalTurnover = safeNum(p[19]);
        const price = safeNum(p[18]);
        
        // Calculate proportional turnover for this month
        const monthTurnover = totalProjectQty > 0 
          ? (monthQty / totalProjectQty) * totalTurnover 
          : 0;
        
        return { 
          project: p, 
          value: monthQty, 
          originalIndex: idx,
          price: price,
          turnover: monthTurnover,
          winningRate: parseFloat((p[20]||'').toString().replace('%','')) || 0,
          productName: p[16] || 'Unknown',
          projectName: p[5] || 'Unknown'
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [projectsList]);

  // Calculate insights for selected month or all year
  const chartInsights = useMemo(() => {
    let projectsToAnalyze = [];
    let previousMonthQty = 0;
    let currentMonthQty = 0;
    
    if (selectedMonth !== null) {
      // Specific month selected
      projectsToAnalyze = getProjectsForMonth(selectedMonth);
      currentMonthQty = monthlyTotals[selectedMonth];
      
      // Get previous month for growth comparison
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      previousMonthQty = monthlyTotals[prevMonth];
    } else {
      // All year - get all projects with any monthly quantity
      const allProjects = new Map();
      
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthProjects = getProjectsForMonth(monthIndex);
        monthProjects.forEach(item => {
          const key = item.originalIndex;
          if (allProjects.has(key)) {
            const existing = allProjects.get(key);
            existing.value += item.value;
            existing.turnover += item.turnover;
          } else {
            allProjects.set(key, { ...item });
          }
        });
      }
      
      projectsToAnalyze = Array.from(allProjects.values()).sort((a, b) => b.value - a.value);
      
      // For year view, compare H2 vs H1
      const h1Total = monthlyTotals.slice(0, 6).reduce((sum, v) => sum + v, 0);
      const h2Total = monthlyTotals.slice(6, 12).reduce((sum, v) => sum + v, 0);
      previousMonthQty = h1Total;
      currentMonthQty = h2Total;
    }
    
    if (projectsToAnalyze.length === 0) {
      return {
        topProject: null,
        topProduct: null,
        topDeveloper: null,
        growthPercent: 0,
        growthDirection: 'neutral'
      };
    }
    
    // Top project by quantity
    const topProject = projectsToAnalyze[0];
    
    // Count products
    const productCounts = {};
    projectsToAnalyze.forEach(item => {
      const product = item.productName;
      if (!productCounts[product]) {
        productCounts[product] = { name: product, count: 0, totalQty: 0 };
      }
      productCounts[product].count += 1;
      productCounts[product].totalQty += item.value;
    });
    
    // Find top product by total quantity
    const topProduct = Object.values(productCounts)
      .filter(p => p.name !== 'Unknown')
      .sort((a, b) => b.totalQty - a.totalQty)[0] || null;
    
    // Count developers
    const developerCounts = {};
    projectsToAnalyze.forEach(item => {
      const developer = item.project[8] || 'Unknown'; // Column 8 is Developer
      if (!developerCounts[developer]) {
        developerCounts[developer] = { name: developer, count: 0, totalQty: 0 };
      }
      developerCounts[developer].count += 1;
      developerCounts[developer].totalQty += item.value;
    });
    
    // Find top developer by project count
    const topDeveloper = Object.values(developerCounts)
      .filter(d => d.name !== 'Unknown' && d.name !== '')
      .sort((a, b) => b.count - a.count)[0] || null;
    
    // Calculate growth percentage
    let growthPercent = 0;
    let growthDirection = 'neutral';
    
    if (previousMonthQty > 0) {
      growthPercent = ((currentMonthQty - previousMonthQty) / previousMonthQty) * 100;
      growthDirection = growthPercent > 0 ? 'up' : growthPercent < 0 ? 'down' : 'neutral';
    } else if (currentMonthQty > 0) {
      growthPercent = 100;
      growthDirection = 'up';
    }
    
    return {
      topProject,
      topProduct,
      topDeveloper,
      growthPercent,
      growthDirection
    };
  }, [selectedMonth, monthlyTotals, getProjectsForMonth]);

  // monthly metrics (count, total value, avg price)
  const monthlyMetrics = useMemo(() => {
    const metrics = Array(12).fill(0).map((_, monthIndex) => {
      const col = 32 + monthIndex; // Monthly quantity column (JAN=32, FEB=33, etc.)
      const projectsWithQty = projectsList.filter(p => safeNum(p[col]) > 0);
      
      // Debug first month with actual data
      if (monthIndex === 0 && projectsWithQty.length > 0) {
        const p = projectsWithQty[0];
        console.log('🔍 Debug Month 0 - First Project:', {
          'Project Name': p[5],
          'Jan Qty (col 32)': p[32],
          'Total Qty (col 17)': p[17],
          'Price (col 18)': p[18],
          'Total Turnover (col 19)': p[19],
          'Win Rate (col 20)': p[20]
        });
      }
      
      const totalQty = projectsWithQty.reduce((sum, p) => sum + safeNum(p[col]), 0);
      
      // Calculate proportional value based on monthly quantity vs total quantity
      let totalValue = 0;
      projectsWithQty.forEach(p => {
        const monthQty = safeNum(p[col]);
        const totalProjectQty = safeNum(p[17]); // Total Quantity column
        const totalTurnover = safeNum(p[19]); // Total Turnover column
        const price = safeNum(p[18]); // Price column
        
        let projectValue = 0;
        // Try proportional turnover first, fallback to qty * price
        if (totalProjectQty > 0 && totalTurnover > 0) {
          projectValue = (monthQty / totalProjectQty) * totalTurnover;
        } else if (price > 0) {
          projectValue = monthQty * price;
        }
        
        totalValue += projectValue;
      });
      
      const avgPrice = totalQty > 0 ? totalValue / totalQty : 0;
      const avgWinRate = projectsWithQty.length > 0 
        ? projectsWithQty.reduce((sum, p) => {
            const rate = parseFloat((p[20]||'').toString().replace('%',''));
            return sum + (isNaN(rate) ? 0 : rate);
          }, 0) / projectsWithQty.length
        : 0;
      
      const result = {
        count: projectsWithQty.length,
        quantity: totalQty,
        value: totalValue,
        avgPrice,
        avgWinRate
      };
      

      
      return result;
    });
    return metrics;
  }, [projectsList]);

  // map container
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geocodeCacheRef = useRef({});

  useEffect(() => {
    // If no projects provided, try fetching from API endpoint (uses CRA proxy if configured)
    if ((!projects || !projects.length) && fetchedProjects === null) {
      fetch(`${API_BASE}/api/projects`).then(r=>r.json()).then(data=>{
        // backend returns { values: [...] } or a raw array
        const vals = data && data.values ? data.values : (Array.isArray(data) ? data : []);
        const norm = (vals || []).map((row,i)=>{
          const copy = Array.isArray(row) ? row.slice() : [];
          const v = copy[4] && copy[4].toString().trim();
          if (!v || !/^https?:\/\//i.test(v)) copy[4] = `https://picsum.photos/seed/${i}/600/360`;
          return copy;
        });
        setFetchedProjects(norm);
      }).catch((err)=>{ console.error('Failed to fetch projects:', err); setFetchedProjects([]); });
    }
  }, [projects, fetchedProjects]);

  // load saved layout settings from backend or localStorage
  // (removed layout load UI — layout is configured via CSS in code)

  useEffect(() => {
    // trigger mount animation
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  
  useEffect(() => {
    // lazy-load Leaflet CSS + script if not available and then add markers with optional geocoding
    async function ensureLeafletAndMarkers() {
      if (!mapRef.current) return;
      if (!(window.L && window.L.map)) {
        if (!document.getElementById('leaflet-css')){
          const lnk = document.createElement('link'); lnk.id='leaflet-css'; lnk.rel='stylesheet'; lnk.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lnk);
        }
        if (!document.getElementById('leaflet-js')){
          await new Promise((res)=>{ const s = document.createElement('script'); s.id='leaflet-js'; s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = res; document.body.appendChild(s); });
        } else {
          await new Promise((res)=>{ const check = setInterval(()=>{ if(window.L && window.L.map){ clearInterval(check); res(); } },200); });
        }
        
        // Load Leaflet MarkerCluster plugin
        if (!document.getElementById('leaflet-markercluster-css')){
          const css = document.createElement('link');
          css.id = 'leaflet-markercluster-css';
          css.rel = 'stylesheet';
          css.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
          document.head.appendChild(css);
          
          const css2 = document.createElement('link');
          css2.id = 'leaflet-markercluster-default-css';
          css2.rel = 'stylesheet';
          css2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
          document.head.appendChild(css2);
        }
        
        if (!document.getElementById('leaflet-markercluster-js')){
          await new Promise((res)=>{ 
            const s = document.createElement('script'); 
            s.id='leaflet-markercluster-js'; 
            s.src='https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'; 
            s.onload = res; 
            document.body.appendChild(s); 
          });
        } else {
          await new Promise((res)=>{ 
            const check = setInterval(()=>{ 
              if(window.L && window.L.markerClusterGroup){ 
                clearInterval(check); 
                res(); 
              } 
            },200); 
          });
        }
      }

      // init map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      const L = window.L;
      
      // Vietnam bounds: Southwest and Northeast corners
      const vietnamBounds = L.latLngBounds(
        L.latLng(8.18, 102.14),  // Southwest corner
        L.latLng(23.39, 109.46)  // Northeast corner
      );
      
      // Create map without any tile layer first
      const map = L.map(mapRef.current, { 
        scrollWheelZoom: true,
        minZoom: 1,
        maxZoom: 10,
        maxBounds: vietnamBounds,
        maxBoundsViscosity: 1.0,
        zoomControl: true,
        worldCopyJump: false,
        attributionControl: false
      }).fitBounds(vietnamBounds, { padding: [10, 10] });
      
      // Lock map to Vietnam bounds strictly
      map.setMaxBounds(vietnamBounds);
      
      // Add a light base map layer with lower opacity so GeoJSON shows on top
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 19,
        opacity: 0.5
      }).addTo(map);
      
      // Define regions BEFORE loading GeoJSON
      const regionDefs = {
        north: { 
          name: 'Miền Bắc',
          latRange: [18, 24],
          projects: [], 
          color: '#8b5cf6' // Purple
        },
        central: { 
          name: 'Miền Trung',
          latRange: [11.5, 18],
          projects: [], 
          color: '#06b6d4' // Cyan
        },
        south: { 
          name: 'Miền Nam',
          latRange: [8, 11.5],
          projects: [], 
          color: '#10b981' // Green
        }
      };
      
      const regionLayers = {};
      
      // Load Vietnam GeoJSON and fill with gradient color
      console.log('🗺️ Loading Vietnam GeoJSON...');
      
      fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
        .then(res => {
          console.log('📡 GeoJSON fetch response:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('📦 GeoJSON data loaded, features:', data.features.length);
          
          // Try different property names
          const vietnam = data.features.find(f => 
            f.properties.ADMIN === 'Vietnam' || 
            f.properties.NAME === 'Vietnam' ||
            f.properties.name === 'Vietnam' ||
            f.properties.ADMIN === 'Viet Nam' ||
            f.properties.NAME === 'Viet Nam' ||
            f.properties.sovereignt === 'Vietnam' ||
            f.properties.admin === 'Vietnam'
          );
          
          if (!vietnam) {
            // Log first few countries to see what property names exist
            console.log('🔍 Sample features:', data.features.slice(0, 3).map(f => f.properties));
            console.error('❌ Vietnam not found in GeoJSON');
            return;
          }
          
          console.log('✅ Vietnam GeoJSON found:', vietnam.properties);
          
          // Draw single Vietnam layer with gradient fill
          const vietnamLayer = L.geoJSON(vietnam, {
            style: {
              fillColor: '#8b5cf6',
              fillOpacity: 0.6,
              color: '#6b21a8',
              weight: 2.5,
              opacity: 1
            },
            onEachFeature: (feature, geoLayer) => {
              // Bind tooltip that updates based on mouse position
              geoLayer.on('mousemove', function(e) {
                const lat = e.latlng.lat;
                let region = regionDefs.south;
                
                if (lat >= 18) region = regionDefs.north;
                else if (lat >= 11.5) region = regionDefs.central;
                
                const tooltipHtml = `
                  <div style="padding:14px 18px;font-family:system-ui,-apple-system,sans-serif;min-width:180px;">
                    <div style="font-weight:800;font-size:18px;margin-bottom:8px;background:linear-gradient(135deg, #6b21a8, #8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${region.name}</div>
                    <div style="color:#64748b;font-size:15px;margin-bottom:10px;font-weight:600;display:flex;align-items:center;gap:8px;">
                      <span style="width:12px;height:12px;background:${region.color};border-radius:50%;display:inline-block;"></span>
                      ${region.projects.length} dự án
                    </div>
                    <div style="font-size:12px;color:#94a3b8;font-style:italic;">👆 Click để xem chi tiết</div>
                  </div>
                `;
                
                this.unbindTooltip();
                this.bindTooltip(tooltipHtml, { sticky: true, className: 'region-tooltip' });
              });
              
              geoLayer.on('click', function(e) {
                const lat = e.latlng.lat;
                let clickedRegion = regionDefs.south;
                
                if (lat >= 18) {
                  clickedRegion = regionDefs.north;
                } else if (lat >= 11.5) {
                  clickedRegion = regionDefs.central;
                }
                
                console.log(`🎯 Clicked on ${clickedRegion.name} - showing ${clickedRegion.projects.length} projects`);
                
                // Remove cluster layer and clear markers
                map.removeLayer(markerCluster);
                markerCluster.clearLayers();
                allMarkers.length = 0;
                markersAdded.clear();
                
                // Zoom to region
                const bounds = [[clickedRegion.latRange[0], 102], [clickedRegion.latRange[1], 110]];
                map.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
                
                // Add markers for this region only after zoom completes
                setTimeout(() => {
                  const markerCountBefore = allMarkers.length;
                  
                  clickedRegion.projects.forEach(({ p, idx, coord }) => {
                    addMarker(p, idx, coord);
                  });
                  
                  // Add cluster layer to map
                  map.addLayer(markerCluster);
                  
                  const markerCountAfter = allMarkers.length;
                  const markersAddedCount = markerCountAfter - markerCountBefore;
                  
                  markersVisible = true;
                  console.log(`✅ ${clickedRegion.name}: Attempted ${clickedRegion.projects.length} projects, actually added ${markersAddedCount} markers in ${markerCluster.getLayers().length} clustered items`);
                  
                  if (markersAddedCount < clickedRegion.projects.length) {
                    const uniqueLocations = new Set(clickedRegion.projects.map(({coord}) => `${coord[0]},${coord[1]}`));
                    console.log(`ℹ️ ${clickedRegion.projects.length} projects at ${uniqueLocations.size} unique locations`);
                  }
                }, 300);
              });
            }
          });
          
          vietnamLayer.addTo(map);
          regionLayers['vietnam'] = vietnamLayer;
          
          console.log('✅ Vietnam layer added to map');
          
          // Apply SVG linear gradient to fill with 3 colors based on latitude
          setTimeout(() => {
            const overlayPane = map.getPanes().overlayPane;
            const svg = overlayPane.querySelector('svg:last-child');
            
            if (svg) {
              // Create linear gradient definition
              const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
              gradient.setAttribute('id', 'vietnamGradient');
              gradient.setAttribute('x1', '0%');
              gradient.setAttribute('y1', '0%');
              gradient.setAttribute('x2', '0%');
              gradient.setAttribute('y2', '100%');
              
              // Vietnam latitude range: 8.18 to 23.39
              // Calculate gradient positions based on actual Vietnam bounds
              const vietnamMinLat = 8.18;
              const vietnamMaxLat = 23.39;
              const vietnamLatRange = vietnamMaxLat - vietnamMinLat;
              
              // Calculate where lat 18 and 11.5 fall in the gradient (0% = top = max lat, 100% = bottom = min lat)
              const lat18Percent = ((vietnamMaxLat - 18) / vietnamLatRange) * 100;
              const lat11_5Percent = ((vietnamMaxLat - 11.5) / vietnamLatRange) * 100;
              
              console.log(`📊 Gradient stops: lat18=${lat18Percent.toFixed(1)}%, lat11.5=${lat11_5Percent.toFixed(1)}%`);
              
              // Create hard-stop gradient (no blending between colors)
              const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              stop1.setAttribute('offset', '0%');
              stop1.setAttribute('stop-color', regionDefs.north.color); // Purple
              stop1.setAttribute('stop-opacity', '0.6');
              
              const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              stop2.setAttribute('offset', `${lat18Percent}%`);
              stop2.setAttribute('stop-color', regionDefs.north.color); // Purple
              stop2.setAttribute('stop-opacity', '0.6');
              
              const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              stop3.setAttribute('offset', `${lat18Percent}%`);
              stop3.setAttribute('stop-color', regionDefs.central.color); // Cyan
              stop3.setAttribute('stop-opacity', '0.6');
              
              const stop4 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              stop4.setAttribute('offset', `${lat11_5Percent}%`);
              stop4.setAttribute('stop-color', regionDefs.central.color); // Cyan
              stop4.setAttribute('stop-opacity', '0.6');
              
              const stop5 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              stop5.setAttribute('offset', `${lat11_5Percent}%`);
              stop5.setAttribute('stop-color', regionDefs.south.color); // Green
              stop5.setAttribute('stop-opacity', '0.6');
              
              const stop6 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
              stop6.setAttribute('offset', '100%');
              stop6.setAttribute('stop-color', regionDefs.south.color); // Green
              stop6.setAttribute('stop-opacity', '0.6');
              
              gradient.appendChild(stop1);
              gradient.appendChild(stop2);
              gradient.appendChild(stop3);
              gradient.appendChild(stop4);
              gradient.appendChild(stop5);
              gradient.appendChild(stop6);
              defs.appendChild(gradient);
              
              svg.insertBefore(defs, svg.firstChild);
              
              // Apply gradient to all paths
              const paths = svg.querySelectorAll('path');
              paths.forEach(path => {
                path.setAttribute('fill', 'url(#vietnamGradient)');
              });
              
              console.log(`✅ Applied 3-color gradient: North at ${lat18Percent.toFixed(1)}%, Central at ${lat11_5Percent.toFixed(1)}%`);
              
              // Function to update gradient stops based on current map view
              const updateGradientStops = () => {
                const currentBounds = map.getBounds();
                const currentNorth = currentBounds.getNorth();
                const currentSouth = currentBounds.getSouth();
                const currentRange = currentNorth - currentSouth;
                
                // Recalculate where lat 18 and 11.5 appear in current view
                const newLat18Percent = ((currentNorth - 18) / currentRange) * 100;
                const newLat11_5Percent = ((currentNorth - 11.5) / currentRange) * 100;
                
                // Update existing gradient stops
                const stops = gradient.querySelectorAll('stop');
                if (stops.length >= 6) {
                  stops[1].setAttribute('offset', `${newLat18Percent}%`);
                  stops[2].setAttribute('offset', `${newLat18Percent}%`);
                  stops[3].setAttribute('offset', `${newLat11_5Percent}%`);
                  stops[4].setAttribute('offset', `${newLat11_5Percent}%`);
                  
                  console.log(`🔄 Updated gradient: lat18=${newLat18Percent.toFixed(1)}%, lat11.5=${newLat11_5Percent.toFixed(1)}%`);
                }
                
                // Ensure gradient is applied to paths
                const paths = svg.querySelectorAll('path');
                paths.forEach(path => {
                  if (path.getAttribute('fill') !== 'url(#vietnamGradient)') {
                    path.setAttribute('fill', 'url(#vietnamGradient)');
                  }
                });
              };
              
              // Update gradient on map movement/zoom
              map.on('moveend zoomend', updateGradientStops);
              
              // Also use MutationObserver to reapply if fill gets reset
              const observer = new MutationObserver(() => {
                const paths = svg.querySelectorAll('path');
                paths.forEach(path => {
                  if (path.getAttribute('fill') !== 'url(#vietnamGradient)') {
                    path.setAttribute('fill', 'url(#vietnamGradient)');
                  }
                });
              });
              observer.observe(svg, { 
                attributes: true, 
                attributeFilter: ['fill'],
                subtree: true 
              });
            }
          }, 300);
        })
        .catch(err => {
          console.error('❌ Failed to load Vietnam GeoJSON:', err);
        });

      // Create modern pin icon with shadow (purple theme)
      const pinSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='44' viewBox='0 0 32 44'><defs><filter id='shadow' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur in='SourceAlpha' stdDeviation='2.5'/><feOffset dx='0' dy='3' result='offsetblur'/><feComponentTransfer><feFuncA type='linear' slope='0.4'/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in='SourceGraphic'/></feMerge></filter><linearGradient id='pinGradient' x1='0%' y1='0%' x2='0%' y2='100%'><stop offset='0%' style='stop-color:%238b5cf6;stop-opacity:1'/><stop offset='100%' style='stop-color:%236b21a8;stop-opacity:1'/></linearGradient></defs><g filter='url(#shadow)'><path d='M16 0C9.4 0 4 5.4 4 12c0 8 12 20 12 20s12-12 12-20c0-6.6-5.4-12-12-12z' fill='url(%23pinGradient)'/><circle cx='16' cy='12' r='5' fill='white' opacity='0.9'/><circle cx='16' cy='12' r='3' fill='%238b5cf6'/></g></svg>`;
      const pinUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvg);
      const redIcon = L.icon({ iconUrl: pinUrl, iconSize: [32, 44], iconAnchor: [16, 44], popupAnchor: [0, -44] });

      const entries = projectsList || [];
      const cityLookup = {};
      entries.forEach(p=>{
        const raw = (p[13] || p[8] || p[7] || '').toString().trim();
        const key = raw.toLowerCase();
        if (key) cityLookup[key] = raw;
      });

      const toGeocode = [];
      const resolved = {};
      Object.keys(cityLookup).forEach(k=>{
        let found = false;
        for(const key in CITY_COORDS){ if (k.includes(key.replace('_',' '))){ resolved[k] = CITY_COORDS[key]; found = true; break; } }
        if (!found) toGeocode.push({ key:k, label: cityLookup[k] });
      });

      const geocode = async (q) => {
        try{
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}, Vietnam&limit=1`;
          const res = await fetch(url, { headers: { 'Accept-Language':'en' } });
          const json = await res.json();
          if (json && json[0]) return [parseFloat(json[0].lat), parseFloat(json[0].lon)];
        }catch(e){}
        return null;
      };

      const geocoded = await Promise.all(toGeocode.map(async t=>{
        const cached = geocodeCacheRef.current[t.key]; if (cached) return { k:t.key, v:cached };
        const v = await geocode(t.label); if (v){ geocodeCacheRef.current[t.key]=v; return { k:t.key, v }; }
        return { k:t.key, v:null };
      }));
      geocoded.forEach(g=>{ if (g.v) resolved[g.k]=g.v; });

      // Group projects by region (using regionDefs defined earlier)
      let totalProjects = 0;
      let projectsWithCoords = 0;
      let projectsWithoutCoords = 0;
      
      entries.forEach((p, idx)=>{
        totalProjects++;
        const raw = (p[13] || p[8] || p[7] || '').toString().trim();
        const projectName = p[5] || 'Unknown';
        const k = raw.toLowerCase();
        const coord = resolved[k];
        
        if (coord) {
          projectsWithCoords++;
          const [lat] = coord;
          
          if (lat >= 18) {
            regionDefs.north.projects.push({ p, idx, coord });
          } else if (lat >= 11.5) {
            regionDefs.central.projects.push({ p, idx, coord });
          } else {
            regionDefs.south.projects.push({ p, idx, coord });
          }
        } else {
          projectsWithoutCoords++;
          console.log(`❌ No coordinates: ${projectName} - Location: "${raw}"`);
        }
      });
      
      console.log(`
📊 PROJECT TRACKING SUMMARY:
   Total projects: ${totalProjects}
   ✅ With coordinates: ${projectsWithCoords} (${((projectsWithCoords/totalProjects)*100).toFixed(1)}%)
   ❌ Without coordinates: ${projectsWithoutCoords} (${((projectsWithoutCoords/totalProjects)*100).toFixed(1)}%)
   
   Distribution by region:
   🟣 Miền Bắc: ${regionDefs.north.projects.length} projects
   🔵 Miền Trung: ${regionDefs.central.projects.length} projects
   🟢 Miền Nam: ${regionDefs.south.projects.length} projects
      `);

      // Track markers for cleanup
      const markersAdded = new Set();
      const allMarkers = [];
      let markersVisible = false;
      
      // Create marker cluster group with custom styling
      const markerCluster = L.markerClusterGroup({
        maxClusterRadius: 80,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count >= 10) size = 'medium';
          if (count >= 50) size = 'large';
          
          return L.divIcon({
            html: `<div style="
              background: linear-gradient(135deg, #8b5cf6, #6b21a8);
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: ${size === 'large' ? '16px' : size === 'medium' ? '14px' : '12px'};
              box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
              border: 3px solid white;
            ">${count}</div>`,
            className: 'marker-cluster marker-cluster-' + size,
            iconSize: L.point(size === 'large' ? 50 : size === 'medium' ? 42 : 36, size === 'large' ? 50 : size === 'medium' ? 42 : 36)
          });
        }
      });
      
      // Function to create and add individual marker
      const addMarker = (p, idx, coord) => {
        // Use unique key per project, not per location
        const markerKey = `${idx}_${coord[0]}_${coord[1]}`;
        if (markersAdded.has(markerKey)) {
          console.log(`⚠️ Duplicate marker skipped for project ${p[5]}`);
          return;
        }
        markersAdded.add(markerKey);

        const m = L.marker(coord, { icon: redIcon });
        const projectName = p[5] || 'Unnamed Project';
        const segment = p[6] || p[7] || '';
        const status = p[21] || '';
        const qty = p[17] || '';
        const price = p[18] || '';
        const winningRate = p[20] || '';
        const imageUrl = p[4] || `https://picsum.photos/seed/${idx}/600/360`;
        const productName = p[16] || '';
        const raw = (p[13] || p[8] || p[7] || '').toString().trim();
        
        const popupHtml = `
          <div style="width:260px;font-family:sans-serif;">
            <div style="height:140px;overflow:hidden;border-radius:8px;margin-bottom:10px;">
              <img src="${imageUrl}" alt="${projectName}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='https://picsum.photos/seed/${idx}/600/360'"/>
            </div>
            <div style="font-weight:700;font-size:15px;margin-bottom:6px;">${projectName}</div>
            <div style="color:#666;font-size:13px;margin-bottom:8px;">${raw}</div>
            ${productName ? `<div style="font-size:12px;color:#888;margin-bottom:4px;">Product: ${productName}</div>` : ''}
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
              ${segment ? `<span style="padding:4px 10px;background:rgba(59,130,246,0.1);color:#2563eb;border-radius:6px;font-size:11px;font-weight:600;">${segment}</span>` : ''}
              ${status ? `<span style="padding:4px 10px;background:rgba(16,185,129,0.1);color:#059669;border-radius:6px;font-size:11px;font-weight:600;">${status}</span>` : ''}
              ${winningRate ? `<span style="padding:4px 10px;background:rgba(245,158,11,0.1);color:#d97706;border-radius:6px;font-size:11px;font-weight:600;">Win: ${winningRate}</span>` : ''}
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #eee;">
              <div><div style="font-size:11px;color:#999;">Quantity</div><div style="font-weight:600;font-size:14px;">${qty || '—'}</div></div>
              <div><div style="font-size:11px;color:#999;">Price</div><div style="font-weight:600;font-size:14px;">${price ? '$' + price : '—'}</div></div>
            </div>
          </div>
        `;
        m.bindPopup(popupHtml, { maxWidth: 280 });
        
        // Add to cluster group instead of directly to map
        markerCluster.addLayer(m);
        allMarkers.push(m);
        
        // Persist coordinates
        try {
          const latIdx = SHEET_HEADERS.indexOf('Lat');
          const lngIdx = SHEET_HEADERS.indexOf('Lng');
          const hasLat = (p[latIdx] && p[latIdx].toString().trim());
          const hasLng = (p[lngIdx] && p[lngIdx].toString().trim());
          if (!hasLat || !hasLng) {
            const payload = {};
            SHEET_HEADERS.forEach((h,i)=>{ payload[h] = p[i] || ''; });
            payload['Lat'] = String(coord[0]);
            payload['Lng'] = String(coord[1]);
            const sheetRow = idx + 7;
            fetch(`/api/projects/${sheetRow}`, { 
              method: 'PUT', 
              headers: { 'Content-Type':'application/json' }, 
              body: JSON.stringify(payload) 
            }).catch(e=>console.warn('coord persist err', e.message));
          }
        } catch(e) { console.warn('persist coord err', e.message); }
      };

      // Click handlers are already set in the GeoJSON onEachFeature callback
      
      // Add button to reset map view (clear markers and zoom out)
      const resetButton = L.control({ position: 'topright' });
      resetButton.onAdd = function() {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        div.innerHTML = `
          <a href="#" style="
            display:block;
            background:white;
            padding:8px 12px;
            text-decoration:none;
            color:#6b21a8;
            font-weight:600;
            font-size:12px;
            border-radius:4px;
            box-shadow:0 2px 8px rgba(0,0,0,0.1);
          " title="Reset view">↩ Reset</a>
        `;
        div.onclick = (e) => {
          e.preventDefault();
          // Remove cluster layer and clear all markers
          map.removeLayer(markerCluster);
          markerCluster.clearLayers();
          allMarkers.length = 0;
          markersAdded.clear();
          markersVisible = false;
          
          // Reset to Vietnam bounds
          map.fitBounds(vietnamBounds, { padding: [10, 10] });
          
          console.log('🔄 Map reset - markers cleared');
        };
        return div;
      };
      resetButton.addTo(map);

      // Monitor zoom to hide markers when zooming out
      map.on('zoomend', () => {
        const zoom = map.getZoom();
        if (zoom < 7 && markersVisible) {
          // Auto-hide markers when zooming out too far
          allMarkers.forEach(m => map.removeLayer(m));
          allMarkers.length = 0;
          markersAdded.clear();
          markersVisible = false;
          console.log('🔍 Zoomed out - markers cleared');
        }
      });

      // Initial view: show only colored regions, no markers

      mapInstanceRef.current = map;
    }

    ensureLeafletAndMarkers();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [projectsList]);

  // Save layout handler
  // (layout save removed)

  return (
    <div className={`dashboard-root centered ${mounted ? 'mounted' : ''}`}>
      <div className="dashboard-content">
        {/* Landing removed: landing is now a standalone route/component, not rendered here */}
        <header className="dash-header">
          <div>
            <div className="dash-welcome">Welcome back, Loan!</div>
            <div className="dash-sub">You have {totalProjects} projects</div>
          </div>
        </header>
        <div className="dash-top-cards">
          <div className="metric card">
            <div className="metric-title">Total Projects</div>
            <div className="metric-value">{totalProjects.toLocaleString()}</div>
          </div>
          <div className="metric card">
            <div className="metric-title">Total Quantity</div>
            <div className="metric-value">{totalQuantity.toLocaleString()}</div>
          </div>
          <div className="metric card">
            <div className="metric-title">YTD Invoice</div>
            <div className="metric-value">${Math.round(ytdInvoice).toLocaleString()}</div>
          </div>
          <div className="metric card">
            <div className="metric-title">Avg Winning Rate</div>
            <div className="metric-value">{avgWinning}%</div>
          </div>

          <div className="metric card">
            <div className="metric-title">MTD Invoice</div>
            <div className="metric-value">${Math.round(mtdInvoice).toLocaleString()}</div>
          </div>
          <div className="metric card">
            <div className="metric-title">Forecast FY</div>
            <div className="metric-value">{Math.round(forecastFY).toLocaleString()}</div>
          </div>
          <div className="metric card">
            <div className="metric-title">Next Delivery (30d)</div>
            <div className="metric-value">{upcomingNextDeliveryCount} projects</div>
          </div>
          <div className="metric card">
            <div className="metric-title">Open PL Qty</div>
            <div className="metric-value">{Math.round(totalOpenPL).toLocaleString()}</div>
          </div>
        </div>

        <div className="dash-grid area">
          <div className="card chart">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Monthly Forecast Distribution</div>
              {selectedMonth !== null && (
                <button 
                  onClick={() => setSelectedMonth(null)}
                  style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #8b5cf6, #6b21a8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  ← View All Year
                </button>
              )}
            </div>
            <div className="chart-wrapper">
              <svg className="mini-chart" viewBox="0 0 900 270" preserveAspectRatio="xMinYMin meet" onMouseLeave={() => setChartTip(t => ({ ...t, visible: false }))}>
                <defs>
                  <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#6b21a8" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                {/* axes */}
                <line x1="50" y1="20" x2="50" y2="180" stroke="#e5e7eb" strokeWidth="2" />
                <line x1="50" y1="180" x2="860" y2="180" stroke="#e5e7eb" strokeWidth="2" />
                {/* trend line */}
                {(() => {
                  const max = Math.max(1, ...monthlyTotals);
                  const points = monthlyTotals.map((v, i) => {
                    const x = 60 + i * 65 + 20; // Center of each bar
                    const h = Math.max(4, Math.round((v / max) * 140));
                    const y = 180 - h;
                    return `${x},${y}`;
                  }).join(' ');
                  return (
                    <>
                      <polyline
                        points={points}
                        fill="none"
                        stroke="url(#trendGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                      />
                      {monthlyTotals.map((v, i) => {
                        const max = Math.max(1, ...monthlyTotals);
                        const x = 60 + i * 65 + 20;
                        const h = Math.max(4, Math.round((v / max) * 140));
                        const y = 180 - h;
                        return (
                          <circle
                            key={`trend-${i}`}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#f59e0b"
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </>
                  );
                })()}
                {monthlyTotals.map((v,i)=>{
                  const max = Math.max(1, ...monthlyTotals);
                  const h = Math.max(4, Math.round((v/max)*140));
                  const x = 60 + i*65;
                  const y = 180 - h;
                  const currentMonth = new Date().getMonth();
                  const isCurrentMonth = i === currentMonth;
                  return (
                    <g key={i}>
                      <rect 
                        x={x} 
                        y={y} 
                        width={40} 
                        height={h} 
                        fill={selectedMonth === i ? "#10b981" : isCurrentMonth ? "#f59e0b" : "url(#barGradient)"}
                        opacity={selectedMonth === null || selectedMonth === i ? "0.95" : "0.5"}
                        rx="4"
                        onMouseEnter={(e)=>{
                          const metrics = monthlyMetrics[i];
                          setChartTip({ 
                            visible:true, 
                            x: e.clientX, 
                            y: e.clientY, 
                            label: ['January','February','March','April','May','June','July','August','September','October','November','December'][i], 
                            value: v.toLocaleString(),
                            count: metrics?.count || 0,
                            totalValue: metrics?.value || 0,
                            avgPrice: metrics?.avgPrice || 0,
                            avgWinRate: metrics?.avgWinRate || 0
                          });
                        }}
                        onMouseMove={(e)=>{ setChartTip(t=> t.visible ? ({ ...t, x: e.clientX, y: e.clientY }) : t); }}
                        onClick={() => {
                          // Toggle month selection
                          setSelectedMonth(selectedMonth === i ? null : i);
                        }}
                        onDoubleClick={() => {
                          const monthProjects = getProjectsForMonth(i);
                          const monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'][i];
                          setMonthDetailModal({ visible: true, month: monthName, projects: monthProjects });
                        }}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.target.style.opacity = '1'; e.target.style.transform = 'scaleY(1.05)'; }}
                        onMouseOut={(e) => { e.target.style.opacity = '0.95'; e.target.style.transform = 'scaleY(1)'; }}
                      />
                      {v > 0 && h > 20 && (
                        <text x={x+20} y={y-6} textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600">
                          {v > 999 ? (v/1000).toFixed(0) + 'k' : v}
                        </text>
                      )}
                      <text x={x+20} y={196} textAnchor="middle" fontSize="11" fill="#374151" fontWeight={isCurrentMonth ? "700" : "500"}>
                        {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                      </text>
                    </g>
                  );
                })}
                {/* y labels */}
                {[0,0.25,0.5,0.75,1].map((f,idx)=>{
                  const max = Math.max(1, ...monthlyTotals); 
                  const y = 180 - Math.round(f*140);
                  const value = Math.round(f*max);
                  return (
                    <text key={idx} x={14} y={y+4} fontSize="10" fill="#6b7280" fontWeight="500">
                      {value > 999 ? (value/1000).toFixed(0) + 'k' : value}
                    </text>
                  );
                })}
              </svg>
            </div>
            
            {/* Chart Insights Section */}
            <div style={{ 
              marginTop: '20px', 
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              fontSize: '15px',
              color: '#64748b'
            }}>
              {chartInsights.topProject && (
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>TOP PROJECT</div>
                  <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>{chartInsights.topProject.projectName}</div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{chartInsights.topProject.value.toLocaleString()} units</div>
                </div>
              )}
              
              {chartInsights.topProduct && (
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>TOP PRODUCT</div>
                  <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>{chartInsights.topProduct.name}</div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{chartInsights.topProduct.count} projects</div>
                </div>
              )}
              
              {chartInsights.topDeveloper && (
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>TOP DEVELOPER</div>
                  <div style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700' }}>{chartInsights.topDeveloper.name}</div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{chartInsights.topDeveloper.count} projects</div>
                </div>
              )}
              
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>GROWTH</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '700',
                  color: chartInsights.growthDirection === 'up' ? '#10b981' : chartInsights.growthDirection === 'down' ? '#ef4444' : '#64748b'
                }}>
                  {chartInsights.growthDirection === 'up' ? '+' : chartInsights.growthDirection === 'down' ? '-' : ''}{Math.abs(chartInsights.growthPercent).toFixed(1)}%
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
                  {selectedMonth !== null ? 'vs previous month' : 'H2 vs H1'}
                </div>
              </div>
            </div>
          </div>

          <div className="card map card-large">
            <div className="card-title">Map Overview (Vietnam)</div>
            <div id="mapid" ref={mapRef} className="map-container" />
          </div>

          <div className="card details">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div className="card-title">Top Projects</div>
              <div className="dashboard-controls">
                <button className="small-btn" onClick={() => setShowTable(s=>!s)}>{showTable ? 'Hide Table' : 'Show Table'}</button>
                <button className="export-btn" onClick={() => {
                  // export CSV of projectsList
                  const rows = projectsList.map(p=>({ name: p[5]||'', city: p[13]||'', qty: p[17]||'', price: p[18]||'', turnover: p[19]||'', winning: p[20]||'', nextDelivery: p[25]||'' }));
                  const keys = ['name','city','qty','price','turnover','winning','nextDelivery'];
                  const csv = [keys.join(',')].concat(rows.map(r=> keys.map(k=> '"'+String(r[k]||'').replace(/"/g,'""')+'"').join(','))).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `projects_export_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                }}>Export CSV</button>
              </div>
            </div>
            
            {showTable && (
              <div style={{ marginTop: 12, overflowX: 'auto' }} className="projects-table-wrapper">
                <table className="projects-table">
                  <thead><tr><th>#</th><th>Name</th><th>City</th><th>Qty</th><th>Price</th><th>Turnover</th><th>Winning</th><th>Next Delivery</th></tr></thead>
                  <tbody>
                    {topByQty.slice(0, 200).map((p,i)=> (
                      <tr key={i} className={i < 10 ? 'top-row' : 'dimmed'}>
                        <td>{i+1}</td>
                        <td style={{ fontWeight: i < 10 ? 700 : 400 }}>{p[5]||''}</td>
                        <td>{p[13]||''}</td>
                        <td>{p[17]||''}</td>
                        <td>{p[18]||''}</td>
                        <td>{p[19]||''}</td>
                        <td>{p[20]||''}</td>
                        <td>{p[25]||''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* layout editor removed; edit layout in code/CSS directly */}

        {projectsList && projectsList.length > 0 && (
          <div className="top-projects-strip">
            <div className="top-projects-row">
              {topByQty.slice(0,30).map((p,i)=> (
                <div className="top-project-card" key={i}>
                  <div style={{ height: 110, overflow: 'hidden', borderRadius: 8 }}>
                    <img src={p[4]||''} alt={p[5]||''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>{ e.target.onerror=null; e.target.src=`https://picsum.photos/seed/${i}/600/360`; }} />
                  </div>
                  <div className="rank-badge">#{i+1}</div>
                  <div className="title">{p[5]||`Project ${i+1}`}</div>
                  <div className="meta">{p[13]||'Unknown'} • Qty: {p[17]||''}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Month Detail Modal */}
        {monthDetailModal.visible && (
          <div className="month-modal-overlay" onClick={() => setMonthDetailModal({ visible: false, month: '', projects: [] })}>
            <div className="month-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="month-modal-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg, #6b21a8, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {monthDetailModal.month}
                  </h2>
                  <div style={{ margin: '10px 0 0', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                      {monthDetailModal.projects.length} projects
                    </span>
                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                      {monthDetailModal.projects.reduce((sum, item) => sum + item.value, 0).toLocaleString()} units
                    </span>
                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                      ${(monthDetailModal.projects.reduce((sum, item) => sum + item.turnover, 0) / 1000000).toFixed(2)}M value
                    </span>
                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                      {(monthDetailModal.projects.reduce((sum, item) => sum + item.winningRate, 0) / monthDetailModal.projects.length).toFixed(1)}% win rate
                    </span>
                  </div>
                </div>
                <button className="month-modal-close" onClick={() => setMonthDetailModal({ visible: false, month: '', projects: [] })}>
                  ✕
                </button>
              </div>
              <div className="month-modal-body">
                {monthDetailModal.projects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>Không có dự án nào trong tháng này</p>
                  </div>
                ) : (
                  <div className="month-project-list">
                    {monthDetailModal.projects.map((item, idx) => {
                      const p = item.project;
                      return (
                        <div key={idx} className="month-project-item">
                          <div className="month-project-rank">#{idx + 1}</div>
                          <div className="month-project-info">
                            <div className="month-project-name">{p[5] || 'Unnamed Project'}</div>
                            <div className="month-project-meta">
                              <span>{p[13] || 'N/A'}</span>
                              <span>•</span>
                              <span>{p[8] || 'N/A'}</span>
                              {p[20] && <><span>•</span><span style={{ color: '#10b981', fontWeight: '600' }}>{p[20]}</span></>}
                            </div>
                            <div className="month-project-stats">
                              <span className="stat-badge">${item.price.toLocaleString()}</span>
                              <span className="stat-badge">${(item.turnover / 1000).toFixed(1)}K</span>
                            </div>
                          </div>
                          <div className="month-project-value">
                            <span className="month-project-qty">{item.value.toLocaleString()}</span>
                            <span className="month-project-unit">units</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showDebug && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title">Debug — metrics & sample projects</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: 12 }}>{JSON.stringify({
                  metrics: {
                    totalProjects, totalQuantity, totalTurnover, avgWinning, totalOpenPL, avgPrice, upcomingNextDeliveryCount
                  },
                  monthlyTotals: monthlyTotals,
                }, null, 2)}</pre>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Sample projects (first 10)</div>
                <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto', fontSize: 12 }}>{JSON.stringify(projectsList.slice(0,10), null, 2)}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Tooltip rendered at top level to avoid overflow clipping */}
        {chartTip.visible && (
          <div className="chart-tooltip-enhanced" style={{ left: `${chartTip.x}px`, top: `${chartTip.y}px` }}>
            <div className="tooltip-header">{chartTip.label}</div>
            <div className="tooltip-grid">
              <div className="tooltip-item">
                <span className="tooltip-label">Quantity</span>
                <span className="tooltip-value">{chartTip.value}</span>
              </div>
              <div className="tooltip-item">
                <span className="tooltip-label">Projects</span>
                <span className="tooltip-value">{chartTip.count || 0}</span>
              </div>
              <div className="tooltip-item">
                <span className="tooltip-label">Total Value</span>
                <span className="tooltip-value">
                  {(() => {
                    const val = chartTip.totalValue || 0;
                    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
                    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
                    return `$${val.toFixed(0)}`;
                  })()}
                </span>
              </div>
              <div className="tooltip-item">
                <span className="tooltip-label">Avg Price</span>
                <span className="tooltip-value">
                  {(() => {
                    const val = chartTip.avgPrice || 0;
                    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
                    return `$${val.toFixed(0)}`;
                  })()}
                </span>
              </div>
              <div className="tooltip-item">
                <span className="tooltip-label">Avg Win Rate</span>
                <span className="tooltip-value">{(chartTip.avgWinRate || 0).toFixed(1)}%</span>
              </div>
            </div>
            <div className="tooltip-footer">Click to see details</div>
          </div>
        )}
      </div>
    </div>
  );
}
