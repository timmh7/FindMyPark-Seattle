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
    'Adult Fitness Equipment',
    'Art in the Park',
    'Baseball/Softball Fields',
    'Basketball Courts',
    'Dog Off Leash Areas',
    'Drinking fountains',
    'Fire Pits',
    'Fishing piers',
    'Football Fields',
    'Gardens',
    'Grills',
    'Hand Carry Boat Launches',
    'Motorized Boat Launches',
    'Picnic Sites',
    'Play Area',
    'Restrooms',
    'Skate Park',
    'Soccer Fields',
    'Spray Parks',
    'Swimming Beaches',
    'Tennis Courts',
    'Track Fields',
    'Trails',
    'Views',
    'Volleyball Courts',
    'Wading Pools'
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
    filterAndRenderParks();
    features.forEach(f => {
        const el = document.getElementById('filter-' + f);
        if (el) el.addEventListener('change', filterAndRenderParks);
    });

    // Intro screen button logic
    const btnSearch = document.getElementById('btn-search');
    const btnMap = document.getElementById('btn-map');
    if (btnSearch) {
        btnSearch.addEventListener('click', function() {
            const searchbar = document.getElementById('searchbar-container');
            if (searchbar) {
                searchbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    if (btnMap) {
        btnMap.addEventListener('click', function() {
            const mapDiv = document.getElementById('map');
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
    // Only list available features
    let availableFeatures = features.filter(f => park[f] && park[f].toLowerCase() === 'yes');
    let featuresHtml = '<h3>Available Features</h3>';
    if (availableFeatures.length > 0) {
        featuresHtml += '<ul style="columns:2;">';
        availableFeatures.forEach(f => {
            featuresHtml += `<li>${f}</li>`;
        });
        featuresHtml += '</ul>';
    } else {
        featuresHtml += '<div style="color:#888;">No features listed for this park.</div>';
    }
    document.getElementById('dashboard-features').innerHTML = featuresHtml;

    // Google Places API: Show photo, rating, and directions link
    let chartsHtml = '<h3>Google Info</h3>';
    if (window.google && window.google.maps) {
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const request = {
            query: park.name + ', Seattle, WA',
            fields: ['name', 'photos', 'rating', 'user_ratings_total', 'geometry', 'place_id']
        };
        service.findPlaceFromQuery(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                const place = results[0];
                // Photo
                if (place.photos && place.photos.length > 0) {
                    const photoUrl = place.photos[0].getUrl({maxWidth: 300, maxHeight: 200});
                    chartsHtml += `<img src="${photoUrl}" alt="${park.name} photo" class="dashboard-photo">`;
                }
                // Rating
                if (place.rating) {
                    chartsHtml += `<div class="dashboard-rating">Rating: <span class="dashboard-stars">${'★'.repeat(Math.round(place.rating))}</span> (${place.rating} / 5, ${place.user_ratings_total} reviews)</div>`;
                }
                // Directions link
                if (place.geometry && place.geometry.location && place.place_id) {
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(park.name + ', Seattle, WA')}&destination_place_id=${place.place_id}`;
                    chartsHtml += `<a href="${directionsUrl}" target="_blank" class="dashboard-directions">Get Directions</a>`;
                }
                document.getElementById('dashboard-charts').innerHTML = chartsHtml;
            } else {
                document.getElementById('dashboard-charts').innerHTML = chartsHtml + '<div style="color:#888;">No Google info found for this park.</div>';
            }
        });
    } else {
        document.getElementById('dashboard-charts').innerHTML = chartsHtml + '<div style="color:#888;">Google Maps API not loaded.</div>';
    }
}

// Helper Function: Show Search Dashboard (under search bar)
function showSearchDashboard(park) {
    const dashboard = document.getElementById('search-dashboard');
    dashboard.style.display = 'block';
    let html = `<h2>${park.name}</h2>`;
    // Only list available features
    let availableFeatures = features.filter(f => park[f] && park[f].toLowerCase() === 'yes');
    html += '<h3>Available Features</h3>';
    if (availableFeatures.length > 0) {
        html += '<ul style="columns:2;">';
        availableFeatures.forEach(f => {
            html += `<li>${f}</li>`;
        });
        html += '</ul>';
    } else {
        html += '<div style="color:#888;">No features listed for this park.</div>';
    }

    // Google Places API: Show photo, rating, and directions link
    let chartsHtml = '<h3>Google Info</h3>';
    if (window.google && window.google.maps) {
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const request = {
            query: park.name + ', Seattle, WA',
            fields: ['name', 'photos', 'rating', 'user_ratings_total', 'geometry', 'place_id']
        };
        service.findPlaceFromQuery(request, function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                const place = results[0];
                // Photo
                if (place.photos && place.photos.length > 0) {
                    const photoUrl = place.photos[0].getUrl({maxWidth: 300, maxHeight: 200});
                    chartsHtml += `<img src="${photoUrl}" alt="${park.name} photo" class="dashboard-photo">`;
                }
                // Rating
                if (place.rating) {
                    chartsHtml += `<div class="dashboard-rating">Rating: <span class="dashboard-stars">${'★'.repeat(Math.round(place.rating))}</span> (${place.rating} / 5, ${place.user_ratings_total} reviews)</div>`;
                }
                // Directions link
                if (place.geometry && place.geometry.location && place.place_id) {
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(park.name + ', Seattle, WA')}&destination_place_id=${place.place_id}`;
                    chartsHtml += `<a href="${directionsUrl}" target="_blank" class="dashboard-directions">Get Directions</a>`;
                }
                dashboard.innerHTML = html + chartsHtml;
            } else {
                dashboard.innerHTML = html + chartsHtml + '<div style="color:#888;">No Google info found for this park.</div>';
            }
        });
    } else {
        dashboard.innerHTML = html + chartsHtml + '<div style="color:#888;">Google Maps API not loaded.</div>';
    }
}