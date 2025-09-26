import React, { useState, useCallback, useRef } from 'react';
import './App.css';

// --- Tipos ---

interface Dialogue {
  id: string;
  character: string;
  line: string;
}

interface Scene {
  id: string;
  content: string; // Descrição da cena/ação
  dialogues: Dialogue[]; // Lista de falas na cena
  isRecording?: boolean; // controle de gravação
}

// Função utilitária para gerar IDs únicos
const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

// --- Componente da Fala (Diálogo) ---
interface DialogueBoxProps {
  dialogue: Dialogue;
  sceneId: string;
  onDialogueChange: (sceneId: string, dialogueId: string, field: 'character' | 'line', value: string) => void;
  onDeleteDialogue: (sceneId: string, dialogueId: string) => void;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, sceneId, onDialogueChange, onDeleteDialogue }) => (
  <div className="dialogue-box">
    <div className="dialogue-inputs-compact">
      <input
        type="text"
        className="dialogue-character-input"
        placeholder=""
        value={dialogue.character}
        onChange={(e) => onDialogueChange(sceneId, dialogue.id, 'character', e.target.value.toUpperCase())}
      />
      <textarea
        className="dialogue-line-input-compact"
        placeholder=""
        value={dialogue.line}
        onChange={(e) => onDialogueChange(sceneId, dialogue.id, 'line', e.target.value)}
      />
    </div>
    <button
      className="delete-dialogue-button"
      onClick={() => onDeleteDialogue(sceneId, dialogue.id)}
      title="Deletar Fala"
    >
      ×
    </button>
  </div>
);

// --- Componente da Cena ---
interface SceneBoxProps {
  scene: Scene;
  index: number;
  onContentChange: (id: string, newContent: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onAddDialogue: (sceneId: string) => void;
  onDialogueChange: (sceneId: string, dialogueId: string, field: 'character' | 'line', value: string) => void;
  onDeleteDialogue: (sceneId: string, dialogueId: string) => void;
  onToggleRecording: (sceneId: string) => void;
}

const SceneBox: React.FC<SceneBoxProps> = ({
  scene,
  index,
  onContentChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  onAddDialogue,
  onDialogueChange,
  onDeleteDialogue,
  onToggleRecording,
}) => {
  return (
    <div
      className="scene-box"
      draggable
      onDragStart={(e) => onDragStart(e, scene.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, scene.id)}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      data-scene-id={scene.id}
    >
      <header className="scene-header">
        <span className="scene-index">{index + 1}</span>
        <div className="scene-actions">
          <button
            className={`rec-button ${scene.isRecording ? 'recording' : ''}`}
            onClick={() => onToggleRecording(scene.id)}
            title={scene.isRecording ? 'Parar Gravação' : 'Gravar'}
          >
            {scene.isRecording ? '■' : '●'}
          </button>
          <button
            className="add-dialogue-button"
            onClick={() => onAddDialogue(scene.id)}
            title="Adicionar Fala"
          >
            Fala
          </button>
          <button
            className="delete-button"
            onClick={() => onDelete(scene.id)}
            title="Deletar Cena"
          >
            ×
          </button>
        </div>
      </header>

      <textarea
        className="scene-textarea scene-action-input"
        value={scene.content}
        onChange={(e) => onContentChange(scene.id, e.target.value)}
        placeholder={''}
      />

      <div className="dialogue-list">
        {scene.dialogues.map((dialogue) => (
          <DialogueBox
            key={dialogue.id}
            dialogue={dialogue}
            sceneId={scene.id}
            onDialogueChange={onDialogueChange}
            onDeleteDialogue={onDeleteDialogue}
          />
        ))}
      </div>
    </div>
  );
};

// --- Componente Principal ---
const App: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activeSceneRef = useRef<string | null>(null);

  // Adiciona cena
  const addScene = useCallback(() => {
    const newScene: Scene = {
      id: generateId(),
      content: '',
      dialogues: [],
      isRecording: false,
    };
    setScenes((prevScenes) => [...prevScenes, newScene]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 0);
  }, []);

  // Deletar cena
  const deleteScene = useCallback((id: string) => {
    setScenes((prevScenes) => prevScenes.filter((scene) => scene.id !== id));
  }, []);

