# CSCP GeoEpi - Recovery Plan

## R0 — Emergency Authentication Recovery
**Goal**: Restore login access to production without compromising security.
- **FILES**: `.env` (Production server), `src/app/api/auth/login/route.ts`
- **FEATURES**: Login System
- **SECURITY IMPACT**: High (Ensures JWTs are securely signed)
- **TESTS**: Verify that setting `JWT_SECRET` allows successful login, and missing it throws 500.

## R1 — SUPER_ADMIN Recovery
**Goal**: Elevate `admintom` to true `SUPER_ADMIN` status.
- **FILES**: `src/app/api/auth/login/route.ts`, `src/lib/rbac.ts`
- **FEATURES**: RBAC mapping for `PROVINCE_ADMIN` -> `SUPER_ADMIN`
- **DB IMPACT**: None (We map the legacy DB role in memory during JWT generation)
- **SECURITY IMPACT**: Moderate (Grants global visibility)
- **TESTS**: Verify `isSuperAdmin()` returns true for `admintom`.

## R2 — Province Dashboard Recovery
**Goal**: Ensure the dashboard respects `SUPER_ADMIN` global view.
- **FILES**: `src/app/page.tsx`, `src/components/auth/auth-provider.tsx`
- **FEATURES**: Command Center Dashboard
- **TESTS**: Verify `SUPER_ADMIN` can see data for all districts without being filtered.

## R3 — User + Role Management Recovery
**Goal**: Verify and refine user management gates.
- **FILES**: `src/app/admin/users/page.tsx`, `src/app/api/admin/users/route.ts`
- **FEATURES**: Admin screens

## R4 to R9 — Module Audits
**Goal**: Iterate over District, Map, Inspection, Surveillance, and Goals modules to ensure new RBAC methods (`canInspect`, `canAnalyze`) are properly utilized on all routes.

## R10 — 2FA Recovery
**Goal**: Rebuild the 2FA functionality that was lost from version control.
- **FILES**: `src/app/api/auth/2fa/route.ts`, `src/app/login/2fa/page.tsx`, `src/components/auth/TwoFactorSetup.tsx`
- **FEATURES**: TOTP enrollment, verification, recovery codes.
- **DB IMPACT**: Will utilize existing `TwoFactorCredential` and `RecoveryCode` tables.
- **TESTS**: Test enrollment flow with an authenticator app.

## R11 — UI/Navigation Restoration
**Goal**: Ensure Sidebar and Headers correctly display for `SUPER_ADMIN`.
- **FILES**: `src/components/navigation/sidebar.tsx`, `src/components/navigation/header.tsx`

## R12 — Security Regression Testing
**Goal**: Validate the canonical RBAC system.
- **TESTS**: Run `scripts/test-rbac.ts` and manually test unauthorized access attempts.

## R13 — Production Acceptance
**Goal**: Safely deploy the restored system.
- **ROLLBACK**: Backup database prior to deployment. Maintain the `88af868` and `4cffd31` branches to rollback if necessary.
