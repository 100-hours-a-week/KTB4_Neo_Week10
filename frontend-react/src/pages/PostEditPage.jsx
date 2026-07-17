import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { uploadImageFile } from "../api/client";
import { getPost, updatePost } from "../api/postApi";
import Header from "../components/common/Header";
import PostForm from "../components/posts/PostForm";

export default function PostEditPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getPost(postId)
      .then(({ post: data }) => setPost(data))
      .catch((requestError) => setError(requestError.message));
  }, [postId]);

  async function submit(data) {
    setIsSubmitting(true);
    try {
      await updatePost(postId, data);
      navigate(`/posts/${postId}`, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header showBackButton backTo={`/posts/${postId}`} />
      <main className="page-main post-form-main">
        {error && <p className="helper-text">* {error}</p>}
        {!error && !post && (
          <p className="helper-text">* 게시글을 불러오는 중입니다.</p>
        )}
        {post && (
          <PostForm
            key={post.postId}
            initialValues={{
              title: post.title || "",
              postBody: post.postBody || "",
              postImage: post.postImage || "",
              previewUrl: "",
              fileName: "",
              isUploading: false,
              imageError: "",
              upload: uploadImageFile,
            }}
            submitLabel="수정하기"
            isLoading={isSubmitting}
            onSubmit={submit}
          />
        )}
      </main>
    </>
  );
}
