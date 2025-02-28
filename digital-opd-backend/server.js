const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const db = require("./database");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const genAI = new GoogleGenerativeAI("GEMINI_API_KEY"); // Replace with your actual API key
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

io.on("connection", (socket) => {
  console.log("✅ Client connected");

  let activePatient = null;
  let testAttempts = 0;
  let diagnosisAttempts = 0;
  let testScore = 5;
  let diagnosisScore = 5;

// 📌 Fetch a patient case with structured presentation
socket.on("request_patient", () => {
  console.log("🔍 Fetching a patient case...");

  db.get("SELECT * FROM patients ORDER BY RANDOM() LIMIT 1", async (err, patient) => {
    if (err) {
      console.error("❌ Database error:", err);
      socket.emit("error", "Failed to fetch patient case");
      return;
    }

    if (!patient) {
      console.warn("⚠️ No patient case found in database.");
      socket.emit("error", "No patient case available.");
      return;
    }

    activePatient = patient;
    testAttempts = 0;
    diagnosisAttempts = 0;
    testScore = 5;
    diagnosisScore = 5;

    // 🗣️ Format patient dialogue (natural speech)
    const patientIntro = `Hi, Dr. Good to see you. I've been experiencing ${patient.symptoms}. ${patient.additional_info || ""}`;

    // 🔥 AI analyzes the case
    const analysisPrompt = `The patient is a ${patient.age}-year-old ${patient.gender} with a history of "${patient.history}". 
    Symptoms: "${patient.symptoms}". Based on this information, provide a professional medical assessment in 1-2 sentences. 
    Conclude with: "What test should we run?"`;

    try {
      const analysisResponse = await model.generateContent([analysisPrompt]);
      const aiAnalysis = analysisResponse.response.candidates[0].content.parts[0].text;

      // ✅ Send patient case with structured format
      socket.emit("patient_case", {
        patientDialogue: patientIntro,
        aiAnalysis: aiAnalysis || "No AI analysis available",
      });

      console.log("📤 Sent to frontend:", {
        patientDialogue: patientIntro,
        aiAnalysis,
      });

      console.log("✅ Sent patient case:", patient.correct_diagnosis);
    } catch (aiError) {
      console.error("❌ AI error:", aiError);
      socket.emit("error", "AI failed to analyze the patient case.");
    }
  });
});

  // 📌 Handle test selection
  socket.on("submit_test", async ({ selectedTest }) => {
    if (!activePatient) {
      socket.emit("error", "No active patient case. Please request a new case.");
      return;
    }
  
    testAttempts++;
    let correct = selectedTest.toLowerCase() === activePatient.correct_test.toLowerCase();
  
    // 🔹 Updated Prompt to Keep AI Response Short
    let prompt = `A student chose the test "${selectedTest}" for a patient with symptoms "${activePatient.symptoms}". 
    Provide AI doctor feedback in 2 sentences or less. Keep it professional and concise.`;
  
    try {
      const response = await model.generateContent([prompt]);
      const aiMessage = response.response.candidates[0].content.parts[0].text;
  
      if (!correct) testScore = Math.max(0, testScore - 1);
  
      // Send test result
      socket.emit("test_result", {
        correct,
        score: testScore,
        aiMessage,
        attempts: testAttempts,
      });
  
      console.log(correct ? "✅ Correct Test!" : "❌ Wrong Test. Score:", testScore);
  
      // ✅ If the test is correct, ask for the diagnosis
      if (correct) {
        socket.emit("next_step", {
          message: "The test is correct. Based on the results, what should be the diagnosis?",
        });
      }
    } catch (aiError) {
      console.error("❌ AI error:", aiError);
      socket.emit("error", "AI failed to provide test feedback.");
    }
  });
  
  
  // 📌 Handle diagnosis submission
  socket.on("submit_diagnosis", async ({ selectedDiagnosis }) => {
    if (!activePatient) {
      socket.emit(
        "error",
        "No active patient case. Please request a new case."
      );
      return;
    }

    diagnosisAttempts++;
    let correct =
      selectedDiagnosis.toLowerCase() ===
      activePatient.correct_diagnosis.toLowerCase();

    let prompt = `A student diagnosed the patient with "${selectedDiagnosis}" after conducting the correct test. Provide AI doctor feedback.`;

    try {
      const response = await model.generateContent([prompt]);
      const aiMessage = response.response.candidates[0].content.parts[0].text;

      if (!correct) diagnosisScore = Math.max(0, diagnosisScore - 1);

      socket.emit("diagnosis_result", {
        correct,
        score: diagnosisScore,
        aiMessage,
        attempts: diagnosisAttempts,
      });

      console.log(
        correct ? "✅ Correct Diagnosis!" : "❌ Wrong Diagnosis. Score:",
        diagnosisScore
      );
    } catch (aiError) {
      console.error("❌ AI error:", aiError);
      socket.emit("error", "AI failed to provide diagnosis feedback.");
    }
  });
});

server.listen(5000, () => console.log("🚀 Server running on port 5000"));
