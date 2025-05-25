# KYC Document Upload Flow

## Overview

The KYC document upload process has been enhanced to prevent users from uploading documents more than once. This document outlines the flow and explains how the system handles document uploads.

## User Flow

1. **Dashboard**
   - The dashboard shows the verification status of the user
   - If no documents have been uploaded, the user is presented with a button to upload documents
   - If documents have been uploaded, the user can view the verification status

2. **Upload KYC Documents Page**
   - The page first checks if the user has already submitted documents
   - If documents have been submitted, the user is automatically redirected to the verification status page
   - The page displays an error message if the user attempts to re-upload documents
   - Users can select their account type (individual, partnership, enterprise, LLC) and upload respective documents
   - Each document type has its own upload component with real-time progress tracking

3. **Verification Status Page**
   - Displays the current status of document verification
   - Shows a notification banner if the user has been redirected from the upload page due to previous submissions
   - Shows the progress of the verification process
   - Shows which documents have been submitted and their status

## Implementation Details

### Prevention of Multiple Submissions

Multiple submissions are prevented at several levels:

1. **Frontend Checks:**
   - The upload page checks if documents exist in the verification store
   - If documents exist, the user is redirected to the verification status page
   - UI elements clearly indicate that documents can only be submitted once

2. **Backend Checks:**
   - The KYC service checks for existing documents before allowing new uploads
   - The service also checks the verification status to prevent uploads if verification is in progress
   - API endpoints return appropriate error messages when duplicate uploads are attempted

3. **State Management:**
   - The verification store manages the document state across the application
   - Dashboard and upload pages use this state to determine whether to show upload or status options

### Error Handling

- Clear error messages are displayed if a user attempts to upload documents more than once
- Users are automatically redirected to the verification status page if they try to access the upload page after submission
- API errors related to duplicate submissions are handled gracefully with user-friendly messages

## Testing Checklist

- [ ] User with no documents can access the upload page
- [ ] User with existing documents is automatically redirected from upload page to verification status page
- [ ] Dashboard correctly shows upload button or view status button based on document submission state
- [ ] Error messages are displayed when attempting to re-upload documents
- [ ] Document upload progress is tracked correctly
- [ ] Verification status page shows appropriate status for uploaded documents
- [ ] Notification banner appears on verification status page when redirected from upload page
- [ ] API errors are handled gracefully
- [ ] State is maintained across page refreshes
