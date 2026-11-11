# CivicLens — Municipal Civic Grievance Redressal & Spatial Management Platform

CivicLens is a full-stack, enterprise-grade civic grievance management and spatial tracking platform. It bridges citizens, municipal departments, and field staff by offering streamlined complaint filing, real-time photographic proof-of-work, interactive OpenStreetMap geospatial tracking, and executive analytics.

---

## 1. Technology Stack

- **Frontend**: React 19, Vite, React Router DOM 7, Tailwind CSS utilities, Lucide React icons, Leaflet & React-Leaflet 5, Recharts 3, Axios.
- **Backend**: Spring Boot 3.5.4, Java 21, Gradle, Spring Security 6, JWT (JSON Web Tokens), BCrypt password hashing, Spring Data JPA / Hibernate.
- **Database**: PostgreSQL 14+ (production-safe relational persistence with incremental migrations).
- **Media Storage**: Secure multipart file storage with binary magic-byte validation (JPEG, PNG, WebP &le; 5 MB).

---

## 2. Platform Portals & Role-Based Workflows

CivicLens features three role-based portals secured via JWT claims and Spring Security annotations (`@PreAuthorize`):

### 1. Citizen Portal
- **Dashboard (`/citizen/dashboard`)**: Personal grievance metrics (Total, Pending, Assigned, In-Progress, Resolved) and recent activity.
- **Report Issue (`/citizen/create-report`)**: Multi-step complaint submission with title, category, priority, street address, browser GPS auto-detection, interactive Leaflet map pin placement, and 5MB photo upload.
- **My Complaints (`/citizen/my-reports`)**: Full history of submitted grievances with filterable status pills and safe deletion (strictly permitted while `PENDING`).
- **Grievance Details (`/citizen/reports/:id`)**: Visual horizontal progress stepper (`SUBMITTED` &rarr; `ASSIGNED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED`), embedded Leaflet mini-map, and status audit trail.
- **Complaints Map (`/citizen/map`)**: Interactive OpenStreetMap plotting all complaints submitted by the authenticated citizen.
- **Citizen Profile (`/citizen/profile`)**: Account details, emergency municipal helplines, and participation statistics.

### 2. Municipal Staff Portal
- **Field Dashboard (`/staff/dashboard`)**: Real-time work queue metrics (Assigned, In-Progress, Completed) and urgent field tasks.
- **Assigned Queue (`/staff/assigned-reports`)**: Filterable queue of complaints assigned to the officer or their municipal department.
- **Field Redressal (`/staff/reports/:id`)**: Site inspection details, citizen photograph, embedded site navigation map, work remarks, and **proof-of-work photograph upload** before closing complaints.
- **Field Map (`/staff/map`)**: Geospatial map showing complaint pins across the officer's jurisdiction.

### 3. Administrator Command Center
- **Executive Dashboard (`/admin/dashboard`)**: Citywide telemetry (Total Complaints, Pending, Assigned, In-Progress, Resolved, Rejected, Total Citizens, Total Staff, Resolution Rate, and Average Turnaround Time).
- **Complaint Registry (`/admin/reports`)**: Complete governance table with citizen details, priority updates, status transitions, department & officer assignment modal, full history audit inspection, and duplicate deletion.
- **Citywide Map (`/admin/map`)**: Full spatial GIS tracking of all geocoded complaints with category and status filter overlays.
- **Executive Analytics (`/admin/analytics`)**: Recharts-powered telemetry featuring a status lifecycle donut chart, category bar chart, monthly trends line chart, and department workload distribution.
- **Departments Management (`/admin/departments`)**: Add, edit, and deactivate municipal service bodies with real-time complaint workload badges.
- **User Directory (`/admin/users`)**: Authorize registered citizens, provision municipal staff accounts, and manage administrative privileges.

---

## 3. Quick Start & Local Development

### Prerequisites
- **Java**: OpenJDK 21 (Temurin / Eclipse Adoptium recommended)
- **Node.js**: v18.0.0 or higher & npm v9+
- **PostgreSQL**: PostgreSQL 14+ installed and running locally on port `5432`

### Step 1: Database Setup
Ensure PostgreSQL is running and create the `civiclens` database:
```sql
CREATE DATABASE civiclens;
```
*(If your PostgreSQL superuser requires a password, set `SPRING_DATASOURCE_PASSWORD` accordingly).*

### Step 2: Backend Startup (Spring Boot)
1. Configure environment variables (optional; defaults match local PostgreSQL):
   ```bash
   cp .env.example .env
   ```
