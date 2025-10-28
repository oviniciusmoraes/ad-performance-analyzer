import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Check, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getUploadUrlMutation = trpc.upload.getUploadUrl.useMutation();
  const completeUploadMutation = trpc.upload.completeUpload.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && selectedFile.type !== 'application/vnd.ms-excel') {
        toast.error("Formato de arquivo inválido. Por favor, use .xlsx ou .xls.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Por favor, selecione um arquivo.");
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      // 1. Get signed URL from backend
      const { url, fields, s3Key } = await getUploadUrlMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
      });

      // 2. Prepare FormData for S3 upload
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append("file", file);

      // 3. Upload file to S3
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 90) + 10; // 10% for pre-signing
          setProgress(percentComplete);
        }
      };

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("S3 upload failed."));
        xhr.send(formData);
      });

      setProgress(100);

      // 4. Complete upload and register in DB
      await completeUploadMutation.mutateAsync({
        fileName: file.name,
        s3Key: s3Key,
        mimeType: file.type,
        size: file.size,
      });

      toast.success("Upload concluído com sucesso!");
      setFile(null);
      onUploadSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Falha no upload. Tente novamente.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          id="file-input"
          disabled={loading}
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <p className="text-lg font-medium text-gray-900">
            {file ? file.name : 'Clique para selecionar ou arraste um arquivo'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Formatos aceitos: .xlsx, .xls
          </p>
        </label>
      </div>

      {file && (
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">{file.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFile(null)}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {progress < 100 ? `Enviando... ${progress}%` : 'Finalizando...'}
          </>
        ) : (
          'Fazer Upload'
        )}
      </Button>
    </div>
  );
}
