# CSCP GeoEpi: Epidemiology Engine & Signal Detection Specification

## 1. แนวคิดหลัก (Regulatory & Consumer Protection Surveillance)
การนำหลักระบาดวิทยา (Epidemiology) มาประยุกต์ใช้ใน CSCP GeoEpi มิใช่การวินิจฉัยโรคทางการแพทย์ แต่เป็นการเฝ้าระวังเชิงพื้นที่เกี่ยวกับ:
- ความไม่ผ่านมาตรฐาน (Compliance Failure)
- ข้อบกพร่องระดับวิกฤต (Critical Findings) เช่น ขยะติดเชื้อ, ผู้ประกอบวิชาชีพไม่อยู่ประจำ
- เรื่องร้องเรียนจากผู้บริโภค (Complaints)
- ปัญหาใบอนุญาต (Expired / Non-compliant Licenses)
- การค้างติดตามผล (Follow-up Overdue)

---

## 2. ตัวชี้วัดที่มีตัวหารกำกับ (Denominator-Aware Indicators)
ระบบไม่แสดงเพียงจำนวนดิบ (Raw Counts) แต่คำนวณสัดส่วนทางสถิติที่มีตัวหารอย่างถูกต้อง:

### 2.1 Inspection Coverage Rate (ร้อยละความครอบคลุมการตรวจ)
$$\text{Coverage Rate} = \frac{\text{จำนวนสถานประกอบการที่ตรวจแล้ว}}{\text{จำนวนสถานประกอบการเป้าหมายทั้งหมด}} \times 100$$

### 2.2 Compliance Failure Rate (อัตราการตรวจไม่ผ่านมาตรฐาน)
$$\text{Failure Rate} = \frac{\text{จำนวนสถานประกอบการที่ตรวจไม่ผ่าน}}{\text{จำนวนสถานประกอบการที่ได้รับการตรวจทั้งหมด}} \times 100$$

### 2.3 Complaint Rate per 100 Establishments (อัตราเรื่องร้องเรียนต่อ 100 แห่ง)
$$\text{Complaint Rate} = \frac{\text{จำนวนเรื่องร้องเรียนทั้งหมด}}{\text{จำนวนสถานประกอบการทั้งหมด}} \times 100$$

### 2.4 Overdue Rate (อัตรารอบการตรวจเกินกำหนด)
$$\text{Overdue Rate} = \frac{\text{จำนวนที่เกินรอบการตรวจ}}{\text{จำนวนสถานประกอบการทั้งหมด}} \times 100$$

---

## 3. การตรวจจับสัญญาณเฝ้าระวัง (Temporal Surveillance Signals)
ระบบใช้อัลกอริทึม **EWMA (Exponentially Weighted Moving Average)** และ **CUSUM (Cumulative Sum Control Chart)** เพื่อตรวจจับความผิดปกติ:
- แจ้งเตือนเมื่อข้อมูลร้องเรียนหรือข้อบกพร่องเพิ่มขึ้นอย่างมีนัยสำคัญ
- ระบบแสดงผลอย่างชัดเจนว่าเป็น **"Surveillance Signal"** เพื่อเป็นเครื่องมือสนับสนุนการตัดสินใจล่วงหน้า (Early Warning) มิใช่ข้อสรุปทางกฎหมายโดยอัตโนมัติ

---

## 4. การวิเคราะห์จุดเสี่ยงหนาแน่น (Spatial Hotspots & DBSCAN)
- ใช้ **DBSCAN (Density-Based Spatial Clustering of Applications with Noise)**
- คำนวณคลัสเตอร์จากพิกัด (Latitude, Longitude) และคะแนนความเสี่ยง (Risk Score)
- ผลลัพธ์: Centroid, รัศมีครอบคลุม (Meters), ระดับความเสี่ยงคลัสเตอร์ (Critical, High, Moderate)
