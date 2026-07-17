import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import FormField from "../components/form/FormField";
import { useAuth } from "../contexts/AuthContext";
import { emailError, passwordError } from "../utils/validation";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const error = useMemo(
    () =>
      emailError(form.email) ||
      passwordError(form.password) ||
      serverError,
    [form, serverError],
  );

  if (isAuthenticated) return <Navigate to="/posts" replace />;

  function changeField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setServerError("");
  }

  async function submit(event) {
    event.preventDefault();
    setTouched(true);
    if (error || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = await loginUser({
        email: form.email.trim(),
        password: form.password.trim(),
      });
      login(data);
      navigate(location.state?.from || "/posts", { replace: true });
    } catch {
      setServerError("* 입력하신 회원정보를 찾을 수 없습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-main auth-main login-main">
      <form className="auth-form" noValidate onSubmit={submit}>
        <div className="login-heading">
          <h1 className="auth-title login-service-title">로그인</h1>
          <p className="login-description">
            계정으로 로그인하고 커뮤니티를 이용해보세요.
          </p>
        </div>
        <FormField label="이메일" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            placeholder="이메일을 입력하세요."
            onChange={changeField}
            onBlur={() => setTouched(true)}
          />
        </FormField>
        <FormField label="비밀번호" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            placeholder="비밀번호를 입력하세요."
            onChange={changeField}
            onBlur={() => setTouched(true)}
          />
        </FormField>
        <p className="helper-text" aria-live="polite">
          {touched ? error || "* helper text" : "* helper text"}
        </p>
        <button
          className="primary-button full-width-button"
          type="submit"
          disabled={Boolean(error) || isSubmitting}
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </button>
        <div className="auth-signup-prompt">
          <span>아직 계정이 없나요?</span>
          <Link className="auth-link" to="/signup">
            회원가입
          </Link>
        </div>
      </form>
    </main>
  );
}
