import axios from "axios";

// 1️⃣ first priority - env variable injected at build
const envUrl = import.meta.env.VITE_API_URL?.trim();

// 2️⃣ fallback to production deployment
const defaultUrl = "https://kontext.gosystem.io/api";

// final baseURL
const baseURL = envUrl || defaultUrl;

console.log("[API] baseURL =", baseURL); // remove later
export const api = axios.create({ baseURL, withCredentials: true });

