# CSCP GeoEpi: คู่มือการติดตั้งและ Deploy บน Ubuntu VPS (Production)

## 1. ข้อมูลสถาปัตยกรรม Production
```
Internet
   │
   ▼
[Cloudflare / DNS]
   │
   ▼
[Nginx Reverse Proxy (SSL / Let's Encrypt / Gzip / Security Headers)]
   │
   ▼
[PM2 Process Manager] ──> [Next.js App (Node.js LTS, Port 3000)]
   │
   ▼
[MySQL 8 Server (Localhost, Database: cscp, Charset: utf8mb4)]
```

---

## 2. การเตรียมเซิร์ฟเวอร์ Ubuntu VPS
```bash
# อัปเดตแพ็กเกจ
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Node.js 22 LTS และ Git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git build-essential nginx

# ติดตั้ง PM2 สำหรับจัดการ Process
sudo npm install -g pm2
```

---

## 3. การติดตั้งและตั้งค่า MySQL 8 บน VPS
```bash
# ติดตั้ง MySQL Server
sudo apt install -y mysql-server

# รัน Security Installation
sudo mysql_secure_installation

# สร้าง Database และ User สำหรับ CSCP
sudo mysql -u root -p << EOF
CREATE DATABASE cscp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cscpuser'@'localhost' IDENTIFIED BY 'PROD_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON cscp.* TO 'cscpuser'@'localhost';
FLUSH PRIVILEGES;
EOF
```

---

## 4. การติดตั้งแอปพลิเคชัน CSCP GeoEpi
```bash
# Clone source code ไปยัง /var/www/cscp
sudo mkdir -p /var/www/cscp
sudo chown -R $USER:$USER /var/www/cscp
cd /var/www/cscp
git clone -b feature/cscp-geoepi-next https://github.com/pharmacisttom/cscp.git .

# ติดตั้ง Dependencies
npm ci

# สร้างไฟล์ .env.production
cat << EOF > .env.production
DATABASE_URL="mysql://cscpuser:PROD_STRONG_PASSWORD_HERE@127.0.0.1:3306/cscp"
NEXT_PUBLIC_APP_URL="https://cscp.yourdomain.go.th"
NEXT_PUBLIC_MAP_PROVIDER="openstreetmap"
APP_TIMEZONE="Asia/Bangkok"
DEFAULT_PROVINCE="ระยอง"
DEFAULT_DISTRICT="ปลวกแดง"
AUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
TOTP_ENCRYPTION_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
EOF

# รัน Prisma Migration และ Seed
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run import:clinic

# Build Production Bundle
npm run build
```

---

## 5. การเปิดบริการด้วย PM2
```bash
# สตาร์ตแอปพลิเคชันด้วย ecosystem.config.cjs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 6. การตั้งค่า Nginx และ SSL (Certbot)
```bash
# คัดลอก Nginx Config
sudo cp docs/nginx/cscp.conf /etc/nginx/sites-available/cscp
sudo ln -s /etc/nginx/sites-available/cscp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# ติดตั้งใบรับรองความปลอดภัย HTTPS ฟรีจาก Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d cscp.yourdomain.go.th
```
