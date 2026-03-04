# TriLens_AI: Intelligent Micro-Parking Management

**TriLens_AI** is a smart, full-stack solution designed to solve "Vehicle Displacement Anxiety" in dense, disorganized urban parking environments. By combining QR-based anchoring, manual grid mapping, and on-device AI landmark recognition, it ensures students and urban commuters can find their vehicles in seconds—even when GPS fails or physical markers are damaged.

---

## SDG Alignment
This project is built in alignment with **United Nations Sustainable Development Goal 11: Sustainable Cities and Communities**.
* **Target 11.2:** Improving access to safe, affordable, and sustainable transport systems.
* **Impact:** By reducing the time spent idling engines and wandering through parking lots, TriLens_AI reduces localized carbon emissions and optimizes the use of limited urban micro-spaces.

---

## The TriLens Architecture
To ensure 100% reliability, the system operates on a **Triple-Layer Strategy**:

1. **Level 1 (The Optical Anchor):** High-speed QR/OCR scanning for instant zone identification.
2. **Level 2 (The Failure Fallback):** An interactive SVG/Grid map for manual "Check-in" if physical tags are missing or damaged.
3. **Level 3 (The AI Context):** On-device computer vision that detects environmental landmarks (e.g., "Near Blue Pillars") to provide human-readable retrieval hints.

---

## Key Features
* **Progressive Web App (PWA):** Zero-install, mobile-first experience that works offline via Service Workers.
* **Edge AI Integration:** On-device Object Detection and OCR using TensorFlow.js (Zero server costs).
* **Predictive Suggestions:** Smart-zone highlighting based on historical user parking patterns and time of day.
* **Guard Mode:** A specialized interface for security personnel to update vehicle locations if rows are rearranged.

---

## Tech Stack
### **Frontend**
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS (Optimized for high-glare outdoor visibility)
* **AI Engine:** TensorFlow.js (COCO-SSD) & Tesseract.js (OCR)
* **Offline Storage:** IndexedDB & LocalStorage

### **Backend**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB Atlas (Cloud)
* **Authentication:** JWT (JSON Web Tokens)

---

##  Project Structure
```text
TriLens_AI/
├── frontend/           # React PWA (Vite + Tailwind)
│   ├── src/components/ # Scanner, ManualMap, AIOverlay
│   └── src/utils/      # TensorFlow.js logic & OCR handlers
├── backend/            # Node.js + Express API
│   ├── models/         # MongoDB Schemas (ParkingLogs, Zones)
│   └── routes/         # API Endpoints
└── README.md           # Project Overview