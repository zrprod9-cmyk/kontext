import axios from "axios";

// 1️⃣ first priority - env variable injected at build
const envUrl = import.meta.env.VITE_API_URL?.trim();

// 2️⃣ fallbacks for dev and prod environments
const prodUrl = 'https://kontext.gosystem.io/api';
const devUrl = 'http://localhost:4000/api';

// final baseURL
const baseURL = envUrl || (import.meta.env.DEV ? devUrl : prodUrl);

export const api = axios.create({ baseURL, withCredentials: true });

