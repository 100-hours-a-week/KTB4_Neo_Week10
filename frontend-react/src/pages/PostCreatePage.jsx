import { useNavigate } from "react-router-dom";
import { createPost } from "../api/postApi";
import Header from "../components/common/Header";
import PostCreateForm from "../components/posts/PostCreateForm";

export default function PostCreatePage() {
  const navigate = useNavigate();

  async function submit(data) {
    await createPost(data);
    navigate("/posts", { replace: true });
  }

  return (
    <>
      <Header showBackButton />
      <main className="page-main post-form-main">
        <PostCreateForm onSubmit={submit} />
      </main>
    </>
  );
}
