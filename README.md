# CivicAI — AI-Powered Community Problem Intelligence

CivicAI is a full-stack AI-powered civic technology platform designed to help communities report, understand, prioritize, and monitor local problems.

The platform combines **Artificial Intelligence, geolocation, duplicate detection, analytics, and role-based administration** to turn individual community reports into structured civic intelligence.

## 🌐 Project

- **GitHub:** https://github.com/sakchamkumar/CivicAI
- **Backend:** https://civicai-backend-qqpr.onrender.com
- **Frontend:** Deployed on Render

---

## 🎯 Problem Statement

Community problems such as potholes, waste accumulation, water issues, traffic problems, and environmental concerns are often reported without enough structure or prioritization.

CivicAI addresses this by allowing users to submit a problem and automatically analyzing it using AI.

Instead of storing only a text complaint, CivicAI creates structured information such as:

- Problem category
- Subcategory
- Severity
- Safety risk
- AI confidence
- Reasoning
- Priority score
- Geographic coordinates
- Current resolution status

This makes community reports easier to analyze and manage.

---

## ✨ Features

### 🤖 AI-Powered Problem Analysis

When a user submits a report, CivicAI sends the problem information to Gemini and generates structured analysis.

Example:

```json
{
  "category": "Road",
  "subcategory": "Pothole",
  "severity": "HIGH",
  "safetyRisk": "HIGH",
  "confidence": 0.95,
  "reasoning": "A large pothole can create significant safety risks for vehicles and pedestrians.",
  "priorityScore": 95
}
```

The AI pipeline validates the returned structure before saving it.

### 🎯 Priority Scoring

CivicAI converts severity and safety risk into a priority score from 0–100, allowing administrators to identify urgent reports quickly.

### 📍 Geolocation

Users can provide a location manually or allow CivicAI to obtain their GPS coordinates.

Reports can contain latitude, longitude, location accuracy, and location source.

### 🔎 Duplicate Detection

Before submitting a report, CivicAI checks existing reports for potential duplicates using:

- Text similarity
- Geographic distance
- Geographic score
- Combined duplicate score

### 🗺️ Community Map

Reports containing coordinates can be visualized using React Leaflet and OpenStreetMap, providing a spatial view of community problems.

### 👥 My Reports

Authenticated users can view their submitted reports and open individual report details.

### 📄 Report Details

Reports display their description, category, location, AI analysis, severity, safety risk, priority score, current status, and status history.

### 🔄 Status Workflow

```text
Submitted
   ↓
Reviewing
   ↓
In Progress
   ↓
Resolved
```

Every status change is recorded in a status history timeline.

### 🛡️ Admin Dashboard

Administrators have access to:

- Report statistics
- Search
- Category filtering
- Status filtering
- Severity filtering
- Report management
- Status updates
- Status history

Normal users cannot access the admin dashboard.

### 📊 Analytics

CivicAI calculates analytics directly from real Firestore report data, including:

- Total reports
- High-priority reports
- Average priority
- Resolved reports
- Category distribution
- Severity distribution
- Status distribution
- Recent reporting trends
- Common problem types
- Highest-priority reports
- Approximate geographic hotspots

No fake analytics data is used.

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │       + Vite        │
                    └──────────┬──────────┘
                               │
                  ┌────────────┼────────────┐
                  │            │            │
                  ▼            ▼            ▼
             Firebase      Express API   Leaflet/
              Auth &        Backend       OpenStreetMap
             Firestore
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Gemini AI      │
                    │  Problem Analysis   │
                    └─────────────────────┘
```

---

## 🧠 AI Pipeline

```text
User submits report
        ↓
Input validation
        ↓
Description + category + location
        ↓
Gemini AI analysis
        ↓
JSON response
        ↓
Schema/value validation
        ↓
Severity + safety risk
        ↓
Priority score calculation
        ↓
Structured report saved
        ↓
Dashboard / Map / Analytics / Admin
```

The AI does not directly control trusted workflow state such as the administrator's resolution status.

---

## 🔬 Duplicate Detection Pipeline

```text
New report
    ↓
Existing reports retrieved
    ↓
Text tokenization
    ↓
Stop-word removal
    ↓
Text similarity calculation
    ↓
Geographic distance calculation
    ↓
Geo score
    ↓
Combined duplicate score
    ↓
