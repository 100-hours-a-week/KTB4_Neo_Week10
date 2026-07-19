import { Navigate, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  if (isAuthenticated) return <Navigate to="/posts" replace />;

  async function submit(credentials) {
    const data = await loginUser(credentials);
    login(data);
    navigate("/posts", { replace: true });
  }

  return (
    <main className="page-main auth-main login-main">
      <LoginForm onSubmit={submit} />
    </main>
  );
}
