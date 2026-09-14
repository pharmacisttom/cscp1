# CSCP GeoEpi: Migration Mapping Specification

## 1. Entity & Column Mapping (Legacy Supabase -> CSCP GeoEpi MySQL/Prisma)

### 1.1 Business Entity Mapping
| Legacy Supabase (`businesses`) | New Model (`Business` + `BusinessLocation` + `BusinessLicense`) | Transformation / Business Rules |
| :--- | :--- | :--- |
| `id` (UUID) | `Business.id` (Char(36)) | Preserved as UUID v4 string |
| `business_name` | `Business.name` | Normalized whitespace, required |
| `business_type` | `BusinessType.name` -> `Business.businessTypeId` | Foreign key lookup/upsert into `BusinessType` |
| `license_no` | `BusinessLicense.licenseNo` | Stored in dedicated license table |
| `licensee_name` | `BusinessLicense.licenseeName` | |
| `operator_name` | `BusinessLicense.operatorName` | |
| `professional_license_no` | `BusinessLicense.professionalLicenseNo` | |
| `current_expire_year` / `expire_year` | `BusinessLicense.expireDate` | Converted from B.E./A.D. year to standard Date |
| `license_status` | `BusinessLicense.status` | Enum: `ACTIVE`, `SUSPENDED`, `REVOKED`, `EXPIRED` |
| `address`, `moo` | `BusinessLocation.address` | Formatted address string |
| `subdistrict` | `BusinessLocation.subdistrict` | Normalized Thai subdistrict name |
| `district` | `BusinessLocation.district` | Default `ปลวกแดง` if null |
| `province` | `BusinessLocation.province` | Default `ระยอง` if null |
| `latitude` | `BusinessLocation.latitude` | `DECIMAL(10, 8)` with WGS84 range validation (5.0 - 21.0) |
| `longitude` | `BusinessLocation.longitude` | `DECIMAL(11, 8)` with WGS84 range validation (97.0 - 106.0) |
| `latlon` (comma-separated text) | `BusinessLocation.latitude` & `longitude` | Split by comma, parsed to float |
| `image_front`, `image_inside_1`, etc. | `BusinessImage` | Normalized one-to-many relationship with image categories |
| `waste_management`, `medical_equipment`, `note` | `Business.notes` & Dynamic fields | Stored as structured metadata / JSON |

### 1.2 Inspection Entity Mapping
| Legacy Supabase (`inspections`) | New Model (`Inspection` + `InspectionFinding` + `InspectionAnswer`) | Transformation |
| :--- | :--- | :--- |
| `id` | `Inspection.id` | Preserved UUID |
| `business_id` | `Inspection.businessId` | Foreign key |
| `inspection_date` | `Inspection.inspectionDate` | DateTime |
| `inspector_name` | `Inspection.inspectorName` (and `officerId` relation) | Linked to `Officer` |
| `inspection_result` | `Inspection.result` | `PASSED`, `PASSED_WITH_CONDITIONS`, `FAILED` |
| `score` | `Inspection.score` | Int (0 - 100) |
| `problem_found` | `InspectionFinding.description` | Converted to structured finding records |
| `recommendation` | `Inspection.recommendations` | Text |
| `next_followup_date` | `Inspection.nextFollowupDate` | DateTime |
| `form_data` (JSONB) | `InspectionAnswer` + `Inspection.formData` | Structured item answers linked to dynamic template |

---

## 2. Ingestion Pipeline & Quality Control

### Import Flow
```
Excel / CSV
    │
    ▼
ImportJob Record (file_name, uploader, total_rows)
    │
    ▼
Row-by-row Validation & Coordinate Sanitization
    ├─ Valid Coordinates ──> BusinessLocation (coordinateSource = 'IMPORT')
    └─ Missing / Invalid ──> DataQualityIssue (flagged for GPS field verification)
    │
    ▼
Business & License Upsert
    │
    ▼
Initial GeoEpi Risk Engine Run (Baseline score GEOEPI-RISK-1.0)
```
