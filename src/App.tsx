import React, { useState, useCallback } from 'react';
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
          onDialogueChange(sceneId, dialogue.id, 'character', e.target.value.toUpperCase())
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
  onStartVoice: (sceneId: string) => void;
  onStopVoice: () => void;
  isRecording: boolean;
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
  onStartVoice,
  onStopVoice,
  isRecording,
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
            className={`voice-button ${isRecording ? 'recording' : ''}`}
            onClick={() => (isRecording ? onStopVoice() : onStartVoice(scene.id))}
            title="Gravar voz"
          >
            {isRecording ? '⏹ Parar' : '🎤 Rec'}
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
        className="scene-action-input"
        value={scene.content}
        onChange={(e) => onContentChange(scene.id, e.target.value)}
        placeholder=""
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
  const [recordingSceneId, setRecordingSceneId] = useState<string | null>(null);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  // --- Gerenciar Cenas ---
  const addScene = useCallback(() => {
    const newScene: Scene = { id: generateId(), content: '', dialogues: [] };
    setScenes((prev) => [...prev, newScene]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 0);
  }, []);

  const deleteScene = useCallback((id: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleContentChange = useCallback((id: string, newContent: string) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === id ? { ...scene, content: newContent } : scene
      )
    );
  }, []);

  // --- Gerenciar Falas ---
  const addDialogue = useCallback((sceneId: string) => {
    const newDialogue: Dialogue = { id: generateId(), character: '', line: '' };
    setScenes((prev) =>
      prev.map((s) =>
        s.id === sceneId ? { ...s, dialogues: [...s.dialogues, newDialogue] } : s
      )
    );
  }, []);

  const deleteDialogue = useCallback((sceneId: string, dialogueId: string) => {
    setScenes((prev) =>
      prev.map((s) =>
        s.id === sceneId
          ? { ...s, dialogues: s.dialogues.filter((d) => d.id !== dialogueId) }
          : s
      )
    );
  }, []);

  const handleDialogueChange = useCallback(
    (sceneId: string, dialogueId: string, field: 'character' | 'line', value: string) => {
      setScenes((prev) =>
        prev.map((s) =>
          s.id === sceneId
            ? {
                ...s,
                dialogues: s.dialogues.map((d) =>
                  d.id === dialogueId ? { ...d, [field]: value } : d
                ),
              }
            : s
        )
      );
    },
    []
  );

  // --- Drag and Drop ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedId;
    setDraggedId(null);
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
    const target = e.currentTarget;
    if (target.dataset.sceneId !== draggedId) {
      target.classList.add('dragging-over');
    }
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) =>
    e
