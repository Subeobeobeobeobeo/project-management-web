# Project Management Web - Deployment Guide

## 🚀 Quick Deploy (Free)

### Backend - Deploy to Render

1. **Push code to GitHub** (nếu chưa có):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy trên Render.com**:
   - Truy cập https://render.com và đăng ký/đăng nhập
   - Click "New +" → "Web Service"
   - Connect GitHub repository của bạn
   - Cấu hình:
     - **Name**: `project-management-backend`
     - **Root Directory**: `backend`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Environment Variables**:
       - `NODE_ENV` = `production`
       - `SHEET_ID` = `<your-google-sheet-id>`
   
3. **Upload service account file**:
   - Sau khi deploy, vào "Environment" tab
   - Thêm file `service-account.json` vào thư mục `backend/credentials/`
   - Hoặc thêm nội dung file vào biến môi trường `GOOGLE_SERVICE_ACCOUNT` (as JSON string)

4. **Copy Backend URL**: 
   - Sau khi deploy xong, copy URL (ví dụ: `https://project-management-backend.onrender.com`)

### Frontend - Deploy to Vercel

1. **Install Vercel CLI** (nếu chưa có):
   ```bash
   npm i -g vercel
   ```

2. **Deploy từ terminal**:
   ```bash
   cd frontend
   vercel
   ```

3. **Hoặc deploy qua Vercel Dashboard**:
   - Truy cập https://vercel.com
   - Import GitHub repository
   - Chọn thư mục `frontend`
   - Thêm Environment Variable:
     - `REACT_APP_API_BASE` = `<backend-url-from-render>`
   - Deploy!

4. **Copy Frontend URL**:
   - Sau khi deploy xong, copy URL (ví dụ: `https://your-project.vercel.app`)

---

## 🔧 Local Development

### Backend
```bash
cd backend
npm install
node server.js
```
Server chạy tại: http://localhost:5050

### Frontend
```bash
cd frontend
npm install
npm start
```
App chạy tại: http://localhost:3000

---

## 📝 Environment Variables

### Backend (.env)
```
SHEET_ID=your-google-sheet-id
PORT=5050
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_BASE=http://localhost:5050
```

---

## 🌐 Cách share demo với người khác

**Sau khi deploy xong:**

1. Gửi link frontend cho người dùng:
   - Ví dụ: `https://your-project.vercel.app`

2. Người dùng mở link và dùng thử ngay!

**Lưu ý**: 
- Render free tier có thể "ngủ" sau 15 phút không dùng, lần đầu truy cập sẽ chậm ~30 giây
- Vercel hoàn toàn miễn phí và nhanh

---

## 🔒 Bảo mật

**Quan trọng**: Đừng commit file sau lên GitHub:
- `backend/credentials/service-account.json`
- `backend/.env`
- `frontend/.env`

Đã có trong `.gitignore`.
