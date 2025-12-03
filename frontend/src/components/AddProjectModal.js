// src/components/AddProjectModal.js
import React, { useState } from "react";

export default function AddProjectModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({});
  const [forecastYear, setForecastYear] = useState(new Date().getFullYear());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onCreate(formData);
  };

  const groupA = ["Sales PIC","Project ID","Sub ID","Project Code","Project Link","Project Name","Project Segment","Project Type"];
  const groupB = ["Developer","Contractor","Designer","Competitor","Distributor","Area","Location"];
  const groupC = ["Product Code","Product Name","Total Quantity","Price","Total Turnover","Winning Rate","Status"];
  const groupD = ["Creation Week","Delivery Year","Next Delivery","MTD Invoice","YTD Invoice","Invoiced PY","Open PL Qty","Forecast FY","Carry-Over Qty"];
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const groupE = ["Specs","Spec Year","SAP name","KEY","PL key","Note"];

  return (
    <div className="add-project-screen">
      <div className="add-project-header">
        <div>
          <h2 style={{ margin: 0 }}>Thêm dự án mới</h2>
        </div>
        <div>
          <button className="btn-secondary" onClick={onClose}>Hủy</button>
          <button className="btn-primary" onClick={handleSubmit} style={{ marginLeft: 8 }}>Tạo dự án</button>
        </div>
      </div>

      <div className="form-container">
        <section className="form-section">
          <div className="section-title">Thông tin cơ bản</div>
          <div className="form-grid">
            {groupA.map(field => (
              <div key={field} className="form-row">
                <label className="form-label">{field}</label>
                <input name={field} value={formData[field] || ""} onChange={handleChange} className="form-input" />
              </div>
            ))}
          </div>
        </section>

        <section className="form-section">
          <div className="section-title">Đối tác & Vị trí</div>
          <div className="form-grid">
            {groupB.map(field => (
              <div key={field} className="form-row">
                <label className="form-label">{field}</label>
                <input name={field} value={formData[field] || ""} onChange={handleChange} className="form-input" />
              </div>
            ))}
          </div>
        </section>

        <section className="form-section">
          <div className="section-title">Thông tin thương mại</div>
          <div className="form-grid">
            {groupC.map(field => (
              <div key={field} className="form-row">
                <label className="form-label">{field}</label>
                <input name={field} value={formData[field] || ""} onChange={handleChange} className="form-input" />
              </div>
            ))}
          </div>
        </section>

        <section className="form-section">
          <div className="section-title">Tài chính & Giao hàng</div>
          <div className="form-grid">
            {groupD.map(field => (
              <div key={field} className="form-row">
                <label className="form-label">{field}</label>
                <input name={field} value={formData[field] || ""} onChange={handleChange} className="form-input" />
              </div>
            ))}
          </div>
        </section>

        <section className="form-section">
          <div className="section-title-with-controls">
            <div className="section-title">Dự báo theo tháng</div>
            <div className="year-selector">
              <label className="form-label" style={{ margin: 0 }}>Năm giao hàng:</label>
              <select 
                value={forecastYear} 
                onChange={(e) => setForecastYear(Number(e.target.value))} 
                className="form-input year-select"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-grid months-grid">
            {months.map(m => (
              <div key={m} className="form-row">
                <label className="form-label">{m} {forecastYear}</label>
                <input 
                  name={m} 
                  value={formData[m] || ""} 
                  onChange={handleChange} 
                  className="form-input"
                  placeholder="0"
                  type="number"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="form-section">
          <div className="section-title">Thông tin kỹ thuật / khác</div>
          <div className="form-grid">
            {groupE.map(field => (
              <div key={field} className="form-row">
                <label className="form-label">{field}</label>
                <input name={field} value={formData[field] || ""} onChange={handleChange} className="form-input" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}