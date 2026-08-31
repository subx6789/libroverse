# 📚 LibroVerse — Full-Stack eBook Platform & Reader Community

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248.svg)](https://www.mongodb.com/atlas)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-3448c5.svg)](https://cloudinary.com/)

**LibroVerse** is a modern, enterprise-grade digital eBook bookstore and social community ecosystem. Built on the **MERN** stack with **TypeScript**, **Tailwind CSS v4**, and **Zustand**, it combines full digital library publication and in-browser PDF reading with active social community feeds, discussions, user moderation, and business analytics—all strictly optimized to operate seamlessly within **free-tier resource constraints** (MongoDB Atlas, Cloudinary, Render, and Vercel).

---

## 🌟 Key Architecture & Capabilities

### 📖 1. Digital Library & AI Reading Companion
- **Curated eBook Catalog**: Filter by dynamic categories, multi-criteria search, and sorting.
- **Embedded PDF Reading**: View documents in a clean, interactive reading environment.
- **AI Reading Companion**: Contextual passage breakdown and concept summarizer powered by open-source SOTA LLMs (Qwen 2.5 72B via Hugging Face Serverless Inference).
- **Strict Role Boundary**: eBook publishing and updating is exclusively reserved for **Administrators**.

### 💬 2. Reader Social Community & Real-Time Engagement
- **Community Feed**: Readers share reviews, insights, book recommendations, and quotes.
- **AI Spark Discussion**: Generates engaging conversation starters and debate questions from book context with one click.
- **Real-Time Server-Sent Events (SSE)**: Live community feed update notifications and interactive like counters without heavy WebSocket overhead.
- **Media Uploads**: Attach images (<= 3MB in-memory gate) and short video clips (<= 8MB in-memory gate).
- **Engagement Engine**:
  - **Like & Unlike**: Real-time atomic counters.
  - **Embedded Comments**: Hybrid Mongoose schema embeddings (keeps the 3 most recent comments inline for sub-15ms reads while updating total comment counts).
  - **Post Sharing**: Quick clipboard link copy with real-time share tracking.
  - **Bookmarks / Save**: Personal saved feed for reading lists.
- **Topic Book Clubs**: Filter discussions by *Tech & Architecture*, *Sci-Fi & Fantasy*, *Book Reviews*, *Self-Improvement*, and more.

### 🛡️ 3. Admin Console, User Moderation & Analytics
- **Executive Business Analytics**: Real-time KPI cards for registered users (active vs. suspended), community engagement rates, category share meters, and cloud storage calculations.
- **Dynamic Category Manager**: Create and delete categories with automatic **Title Case** formatting (e.g. `"science fiction"` ➔ `"Science Fiction"`).
- **User Moderation (Ban / Unban)**: Search all registered users, inspect post counts, and toggle account suspensions with one click.
- **Cloud Infrastructure Metrics**: Storage monitoring calculated directly from file size tracking.

---

## ⚡ Free-Tier Optimization Engine

| Platform | Optimization Strategy |
| :--- | :--- |
| **MongoDB Atlas** | Hybrid Mongoose schema embeds only 3 recent comments inside the post document; normalized author collection prevents unbound document growth. |
| **Cloudinary** | Direct in-memory buffer streaming (`multer.memoryStorage` + `upload_stream`) prevents writing temporary files to ephemeral serverless containers. |
| **File Gates** | In-memory validation enforces strict file ceilings (Cover Image <= 2MB, PDF Document <= 10MB) before initiating cloud transfer. |
| **Rollback Safety** | Atomic rollback cleans up database records and cloud assets if an upload fails at any stage. |

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 (Solid theme, clean typography, custom scrollbars)
- **State Management**: Zustand 5
- **Icons**: Lucide React
- **HTTP Client**: Axios with JWT request/response interceptors

### Backend
- **Runtime**: Node.js + Express 5
- **Language**: TypeScript + tsx / tsc
- **Database**: MongoDB Atlas + Mongoose 9
- **Media Delivery**: Cloudinary REST API & Node stream pipeline
- **Authentication**: JWT (JSON Web Tokens) + Bcrypt password hashing
- **File Processing**: Multer memory storage

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **npm** or **pnpm**
- **MongoDB Atlas** database connection string
- **Cloudinary** free account credentials

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/libroverse.git
cd libroverse
```

---

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment configuration
cp .env.example .env
```

Configure your `backend/.env` file:
```env
PORT=3000
NODE_ENV=development
FRONTEND_DOMAIN=http://localhost:5173
MONGO_CONNECTED_STRING=mongodb+srv://<username>:<password>@cluster0.mongodb.net/libroverse?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend server:
```bash
npm run dev
```

---

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create environment configuration
cp .env.example .env
```

Start the frontend development server:
```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 📜 API Reference Summary

### Authentication & Users (`/api/users`)
- `POST /api/users/register` — Register a new reader account
- `POST /api/users/login` — Login user (checks for account suspension)
- `GET /api/users/self` — Get current user profile
- `GET /api/users` — Admin: List all users with post counts
- `PATCH /api/users/:userId/ban` — Admin: Toggle user suspension
- `POST /api/users/saved/:postId` — Toggle saving a post to bookmarks

### eBook Publications (`/api/books`)
- `GET /api/books` — List all published eBooks
- `GET /api/books/:bookId` — Get single eBook details
- `POST /api/books` — Admin: Upload & publish new eBook (Cover <= 2MB, PDF <= 10MB)
- `PUT /api/books/:bookId` — Admin: Update eBook details or replace files
- `DELETE /api/books/:bookId` — Admin: Delete publication and cloud assets

### Dynamic Categories (`/api/categories`)
- `GET /api/categories` — List all categories
- `POST /api/categories` — Admin: Create new category with auto Title Casing
- `DELETE /api/categories/:categoryId` — Admin: Delete category

### Reader Community Feed (`/api/posts`)
- `GET /api/posts` — Get community feed (filter by topic, sort by latest/top/discussed)
- `POST /api/posts` — Create community post with optional image (<= 2MB) or video (<= 10MB)
- `POST /api/posts/:postId/like` — Toggle like / unlike
- `POST /api/posts/:postId/comment` — Add comment (embeds in recent comments)
- `POST /api/posts/:postId/share` — Increment share count
- `DELETE /api/posts/:postId` — Delete post (Author or Admin)

---

## 🔒 Security & Best Practices
- **Environment Isolation**: No hardcoded API keys, secrets, or MongoDB credentials in the repository.
- **Sanitized Errors**: Production responses return clean, friendly messages while preserving full stack traces in server logs.
- **Protected Admin Routes**: Role-based access control (RBAC) enforced on both client routes and backend middleware.
- **CORS Protection**: Whitelisted origin matching in production.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
