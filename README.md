# Tweetie — A Fullstack Social Media Website

[![Live Demo](https://img.shields.io/badge/Live%20Demo-%F0%9F%9A%80-blue?style=for-the-badge)](https://tweetie-five.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel)](https://tweetie-five.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://tweetie-o2xx.onrender.com)

> 🔗 **Live Demo: [https://tweetie-five.vercel.app](https://tweetie-five.vercel.app)**

Tweetie is a fully responsive, fullstack **Twitter clone** built with the MERN stack, featuring user authentication, post creation, likes, comments, following, real-time profile management, and a custom AI-inspired content ranking algorithm.

---

## ✨ Features

- 🔐 **JWT Authentication** with secure HTTP-only cookies
- 📝 **Create Posts** with optional images (Cloudinary)
- 💬 **Like & Comment** on posts
- 👥 **Follow / Unfollow** users
- 🙍‍♂️ **User Profiles** with bio, links, cover & profile image upload
- 🔔 **Notifications** for new followers and likes
- 🎛️ **Edit Profile** with modal support
- 🤖 **Algorithmic "For You" Feed** — ranked using a custom HackerNews-style time-decay algorithm
- ⏰ **Background Cron Job** — pre-calculates trending scores every 10 minutes for O(1) read performance
- 📱 **Fully Responsive** design (mobile, tablet, desktop)
- 🍪 **Cross-browser Cookie Support** — works in Safari & Incognito via Vercel reverse proxy

---

## 🧠 Ranking Algorithm

The **"For You"** feed uses a custom **HackerNews Time-Decay** scoring model:

```
Score = ((Likes × 1) + (Comments × 5)) / (AgeInHours + 2)^1.5
```

- Comments are worth **5× more** than likes (they drive deeper engagement)
- A time-decay exponent of `1.5` ensures **feed freshness** — old posts sink automatically
- Scores are **pre-calculated every 10 minutes** by a background `node-cron` worker, keeping the API fast at any scale

---

## 🛠️ Tech Stack

### Frontend:
- **React.js** + **React Router**
- **Tailwind CSS** + **DaisyUI**
- **React Query** (`@tanstack/react-query`)
- **Vite** (build tool)

### Backend:
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **Cloudinary SDK** (image uploads)
- **JWT Authentication** (HTTP-only cookies)
- **node-cron** (background ranking worker)

### Deployment:
- **Frontend → Vercel** (with API reverse proxy)
- **Backend → Render** (Node.js web service)
- **Database → MongoDB Atlas**
- **Images → Cloudinary**
- **CI/CD → GitHub Webhooks** (auto-deploy on push)

---

## 🚀 Getting Started Locally

### 1. Clone the repo
```bash
git clone https://github.com/Aryangupta-05/Tweetie.git
cd Tweetie
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
MONGO_URI=your_mongodb_atlas_uri
PORT=5000
JWT_SECRET=your_jwt_secret
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
Tweetie/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── scripts/
│   │   └── ranker.js       ← Background ranking cron job
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── hooks/
    └── vercel.json         ← API reverse proxy config
```
