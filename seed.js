require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Rough bounds around Faridabad/Delhi
const bounds = {
  minLat: 28.3,
  maxLat: 28.7,
  minLng: 77.1,
  maxLng: 77.4
};

async function main() {
  console.log('Database URL:', process.env.DATABASE_URL ? 'FOUND' : 'NOT FOUND');
  console.log('Clearing existing safety data...');
  await prisma.safetyDataPoint.deleteMany({});

  console.log('Seeding fake safety data points...');
  
  const dataPoints = [];
  // Generate 500 random points within the general area
  for (let i = 0; i < 500; i++) {
    const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    const lng = bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng);
    
    // Generate some fake metrics
    dataPoints.push({
      lat,
      lng,
      cameraCount: Math.floor(Math.random() * 5),
      crimeReports: Math.floor(Math.random() * 10),
      lightingLevel: Math.floor(Math.random() * 5) + 1, // 1-5
      peopleSurveyScore: Math.floor(Math.random() * 60) + 40 // 40-100
    });
  }

  const result = await prisma.safetyDataPoint.createMany({
    data: dataPoints
  });

  console.log(`Successfully seeded ${result.count} safety data points!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
