# CSCP GeoEpi - Full System Forensic Audit

## 1. Executive Summary
A comprehensive forensic audit of the `feature/cscp-geoepi-next` branch reveals a significant divergence between the production database/concept and the current repository state. The single massive commit `88af868` ("CSCP GeoEpi Phase 1, 2, and 3 implementation") appears to be an incomplete dump of the Next.js codebase. It contains dependencies and database schemas for advanced features (like 2FA/TOTP), but the actual implementation files for those features are **missing** from version control. The recent security patch (`4cffd31`) introduced a canonical RBAC system that correctly attempts to map legacy database roles, but strict JWT enforcement has likely locked out administrators due to environment variable issues.

## 2. Git Timeline
- **`68a8b9b` to `1877080`**: Original Vue.js/Vite application.
- **`88af868` (Baseline)**: A massive squash/import commit that replaced the Vue app with the Next.js Phase 1-3 implementation. Phase 4+ features (like 2FA UI, certain Super Admin features) were **not included** in this commit despite being in the Prisma schema and `package.json`.
- **`4cffd31` (Current HEAD)**: Security patch implementing canonical RBAC (`isSuperAdmin`, `isAdmin`, etc.) and hardening JWT by removing the default secret fallback.

## 3. Super Admin (`admintom`) Findings
- **Authentication Contract**: The frontend correctly allows username login (`type="text"`). The backend uses the `email` column to query the user. `scripts/add-admintom.ts` intentionally saved the string `"admintom"` into the `email` field. Thus, the database contract for `admintom` is intact.
- **Why login fails**: The recent security patch in `src/lib/jwt.ts` removed the fallback JWT secret. If the production VPS lacks the `JWT_SECRET` environment variable, `signJwt()` will throw a fatal Error, crashing the login process.
- **Role Mapping**: The database role `PROVINCE_ADMIN` is automatically mapped to `ADMIN` by the new login route. However, `ADMIN` is conceptually lower than `SUPER_ADMIN`. While `isProvinceAdmin` currently falls back to `isAdmin()`, any new feature checking explicitly for `isSuperAdmin()` will deny access to `admintom`.

## 4. Feature Inventory & Lost Features

| FEATURE | CURRENT STATUS | RECOVERY NEEDED? | RISK |
| :--- | :--- | :--- | :--- |
| **Province Dashboard** | PARTIAL (Mapped to Admin) | YES - Needs explicit SUPER_ADMIN view | HIGH |
| **Super Admin RBAC** | PARTIAL (Mapped to Admin) | YES - Need proper SUPER_ADMIN role | HIGH |
| **2FA / TOTP** | MISSING (Only DB & Deps exist) | YES - Must be rebuilt | MODERATE |
| **Smart Map (GSIE)** | PRESENT | NO | LOW |
| **User/Role Management**| PRESENT | YES - Audit permission gates | LOW |
| **Inspector Management**| PRESENT | NO | LOW |
| **Surveillance/Quality**| PRESENT | NO | LOW |

## 5. Database Schema Differences
- **No data loss** in the schema between the Next.js baseline and the security patch. 
- The schema contains models for `TwoFactorCredential`, `RecoveryCode`, and `AuditLog`, which confirms that these features were planned or developed locally but not committed to this repository.
- The `User` model does not have a `username` field. The system repurposed the `email` field to store usernames for admins, which works but causes confusion.

## 6. Security Risks & Preservation
The security patch (`4cffd31`) successfully implemented server-side authorization and secure HttpOnly cookies. **These must be preserved.**
- Do not revert `jwt.ts` to use a hardcoded secret. Instead, configure the `.env` on production.
- Do not bypass the `rbac.ts` checks.

## 7. Recommended Recovery Order
1. **Emergency Auth Fix**: Configure `JWT_SECRET` on the server and update `admintom` to map to `SUPER_ADMIN` (or create a true `SUPER_ADMIN` role).
2. **Super Admin Restoration**: Audit all API routes to ensure `SUPER_ADMIN` has global visibility (ignoring district filters).
3. **2FA Restoration**: Rebuild the missing 2FA enrollment and verification UI/API using the existing `otpauth` dependency and `TwoFactorCredential` schema.
4. **UI/Navigation**: Ensure all admin menus correctly display for the restored `SUPER_ADMIN`.
