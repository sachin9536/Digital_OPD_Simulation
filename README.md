#  Digital OPD - AI-Powered Learning Game

This project is a **chatbot-based learning game** for **NEET PG students**, simulating a **hospital OPD environment**. Students interact with an **AI senior doctor** to diagnose patients by selecting tests and providing diagnoses. The system awards points based on the correctness of their selections.

## 🚀 Features  
 **AI-powered medical simulation** using **Google Gemini API**  
 **Real-time interaction** via **WebSockets** (`socket.io`)  
 **Scoring system**: 5 points for correct choices, reducing per wrong attempt  
 **SQLite database** for patient case storage  
 **React Native frontend** using **Expo Router**  
 **Express.js backend**  

---

## 🏗️ Tech Stack  

| Component     | Technology |
|--------------|------------|
| **Frontend** | React Native (Expo) |
| **Backend**  | Express.js |
| **Database** | SQLite |
| **AI Model** | Google Gemini API |
| **WebSockets** | Socket.io |

---

## 📂 Project Structure  
/digital-opd │── frontend/ # React Native app │ ├── screens/ # Screens for patient cases, diagnosis, etc. │ ├── components/ # Reusable UI components │ ├── services/socket.js # WebSocket service │ ├── App.js # Entry point │── backend/
│ ├── server.js # Express server with WebSocket support │ ├── database.js # SQLite DB connection & queries │ ├── package.json # Backend dependencies │── README.md

---

## 🔧 Installation & Setup  

### 1️⃣ Backend Setup  
** cd backend
** npm install
** node server.js
###  Frontend Setup
** cd frontend
** npm install
** npx expo start
(Runs the app in the Expo development environment)

## Workflow
1️⃣ A patient case is presented:
Example: "I've had a persistent cough and weight loss."

2️⃣ AI analyzes the case and asks:
"What test should we perform?"

3️⃣ User selects a test
✅ Correct test → Earns 5 points
❌ Wrong test → Points decrease & retry

4️⃣ AI provides test feedback & asks for diagnosis

5️⃣ User submits diagnosis
✅ Correct → Earns 5 points
❌ Wrong → Retry with reduced points

### API Endpoints
Endpoint	Description
/request_patient	Sends a random patient case
/submit_test	User submits a test selection
/submit_diagnosis	User submits a diagnosis

