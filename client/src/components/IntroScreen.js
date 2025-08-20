const IntroScreen = ({ onScrollToAI, onScrollToMap }) => {
  return (
    <div 
      id="intro-screen" 
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#e8f5e9',
        position: 'relative',
        overflow: 'hidden',
        padding: '16px'
      }}
    >
      {/* Decorative leaves/trees */}
      <img 
        src="/img-assets/tree.png" 
        className="intro-decor" 
        style={{ top: '8%', left: '6%' }} 
        alt="Leaf decor" 
      />
      <img 
        src="/img-assets/leaf.png" 
        className="intro-decor" 
        style={{ top: '18%', right: '8%' }} 
        alt="Tree decor" 
      />
      <img 
        src="/img-assets/leaf.png" 
        className="intro-decor" 
        style={{ bottom: '12%', left: '12%', transform: 'rotate(-18deg)' }} 
        alt="Leaf decor" 
      />
      <img 
        src="/img-assets/tree.png" 
        className="intro-decor" 
        style={{ bottom: '10%', right: '10%', transform: 'scale(0.9) rotate(8deg)' }} 
        alt="Tree decor" 
      />
      <img 
        src="/img-assets/leaf.png" 
        className="intro-decor" 
        style={{ top: '56%', right: '26%' }} 
        alt="Tree decor" 
      />
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '900px'
      }}>
        <h1 style={{
          fontSize: '3.5em',
          marginBottom: '12px',
          color: '#388e3c'
        }}>
          Seattle Greenspaces Explorer
        </h1>
        
        <div style={{
          fontSize: '1.3em',
          color: '#444',
          marginBottom: '32px',
          textAlign: 'center',
          maxWidth: '600px',
          lineHeight: '1.35'
        }}>
          A project to discover the hidden gems and beloved parks that make Seattle one of America's greenest cities
        </div>
        
        <div style={{
          display: 'flex',
          gap: '32px',
          marginBottom: '40px'
        }}>
          <button 
            className="btn-AI"
            onClick={onScrollToAI}
            style={{
              padding: '16px 32px',
              fontSize: '1.2em',
              background: '#66bb6a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            AI Park Guide
          </button>
          <button 
            className="btn-explore"
            onClick={onScrollToMap}
            style={{
              padding: '16px 32px',
              fontSize: '1.2em',
              background: '#388e3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Explore Parks
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          marginTop: '24px',
          gap: '32px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '220px',
            minHeight: '120px'
          }}>
            <span className="emoji-circle" style={{ 
              fontSize: '2em', 
              color: '#388e3c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              width: '60px',
              marginBottom: '8px'
            }}>
              🌳
            </span>
            <span style={{
              fontSize: '1.3em',
              color: '#222',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              400+ Parks
            </span>
            <span style={{
              fontSize: '1.1em',
              color: '#444',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>
              From neighborhood gems to vast wilderness areas
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '220px',
            minHeight: '120px'
          }}>
            <span className="emoji-circle" style={{ 
              fontSize: '2em', 
              color: '#388e3c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              width: '60px',
              marginBottom: '8px'
            }}>
              🌿
            </span>
            <span style={{
              fontSize: '1.3em',
              color: '#222',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Natural Beauty
            </span>
            <span style={{
              fontSize: '1.1em',
              color: '#444',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>
              Discover waterfronts, gardens, and scenic trails
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '220px',
            minHeight: '120px'
          }}>
            <span className="emoji-circle" style={{ 
              fontSize: '2em', 
              color: '#444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              width: '60px',
              marginBottom: '8px'
            }}>
              👩‍🦽
            </span>
            <span style={{
              fontSize: '1.3em',
              color: '#222',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Easy Access
            </span>
            <span style={{
              fontSize: '1.1em',
              color: '#444',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>
              Find parks near you with detailed directions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
