Try it out here:
https://seattleparksfinder.onrender.com/

This is a project I built to help people explore Seattle's incredible park system! With over 400 parks in the city, I wanted to create a tool that makes it easy to find the perfect outdoor space - whether you're looking for a dog-friendly spot, a place to hike, or just a local quiet park to relax.

I also integrated an AI-powered park guide that lets you describe what you're looking for in plain language, and it will suggest parks that match your needs. Give it a try! 🌲🌲

All data sourced from the City of Seattle:
https://data-seattlecitygis.opendata.arcgis.com/

## Setup Instructions

### 1. Install Dependencies

First, install the root dependencies:
```bash
npm install
```

Then install the React client dependencies:
```bash
cd client && npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with:
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENAI_API_KEY=your_openai_api_key
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