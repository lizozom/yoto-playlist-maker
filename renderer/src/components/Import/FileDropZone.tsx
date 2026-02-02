import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';

interface FileDropZoneProps {
  onFileSelect: (filePath: string) => void;
  accept?: Record<string, string[]>;
  label?: string;
}

export function FileDropZone({ onFileSelect, accept, label = 'Drop CSV file here' }: FileDropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        // In Electron, we can get the file path
        const file = acceptedFiles[0] as File & { path?: string };
        if (file.path) {
          onFileSelect(file.path);
        }
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || { 'text/csv': ['.csv'] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
          : 'border-gray-600 hover:border-gray-500 hover:bg-[var(--bg-tertiary)]/30'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {isDragActive ? (
          <Upload className="w-12 h-12 text-[var(--accent)]" />
        ) : (
          <FileText className="w-12 h-12 text-gray-400" />
        )}
        <p className="text-gray-300">{isDragActive ? 'Drop the file here' : label}</p>
        <p className="text-sm text-gray-500">or click to browse</p>
      </div>
    </div>
  );
}
