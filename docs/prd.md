# Perfect Express + React + Tailwind CSS Boilerplate with Authentication

## 1. Purpose

The purpose of this boilerplate is to provide developers with a robust, secure, and scalable starting point for web applications using Express (Node.js), React, and Tailwind CSS. It will include essential features, following modern best practices, for authentication, session management, and UI design.

## 2. Key Features

### 2.1. Backend (Express)

#### 2.1.1 Authentication

- **JWT (JSON Web Token) Authentication:**
    - Access token with short expiration time (e.g., 15 minutes).
    - Refresh token for obtaining new access tokens.
    - Secure storage of refresh tokens in an HTTP-only cookie.
- **Password Handling:**
    - Password hashing using bcrypt.
    - Password strength enforcement (e.g., minimum 8 characters, mix of uppercase, lowercase, numbers, and special characters).
- **Password reset flow:**
    - Request password reset (email link with token).
    - Token validation and password update.
- **Forgot password flow:**
    - Triggered via email input.
- **Email Verification:**
    - Send confirmation email during registration.
    - Token-based confirmation link.
- **Session Management:**
    - Logout endpoint to invalidate refresh tokens.
    - Revoke refresh tokens on password change.
- **Account Lockout:**
    - Temporary account lock after multiple failed login attempts (e.g., 5 attempts).
- **Role-Based Access Control (RBAC):**
    - User roles (e.g., admin, user).
    - Middleware to restrict access to specific endpoints based on roles.
- **Rate Limiting:**
    - Protect login, registration, and password reset endpoints from abuse.
- **Health check route**

#### 2.1.2 API Architecture

- RESTful APIs with clear structure.
- Versioning (e.g., `/api/v1`).
- Input validation using Joi.
- Error handling middleware for consistent error responses.
- Centralized logging.

#### 2.1.3 Database

- MongoDB with a well-structured schema for users and tokens.

#### 2.1.4 Security

- Helmet for securing HTTP headers.
- CORS configuration for frontend-backend communication.
- Environment variable management using `dotenv`.

### 2.2. Frontend (React + Tailwind CSS)

#### 2.2.1 Authentication

- **Login and Register forms:**
    - Form validation with client-side feedback.
    - Dynamic display of password strength.
- **Password Reset and Forgot Password UI:**
    - Forms for requesting and updating passwords.
- **Email confirmation flow:**
    - Display instructions for email confirmation.
- **Secure storage of JWT:**
    - Access tokens stored in memory.
    - Refresh tokens handled via secure HTTP-only cookies.
- **Session management:**
    - Automatic token refresh when access tokens expire.
    - Logout functionality that clears local state and cookies.

#### 2.2.2 UI Components

- **Layout:**
    - **Navbar:**
        - Dynamic buttons for Login, Register, Logout based on auth state.
        - Brand logo and navigation links.
    - **Footer** with app-related links (e.g., Privacy Policy, Contact).
- **Pages:**
    - Home
    - Login
    - Register
    - Dashboard (requires authentication)
    - Forgot Password
    - Password Reset
    - Profile (edit user details like email, password).
- **Responsive Design:**
    - Fully responsive with mobile-first design principles.

#### 2.2.3 State Management

- Use of React Context API for managing auth state.
- Persist user session with local storage for UI state.

#### 2.2.4 Error Handling

- User-friendly error messages for all forms.
- Centralized toast notifications for API errors using React Toastify.

#### 2.2.5 Developer Experience

- Preconfigured eslint and prettier for consistent code quality.
- Tailwind CSS configuration for theme customizations.
- Well-organized folder structure:
    ```bash
    /src
      /components
      /hooks
      /pages
      /services (API calls)
      /utils
    ```

#### 2.2.6 Testing

- Unit tests for components using Jest and React Testing Library.
- End-to-end tests for authentication flow using Cypress.

## 3. Functional Requirements

**Backend**

**Endpoints:**

- `POST /api/v1/auth/register` (user registration)
- `POST /api/v1/auth/login` (user login)
- `POST /api/v1/auth/logout` (user logout)
- `POST /api/v1/auth/refresh` (refresh token)
- `POST /api/v1/auth/forgot-password` (trigger password reset email)
- `POST /api/v1/auth/reset-password` (password update)
- `GET /api/v1/auth/verify-email` (email confirmation)
- `GET /api/v1` (health check)

**Frontend**
User is redirected to login on unauthorized API response.
Forms are styled with Tailwind CSS.
Authenticated routes for protected pages.

## 4. Non-Functional Requirements

**Security:**

- Follow OWASP best practices.
- Secure cookies with SameSite=Strict and HttpOnly.

**Documentation:**

- README file with setup instructions for developers.

## 5. Future Enhancements

- Social login (Google, GitHub, etc.).
- Multi-factor authentication (MFA).
- Admin panel for user management.
- Internationalization (i18n).
