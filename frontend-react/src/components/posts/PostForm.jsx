import { useEffect, useRef, useState } from "react";
import FormField from "../form/FormField";
import ImageUploader from "../form/ImageUploader";

export default function PostForm({
  initialValues,
  title,
  submitLabel,
  onSubmit,
}) {
  const [form, setForm] = useState(initialValues);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewUrlRef = useRef("");
  const uploadIdRef = useRef(0);
  const submitPendingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      uploadIdRef.current += 1;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "title" ? value.slice(0, 26) : value,
    }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.postBody.trim()) {
      setError("* 제목, 내용을 모두 작성해주세요.");
      return;
    }
    if (form.isUploading || submitPendingRef.current) return;

    submitPendingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        postBody: form.postBody.trim(),
        postImage: form.postImage || "",
      });
    } catch (requestError) {
      if (mountedRef.current) {
        setError(`* ${requestError.message}`);
      }
    } finally {
      submitPendingRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  }

  return (
    <form className="post-form" noValidate onSubmit={submit}>
      <h2 className="page-title">{title}</h2>
      <FormField
        className="line-field"
        label="제목*"
        htmlFor="title"
      >
        <input
          id="title"
          name="title"
          value={form.title}
          maxLength={26}
          placeholder="제목을 입력해주세요. (최대 26글자)"
          onChange={change}
        />
      </FormField>
      <FormField
        className="line-field"
        label="내용*"
        htmlFor="post-body"
      >
        <textarea
          id="post-body"
          name="postBody"
          value={form.postBody}
          placeholder="내용을 입력해주세요."
          onChange={change}
        />
      </FormField>
      <p className="helper-text" aria-live="polite">
        {error ||
          (form.imageError ? `* ${form.imageError}` : "") ||
          (form.isUploading ? "* 이미지를 업로드하는 중입니다." : "* helper text")}
      </p>
      <ImageUploader
        id="post-image"
        currentImage={form.postImage}
        previewUrl={form.previewUrl}
        fileName={form.fileName}
        isUploading={form.isUploading}
        error={form.imageError}
        onSelect={async (file) => {
          if (!file) return;
          const uploadId = uploadIdRef.current + 1;
          uploadIdRef.current = uploadId;
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
          }
          const previewUrl = URL.createObjectURL(file);
          previewUrlRef.current = previewUrl;
          setForm((current) => ({
            ...current,
            previewUrl,
            fileName: file.name,
            isUploading: true,
            imageError: "",
          }));
          try {
            const imageUrl = await initialValues.upload(file);
            if (
              !mountedRef.current ||
              uploadId !== uploadIdRef.current
            ) {
              return;
            }
            setForm((current) => ({
              ...current,
              postImage: imageUrl,
              isUploading: false,
            }));
          } catch (uploadError) {
            if (
              !mountedRef.current ||
              uploadId !== uploadIdRef.current
            ) {
              return;
            }
            URL.revokeObjectURL(previewUrl);
            previewUrlRef.current = "";
            setForm((current) => ({
              ...current,
              previewUrl: "",
              fileName: "",
              isUploading: false,
              imageError: uploadError.message,
            }));
          }
        }}
      />
      <button
        className="primary-button"
        type="submit"
        disabled={
          !form.title.trim() ||
          !form.postBody.trim() ||
          form.isUploading ||
          isSubmitting
        }
      >
        {isSubmitting ? "처리 중..." : submitLabel}
      </button>
    </form>
  );
}
