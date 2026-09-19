# SYSTEM AUDIT: CSCP GeoEpi Platform

## 1. Current Architecture
- **Framework:** Next.js 16.3.4 (App Router) with Turbopack support.
- **Language:** TypeScript 6.0.3.
- **Styling:** Tailwind CSS 4.3.3.
- **Database:** MariaDB (via `@prisma/adapter-mariadb`).
- **ORM:** Prisma 7.10.0.
- **Authentication:** Custom Session-based Auth (`Session` model with `tokenHash`, `TwoFactorCredential`).
- **Authorization:** RBAC via `Role` and `Permission` tables (UserRole, RolePermission).

## 2. Existing Routes (App Router)
- `/` (Dashboard)
- `/login` (Authentication)
- `/academic/*` (Academic & Law Center - Partially implemented)
- `/admin/*` (Admin Dashboard, Goals, Users)
- `/data-quality/*` (Data Quality Management & Import)
- `/district/officers` (District Officers)
- `/goals` (Goal Management)
- `/inspections/*` (Inspection System, Field, New)
- `/map` (Geospatial Analysis)
- `/plans/smart` (Smart Planning)
- `/surveillance` (Epidemiological Surveillance)
- `/workspace` (User Workspace)

## 3. Database Structure
- **Core:** `Organization`, `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Session`, `Officer`
- **Business:** `BusinessType`, `Business`, `BusinessLocation`, `BusinessLicense`, etc.
- **Inspections:** `InspectionTemplate`, `Inspection`, `InspectionFinding`, `InspectionPlan`, etc.
- **Knowledge Base (KBS):** `KnowledgeLaw`, `KnowledgeSection`, `KnowledgeCase`, `KnowledgeRoleConfig`
- **Epidemiology:** `Complaint`, `SurveillanceEvent`, `RiskSnapshot`, `SpatialCluster`
- **System:** `AuditLog`, `SystemSetting`, `Notification`

## 4. Auth & Roles
- **Roles Available:** SUPER_ADMIN, ADMIN, DISTRICT_MANAGER, INSPECTOR, ANALYST, VIEWER.
- **Organization Scoping:** Multi-tenant design where users belong to specific organizations.

## 5. Security & Risks
- **Data Sensitivity:** Public health data, business data, and legal cases require strict access controls.
- **Migration Risk:** Transitioning legacy operations to the new KBS system must retain existing tracking capabilities.
- **Legal Boundaries:** The system must not automatically convict or act without Human Review and Authority Checks.

## 6. Migration & Rollback Plan
- **Migration:** All schema changes must be applied via `prisma migrate dev`. Ensure backward compatibility.
- **Rollback:** Retain database snapshots before major version upgrades. Keep legacy routes active until new routes are fully tested.

## 7. Integration Plan
- Integrate KBS Academic modules with existing `/inspections` and `/complaints`.
- Ensure new Legal Decision Support uses existing `Business` and `Product` tables.

*Audit completed prior to commencing Phase 1 of KBS Academic & Legal Platform development.*
