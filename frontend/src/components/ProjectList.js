// src/components/ProjectList.js
import React from 'react';

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

function ProjectList({ projects, onSelect }) {
  return (
    <section className="listing-grid">
      {projects.map((proj, index) => {
        const fallbackImage = curatedImages[index % curatedImages.length];
        const image = proj && proj[4] && proj[4].toString().trim()
          ? proj[4]
          : fallbackImage;
        const name = proj[5] || 'Unnamed project';
        const productName = proj[16] || 'Updating product';
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
            key={`${name}-${index}`}
            className="listing-card"
            onClick={() => onSelect(proj, index)}
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
  );
}

export default ProjectList;