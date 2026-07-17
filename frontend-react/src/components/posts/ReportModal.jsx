import { useEffect, useRef, useState } from "react";
import { getReportTypes, reportPost } from "../../api/reportApi";

export default function ReportModal({ isOpen, postId, onClose }) {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    document.body.classList.add("modal-open");
    setSelectedType("");
    setReason("");
    setError("");

    getReportTypes()
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : data?.reportTypes || data?.types || [];
        setTypes(list);
      })
      .catch((requestError) => setError(`* ${requestError.message}`));

    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && types.length) firstInputRef.current?.focus();
  }, [isOpen, types]);

  if (!isOpen) return null;

  async function submit(event) {
    event.preventDefault();
    if (!selectedType) {
      setError("* 신고 유형을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await reportPost(postId, {
        reportType: selectedType,
        reason: reason.trim(),
      });
      window.alert("신고가 접수되었습니다.");
      onClose();
    } catch (requestError) {
      setError(`* ${requestError.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className="report-modal" onSubmit={submit}>
        <h2 id="report-modal-title">게시글 신고하기</h2>
        <p className="report-description">
          신고 유형을 선택하고 상세 사유를 입력해주세요.
        </p>
        <fieldset className="report-type-group">
          <legend>신고 유형</legend>
          {types.map((type, index) => {
            const value =
              typeof type === "string"
                ? type
                : type.value || type.name || type.code || type.reportType;
            const label =
              typeof type === "string"
                ? type
                : type.label || type.description || value;
            return (
              <label key={value}>
                <input
                  ref={index === 0 ? firstInputRef : undefined}
                  type="radio"
                  name="reportType"
                  value={value}
                  checked={selectedType === value}
                  onChange={(event) => {
                    setSelectedType(event.target.value);
                    setError("");
                  }}
                />{" "}
                {label}
              </label>
            );
          })}
        </fieldset>
        <label className="report-reason-label" htmlFor="report-reason">
          상세 사유
        </label>
        <textarea
          id="report-reason"
          value={reason}
          placeholder="상세 사유를 입력해주세요."
          onChange={(event) => setReason(event.target.value)}
        />
        <p className="helper-text" aria-live="polite">
          {error ||
            (selectedType
              ? "* 상세 사유를 입력하면 신고 처리에 도움이 됩니다."
              : "* 신고 유형을 선택해주세요.")}
        </p>
        <div className="confirm-modal-actions">
          <button
            className="modal-button cancel-button"
            type="button"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="modal-button report-submit-button"
            type="submit"
            disabled={!types.length || isSubmitting}
          >
            {isSubmitting ? "신고 중..." : "신고하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
