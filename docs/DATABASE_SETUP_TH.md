# CSCP GeoEpi: โครงสร้างฐานข้อมูลและการตั้งค่า Database (MySQL / MariaDB)

## 1. ข้อมูลภาพรวม
- **DBMS**: MySQL 8.0+ (Production VPS) หรือ MariaDB 10.4+ (XAMPP Development)
- **Database Name**: `cscp`
- **Default Charset**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **ORM**: Prisma ORM 7.x พร้อม `@prisma/adapter-mariadb`

---

## 2. การสร้างผู้ใช้งานฐานข้อมูล (Database User)
ตาม Requirement ข้อ 63 สำหรับระบบ Local และ Production ให้หลีกเลี่ยงการใช้ `root` โดยตรง:

```sql
CREATE DATABASE IF NOT EXISTS cscp
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'cscpuser'@'localhost'
IDENTIFIED BY 'CHANGE_ME_SECURE_PASSWORD';

GRANT ALL PRIVILEGES
ON cscp.*
TO 'cscpuser'@'localhost';

FLUSH PRIVILEGES;
```

---

## 3. ดัชนีเพื่อประสิทธิภาพการสืบค้นเชิงพื้นที่ (Indexing Strategy)
ระบบสร้าง Index ครอบคลุมตาม Requirement ข้อ 53:
1. `business(business_type_id)`: กรองตามประเภทสถานประกอบการ
2. `business(risk_level, risk_score)`: จัดลำดับความเสี่ยง
3. `business(inspection_status)`: ค้นหาสถานประกอบการที่รอตรวจหรือเลยกำหนด
4. `business(last_inspection_date, next_inspection_date)`: ค้นหารอบการตรวจ
5. `businesslocation(latitude, longitude)`: Bounding box spatial viewport filter
6. `businesslocation(subdistrict)`: รวมกลุ่มข้อมูลรายตำบล
7. `businesslocation(h3_index)`: Spatial Hexagonal Grid
8. `businesslicense(license_no)`: ค้นหาเลขใบอนุญาต
9. `inspection(inspection_date, result)`: วิเคราะห์อัตราความไม่ผ่านมาตรฐาน

---

## 4. ความเข้ากันได้ของพิกัดภูมิศาสตร์ (Cross-Platform Coordinate Compatibility)
เพื่อป้องกันปัญหาความไม่เข้ากันของ Spatial Engine ระหว่าง MariaDB บน XAMPP และ MySQL 8 บน Ubuntu:
- พิกัดหลักจัดเก็บเป็น `latitude DECIMAL(10, 8)` และ `longitude DECIMAL(11, 8)`
- การคำนวณระยะทาง Haversine, DBSCAN Hotspot และ 2-opt TSP รันที่ Application Layer บน Node.js/TypeScript
- จึงทำให้ระบบทำงานได้อย่างเสถียรและเร็วสูงโดยไม่มีข้อจำกัดด้านฟังก์ชัน GIS ของ MariaDB