2. Build and launch the Spring Boot application on port `8080`:
   ```bash
   ./gradlew bootRun
   ```
   *On first boot, the system automatically initializes database tables via Hibernate `ddl-auto=update`, provisions default departments, and seeds the system administrator account (`admin@civiclens.gov`).*

### Step 3: Frontend Startup (React + Vite)
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server on port `5173`:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 4. Default Demonstration Accounts

The login page (`/login`) includes instant quick-login demo buttons for easy demonstration:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Administrator** | `admin@civiclens.gov` | `Admin@12345` | Full administrative command center, user management, and citywide maps |
| **Municipal Staff** | `staff@civiclens.gov` | `Staff@123` | Department field queue, site inspection, and proof-of-work uploads |
| **Citizen** | `citizen@civiclens.gov` | `Citizen@123` | Grievance submission, personal tracking, and notification updates |

*New citizens can also register publicly via `/register` (restricted strictly to the `CITIZEN` role).*

---

## 5. Security Architecture

1. **Authentication**: Stateless JWT with HMAC-SHA256 tokens stored securely in client storage and sent via `Authorization: Bearer <token>` headers.
2. **Password Security**: Passwords are encrypted with BCrypt (10 rounds). `@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)` prevents password hashes from ever leaking in outgoing JSON payloads.
3. **Role Authorization**: Enforced on the backend via `@PreAuthorize("hasRole(...)")` and Spring Security filters; frontend guards provide intuitive redirection.
4. **Data Isolation**:
   - Citizens can only query and view their own complaints and notifications.
   - Deletion of complaints by citizens is restricted strictly to `PENDING` status.
   - Municipal staff can only update complaints assigned to them or their department.
5. **Media Storage Hardening**:
   - Files are stored outside public web roots with UUID filenames.
   - Validates file extensions (`.jpg`, `.jpeg`, `.png`, `.webp`) and verifies binary magic numbers (e.g. `FF D8 FF` for JPEG, `89 50 4E 47` for PNG).
   - Enforces a 5 MB maximum size limit.

---

## 6. Build & Test Verification

### Backend Integration Tests (JUnit 5 + Spring Boot Test)
```bash
./gradlew clean test
```
*Executes all 38 integration tests covering Phase 1 security, Phase 2 file uploads, Phase 3 administrative governance, and Phase 6 end-to-end lifecycle verification.*

### Frontend Linter & Production Build
```bash
cd frontend
npm run lint
npm run build
```
*Compiles the production SPA into `frontend/dist/` in under 500ms with zero lint warnings.*

---

## 7. Production Deployment Guide

### A. Environment Configuration
Set the following environment variables in your server environment (or systemd unit / Docker container):

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://<db-host>:5432/civiclens
SPRING_DATASOURCE_USERNAME=<db-user>
SPRING_DATASOURCE_PASSWORD=<db-password>
JWT_SECRET=<32-character-or-longer-cryptographic-secret>
ADMIN_EMAIL=admin@civiclens.gov
ADMIN_PASSWORD=<strong-admin-password>
UPLOAD_DIR=/var/civiclens/uploads
```

### B. Backend Production Packaging
Package the executable JAR file:
```bash
./gradlew bootJar
```
Run the JAR in production:
```bash
java -jar build/libs/civiclens-0.0.1-SNAPSHOT.jar
```

### C. Frontend Deployment (Nginx)
Build the frontend and point Nginx to `frontend/dist/`:
```bash
cd frontend && npm run build
```

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name civiclens.yourcity.gov;

    root /var/www/civiclens/dist;
    index index.html;

    # Single Page Application routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy API requests to Spring Boot
    location /auth/ {
        proxy_pass http://127.0.0.1:8080/auth/;
    }
    location /reports {
        proxy_pass http://127.0.0.1:8080/reports;
    }
    location /departments {
        proxy_pass http://127.0.0.1:8080/departments;
    }
    location /notifications {
        proxy_pass http://127.0.0.1:8080/notifications;
    }
    location /analytics/ {
        proxy_pass http://127.0.0.1:8080/analytics/;
    }
    location /admin/ {
        proxy_pass http://127.0.0.1:8080/admin/;
    }
    location /files/ {
        proxy_pass http://127.0.0.1:8080/files/;
    }

    # Serve uploaded photographs
    location /uploads/ {
        proxy_pass http://127.0.0.1:8080/uploads/;
    }
}
```
