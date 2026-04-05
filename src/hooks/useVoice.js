import { useState, useCallback, useRef } from 'react';

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Use the Web Speech SDK
  const recognition = useRef(null);

  // Initialize SpeechRecognition
  if ('webkitSpeechRecognition' in window && !recognition.current) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = false;
    recognition.current.interimResults = false;
    
    recognition.current.onresult = (event) => {
      const current = event.resultIndex;
      const t = event.results[current][0].transcript;
      setTranscript(t);
    };

    recognition.current.onend = () => {
      setIsRecording(false);
    };
  }

  const startRecording = useCallback(() => {
    if (recognition.current) {
      setTranscript('');
      setIsRecording(true);
      recognition.current.start();
    } else {
      console.warn("Speech recognition not supported");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognition.current && isRecording) {
      recognition.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const speakText = useCallback((text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Pick a good default voice if possible
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US English'));
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.pitch = 1.1;
    utterance.rate = 0.9;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    isRecording,
    transcript,
    setTranscript,
    startRecording,
    stopRecording,
    speakText,
    isSpeaking
  };
}
