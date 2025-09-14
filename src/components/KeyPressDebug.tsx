"use client";

import { useState, useEffect, useCallback } from "react";

export function KeyPressDebug() {
  const [keyPressLog, setKeyPressLog] = useState<Array<{key: string, code: string, timestamp: string}>>([]);
  const [showDebug, setShowDebug] = useState(true);

  // Handle key press
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const keyPress = {
      key: event.key,
      code: event.code,
      timestamp: new Date().toISOString()
    };
    
    setKeyPressLog(prev => {
      const newLog = [...prev, keyPress];
      // Keep only the last 100 key presses
      return newLog.slice(-100);
    });
  }, []);

  // Set up key press listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded text-xs opacity-50 hover:opacity-100 z-50"
      >
        Show Debug
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 w-1/4 h-1/3 bg-black bg-opacity-80 text-green-400 p-4 overflow-auto font-mono text-xs z-50 rounded-lg border border-gray-600">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Key Press Debug</h3>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-white hover:text-red-400"
        >
          ×
        </button>
      </div>
      <div className="space-y-1">
        {keyPressLog.length === 0 ? (
          <div className="text-gray-500">No key presses recorded yet...</div>
        ) : (
          keyPressLog.map((kp, index) => (
            <div key={index} className="border-b border-gray-700 pb-1">
              <span className="text-yellow-300">{new Date(kp.timestamp).toLocaleTimeString()}</span>
              <span className="mx-2">→</span>
              <span className="text-blue-300">Key:</span> <span className="text-green-300">{kp.key}</span>
              <span className="mx-2">|</span>
              <span className="text-blue-300">Code:</span> <span className="text-purple-300">{kp.code}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
