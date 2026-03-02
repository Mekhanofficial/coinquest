const DEFAULT_API_BASE_URL = "http://localhost:5000/api";

const normalizeUrl = (url = "") => {
  if (!url) return "";
  return url.replace(/\/+$/, "");
};

export const API_BASE_URL =
  normalizeUrl(import.meta.env.VITE_API_BASE_URL) || DEFAULT_API_BASE_URL;
