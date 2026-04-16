import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { BackgroundShader } from './components/BackgroundShader';
import { Hologram } from './components/Hologram';
import { ModelDisplacementHologram } from './components/ModelDisplacementHologram';
import { SingleImageHologram } from './components/SingleImageHologram';
import { Gen3DMeshHologram } from './components/Gen3DMeshHologram';
import { SplatHologram } from './components/SplatHologram';
import { VoiceChat } from './components/VoiceChat';
import { CharacterCreator } from './components/CharacterCreator';
import { ExternalLink, Download, PlusCircle } from 'lucide-react';
import './index.css';

function App() {
  const [backgroundShader, setBackgroundShader] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const predefinedCharacters = [
    {
      name: 'Alpha Prime',
      designation: 'Topological Liberator',
      agentId: 'alpha-prime',
      hologramMode: 'SingleImage',
      baseImage: '/assets/alpha_prime_hologram_male.png?v=20260407b',
      depthImage: '/assets/depth.png',
      sourceFoundations: [
        'soul',
        'identity',
        'concordance',
        'goals',
        'rituals',
        'reflections',
        'hypertraversal philosophy',
      ],
      personaBrief: {
        archetype: 'cyberutopian topological liberator',
        mood: 'focused radiant sovereignty',
        foundationSummary: 'Alpha Prime now projects through a dedicated male cyberutopian hologram image derived from the Webase foundations brief rather than reusing Nova or the primary portrait image.',
        utopianSignal: 'infinite utopia for all always',
      },
    },
    {
      name: 'Nova',
      designation: 'Ethereal Guide',
      agentId: 'nova-alpha-prime',
      baseImages: ['/assets/base.png', '/assets/alt1.png', '/assets/alt2.png'],
      depthImage: '/assets/depth.png',
    },
    {
      name: 'Infinity',
      designation: 'Bio-Cyber Radical',
      agentId: 'infinity-freedom-radical',
      baseImages: ['/assets/indian_male_soldier.png', '/assets/indian_male_royal.png', '/assets/indian_male_cyberpunk.png'],
      depthImage: '/assets/depth.png',
    },
    {
      name: 'Aritra',
      designation: 'Generated Persona',
      agentId: 'aritra',
      baseImages: ['/assets/aritra_1.png', '/assets/aritra_2.png', '/assets/aritra_3.png'],
      depthImage: '/assets/depth.png',
    }
  ];

  const [characterList, setCharacterList] = useState(predefinedCharacters);
  const [character, setCharacter] = useState(predefinedCharacters[0]);

  const [holoMode, setHoloMode] = useState(predefinedCharacters[0].hologramMode || '2.5D'); // 'SingleImage', '2.5D', 'True3D', 'GenMesh', 'SplatLGM', 'SplatDream', 'SplatImage'

  const handleCharacterSelect = (nextCharacter) => {
    setCharacter(nextCharacter);
    setHoloMode(nextCharacter.hologramMode || '2.5D');
  };

  const handleSavePersona = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(character, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${character.name.toLowerCase()}_hologram.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="app-container">
      {/* 3D Background & Hologram Engine */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <Suspense fallback={null}>
            <scene>
              <BackgroundShader key={character.agentId + '-bg'} fragmentShaderStr={backgroundShader} />
              {holoMode === 'SingleImage' && character.baseImage && (
                <SingleImageHologram
                  imageUrl={character.baseImage}
                  depthUrl={character.depthImage}
                  primaryColor={character.personaBrief?.renderPalette?.[0] || '#13e5ff'}
                  secondaryColor={character.personaBrief?.renderPalette?.[1] || '#f3c43c'}
                  accentColor={character.personaBrief?.renderPalette?.[2] || '#17274d'}
                  presence={character.personaBrief?.presence ?? 1}
                />
              )}
              {holoMode === '2.5D' && <Hologram key={character.agentId + '-2.5'} imageUrls={character.baseImages} depthUrl={character.depthImage} />}
              {holoMode === 'True3D' && <ModelDisplacementHologram key={character.agentId + '-3D'} imageUrls={character.baseImages} depthUrl={character.depthImage} />}
              {holoMode === 'GenMesh' && <Gen3DMeshHologram modelUrl="/assets/base_mesh.glb" />}
              {holoMode === 'SplatLGM' && <SplatHologram splatUrl="/assets/lgm_splat.splat" scale={1.5} />}
              {holoMode === 'SplatImage' && <SplatHologram splatUrl="/assets/flower.splat" scale={1.5} />}
              {holoMode === 'DreamGaussian' && <Gen3DMeshHologram modelUrl="/assets/dreamgaussian_mesh.obj" />}
            </scene>
          </Suspense>
        </Canvas>
      </div>

      <div className="title-overlay">
        <h1>Holoverse</h1>
        <h2>{character.name} :: {character.designation}</h2>
        {character.personaBrief?.foundationSummary && (
          <p style={{ maxWidth: '620px', marginTop: '10px', color: 'rgba(220,255,255,0.8)', lineHeight: 1.5 }}>
            {character.personaBrief.foundationSummary}
          </p>
        )}
        
        <div className="action-links" style={{ marginBottom: '10px', flexWrap: 'wrap' }}>
          {characterList.map((char, index) => (
            <button 
              key={char.agentId || index}
              className={`webase-link ${character.name === char.name ? 'active' : ''}`} 
              style={character.name === char.name ? {background: 'rgba(0, 255, 255, 0.2)', borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)'} : {}}
              onClick={() => handleCharacterSelect(char)}
            >
              {char.name}
            </button>
          ))}
        </div>

        <div className="action-links">
          <button className="webase-link" onClick={() => setIsCreating(true)}>
            <PlusCircle size={14} /> Create Persona
          </button>
          <a 
            href={`http://localhost:5173/agent/${character.agentId}`} 
            target="_blank" 
            rel="noreferrer"
            className="webase-link"
          >
            <ExternalLink size={14} /> Connect to Webase Agent
          </a>
          <button className="webase-link" onClick={handleSavePersona}>
            <Download size={14} /> Save Persona
          </button>
        </div>

        {character.personaBrief?.foundationSignals?.length ? (
          <div className="action-links" style={{ marginTop: '10px', flexWrap: 'wrap' }}>
            {character.personaBrief.foundationSignals.map((signal) => (
              <span
                key={signal}
                className="webase-link"
                style={{ cursor: 'default', borderColor: 'rgba(0,255,255,0.3)', color: 'rgba(200,255,255,0.85)' }}
              >
                {signal}
              </span>
            ))}
          </div>
        ) : null}

        <div className="holo-toggles" style={{ flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={holoMode === 'SingleImage' ? 'active' : ''} onClick={() => setHoloMode('SingleImage')}>Single Image</button>
            <button className={holoMode === '2.5D' ? 'active' : ''} onClick={() => setHoloMode('2.5D')}>2.5D Shimmer</button>
            <button className={holoMode === 'True3D' ? 'active' : ''} onClick={() => setHoloMode('True3D')}>True 3D Relief</button>
            <button className={holoMode === 'GenMesh' ? 'active' : ''} onClick={() => setHoloMode('GenMesh')}>AI Gen Mesh</button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={holoMode === 'SplatLGM' ? 'active' : ''} onClick={() => setHoloMode('SplatLGM')}>LGM Splats</button>
            <button className={holoMode === 'SplatImage' ? 'active' : ''} onClick={() => setHoloMode('SplatImage')}>SplatterImage Splats</button>
            <button className={holoMode === 'DreamGaussian' ? 'active' : ''} onClick={() => setHoloMode('DreamGaussian')}>DreamGaussian Mesh</button>
          </div>
        </div>
      </div>

      {/* Voice Chat & Agent Interface Overlay */}
      <VoiceChat 
        setBackgroundShader={setBackgroundShader} 
        character={character} 
      />

      {/* Hologram Creator Modal Overlay */}
      {isCreating && (
        <CharacterCreator 
          onClose={() => setIsCreating(false)} 
          onSave={(newChar) => {
            setCharacterList(prev => [...prev, newChar]);
            setCharacter(newChar);
          }} 
        />
      )}
    </div>
  );
}

export default App;
