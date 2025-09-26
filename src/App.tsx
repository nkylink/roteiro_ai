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
  listening?: boolean; // se está gravando voz
}

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
  onStartRec: (sceneId: string) => void;
  onStopRec: (sceneId: string) => void;
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
  onStartRec,
  onStopRec,
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
          {/* Botão de REC/STOP */}
          {scene.listening ? (
            <button
              className="add-dialogue-button"
              onClick={() => onStopRec(scene.id)}
            >
              ⏹️ Parar
            </button>
          ) : (
            <button
              className="add-dialogue-button"
              onClick={() => onStartRec(scene.id)}
            >
              🎤 REC
            </button>
          )}
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

// --- App Principal ---
const App: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const addScene = useCallback(() => {
    const newScene: Scene = {
      id: generateId(),
      content: '',
      dialogues: [],
      listening: false,
    };
    setScenes((prevScenes) => [...prevScenes, newScene]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 0);
  }, []);

  const deleteScene = useCallback((id: string) => {
    setScenes((prevScenes) => prevScenes.filter((scene) => scene.id !== id));
  }, []);

  const handleContentChange = useCallback((id: string, newContent: string) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) =>
        scene.id === id ? { ...scene, content: newContent } : scene
      )
    );
  }, []);

  const addDialogue = useCallback((sceneId: string) => {
    const newDialogue: Dialogue = {
      id: generateId(),
      character: '',
      line: '',
    };
    setScenes((prevScenes) =>
      prevScenes.map((scene) =>
        scene.id === sceneId
          ? { ...scene, dialogues: [...scene.dialogues, newDialogue] }
          : scene
      )
    );
  }, []);

  const deleteDialogue = useCallback((sceneId: string, dialogueId: string) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) =>
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
      setScenes((prevScenes) => {
        const newScenes = [...prevScenes];
        const sceneIndex = newScenes.findIndex((s) => s.id === sceneId);
        if (sceneIndex === -1) return prevScenes;

        const dialogueIndex = newScenes[sceneIndex].dialogues.findIndex(
          (d) => d.id === dialogueId
        );
        if (dialogueIndex === -1) return prevScenes;

        const updatedDialogue = {
          ...newScenes[sceneIndex].dialogues[dialogueIndex],
          [field]: value,
        };

        newScenes[sceneIndex].dialogues[dialogueIndex] = updatedDialogue;
        return newScenes;
      });
    },
    []
  );

  // --- Reconhecimento de Voz ---
  const startRec = (sceneId: string) => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      alert('Seu navegador não suporta SpeechRecognition 😢');
      return;
    }

    const rec: SpeechRecognition = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setScenes((prev) =>
        prev.map((s) =>
          s.id === sceneId ? { ...s, content: s.content + ' ' + transcript } : s
        )
      );
    };

    rec.onend = () => {
      setScenes((prev) =>
        prev.map((s) =>
          s.id === sceneId ? { ...s, listening: false } : s
        )
      );
    };

    rec.start();
    setRecognition(rec);

    setScenes((prev) =>
      prev.map((s) =>
        s.id === sceneId ? { ...s, listening: true } : s
      )
    );
  };

  const stopRec = (sceneId: string) => {
    recognition?.stop();
    setScenes((prev) =>
      prev.map((s) =>
        s.id === sceneId ? { ...s, listening: false } : s
      )
    );
  };

  // --- Drag and Drop (mesmo do seu código) ---
  const [draggedId, setDraggedId] = useState<string | null>(null);

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
        let script = scene.content.trim()
          ? `${index + 1} - ${scene.content.trim()}\n`
          : `${index + 1}\n`;

        scene.dialogues.forEach((d) => {
          const char = d.character.trim().toUpperCase();
          const line = d.line.trim();
          if (char) script += `${char}\n`;
          if (line) script += `- ${line}\n`;
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
            onStartRec={startRec}
            onStopRec={stopRec}
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

