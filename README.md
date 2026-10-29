# 🎓 Studic - Modern Educational Platform

> A full-stack learning platform for structured courses, protected articles, and downloadable digital products.

![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.3-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38b2ac?logo=tailwindcss)
![MongoDB](https://img.shields.io/badge/MongoDB-8.9-00ed64?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Key Features

### 🎯 Core Functionality
- **📚 Course Management** - Create, publish, and manage comprehensive courses with rich content
- **📝 Blog Platform** - Write articles with Markdown, syntax highlighting, table-of-contents navigation, related content, and SEO metadata
- **🔐 Content Visibility** - Draft/private articles stay hidden; public, free, paid, and unlisted access is enforced server-side
- **🛍️ Digital Products** - Sell downloadable files independently or bundle them with courses
- **💳 Commerce** - Course/product orders, enrollment access, purchase history, and protected downloads
- **🔍 Search** - Search and discover courses, articles, and products from the application UI

### 👤 User Management
- **🔐 Authentication** - Credentials, Google, and GitHub sign-in via NextAuth.js
- **👨‍💼 Admin Dashboard** - Comprehensive analytics and content management interface
- **💰 User Profiles** - Transaction history, purchase management, and account settings
- **📧 Email Notifications** - Automated emails for orders, reviews, and queries

### 🎨 User Experience
- **🌓 Dark/Light Mode** - Theme persistence with next-themes
- **📱 Responsive Design** - Mobile-first approach with Tailwind CSS
- **♿ Accessibility** - Radix UI primitives, responsive layouts, and reduced-motion support
- **✨ Motion Design** - Framer Motion animations with reduced-motion handling
- **⚡ Performance** - Next.js App Router, Server Components, image optimization, and code splitting

### 🔧 Developer Experience
- **📦 Type Safety** - Full TypeScript implementation with Zod validation
- **🎨 Component Library** - Radix UI + Tailwind CSS for consistent, accessible UI
- **🪝 Custom Hooks** - Reusable hooks for products, reviews, users, and more
- **🗄️ Database Validation** - MongoDB schemas with Mongoose for data integrity

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16.4](https://nextjs.org) with Turbopack
- **UI Library**: [React 19.3](https://react.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + Custom SCSS
- **Components**: [Radix UI](https://radix-ui.com) primitives and reusable local UI components
- **Forms**: [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs)
- **Icons**: [Lucide React](https://lucide.dev) + [React Icons](https://react-icons.github.io/react-icons)

### Backend
- **Database**: [MongoDB](https://www.mongodb.com) with [Mongoose](https://mongoosejs.com)
- **Authentication**: [NextAuth.js 5](https://next-auth.js.org)
- **Email**: [Nodemailer](https://nodemailer.com)
- **File Upload**: [Cloudinary](https://cloudinary.com)

### Tools & Libraries
- **Type Checking**: TypeScript + tsc
- **Linting**: ESLint + Next.js config
- **Validation**: Zod schemas
- **HTTP Client**: Axios
- **Security**: NextAuth.js, Zod, server-side authorization, security headers, and request throttling
- **Code Highlighting**: Highlight.js + Rehype Plugins
- **Animations**: Framer Motion
- **Carousels**: Embla Carousel

---

## 📂 Project Structure

```
studic/
├── app/                          # Next.js App Router
│   ├── (app)/                   # Main application routes
│   │   ├── page.tsx             # Homepage with hero section
│   │   ├── courses/             # Course listing and details
│   │   ├── blogs/               # Blog management
│   │   ├── contact/             # Contact form
│   │   └── ...                  # Additional pages
│   ├── admin/                   # Admin dashboard
│   │   ├── page.tsx             # Analytics overview
│   │   ├── (add)/               # Add new content
│   │   ├── (show)/              # Manage existing content
│   │   └── make-admin/          # Admin promotion panel
│   ├── api/                     # API routes (auth and gated downloads)
│   ├── sitemap.ts               # Database-backed public sitemap
│   ├── robots.ts                # Crawler rules and sitemap location
│   └── layout.tsx               # Root layout with providers
│
├── components/                   # React components
│   ├── product/                 # Product-related components
│   │   ├── product-form.tsx     # Add/edit product form
│   │   ├── product-card.tsx     # Product display card
│   │   └── ...                  # Other product components
│   ├── navbar/                  # Navigation components
│   ├── sidebar/                 # Sidebar navigation
│   ├── ui/                      # Reusable UI components
│   ├── Cards.tsx                # Blog/Course card components
│   └── ...
│
├── server-functions/            # Server actions (Server Components)
│   ├── product.ts               # Product operations
│   ├── blog.ts                  # Blog operations
│   ├── course.ts                # Course operations
│   ├── user.ts                  # User operations
│   ├── mailer.ts                # Email service
│   └── ...
│
├── modals/                      # MongoDB models & schemas
│   ├── product.model.ts         # Product schema
│   ├── user.model.ts            # User schema
│   ├── blog.model.ts            # Blog schema
│   ├── course.model.ts          # Course schema
│   ├── zod.ts                   # Zod validation schemas
│   └── ...
│
├── hooks/                       # Custom React hooks
│   ├── use-products.ts          # Products data hook
│   ├── use-users.ts             # Users data hook
│   └── ...
│
├── auth_config.ts               # NextAuth configuration
├── connectDB.ts                 # MongoDB connection
├── proxy.ts                     # Next.js 16 request proxy and protected-route throttling
├── lib/                         # Shared SEO and security utilities
├── store.ts                     # Zustand store setup
├── types.ts                     # TypeScript type definitions
└── tailwind.config.ts           # Tailwind configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 24.x** (the project engine range is `>=24.0.0 <25.0.0`)
- **MongoDB** instance (local or Atlas)
- **Git** for version control
- **Cloudinary** account for media and file uploads

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/PanditSiddharth/studic.git
cd studic
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

> The repository includes both `package-lock.json` and `bun.lock`. Use one package manager consistently.

3. **Configure environment variables**

Create a `.env.local` file in the project root. The following names match the application code:

```env
# MongoDB
URI=mongodb_connection_string

# Auth.js / NextAuth
AUTH_SECRET=long_random_secret
NEXTAUTH_SECRET=long_random_secret
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# OAuth providers
AUTH_GOOGLE_ID=google_client_id
AUTH_GOOGLE_SECRET=google_client_secret
AUTH_GITHUB_ID=github_client_id
AUTH_GITHUB_SECRET=github_client_secret

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Site and SEO
DOMAIN=https://www.example.com
NEXT_PUBLIC_DOMAIN=https://www.example.com

# Admin/payment configuration used by the deployment
SKEY=your_payment_key
MID=your_payment_merchant_id
SUPER_ADMIN_EMAILS=admin@example.com

# Brevo SMTP credentials used by the admin mailer
USER_MAIL=your_smtp_login
MAIL_PASSWORD=your_smtp_password
```

Do not commit `.env`, `.env.local`, or any secret values. For local development, `DOMAIN` and
`NEXT_PUBLIC_DOMAIN` can both be `http://localhost:3000`. `NEXT_PUBLIC_*` values are exposed to
the browser, so never put private credentials in them.

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The development server uses
Turbopack; use `npm run dev:webpack` if you need to compare Webpack behavior.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js 16 dev server with Turbopack (default) |
| `npm run dev:webpack` | Start dev server using Webpack for compatibility testing |
| `npm run wdev` | Alias for `npm run dev` |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run type` | Run TypeScript type checking |
| `npm run lint` | Run ESLint checks |

---

## 🎯 Core Features Breakdown

### 📚 Course Management
- Rich content editor for course materials
- File uploads with Cloudinary integration
- Progress tracking for enrolled students
- Course categorization and tagging

### 📝 Blog System
- Markdown editor with preview and syntax highlighting
- Public, free, paid, private, draft, and unlisted visibility states
- Paid article access through eligible purchases/course enrollment
- Direct article layout with “On this page” navigation and related courses/articles
- SEO-friendly metadata, canonical URLs, Open Graph/Twitter cards, JSON-LD, sitemap, and robots rules

### 🛍️ Product Management
- Digital file hosting and management
- Server-side ownership/enrollment checks before download URLs are revealed
- Independent product purchases and course-bundled product access

### 💳 E-Commerce Features
- Secure payment processing
- Order management system
- Transaction history
- Receipt and confirmation emails

### 📊 Admin Analytics
- User growth metrics
- Revenue tracking
- Content performance
- Transaction analytics

---

## 🔒 Security Features

- ✅ NextAuth.js for secure authentication
- ✅ Suspended/deleted accounts rejected during credentials and OAuth sign-in
- ✅ MongoDB schema validation with Mongoose
- ✅ Zod runtime validation and length limits for public contact submissions
- ✅ Server-side authorization for articles, courses, products, and downloads
- ✅ Rate limiting for login, registration, contact submissions, downloads, and sensitive routes
- ✅ Security headers including CSP, frame protection, MIME sniffing protection, and referrer policy
- ✅ Secure session management
- ✅ OAuth2 integration (Google, GitHub)
- ✅ Environment variable protection

Application throttling is an abuse-control layer, not a substitute for network-level DDoS
protection. Production deployments should additionally use a CDN/WAF such as Cloudflare or a
hosting-provider WAF with distributed rate limiting.

## 🔎 SEO and indexing

- `/sitemap.xml` is generated dynamically from published courses, public/free/paid articles,
  published products, and static public pages.
- `/robots.txt` allows public content and disallows admin, API, authentication, profile, chat,
  payment, and terminal routes.
- Private, draft, and unlisted articles are excluded from the sitemap.
- Article, course, and product pages provide route-specific metadata and structured data.

---

## 📈 Performance Optimizations

- 🔥 **Turbopack**: Next-generation bundler for ultra-fast builds
- 📦 **Code Splitting**: Automatic route-based code splitting
- 🖼️ **Image Optimization**: Next.js Image component
- 📄 **Font Optimization**: Google Fonts integration
- ⚡ **Server Components**: Reduced client-side JavaScript
- 🎨 **CSS Optimization**: Tailwind's JIT compiler
- 🔄 **Streaming**: React Server Components streaming

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Siddharth Pandit**  
- GitHub: [@PanditSiddharth](https://github.com/PanditSiddharth)
- Email: [contact email if desired]

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) team for an amazing framework
- [Radix UI](https://radix-ui.com) for accessible components
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
- [MongoDB](https://mongodb.com) for flexible data storage
- All contributors and supporters

---

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the author.

---

<div align="center">

### Made with ❤️ by Siddharth Sharma

⭐ If you find this project useful, please consider giving it a star!

</div>
