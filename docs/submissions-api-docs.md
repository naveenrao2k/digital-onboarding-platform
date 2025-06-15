# Submissions API Documentation

## Overview

This document describes the API endpoints used for managing submissions in the digital onboarding platform. These endpoints are used by the admin interface to view and manage flagged, approved, and rejected submissions.

## Authentication

All API endpoints require admin authentication. The authentication is handled by checking the session cookie and verifying that the user has an admin role.

## Endpoints

### 1. Flagged Submissions

**Endpoint**: `/api/admin/submissions/flagged`

**Method**: `GET`

**Description**: Returns submissions that have been flagged for admin review.

**Query Parameters**:
- `documentType`: Filter by document type
- `search`: Search term for name, email, document name, etc.
- `page`: Page number for pagination (default: 1)
- `limit`: Number of results per page (default: 10)

**Response**:
```json
{
  "data": [
    {
      "id": "document-id",
      "userId": "user-id",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "documentType": "Passport",
      "dateSubmitted": "2023-06-01T00:00:00.000Z",
      "status": "IN_PROGRESS",
      "fileName": "passport.jpg",
      "flagReason": "Date of birth unclear",
      "flaggedAt": "2023-06-01T01:00:00.000Z",
      "flaggedBy": "System"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5,
    "hasMore": true
  }
}
```

### 2. Approved Submissions

**Endpoint**: `/api/admin/submissions/approved`

**Method**: `GET`

**Description**: Returns submissions that have been approved by admins.

**Query Parameters**:
- `documentType`: Filter by document type
- `search`: Search term for name, email, document name, etc.
- `dateFilter`: Filter by date (today, week, month)
- `page`: Page number for pagination (default: 1)
- `limit`: Number of results per page (default: 10)

**Response**:
```json
{
  "data": [
    {
      "id": "document-id",
      "userId": "user-id",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "documentType": "Passport",
      "dateSubmitted": "2023-06-01T00:00:00.000Z",
      "dateApproved": "2023-06-02T00:00:00.000Z",
      "status": "APPROVED",
      "fileName": "passport.jpg",
      "approvedBy": "Admin User",
      "notes": ""
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pageSize": 10,
    "totalPages": 15,
    "hasMore": true
  }
}
```

### 3. Rejected Submissions

**Endpoint**: `/api/admin/submissions/rejected`

**Method**: `GET`

**Description**: Returns submissions that have been rejected by admins.

**Query Parameters**:
- `documentType`: Filter by document type
- `search`: Search term for name, email, document name, etc.
- `dateFilter`: Filter by date (today, week, month)
- `page`: Page number for pagination (default: 1)
- `limit`: Number of results per page (default: 10)

**Response**:
```json
{
  "data": [
    {
      "id": "document-id",
      "userId": "user-id",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "documentType": "Passport",
      "dateSubmitted": "2023-06-01T00:00:00.000Z",
      "dateRejected": "2023-06-02T00:00:00.000Z",
      "status": "REJECTED",
      "fileName": "passport.jpg",
      "rejectedBy": "Admin User",
      "rejectionReason": "Document expired",
      "allowReupload": true
    }
  ],
  "pagination": {
    "total": 30,
    "page": 1,
    "pageSize": 10,
    "totalPages": 3,
    "hasMore": true
  }
}
```

### 4. Remove Flag

**Endpoint**: `/api/admin/submissions/[userId]/remove-flag`

**Method**: `POST`

**Description**: Removes a flag from a document.

**Request Body**:
```json
{
  "documentId": "document-id"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Flag removed successfully",
  "document": {
    "id": "document-id",
    "status": "IN_PROGRESS"
  }
}
```

## Implementation Details

- All endpoints use server-side filtering and pagination for optimal performance
- Authentication is handled via session cookies
- The API endpoints are integrated with the front-end pages for a seamless user experience
