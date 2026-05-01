import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import { Upload } from "lucide-react";

export default function FileUpload({
  onUploadSuccess,
  onUploadError,
  accept = "image/*",
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      const response = await api.getStorageInfo();
      if (response.success && response.data?.storage) {
        const storage = response.data.storage;
        const available = Math.max(0, storage.limit - storage.used);
        const percentage =
          storage.limit > 0
            ? ((storage.used / storage.limit) * 100).toFixed(1)
            : 0;
        setStorageInfo({
          used: storage.used || 0,
          limit: storage.limit || 0,
          available: available,
          percentage: percentage,
        });
      }
    } catch (err) {
      console.error("Failed to load storage info:", err);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setError(null);
    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError("File size exceeds 5MB limit");
      setFile(null);
      return;
    }

    if (storageInfo && selectedFile.size > storageInfo.available) {
      const fileSizeMB = (selectedFile.size / 1024 / 1024).toFixed(2);
      const availableMB = (storageInfo.available / 1024 / 1024).toFixed(2);
      setError(
        `Storage limit exceeded! File size (${fileSizeMB} MB) exceeds available storage (${availableMB} MB).`,
      );
      setFile(null);
      return;
    }

    // All validations passed — upload immediately
    handleUpload(selectedFile);
  };

  const handleUpload = async (fileToUpload) => {
    const target = fileToUpload || file;
    if (!target) return;

    try {
      setUploading(true);
      setError(null);

      const response = await api.uploadFile(target);

      if (response.success) {
        onUploadSuccess?.(response.data.file.url);
        setPreviewUrl(response.data.file.url);
        setFile(null);
        setPreview(null);
        await loadStorageInfo();
      } else {
        const errorMsg =
          response.error?.message || response.message || "Upload failed";
        setError(errorMsg);
        onUploadError?.(errorMsg);
      }
    } catch (err) {
      let errorMsg = "Upload failed";
      if (err.response?.data?.error?.message) {
        errorMsg = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const formatMB = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  return (
    <div className="space-y-4">
      {storageInfo && !previewUrl && (
        <div className="text-sm font-medium text-gray-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          Storage:{" "}
          <span className="font-bold">{formatMB(storageInfo.used)}</span> /{" "}
          <span className="font-bold">{formatMB(storageInfo.limit)} MB</span>{" "}
          used
        </div>
      )}

      <div className="flex items-center gap-4">
        {!previewUrl && (
          <label className="cursor-pointer">
            <input
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <span className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
              <Upload className="w-4 h-4" />
              <span>{uploading ? "Uploading..." : "Choose File"}</span>
            </span>
          </label>
        )}
      </div>

      {error && <ErrorMessage message={error} />}
    </div>
  );
}
