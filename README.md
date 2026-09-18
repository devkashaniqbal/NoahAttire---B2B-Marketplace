# TradeHub B2B Marketplace

A full-stack Alibaba-style B2B marketplace platform with seller portal, buyer inquiries, and admin dashboard.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (httpOnly cookies)
- **Storage**: Cloudinary (images)
- **Email**: Nodemailer + Gmail SMTP

---

## Quick Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)
- Gmail account with App Password enabled

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your actual credentials:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/b2b-marketplace
JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password   # Gmail > Security > App Passwords

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Seed admin user:
```bash
node scripts/seedAdmin.js
```

Start backend:
```bash
npm run dev   # development (nodemon)
npm start     # production
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```

Open **http://localhost:3000**

---

## Default Credentials

| Role  | Email                | Password  |
|-------|----------------------|-----------|
| Admin | admin@tradehub.b2b   | admin123  |

---

## URL Structure

### Public Pages
| URL | Description |
|-----|-------------|
| `/` | Homepage — hero, categories, featured sellers & products |
| `/products` | Product catalog with filters |
| `/products/[id]` | Product detail + inquiry form |
| `/sellers` | All sellers directory |
| `/sellers/[id]` | Seller public profile + listings |

### Auth
| URL | Description |
|-----|-------------|
| `/login` | Sign in |
| `/register` | Register (buyer or seller) |

### Seller Portal (requires seller role)
| URL | Description |
|-----|-------------|
| `/seller/dashboard` | Stats + recent inquiries |
| `/seller/products` | Add / edit / delete products |
| `/seller/inquiries` | View & manage buyer inquiries |
| `/seller/profile` | Edit business profile |

### Admin Panel (requires admin role)
| URL | Description |
|-----|-------------|
| `/admin/dashboard` | Platform stats |
| `/admin/sellers` | Manage sellers (suspend/activate) |
| `/admin/products` | All products (delete any) |
| `/admin/users` | All users (ban/unban) |
| `/admin/inquiries` | All inquiries (read-only, filterable) |

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/sellers              - public seller list
GET    /api/sellers/featured     - featured sellers (homepage)
GET    /api/sellers/:id          - seller by profile id
GET    /api/sellers/user/:userId - seller by user id
GET    /api/sellers/me/profile   - own profile (seller auth)
PUT    /api/sellers/me/profile   - update own profile (seller auth)

GET    /api/products             - public catalog (with filters)
GET    /api/products/featured    - featured products (homepage)
GET    /api/products/categories  - category list
GET    /api/products/:id         - product detail
GET    /api/products/seller/:id  - products by seller
GET    /api/products/me/list     - own products (seller auth)
POST   /api/products             - create product (seller auth)
PUT    /api/products/:id         - update product (seller auth)
DELETE /api/products/:id         - delete product (seller auth)

POST   /api/inquiries            - submit inquiry (guest or auth)
GET    /api/inquiries/mine       - seller's inquiries (seller auth)
PATCH  /api/inquiries/:id/status - update status (seller auth)
GET    /api/inquiries            - all inquiries (admin auth)

GET    /api/admin/stats
GET    /api/admin/users
PATCH  /api/admin/users/:id/ban
PATCH  /api/admin/users/:id/unban
GET    /api/admin/sellers
PATCH  /api/admin/sellers/:id/suspend
PATCH  /api/admin/sellers/:id/reactivate
GET    /api/admin/products
DELETE /api/admin/products/:id

POST   /api/upload               - upload image (any auth)
```

---

## Email Setup (Gmail)

1. Go to Google Account → Security → 2-Step Verification (must be ON)
2. Go to Security → App Passwords
3. Create an app password for "Mail"
4. Use the 16-char password as `EMAIL_PASS` in `.env`

---

## Cloudinary Setup

1. Sign up at cloudinary.com (free tier)
2. Dashboard → API Keys
3. Copy `Cloud Name`, `API Key`, `API Secret` to `.env`
