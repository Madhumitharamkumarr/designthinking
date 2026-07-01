import { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { uploadService } from '../services/uploadService';
import toast from 'react-hot-toast';

export default function FileUpload({ onUpload, disabled }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadService.upload(file);
      onUpload({ fileUrl: res.data.fileUrl, fileName: res.data.fileName });
      toast.success('File uploaded successfully!');
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {!file ? (
        <div
          className={`file-upload-area ${dragOver ? 'dragover' : ''}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <div className="file-upload-icon">📁</div>
          <div className="file-upload-text">
            <strong>Click to upload</strong> or drag and drop
          </div>
          <div className="file-upload-hint">PDF, DOC, DOCX, PPT, PPTX, ZIP, PNG, JPG (max 20MB)</div>
          <input
            ref={inputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
          />
        </div>
      ) : (
        <div className="file-preview">
          <FileText size={18} color="#065F46" />
          <span className="file-preview-name">{file.name}</span>
          <span className="file-preview-remove" onClick={() => setFile(null)}>
            <X size={16} />
          </span>
        </div>
      )}

      {file && (
        <button
          className="btn btn-primary mt-4"
          onClick={handleUpload}
          disabled={uploading || disabled}
          style={{ marginTop: 12 }}
        >
          <Upload size={14} />
          {uploading ? 'Uploading…' : 'Upload File'}
        </button>
      )}
    </div>
  );
}
