import { prisma } from "../src/lib/prisma";

async function checkDataQuality() {
  console.log("🔍 Running Data Quality Diagnostics on CSCP GeoEpi Database...");

  const total = await prisma.business.count();
  const withCoordinates = await prisma.businessLocation.count({
    where: { latitude: { not: null }, longitude: { not: null } },
  });
  const withoutCoordinates = total - withCoordinates;

  const duplicateLicenses = await prisma.$queryRaw<
    { licenseNo: string; count: number }[]
  >`
    SELECT licenseNo, COUNT(*) as count 
    FROM businesslicense 
    WHERE licenseNo IS NOT NULL AND licenseNo != '' 
    GROUP BY licenseNo 
    HAVING COUNT(*) > 1;
  `;

  const neverInspected = await prisma.business.count({
    where: { lastInspectionDate: null },
  });

  const issuesCount = await prisma.dataQualityIssue.count({
    where: { resolved: false },
  });

  console.log("\n📊 DATA QUALITY REPORT:");
  console.log(`   Total Establishments:  ${total}`);
  console.log(`   Valid GPS Coordinates: ${withCoordinates} (${((withCoordinates / total) * 100).toFixed(1)}%)`);
  console.log(`   Missing GPS:           ${withoutCoordinates} (${((withoutCoordinates / total) * 100).toFixed(1)}%)`);
  console.log(`   Duplicate Licenses:    ${duplicateLicenses.length}`);
  console.log(`   Never Inspected:       ${neverInspected} (${((neverInspected / total) * 100).toFixed(1)}%)`);
  console.log(`   Active Quality Issues: ${issuesCount}`);
  console.log("=========================================\n");
}

checkDataQuality()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
