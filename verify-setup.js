require('dotenv').config();
const { PrismaClient } = require('./generated/prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function testApiKey() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === "PASTE_YOUR_API_KEY_HERE") {
     console.error('❌ Google API Key is missing or invalid.');
     return;
  }
  
  try {
    // Basic test using Google Maps Javascript API endpoint to see if key works
    // (though using Places API textsearch might be a better backend test)
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants&key=${apiKey}`);
    const data = await response.json();
    
    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
       console.log('✅ Google API Key validates successfully!');
    } else {
       console.error('❌ Google API Key issue:', data.status, data.error_message);
    }
  } catch(error) {
      console.error('❌ Error testing API Key:', error.message);
  }
}

async function runTests() {
  console.log("Starting backend verification...");
  await testConnection();
  await testApiKey();
}

runTests();
