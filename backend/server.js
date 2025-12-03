// backend/server.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors({
  origin: '*', // Allow all origins for now (can restrict to Vercel domain later)
  credentials: true
}));
app.use(express.json());

require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const SHEET_ID = process.env.SHEET_ID;
const PORT = process.env.PORT || 5050;

if (!SHEET_ID || SHEET_ID.trim() === '') {
  console.error('Missing SHEET_ID in backend/.env. Set SHEET_ID to your Google Spreadsheet ID (the long id in the sheet URL).');
  process.exit(1);
}

// ------------------- Google Auth -------------------
let credentials;

// Try to load from environment variable first (for production)
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    console.log('✅ Loaded credentials from environment variable');
  } catch (err) {
    console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', err.message);
    process.exit(1);
  }
} else {
  // Fallback to file (for local development)
  const credentialsPath = path.resolve(__dirname, 'credentials/service-account.json');
  if (!fs.existsSync(credentialsPath)) {
    console.error('Service account JSON file not found and GOOGLE_SERVICE_ACCOUNT_JSON environment variable not set!');
    process.exit(1);
  }
  credentials = require(credentialsPath);
  console.log('✅ Loaded credentials from file');
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// (header row check will be executed after headers and sheet constants are defined)

// ------------------- Sheet headers -------------------
const headers = [
  'Sales PIC','Project ID','Sub ID','Project Code','Project Link','Project Name',
  'Project Segment','Project Type','Developer','Contractor','Designer','Competitor',
  'Area','Location','Distributor','Product Code','Product Name','Total Quantity',
  'Price','Total Turnover','Winning Rate','Status','Note','Creation Week','Delivery Year',
  'Next Delivery','MTD Invoice','YTD Invoice','Invoiced PY','Open PL Qty','Forecast FY',
  'Carry-Over Qty','JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC',
  'Specs','Spec Year','SAP name','KEY','PL key'
];

function colLetter(n){
  let s='';
  while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); }
  return s;
}
const SHEET_NAME = 'B2B web data';
const END_COL = 'AW';

// Ensure header row (row 6) matches our `headers` definition. This will overwrite row 6.
async function ensureHeadersRow(){
  try{
    const rr = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${SHEET_NAME}!A6:${END_COL}6` });
    const existing = (rr.data && rr.data.values && rr.data.values[0]) || [];
    let need = false;
    for(let i=0;i<headers.length;i++){ if ((existing[i]||'').toString().trim() !== headers[i]) { need = true; break; } }
    if (need){
      await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `${SHEET_NAME}!A6:${END_COL}6`, valueInputOption: 'RAW', resource: { values: [ headers ] } });
      console.log('Header row updated to match server headers');
    }
  }catch(e){
    console.warn('Could not ensure headers row for spreadsheet id', SHEET_ID, 'and sheet', SHEET_NAME, ':', e && e.message ? e.message : e);
  }
}

ensureHeadersRow().catch(()=>{});

// ------------------- GET projects -------------------
app.get('/api/projects', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A6:${END_COL}`, // row 6 là header
    });
    res.json(response.data); // trả về { values: [...] }
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// ------------------- POST new project -------------------
app.post('/api/projects', async (req, res) => {
  try {
    const newProject = req.body || {};
    // convert object -> array theo headers
    const row = headers.map(h => newProject[h] || '');

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:${END_COL}`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });

    // trả về array mới để frontend hiển thị ngay
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// ------------------- PUT update project -------------------
app.put('/api/projects/:rowIndex', async (req, res) => {
  try {
    const rowIndex = parseInt(req.params.rowIndex); // row trong sheet (tính từ 1)
    const updatedProject = req.body;

    if (!updatedProject || isNaN(rowIndex)) {
      return res.status(400).send('Missing data or invalid row index');
    }

    const row = headers.map(h => updatedProject[h] || '');

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex}:${END_COL}${rowIndex}`,
      valueInputOption: 'RAW',
      resource: { values: [row] },
    });

    // trả về array mới để frontend cập nhật ngay
    res.json(row);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ------------------- layout settings (simple JSON on disk) -------------------
const LAYOUT_PATH = path.resolve(__dirname, 'layout.json');
app.get('/api/layout', async (req, res) => {
  try {
    if (!fs.existsSync(LAYOUT_PATH)) return res.json({});
    const raw = fs.readFileSync(LAYOUT_PATH, 'utf8');
    const obj = JSON.parse(raw || '{}');
    res.json(obj);
  } catch (err) {
    console.error('GET /api/layout err', err.message);
    res.status(500).send(err.message);
  }
});

app.put('/api/layout', async (req, res) => {
  try {
    const payload = req.body || {};
    fs.writeFileSync(LAYOUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
    res.json(payload);
  } catch (err) {
    console.error('PUT /api/layout err', err.message);
    res.status(500).send(err.message);
  }
});