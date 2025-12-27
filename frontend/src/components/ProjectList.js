// src/components/ProjectList.js
import React, { useRef } from 'react';

const quantityFormatter = new Intl.NumberFormat('en-US');
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const curatedImages = [
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505691938895-7eed472b31a3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
];

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return currencyFormatter.format(numeric);
};

// clampCount removed: no longer used in this card layout

function ProjectList({ projects, onSelect, newlyCreatedIndices = [], onClearNewProjects }) {
  const projectRefs = useRef([]);

  // Group projects by Project Code (index 3)
  const groupedProjects = projects.reduce((acc, proj, index) => {
    const projectCode = proj[3]; // Project Code
    if (!acc[projectCode]) {
      acc[projectCode] = [];
    }
    acc[projectCode].push({ project: proj, index });
    return acc;
  }, {});

  const handleFloatingButtonClick = () => {
    if (newlyCreatedIndices.length > 0) {
      // Scroll to the most recent new project (last in array)
      const latestIndex = newlyCreatedIndices[newlyCreatedIndices.length - 1];
      if (projectRefs.current[latestIndex]) {
        projectRefs.current[latestIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        // Add highlight animation
        projectRefs.current[latestIndex].classList.add('project-highlight');
        setTimeout(() => {
          projectRefs.current[latestIndex]?.classList.remove('project-highlight');
          // Clear the new projects list after highlighting
          if (onClearNewProjects) {
            onClearNewProjects();
          }
        }, 3000);
      }
    }
  };

  return (
    <>
      <section className="listing-grid">
        {Object.entries(groupedProjects).map(([projectCode, group]) => {
          const proj = group[0].project; // Use first project for display
          const index = group[0].index;
          const fallbackImage = curatedImages[index % curatedImages.length];
          const rawImage = proj && proj[4] && proj[4].toString().trim();
          const isValidUrl = rawImage && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)/i.test(rawImage);
          const image = isValidUrl ? rawImage : fallbackImage;
          const name = proj[5] || 'Unnamed project';
          const productNames = [...new Set(group.map(item => item.project[16]).filter(Boolean))];
          const productName = productNames.length > 0 ? productNames.join(', ') : 'Updating product';
          const price = formatCurrency(proj[18]);
          const location = proj[13] || 'Updating location';
          const segment = proj[6] || proj[7] || 'Listing';
          const status = proj[21] || 'Available';
          const quantitySeed = Number(proj[17]);
          const quantityDisplay = Number.isFinite(quantitySeed) ? quantityFormatter.format(quantitySeed) : '—';
          const forecastValue = proj[30] || proj[22] || '—';
          const winningRaw = proj[20];
          // normalize winning rate: accept values like '50%' or 50 and parse numeric portion
          const winningNum = Number(String(winningRaw).replace(/[^0-9.-]/g, ''));
          let winningDisplay = '—';
          if (winningRaw !== null && winningRaw !== undefined && String(winningRaw).toString().trim() !== '') {
            const rawStr = String(winningRaw).toString().trim();
            winningDisplay = rawStr.endsWith('%') ? rawStr : `${rawStr}%`;
          }
          // Map strictly to three levels per request: 0%, 50%, 100%
          let winningClass = 'winning-badge--neutral';
          if (Number.isFinite(winningNum)) {
            if (winningNum === 100) winningClass = 'winning-badge--high';
            else if (winningNum === 50) winningClass = 'winning-badge--mid';
            else if (winningNum === 0) winningClass = 'winning-badge--low';
            else winningClass = 'winning-badge--neutral';
          }
          // area not displayed in this layout; omit computations to avoid unused-vars warning

          return (
            <article
              key={projectCode}
              className="listing-card"
              onClick={() => onSelect(projectCode)}
              ref={(el) => (projectRefs.current[index] = el)}
            >
              <div className="listing-card__image-wrap">
                <span className="listing-card__badge">{segment}</span>
                <span className={`winning-badge ${winningClass}`}>{winningDisplay}</span>
                <img
                  src={image}
                  alt={name}
                  onError={(e) => {
                    if (e.currentTarget.src !== fallbackImage) e.currentTarget.src = fallbackImage;
                  }}
                />
                <span className="listing-card__shine" aria-hidden="true" />
              </div>
              <div className="listing-card__body">
                <div className="listing-card__header">
                  <div>
                    <h3>{name}</h3>
                    <p className="listing-card__product">{productName}</p>
                    <p className="listing-card__location">{location}</p>
                  </div>
                  <div className="listing-card__price">{quantityDisplay}</div>
                </div>
                <div className="listing-card__facts">
                  <div className="listing-card__fact">
                    Forecast FY: <span style={{ fontWeight: 700, marginLeft: 6 }}>{forecastValue}</span>
                  </div>
                  <div className="listing-card__fact">
                    Price: <span style={{ fontWeight: 700, marginLeft: 6 }}>{price}</span>
                  </div>
                </div>
                <div className="listing-card__footer">
                  <span className="listing-card__status">{status}</span>
                  <span className="listing-card__chevron" aria-hidden="true">→</span>
                </div>
              </div>
            </article>
          );
        })}
      </section>
      
      {newlyCreatedIndices.length > 0 && (
        <button
          className="floating-new-project-btn"
          onClick={handleFloatingButtonClick}
          title={`Go to ${newlyCreatedIndices.length} new project${newlyCreatedIndices.length > 1 ? 's' : ''}`}
        >
          <span className="floating-btn-count">{newlyCreatedIndices.length}</span>
          <span className="floating-btn-text">New Project{newlyCreatedIndices.length > 1 ? 's' : ''}</span>
        </button>
      )}
    </>
  );
}

export default ProjectList;