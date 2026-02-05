# Complete User Management API Guide

This guide shows how to use the User Management APIs from your frontend, following the established patterns in this codebase.

## Base Configuration

### Using the Existing API Service (Recommended)

The application already has a centralized API service that handles the backend URL configuration. **Use this instead of creating a new axios instance:**

```javascript
import { fetchAPI } from '@/services/api';

// The fetchAPI helper automatically:
// - Uses the /api proxy (which rewrites to BACKEND_URL)
// - Includes credentials for auth cookies
// - Handles JSON parsing and errors
```

### Alternative: Direct Axios Configuration

If you need to create a custom axios instance for specific use cases:

```javascript
import axios from 'axios';

// Use the /api proxy - Next.js will rewrite to BACKEND_URL
const api = axios.create({
  baseURL: '/api',  // Uses Next.js proxy
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json'
  }
});
```

> [!IMPORTANT]
> **Never hardcode backend URLs in frontend code.** Always use `/api` which is proxied to `BACKEND_URL` via `next.config.ts`.

---

## API Endpoints

### 1. List All Users (GET)

```javascript
// Using the existing fetchAPI helper
const getAllUsers = async () => {
  try {
    const users = await fetchAPI('users/');
    console.log(users); // Array of users
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

// Response format:
// [
//   {
//     "id": "67890abc...",
//     "name": "John Doe",
//     "email": "john@example.com",
//     "role": "developer"
//   },
//   ...
// ]
```

---

### 2. Get Single User (GET)

```javascript
const getUserById = async (userId) => {
  try {
    const user = await fetchAPI(`users/${userId}`);
    console.log(user);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
  }
};

// Response format:
// {
//   "id": "67890abc...",
//   "name": "John Doe",
//   "email": "john@example.com",
//   "role": "developer"
// }
```

---

### 3. Create User (POST)

```javascript
const createUser = async (userData) => {
  try {
    const newUser = await fetchAPI('users/', {
      method: 'POST',
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        role: userData.role, // "manager", "developer", or "leadership"
        password: userData.password
      })
    });
    console.log('User created:', newUser);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

// Example usage:
// createUser({
//   name: "Jane Smith",
//   email: "jane@example.com",
//   role: "developer",
//   password: "securePassword123"
// });
```

---

### 4. Update User (PUT)

```javascript
const updateUser = async (userId, userData) => {
  try {
    const updatedUser = await fetchAPI(`users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        role: userData.role
      })
    });
    console.log('User updated:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
  }
};

// Example usage:
// updateUser("67890abc...", {
//   name: "Jane Smith Updated",
//   email: "jane.smith@example.com",
//   role: "manager"
// });
```

---

### 5. Delete User (DELETE)

```javascript
const deleteUser = async (userId) => {
  try {
    const result = await fetchAPI(`users/${userId}`, { 
      method: 'DELETE' 
    });
    console.log('User deleted:', result);
    return result;
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};

// Response format:
// {
//   "message": "User deleted successfully",
//   "id": "67890abc..."
// }
```

---

### 6. Admin Reset Password (PATCH)

```javascript
// Manager resets any user's password
const adminResetPassword = async (userId, newPassword) => {
  try {
    const result = await fetchAPI(`users/${userId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({
        password: newPassword
      })
    });
    console.log('Password reset:', result);
    return result;
  } catch (error) {
    console.error('Error resetting password:', error);
  }
};

// Response format:
// {
//   "message": "Password reset successfully"
// }
```

---

### 7. Self Password Change (PATCH)

```javascript
// User changes their own password
const changeOwnPassword = async (oldPassword, newPassword) => {
  try {
    const result = await fetchAPI('users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      })
    });
    console.log('Password changed:', result);
    return result;
  } catch (error) {
    console.error('Error changing password:', error);
  }
};

// Response format:
// {
//   "message": "Password changed successfully"
// }
```

---

## Complete React Component Example

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'developer' | 'leadership';
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAPI('users/');
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (formData: Omit<User, 'id'> & { password: string }) => {
    try {
      await fetchAPI('users/', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleUpdateUser = async (userId: string, formData: Omit<User, 'id'>) => {
    try {
      await fetchAPI(`users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await fetchAPI(`users/${userId}`, { method: 'DELETE' });
        fetchUsers(); // Refresh list
      } catch (err) {
        console.error('Error:', err);
      }
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <ul className="space-y-2">
        {users.map(user => (
          <li key={user.id} className="flex items-center justify-between p-4 border rounded">
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email} - {user.role}</p>
            </div>
            <button 
              onClick={() => handleDeleteUser(user.id)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserManagement;
```

---

## Service Layer Pattern (Recommended)

For better code organization, create a dedicated user service:

```typescript
// src/services/userService.ts
import { fetchAPI } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'developer' | 'leadership';
}

export interface CreateUserData {
  name: string;
  email: string;
  role: string;
  password: string;
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    return fetchAPI('users/');
  },

  getById: async (id: string): Promise<User> => {
    return fetchAPI(`users/${id}`);
  },

  create: async (data: CreateUserData): Promise<User> => {
    return fetchAPI('users/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    return fetchAPI(`users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchAPI(`users/${id}`, { method: 'DELETE' });
  },

  resetPassword: async (id: string, password: string): Promise<void> => {
    return fetchAPI(`users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password })
    });
  },

  changeOwnPassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    return fetchAPI('users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      })
    });
  }
};
```

Then use it in your components:

```typescript
import { userService } from '@/services/userService';

const users = await userService.getAll();
await userService.create({ name: 'John', email: 'john@example.com', role: 'developer', password: 'pass123' });
```

---

## Important Notes

### Authentication & Authorization
- **All endpoints require login** (except `/auth/login`)
- **Most user management endpoints require Manager role**
- Backend uses **HTTP-only cookies** for session management

### Error Handling
- Always wrap API calls in try-catch blocks
- The `fetchAPI` helper throws errors with the response text
- Handle errors gracefully in your UI

### API Proxy Pattern
- Frontend calls `/api/*`
- Next.js rewrites to `${BACKEND_URL}/*` (configured in `next.config.ts`)
- This avoids CORS issues and centralizes backend URL configuration

### Testing
- **Swagger UI**: Test endpoints at your backend's `/docs` endpoint
- **Test Scripts**: Use the scripts in `scripts/` directory (they now support `BACKEND_URL` env var)

### Environment Configuration
- Set `BACKEND_URL` in your `.env` file
- Default: `http://localhost:8000` (for local development)
- Production: Set to your deployed backend URL
- See `.env.example` for template
