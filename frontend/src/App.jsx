import { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

// Boilerplate code for when the user switches languages
const BOILERPLATES = {
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++!" << endl;\n    return 0;\n}',
  python: 'def main():\n    print("Hello from Python!")\n\nif __name__ == "__main__":\n    main()'
};

function App() {
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(BOILERPLATES['cpp']);
  const [output, setOutput] = useState('Run your code to see the output here...');
  const [complexity, setComplexity] = useState('');
  const [executionTime, setExecutionTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle');

  // Handle switching languages
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(BOILERPLATES[newLang]);
  };

  const handleRunCode = async () => {
    setIsLoading(true);
    setStatus('idle');
    setOutput('Starting secure execution container...');
    setComplexity('');
    setExecutionTime(null);

    try {
      const response = await axios.post('https://declare-blessed-episode-base.trycloudflare.com', {
        code: code,
        language: language,
        userId: '1fc2f125-8150-47c0-98c8-01245c81f095' // <-- KEEP YOUR UUID HERE
      });

      setOutput(response.data.output);
      setComplexity(response.data.predicted_complexity);
      setExecutionTime(response.data.execution_time_ms);
      setStatus('success');
      
    } catch (error) {
      setOutput(error.response?.data?.error || "Connection refused. Is the backend running?");
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0d1117', color: '#c9d1d9', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      
      <header style={{ backgroundColor: '#161b22', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d' }}>
        <h2 style={{ margin: 0, color: '#58a6ff', fontSize: '20px' }}>⚡ Big-O Sandbox</h2>
        
        {/* NEW: Controls Wrapper */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select 
            value={language} 
            onChange={handleLanguageChange}
            style={{ padding: '8px 12px', backgroundColor: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '6px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="cpp">C++ (GCC)</option>
            <option value="python">Python 3.10</option>
          </select>

          <button 
            onClick={handleRunCode} 
            disabled={isLoading}
            style={{ 
              backgroundColor: isLoading ? '#23863680' : '#238636', 
              color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '6px', 
              fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', transition: '0.2s' 
            }}
          >
            {isLoading ? 'Running ⏳' : '▶ Run Code'}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, padding: '20px', gap: '20px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '8px', overflow: 'hidden', border: '1px solid #30363d' }}>
          <div style={{ backgroundColor: '#161b22', padding: '10px 15px', borderBottom: '1px solid #30363d', fontSize: '14px', fontWeight: 'bold' }}>
            {language === 'cpp' ? 'main.cpp' : 'main.py'}
          </div>
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value)}
            options={{ fontSize: 15, minimap: { enabled: false }, padding: { top: 15 } }}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ flex: 1, backgroundColor: '#010409', borderRadius: '8px', border: '1px solid #30363d', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#161b22', padding: '10px 15px', borderBottom: '1px solid #30363d', fontSize: '14px', fontWeight: 'bold' }}>
              Terminal Console
            </div>
            <pre style={{ 
                margin: 0, padding: '20px', color: status === 'error' ? '#ff7b72' : '#3fb950', 
                fontSize: '14px', whiteSpace: 'pre-wrap', flex: 1, overflowY: 'auto', fontFamily: 'monospace' 
              }}>
              {output}
            </pre>
          </div>

          <div style={{ backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #30363d', padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>🤖 Analysis Engine</h3>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1, backgroundColor: '#0d1117', padding: '15px', borderRadius: '6px', border: '1px solid #30363d' }}>
                <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '5px' }}>Time Complexity</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#58a6ff' }}>
                  {complexity || '—'}
                </div>
              </div>

              <div style={{ flex: 1, backgroundColor: '#0d1117', padding: '15px', borderRadius: '6px', border: '1px solid #30363d' }}>
                <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '5px' }}>Execution Time</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d2a8ff' }}>
                  {executionTime ? `${executionTime} ms` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;