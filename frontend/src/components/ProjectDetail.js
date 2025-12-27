// src/components/ProjectDetail.js
import React, { useState, useEffect, useMemo } from 'react';

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

function ProjectDetail({ selectedProjects, onClose, onUpdate, onEdit, selectedIndices }) {
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState(0); // 0: Thông tin cơ bản, 1: Danh mục sản phẩm, 2: Lịch giao hàng, 3: Thông tin kỹ thuật/khác
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(0);
  const [indices, setIndices] = useState([]);

  const projs = useMemo(() => selectedProjects ? selectedProjects.map(item => item.project) : [], [selectedProjects]);
  const idxs = useMemo(() => selectedProjects ? selectedProjects.map(item => item.index) : [], [selectedProjects]);

  // Gom nhóm Thông tin cơ bản và Đối tác & Vị trí
  // eslint-disable-next-line no-unused-vars
  const groupBasic = [
    "Sales PIC","Project ID","Sub ID","Project Code","Project Link","Project Name","Project Segment","Project Type",
    "Developer","Contractor","Designer","Competitor","Area","Location"
  ];
  // eslint-disable-next-line no-unused-vars
  const groupProduct = ["code","name","quantity","price","turnover","rate","status"];
  // eslint-disable-next-line no-unused-vars
  const groupDelivery = ["creationWeek","deliveryYear","nextDelivery","mtdInvoice","ytdInvoice","invoicedPY","openPLQty","forecastFY","carryOverQty"];
  // eslint-disable-next-line no-unused-vars
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  // eslint-disable-next-line no-unused-vars
  const groupOther = ["Specs","Spec Year","SAP name","KEY","PL key"];

  useEffect(() => {
    if (selectedProjects && selectedProjects.length > 0) {
      setIndices(idxs);
      // Basic info from first project
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = projs[0][i] || '';
      });
      setFormData(obj);
      // Products from all projects
      const prods = projs.map(proj => ({
        code: proj[15] || '', // Product Code
        name: proj[16] || '', // Product Name
        quantity: proj[17] || '', // Total Quantity
        price: proj[18] || '', // Price
        turnover: proj[19] || '', // Total Turnover
        rate: proj[20] || '', // Winning Rate
        status: proj[21] || '', // Status
        delivery: {
          creationWeek: proj[23] || '', // Creation Week
          deliveryYear: proj[24] || '', // Delivery Year
          nextDelivery: proj[25] || '', // Next Delivery
          mtdInvoice: proj[26] || '', // MTD Invoice
          ytdInvoice: proj[27] || '', // YTD Invoice
          invoicedPY: proj[28] || '', // Invoiced PY
          openPLQty: proj[29] || '', // Open PL Qty
          forecastFY: proj[30] || '', // Forecast FY
          carryOverQty: proj[31] || '' // Carry-Over Qty
        }
      }));
      // Remove duplicates based on code and name
      const uniqueProds = prods.filter((prod, index, arr) => 
        arr.findIndex(p => p.code === prod.code && p.name === prod.name) === index
      );
      setProducts(uniqueProds);
    }
  }, [selectedProjects, projs, idxs]);

  if (!selectedProjects || selectedProjects.length === 0) return null;

  const renderField = (label) => (
    <div className="realest-detail__field" key={label}>
      <span className="realest-detail__field-label">{label}</span>
      <p>{formData[label] || '—'}</p>
    </div>
  );

  const renderFieldForProduct = (label, prodIndex) => {
    const fieldKey = label === 'Product Code' ? 'code' : label === 'Product Name' ? 'name' : label === 'Total Quantity' ? 'quantity' : label === 'Price' ? 'price' : 'turnover';
    return (
      <div className="realest-detail__field" key={label}>
        <span className="realest-detail__field-label">{label}</span>
        <p>{products[prodIndex][fieldKey] || '—'}</p>
      </div>
    );
  };

  const renderFieldForDelivery = (label, prodIndex) => {
    let value;
    if (label === 'Winning Rate') {
      value = products[prodIndex].rate;
    } else if (label === 'Status') {
      value = products[prodIndex].status;
    } else {
      const fieldKey = label === 'Forecast FY' ? 'forecastFY' : label === 'Carry-Over Qty' ? 'carryOverQty' : label === 'Creation Week' ? 'creationWeek' : label === 'Delivery Year' ? 'deliveryYear' : label === 'Next Delivery' ? 'nextDelivery' : label === 'MTD Invoice' ? 'mtdInvoice' : label === 'YTD Invoice' ? 'ytdInvoice' : label === 'Invoiced PY' ? 'invoicedPY' : label === 'Open PL Qty' ? 'openPLQty' : label.toLowerCase(); // for JAN etc, but not implemented
      value = products[prodIndex].delivery[fieldKey] || '';
    }
    return (
      <div className="realest-detail__field" key={label}>
        <span className="realest-detail__field-label">{label}</span>
        <p>{value || '—'}</p>
      </div>
    );
  };

  if (!selectedProjects || selectedProjects.length === 0) return null;

  const heroImg = projs[0][4] || `https://picsum.photos/seed/detail-${indices[0] || 0}/1100/520`;

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
                const fallback = `https://picsum.photos/seed/fallback-detail-${indices[0] || 0}/1100/520`;
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
              <button onClick={onEdit} className="btn-primary">Edit project</button>
            </div>
          </div>
        </div>

        <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab(0)}
            style={{
              border: 'none',
              background: 'none',
              padding: '12px 24px',
              borderBottom: activeTab === 0 ? '3px solid #bc0e09' : '3px solid transparent',
              fontWeight: activeTab === 0 ? 700 : 500,
              color: activeTab === 0 ? '#bc0e09' : '#222',
              cursor: 'pointer',
              outline: 'none',
              fontSize: 16
            }}
          >
            Thông tin cơ bản
          </button>
          <button
            onClick={() => setActiveTab(1)}
            style={{
              border: 'none',
              background: 'none',
              padding: '12px 24px',
              borderBottom: activeTab === 1 ? '3px solid #bc0e09' : '3px solid transparent',
              fontWeight: activeTab === 1 ? 700 : 500,
              color: activeTab === 1 ? '#bc0e09' : '#222',
              cursor: 'pointer',
              outline: 'none',
              fontSize: 16
            }}
          >
            Danh mục sản phẩm
          </button>
          <button
            onClick={() => setActiveTab(2)}
            style={{
              border: 'none',
              background: 'none',
              padding: '12px 24px',
              borderBottom: activeTab === 2 ? '3px solid #bc0e09' : '3px solid transparent',
              fontWeight: activeTab === 2 ? 700 : 500,
              color: activeTab === 2 ? '#bc0e09' : '#222',
              cursor: 'pointer',
              outline: 'none',
              fontSize: 16
            }}
          >
            Lịch giao hàng
          </button>
          <button
            onClick={() => setActiveTab(3)}
            style={{
              border: 'none',
              background: 'none',
              padding: '12px 24px',
              borderBottom: activeTab === 3 ? '3px solid #bc0e09' : '3px solid transparent',
              fontWeight: activeTab === 3 ? 700 : 500,
              color: activeTab === 3 ? '#bc0e09' : '#222',
              cursor: 'pointer',
              outline: 'none',
              fontSize: 16
            }}
          >
            Thông tin kỹ thuật/khác
          </button>
        </div>

        <div className="realest-detail__content">
          {activeTab === 0 && (
            <section className="realest-detail__section">
              <h3>Thông tin cơ bản</h3>
              <div className="realest-detail__fields-grid">
                {['Project ID', 'Project Name', 'Sales PIC', 'Project Segment', 'Project Type', 'Developer', 'Contractor', 'Designer', 'Competitor', 'Area', 'Location', 'Distributor'].map((field) => renderField(field))}
              </div>
            </section>
          )}
          {activeTab === 1 && (
            <section className="realest-detail__section">
              <h3>Danh mục sản phẩm</h3>
              <div style={{ display: 'flex', marginBottom: 16 }}>
                {products.map((_, i) => (
                  <button key={i} onClick={() => setCurrentProduct(i)} style={{ marginRight: 8, padding: '8px 16px', border: currentProduct === i ? '2px solid #bc0e09' : '1px solid #ccc', background: 'none', cursor: 'pointer' }}>
                    Sản phẩm {i+1}
                  </button>
                ))}
              </div>
              <div className="realest-detail__fields-grid">
                {['Product Code', 'Product Name', 'Total Quantity', 'Price', 'Total Turnover'].map((field) => renderFieldForProduct(field, currentProduct))}
              </div>
            </section>
          )}
          {activeTab === 2 && (
            <section className="realest-detail__section">
              <h3>Lịch giao hàng</h3>
              <div style={{ display: 'flex', marginBottom: 16 }}>
                {products.map((p, i) => (
                  <button key={i} onClick={() => setCurrentProduct(i)} style={{ marginRight: 8, padding: '8px 16px', border: currentProduct === i ? '2px solid #bc0e09' : '1px solid #ccc', background: 'none', cursor: 'pointer' }}>
                    {p.name || `Sản phẩm ${i+1}`}
                  </button>
                ))}
              </div>
              <div className="realest-detail__fields-grid">
                {['Winning Rate', 'Status', 'Forecast FY', 'Carry-Over Qty', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'MTD Invoice', 'YTD Invoice', 'Invoiced PY', 'Open PL Qty', 'Next Delivery', 'Delivery Year', 'Creation Week'].map((field) => renderFieldForDelivery(field, currentProduct))}
              </div>
            </section>
          )}
          {activeTab === 3 && (
            <section className="realest-detail__section">
              <h3>Thông tin kỹ thuật/khác</h3>
              <div className="realest-detail__fields-grid">
                {['Specs', 'Spec Year', 'SAP name', 'KEY', 'PL key', 'Note'].map((field) => renderField(field))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;