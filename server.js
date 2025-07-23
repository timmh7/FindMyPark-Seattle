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
    - dog_friendly (true/false)
    - bathrooms (true/false)
    - playground (true/false)
    - water_access (true/false)
    - neighborhood (string)

    Only include keys the user clearly asks for. Don't make assumptions.
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

// Main route
app.post('/park-assistant', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ response: "No query provided." });

  try {
    const filters = await parseQueryToFilters(query);

    // TODO: Load parks DB and filter based on filters
    // i.e: const parks = await fs.readFile('parks-db.csv', 'utf8');
    // Then parse CSV and filter

    // For now, just return the filters as a demo
    res.json({ response: `Filters extracted: ${JSON.stringify(filters)}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ response: "AI assistant failed." });
  }
});