<div align="center">
  <img src="frontend/public/logo.png" alt="CrowdRakshak Logo" width="200"/>
</div>

# CrowdRakshak

CrowdRakshak is an end-to-end AI-based crowd monitoring and navigation system designed for religious sites and high-traffic areas. The system provides real-time insights into crowd density, ensures safety through anomaly detection, and guides users with interactive navigation tools.

## System Architecture

The platform is built as a multi-service architecture comprising:

- **AI Detection Service (`ai-service`)**: Utilizes YOLOv8 for real-time crowd density estimation and object detection.
- **Backend Service (`backend`)**: A FastAPI-based server providing RESTful APIs, WebSocket support for live data broadcasting, and SQLite for persistent state management.
- **Frontend Dashboard (`frontend`)**: A React-based operator dashboard featuring the "Jade Terminal" aesthetic (midnight teal and jade color palette, Outfit and JetBrains Mono typography) that visualizes crowd density via interactive Mapbox heatmaps and provides safe navigation guidance.

## Features

- **Real-Time Crowd Monitoring**: AI-driven analysis of live camera feeds to estimate crowd density.
- **Interactive Heatmaps**: Mapbox integration for visualizing crowd distribution across different zones.
- **Live Data Broadcasting**: WebSocket integration for instant updates on the dashboard.
- **Jade Terminal UI**: A professional, cohesive command center interface designed for operators.
- **Session Management**: Robust handling of online and offline sessions with data synchronization.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd CrowdRakshak
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **AI Service Setup:**
   ```bash
   cd ai-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python run.py
   ```

## Design Philosophy

The Operator Dashboard is built with the **Jade Terminal** aesthetic. It prioritizes:
- High-contrast color palettes (midnight teal background, jade accents).
- Consistent geometric motifs and modern typography (Outfit, JetBrains Mono).
- CSS-orchestrated animations for a responsive, live command-center feel.

## License

This project is licensed under the MIT License.