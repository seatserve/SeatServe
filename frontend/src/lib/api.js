import axios from "axios";

const getBackendUrl = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl;
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // GitHub Codespaces standard preview domains
  if (hostname.includes("-3000.app.github.dev")) {
    return `${protocol}//${hostname.replace("-3000.", "-8000.")}`;
  }
  if (hostname.includes("-3000.preview.app.github.dev")) {
    return `${protocol}//${hostname.replace("-3000.preview.", "-8000.preview.")}`;
  }

  // Same-origin fallback for production/domain reverse proxy (e.g., seatserve.online)
  return window.location.origin;
};

export const API = `${getBackendUrl()}/api`;

export const api = axios.create({ baseURL: API });

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const formatApiError = (err) => {
  const d = err?.response?.data?.detail;
  if (!d) return err?.message || "Something went wrong";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || JSON.stringify(x)).join(" · ");
  if (d?.msg) return d.msg;
  return String(d);
};
