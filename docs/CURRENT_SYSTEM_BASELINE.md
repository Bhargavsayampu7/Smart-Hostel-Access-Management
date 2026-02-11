# Current System Baseline (HTML/JS + Node/Mongo)

This document freezes the **current working behavior** as the baseline for migration.

## UI Pages / Role Areas (single-page app)

- **Login** (`#loginPage`)
  - Inputs: `loginEmail`, `loginPassword`
  - Action: POST `/api/auth/login`
- **Landing** (`#landingPage`) *(now hidden by default)*:
  - Role cards (demo only): `data-role=student|parent|admin`
- **Main App** (`#mainApp`)
  - Student dashboard (`#studentDashboard`)
    - Tabs: `studentOverview`, `studentRequests`, `createRequest`, `qrCode`, `studentProfile`
  - Parent dashboard (`#parentDashboard`)
    - Tabs: `parentOverview`, `parentApprovals`, `parentActivity`
  - Admin dashboard (`#adminDashboard`)
    - Tabs: `adminOverview`, `adminQueue`, `adminStudents`, `adminReports`

## Core Workflow (Outpass Request)

### Student creates request

UI: `#createRequest` multi-step form

- Step 1: Outpass type (cards)
  - `outpass|homepass|emergency`
- Step 2: Request details
  - `destination` (select)
  - `emergencyContact` (phone)
  - `reason` (text)
  - `departureTime` (datetime)
  - `returnTime` (datetime)
- Step 3: Review + submit

Backend: POST `/api/requests`

### Parent approves / rejects

Backend:
- GET `/api/parents/pending-approvals`
- PUT `/api/requests/:id/parent-approve` with `{ approved: boolean, comments?: string }`

State transitions:
- `pending_parent` -> `parent_approved` (approved=true)
- `pending_parent` -> `parent_rejected` (approved=false)

### Admin (warden) final approves / rejects

Backend:
- GET `/api/admin/queue`
- PUT `/api/requests/:id/admin-approve` with `{ approved: boolean, comments?: string }`

State transitions:
- `parent_approved` -> `approved` (approved=true)
- `parent_approved` -> `rejected` (approved=false)

### QR code

- On admin approval, backend generates QR id string in `Request.qrCode` and sets:
  - `qrGeneratedAt`, `qrExpiresAt=returnTime`
- Student fetches QR details:
  - GET `/api/requests/:id/qr`

## Data Model (Mongo) → Migration Mapping

### `Request` (Mongo) fields in use

- Identity: `_id`, `studentId`
- Request content: `type`, `destination`, `reason`, `departureTime`, `returnTime`, `emergencyContact`
- Approval + status:
  - `status` enum: `pending_parent`, `parent_approved`, `parent_rejected`, `approved`, `rejected`, `expired`
  - `parentApproval`, `adminApproval`
  - `parentApprovedAt`, `parentRejectedAt`, `adminApprovedAt`
  - `parentComments`, `adminComments`
- Risk:
  - `riskScore`, `riskCategory`
- QR + gate:
  - `qrCode`, `qrGeneratedAt`, `qrExpiresAt`
- Return handling:
  - `actualReturnTime`, `isLateReturn`

### `User` (Mongo) relevant fields

- `role`: `student|parent|admin`
- Student profile fields (personal/academic/hostel/parentDetails/addressInfo)
- Parent link: `studentId`

### `Violation` (Mongo)

- `studentId`, optional `requestId`
- `type`, `description`, `severity`, `penaltyPoints`, `violationDate`, `status`

## Known Gaps / Notes to Carry Into New Stack

- Risk score can be computed in multiple places and can differ by context (student overall vs request-specific).
- “Active request” definition should be **time-aware** (approved + QR + returnTime not passed + not returned).
- JWT secret defaults exist in code; new stack must require environment config.


