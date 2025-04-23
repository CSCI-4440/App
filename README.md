# Stratus

Instructions to run the project:
  1. Open the command prompt and run “https://github.com/CSCI-4440/App.git”, and then “cd App”.
  2. cd frontend and type “npm install”
  3. cd ../backend and type “npm install”
  4. Get the Google Maps API key:
   4a. Go to Google Maps Credentials
   4b. Create a project
   4c. Create a billing account if needed
   4d. Go to APIs & Services > Library
   4e. Search for "Google Maps Routes API"
   4f. Click Enable.
   4g. Go to APIs & Services > Credentials
   4h. Click Create Credentials > API 
   4i. Copy the API key.
  5. cd ../frontend, and type “ipconfig getifaddr en0” for Mac, “ipconfig” for Windows. Copy the IPv4 Address under Wireless LAN.
  6. Type “nano config.js”
  7. Add Google Maps API key and copied IP address in the designated spots
  8. Press CTRL + o to save, press enter to confirm, then CTRL + x to exit.
  9. Get the OpenWeatherMaps API Key
    9a. Go to OpenWeatherMaps API Page. Required to sign in.
    9b. The API key needed is given for student accounts. Register your account as a student account, and an API key will be emailed shortly.
  10. cd ../backend and type “nano .env”
  11. Add Google Maps API key and OpenWeatherMaps API key.
  12. Press CTRL + o to save, press enter to confirm, then CTRL + x to exit.
  13. type “npm start” in backend directory
  14. cd ../frontend and type “npm start”
  15. After running, a QR code will be generated
  16. In the IOS App Store, download the Expo Go app.
  17. Use the phone’s camera to scan the QR code, which will redirect the user to Expo Go where our project can be run.
