import React, { useState, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, Trash2 } from 'lucide-react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatus('❌ Dein Browser unterstützt keine Spracherkennung');
      return;
    }

    // Reset previous transcript
    finalTranscriptRef.current = '';
    setTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'de-DE';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update nur wenn es neue finale Ergebnisse gibt
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        setTranscript(finalTranscriptRef.current + interimTranscript);
      } else {
        // Zeige interim results nur als Preview
        setTranscript(finalTranscriptRef.current + interimTranscript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event);
      if (event.error === 'no-speech') {
        setStatus('🔇 Keine Sprache erkannt');
      } else if (event.error === 'not-allowed') {
        setStatus('🎤 Bitte Mikrofon-Zugriff erlauben');
      } else {
        setStatus('❌ Fehler: ' + event.error);
      }
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      setStatus('');
      // Finale Bereinigung
      setTranscript(finalTranscriptRef.current.trim());
    };

    recognitionRef.current.start();
    setIsRecording(true);
    setStatus('🎙️ Spreche jetzt...');
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setStatus('');
  };

  const clearTranscript = () => {
    setTranscript('');
    finalTranscriptRef.current = '';
    setStatus('');
  };

  const processCommand = async () => {
    if (!transcript.trim()) {
      setStatus('⚠️ Bitte erst etwas sagen!');
      return;
    }

    setIsProcessing(true);
    setStatus('🤖 Verarbeite deine Anfrage...');

    // Hier würde die Integration mit n8n/Claude kommen
    try {
      // Demo-Response
      setTimeout(() => {
        setStatus('✅ Empfangen: "' + transcript.trim().slice(0, 30) + '..."');
        setIsProcessing(false);
        // Nach 3 Sekunden Status zurücksetzen
        setTimeout(() => {
          setStatus('💡 Bereit für nächste Eingabe');
        }, 3000);
      }, 1500);
    } catch (error) {
      setStatus('❌ Fehler beim Verarbeiten');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">🚀 FlowLife</h1>
          <p className="text-white/80 text-sm sm:text-base">Sprich und lass die Magie geschehen</p>
        </div>

        {/* Transcript Box */}
        <div className="bg-white/20 rounded-2xl p-4 mb-6 min-h-[120px] relative">
          {transcript && (
            <button
              onClick={clearTranscript}
              className="absolute top-2 right-2 p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg text-white transition-colors"
              title="Löschen"
            >
              <Trash2 size={16} />
            </button>
          )}
          <p className="text-white text-base sm:text-lg pr-10">
            {transcript || <span className="text-white/50">Drücke das Mikrofon und sprich...</span>}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`p-4 rounded-full transition-all transform hover:scale-110 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white shadow-lg disabled:opacity-50 disabled:hover:scale-100`}
            title={isRecording ? "Stoppen" : "Aufnehmen"}
          >
            {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
          </button>

          <button
            onClick={processCommand}
            disabled={isProcessing || !transcript.trim()}
            className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
            title="Senden"
          >
            {isProcessing ? <Loader2 size={28} className="animate-spin" /> : <Send size={28} />}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className="text-center animate-fade-in">
            <p className="text-white bg-black/20 rounded-full px-4 py-2 inline-block text-sm sm:text-base">
              {status}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 sm:mt-8 text-white/70 text-xs sm:text-sm text-center">
          <p>💡 Beispiele: "Schreibe eine E-Mail an..." • "Erinnere mich..." • "Plane..."</p>
          <p className="mt-2 text-white/50 text-xs">
            {isRecording ? '🔴 Aufnahme läuft...' : '🎤 Mikrofon bereit'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
