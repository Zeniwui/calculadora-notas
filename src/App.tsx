import React, { useState, useEffect, useCallback, useRef } from 'react';
import { subjectsCatalog, getSubjectById } from './data/index';
import { UserSubjectState } from './types/subject';
import { loadSubjectState, saveSubjectState, exportAllData, importAllData } from './services/storage';

// Version 1: Acta Notarial (Selected Official Interface)
import { ActaDashboard } from './versions/v1-acta/ActaDashboard';
import { ActaSubjectView } from './versions/v1-acta/ActaSubjectView';

import { Upload, Download, HelpCircle, FileText } from 'lucide-react';

export const App: React.FC = () => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, UserSubjectState>>({});
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reload all states from localStorage
  const refreshAllStates = useCallback(() => {
    const loaded: Record<string, UserSubjectState> = {};
    for (const sub of subjectsCatalog) {
      loaded[sub.id] = loadSubjectState(sub.id);
    }
    setStates(loaded);
  }, []);

  useEffect(() => {
    refreshAllStates();
  }, [refreshAllStates]);

  const handleUpdateSubjectState = (newState: UserSubjectState) => {
    saveSubjectState(newState.subjectId, newState);
    setStates((prev) => ({
      ...prev,
      [newState.subjectId]: newState,
    }));
  };

  const handleExport = () => {
    const dataStr = exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notas_academico_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importAllData(content);
        if (success) {
          refreshAllStates();
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectedSubject = selectedSubjectId ? getSubjectById(selectedSubjectId) : undefined;
  const activeSubjectState = selectedSubject
    ? states[selectedSubject.id] || loadSubjectState(selectedSubject.id)
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0f172a] font-sans">
      {/* Universal Institutional Top Bar */}
      <header className="px-4 py-3 sticky top-0 z-40 bg-white border-b border-[#cbd5e1] text-[#0f172a] shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Monogram */}
          <button
            onClick={() => setSelectedSubjectId(null)}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-7 h-7 flex items-center justify-center font-bold text-xs bg-[#0f172a] text-white">
              U
            </div>
            <div>
              <span className="font-bold text-xs uppercase tracking-wider block">
                Calculadora Académica
              </span>
              <span className="text-xs text-[#475569] block">
                Conforme a Guías Docentes Universitarias
              </span>
            </div>
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 text-xs">
            <label
              className="cursor-pointer px-2.5 py-1.5 rounded-none border border-[#cbd5e1] text-[#334155] hover:text-[#0f172a] hover:border-[#0f172a] bg-white inline-flex items-center gap-1.5 transition-colors font-medium"
              title="Importar expediente (JSON)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExport}
              className="px-2.5 py-1.5 rounded-none border border-[#cbd5e1] text-[#334155] hover:text-[#0f172a] hover:border-[#0f172a] bg-white inline-flex items-center gap-1.5 transition-colors font-medium"
              title="Exportar expediente completo (JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>

            <button
              onClick={() => setShowHelp(true)}
              className="p-1.5 border border-[#cbd5e1] text-[#475569] hover:text-[#0f172a] hover:border-[#0f172a] bg-white transition-colors"
              title="Guía técnica y normativa de asignaturas"
              aria-label="Ayuda e información técnica"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {selectedSubject && activeSubjectState ? (
          <ActaSubjectView
            subject={selectedSubject}
            state={activeSubjectState}
            onUpdateState={handleUpdateSubjectState}
            onBackToDashboard={() => setSelectedSubjectId(null)}
          />
        ) : (
          <ActaDashboard
            subjects={subjectsCatalog}
            states={states}
            onSelectSubject={(id) => setSelectedSubjectId(id)}
          />
        )}
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 shadow-xl space-y-4 border bg-white border-[#cbd5e1] text-[#0f172a]">
            <div className="flex items-center justify-between border-b pb-3 border-[#cbd5e1]">
              <h2 className="text-base font-bold flex items-center gap-2 font-newsreader">
                <FileText className="w-4 h-4 text-[#1e3a8a]" />
                Guía de Ingesta y Añadido de Nuevas Asignaturas
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-500 hover:text-slate-900 font-bold p-1"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <p className="text-xs leading-relaxed text-[#334155]">
              Para incorporar nuevas asignaturas a esta calculadora conforme se aprueben nuevas guías docentes oficiales:
            </p>

            <ol className="text-xs space-y-2 list-decimal list-inside text-[#1e293b] font-mono bg-[#f8fafc] border border-[#e2e8f0] p-3">
              <li>Coloca el documento PDF oficial en la carpeta <code>guias-docentes/</code>.</li>
              <li>Ejecuta el script de ingesta reglamentaria: <code>npm run ingest</code>.</li>
              <li>El motor parseará las ponderaciones, notas mínimas, penalizaciones de 4,0 y convocatorias en <code>src/data/subjects/</code>.</li>
            </ol>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-[#0f172a] text-white hover:bg-[#1e293b]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#cbd5e1] bg-white py-6 text-center text-xs text-[#475569]">
        <p>
          Simulador oficial de calificaciones universitarias • Diseñado con rigor académico y preservación matemática
        </p>
      </footer>
    </div>
  );
};

export default App;
