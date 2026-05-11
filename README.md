# Gigzy – Gig Service Platform

> A full-stack gig service platform connecting users with job opportunities and service-based tasks.

---

## 📌 Project Overview

**Gigzy** is a scalable, real-world full-stack gig platform built to connect users with job opportunities and service-based tasks. The platform supports user registration, secure authentication, gig posting, gig applications, and internal communication.

The backend is built using **Spring Boot**, **MongoDB**, and **JWT Authentication**, following a clean, layered architecture.

---

## ✅ Features Implemented

### 1. Project Setup
- Spring Boot project initialization
- Maven dependency management
- MongoDB integration
- Layered backend architecture

### 2. Authentication & Authorization

Secure JWT-based authentication system with:

- User Registration & Login
- JWT Token Generation & Validation Filter
- Password Encryption using BCrypt
- Protected APIs
- Role-Based Access Control (RBAC)

**Roles:** `USER`, `ADMIN`

**Main Components:**
- `AuthController`
- `JwtService`
- `JwtFilter`
- `SecurityConfig`
- `UserDetailsServiceImpl`

### 3. User Management

MongoDB-integrated user management system.

**User Model Fields:**
| Field | Type |
|-------|------|
| `id` | String |
| `name` | String |
| `email` | String (unique) |
| `password` | String (encrypted) |
| `role` | Enum |
| `createdAt` | DateTime |

**Features:**
- Unique email validation
- User profile storage
- Authentication integration
- Role handling

### 4. MongoDB Integration

MongoDB is used as the primary database.

- `MongoRepository` interfaces
- Document-based collections
- Indexed fields for optimized queries
- Database configuration setup

### 5. Email Service

Integrated `JavaMailSender` for email functionality.

- HTML email support
- Welcome emails on registration
- Password reset support
- Notification-ready architecture

---

## 🏗️ Project Structure

```
src/main/java/com/app/gigzy
├── controller
├── service
├── repository
├── model
├── dto
├── config
├── security
├── auth
└── enums
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and receive JWT token |

---

## 🔒 Security Features

- JWT Authentication (Stateless)
- BCrypt Password Encryption
- Protected Routes
- Role-Based Authorization

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Java |
| Framework | Spring Boot |
| Security | Spring Security + JWT |
| Build Tool | Maven |
| Database | MongoDB |
| Email | JavaMailSender |
| Frontend (Planned) | React, React Native, Expo |
| External APIs (Planned) | Google Maps API |

---

## 🚀 How to Run

### 1. Clone the Repository
```bash
git clone <repository-url>
cd gigzy
```

### 2. Configure MongoDB

Update `src/main/resources/application.properties`:
```properties
spring.data.mongodb.uri=your_mongodb_uri
spring.data.mongodb.database=gigzy
```

### 3. Run the Application
```bash
mvn spring-boot:run
```

Server starts at: **http://localhost:8080**

---

## 🗺️ Planned Features

### Gig Module
- Post and browse gigs/jobs
- Apply for gigs
- Manage applications
- Gig status tracking

### Internal Chat System
- User-to-user communication
- Real-time messaging support

### Notification System
- Real-time in-app notifications
- Email alerts

### Google Maps Integration
- Location-based gig discovery
- Nearby job opportunities

### OTP Verification
- Email/SMS OTP verification
- Secure account verification

---

## 🔮 Future Enhancements

- [ ] Docker Deployment
- [ ] CI/CD Pipeline
- [ ] Admin Dashboard
- [ ] Analytics Dashboard
- [ ] AI-based Gig Recommendations
- [ ] Cloud Deployment

---

## 📚 Learning Outcomes

- Spring Boot Backend Development
- REST API Design
- JWT Security Implementation
- MongoDB Integration
- Clean Architecture Design
- Email Service Integration

---

## 👨‍💻 Author

Developed by **Santhosh** as a scalable real-world full-stack gig platform project.
