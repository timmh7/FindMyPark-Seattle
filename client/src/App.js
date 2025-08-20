import { useEffect } from 'react';
import IntroScreen from './components/IntroScreen';
import AIGuideSection from './components/AIGuideSection';
import MapSection from './components/MapSection';
import { API_BASE_URL } from './config';
import './App.css';

// Import Lenis for smooth scrolling
const loadLenis = () => {
  return new Promise((resolve) => {
    if (window.Lenis) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lenis@1.3.8/dist/lenis.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

function App() {
  useEffect(() => {
    // Load Google Maps API
    fetch(`${API_BASE_URL}/api/google-maps-key`)
        .then(res => res.json())
        .then(data => {
        if (data.key) {
            // Check if the script is already in the DOM
            if (!document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
            }
        } else {
            console.error('Google Maps API key not found.');
        }
        });

    // Initialize Lenis smooth scroll
    loadLenis().then(() => {
      const lenis = new window.Lenis({
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
      lenis.scrollTo(0, { immediate: true });
    });

    // Google Analytics
    const gtag = document.createElement('script');
    gtag.async = true;
    gtag.src = 'https://www.googletagmanager.com/gtag/js?id=G-MNFQL5HTZY';
    document.head.appendChild(gtag);

    window.dataLayer = window.dataLayer || [];
    function gtagFunc(){window.dataLayer.push(arguments);}
    window.gtag = gtagFunc;
    gtagFunc('js', new Date());
    gtagFunc('config', 'G-MNFQL5HTZY');
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="App">
      <IntroScreen onScrollToAI={() => scrollToSection('ai-section')} onScrollToMap={() => scrollToSection('map-section')} />
      <AIGuideSection />
      <MapSection />
    </div>
  );
}

export default App;
