import axios from "axios";

// 1️⃣ first priority - env variable injected at build
const envUrl = import.meta.env.VITE_API_URL?.trim();

// 2️⃣ second - same-origin backend on :4000 (for dev preview)
const sameOriginUrl = `${window.location.protocol}//${window.location.hostname}:4000/api`;

// final baseURL
const baseURL = envUrl || sameOriginUrl;

console.log("[API] baseURL =", baseURL); // remove later
export const api = axios.create({ baseURL, withCredentials: true });

