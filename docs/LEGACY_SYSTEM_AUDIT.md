# CSCP Legacy System Audit Report

## 1. Executive Summary
The legacy CSCP system was originally structured as a single-page application (SPA) built using:
- **Frontend**: Vue 3 (Composition API), Vite, Pinia state management, Vue Router, Tailwind CSS v3, Chart.js, SweetAlert2.
- **Backend / Database**: Supabase (PostgreSQL with Row Level Security disabled via `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`).
- **Data Ingestion**: Client-side Excel parsing (`xlsx`) in `Settings.vue` converting 5 sheets (`สถานพยาบาล`, `น้ำบริโภค`, `สถานที่อาหาร`, `ร้านขายยา`, `GRDU`) into Supabase row upserts.
- **Geographic Data**: Handled as unindexed text or separate `latitude` (DECIMAL 10,8) and `longitude` (DECIMAL 11,8) without spatial clustering, denominator-aware rates, or route optimization.

## 2. Legacy Schema Inventory (`database.sql`)
The legacy Supabase database comprised 10 core tables:
1. `businesses`: Business registry (name, license_no, address, moo, subdistrict, district, province, lat/lng, opening_hours, images).
2. `inspections`: Historical inspections (inspection_date, inspector_name, score, problem_found, recommendation, form_data JSONB).
3. `products`: Registered health products per business.
4. `complaints`: Public complaints and resolution tracking.
5. `business_types`: Lookup list of 5 standard establishment categories.
6. `profiles`: User account mapping to district/officer.
7. `inspection_plans`: Calendar planned dates with `inspectors_data` JSONB.
8. `officers`: Public health inspection officers.
9. `import_history`: Base64 encoded imported spreadsheets with summary logs.
10. `audit_logs`: PostgreSQL triggers recording row changes.

## 3. Gaps & Modernization Drivers
1. **Dependency on Third-Party Cloud (Supabase)**: Needs self-hosted MySQL / MariaDB on local XAMPP and Ubuntu VPS under institutional control.
2. **Lack of Denominator-Aware Epidemiology**: Rates were calculated simply as raw counts rather than denominator-standardized proportions (e.g., Compliance Failure Rate per inspected businesses, Complaint Rate per 100 establishments).
3. **No Explainable Risk Engine**: Risk was a static text field (`low`, `moderate`, `high`) rather than a dynamic, reproducible score combining individual history, neighborhood spillover, and overdue intervals.
4. **Manual & Unoptimized Inspection Planning**: Officers manually assigned inspection dates without route grouping, travel time estimation, or 2-opt shortest path heuristics.
5. **No Offline Field Capabilities**: Inspection forms required persistent connectivity, lacking progressive web caching or GPS verification.

## 4. Preservation Strategy
- The original Vue files in `src/`, `package.json`, and `database.sql` are archived safely in the git history of branch `main`.
- Development of the Next.js full-stack system proceeds in `feature/cscp-geoepi-next`.
