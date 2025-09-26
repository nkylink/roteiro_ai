import React, { useState } from "react";

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
    <div style={{ padding: "2rem" }}>
      <h1>🎤 Reconhecimento de Voz</h1>
      <button onClick={startListening} disabled={listening}>
        {listening ? "Ouvindo..." : "Iniciar"}
      </button>
      <p>
        <strong>Transcrição:</strong> {transcript}
      </p>
    </div>
  );
}

export default App;

