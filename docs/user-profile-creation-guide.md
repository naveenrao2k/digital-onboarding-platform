# User Profile Creation via URL Access

## Introduction

This document explains how to create user profiles in the Digital Onboarding Platform using the URL access method. This method allows external portals and systems to onboard users directly without requiring a separate registration process.

## URL Access Method

The platform provides an API endpoint that accepts user parameters via URL query parameters and automatically creates or accesses a user profile.

### Base URL

```
/api/auth/access
```

### Required Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique identifier for the user |

### Optional Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | No | Full name of the user |
| phone_number | string | No | Phone number of the user |
| autoRedirect | boolean | No | If set to `true`, the API will redirect to the appropriate page instead of returning JSON. Default: `false` |

## Implementation Steps

### 1. Create Access URL

Construct a URL with the required parameters:

```
https://your-platform-domain.com/api/auth/access?id=user123
```

For a more complete profile initialization, include the optional parameters:

```
https://your-platform-domain.com/api/auth/access?id=user123&name=John%20Doe&phone_number=%2B12345678900
```

### 2. Redirect User or Integrate API

#### Option A: Direct User Redirection
Simply redirect your user to the constructed URL. If the `autoRedirect` parameter is set to `true`, the user will be automatically redirected to the appropriate onboarding page:

```
https://your-platform-domain.com/api/auth/access?id=user123&name=John%20Doe&phone_number=%2B12345678900&autoRedirect=true
```

#### Option B: API Integration
Make a GET request to the access URL from your backend system:

```javascript
// Example using fetch API
const response = await fetch('https://your-platform-domain.com/api/auth/access?id=user123&name=John%20Doe');
const userData = await response.json();

// Use userData to handle the response
console.log(userData.redirectUrl); // URL to redirect the user to
```

### 3. Handle the Response

#### JSON Response (when autoRedirect=false or not specified)

```json
{
  "id": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+12345678900",
  "email": "user123@example.com",
  "role": "USER",
  "accountType": "INDIVIDUAL",
  "isNewUser": true,
  "hasSubmittedKyc": false,
  "redirectUrl": "/user/upload-kyc-documents"
}
```

#### Redirect Response (when autoRedirect=true)
The user will be automatically redirected to one of these pages:
- `/user/upload-kyc-documents` (for new users)
- `/user/dashboard` (for existing users)

## Important Notes

1. The system creates a session cookie (`session`) with a 7-day expiration that will be used for subsequent requests.
2. New users (`isNewUser: true`) will need to complete the KYC document verification process.
3. The `redirectUrl` field in the JSON response indicates the next step in the user journey.
4. If a user profile already exists with the provided ID, the system will use the existing profile instead of creating a new one.
5. For security reasons, ensure that the `id` parameter is properly validated and corresponds to a legitimate user in your external system.

## Error Handling

If there's an error with the request, the API will return an error response:

- **400 Bad Request**: Missing required parameters
  ```json
  { "error": "ID is required" }
  ```

- **500 Internal Server Error**: Server-side issues
  ```json
  { "error": "Error accessing system" }
  ```

## Example Implementation

### HTML Link
```html
<a href="https://your-platform-domain.com/api/auth/access?id=user123&name=John%20Doe&autoRedirect=true">
  Start Digital Onboarding
</a>
```

### JavaScript Redirect
```javascript
function redirectToOnboarding(userId, userName) {
  const url = `https://your-platform-domain.com/api/auth/access?id=${encodeURIComponent(userId)}&name=${encodeURIComponent(userName)}&autoRedirect=true`;
  window.location.href = url;
}

// Usage
redirectToOnboarding('user123', 'John Doe');
```

### Server-Side Integration (Node.js)
```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.get('/start-onboarding/:userId', async (req, res) => {
  const userId = req.params.userId;
  const userName = req.query.name || '';
  
  try {
    // Get user data from your system
    const user = await getUserFromDatabase(userId);
    
    // Call the onboarding platform API
    const response = await axios.get(
      `https://your-platform-domain.com/api/auth/access?id=${encodeURIComponent(userId)}&name=${encodeURIComponent(user.name)}`
    );
    
    // Redirect the user to the appropriate page
    res.redirect(response.data.redirectUrl);
  } catch (error) {
    res.status(500).send('Error initiating onboarding process');
  }
});
```
