import { prisma } from "../src/lib/prisma";

async function main() {
  console.log('Seeding Academic Data...');

  // --- Seed Laws ---
  const law1 = await prisma.knowledgeLaw.upsert({
    where: { lawCode: 'ACT-DRUG-2510' },
    update: {},
    create: {
      lawCode: 'ACT-DRUG-2510',
      lawNameTh: 'พระราชบัญญัติยา พ.ศ. 2510',
      lawNameEn: 'Drug Act, B.E. 2510 (1967)',
      category: 'DRUG',
      regulator: 'กองยา สำนักงานคณะกรรมการอาหารและยา',
      status: 'CURRENT',
      year: 2510,
      description: 'กฎหมายแม่บทในการควบคุมกำกับดูแลผลิตภัณฑ์ยา ครอบคลุมการผลิต ขาย นำสั่ง และการขึ้นทะเบียนตำรับยา',
      officialUrl: 'https://www.fda.moph.go.th/sites/drug/Shared%20Documents/Law01-DrugActB.E.2510.pdf'
    }
  });

  const law2 = await prisma.knowledgeLaw.upsert({
    where: { lawCode: 'ACT-FOOD-2522' },
    update: {},
    create: {
      lawCode: 'ACT-FOOD-2522',
      lawNameTh: 'พระราชบัญญัติอาหาร พ.ศ. 2522',
      lawNameEn: 'Food Act, B.E. 2522 (1979)',
      category: 'FOOD',
      regulator: 'กองอาหาร สำนักงานคณะกรรมการอาหารและยา',
      status: 'CURRENT',
      year: 2522,
      description: 'กฎหมายควบคุมคุณภาพ มาตรฐาน และความปลอดภัยของอาหาร',
    }
  });

  const law3 = await prisma.knowledgeLaw.upsert({
    where: { lawCode: 'ACT-CLINIC-2541' },
    update: {},
    create: {
      lawCode: 'ACT-CLINIC-2541',
      lawNameTh: 'พระราชบัญญัติสถานพยาบาล พ.ศ. 2541',
      lawNameEn: 'Sanatorium Act, B.E. 2541 (1998)',
      category: 'CLINIC',
      regulator: 'กรมสนับสนุนบริการสุขภาพ',
      status: 'UPDATED',
      year: 2541,
      description: 'ควบคุมการประกอบกิจการสถานพยาบาล คลินิก และโรงพยาบาลเอกชน',
    }
  });

  // --- Seed Sections ---
  await prisma.knowledgeSection.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'SEC-DRUG-12',
        knowledgeLawId: law1.id,
        sectionNumber: '12',
        title: 'ห้ามผลิต ขาย นำสั่ง ยาแผนปัจจุบันโดยไม่ได้รับอนุญาต',
        contentSummary: 'ห้ามมิให้ผู้ใดผลิต ขาย หรือนำหรือสั่งเข้ามาในราชอาณาจักรซึ่งยาแผนปัจจุบัน เว้นแต่จะได้รับใบอนุญาตจากผู้อนุญาต\n\nการขอรับใบอนุญาตและการออกใบอนุญาต ให้เป็นไปตามหลักเกณฑ์ วิธีการ และเงื่อนไขที่กำหนดในกฎกระทรวง',
        penaltySummary: 'มาตรา 101: ต้องระวางโทษจำคุกไม่เกิน 5 ปี และปรับไม่เกิน 10,000 บาท',
      },
      {
        id: 'SEC-DRUG-72-4',
        knowledgeLawId: law1.id,
        sectionNumber: '72(4)',
        title: 'ห้ามผลิต ขาย นำสั่ง ยาที่ไม่ได้ขึ้นทะเบียนตำรับยา',
        contentSummary: 'ห้ามมิให้ผู้ใดผลิต ขาย หรือนำหรือสั่งเข้ามาในราชอาณาจักรซึ่งยาต่อไปนี้...\n(4) ยาที่ไม่ได้ขึ้นทะเบียนตำรับยา',
        penaltySummary: 'มาตรา 122: ต้องระวางโทษจำคุกไม่เกิน 3 ปี หรือปรับไม่เกิน 5,000 บาท หรือทั้งจำทั้งปรับ',
      }
    ]
  });

  // --- Seed Cases ---
  await prisma.knowledgeCase.upsert({
    where: { id: 'CASE-001' },
    update: {},
    create: {
      id: 'CASE-001',
      knowledgeLawId: law1.id,
      title: 'พบร้านชำขายยาอันตราย (ยาแก้ปวดผสมสเตียรอยด์)',
      category: 'DRUG',
      riskLevel: 'HIGH',
      scenario: 'เจ้าหน้าที่ลงพื้นที่ตรวจสอบร้านขายของชำ พบการจำหน่ายยาชุด ยาแก้ปวดที่จัดเป็นยาอันตราย ซึ่งร้านชำไม่สามารถจำหน่ายได้',
      recommendedAction: 'อายัดของกลาง และแจ้งข้อกล่าวหา ขายยาแผนปัจจุบันโดยไม่ได้รับอนุญาต',
      evidenceRequired: 'ถ่ายภาพ เก็บตัวอย่างยา และสอบปากคำ',
      referralAgency: 'พนักงานสอบสวน สภ.ท้องที่'
    }
  });

  console.log('Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
