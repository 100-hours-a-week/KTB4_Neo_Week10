import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadImageFile } from "../api/client";
import { createPost } from "../api/postApi";
import Header from "../components/common/Header";
import PostForm from "../components/posts/PostForm";

export default function PostCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(data) {
    setIsSubmitting(true);
    try {
      await createPost(data);
      navigate("/posts", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header showBackButton />
      <main className="page-main post-form-main">
        <PostForm
          initialValues={{
            title: "",
            postBody: "",
            postImage: "",
            previewUrl: "",
            fileName: "",
            isUploading: false,
            imageError: "",
            upload: uploadImageFile,
          }}
          submitLabel="완료"
          isLoading={isSubmitting}
          onSubmit={submit}
        />
      </main>
    </>
  );
}
