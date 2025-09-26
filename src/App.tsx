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
  content: string;
  dialogues: Dialogue[];
}

// Função utilitária para gerar IDs únicos
const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substring(2, 9);

// --- Componente da Fala ---
interface DialogueBoxProps {
  dialogue: Dialogue;
  sceneId: string;
  onDialogueChange: (
    sceneId: string,
    dialogueId: string,
    field: 'character' | 'line',
    value: string
  ) => void;
  onDeleteDialogue: (sceneId: string, dialogueId: string) => void;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({
  dialogue,
  sceneId,
  onDialogueChange,
  onDeleteDialogue,
}) => (
  <div className="dialogue-box">
    <div className="dialogue-inputs-compact">
      <input
        type="text"
        className="dialogue-character-input"
        placeholder=""
        value={dialogue.character}
        onChange={(e) =>
          onDialogueChange(
            sceneId,
            dialogue.id,
            'character',
            e.target.value.toUpperCase()
          )
        }
      />
      <textarea
        className="dialogue-line-input-compact"
        placeholder=""
        value={dialogue.line}
        onChange={(e) =>
          onDialogueChange(sceneId, dialogue.id, 'line', e.target.value)
        }
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
  onDialogueChange: (
    sceneId: string,
    dialogueId: string,
    field: 'character' | 'line',
    value: string
  ) => void;
  onDeleteDialogue: (sceneId: string, dialogueId: string) => void;
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
}) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const toggleRecording = () => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    if (!listening) {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        onContentChange(scene.id, scene.content + ' ' + transcript);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } else {
      recognitionRef.current?.stop();
      setListening(false);
    }
  };

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
            className="voice-button"
            onClick={toggleRecording}
            title="Gravar Cena"
          >
            {listening ? '⏹ Parar' : '🎤 Rec'}
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

  const addScene = useCallback(() => {
    const newScene: Scene = { id: generateId(), content: '', dialogues: [] };
    setScenes((prev) => [...prev, newScene]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 0);
  }, []);

  const deleteScene = useCallback((id: string) => {
    setScenes((prev) => prev.filter((scene) => scene.id !== id));
  }, []);

  const handleContentChange = useCallback((id: string, newContent: string) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === id ? { ...scene, content: newContent } : scene
      )
    );
  }, []);

  const addDialogue = useCallback((sceneId: string) => {
    const newDialogue: Dialogue = { id: generateId(), character: '', line: '' };
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === sceneId
          ? { ...scene, dialogues: [...scene.dialogues, newDialogue] }
          : scene
      )
    );
  }, []);

  const deleteDialogue = useCallback((sceneId: string, dialogueId: string) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              dialogues: scene.dialogues.filter((d) => d.id !== dialogueId),
            }
          : scene
      )
    );
  }, []);

  const handleDialogueChange = useCallback(
    (
      sceneId: string,
      dialogueId: string,
      field: 'character' | 'line',
      value: string
    ) => {
      setScenes((prev) =>
        prev.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                dialogues: scene.dialogues.map((d) =>
                  d.id === dialogueId ? { ...d, [field]: value } : d
                ),
              }
            : scene
        )
      );
    },
    []
  );

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

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

  const formatScenesForExport = () =>
    scenes
      .map((scene, index) => {
        let script = `${index + 1} - ${scene.content.trim()}\n`;
        scene.dialogues.forEach((d) => {
          if (d.character.trim()) script += `${d.character.trim().toUpperCase()}\n`;
          if (d.line.trim()) script += `- ${d.line.trim()}\n`;
        });
        return script + '\n';
      })
      .join('');

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
            onClick={() =>
              navigator.clipboard.writeText(formatScenesForExport())
            }
          >
            Copiar
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
