require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// CORS configuration for separate frontend/backend deployment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || '*' // Set FRONTEND_URL in production
    : ['http://localhost:3000', 'http://localhost:3001'], // Local development
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
const path = require('path');
const OpenAI = require('openai');
const fs = require('fs/promises');

const PORT = process.env.PORT || 5000;

// Serve static files from the React build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  // Serve images and other assets from the public folder in production
  app.use('/img-assets', express.static(path.join(__dirname, 'client/public/img-assets')));
} else {
  // In development, serve the client's public folder for assets
  app.use('/static', express.static(path.join(__dirname, 'client/public')));
  // Also serve images directly in development for consistency
  app.use('/img-assets', express.static(path.join(__dirname, 'client/public/img-assets')));
}

// Endpoint to get Google Maps API key
app.get('/api/google-maps-key', (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

// -----------------------------------------------------------------------------------------
// OpenAI API Requests
const OpenAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Step 1: Parse Query to Filters using GPT
async function parseQueryToFilters(query) {
  const systemPrompt = `
    You are a helpful assistant that extracts JSON filters from user queries about Seattle parks.

    Only return a compact JSON object with keys from this list:
    -adult_fitness_equipment (yes/no)
    -art_in_the_park (yes/no)
    -baseball/softball_fields (yes/no)
    -basketball_courts (yes/no)
    -dog_off_leash_areas (yes/no)
    -drinking_fountains (yes/no)
    -fire_pits (yes/no)
    -fishing_piers (yes/no)
    -football_fields (yes/no)
    -gardens (yes/no)
    -grills (yes/no)
    -hand_carry_boat_launches (yes/no)
    -motorized_boat_launches (yes/no)
    -picnic_sites (yes/no)
    -play_area (yes/no)
    -restrooms (yes/no)
    -skate_park (yes/no)
    -soccer_fields (yes/no)
    -spray_parks (yes/no)
    -swimming_beaches (yes/no)
    -tennis_courts (yes/no)
    -track_fields (yes/no)
    -trails (yes/no)
    -views (yes/no)
    -volleyball_courts (yes/no)
    -wading_pools (yes/no)

    If the user's query implies a feature, you may include it.
    Examples:
    - "I want to go fishing" → { "fishing_piers": "yes" }
    - "A place to play soccer and eat lunch" → { "soccer_fields": "yes", "picnic_sites": "yes" }

    Return only JSON.
    `;

  const response = await OpenAIClient.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Query: "${query}"\nOutput:` }
    ]
  });

  const filterText = response.choices[0].message.content.trim();
  try {
    const filters = JSON.parse(filterText);
    return filters;
  } catch (err) {
    console.error("Failed to parse filters:", filterText);
    return {};
  }
}

// Park AI Route
app.post('/park-assistant', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ response: "No query provided." });

  try {
    // 1. Parse the user query to filters
    const filters = await parseQueryToFilters(query);

    // 2. Load parks database CSV and turn it into json objects
    const csvText = await fs.readFile(path.join(__dirname, 'client', 'public', 'parks-features.csv'), 'utf8');
    const rows = csvText.split('\n');
    const headers = rows[0].split(',');
    const parks = rows.slice(1) // get rid of header row
      .filter(line => line.trim().length > 0)
      .map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        return obj;
      });

    // Step 3: Filter matching parks using original logic
    const matchingParks = parks.filter(park => {
      return Object.entries(filters).every(([key, value]) => {
        return park[key] && park[key].toLowerCase() === value.toLowerCase();
      });
    });

    // Create HTML-linked park names
    const linkedParks = matchingParks.map(park => ({
      name: park.name,
      link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(park.name + ' Seattle WA')}`
    }));

    const parkLinksHTML = linkedParks.map(p => `- <a href="${p.link}" target="_blank">${p.name}</a>`).join('\n');

    // Step 4: Generate natural language summary using OpenAI
    const featureList = Object.keys(filters)
      .map(f => f.replace(/_/g, ' '))
      .join(', ');

    const parkNames = matchingParks.map(p => `- ${p.name}`).join('\n');

    const prompt = `
      You are a helpful and friendly Seattle parks assistant.
      Make the response fun, add some emojis here and there (do not add emojis when listing the parks).

      The user asked for parks with the following features:
      ${featureList.split(', ').map(f => `- ${f}`).join('\n') || '(none provided)'}

      Here are the matching parks:
      ${parkNames ? parkNames.split('\n').map(p => `- ${p}`).join('\n') : '(none)'}

      Here are the matching parks with links:
      ${parkLinksHTML || '(none)'}

      Your task:
      - If there are features provided and matching parks, list them in a friendly way based on the linked parks.
      - If there are features but NO matching parks, suggest the user adjust their search.
      - If there are NO features provided, tell the user to enter specific park features (like "dog-friendly" or "restrooms").

      DO NOT suggest any random parks from your own knowledge.
      DO NOT list example parks unless they were matched from the query.
      ONLY use parks from the provided matching list.
      ONLY discuss features the user provided.

      Output a short, friendly, and accurate response based ONLY on the data above.
    `;


    const completion = await OpenAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a friendly and helpful Seattle parks assistant." },
        { role: "user", content: prompt }
      ]
    });

    // 1: Get plain GPT text
    const gptResponse = completion.choices[0].message.content;

    // 2: Convert GPT response to HTML (basic line breaks)
    const htmlResponse = gptResponse.replace(/\n/g, '<br>');
    const fullHTML = htmlResponse.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    // Send to frontend
    res.json({ response: fullHTML });

  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "AI assistant failed." });
  }
});

// Catch all handler for React Router (production only)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});