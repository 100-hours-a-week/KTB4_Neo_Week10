import { useEffect, useRef, useState } from "react";
import ImageUploader from "../form/ImageUploader";

export default function PostForm({
  initialValues,
  submitLabel,
  isLoading = false,
  onSubmit,
}) {
  const [form, setForm] = useState(initialValues);
  const [error, setError] = useState("");
  const previewUrlRef = useRef("");

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [],
  );

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
    if (form.isUploading) return;
    try {
      await onSubmit({
        title: form.title.trim(),
        postBody: form.postBody.trim(),
        postImage: form.postImage || "",
      });
    } catch (requestError) {
      setError(`* ${requestError.message}`);
    }
  }

  return (
    <form className="post-form" noValidate onSubmit={submit}>
      <h2 className="page-title">{submitLabel === "완료" ? "게시글 작성" : "게시글 수정"}</h2>
      <div className="line-field">
        <label htmlFor="title">제목*</label>
        <input
          id="title"
          name="title"
          value={form.title}
          maxLength={26}
          placeholder="제목을 입력해주세요. (최대 26글자)"
          onChange={change}
        />
      </div>
      <div className="line-field">
        <label htmlFor="post-body">내용*</label>
        <textarea
          id="post-body"
          name="postBody"
          value={form.postBody}
          placeholder="내용을 입력해주세요."
          onChange={change}
        />
      </div>
      <p className="helper-text" aria-live="polite">
        {error ||
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
            setForm((current) => ({
              ...current,
              postImage: imageUrl,
              isUploading: false,
            }));
          } catch (uploadError) {
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
          isLoading
        }
      >
        {isLoading ? "처리 중..." : submitLabel}
      </button>
    </form>
  );
}
