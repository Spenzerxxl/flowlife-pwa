import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Loader2, Trash2 } from 'lucide-react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
  }, []);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatus('❌ Dein Browser unterstützt keine Spracherkennung');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'de-DE';
    
    // Mobile: Einzelne Aufnahme, Desktop: Kontinuierlich
    recognitionRef.current.continuous = !isMobile;
    // Mobile: Keine Zwischenergebnisse
    recognitionRef.current.interimResults = !isMobile;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setStatus('🎙️ Spreche jetzt...');
    };

    recognitionRef.current.onresult = (event) => {
      // Für Mobile: Einfacher Ansatz
      if (isMobile) {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal || !recognitionRef.current.interimResults) {
          const newText = lastResult[0].transcript;
          setTranscript(prev => {
            // Füge neuen Text hinzu, wenn er nicht bereits am Ende steht
            if (!prev.endsWith(newText)) {
              return (prev + ' ' + newText).trim();
            }
            return prev;
          });
        }
      } else {
        // Desktop: Vollständige Funktionalität
        let finalText = '';
        let interimText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }
        
        if (finalText) {
          setTranscript(prev => (prev + ' ' + finalText).trim());
        }
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event);
      if (event.error === 'no-speech') {
        setStatus('🔇 Keine Sprache erkannt');
      } else if (event.error === 'not-allowed') {
        setStatus('🎤 Bitte Mikrofon-Zugriff erlauben');
      } else if (event.error === 'aborted') {
        setStatus('');
      } else {
        setStatus('❌ Fehler: ' + event.error);
      }
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      if (isMobile && transcript.length < 100) {
        // Auf Mobile: Automatisch neu starten wenn noch nicht viel Text
        setStatus('👆 Tippe erneut zum Weitersprechen');
      } else {
        setStatus('');
      }
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Start error:', error);
      setStatus('❌ Konnte Aufnahme nicht starten');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Stop error:', error);
      }
    }
    setIsRecording(false);
    setStatus('');
  };

  const clearTranscript = () => {
    setTranscript('');
    setStatus('');
  };

  const processCommand = async () => {
    if (!transcript.trim()) {
      setStatus('⚠️ Bitte erst etwas sagen!');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    setIsProcessing(true);
    setStatus('🤖 Verarbeite deine Anfrage...');

    // Demo-Response
    setTimeout(() => {
      const cleanText = transcript.trim();
      setStatus('✅ "' + cleanText.slice(0, 30) + (cleanText.length > 30 ? '...' : '') + '"');
      setIsProcessing(false);
      
      setTimeout(() => {
        setStatus('💡 Bereit für nächste Eingabe');
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">🚀 FlowLife</h1>
          <p className="text-white/80 text-sm sm:text-base">
            {isMobile ? '📱 Mobile Version' : '💻 Desktop Version'}
          </p>
        </div>

        {/* Transcript Box */}
        <div className="bg-white/20 rounded-2xl p-4 mb-6 min-h-[120px] max-h-[200px] overflow-y-auto relative">
          {transcript && (
            <button
              onClick={clearTranscript}
              className="absolute top-2 right-2 p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg text-white transition-colors z-10"
              title="Alles löschen"
            >
              <Trash2 size={16} />
            </button>
          )}
          <p className="text-white text-base sm:text-lg pr-10 whitespace-pre-wrap">
            {transcript || <span className="text-white/50">Drücke das Mikrofon und sprich...</span>}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`p-4 rounded-full transition-all transform ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110' 
                : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
            } text-white shadow-lg disabled:opacity-50 disabled:hover:scale-100 touch-manipulation`}
            title={isRecording ? "Stoppen" : "Aufnehmen"}
          >
            {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
          </button>

          <button
            onClick={processCommand}
            disabled={isProcessing || !transcript.trim()}
            className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 touch-manipulation"
            title="Senden"
          >
            {isProcessing ? <Loader2 size={28} className="animate-spin" /> : <Send size={28} />}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className="text-center animate-fade-in">
            <p className="text-white bg-black/30 backdrop-blur rounded-full px-4 py-2 inline-block text-sm sm:text-base">
              {status}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 sm:mt-8 text-white/70 text-xs sm:text-sm text-center space-y-2">
          <p>💡 Beispiele: "Schreibe eine E-Mail" • "Erinnere mich" • "Plane"</p>
          {isMobile && (
            <p className="text-white/50 text-xs">
              📱 Tipp: Kurze Sätze funktionieren besser auf Mobilgeräten
            </p>
          )}
          <p className="text-white/50 text-xs">
            {isRecording ? '🔴 Aufnahme läuft...' : '🎤 Mikrofon bereit'}
          </p>
        </div>

        {/* Debug Info - nur im Development */}
        {window.location.hostname === 'localhost' && (
          <div className="mt-4 text-white/30 text-xs text-center">
            Mobile: {isMobile ? 'Ja' : 'Nein'} | 
            Continuous: {!isMobile ? 'Ja' : 'Nein'} | 
            Interim: {!isMobile ? 'Ja' : 'Nein'}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
