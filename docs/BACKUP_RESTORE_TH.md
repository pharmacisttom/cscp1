# CSCP GeoEpi: คู่มือการสำรองและกู้คืนฐานข้อมูล (Backup & Restore Strategy)

## 1. นโยบายการสำรองข้อมูล (Retention Policy: 7/4/6)
- **7 Daily Backups**: สำรองรายวันย้อนหลัง 7 วัน
- **4 Weekly Backups**: สำรองรายสัปดาห์ย้อนหลัง 4 สัปดาห์
- **6 Monthly Backups**: สำรองรายเดือนย้อนหลัง 6 เดือน

---

## 2. คำสั่งสำรองฐานข้อมูล (Daily Dump)
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/cscp"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# สำรองฐานข้อมูลแบบ Compressed SQL
mysqldump -u cscpuser -p"PROD_PASSWORD" --single-transaction --quick cscp | gzip > "$BACKUP_DIR/cscp_db_$DATE.sql.gz"

# ลบไฟล์สำรองรายวันที่เก่าเกิน 7 วัน
find $BACKUP_DIR -type f -name "cscp_db_*.sql.gz" -mtime +7 -exec rm {} \;
```

---

## 3. ขั้นตอนการกู้คืนฐานข้อมูล (Restore Procedure)
```bash
# แตกไฟล์สำรองและนำเข้าสู่ MySQL
gunzip < /var/backups/cscp/cscp_db_20260914.sql.gz | mysql -u cscpuser -p cscp
```
