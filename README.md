# Digital OPD - AI-Powered Medical Learning Simulation

[![Express](https://img.shields.io/badge/Express-4.x-blue)](https://expressjs.com/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-blue)](https://reactnative.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black)](https://socket.io/)
[![Hugging Face](https://img.shields.io/badge/AI-Hugging%20Face-yellow)](https://huggingface.co/)

An interactive medical simulation platform designed for NEET PG students to practice clinical diagnosis in a virtual OPD (Outpatient Department) environment. Students interact with AI-simulated patients and receive feedback from an AI senior doctor.

## ✨ Key Features

- **AI-Powered Patient Simulation**: Realistic patient cases with medical histories and symptoms
- **Interactive Diagnosis Flow**: Select diagnostic tests and submit diagnoses in real-time
- **Expert AI Feedback**: Receive professional medical feedback on your clinical decisions
- **Performance Scoring**: Point-based evaluation system to track diagnostic accuracy
- **Real-time Communication**: Seamless WebSocket integration for instant interactions
- **Mobile-First Design**: Built with React Native for cross-platform compatibility

## 🏗️ Technology Stack

| Component      | Technology                                             |
|----------------|--------------------------------------------------------|
| **Frontend**   | React Native (Expo Router)                             |
| **Backend**    | Express.js                                             |
| **Database**   | SQLite                                                 |
| **AI Model**   | Hugging Face Mistral 7B (formerly Google Gemini API)   |
| **WebSockets** | Socket.io                                              |
| **API Client** | Axios                                                  |

## 🔄 Clinical Workflow

1. **Patient Presentation**: Student receives a patient case with symptoms and history
2. **Initial Assessment**: AI provides initial clinical analysis
3. **Test Selection**: Student selects appropriate diagnostic test(s)
4. **Clinical Feedback**: AI provides expert feedback on test selection
5. **Diagnosis Submission**: Student submits their final diagnosis
6. **Performance Evaluation**: System scores diagnostic accuracy

## 📂 Project Structure

```
/digital-opd/
│
├── frontend/              # React Native application
│   ├── app/               # Expo Router screens
│   ├── components/        # Reusable UI components
│   ├── services/          # API and socket services
│   └── assets/            # Images, icons and static resources
│
├── backend/               # Express.js server
│   ├── server.js          # Main server with WebSocket integration
│   ├── database.js        # SQLite database connection & queries
│   ├── .env               # Environment variables (API keys)
│   └── package.json       # Backend dependencies
│
└── README.md              # Project documentation
```

## 🚀 Installation and Setup

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with your API key
echo "HUGGING_FACE_API_KEY=your_api_key_here" > .env

# Start the server
node server.js
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

Then scan the QR code with the Expo Go app (Android) or Camera app (iOS) to run on your device.

## 🔌 WebSocket Events

| Event                | Direction      | Description                                       |
|----------------------|----------------|---------------------------------------------------|
| `request_patient`    | Client → Server | Request a new patient case                        |
| `patient_case`       | Server → Client | Receive patient information and initial analysis  |
| `submit_test`        | Client → Server | Submit selected diagnostic test                   |
| `test_result`        | Server → Client | Receive feedback on test selection                |
| `next_step`          | Server → Client | Proceed to diagnosis step                         |
| `submit_diagnosis`   | Client → Server | Submit final diagnosis                            |
| `diagnosis_result`   | Server → Client | Receive feedback on diagnosis                     |

## 📊 Scoring System

- **Initial Points**: 5 points for both test and diagnosis sections
- **Incorrect Answers**: -1 point penalty per incorrect attempt
- **Minimum Score**: 0 points (no negative scoring)
- **Perfect Score**: 10 points total (5 for correct test + 5 for correct diagnosis)

## 🧠 AI Model Integration

The application uses the Hugging Face Mistral 7B model for generating medical responses:

- **Patient Analysis**: Generates professional assessment of symptoms
- **Test Feedback**: Provides educational feedback on test selection
- **Diagnosis Evaluation**: Offers expert commentary on diagnostic accuracy

## 🔧 Troubleshooting

- **AI Model Issues**: If you encounter problems with the AI responses, check:
  - Your Hugging Face API key is valid and has sufficient quota
  - The server logs for specific API error messages
  - The `.env` file is properly configured

- **WebSocket Connection**: If real-time updates aren't working:
  - Ensure your frontend and backend URLs match
  - Check browser console for WebSocket connection errors
  - Verify that port 5000 is not blocked by a firewall
