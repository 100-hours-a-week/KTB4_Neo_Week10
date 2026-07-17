import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createComment,
  createReply,
  deleteComment,
  getComments,
  updateComment,
} from "../api/commentApi";
import {
  deletePost,
  getPost,
  togglePostLike,
} from "../api/postApi";
import defaultProfileImage from "../assets/images/default-profile.svg";
import CommentForm from "../components/comments/CommentForm";
import CommentItem from "../components/comments/CommentItem";
import ConfirmModal from "../components/common/ConfirmModal";
import Header from "../components/common/Header";
import ReportModal from "../components/posts/ReportModal";
import { useAuth } from "../contexts/AuthContext";
import { formatCount, formatRelativeTime } from "../utils/format";
import { resolveImageUrl } from "../utils/image";

const createMode = {
  type: "create",
  commentId: null,
  parentCommentId: null,
  isReply: false,
};

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [detail, setDetail] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState("");
  const [commentValue, setCommentValue] = useState("");
  const [commentMode, setCommentMode] = useState(createMode);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const loadComments = useCallback(async () => {
    const data = await getComments(postId);
    setComments(Array.isArray(data) ? data : []);
  }, [postId]);

  useEffect(() => {
    if (!/^\d+$/.test(postId)) {
      navigate("/posts", { replace: true });
      return;
    }

    let cancelled = false;
    Promise.all([getPost(postId), getComments(postId)])
      .then(([postData, commentData]) => {
        if (cancelled) return;
        setDetail(postData);
        setComments(Array.isArray(commentData) ? commentData : []);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      });
    return () => {
      cancelled = true;
    };
  }, [postId, navigate]);

  const activeCommentCount = useMemo(
    () =>
      comments.reduce(
        (total, comment) =>
          total +
          (comment.deleted ? 0 : 1) +
          (comment.replies || []).filter((reply) => !reply.deleted).length,
        0,
      ),
    [comments],
  );

  function resetCommentForm() {
    setCommentValue("");
    setCommentMode(createMode);
  }

  async function submitComment(event) {
    event.preventDefault();
    const body = commentValue.trim();
    if (!body || isCommentSubmitting) return;

    setIsCommentSubmitting(true);
    try {
      if (commentMode.type === "edit") {
        await updateComment(commentMode.commentId, body);
      } else if (commentMode.type === "reply") {
        await createReply(commentMode.parentCommentId, body);
      } else {
        await createComment(postId, body);
      }
      await loadComments();
      resetCommentForm();
    } catch (requestError) {
      window.alert(requestError.message);
    } finally {
      setIsCommentSubmitting(false);
    }
  }

  async function confirmDelete() {
    const target = confirm;
    setConfirm(null);
    try {
      if (target.type === "post") {
        await deletePost(postId);
        navigate("/posts", { replace: true });
      } else {
        await deleteComment(target.item.commentId);
        await loadComments();
        if (commentMode.commentId === target.item.commentId) {
          resetCommentForm();
        }
      }
    } catch (requestError) {
      window.alert(requestError.message);
    }
  }

  if (error) {
    return (
      <>
        <Header showBackButton />
        <main className="page-main detail-main">
          <p className="helper-text">* {error}</p>
        </main>
      </>
    );
  }

  if (!detail) {
    return (
      <>
        <Header showBackButton />
        <main className="page-main detail-main">
          <p className="helper-text">* 게시글을 불러오는 중입니다.</p>
        </main>
      </>
    );
  }

  const { post, author, meta } = detail;
  const isOwner = String(author.userId) === String(userId);
  const postImage =
    post.postImage && post.postImage !== "null"
      ? resolveImageUrl(post.postImage)
      : "";

  return (
    <>
      <Header showBackButton />
      <main className="page-main detail-main">
        <article className="detail-article">
          <h2 className="detail-title">{post.title}</h2>
          <div className="detail-management-actions">
            {isOwner && (
              <div className="detail-actions author-only">
                <button
                  className="outline-button"
                  type="button"
                  onClick={() => navigate(`/posts/${postId}/edit`)}
                >
                  수정
                </button>
                <button
                  className="outline-button"
                  type="button"
                  onClick={() =>
                    setConfirm({
                      type: "post",
                      title: "게시글을 삭제하시겠습니까?",
                    })
                  }
                >
                  삭제
                </button>
              </div>
            )}
            <button
              className="outline-button report-button"
              type="button"
              onClick={() => setIsReportOpen(true)}
            >
              신고
            </button>
          </div>
          <div className="detail-meta">
            <img
              className="detail-author-avatar"
              src={resolveImageUrl(
                author.profileImage,
                defaultProfileImage,
              )}
              alt="작성자 프로필"
            />
            <div className="detail-author-info">
              <strong className="detail-author">{author.nickname}</strong>
              <div className="detail-date-row">
                <span>
                  작성일{" "}
                  <time className="detail-date">
                    {formatRelativeTime(post.createdAt)}
                  </time>
                </span>
                <span>
                  수정일{" "}
                  <time className="detail-date">
                    {post.editedAt
                      ? formatRelativeTime(post.editedAt)
                      : "수정되지 않음"}
                  </time>
                </span>
              </div>
            </div>
          </div>
          {postImage && (
            <img
              className="detail-image"
              src={postImage}
              alt="게시글 이미지"
            />
          )}
          <p className="detail-body">{post.postBody}</p>
          <div className="detail-stats">
            <button
              className={`stat-button like-stat ${
                meta.liked ? "is-active" : ""
              }`}
              type="button"
              onClick={async () => {
                try {
                  const result = await togglePostLike(postId, meta.liked);
                  setDetail((current) => ({
                    ...current,
                    meta: {
                      ...current.meta,
                      liked: result.liked,
                      likes: result.likes,
                    },
                  }));
                } catch (requestError) {
                  window.alert(requestError.message);
                }
              }}
            >
              <span className="detail-stat-icon heart-icon">♥</span>
              <strong>{formatCount(meta.likes)}</strong>
              <span>좋아요</span>
            </button>
            <button className="stat-button comment-stat" type="button">
              <span className="detail-stat-icon comment-icon" />
              <strong>{formatCount(activeCommentCount)}</strong>
              <span>댓글</span>
            </button>
            <button className="stat-button view-stat" type="button">
              <span className="detail-stat-icon eye-icon" />
              <strong>{formatCount(meta.views)}</strong>
              <span>조회</span>
            </button>
          </div>
        </article>
        <section className="comment-section">
          <CommentForm
            value={commentValue}
            mode={commentMode}
            isSubmitting={isCommentSubmitting}
            onChange={(event) => setCommentValue(event.target.value)}
            onSubmit={submitComment}
            onCancelMode={resetCommentForm}
          />
          <div className="comment-list">
            {comments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                currentUserId={userId}
                onReply={(item) => {
                  setCommentMode({
                    type: "reply",
                    parentCommentId: item.commentId,
                    commentId: null,
                    isReply: false,
                  });
                  setCommentValue("");
                }}
                onEdit={(item, isReply) => {
                  setCommentMode({
                    type: "edit",
                    commentId: item.commentId,
                    parentCommentId: null,
                    isReply,
                  });
                  setCommentValue(item.commentBody);
                }}
                onDelete={(item, isReply) =>
                  setConfirm({
                    type: "comment",
                    item,
                    title: isReply
                      ? "대댓글을 삭제하시겠습니까?"
                      : "댓글을 삭제하시겠습니까?",
                  })
                }
              />
            ))}
          </div>
        </section>
      </main>
      <ConfirmModal
        isOpen={Boolean(confirm)}
        title={confirm?.title || ""}
        message="삭제한 내용은 복구할 수 없습니다."
        onCancel={() => setConfirm(null)}
        onConfirm={confirmDelete}
      />
      <ReportModal
        isOpen={isReportOpen}
        postId={postId}
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
}
