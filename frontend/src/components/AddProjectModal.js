// src/components/AddProjectModal.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const headers = [
  'Sales PIC','Project ID','Sub ID','Project Code','Project Link','Project Name',
  'Project Segment','Project Type','Developer','Contractor','Designer','Competitor',
  'Area','Location','Distributor','Product Code','Product Name','Loại sản phẩm','Total Quantity',
  'Price','Total Turnover','Winning Rate','Status','Note','Creation Week','Delivery Year',
  'Next Delivery','MTD Invoice','YTD Invoice','Invoiced PY','Open PL Qty','Forecast FY',
  'Carry-Over Qty','JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC',
  'Specs','Spec Year','SAP name','KEY','PL key'
];

export default function AddProjectModal({ onClose, onCreate, onUpdate, initialProjects, initialIndices }) {
  const [formData, setFormData] = useState({});
  const [forecastYear, setForecastYear] = useState(new Date().getFullYear());
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Thông tin cơ bản, 1: Danh mục sản phẩm, 2: Lịch giao hàng, 3: Thông tin kỹ thuật/khác
  const [contractors, setContractors] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [productCodes, setProductCodes] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [codeToName, setCodeToName] = useState({});
  const [nameToCode, setNameToCode] = useState({});
  const [products, setProducts] = useState([{ code: '', name: '', quantity: '', price: '', turnover: '', rate: '', status: '', delivery: { creationWeek: '', deliveryYear: '', nextDelivery: '', mtdInvoice: '', ytdInvoice: '', invoicedPY: '', openPLQty: '', forecastFY: '', carryOverQty: '' } }]);
  const [currentProduct, setCurrentProduct] = useState(0);
  const [productCodeSearch, setProductCodeSearch] = useState('');
  const [productCodeOpen, setProductCodeOpen] = useState(false);
  const [productNameSearch, setProductNameSearch] = useState('');
  const [productNameOpen, setProductNameOpen] = useState(false);

  useEffect(() => {
    if (initialProjects && initialProjects.length > 0) {
      console.log('Preloading data for edit:', initialProjects);
      // Preload formData from first project
      const proj = initialProjects[0].project;
      console.log('First project data:', proj);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = proj[i] || '';
      });
      console.log('Preloaded formData:', obj);
      setFormData(obj);
      // Preload products
      const prods = initialProjects.map(item => {
        const p = item.project;
        return {
          code: p[15] || '',
          name: p[16] || '',
          quantity: p[17] || '',
          price: p[18] || '',
          turnover: p[19] || '',
          rate: p[20] || '',
          status: p[21] || '',
          delivery: {
            creationWeek: p[23] || '',
            deliveryYear: p[24] || '',
            nextDelivery: p[25] || '',
            mtdInvoice: p[26] || '',
            ytdInvoice: p[27] || '',
            invoicedPY: p[28] || '',
            openPLQty: p[29] || '',
            forecastFY: p[30] || '',
            carryOverQty: p[31] || ''
          }
        };
      });
      // Remove duplicates
      const uniqueProds = prods.filter((prod, index, arr) => 
        arr.findIndex(p => p.code === prod.code && p.name === prod.name) === index
      );
      console.log('Preloaded products:', uniqueProds);
      setProducts(uniqueProds);
    }
  }, [initialProjects]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const response = await axios.get('http://localhost:5050/api/projects');
        const projects = response.data.values || [];
        const contractorSet = new Set();
        const distributorSet = new Set();
        const codeSet = new Set();
        const nameSet = new Set();
        const codeMap = {};
        const nameMap = {};
        projects.forEach(project => {
          if (project[9]) contractorSet.add(project[9]); // Contractor index 9
          if (project[14]) distributorSet.add(project[14]); // Distributor index 14
          if (project[15]) { // Product Code index 15
            codeSet.add(project[15]);
            if (project[16]) { // Product Name index 16
              codeMap[project[15]] = project[16];
            }
          }
          if (project[16]) {
            nameSet.add(project[16]);
            if (project[15]) {
              nameMap[project[16]] = project[15];
            }
          }
        });
        setContractors(Array.from(contractorSet).sort());
        setDistributors(Array.from(distributorSet).sort());
        setProductCodes(Array.from(codeSet).sort());
        setProductNames(Array.from(nameSet).sort());
        setCodeToName(codeMap);
        setNameToCode(nameMap);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        // Set empty if error
        setContractors([]);
        setDistributors([]);
        setProductCodes([]);
        setProductNames([]);
        setCodeToName({});
        setNameToCode({});
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    setProductCodeSearch(products[currentProduct] && products[currentProduct].code ? products[currentProduct].code : '');
  }, [products, currentProduct]);

  useEffect(() => {
    setProductNameSearch(products[currentProduct] && products[currentProduct].name ? products[currentProduct].name : '');
  }, [products, currentProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (activeTab === 0) {
      // Basic info
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (activeTab === 1) {
      // Product catalog
      setProducts(prev => prev.map((p, idx) => idx === currentProduct ? { ...p, [name]: value } : p));
      // Auto-fill for products
      if (name === 'code' && codeToName[value]) {
        setProducts(prev => prev.map((p, idx) => idx === currentProduct ? { ...p, name: codeToName[value] } : p));
      }
      if (name === 'name' && nameToCode[value]) {
        setProducts(prev => prev.map((p, idx) => idx === currentProduct ? { ...p, code: nameToCode[value] } : p));
      }
    } else if (activeTab === 2) {
      // Delivery or months
      if (months.includes(name)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      } else {
        setProducts(prev => prev.map((p, idx) => idx === currentProduct ? { ...p, delivery: { ...p.delivery, [name]: value } } : p));
      }
    } else {
      // Other
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setIsCreating(true);
    try {
      if (initialProjects) {
        // Update mode: update each existing row
        for (let i = 0; i < initialProjects.length; i++) {
          const prod = products[i];
          const payload = {
            ...formData,
            'Product Code': prod.code,
            'Product Name': prod.name,
            'Total Quantity': prod.quantity,
            'Price': prod.price,
            'Total Turnover': prod.turnover,
            'Winning Rate': prod.rate,
            'Status': prod.status,
            'Loại sản phẩm': prod.name,
            'Creation Week': prod.delivery && prod.delivery.creationWeek,
            'Delivery Year': prod.delivery && prod.delivery.deliveryYear,
            'Next Delivery': prod.delivery && prod.delivery.nextDelivery,
            'MTD Invoice': prod.delivery && prod.delivery.mtdInvoice,
            'YTD Invoice': prod.delivery && prod.delivery.ytdInvoice,
            'Invoiced PY': prod.delivery && prod.delivery.invoicedPY,
            'Open PL Qty': prod.delivery && prod.delivery.openPLQty,
            'Forecast FY': prod.delivery && prod.delivery.forecastFY,
            'Carry-Over Qty': prod.delivery && prod.delivery.carryOverQty
          };
          await onUpdate(payload, initialIndices[i]);
        }
      } else {
        // Create mode
        for (const product of products) {
          const projectData = {
            ...formData,
            'Product Code': product.code,
            'Product Name': product.name,
            'Total Quantity': product.quantity,
            'Price': product.price,
            'Total Turnover': product.turnover,
            'Winning Rate': product.rate,
            'Status': product.status,
            'Loại sản phẩm': product.name, // Set to product name
            'Creation Week': product.delivery && product.delivery.creationWeek,
            'Delivery Year': product.delivery && product.delivery.deliveryYear,
            'Next Delivery': product.delivery && product.delivery.nextDelivery,
            'MTD Invoice': product.delivery && product.delivery.mtdInvoice,
            'YTD Invoice': product.delivery && product.delivery.ytdInvoice,
            'Invoiced PY': product.delivery && product.delivery.invoicedPY,
            'Open PL Qty': product.delivery && product.delivery.openPLQty,
            'Forecast FY': product.delivery && product.delivery.forecastFY,
            'Carry-Over Qty': product.delivery && product.delivery.carryOverQty
          };
          await onCreate(projectData);
        }
      }
      // Show success message
      setShowSuccess(true);
      // Reset form
      setFormData({});
      setProducts([{ code: '', name: '', quantity: '', price: '', turnover: '', rate: '', status: '', delivery: { creationWeek: '', deliveryYear: '', nextDelivery: '', mtdInvoice: '', ytdInvoice: '', invoicedPY: '', openPLQty: '', forecastFY: '', carryOverQty: '' } }]);
      setCurrentProduct(0);
      setForecastYear(new Date().getFullYear());
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Lỗi khi lưu dự án: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Gom nhóm Thông tin cơ bản và Đối tác & Vị trí
  const groupBasic = [
    "Sales PIC","Project ID","Sub ID","Project Code","Project Link","Project Name","Project Segment","Project Type",
    "Developer","Contractor","Designer","Competitor","Distributor","Area","Location"
  ];
  const groupProduct = ["code","name","quantity","price","turnover","rate","status"];
  const groupDelivery = ["creationWeek","deliveryYear","nextDelivery","mtdInvoice","ytdInvoice","invoicedPY","openPLQty","forecastFY","carryOverQty"];
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const groupOther = ["Specs","Spec Year","SAP name","KEY","PL key","Note"];

  return (
    <div className="add-project-screen">
      {showSuccess && (
        <div className="success-toast">
          <span className="success-icon">✓</span>
          <span>{initialProjects ? 'Cập nhật dự án thành công!' : 'Tạo dự án thành công!'}</span>
        </div>
      )}
      <div className="add-project-header">
        <div>
          <h2 style={{ margin: 0, fontWeight: 700 }}>Thêm/Chỉnh sửa dự án</h2>
        </div>
        <div>
          <button className="btn-secondary" onClick={onClose} disabled={isCreating}>Hủy</button>
          <button className="btn-primary" onClick={handleSubmit} style={{ marginLeft: 8 }} disabled={isCreating}>
            {isCreating ? 'Đang lưu...' : initialProjects ? 'Tạo/Cập nhật dự án' : 'Tạo dự án'}
          </button>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', borderBottom: '1px solid #eee', marginBottom: 16 }}>
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
        <div className="form-container">
          {activeTab === 0 && (
            <section key="basic" className="form-section">
              <div className="section-title">Thông tin cơ bản</div>
              <div className="form-grid">
                {groupBasic.map(field => (
                  <div key={field} className="form-row">
                    <label className="form-label">{field}</label>
                    {field === 'Contractor' ? (
                      <select name="Contractor" value={formData['Contractor'] || ""} onChange={handleChange} className="form-input">
                        <option value="">Chọn Contractor</option>
                        {contractors.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : field === 'Distributor' ? (
                      <select name="Distributor" value={formData['Distributor'] || ""} onChange={handleChange} className="form-input">
                        <option value="">Chọn Distributor</option>
                        {distributors.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <input name={field} value={formData[field] || ""} onChange={handleChange} className="form-input" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {activeTab === 1 && (
            <section key="product" className="form-section">
              <div className="section-title">Danh mục sản phẩm</div>
              <div style={{ display: 'flex', marginBottom: 16 }}>
                {products.map((_, i) => (
                  <button key={i} onClick={() => setCurrentProduct(i)} style={{ marginRight: 8, padding: '8px 16px', border: currentProduct === i ? '2px solid #bc0e09' : '1px solid #ccc', background: 'none', cursor: 'pointer' }}>
                    Sản phẩm {i+1}
                  </button>
                ))}
                <button onClick={() => setProducts([...products, { code: '', name: '', quantity: '', price: '', turnover: '', rate: '', status: '', delivery: { creationWeek: '', deliveryYear: '', nextDelivery: '', mtdInvoice: '', ytdInvoice: '', invoicedPY: '', openPLQty: '', forecastFY: '', carryOverQty: '' } }])} style={{ padding: '8px 16px', background: '#bc0e09', color: 'white', border: 'none', cursor: 'pointer' }}>Thêm sản phẩm</button>
              </div>
              <div className="form-grid">
                {groupProduct.map(field => (
                  <div key={field} className="form-row">
                    <label className="form-label">{field === 'code' ? 'Product Code' : field === 'name' ? 'Product Name' : field === 'quantity' ? 'Total Quantity' : field === 'price' ? 'Price' : field === 'turnover' ? 'Total Turnover' : field === 'rate' ? 'Winning Rate' : 'Status'}</label>
                    {field === 'code' ? (
                      <div className="dropdown" style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={productCodeSearch}
                          onChange={(e) => setProductCodeSearch(e.target.value)}
                          onFocus={() => setProductCodeOpen(true)}
                          placeholder="Chọn Product Code"
                          className="form-input"
                        />
                        {productCodeOpen && (
                          <div className="dropdown-options" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}>
                            {productCodes.filter(c => c.toLowerCase().includes(productCodeSearch.toLowerCase())).map(c => (
                              <div key={c} onClick={() => { setProducts(prev => prev.map((p,i) => i===currentProduct ? {...p, code: c, name: codeToName[c] || p.name} : p)); setProductCodeSearch(c); setProductCodeOpen(false); }} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                {c}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : field === 'name' ? (
                      <div className="dropdown" style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={productNameSearch}
                          onChange={(e) => setProductNameSearch(e.target.value)}
                          onFocus={() => setProductNameOpen(true)}
                          placeholder="Chọn Product Name"
                          className="form-input"
                        />
                        {productNameOpen && (
                          <div className="dropdown-options" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}>
                            {productNames.filter(n => n.toLowerCase().includes(productNameSearch.toLowerCase())).map(n => (
                              <div key={n} onClick={() => { setProducts(prev => prev.map((p,i) => i===currentProduct ? {...p, name: n, code: nameToCode[n] || p.code} : p)); setProductNameSearch(n); setProductNameOpen(false); }} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                {n}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input name={field} value={products[currentProduct][field] || ""} onChange={handleChange} className="form-input" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {activeTab === 2 && (
            <div key="delivery">
              <section className="form-section">
                <div className="section-title">Tài chính & Giao hàng</div>
                <div style={{ display: 'flex', marginBottom: 16 }}>
                  {products.map((p, i) => (
                    <button key={i} onClick={() => setCurrentProduct(i)} style={{ marginRight: 8, padding: '8px 16px', border: currentProduct === i ? '2px solid #bc0e09' : '1px solid #ccc', background: 'none', cursor: 'pointer' }}>
                      {p.name || `Sản phẩm ${i+1}`}
                    </button>
                  ))}
                </div>
                <div className="form-grid">
                  {groupDelivery.map(field => (
                    <div key={field} className="form-row">
                      <label className="form-label">{field === 'creationWeek' ? 'Creation Week' : field === 'deliveryYear' ? 'Delivery Year' : field === 'nextDelivery' ? 'Next Delivery' : field === 'mtdInvoice' ? 'MTD Invoice' : field === 'ytdInvoice' ? 'YTD Invoice' : field === 'invoicedPY' ? 'Invoiced PY' : field === 'openPLQty' ? 'Open PL Qty' : field === 'forecastFY' ? 'Forecast FY' : 'Carry-Over Qty'}</label>
                      <input name={field} value={products[currentProduct].delivery[field] || ""} onChange={handleChange} className="form-input" />
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
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                      <option value={2027}>2027</option>
                      <option value={2028}>2028</option>
                      <option value={2029}>2029</option>
                      <option value={2030}>2030</option>
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
            </div>
          )}
          {activeTab === 3 && (
            <section key="other" className="form-section">
              <div className="section-title">Thông tin kỹ thuật / khác</div>
              <div className="form-grid">
                {groupOther.map(field => (
                  <div key={field} className="form-row">
                    <label className="form-label">{field}</label>
                    <input name={field} value={formData[field] || ""} onChange={handleChange} className="form-input" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>);
}