  // Alterar conteúdo cena
  const handleContentChange = useCallback((id: string, newContent: string) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) => (scene.id === id ? { ...scene, content: newContent } : scene))
    );
  }, []);

  // Adicionar diálogo
  const addDialogue = useCallback((sceneId: string) => {
    const newDialogue: Dialogue = {
      id: generateId(),
      character: '',
      line: '',
    };
    setScenes((prevScenes) =>
      prevScenes.map((scene) =>
        scene.id === sceneId ? { ...scene, dialogues: [...scene.dialogues, newDialogue] } : scene
      )
    );
  }, []);

  // Deletar diálogo
  const deleteDialogue = useCallback((sceneId: string, dialogueId: string) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) =>
        scene.id === sceneId
          ? { ...scene, dialogues: scene.dialogues.filter((d) => d.id !== dialogueId) }
          : scene
      )
    );
  }, []);

  // Alterar fala
  const handleDialogueChange = useCallback(
    (sceneId: string, dialogueId: string, field: 'character' | 'line', value: string) => {
      setScenes((prevScenes) => {
        return prevScenes.map((scene) => {
          if (scene.id !== sceneId) return scene;
          return {
            ...scene,
            dialogues: scene.dialogues.map((d) =>
              d.id === dialogueId ? { ...d, [field]: value } : d
            ),
          };
        });
      });
    },
    []
  );

  // --- Gravação de voz ---
  const toggleRecording = (sceneId: string) => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Seu navegador não suporta reconhecimento de voz');
      return;
    }

    if (recognitionRef.current && scenes.find((s) => s.id === sceneId)?.isRecording) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      activeSceneRef.current = null;
      setScenes((prev) =>
        prev.map((s) => (s.id === sceneId ? { ...s, isRecording: false } : s))
      );
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setScenes((prev) =>
          prev.map((s) =>
            s.id === sceneId ? { ...s, content: transcript } : s
          )
        );
      };

      recognition.onend = () => {
        setScenes((prev) =>
          prev.map((s) => (s.id === sceneId ? { ...s, isRecording: false } : s))
        );
      };

      recognition.start();
      recognitionRef.current = recognition;
      activeSceneRef.current = sceneId;
      setScenes((prev) =>
        prev.map((s) => (s.id === sceneId ? { ...s, isRecording: true } : s))
      );
    }
  };

  // Drag & Drop cenas
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragging-over');
    const sourceId = draggedId;
    setDraggedId(null);
    e.currentTarget.classList.remove('dragging');
    if (!sourceId || sourceId === targetId) return;
    const sourceIndex = scenes.findIndex((s) => s.id === sourceId);
    const targetIndex = scenes.findIndex((s) => s.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const newScenes = [...scenes];
    const [movedScene] = newScenes.splice(sourceIndex, 1);
    newScenes.splice(targetIndex, 0, movedScene);
    setScenes(newScenes);
  };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget.dataset.sceneId !== draggedId) {
      e.currentTarget.classList.add('dragging-over');
    }
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragging-over');
  };

  // Exportar roteiro
  const formatScenesForExport = () => {
    return scenes
      .map((scene, index) => {
        let script = '';
        if (scene.content.trim()) {
          script += `${index + 1} - ${scene.content.trim()}\n`;
        } else {
          script += `${index + 1}\n`;
        }
        scene.dialogues.forEach((d) => {
          const char = d.character.trim().toUpperCase();
          const line = d.line.trim();
          if (char) script += `${char}\n`;
          if (line) script += `- ${line}\n`;
        });
        script += '\n';
        return script;
      })
      .join('');
  };

  return (
    <div className="app-container">
      <h1>Roteiro</h1>
      <div className="scene-list">
        {scenes.map((scene, index) => (
          <SceneBox
            key={scene.id}
            scene={scene}
            index={index}
            onContentChange={handleContentChange}
            onDelete={deleteScene}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onAddDialogue={addDialogue}
            onDialogueChange={handleDialogueChange}
            onDeleteDialogue={deleteDialogue}
            onToggleRecording={toggleRecording}
          />
        ))}
        <button className="add-scene-button" onClick={addScene}>
          +
        </button>
      </div>
      {scenes.length > 0 && (
        <div className="full-script-container">
          <h2>Roteiro Final</h2>
          <textarea
            className="full-script-textarea"
            readOnly
            value={formatScenesForExport()}
            rows={20}
          />
          <button
            className="copy-button"
            onClick={() => navigator.clipboard.writeText(formatScenesForExport())}
            title="Copiar Roteiro Completo"
          >
            Copiar
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
