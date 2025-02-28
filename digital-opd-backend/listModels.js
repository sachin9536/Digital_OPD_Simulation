const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCVMi-2uCbASdcBN0vUlDiEV-t8oQmS3MU");

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent(["Say hello"]);

    console.log("Gemini Test Response:", result.response.text());
  } catch (error) {
    console.error("Error testing Gemini API:", error);
  }
}

testGemini();
