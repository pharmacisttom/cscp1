# คู่มือการติดตั้งและใช้งาน CSCP GeoEpi บนเครื่อง Local Windows (XAMPP)

## 1. บทนำ
**CSCP GeoEpi** (Consumer Safety & Compliance Platform — Geo-Epidemiological Intelligence) ได้รับการออกแบบให้ทำงานร่วมกับ **XAMPP (Apache + MariaDB/MySQL + phpMyAdmin)** บนระบบปฏิบัติการ Windows ได้อย่างสมบูรณ์แบบ 100% โดยไม่จำเป็นต้องพึ่งพาบริการภายนอก (Supabase) อีกต่อไป

---

## 2. สิ่งที่ต้องเตรียม (Prerequisites)
1. **Windows 10 / 11**
2. **XAMPP for Windows** (ติดตั้งที่ `C:\xampp`)
3. **Node.js LTS** (เวอร์ชัน 20, 22 หรือ 24)
4. **Git for Windows**

---

## 3. ขั้นตอนการเปิดใช้งาน MySQL บน XAMPP
1. เปิดโปรแกรม **XAMPP Control Panel**
2. กดปุ่ม **Start** ที่โมดูล **MySQL** (และกด Start ที่ Apache หากต้องการใช้ phpMyAdmin)
3. ตรวจสอบว่าพอร์ต `3306` แสดงผลเป็นสีเขียว

---

## 4. การสร้างฐานข้อมูล `cscp`
สามารถทำได้ 2 วิธี:

### วิธีที่ 1: ผ่าน Command Prompt / PowerShell (แนะนำ)
เปิด Terminal ในโฟลเดอร์โครงการแล้วรัน:
```bash
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS cscp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### วิธีที่ 2: ผ่าน phpMyAdmin
1. เปิดเว็บเบราว์เซอร์ไปที่ `http://localhost/phpmyadmin`
2. คลิกแถบ **Databases (ฐานข้อมูล)**
3. ระบุชื่อฐานข้อมูล: `cscp`
4. เลือก Collation: `utf8mb4_unicode_ci`
5. กดปุ่ม **Create (สร้าง)**

---

## 5. การตั้งค่า Environment Variables
ตรวจสอบไฟล์ `.env.local` ที่ Root ของโครงการ:
```env
# Database Connection (XAMPP MySQL localhost)
DATABASE_URL="mysql://root:@127.0.0.1:3306/cscp"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# GIS Map Defaults
NEXT_PUBLIC_MAP_PROVIDER="openstreetmap"
NEXT_PUBLIC_DEFAULT_LAT="12.9754"
NEXT_PUBLIC_DEFAULT_LNG="101.2154"
NEXT_PUBLIC_DEFAULT_ZOOM="12"

# Regional Defaults
APP_TIMEZONE="Asia/Bangkok"
DEFAULT_PROVINCE="ระยอง"
DEFAULT_DISTRICT="ปลวกแดง"

# Auth Secrets
AUTH_SECRET="cscp-geoepi-super-secret-key-development-32chars"
TOTP_ENCRYPTION_KEY="dG9tdmlzLXRvdHAtZW5jcnlwdGlvbi1rZXktMzJieXRlcw=="
```

---

## 6. ติดตั้ง Dependencies และ Generate Prisma Client
รันคำสั่งต่อไปนี้ตามลำดับ:
```bash
# 1. ติดตั้งแพ็กเกจ
npm install

# 2. สร้าง Prisma Client สำหรับ MariaDB
npx prisma generate

# 3. ซิงก์โครงสร้างตารางเข้าสู่ MySQL
npx prisma db push

# 4. หว่านข้อมูลระบบตั้งต้น (Roles, Business Types, Admin User, Dynamic Templates)
npm run db:seed
```

---

## 7. การนำเข้าข้อมูลสถานประกอบการจริงจาก Excel (`clinicpdh.xlsx`)
ระบบมี Pipeline การนำเข้าข้อมูลอัจฉริยะที่จะแปลงพิกัด กรองข้อมูล และบันทึกประวัติการนำเข้า:
```bash
npm run import:clinic
```
เมื่อรันเสร็จสิ้น ข้อมูลสถานประกอบการทั้ง 305 แห่ง (คลินิก, ร้านขายยา, น้ำดื่ม, อาหาร, ร้านชำ) จะถูกบันทึกและคำนวณคะแนนความเสี่ยงตั้งต้น (GeoEpi Risk 1.0) ทันที

---

## 8. การรัน Development Server
```bash
npm run dev
```
เปิดเว็บเบราว์เซอร์ไปที่:
👉 **http://localhost:3000**
- **ศูนย์บัญชาการ (Command Center)**: `http://localhost:3000`
- **Smart Surveillance Map**: `http://localhost:3000/map`
- **Geo-Epidemiology**: `http://localhost:3000/surveillance`
- **GSIE Smart Planner**: `http://localhost:3000/plans/smart`
- **Field Mode / GPS Verification**: `http://localhost:3000/inspections/field`
- **Data Quality**: `http://localhost:3000/data-quality`

---

## 9. ข้อมูลเข้าสู่ระบบตั้งต้น (Default Credentials)
- **Email**: `admin@cscp.local`
- **Password**: `Admin@123456`
- **Role**: ADMIN (ผู้ดูแลระบบระดับอำเภอ)
