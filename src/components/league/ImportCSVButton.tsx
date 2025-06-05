import React, { useRef } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { Download } from 'lucide-react';
import { Upload } from 'lucide-react';

interface ImportCSVButtonProps {
  zoneId: string;
  onImportComplete?: () => void;
}

const ImportCSVButton: React.FC<ImportCSVButtonProps> = ({ zoneId, onImportComplete }) => {
  const { importStandingsFromCSV } = useLeague();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      if (csvData) {
        const success = importStandingsFromCSV(csvData, zoneId);
        if (success && onImportComplete) {
          onImportComplete();
        }
        
        // Limpiar el input para permitir cargar el mismo archivo nuevamente
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.readAsText(file);
  };
  
  return (
    <>
      <button
        className="btn btn-outline btn-sm flex items-center space-x-2"
        onClick={handleImportClick}
      >
        <Upload size={16} />
        <span>Importar CSV</span>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
    </>
  );
};

export default ImportCSVButton;