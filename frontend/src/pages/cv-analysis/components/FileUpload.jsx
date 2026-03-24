import { useState, useRef } from 'react';

export default function FileUpload({ onFileSelect, uploading, uploadedFile }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or DOCX file');
      return;
    }
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="ri-file-upload-line mr-2 text-blue-600"></i>
        Upload Your CV
      </h3>

      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : uploadedFile
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600 font-medium">Parsing your CV...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <i className="ri-file-text-line text-2xl text-green-600"></i>
            </div>
            <p className="text-gray-900 font-medium">{uploadedFile.filename}</p>
            <p className="text-sm text-gray-500 mt-1">{uploadedFile.word_count} words extracted</p>
            <p className="text-xs text-blue-600 mt-2 hover:underline">Click to upload a different file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <i className="ri-upload-cloud-2-line text-3xl text-gray-400"></i>
            </div>
            <p className="text-gray-900 font-medium mb-1">
              Drop your CV here or <span className="text-blue-600">browse</span>
            </p>
            <p className="text-sm text-gray-500">Supports PDF and DOCX files</p>
          </div>
        )}
      </div>
    </div>
  );
}
