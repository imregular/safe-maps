require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const app = express();
// const prisma = new PrismaClient();
const prisma = new PrismaClient()

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'SafeRoute AI Backend is running' });
});

// --- NEW SOCIAL SAFETY REPORT ROUTES ---

// GET all community safety reports
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await prisma.safetyReport.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST a new safety report
app.post('/api/reports', async (req, res) => {
  const { lat, lng, comment, rating, author } = req.body;

  if (!lat || !lng || !comment || !rating) {
    return res.status(400).json({ error: 'Lat, Lng, comment, and rating are required' });
  }

  try {
    const newReport = await prisma.safetyReport.create({
      data: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        comment,
        rating: parseInt(rating),
        author: author || 'Anonymous'
      }
    });
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating report:', error.message);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// DELETE a safety report
app.delete('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.safetyReport.delete({
      where: { id }
    });
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error.message);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Endpoint to fetch routes and attach safety metrics
app.get('/api/routes', async (req, res) => {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination are required' });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }

    // Call Google Maps Directions API
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin,
        destination,
        alternatives: true,
        key: apiKey,
      },
    });

    if (response.data.status !== 'OK') {
      return res.status(400).json({ error: response.data.error_message || 'Failed to fetch routes' });
    }

    // Process each route and add mock safety metrics
    const routesWithMetrics = response.data.routes.map((route, index) => {
      // Calculate total distance in meters
      const totalDistanceMeter = route.legs.reduce((total, leg) => total + leg.distance.value, 0);

      // Calculate total duration in seconds
      const totalDurationSec = route.legs.reduce((total, leg) => total + leg.duration.value, 0);

      // --- MOCK DATA GENERATION based on route index and distance ---
      // longer distance -> more stations, slightly varied by index
      const baseStations = Math.max(1, Math.floor(totalDistanceMeter / 5000));
      const policeStations = baseStations + (index % 3);
      const hospitals = Math.max(1, baseStations - 1 + (index % 2));

      // Crowd level: random mock between Low, Moderate, High based on index and duration
      const crowdLevels = ['Low', 'Moderate', 'High', 'Very High'];
      const crowdLevelIndex = (index + Math.floor(totalDurationSec / 600)) % 4;
      const crowdLevel = crowdLevels[crowdLevelIndex];

      // Safety Score (out of 100):
      // More police stations + hospitals -> higher score
      // Higher crowd -> lower score
      let score = 70 + (policeStations * 2) + (hospitals * 2);
      if (crowdLevel === 'High') score -= 10;
      if (crowdLevel === 'Very High') score -= 20;
      if (crowdLevel === 'Low') score += 10;
      // Cap at 99
      const safetyScore = Math.min(99, Math.max(30, score));

      return {
        ...route,
        safetyMetrics: {
          policeStations,
          hospitals,
          crowdLevel,
          safetyScore,
        }
      };
    });

    res.json({
      status: 'success',
      routes: routesWithMetrics
    });

  } catch (error) {
    console.error('Error fetching routes:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Google Maps API Key configured: ${!!(process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY)}`);
});
