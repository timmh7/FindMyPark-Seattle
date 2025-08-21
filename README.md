https://seattlegreenspaces.onrender.com

This is a project is intended to help people explore Seattle's vast park system and greenspaces! Seattle has over 400 official public parks; as such I created a tool that makes it easy to find the perfect outdoor space - whether you're looking for a dog-friendly spot, a place to hike, or just a local quiet park to relax.

Integrated with an AI-powered park guide that lets you describe what you're looking for in plain language, and it will suggest parks that match your needs! 🌲

All data sourced from the City of Seattle:
https://data-seattlecitygis.opendata.arcgis.com/

## Setup Instructions

### 1. Frontend Setup

First, install the root dependencies:
```bash
cd client
```
```bash
npm install
```
```bash
npm run build
```

### 2. Backend Setup
Then install the React client dependencies:
```bash
npm install && npm start
```

### 2. Environment Variables

Create a `.env` file in the root directory with:
```
GOOGLE_MAPS_API_KEY= <your_google_maps_api_key>
OPENAI_API_KEY= <your_openai_api_key>
```

Create a `.env` file in the /client directory with:
```
REACT_APP_API_URL= http://localhost:5000 #Local host during development or backend URL when hosting
```

### 3. Development Mode

To run both the server and client in development mode:
```bash
npm run dev
```

## Technologies Used

- **Frontend**: React, Leaflet, D3.js
- **Backend**: Express.js, OpenAI API
- **Maps**: Google Maps API, Leaflet