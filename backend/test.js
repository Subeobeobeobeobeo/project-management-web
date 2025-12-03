const axios = require('axios');

axios.post('http://127.0.0.1:5000/api/projects', {
  SalesPIC: 'Alice',
  ProjectID: 'P001',
  ProjectName: 'Dự án test'
})
.then(res => console.log(res.data))
.catch(err => console.error(err));