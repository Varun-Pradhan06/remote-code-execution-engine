import { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

function App() {
  const [code, setCode] = useState(
    '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}'
  );
  const [output, setOutput] = useState('Run your code to see the output here...');
  const [complexity, setComplexity] = useState('');
  const [executionTime, setExecutionTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error

  const handleRunCode = async () => {
    setIsLoading(true);
    setStatus('idle');
    setOutput('Compiling and running in secure container...');
    setComplexity('');
    setExecutionTime(null);

    try {
      // 1. Send the code to our backend
      const response = await axios.post('http://localhost:3000/api/execute', {
        code: code,
        language: 'cpp',
        userId: '1fc2f125-8150-47c0-98c8-01245c81f095' // <-- PUT YOUR UUID HERE
      });

      // 2. Handle the successful response
      setOutput(response.data.output);
      setComplexity(response.data.predicted_complexity);
      setExecutionTime(response.data.execution_time_ms);
      setStatus('success');
      
    } catch (error) {
      // 3. Handle errors gracefully
      setOutput(error.response?.data?.error || "Connection refused. Is the backend running?");
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0d1117', color: '#c9d1d9', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#161b22', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d' }}>
        <h2 style={{ margin: 0, color: '#58a6ff', fontSize: '20px' }}>⚡ Big-O Sandbox</h2>
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
      </header>

      {/* MAIN SPLIT PANE */}
      <div style={{ display: 'flex', flex: 1, padding: '20px', gap: '20px' }}>
        
        {/* LEFT: EDITOR */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '8px', overflow: 'hidden', border: '1px solid #30363d' }}>
          <div style={{ backgroundColor: '#161b22', padding: '10px 15px', borderBottom: '1px solid #30363d', fontSize: '14px', fontWeight: 'bold' }}>
            main.cpp
          </div>
          <Editor
            height="100%"
            defaultLanguage="cpp"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value)}
            options={{ fontSize: 15, minimap: { enabled: false }, padding: { top: 15 } }}
          />
        </div>

        {/* RIGHT: OUTPUT & ML PREDICTION */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TERMINAL */}
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

          {/* ML INSIGHTS PANEL */}
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