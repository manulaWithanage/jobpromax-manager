# Backend Token Configuration Requirement

## Context
The Frontend application sets a **7-Day (1-Week)** HTTP-Only cookie for the authentication token. To ensure users are not unexpectedly logged out while the browser still holds a valid cookie, the Backend must generate tokens with a matching lifespan.

## Requirement
**Update Backend JWT Configuration**

- **Parameter**: `ACCESS_TOKEN_EXPIRE_MINUTES` (or equivalent in your Backend config/env).
- **Required Value**: `10080` (7 Days * 24 Hours * 60 Minutes).
- **Reason**: Matches the frontend `auth-token` cookie `maxAge`.

## Expected Behavior
1.  **Frontend**: Sets cookie `maxAge=604800` (7 days).
2.  **Backend**: Issues JWT valid for 7 days.
3.  **Result**: User remains logged in for 1 week without interruption.
