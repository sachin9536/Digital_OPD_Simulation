const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const axios = require("axios");
const dotenv = require("dotenv");
const db = require("./database");

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Hugging Face API configuration - Using smaller model
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

// Configure axios for Hugging Face API
const hfClient = axios.create({
  headers: {
    "Authorization": `Bearer ${HF_API_KEY}`,
    "Content-Type": "application/json"
  },
  timeout: 60000 // 60 second timeout for model loading
});

// Helper function to generate content from Mistral with detailed medical prompting
async function generateContent(prompt) {
  try {
    // Format the prompt to emphasize medical context
    const medicalPrompt = `<s>[INST] You are a medical AI assistant with expertise in clinical diagnostics and patient care. 
Please respond to the following medical query with accurate, professional medical information. 
Keep your response concise and focused on the medical aspects.

${prompt} [/INST]</s>`;

    const response = await hfClient.post(HF_API_URL, {
      inputs: medicalPrompt,
      parameters: {
        max_new_tokens: 256,
        temperature: 0.5, // Lower temperature for more focused responses
        top_p: 0.9,
        return_full_text: false
      }
    });
    
    // Extract the generated text
    let generatedText = response.data[0]?.generated_text || "No response from AI model.";
    
    // Clean up any response markers
    generatedText = generatedText.replace(/<\/s>$/, "").trim();
    
    return generatedText;
  } catch (error) {
    console.error("❌ AI API error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    
    // Fallback responses for different scenarios to ensure the app keeps working
    if (prompt.includes("provide a professional medical assessment")) {
      return "Based on the symptoms and history, this could indicate several possible conditions that require further investigation. What test should we run?";
    } else if (prompt.includes("chose the test")) {
      return "This test selection is a reasonable approach given the symptoms. It will help narrow down the potential diagnoses.";
    } else if (prompt.includes("diagnosed the patient")) {
      return "This diagnosis aligns with the patient's symptoms and test results. Continue to monitor and provide appropriate treatment.";
    } else {
      return "Please continue with your medical assessment based on the available information.";
    }
  }
}

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

      // 🔥 AI analyzes the case - Detailed prompt for general model
      const analysisPrompt = `Medical case analysis:
Patient: ${patient.age}-year-old ${patient.gender}
Medical history: ${patient.history}
Presenting symptoms: ${patient.symptoms}
${patient.additional_info ? `Additional information: ${patient.additional_info}` : ''}

Based on this information, provide a professional medical assessment in 1-2 sentences. Make sure your response is clinically accurate and relevant to the symptoms described. Conclude with: "What test should we run?"`;

      try {
        const aiAnalysis = await generateContent(analysisPrompt);

        // ✅ Send patient case with structured format
        socket.emit("patient_case", {
          patientDialogue: patientIntro,
          aiAnalysis: aiAnalysis || "No AI analysis available",
        });

        console.log("📤 Sent to frontend:", {
          patientDialogue: patientIntro,
          aiAnalysis: aiAnalysis.substring(0, 100) + "...", // Log truncated version
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
  
    // 🔹 Enhanced medical prompt
    let prompt = `Medical education scenario:
A medical student selected "${selectedTest}" as the diagnostic test for a patient presenting with: "${activePatient.symptoms}"
The patient's history includes: "${activePatient.history}"
${correct ? "This is the correct test for this case." : "This is not the optimal test for this case."}

Provide educational feedback as a medical instructor in 2 sentences or less. Be professional and concise.`;
  
    try {
      const aiMessage = await generateContent(prompt);
  
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
      socket.emit("error", "No active patient case. Please request a new case.");
      return;
    }

    diagnosisAttempts++;
    let correct = selectedDiagnosis.toLowerCase() === activePatient.correct_diagnosis.toLowerCase();

    // Enhanced clinical prompt
    let prompt = `Medical education feedback:
A medical student diagnosed a patient with "${selectedDiagnosis}" after running the appropriate diagnostic test.
Patient symptoms: "${activePatient.symptoms}"
Patient history: "${activePatient.history}"
${correct ? "This diagnosis is correct." : "This diagnosis is not correct."}

As a senior physician educator, provide professional feedback on this diagnosis in 2-3 sentences. Include clinical reasoning in your response.`;

    try {
      const aiMessage = await generateContent(prompt);

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
  
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// Add routes for monitoring
app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

// Gracefully handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application continues running despite error
});

server.listen(5000, () => console.log("🚀 Server running on port 5000"));