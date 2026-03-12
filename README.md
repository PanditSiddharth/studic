# 🎓 Studic - Modern Educational Platform

> A full-stack, production-ready learning management system built with cutting-edge web technologies. Studic empowers educators and learners with a seamless platform for courses, blogs, and digital product distribution.

![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38b2ac?logo=tailwindcss)
![MongoDB](https://img.shields.io/badge/MongoDB-8.9-00ed64?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Key Features

### 🎯 Core Functionality
- **📚 Course Management** - Create, publish, and manage comprehensive courses with rich content
- **📝 Blog Platform** - Write and share articles with Markdown editor support and syntax highlighting
- **🛍️ Digital Products** - Upload, organize, and sell digital files with secure download links
- **💳 Payment Integration** - Seamless transaction management with order tracking
- **🔍 Advanced Search** - Full-text search across courses, blogs, and products

### 👤 User Management
- **🔐 Authentication** - Secure OAuth2 with Google and GitHub via NextAuth.js
- **👨‍💼 Admin Dashboard** - Comprehensive analytics and content management interface
- **💰 User Profiles** - Transaction history, purchase management, and account settings
- **📧 Email Notifications** - Automated emails for orders, reviews, and queries

### 🎨 User Experience
- **🌓 Dark/Light Mode** - Theme persistence with next-themes
- **📱 Responsive Design** - Mobile-first approach with Tailwind CSS
- **♿ Accessibility** - Built with Radix UI components for inclusive design
- **⚡ Performance** - Optimized with Next.js Turbopack for blazing-fast builds

### 🔧 Developer Experience
- **📦 Type Safety** - Full TypeScript implementation with Zod validation
- **🎨 Component Library** - Radix UI + Tailwind CSS for consistent, accessible UI
- **🪝 Custom Hooks** - Reusable hooks for products, reviews, users, and more
- **🗄️ Database Validation** - MongoDB schemas with Mongoose for data integrity

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15.1](https://nextjs.org) with Turbopack
- **UI Library**: [React 19](https://react.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + Custom SCSS
- **Components**: [Radix UI](https://radix-ui.com) + [shadcn/ui](https://shadcn.dev)
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
- **Encryption**: CryptoJS
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
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication endpoints
│   │   └── test/
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
├── middleware.ts                # Next.js middleware
├── store.ts                     # Zustand store setup
├── types.ts                     # TypeScript type definitions
└── tailwind.config.ts           # Tailwind configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ or **Bun**
- **MongoDB** instance (local or Atlas)
- **Git** for version control

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

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_ID=your_google_oauth_id
GOOGLE_SECRET=your_google_oauth_secret
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Email Service
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack (recommended) |
| `npm run wdev` | Start dev server with standard bundler |
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
- Markdown editor with preview
- Syntax highlighting for code blocks
- Comment and review system
- SEO-friendly slug generation

### 🛍️ Product Management
- Digital file hosting and management
- Secure download links
- Product analytics
- Inventory management

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
- ✅ MongoDB schema validation with Mongoose
- ✅ Zod runtime validation for API inputs
- ✅ CSRF protection built-in
- ✅ Secure session management
- ✅ OAuth2 integration (Google, GitHub)
- ✅ Environment variable protection

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

