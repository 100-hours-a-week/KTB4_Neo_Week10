const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const ACCESS_TOKEN_KEY = "accessToken";
const USER_ID_KEY = "userId";
const LEGACY_USER_ID_KEY = "loginUserId";

let unauthorizedHandler = null;
let refreshPromise = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getLoginUserId() {
  return (
    localStorage.getItem(USER_ID_KEY) ||
    localStorage.getItem(LEGACY_USER_ID_KEY)
  );
}

export function saveAuth({ accessToken, userId }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(USER_ID_KEY, String(userId));
  localStorage.removeItem(LEGACY_USER_ID_KEY);
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(LEGACY_USER_ID_KEY);
}

export function buildApiUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readJson(response) {
  return response.json().catch(() => null);
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(buildApiUrl("/users/refresh"), {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        const result = await readJson(response);
        if (!response.ok) {
          throw new Error(result?.message || "unauthorized_user");
        }

        const accessToken =
          result?.data?.accessToken || result?.accessToken;
        if (!accessToken) throw new Error("access_token_missing");
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function authFetch(url, options, retry = true) {
  const accessToken = getAccessToken();
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
    },
  });

  if (response.status !== 401 || !retry) return response;

  try {
    const newAccessToken = await refreshAccessToken();
    const retryResponse = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${newAccessToken}`,
      },
    });
    if (retryResponse.status === 401) {
      const error = new Error("unauthorized_user");
      clearAuth();
      unauthorizedHandler?.(error);
    }
    return retryResponse;
  } catch (error) {
    clearAuth();
    unauthorizedHandler?.(error);
    throw error;
  }
}

export async function apiRequest(path, options = {}) {
  const {
    auth = true,
    errorMessage = "요청에 실패했습니다.",
    ...fetchOptions
  } = options;

  const url = buildApiUrl(path);
  const response = auth
    ? await authFetch(url, fetchOptions)
    : await fetch(url, {
        ...fetchOptions,
        credentials: "include",
      });
  const result = await readJson(response);

  if (!response.ok) {
    throw new Error(result?.message || errorMessage);
  }

  return result?.data ?? result;
}

export async function uploadImageFile(file) {
  if (!file) return "";

  const formData = new FormData();
  formData.append("image", file);
  const image = await apiRequest("/uploads/images", {
    method: "POST",
    body: formData,
    errorMessage: "이미지 업로드에 실패했습니다.",
  });
  return image.imageUrl;
}
