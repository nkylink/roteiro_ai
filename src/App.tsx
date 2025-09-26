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
  listening?: boolean;
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
        value={dialogue.character}
        onChange={(e) => onDialogueChange(sceneId, dialogue.id, 'character', e.target.value.toUpperCase())}
      />
      <textarea
        className="dialogue-line-input-compact"
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
          {/* REC / STOP - estilo igual aos botões existentes */}
          {scene.listening ? (
            <button
              className="voice-button recording"
              onClick={() => onStopRec(scene.id)}
              title="Parar gravação"
            >
              ⏹ Parar
            </button>
          ) : (
            <button
              className="voice-button"
              onClick={() => onStartRec(scene.id)}
              title="Gravar cena"
            >
              🎤 Rec
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
        {scene.dialogues.map(dialogue => (
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

// --- Componente Principal (App) ---
const App: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activeSceneRef = useRef<string | null>(null);

  // Adiciona cena
  const addScene = useCallback(() => {
    const newScene: Scene = { id: generateId(), content: '', dialogues: [] };
    setScenes(prev => [...prev, newScene]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 0);
  }, []);

  const deleteScene = useCallback((id: string) => {
    // Se estivesse a gravar essa cena, para antes de remover
    if (activeSceneRef.current === id) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      activeSceneRef.current = null;
    }
    setScenes(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleContentChange = useCallback((id: string, newContent: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
  }, []);

  const addDialogue = useCallback((sceneId: string) => {
    const newDialogue: Dialogue = { id: generateId(), character: '', line: '' };
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, dialogues: [...s.dialogues, newDialogue] } : s));
  }, []);

  const deleteDialogue = useCallback((sceneId: string, dialogueId: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, dialogues: s.dialogues.filter(d => d.id !== dialogueId) } : s));
  }, []);

  const handleDialogueChange = useCallback((sceneId: string, dialogueId: string, field: 'character' | 'line', value: string) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== sceneId) return s;
      return { ...s, dialogues: s.dialogues.map(d => d.id === dialogueId ? { ...d, [field]: value } : d) };
    }));
  }, []);

  // Reconhecimento de voz: usa UMA instância de cada vez; só aplica resultados finais para evitar repetições
  const startRec = (sceneId: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Seu navegador não suporta SpeechRecognition');
      return;
    }

    // Se já houver uma instância ativa, para antes de iniciar nova
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      activeSceneRef.current = null;
    }

    const rec: SpeechRecognition = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    // Use interimResults = false para evitar múltiplos "interim" que causam repetições
    rec.interimResults = false;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      // percorre apenas os resultados desse evento e acrescenta só os finais
      let finalAppend = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalAppend += res[0].transcript;
        }
      }
      if (finalAppend.trim()) {
        // junta com o conteúdo atual da cena (preservando o que já estava)
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, content: (s.content ? s.content + ' ' : '') + finalAppend.trim() } : s));
      }
    };

    rec.onend = () => {
      // marca cena como não gravando
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, listening: false } : s));
      recognitionRef.current = null;
      activeSceneRef.current = null;
    };

    rec.onerror = () => {
      // em caso de erro, garantir limpeza
      recognitionRef.current = null;
      activeSceneRef.current = null;
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, listening: false } : s));
    };

    // inicia
    try {
      rec.start();
      recognitionRef.current = rec;
      activeSceneRef.current = sceneId;
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, listening: true } : s));
    } catch (err) {
      console.error('Erro ao iniciar reconhecimento:', err);
      alert('Não foi possível iniciar o reconhecimento. Tenta novamente.');
    }
  };

  const stopRec = (sceneId: string) => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    activeSceneRef.current = null;
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, listening: false } : s));
  };

  // Drag & Drop (mantido)
  const [draggedId, setDraggedId] = useState<string | null>(null);

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
    const [moved] = newScenes.splice(sourceIndex, 1);
    newScenes.splice(targetIndex, 0, moved);
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

  const formatScenesForExport = () => {
    return scenes.map((scene, index) => {
      let script = '';
      if (scene.content.trim()) script += `${index + 1} - ${scene.content.trim()}\n`;
      else script += `${index + 1}\n`;

      scene.dialogues.forEach(d => {
        if (d.character.trim()) script += `${d.character.trim().toUpperCase()}\n`;
        if (d.line.trim()) script += `- ${d.line.trim()}\n`;
      });

      script += '\n';
      return script;
    }).join('');
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
            onStartRec={startRec}
            onStopRec={stopRec}
          />
        ))}
        <button className="add-scene-button" onClick={addScene}>+</button>
      </div>

      {scenes.length > 0 && (
        <div className="full-script-container">
          <h2>Roteiro Final</h2>
          <textarea className="full-script-textarea" readOnly value={formatScenesForExport()} rows={20} />
          <button className="copy-button" onClick={() => navigator.clipboard.writeText(formatScenesForExport())}>Copiar</button>
        </div>
      )}
    </div>
  );
};

export default App;


