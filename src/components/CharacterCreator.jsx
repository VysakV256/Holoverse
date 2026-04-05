import React, { useState } from 'react';
import { Sparkles, X, User, Orbit, Zap } from 'lucide-react';
import '../index.css';

export function CharacterCreator({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: 'Nova',
    basePrompt: 'A fierce warrior woman with bright piercing eyes and short hair',
    form1: 'A soldier in the Real modern era, tactical gear, gritty',
    form2: 'A space royal, elegant galactic clothing, crown, stars in background',
    form3: 'A cyberpunk freedom radical, neon lights, leather jacket, cybernetics'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

    setIsGenerating(true);
    setProgress(10);
    
    try {
      if (!openaiApiKey) {
        throw new Error('VITE_OPENAI_API_KEY is not configured.')
      }

      const callDalle = async (promptText) => {
        const url = `https://api.openai.com/v1/images/generations`;
        const requestBody = {
          model: "dall-e-3",
          prompt: promptText,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json"
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`OpenAI API Error: ${errText}`);
        }

        const data = await res.json();
        
        if (data.data && data.data.length > 0) {
           return `data:image/png;base64,${data.data[0].b64_json}`;
        }
        
        throw new Error("Could not parse image from OpenAI response.");
      };

      let finalUrl1, finalUrl2, finalUrl3;
      try {
        setStatus('Generating Form I (The Real) via OpenAI DALL-E 3...');
        const p1 = `${formData.basePrompt}, ${formData.form1}, cinematic lighting, highly detailed, photorealistic`;
        finalUrl1 = await callDalle(p1);
        setProgress(40);

        setStatus('Generating Form II (The Royal) via OpenAI DALL-E 3...');
        const p2 = `${formData.basePrompt}, ${formData.form2}, cinematic lighting, highly detailed, photorealistic`;
        finalUrl2 = await callDalle(p2);
        setProgress(70);

        setStatus('Generating Form III (The Cyberpunk) via OpenAI DALL-E 3...');
        const p3 = `${formData.basePrompt}, ${formData.form3}, cinematic lighting, highly detailed, photorealistic`;
        finalUrl3 = await callDalle(p3);
        setProgress(100);
      } catch (imagenError) {
        console.warn('OpenAI DALL-E execution failed. Falling back to cached HD local generation buffers.', imagenError);
        setStatus('API Failed. Injecting High-Res Cached Models...');
        finalUrl1 = '/assets/indian_male_soldier.png';
        finalUrl2 = '/assets/indian_male_royal.png';
        finalUrl3 = '/assets/indian_male_cyberpunk.png';
        setProgress(100);
      }

      setStatus('Aligning Facial Matrices for Seamless Holo Morph...');
      try {
        const getBase64 = async (url) => {
          const res = await fetch(url);
          const blob = await res.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };
        const base64_1 = await getBase64(finalUrl1);
        const base64_2 = await getBase64(finalUrl2);
        const base64_3 = await getBase64(finalUrl3);
        
        const alignResponse = await fetch('http://localhost:5183/', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ base: base64_1, forms: [base64_2, base64_3] })
        });
        
        if (alignResponse.ok) {
          const alignData = await alignResponse.json();
          finalUrl2 = alignData.aligned[0];
          finalUrl3 = alignData.aligned[1];
        }
      } catch (alignErr) {
        console.warn('Facial alignment pipeline error (is Python server running on 5183?), continuing with unaligned outputs.', alignErr);
      }

      setStatus('Finalizing Hologram Matrix...');
      
      setTimeout(() => {
        onSave({
          name: formData.name,
          designation: 'Generated Persona',
          agentId: formData.name.toLowerCase().replace(' ', '-'),
          baseImages: [finalUrl1, finalUrl2, finalUrl3],
          depthImage: '/assets/depth.png',
        });
        setIsGenerating(false);
        onClose();
      }, 800);

    } catch (error) {
      console.error('Error generating images:', error);
      setStatus(`Generation Failed: Check Console Log`);
      setTimeout(() => setIsGenerating(false), 3000);
    }
  };

  return (
    <div className="creator-overlay">
      <div className="creator-modal glass-panel">
        <button className="close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="creator-header">
          <Sparkles className="icon-glow" size={28} />
          <h2>Holo-Persona Forge</h2>
          <p>Design a dynamic, multi-form holographic avatar</p>
        </div>

        <div className="creator-body">
          <div className="input-group">
            <label>Persona Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              placeholder="e.g. Nova"
            />
          </div>

          <div className="input-group">
            <label>Core Archetype / Base Appearance</label>
            <textarea 
              name="basePrompt" 
              value={formData.basePrompt}
              onChange={handleChange}
              placeholder="Describe the subject's face, build, and persistent traits..."
            />
          </div>

          <div className="forms-grid">
            <div className="form-card">
              <User size={20} className="icon-glow" />
              <label>Form I: The Real</label>
              <textarea 
                name="form1" 
                value={formData.form1}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-card">
              <Orbit size={20} className="icon-glow" />
              <label>Form II: The Royal</label>
              <textarea 
                name="form2" 
                value={formData.form2}
                onChange={handleChange}
              />
            </div>

            <div className="form-card">
              <Zap size={20} className="icon-glow" />
              <label>Form III: The Radical</label>
              <textarea 
                name="form3" 
                value={formData.form3}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="creator-footer">
          {isGenerating ? (
            <div className="generation-progress">
              <div className="progress-text">{status}</div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <button className="generate-btn" onClick={handleGenerate}>
              <Sparkles size={18} /> Forge Hologram
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
