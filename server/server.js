// server.js

// 1. SETUP & INITIALIZATION
// -----------------------------------------------------------------------------
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai'; // <-- Import Google AI

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(cors({
  origin: "https://nanoheal-host-1.onrender.com",  // your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// Firebase Admin SDK Initialization
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Initialize the Google AI client with your API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


// 2. API ROUTES (ENDPOINTS)
// -----------------------------------------------------------------------------

app.get('/', (req, res) => {
  res.send('Hello from the Nano Heal Backend! 👋');
});

// --- Authentication Routes ---
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, username, location, role } = req.body;
    const userRecord = await getAuth().createUser({ email, password, displayName: username });
    await db.collection('users').doc(userRecord.uid).set({ username, email, location, role });
    res.status(201).json({ uid: userRecord.uid, email: userRecord.email });
  } catch (error) {
    console.error("Error signing up:", error);
    let errorMessage = 'Failed to sign up. Please try again.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This email address is already in use.';
    }
    res.status(400).json({ message: errorMessage });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User data not found in database.' });
    }
    const userData = userDoc.data();
    res.status(200).json({ uid: decodedToken.uid, ...userData });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(401).json({ message: 'Login failed. Please try again.' });
  }
});

// --- Authority Dashboard Routes ---
app.get('/api/reports', async (req, res) => {
  try {
    const reportsSnapshot = await db.collection('health_reports').get();
    const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: 'Failed to fetch reports.' });
  }
});

app.post('/api/reports/create', async (req, res) => {
  try {
    const { name, caseCount, symptoms } = req.body;
    if (!name || caseCount == null || !symptoms) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const newReportRef = await db.collection('health_reports').add({
      name,
      caseCount,
      symptoms,
      lastUpdated: FieldValue.serverTimestamp(),
    });
    res.status(201).json({ id: newReportRef.id, name, caseCount, symptoms });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: 'Failed to create report.' });
  }
});

app.put('/api/reports/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { casesToAdd } = req.body;
    if (!casesToAdd) {
      return res.status(400).json({ message: 'Number of cases to add is required.' });
    }
    const reportRef = db.collection('health_reports').doc(id);
    await reportRef.update({
      caseCount: FieldValue.increment(casesToAdd),
      lastUpdated: FieldValue.serverTimestamp(),
    });
    res.status(200).json({ message: 'Report updated successfully.' });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ message: 'Failed to update report.' });
  }
});

// ADD a route to get all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctorsSnapshot = await db.collection('doctors').get();
    const doctors = doctorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: 'Failed to fetch doctors.' });
  }
});

// ADD a route to create a new doctor
app.post('/api/doctors/create', async (req, res) => {
  try {
    const { name, email, specialization } = req.body;
    if (!name || !email || !specialization) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    const newDoctorRef = await db.collection('doctors').add({ name, email, specialization });
    res.status(201).json({ id: newDoctorRef.id, name, email, specialization });
  } catch (error) {
    console.error("Error creating doctor:", error);
    res.status(500).json({ message: 'Failed to create doctor.' });
  }
});

// --- Core Chat Route (Now with Live AI) ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, location } = req.body;
    if (!message || !location) {
      return res.status(400).json({ error: 'Message and location are required.' });
    }

    // 1. Fetch BOTH health reports and doctors from Firestore
    const reportsSnapshot = await db.collection('health_reports').get();
    const healthReports = reportsSnapshot.docs.map(doc => doc.data());
    const healthReportsJson = JSON.stringify(healthReports, null, 2);
    
    const doctorsSnapshot = await db.collection('doctors').get();
    const doctors = doctorsSnapshot.docs.map(doc => doc.data());
    const doctorsJson = JSON.stringify(doctors, null, 2);

    // 2. Construct the NEW, updated prompt for the Gemini API
    const systemPrompt = `
      You are "Nano Heal," an empathetic and cautious AI health assistant for users in India.
      Your primary goal is to provide safe, general information. NEVER give a definitive diagnosis.
      ALWAYS end your response with the mandatory disclaimer.

      ---
      CONTEXT DATA:
      - User's Location: ${location}
      - Current Local Health Report:
        ${healthReportsJson}
      - List of Verified Local Doctors:
        ${doctorsJson}
      ---
      USER'S QUERY:
      "${message}"
      ---
      YOUR TASK:
      1. Analyze the user's symptoms based on the health report.
      2. If a doctor's visit is warranted, suggest ONE relevant doctor from the provided list based on their specialization and the user's symptoms. 
      3. Include the doctor's name, specialization, and email. Do not invent details.
      4. Conclude with the mandatory disclaimer: "--- ⚠️ Disclaimer: This is not medical advice. Please consult a qualified healthcare professional."
    `;
    
    // 3. Make the actual call to the Gemini API
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const aiReply = response.text();

    res.json({ reply: aiReply });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});


// 3. START THE SERVER
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});