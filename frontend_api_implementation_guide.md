# Frontend API & Authentication Guide

This guide details how to interact with the JobProMax Progress Hub Backend API, focusing on authentication flows and request management.

## Base URL
Assuming the backend is running locally:
`http://localhost:8000`

## Authentication Overview
The backend uses **HTTP-Only Cookies** for security. You **do not** need to manually store tokens in localStorage/sessionStorage or attach `Authorization` headers. The browser handles this automatically if verify you set `credentials: 'include'` in your requests.

---

## 1. Login Flow

**Endpoint**: `POST /auth/login`

### Request
Send a JSON object with the user's email and password.

```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // IMPORTANT: This allows cookies to be set by the server
      credentials: 'include', 
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    console.log('User:', data.user);
    // Redirect to dashboard or update state
  } catch (error) {
    console.error(error);
  }
};
```

### Response
On success, the server sets an `auth-token` cookie.
**Body**:
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "..."
  }
}
```

---

## 2. Logout Flow

**Endpoint**: `POST /auth/logout`

### Request
Simply call the endpoint. The server will clear the cookie.

```javascript
const logout = async () => {
  try {
    await fetch('http://localhost:8000/auth/logout', {
      method: 'POST',
      // IMPORTANT: Sends the existing cookie so server can delete it (optional for simple delete but good practice)
      credentials: 'include',
    });
    
    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout failed', error);
  }
};
```

---

## 3. Managing API Requests (GET/POST/PUT/DELETE)

For all protected routes (e.g., `/tasks`, `/dashboard`), you **MUST** include `credentials: 'include'` in your fetch/axios configuration.

### Example: GET Request
Fetching protected data (e.g., Dashboard).

```javascript
const fetchDashboard = async () => {
  const response = await fetch('http://localhost:8000/dashboard/stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // <--- CRITICAL for auth
  });

  if (response.status === 401) {
    // User is not authenticated, redirect to login
    window.location.href = '/login';
    return;
  }

  const data = await response.json();
  return data;
};
```

### Example: POST Request
Creating a new resource.

```javascript
const createTask = async (taskData) => {
  const response = await fetch('http://localhost:8000/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // <--- CRITICAL for auth
    body: JSON.stringify(taskData),
  });

  return await response.json();
};
```

### Using Axios (Alternative)
If you prefer Axios, set the global config once:

```javascript
import axios from 'axios';

// Set base URL and credentials globally
const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // Equivalent to credentials: 'include'
});

// Now just use 'api' without worrying about cookies
const login = (email, password) => api.post('/auth/login', { email, password });
const getTasks = () => api.get('/tasks');
```

---

## 4. Current User Check
To check if a user is already logged in (e.g., on page load):

**Endpoint**: `GET /auth/me`

```javascript
const checkAuth = async () => {
  try {
    const response = await fetch('http://localhost:8000/auth/me', {
       method: 'GET',
       credentials: 'include' 
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('User is logged in:', user);
    } else {
      console.log('Not logged in');
    }
  } catch (e) {
    console.log('Auth check failed');
  }
}
```

## Summary Checklist
1.  **Login**: `POST /auth/login` with `credentials: 'include'`.
2.  **Logout**: `POST /auth/logout` to clear cookies.
3.  **Requests**: Always use `credentials: 'include'` (fetch) or `withCredentials: true` (axios).
4.  **Handling 401s**: If you receive a `401 Unauthorized`, redirect to the login page.
