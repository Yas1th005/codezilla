// src/ScriptGenerator.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

// Types
interface ScriptResponse {
  result: string;
  error?: string;
}

// Generator Component
const Generator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'ScriptGeneratorlication/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const data: ScriptResponse = await response.json();
      setGeneratedScript(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClone = () => {
    if (generatedScript) {
      localStorage.setItem('clonedScript', generatedScript);
      navigate('/cloned');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your script prompt here..."
          rows={5}
          className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 text-gray-700 resize-y"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate Script'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {generatedScript && (
        <div className="border border-gray-200 rounded-lg shadow-md p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Generated Script</h2>
          <pre className="bg-white p-4 rounded-md border border-gray-200 overflow-auto max-h-96 text-gray-700 text-sm font-mono">
            {generatedScript}
          </pre>
          <button 
            onClick={handleClone} 
            className="mt-4 px-6 py-3 bg-green-600 text-white font-medium rounded-lg transition duration-200 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Clone
          </button>
        </div>
      )}
    </div>
  );
};

// ClonedScript Component
const ClonedScript: React.FC = () => {
  const [clonedContent, setClonedContent] = useState<string>('');

  useEffect(() => {
    const script = localStorage.getItem('clonedScript');
    if (script) {
      setClonedContent(script);
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Cloned Script</h2>
      {clonedContent ? (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md mb-6">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 overflow-auto max-h-screen">
            {clonedContent}
          </pre>
        </div>
      ) : (
        <p className="text-gray-600">No cloned script found.</p>
      )}
      <Link 
        to="/" 
        className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Back to Generator
      </Link>
    </div>
  );
};

// Main ScriptGenerator Component
const ScriptGenerator: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white p-6 shadow-md">
          <h1 className="text-2xl font-bold text-center">Gemini Script Generator</h1>
        </header>
        
        <main className="py-8">
          <Routes>
            <Route path="/" element={<Generator />} />
            <Route path="/cloned" element={<ClonedScript />} />
          </Routes>
        </main>
        
        <footer className="mt-12 py-6 text-center text-gray-500 border-t border-gray-200">
          <p>Created with React, TypeScript, and Flask</p>
        </footer>
      </div>
    </Router>
  );
};

export default ScriptGenerator;