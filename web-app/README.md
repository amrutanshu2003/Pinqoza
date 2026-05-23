# Pinqoza - E-commerce Platform

A modern e-commerce platform (multi-category marketplace) built with React, Node.js, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud)

### One-Command Setup

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start both frontend and backend:**
   ```bash
   npm start
   ```

That's it! 🎉 Both servers will start automatically:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start both frontend and backend |
| `npm run dev` | Start both in development mode |
| `npm run client` | Start only frontend |
| `npm run server` | Start only backend |
| `npm run server:dev` | Start backend with nodemon |
| `npm run install-all` | Install dependencies for all packages |
| `npm run build` | Build frontend for production |

## 🏗️ Project Structure

```
Pinqoza/
├── client/          # React frontend
├── server/           # Node.js backend
├── package.json      # Root package file
└── README.md         # This file
```

## 🔧 Environment Setup

Create `.env` file in `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pinqoza
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000

# Google OAuth (optional: enables "Continue with Google" login)
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
# Example: http://localhost:5000/api/users/auth/google/callback
GOOGLE_REDIRECT_URI=

# Required for forgot-password OTP emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
MAIL_FROM="Pinqoza Support <your-email@gmail.com>"
```

## 📦 Features

- ✅ Real-time product search
- ✅ Modern UI with Tailwind CSS
- ✅ Shopping cart functionality
- ✅ User authentication
- ✅ Admin dashboard
- ✅ Order management
- ✅ Payment integration
- ✅ Real-time notifications

## 🛠️ Technologies Used

### Frontend
- React 18
- React Router
- Axios
- Tailwind CSS
- Socket.io-client

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.io
- CORS

## 📱 Usage

1. **Browse Products**: Explore products across categories
2. **Search**: Real-time search functionality
3. **Add to Cart**: Select products and add to cart
4. **Checkout**: Complete purchase process
5. **Admin Panel**: Manage products and orders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit and push
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Coding! 🥛🧀🥛**
