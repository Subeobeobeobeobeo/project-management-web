// src/components/ProjectDetail.js
import React, { useState, useEffect } from 'react';

// giữ nguyên headers cho UI
const headers = [
  'Sales PIC', 'Project ID', 'Sub ID', 'Project Code', 'Project Link', 'Project Name',
  'Project Segment', 'Project Type', 'Developer', 'Contractor', 'Designer', 'Competitor',
  'Area', 'Location', 'Distributor', 'Product Code', 'Product Name', 'Total Quantity',
  'Price', 'Total Turnover', 'Winning Rate', 'Status', 'Note', 'Creation Week',
  'Delivery Year', 'Next Delivery', 'MTD Invoice', 'YTD Invoice', 'Invoiced PY',
  'Open PL Qty', 'Forecast FY', 'Carry-Over Qty', 'JAN', 'FEB', 'MAR', 'APR', 'MAY',
  'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'Specs', 'Spec Year', 'SAP name',
  'KEY', 'PL key', 'Lat', 'Lng'
];

// Note: backend mapping uses exact header strings in `headers` above.

function ProjectDetail({ project, rowIndex, onClose, onUpdate }) {
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (project) {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = project[i] || '';
      });
      setFormData(obj);
    }
  }, [project]);

  if (!project) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const payload = {};
    headers.forEach((h) => {
      payload[h] = formData[h] || '';
    });
    onUpdate(payload, rowIndex);
    setEditMode(false);
  };

  const renderField = (label) => (
    <div className="realest-detail__field" key={label}>
      <span className="realest-detail__field-label">{label}</span>
      {editMode ? (
        <input
          className="realest-detail__input"
          name={label}
          value={formData[label] || ''}
          onChange={handleChange}
        />
      ) : (
        <p>{formData[label] || '—'}</p>
      )}
    </div>
  );

  const groups = [
    {
      name: 'Thông tin cơ bản',
      fields: ['Project ID', 'Project Name', 'Sales PIC', 'Project Segment', 'Project Type', 'Developer', 'Contractor', 'Designer', 'Competitor', 'Area', 'Location', 'Distributor']
    },
    {
      name: 'Sản phẩm',
      fields: ['Product Code', 'Product Name', 'Total Quantity', 'Price', 'Total Turnover', 'Specs', 'Spec Year', 'SAP name', 'KEY', 'PL key']
    },
    {
      name: 'Tiến độ & Forecast',
      fields: ['Winning Rate', 'Status', 'Forecast FY', 'Carry-Over Qty', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    },
    {
      name: 'Invoice / PL',
      fields: ['MTD Invoice', 'YTD Invoice', 'Invoiced PY', 'Open PL Qty', 'Next Delivery', 'Delivery Year', 'Creation Week']
    },
    {
      name: 'Notes',
      fields: ['Note']
    }
  ];

  const resetForm = () => {
    if (project) {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = project[i] || '';
      });
      setFormData(obj);
    }
  };

  const heroImg = project[4] || `https://picsum.photos/seed/detail-${rowIndex || 0}/1100/520`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="project-detail-backdrop realest-detail-backdrop"
      onClick={onClose}
    >
      <div className="realest-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="realest-detail__close">✕</button>

        <div className="realest-detail__hero">
          <div className="realest-detail__media">
            <img
              src={heroImg}
              alt={formData['Project Name'] || 'Project'}
              onError={(e) => {
                const fallback = `https://picsum.photos/seed/fallback-detail-${rowIndex || 0}/1100/520`;
                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
              }}
            />
            <span className="realest-detail__tag">{formData['Location'] || 'Đang cập nhật'}</span>
          </div>

          <div className="realest-detail__summary">
            <p className="realest-detail__category">{formData['Project Segment'] || formData['Project Type'] || 'Project'}</p>
            <h2>{formData['Project Name'] || 'Project Detail'}</h2>
            <p className="realest-detail__subtitle">{formData['Developer'] || 'Chủ đầu tư đang cập nhật'}</p>

            <div className="realest-detail__stats">
              <div>
                <span>Total quantity</span>
                <strong>{formData['Total Quantity'] || 'N/A'}</strong>
              </div>
              <div>
                <span>Total turnover</span>
                <strong>{formData['Total Turnover'] || formData['Price'] || '0'}</strong>
              </div>
              <div>
                <span>Winning rate</span>
                <strong>{formData['Winning Rate'] || 'N/A'}</strong>
              </div>
            </div>

            <div className="realest-detail__meta">
              <div>
                <span>Status</span>
                <strong>{formData['Status'] || 'Đang cập nhật'}</strong>
              </div>
              <div>
                <span>Forecast FY</span>
                <strong>{formData['Forecast FY'] || 'N/A'}</strong>
              </div>
              <div>
                <span>Next delivery</span>
                <strong>{formData['Next Delivery'] || 'TBD'}</strong>
              </div>
            </div>

            <div className="realest-detail__actions">
              {editMode ? (
                <>
                  <button onClick={handleSave} className="btn-primary">Save changes</button>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      resetForm();
                      setEditMode(false);
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)} className="btn-primary">Edit project</button>
              )}
            </div>
          </div>
        </div>

        <div className="realest-detail__content">
          {groups.map((group) => (
            <section className="realest-detail__section" key={group.name}>
              <h3>{group.name}</h3>
              <div className="realest-detail__fields-grid">
                {group.fields.map((field) => renderField(field))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;