Potential duplicate matches
```

The current implementation uses geographic distance and text similarity rather than claiming to use a trained machine-learning model.

---

## 🔐 Security

CivicAI includes:

- Firebase Authentication
- Firestore security rules
- Role-based admin authorization
- Firebase Admin token verification
- Protected frontend routes
- Admin-only backend operations
- Environment variables for secrets
- `.env` files excluded from Git
- Firebase service-account credentials excluded from Git
- CORS configuration
- Request validation
- AI API rate limiting

### Role-based access

```text
Normal User
 ├── Dashboard
 ├── Report Problem
 ├── My Reports
 ├── Map
 └── Analytics

Admin
 ├── Everything above
 └── Admin Dashboard
```

---

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Firebase Authentication
- Firebase Firestore
- React Leaflet
- OpenStreetMap

### Backend

- Node.js
- Express
- CORS
- dotenv
- Firebase Admin SDK
- Gemini API
- express-rate-limit
- Multer

### Deployment

- GitHub
- Render
- Firebase
- Google Analytics

---

## 📁 Project Structure

```text
CivicAI/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── firebase.js
│   │   ├── config.js
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── .gitignore
│
└── backend/
    ├── routes/
    │   ├── ai.js
    │   ├── duplicates.js
    │   └── admin.js
    ├── utils/
    │   ├── gemini.js
    │   └── firebaseAdmin.js
    ├── server.js
    ├── package.json
    └── .gitignore
```

---

## 🗄️ Data Model

### Users

```text
users/{userId}
 ├── name
 ├── email
 ├── role
 └── createdAt
```

### Reports

```text
reports/{reportId}
 ├── userId
 ├── description
 ├── category
 ├── location
 ├── latitude
 ├── longitude
 ├── severity
 ├── safetyRisk
 ├── priorityScore
 ├── aiConfidence
 ├── aiReasoning
 ├── status
 ├── createdAt
 └── updatedAt
```

### Status History

```text
statusHistory/{statusId}
 ├── reportId
 ├── userId
 ├── previousStatus
 ├── newStatus
 ├── changedBy
 └── timestamp
```

---

## 🚀 Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/sakchamkumar/CivicAI.git
cd CivicAI
```

### 2. Start the backend

```bash
cd backend
npm install
npm start
```

The backend runs on `http://localhost:5000`.

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the Vite development URL shown in the terminal.

### 4. Environment variables

Frontend environment variables are stored locally in `.env.local`.

Backend environment variables are stored locally in `.env`.

Secrets are intentionally not included in this repository.

---

## 🧪 Testing

Major application flows were tested, including:

- User signup and login
- Firebase authentication
- Report creation
- GPS location
- AI analysis
- Priority scoring
- Duplicate detection
- My Reports
- Report Details
- Status history
- Admin authentication
- Admin status updates
- Admin dashboard filtering
- Analytics
- Map navigation
- Protected routes
- Firestore security rules
- Production deployment

---

## 📈 Engineering Principles

### Real data over fake demonstrations

Analytics are calculated from actual Firestore reports rather than hard-coded sample statistics.

### Explainable AI output

The AI returns reasoning alongside classification, severity, and confidence.

### No fake machine learning

Duplicate detection currently uses deterministic text and geographic similarity rather than pretending to be a trained ML model.

### Separation of responsibilities

Frontend authentication and user interaction are separated from backend AI processing and privileged administrative operations.

### Security by design

Secrets remain outside the source code, while Firebase rules and backend authorization protect sensitive operations.

---

## 🌍 Future Improvements

Possible future development includes:

- Optional image-based problem analysis
- Advanced geospatial clustering
- Historical trend forecasting
- Real machine-learning models after sufficient historical data is collected
- Public civic issue feeds
- Municipality/organization integrations
- Notifications for report status changes
- More advanced geographic visualization

These are intentionally treated as future work rather than claiming functionality that is not currently implemented.

---

## 👨‍💻 Author

**Sakcham Kumar**

CivicAI is part of a broader portfolio of software projects exploring how computer science and artificial intelligence can be applied to real-world problems.

### Related projects

- **EduBridgeAI** — AI + Education + College Access
- **ResearchLensAI** — AI + Research + Knowledge Discovery
- **CivicAI** — AI + Geospatial Data + Community Intelligence

---

## 📜 License

This project is currently presented as a personal portfolio and educational software project.
