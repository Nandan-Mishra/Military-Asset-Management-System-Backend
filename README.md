# 🛡️ Military Asset Management System

**Short Description:**  
🛡️ Full-stack Military Asset Management system for tracking, auditing, and managing assets across bases with transparency, efficiency, and lifecycle monitoring.

---

## 🎯 Features

- Track, manage, and audit military assets across multiple bases.
- Ensure transparency and accountability in asset purchases, transfers, assignments, and expenditures.
- Monitor every item throughout its lifecycle.
- Full-stack architecture for robust performance and scalability.

---

## 💻 Backend Setup (Local)

### 1️⃣ Install dependencies

```bash
git clone https://github.com/<your-username>/Military-Asset-Management-System-Backend.git
cd Military-Asset-Management-System-Backend
npm install
```

### 2️⃣ Create .env

```bash
PORT=5001
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/military?retryWrites=true&w=majority
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRE=7d
NODE_ENV=development
```
Replace <user>, <pass>, and <cluster> with your MongoDB Atlas credentials/host.

Ensure your Atlas cluster allows your IP:

Go to Security → Network Access → Add IP → “Allow Access from Anywhere” (for testing only).

### 3️⃣ Run the server

```bash
npm run dev
```

### 4️⃣ Verify

```bash
curl http://localhost:5001/health
```

Expected response:

```json
{"status":"OK","message":"Server is running"}

```
## ⚙️ Tech Stack

Backend: Node.js, Express.js, MongoDB

Frontend: React / Vercel Deployment

Authentication: JWT

Deployment: Vercel (Frontend), MongoDB Atlas (Database)

## 📝 Notes

Ensure your MongoDB Atlas cluster allows incoming connections from your IP.

Use a strong JWT_SECRET for security.

This setup is for local development; production setup may vary.

## 🧠 Author

Nandan Kumar Mishra

📧 nandanmishra@example.com

“Designed with precision. Built for accountability.”

## 🏅 License

This project is licensed under the MIT License – feel free to modify and use it.
