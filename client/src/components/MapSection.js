import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import * as d3 from 'd3';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapSection = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [allParks, setAllParks] = useState([]);
  const [parkMarkers, setParkMarkers] = useState([]);
  const [selectedPark, setSelectedPark] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [filters, setFilters] = useState({});
  const [googleApiKey, setGoogleApiKey] = useState('');

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

  const featureDisplayNames = {
    'adult_fitness_equipment': 'Adult Fitness Equipment 🏋️',
    'art_in_the_park': 'Art in the Park 🎨',
    'baseball/softball_fields': 'Baseball/Softball Fields ⚾',
    'basketball_courts': 'Basketball Courts 🏀',
    'dog_off_leash_areas': 'Dog Off Leash Areas 🐕',
    'drinking_fountains': 'Drinking fountains 💧',
    'fire_pits': 'Fire Pits 🔥',
    'fishing_piers': 'Fishing piers 🎣',
    'football_fields': 'Football Fields 🏈',
    'gardens': 'Gardens 🌸',
    'grills': 'Grills 🍔',
    'hand_carry_boat_launches': 'Hand Carry Boat Launches 🛶',
    'motorized_boat_launches': 'Motorized Boat Launches 🚤',
    'picnic_sites': 'Picnic Sites 🧺',
    'play_area': 'Play Area 🛝',
    'restrooms': 'Restrooms 🚻',
    'skate_park': 'Skate Park 🛹',
    'soccer_fields': 'Soccer Fields ⚽',
    'spray_parks': 'Spray Parks 💦',
    'swimming_beaches': 'Swimming Beaches 🏖️',
    'tennis_courts': 'Tennis Courts 🎾',
    'track_fields': 'Track Fields 🏃‍♂️',
    'trails': 'Trails 🚶‍♂️',
    'views': 'Views 🌄',
    'volleyball_courts': 'Volleyball Courts 🏐',
    'wading_pools': 'Wading Pools 🩱'
  };

  // Fetch Google Maps API key
  useEffect(() => {
    fetch('/api/google-maps-key')
      .then(res => res.json())
      .then(data => {
        if (data.key) {
          setGoogleApiKey(data.key);
        }
      })
      .catch(err => console.error('Failed to fetch Google Maps API key:', err));
  }, []);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([47.6062, -122.3321], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 20
      }).addTo(mapInstance.current);

      // Load and style Seattle city boundary
      d3.json("/static/city-limits.geojson").then(boundaryData => {
        L.geoJSON(boundaryData, {
          style: {
            color: "#66bb6a",
            weight: 1,
            fillColor: "#c8e6c9",
            fillOpacity: 0.2
          },
          interactive: false
        }).addTo(mapInstance.current);
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Load parks data
  useEffect(() => {
    const loadParks = async () => {
      const data = await d3.csv("/static/parks-features.csv");
      setAllParks(data);
      filterAndRenderParks(data, {});
    };
    loadParks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearMarkers = () => {
    parkMarkers.forEach(marker => marker.remove());
    setParkMarkers([]);
  };

  const filterAndRenderParks = (parks = allParks, currentFilters = filters) => {
    if (!mapInstance.current) return;

    clearMarkers();
    const activeFilters = Object.entries(currentFilters).filter(([_, value]) => value);
    
    let filtered = parks;
    if (activeFilters.length > 0) {
      filtered = parks.filter(park => {
        return activeFilters.every(([feature, _]) => {
          return park[feature] && park[feature].toLowerCase() === 'yes';
        });
      });
    }

    const newMarkers = [];
    filtered.forEach(park => {
      const lat = +park.lat;
      const lng = +park.lng;
      const marker = L.circleMarker([lat, lng], {
        radius: 4,
        fillColor: "green",
        color: "#2e7d32",
        weight: 1,
        opacity: 0.75,
        fillOpacity: 0.75
      }).addTo(mapInstance.current);
      
      marker.bindPopup(`<strong>${park.name}</strong>`);
      marker.on('popupopen', () => {
        showParkDashboard(park);
      });
      
      newMarkers.push(marker);
    });
    
    setParkMarkers(newMarkers);
  };

  const handleFilterChange = (feature, checked) => {
    const newFilters = { ...filters, [feature]: checked };
    setFilters(newFilters);
    filterAndRenderParks(allParks, newFilters);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setShowSuggestions(false);
      setSearchError('');
      return;
    }

    const matches = allParks.filter(p => 
      p.name && p.name.toLowerCase().includes(query.toLowerCase())
    );

    if (matches.length === 0) {
      setSearchError('No parks found.');
      setShowSuggestions(false);
      return;
    }

    setSearchError('');
    setSearchSuggestions(matches.slice(0, 8));
    setShowSuggestions(true);
  };

  const selectPark = (park) => {
    setSelectedPark(park);
    setSearchQuery(park.name);
    setShowSuggestions(false);
    showParkDashboard(park);
  };

  const showParkDashboard = (park) => {
    setSelectedPark(park);
    
    // Load Google Places data for the park
    if (window.google && window.google.maps) {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        query: park.name + ', Seattle, WA',
        fields: ['name', 'photos', 'rating', 'user_ratings_total', 'geometry', 'place_id']
      };
      
      service.findPlaceFromQuery(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const place = results[0];
          setSelectedPark(prev => ({
            ...prev,
            googleData: place
          }));
        }
      });
    }
  };

  const getStreetViewUrl = (park) => {
    if (!googleApiKey) return null;
    
    // Try to use coordinates if available, otherwise use park name + Seattle
    let location;
    if (park.lat && park.lon) {
      location = `${park.lat},${park.lon}`;
    } else if (park.latitude && park.longitude) {
      location = `${park.latitude},${park.longitude}`;
    } else {
      location = encodeURIComponent(`${park.name}, Seattle, WA`);
    }
    
    return `https://maps.googleapis.com/maps/api/streetview?size=340x220&location=${location}&fov=90&heading=0&pitch=0&key=${googleApiKey}`;
  };

  const getDirections = (park) => {
    if (park.googleData && park.googleData.place_id) {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(park.name + ', Seattle, WA')}&destination_place_id=${park.googleData.place_id}`;
      window.open(directionsUrl, '_blank');
    }
  };

  const getReviews = (park) => {
    const reviewsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(park.name + ' Seattle WA')}`;
    window.open(reviewsUrl, '_blank');
  };

  const getParkFeatures = (park) => {
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

    return features.filter(f => park[f] && park[f].toLowerCase() === 'yes').map(f => {
      const readable = featureNames[f] || f;
      return {
        name: readable,
        emoji: featureEmojis[readable] || ''
      };
    });
  };

  return (
    <section 
      id="map-section" 
      style={{
        background: '#f5f5f7',
        padding: '48px 0',
        marginTop: '32px'
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        <h2 style={{
          fontSize: '2em',
          color: '#388e3c',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Find & Explore Parks
        </h2>
        
        <p style={{
          fontSize: '1.2em',
          color: '#444',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Search to learn more about your favorite park, explore outdoor spaces on our interactive map
        </p>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '24px' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '15%',
            fontSize: '1.2em'
          }}>
            🔍
          </span>
          
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Want to know more about a specific park? Search for a park here..."
            style={{
              width: '100%',
              maxWidth: '100vw',
              boxSizing: 'border-box',
              padding: '12px 16px 12px 40px',
              fontSize: '1em',
              borderRadius: '8px',
              border: '2px solid #999'
            }}
          />

          {searchError && (
            <span style={{ color: 'red', marginLeft: '12px' }}>{searchError}</span>
          )}

          {showSuggestions && (
            <ul style={{
              position: 'absolute',
              left: 0,
              top: '48px',
              width: '100%',
              background: '#fff',
              border: '1px solid #ccc',
              borderRadius: '0 0 8px 8px',
              zIndex: 10,
              listStyle: 'none',
              margin: 0,
              padding: 0
            }}>
              {searchSuggestions.map((park, index) => (
                <li
                  key={index}
                  onClick={() => selectPark(park)}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    borderBottom: index < searchSuggestions.length - 1 ? '1px solid #eee' : 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f0f0f0'}
                  onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                  {park.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Filters */}
        <div style={{
          marginBottom: '8px',
          textAlign: 'left',
          fontSize: '1.08em',
          color: '#444',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img 
            src="/static/img-assets/filter.png" 
            alt="Filter icon" 
            style={{
              height: '1.2em',
              width: 'auto',
              verticalAlign: 'middle',
              marginRight: '4px'
            }} 
          />
          Filter by features:
        </div>

        <div style={{
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {features.map(feature => (
            <label 
              key={feature}
              className="filter-label"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#e8f5e9',
                borderRadius: '20px',
                padding: '6px 18px',
                fontSize: '1em',
                color: '#388e3c',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(56,142,60,0.06)'
              }}
            >
              <input 
                type="checkbox" 
                checked={filters[feature] || false}
                onChange={(e) => handleFilterChange(feature, e.target.checked)}
                style={{
                  marginRight: '8px',
                  accentColor: '#388e3c'
                }} 
              />
              {featureDisplayNames[feature]}
            </label>
          ))}
        </div>

        {/* Map and Dashboard */}
        <div className="map-layout">
          <div className="map-wrapper" style={{ width: '600px', height: '800px' }}>
            <div ref={mapRef} id="map" style={{ width: '100%', height: '100%' }} />
          </div>

          <div className="dashboard-column">
            {!selectedPark ? (
              <div className="dashboard-empty-message">No park currently selected</div>
            ) : (
              <div className="park-dashboard visible">
                <div className="dashboard-header">
                  <h2 className="dashboard-park-name">{selectedPark.name}</h2>
                  <div className="dashboard-rating-wrapper">
                    <div className="dashboard-rating">
                      <span className="star-emoji">⭐</span>
                      <span className="dashboard-park-rating">
                        {selectedPark.googleData?.rating?.toFixed(1) || ''}
                      </span>
                    </div>
                    <span className="dashboard-park-reviews">
                      {selectedPark.googleData?.user_ratings_total ? 
                        `${selectedPark.googleData.user_ratings_total} reviews` : ''}
                    </span>
                  </div>
                </div>

                <div className="dashboard-features">
                  {getParkFeatures(selectedPark).map((feature, index) => (
                    <span key={index} className="feature-box">
                      <span className="feature-emoji">{feature.emoji}</span>
                      {feature.name}
                    </span>
                  ))}
                </div>

                {(selectedPark.googleData?.photos || googleApiKey) && (
                  <img 
                    className="dashboard-park-image"
                    src={
                      selectedPark.googleData?.photos 
                        ? selectedPark.googleData.photos[0].getUrl({maxWidth: 340, maxHeight: 220})
                        : getStreetViewUrl(selectedPark)
                    }
                    alt={
                      selectedPark.googleData?.photos 
                        ? "Park view" 
                        : "Street view of park area"
                    }
                  />
                )}

                <button 
                  className="dashboard-reviews"
                  onClick={() => getReviews(selectedPark)}
                >
                  Read Reviews
                </button>

                <button 
                  className="dashboard-directions"
                  onClick={() => getDirections(selectedPark)}
                >
                  Directions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
