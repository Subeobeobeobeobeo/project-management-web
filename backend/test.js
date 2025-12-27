const axios = require('axios');

axios.post('http://127.0.0.1:5050/api/projects', {
  'Sales PIC': 'Alice',
  'Project ID': 'P001',
  'Sub ID': 'S001',
  'Project Code': 'PC001',
  'Project Link': 'https://example.com',
  'Project Name': 'Dự án test đầy đủ',
  'Project Segment': 'Commercial',
  'Project Type': 'Building',
  'Developer': 'Công ty Phát triển',
  'Contractor': 'Công ty Xây dựng ABC',
  'Designer': 'Designer XYZ',
  'Competitor': 'Competitor A',
  'Area': 'Hanoi',
  'Location': 'Vietnam',
  'Distributor': 'Nhà phân phối A',
  'Product Code': 'PC001',
  'Product Name': 'Sản phẩm A',
  'Total Quantity': '100',
  'Price': '50000',
  'Total Turnover': '5000000',
  'Winning Rate': '80%',
  'Status': 'Active',
  'Note': 'Test note',
  'Creation Week': 'W01',
  'Delivery Year': '2025',
  'Next Delivery': '2025-12-31',
  'MTD Invoice': '100000',
  'YTD Invoice': '500000',
  'Invoiced PY': '400000',
  'Open PL Qty': '50',
  'Forecast FY': '2000000',
  'Carry-Over Qty': '25'
})
.then(res => console.log('Project created:', res.data))
.catch(err => console.error('Error:', err.message));