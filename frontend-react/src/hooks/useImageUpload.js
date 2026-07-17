import { useEffect, useRef, useState } from "react";
import { uploadImageFile } from "../api/client";

export function useImageUpload(initialImage = "") {
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const objectUrlRef = useRef("");

  function revokePreview() {
    if (!objectUrlRef.current) return;
    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = "";
  }

  async function selectFile(file) {
    setError("");
    if (!file) return;

    revokePreview();
    objectUrlRef.current = URL.createObjectURL(file);
    setPreviewUrl(objectUrlRef.current);
    setFileName(file.name);
    setIsUploading(true);

    try {
      const uploadedUrl = await uploadImageFile(file);
      setImageUrl(uploadedUrl);
      return uploadedUrl;
    } catch (uploadError) {
      setError(uploadError.message);
      setPreviewUrl("");
      setFileName("");
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  }

  function reset(nextImage = "") {
    revokePreview();
    setImageUrl(nextImage);
    setPreviewUrl("");
    setFileName("");
    setError("");
    setIsUploading(false);
  }

  useEffect(() => () => revokePreview(), []);

  return {
    imageUrl,
    setImageUrl,
    previewUrl,
    fileName,
    isUploading,
    error,
    selectFile,
    reset,
  };
}
