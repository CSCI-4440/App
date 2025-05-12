# 🌤️ Stratus – Weather-Based Navigation App

A React Native mobile app that recommends optimal travel routes based on real-time weather conditions using Google Maps and OpenWeather APIs.

---

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/CSCI-4440/App.git
cd App
```

### 2. Install Dependencies

#### Frontend  
```bash
cd frontend
npm install
```

#### Backend  
```bash
cd ../backend
npm install
```

---

## 🔑 API Setup

### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/).  
2. Create a new project.  
3. Create a billing account if required.  
4. Navigate to **APIs & Services > Library**.  
5. Search for **Google Maps Routes API** and click **Enable**.  
6. Go to **APIs & Services > Credentials**.  
7. Click **Create Credentials > API Key**.  
8. Copy the API key.

### Configure Frontend

1. In the terminal:

   - **Mac:**  
     ```bash
     ipconfig getifaddr en0
     ```
   - **Windows:**  
     ```bash
     ipconfig
     ```
2. Copy the **IPv4 address** under Wireless LAN.  
3. Navigate to `frontend` and edit `config.js`:

   ```bash
   nano config.js
   ```
4. Add your **Google Maps API Key** and **IPv4 Address** in the designated fields.  
5. Save and exit:  
   - Press `CTRL + O`, then `Enter` to save.  
   - Press `CTRL + X` to exit.  

---

### OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api) and sign in.  
2. Register as a student account to receive an API key via email.  
3. Navigate to the backend directory and edit the environment file:

   ```bash
   cd ../backend
   nano .env
   ```
4. Add both the **Google Maps API key** and the **OpenWeatherMap API key** in the following format:

   ```ini
   GOOGLE_MAPS_API_KEY=your_google_api_key
   OPENWEATHER_API_KEY=your_openweather_api_key
   ```
5. Save and exit.

---

## 🧪 Running the App

#### Backend  
```bash
npm start
```

#### Frontend  
```bash
cd ../frontend
npm start
```

A **QR code** will be generated.  
1. Download the **Expo Go** app from the iOS App Store.  
2. Use your phone’s camera to scan the QR code.  
3. The app will open in Expo Go and run on your device.  

---

## 📍 Tech Stack

- React Native + Expo Go  
- Node.js (Backend)  
- Google Maps API  
- OpenWeatherMap API  

---
