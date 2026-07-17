import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, getUser, updateUser } from "../api/userApi";
import ConfirmModal from "../components/common/ConfirmModal";
import Header from "../components/common/Header";
import Toast from "../components/common/Toast";
import FormField from "../components/form/FormField";
import ImageUploader from "../components/form/ImageUploader";
import { useAuth } from "../contexts/AuthContext";
import { useImageUpload } from "../hooks/useImageUpload";
import defaultProfileImage from "../assets/images/default-profile.svg";
import { nicknameError } from "../utils/validation";

export default function MyPage() {
  const navigate = useNavigate();
  const { userId, clearLoginState, refreshCurrentUser } = useAuth();
  const image = useImageUpload("");
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getUser(userId)
      .then((data) => {
        setUser(data);
        setNickname(data.nickname || "");
        image.reset(data.profileImage || "");
      })
      .catch((requestError) => setError(`* ${requestError.message}`));
    // 최초 진입 또는 로그인 사용자 변경 때만 서버 값을 폼에 반영한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const closeToast = useCallback(() => setToast(null), []);

  async function submit(event) {
    event.preventDefault();
    const validationError = nicknameError(nickname);
    if (validationError || image.isUploading || isSubmitting) {
      setError(
        image.isUploading
          ? "* 프로필 사진 업로드가 끝난 뒤 다시 시도해주세요."
          : validationError,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUser(userId, {
        nickname: nickname.trim(),
        profileImage: image.imageUrl,
      });
      await refreshCurrentUser();
      setError("");
      setToast({ message: "회원 정보가 수정되었습니다." });
    } catch (requestError) {
      setError(`* ${requestError.message}`);
      setToast({
        message: "회원 정보 수정에 실패했습니다.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function withdraw() {
    try {
      await deleteUser(userId);
      clearLoginState();
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(`* ${requestError.message}`);
      setIsWithdrawOpen(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-main mypage-main">
        <form className="mypage-form" noValidate onSubmit={submit}>
          <h2 className="page-title">회원정보수정</h2>
          <ImageUploader
            id="profile-image"
            label="프로필 사진"
            variant="profile"
            required
            currentImage={image.imageUrl}
            previewUrl={image.previewUrl}
            fallbackImage={defaultProfileImage}
            isUploading={image.isUploading}
            error={image.error}
            onSelect={(file) => image.selectFile(file).catch(() => {})}
          />
          <div className="mypage-info-field">
            <label>이메일</label>
            <p className="mypage-email">{user?.email || ""}</p>
          </div>
          <FormField label="닉네임" htmlFor="nickname">
            <input
              id="nickname"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
                setError("");
              }}
              onBlur={() => setError(nicknameError(nickname))}
            />
          </FormField>
          <p className="helper-text" aria-live="polite">
            {error || "* helper text"}
          </p>
          <button
            className="primary-button full-width-button"
            type="submit"
            disabled={isSubmitting || image.isUploading}
          >
            {isSubmitting ? "수정 중..." : "수정하기"}
          </button>
          <button
            className="text-button withdraw-button"
            type="button"
            onClick={() => setIsWithdrawOpen(true)}
          >
            회원 탈퇴
          </button>
        </form>
      </main>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={closeToast}
      />
      <ConfirmModal
        isOpen={isWithdrawOpen}
        title="회원탈퇴 하시겠습니까?"
        message="확인을 누르면 계정이 삭제됩니다."
        onCancel={() => setIsWithdrawOpen(false)}
        onConfirm={withdraw}
      />
    </>
  );
}
