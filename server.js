require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
const path = require('path');
const OpenAI = require('openai');
const fs = require('fs/promises');

const PORT = process.env.PORT || 3000;

// Serve static files
// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to get Google Maps API key
app.get('/api/google-maps-key', (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Fallback: serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// -----------------------------------------------------------------------------------------
// OpenAI API Requests
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Make sure your key is in .env
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

    If the user's query strongly implies a feature, you may include it.
    Avoid guessing beyond what is clearly stated or strongly implied.
    Return only JSON.
    `;

  const response = await client.chat.completions.create({
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
    // Parse the user query to filters
    const filters = await parseQueryToFilters(query);

    // Load parks database CSV and turn it into json
    // Format looks like this:
    //   { name: 'Park A', lat: '...', lng: '...', restrooms: 'yes', ... },
    // { name: 'Park B', lat: '...', lng: '...', restrooms: 'no',  ... },
    const csvText = await fs.readFile(path.join(__dirname, 'public', 'parks-features.csv'), 'utf8');
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

    // Return parks based on filtered user input
    const matchingParks = parks.filter(park => {
      return Object.entries(filters).every(([key, value]) => {
        return park[key] && park[key].toLowerCase() === value.toLowerCase();
      });
    }).map(park => park.name);

    res.json({ response: `Matching parks: ${matchingParks.join(', ')}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "AI assistant failed." });
  }
});