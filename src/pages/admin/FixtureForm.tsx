import React, { useRef, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import MatchesSection from './MatchesSection';
import mammoth from 'mammoth';

const FixtureForm = ({
  formState,
  setFormState,
  filters,
  setFilters,
  leagues,
  teams,
  computedData,
  reset,
  handleSubmit,
  onSubmit,
  register,
  errors,
  fields,
  append,
  remove,
  isFormDisabled,
  handleCancelClick
}) => {
  // Estado para feedback visual
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  // Manejar carga de archivo DOCX solo para feedback visual
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    setLoadingMessage('Cargando archivo...');
    setTimeout(async () => {
      try {
        // Simular procesamiento (puedes quitar mammoth si no lo usas)
        // const arrayBuffer = await file.arrayBuffer();
        // const { value } = await mammoth.extractRawText({ arrayBuffer });
        setUploadedFileName(file.name);
        setLoadingMessage('Archivo cargado correctamente');
        // Aquí podrías hacer cualquier otra acción con el archivo si lo necesitas
      } catch (err) {
        console.error('Error procesando archivo:', err);
        alert('Error al procesar el archivo');
      } finally {
        setTimeout(() => {
          setIsProcessingFile(false);
          setLoadingMessage('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 1000);
      }
    }, 300);
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
      {/* Bloque de carga de archivo DOCX mejorado */}
      <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Importar desde archivo DOCX
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Sube un archivo .docx (solo se cargará el archivo, no se procesarán partidos automáticamente)
            </p>
            <label className="btn btn-secondary cursor-pointer">
              <input
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                disabled={isFormDisabled || isProcessingFile}
                className="hidden"
                ref={fileInputRef}
              />
              Seleccionar archivo
            </label>
            {uploadedFileName && !isProcessingFile && (
              <p className="mt-2 text-xs text-green-600">Archivo cargado: {uploadedFileName}</p>
            )}
          </div>
          {isProcessingFile && (
            <div className="mt-4 flex flex-col items-center justify-center text-sm text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2" />
              {loadingMessage}
            </div>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="date">
              Fecha (nombre) *
            </label>
            <input
              id="date"
              type="text"
              className={cn("form-input", errors.date && "border-red-500")}
              placeholder="Ej: 1° FECHA"
              autoComplete="off"
              disabled={isFormDisabled}
              {...register('date', { required: 'La fecha es requerida' })}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="matchDate">
              Fecha del partido *
            </label>
            <input
              id="matchDate"
              type="date"
              className={cn("form-input", errors.matchDate && "border-red-500")}
              autoComplete="off"
              disabled={isFormDisabled}
              {...register('matchDate', { required: 'La fecha del partido es requerida' })}
            />
            {errors.matchDate && (
              <p className="mt-1 text-sm text-red-600">{errors.matchDate.message}</p>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="formLeagueId">
              Liga *
            </label>
            <select
              id="formLeagueId"
              className={cn("form-input", errors.leagueId && "border-red-500")}
              disabled={isFormDisabled}
              {...register('leagueId', { required: 'La liga es requerida' })}
            >
              <option value="">Seleccionar liga</option>
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
            {errors.leagueId && (
              <p className="mt-1 text-sm text-red-600">{errors.leagueId.message}</p>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="leyenda">
              Leyenda
            </label>
            <input
              id="leyenda"
              type="text"
              className="form-input"
              placeholder="Ej: Fecha especial, Apertura 2024, Final, etc."
              autoComplete="off"
              disabled={isFormDisabled}
              {...register('leyenda')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="form-label" htmlFor="texto_central">
              Texto central
            </label>
            <input
              id="texto_central"
              type="text"
              className="form-input"
              placeholder="Ej: Zona 1, Zona 2, etc."
              autoComplete="off"
              disabled={isFormDisabled}
              {...register('texto_central')}
            />
          </div>
        </div>
        {/* Matches Section */}
        <MatchesSection
          fields={fields}
          append={append}
          remove={remove}
          register={register}
          errors={errors}
          computedData={computedData}
          isFormDisabled={isFormDisabled}
        />
        {/* Form Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="btn btn-primary flex items-center space-x-2"
            disabled={isFormDisabled}
          >
            {formState.isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save size={18} />
            )}
            <span>
              {formState.isSubmitting 
                ? (formState.isAdding ? 'Creando...' : 'Actualizando...') 
                : (formState.isAdding ? 'Crear Fixture' : 'Actualizar Fixture')
              }
            </span>
          </button>
          <button
            type="button"
            onClick={handleCancelClick}
            className="btn btn-secondary flex items-center space-x-2"
            disabled={isFormDisabled}
          >
            <X size={18} />
            <span>Cancelar</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default FixtureForm; 