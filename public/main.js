// Lenis smooth scroll
window.addEventListener('DOMContentLoaded', () => {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    direction: 'vertical',
    gestureDirection: 'vertical',
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

   lenis.scrollTo(0, { immediate: true }); // instantly scroll to top
});

// ---------------------------------------------------------------------------------------------

// Park Guide Assistant: Frontend logic to send user query to backend
document.addEventListener('DOMContentLoaded', function() {
  // Always clear AI input and search box on page load
  const aiInput = document.getElementById('ai-guide-input');
  if (aiInput) aiInput.value = '';
  const searchInput = document.getElementById('park-searchbar');
  if (searchInput) searchInput.value = '';
  const aiBtn = document.getElementById('ai-guide-btn');
  const aiResponse = document.getElementById('ai-guide-response');
  if (aiBtn && aiInput && aiResponse) {
    aiBtn.addEventListener('click', async function() {
      const query = aiInput.value.trim(); // Grab user's query
      if (!query) {
        aiResponse.textContent = 'Please enter what you are looking for.';
        return;
      }
      aiResponse.textContent = 'Thinking...';
      aiResponse.classList.add('blinking');

      try {
        // Send user's query to backend as a POST request
        const res = await fetch('/park-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        if (!res.ok) throw new Error('Server error');
        const data = await res.json();
        aiResponse.classList.remove('blinking');
        aiResponse.innerHTML = (data.response || 'No answer found.').replace(/\n/g, '<br>');
      } catch (err) {
        aiResponse.classList.remove('blinking');
        aiResponse.textContent = 'Sorry, something went wrong.';
      }
    });
  }
});

// ---------------------------------------------------------------------------------------------

// Create leaflet map centered on Seattle
const map = L.map('map').setView([47.6062, -122.3321], 12);

// OpenStreetMap tile added into leaflet map
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    maxZoom: 20
}).addTo(map);

// Load and style Seattle city boundary
d3.json("city-limits.geojson").then(boundaryData => {
    L.geoJSON(boundaryData, {
      style: {
        color: "#66bb6a",
        weight: 1,
        fillColor: "#c8e6c9",
        fillOpacity: 0.2
      },
      interactive: false
    }).addTo(map);
});

// ---------------------------------------------------------------------------------------------

const features = [
  'adult_fitness_equipment',
  'art_in_the_park',
  'baseball/softball_fields',
  'basketball_courts',
  'dog_off_leash_areas',
  'drinking_fountains',
  'fire_pits',
  'fishing_piers',
  'football_fields',
  'gardens',
  'grills',
  'hand_carry_boat_launches',
  'motorized_boat_launches',
  'picnic_sites',
  'play_area',
  'restrooms',
  'skate_park',
  'soccer_fields',
  'spray_parks',
  'swimming_beaches',
  'tennis_courts',
  'track_fields',
  'trails',
  'views',
  'volleyball_courts',
  'wading_pools'
];

let allParks = []; // Field: Parks, each element is a row from CSV
let parkMarkers = []; // Field: Park markers currently on the map

// Helper Function: Removes all markers on map
function clearMarkers() {
    parkMarkers.forEach(marker => marker.remove());
    parkMarkers = [];
}

// Helper Function: Clears markers and renders new markers based on active filters
function filterAndRenderParks() {
    clearMarkers();
    const activeFilters = features.filter(f => document.getElementById('filter-' + f).checked);
    let filtered = allParks;
    if (activeFilters.length > 0) {
        filtered = filtered.filter(d => {
            return activeFilters.every(f => {
                return d[f] && d[f].toLowerCase() === 'yes';
            });
        });
    }
    filtered.forEach(d => {
        const lat = +d.lat;
        const lng = +d.lng;
        const marker = L.circleMarker([lat, lng], {
            radius: 4,
            fillColor: "green",
            color: "#2e7d32",
            weight: 1,
            opacity: 0.75,
            fillOpacity: 0.75
        }).addTo(map);
        marker.bindPopup(`<strong>${d.name}</strong>`);
        marker.on('popupopen', function(e) {
            showParkDashboard(d);
        });
        parkMarkers.push(marker);
    });
}

