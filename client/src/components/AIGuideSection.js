import { useState } from 'react';
import { API_BASE_URL } from '../config';

const AIGuideSection = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setResponse('Please enter what you are looking for.');
      return;
    }

    setIsLoading(true);
    setResponse('Thinking...');

    try {
      const res = await fetch(`${API_BASE_URL}/park-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!res.ok) throw new Error('Server error');
      
      const data = await res.json();
      setResponse(data.response || 'No answer found.');
    } catch (err) {
      setResponse('Sorry, something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section 
      id="ai-section" 
      style={{
        margin: '48px auto',
        padding: '24px 16px',
        width: '100%',
        maxWidth: '800px',
        boxSizing: 'border-box'
      }}
    >
      <h2 style={{
        fontSize: '2em',
        color: '#388e3c',
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        Ask our Park Guide
      </h2>

      <p style={{
        fontSize: '1.2em',
        color: '#444',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        Describe specific features you're looking for and let our AI guide help you find the perfect Seattle park
      </p>

      <form onSubmit={handleSubmit}>
        <div className="ai-guide-box">
          <input 
            type="text" 
            className="ai-guide-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., I want a park with hiking trails and nice views..." 
          />
          <button 
            type="submit"
            className="ai-guide-btn"
            disabled={isLoading}
          >
            <span>Ask Guide</span>
            <span style={{ fontSize: '1em', marginLeft: '2px', marginRight: '-10px' }}>✨</span>
          </button>
        </div>
      </form>

      {response && (
        <div 
          className={`ai-guide-response ${isLoading ? 'blinking' : ''}`}
          dangerouslySetInnerHTML={{ __html: response }}
        />
      )}
    </section>
  );
};

export default AIGuideSection;
