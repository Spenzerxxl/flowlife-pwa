import React, { useState, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, CheckCircle } from 'lucide-react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const recognitionRef = useRef(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatus('❌ Dein Browser unterstützt keine Spracherkennung');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'de-DE';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + ' ' + finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event);
      setStatus('❌ Fehler bei der Spracherkennung');
      setIsRecording(false);
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

  const processCommand = async () => {
    if (!transcript.trim()) {
      setStatus('⚠️ Bitte erst etwas sagen!');
      return;
    }

    setIsProcessing(true);
    setStatus('🤖 Verarbeite deine Anfrage...');

    // Hier würde die Integration mit n8n/Claude kommen
    setTimeout(() => {
      setStatus('✅ Demo: Anfrage erhalten - ' + transcript.slice(0, 50) + '...');
      setIsProcessing(false);
      // Nach 3 Sekunden Status zurücksetzen
      setTimeout(() => {
        setStatus('');
        setTranscript('');
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🚀 FlowLife</h1>
          <p className="text-white/80">Sprich und lass die Magie geschehen</p>
        </div>

        {/* Transcript Box */}
        <div className="bg-white/20 rounded-2xl p-4 mb-6 min-h-[120px]">
          <p className="text-white text-lg">
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
            } text-white shadow-lg disabled:opacity-50`}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <button
            onClick={processCommand}
            disabled={isProcessing || !transcript.trim()}
            className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all transform hover:scale-110 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={32} className="animate-spin" /> : <Send size={32} />}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className="text-center">
            <p className="text-white bg-black/20 rounded-full px-4 py-2 inline-block">
              {status}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 text-white/70 text-sm text-center">
          <p>💡 Beispiele: "Schreibe eine E-Mail an..." • "Erinnere mich..." • "Plane..."</p>
        </div>
      </div>
    </div>
  );
}

export default App;
