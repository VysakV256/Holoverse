import React, { useState, useEffect } from 'react';
import { useVoice } from '../hooks/useVoice';
import { generateAgentResponse } from '../utils/llm';
import { Mic, MicOff, Send, Settings, Key } from 'lucide-react';

export function VoiceChat({ setBackgroundShader, character }) {
  const { isRecording, startRecording, stopRecording, transcript, speakText, isSpeaking } = useVoice();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  // When speech gives us a transcript, update the input
  useEffect(() => {
    if (transcript && isRecording) {
      setInputText(transcript);
    }
  }, [transcript, isRecording]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    // Add user message to log
    const userMsg = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    setInputText('');

    try {
      if (!apiKey) {
        throw new Error('Please configure your Gemini API Key in settings.');
      }

      // Generate response from agent
      const res = await generateAgentResponse(userMsg.text, apiKey);
      
      const agentMsg = { role: 'agent', text: res.text };
      setMessages(prev => [...prev, agentMsg]);
      
      // Update background shader!
      if (res.shader) {
        setBackgroundShader(res.shader);
      }
      
      // Speak the response natively
      speakText(res.text);
      
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'system', text: err.message, isError: true }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const saveApiKey = (e) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  return (
    <div className="voice-chat-container">
      {/* Settings Button */}
      <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
        <Settings size={20} />
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="glass-panel settings-panel">
          <h3>System Configuration</h3>
          <div className="input-group">
            <Key size={16} />
            <input 
              type="password" 
              placeholder="Gemini API Key" 
              value={apiKey} 
              onChange={saveApiKey}
            />
          </div>
          <p className="hint">Your key is saved locally.</p>
        </div>
      )}

      {/* Messages View */}
      <div className="messages-log">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.role === 'agent' && <div className="avatar">{character.name.charAt(0)}</div>}
            <div className={`bubble ${m.isError ? 'error' : ''}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="message agent">
            <div className="avatar pulse">{character.name.charAt(0)}</div>
            <div className="bubble typing">... processing thought ...</div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="glass-panel input-area">
        <button 
          className={`mic-btn ${isRecording ? 'recording' : ''}`}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
        >
          {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <input 
          type="text" 
          placeholder="Speak or type to communicate..." 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isRecording}
        />
        
        <button className="send-btn" onClick={handleSend} disabled={isProcessing || !inputText.trim()}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
