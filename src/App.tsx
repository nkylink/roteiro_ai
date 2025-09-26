import React, { useState } from "react";
import "./App.css";

function App() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  // Usa webkitSpeechRecognition como fallback
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const startListening = () => {
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta SpeechRecognition 😢");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  return (
    <div className="app-container">
      <h1>🎤 Reconhecimento de Voz</h1>

      <div className="scene-box">
        <div className="scene-header">
          <span className="scene-index">01</span>
          <div className="scene-actions">
            <button
              className="add-dialogue-button"
              onClick={startListening}
              disabled={listening}
            >
              {listening ? "🎙️ Ouvindo..." : "▶️ Iniciar Gravação"}
            </button>
          </div>
        </div>

        <textarea
          className="scene-action-input"
          placeholder="Transcrição aparecerá aqui..."
          value={transcript}
          readOnly
        />
      </div>

      <div className="full-script-container">
        <h2>Transcrição Completa</h2>
        <textarea
          className="full-script-textarea"
          value={transcript}
          placeholder="Nenhuma fala registrada ainda."
          readOnly
        />
        <button
          className="copy-button"
          onClick={() => navigator.clipboard.writeText(transcript)}
        >
          Copiar Texto
        </button>
      </div>
    </div>
  );
}

export default App;
