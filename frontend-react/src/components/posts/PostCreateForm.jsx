import { uploadImageFile } from "../../api/client";
import PostForm from "./PostForm";

export default function PostCreateForm({ onSubmit }) {
  return (
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
      title="게시글 작성"
      submitLabel="완료"
      onSubmit={onSubmit}
    />
  );
}