// Load the CSV
d3.csv("parks-features.csv").then(data => {
    allParks = data;
    console.log('Loaded parks:', allParks.length);
    filterAndRenderParks();
    features.forEach(f => {
        const el = document.getElementById('filter-' + f);
        if (el) el.addEventListener('change', filterAndRenderParks);
    });

    // Intro screen button logic
    const btnAI = document.getElementById('btn-AI');
    const btnExplore = document.getElementById('btn-explore');
    if (btnAI) {
        btnAI.addEventListener('click', function() {
            const aiGuide = document.getElementById('ai-section');
            if (aiGuide) {
                aiGuide.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    if (btnExplore) {
        btnExplore.addEventListener('click', function() {
            const mapDiv = document.getElementById('map-section');
            if (mapDiv) {
                mapDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Dynamic searchbar logic
    const searchInput = document.getElementById('park-searchbar');
    const searchError = document.getElementById('searchbar-error');
    const suggestionsList = document.getElementById('searchbar-suggestions');

    function updateSuggestions() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            suggestionsList.style.display = 'none';
            searchError.textContent = '';
            document.getElementById('search-dashboard').style.display = 'none';
            return;
        }
        const matches = allParks.filter(p => p.name && p.name.toLowerCase().includes(query));
        if (matches.length === 0) {
            suggestionsList.style.display = 'none';
            searchError.textContent = 'No parks found.';
            document.getElementById('search-dashboard').style.display = 'none';
            return;
        }
        searchError.textContent = '';
        suggestionsList.innerHTML = '';
        matches.slice(0, 8).forEach(p => {
            const li = document.createElement('li');
            li.textContent = p.name;
            li.style.padding = '8px';
            li.style.cursor = 'pointer';
            li.onmouseenter = () => { li.style.background = '#f0f0f0'; };
            li.onmouseleave = () => { li.style.background = '#fff'; };
            li.onclick = () => {
                showSearchDashboard(p);
                suggestionsList.style.display = 'none';
                searchInput.value = p.name;
            };
            suggestionsList.appendChild(li);
        });
        suggestionsList.style.display = 'block';
    }

    searchInput.addEventListener('input', updateSuggestions);
    searchInput.addEventListener('focus', updateSuggestions);
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.style.display = 'none';
        }
    });
});


// Helper Function: Show Park Dashboard (next to map)
function showParkDashboard(park) {
    const dashboard = document.getElementById('park-dashboard');
    dashboard.style.display = 'block';
    document.getElementById('dashboard-empty-message').style.display = 'none';
    document.getElementById('dashboard-park-name').textContent = park.name;

    // Features as green boxes with emojis
    const featureNames = {
        adult_fitness_equipment: 'Adult Fitness Equipment',
        art_in_the_park: 'Art in the Park',
        "baseball/softball_fields": 'Baseball/Softball Fields',
        basketball_courts: 'Basketball Courts',
        dog_off_leash_areas: 'Dog Off Leash Areas',
        drinking_fountains: 'Drinking fountains',
        fire_pits: 'Fire Pits',
        fishing_piers: 'Fishing piers',
        football_fields: 'Football Fields',
        gardens: 'Gardens',
        grills: 'Grills',
        hand_carry_boat_launches: 'Hand Carry Boat Launches',
        motorized_boat_launches: 'Motorized Boat Launches',
        picnic_sites: 'Picnic Sites',
        play_area: 'Play Area',
        restrooms: 'Restrooms',
        skate_park: 'Skate Park',
        soccer_fields: 'Soccer Fields',
        spray_parks: 'Spray Parks',
        swimming_beaches: 'Swimming Beaches',
        tennis_courts: 'Tennis Courts',
        track_fields: 'Track Fields',
        trails: 'Trails',
        views: 'Views',
        volleyball_courts: 'Volleyball Courts',
        wading_pools: 'Wading Pools'
    };

    const featureEmojis = {
        'Adult Fitness Equipment': '🏋️',
        'Art in the Park': '🎨',
        'Baseball/Softball Fields': '⚾',
        'Basketball Courts': '🏀',
        'Dog Off Leash Areas': '🐕',
        'Drinking fountains': '💧',
        'Fire Pits': '🔥',
        'Fishing piers': '🎣',
        'Football Fields': '🏈',
        'Gardens': '🌸',
        'Grills': '🍔',
        'Hand Carry Boat Launches': '🛶',
        'Motorized Boat Launches': '🚤',
        'Picnic Sites': '🧺',
        'Play Area': '🛝',
        'Restrooms': '🚻',
        'Skate Park': '🛹',
        'Soccer Fields': '⚽',
        'Spray Parks': '💦',
        'Swimming Beaches': '🏖️',
        'Tennis Courts': '🎾',
        'Track Fields': '🏃‍♂️',
        'Trails': '🚶‍♂️',
        'Views': '🌄',
        'Volleyball Courts': '🏐',
        'Wading Pools': '🩱'
    };

    let availableFeatures = features.filter(f => park[f] && park[f].toLowerCase() === 'yes');
    let featuresHtml = '';
    if (availableFeatures.length > 0) {
        availableFeatures.forEach(f => {
            const readable = featureNames[f] || f;
            featuresHtml += `<span class="feature-box"><span class="feature-emoji">${featureEmojis[readable] || ''}</span>${readable}</span>`;
        });
    } else {
        featuresHtml = '<div style="color:#888;">No features listed for this park.</div>';
    }
    document.getElementById('dashboard-features').innerHTML = featuresHtml;

    // Google Places API: Show photo, rating, and directions link
    const ratingElem = document.getElementById('dashboard-park-rating');
    const reviewsElem = document.getElementById('dashboard-park-reviews');
    const imageElem = document.getElementById('dashboard-park-image');
    const directionsBtn = document.getElementById('dashboard-directions');
    ratingElem.textContent = '';
    reviewsElem.textContent = '';
    imageElem.style.display = 'none';
    imageElem.src = '';
    directionsBtn.onclick = null;
    directionsBtn.style.display = 'none';

    if (window.google && window.google.maps) {
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const request = {
            query: park.name + ', Seattle, WA',
            fields: ['name', 'photos', 'rating', 'user_ratings_total', 'geometry', 'place_id']
        };
        service.findPlaceFromQuery(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                const place = results[0];
                let photoSet = false;
                // Photo
                if (place.photos && place.photos.length > 0) {
                    const photoUrl = place.photos[0].getUrl({maxWidth: 340, maxHeight: 220});
                    imageElem.onload = function() {
                        imageElem.style.display = 'block';
                    };
                    imageElem.onerror = function() {
                        imageElem.style.display = 'none';
                    };
                    imageElem.src = photoUrl;
                    photoSet = true;
                }
                // Fallback: Street View if no photo
                if (!photoSet && place.geometry && place.geometry.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    fetch('/api/google-maps-key')
                        .then(res => res.json())
                        .then(data => {
                            if (data.key) {
                                imageElem.onload = function() {
                                    imageElem.style.display = 'block';
                                };
                                imageElem.onerror = function() {
                                    imageElem.style.display = 'none';
                                };
                                const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=340x220&location=${lat},${lng}&fov=80&heading=70&pitch=0&key=${data.key}`;
                                imageElem.src = streetViewUrl;
                            }
                        });
                }
                // If neither photo nor street view is available, hide image after timeout
                setTimeout(() => {
                    if (!imageElem.src || imageElem.src === window.location.href || imageElem.naturalWidth === 0) {
                        imageElem.style.display = 'none';
                    }
                }, 1500);
                // Rating
                if (place.rating) {
                    ratingElem.textContent = place.rating.toFixed(1);
                }
                // Reviews
                if (place.user_ratings_total !== undefined) {
                    reviewsElem.textContent = `${place.user_ratings_total} reviews`;
                }
                // Directions link
                if (place.geometry && place.geometry.location && place.place_id) {
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(park.name + ', Seattle, WA')}&destination_place_id=${place.place_id}`;
                    directionsBtn.style.display = 'block';
                    directionsBtn.onclick = () => {
                        window.open(directionsUrl, '_blank');
                    };
                }

                // Reviews link
                const reviewsBtn = document.getElementById('dashboard-reviews');
                if (reviewsBtn) {
                    reviewsBtn.style.display = 'block';
                    reviewsBtn.onclick = () => {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(park.name + ' Seattle WA')}`, '_blank');
                    };
                }
            }
        });
    }
}   

// Helper Function: Show Search Dashboard (under search bar)
function showSearchDashboard(park) {
    // Use the same dashboard as the map marker popup
    document.getElementById('search-dashboard').style.display = 'none';
    showParkDashboard(park);
}