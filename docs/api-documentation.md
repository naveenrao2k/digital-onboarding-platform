# Digital Onboarding Platform API Documentation

## Authentication API

### Access Endpoint

This endpoint allows external portals to authenticate users with the Digital Onboarding Platform.

**URL**: `/api/auth/access`

**Method**: `POST`

**Authentication**: None required (Public API)

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier for the user |
| name | string | No | Full name of the user |
| phone_number | string | No | Phone number of the user |

**Example Request**:

```json
{
  "id": "user123",
  "name": "John Doe",
  "phone_number": "+12345678900"
}
```

**Success Response**:

- **Code**: 200 OK
- **Content Example**:

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

**Error Response**:

- **Code**: 400 Bad Request
- **Content**: `{ "error": "ID is required" }`

OR

- **Code**: 500 Internal Server Error
- **Content**: `{ "error": "Error accessing system" }`

**Notes**:

1. The API sets a session cookie (`session`) with a 7-day expiration that should be included in subsequent requests.
2. New users will be redirected to the KYC document upload page, while existing users will be redirected to their dashboard.
3. The `isNewUser` flag indicates whether this is the user's first time accessing the platform.
4. The `hasSubmittedKyc` flag indicates whether the user has previously submitted KYC documents.

## User Flow

1. External portal calls the access API with user ID (and optionally name and phone number)
2. The API creates a new user profile if the user doesn't exist
3. A session cookie is set for authentication
4. The client should redirect the user to the URL specified in the `redirectUrl` field
5. New users will need to complete the KYC verification process before accessing their dashboard
