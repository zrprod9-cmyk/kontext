import axios from "axios";

// 1️⃣ first priority - env variable injected at build
const envUrl = import.meta.env.VITE_API_URL?.trim();

// default production API URL
const defaultUrl = 'https://kontext.gosystem.io/api';

// final baseURL
const baseURL = envUrl || defaultUrl;

export const api = axios.create({ baseURL, withCredentials: true });

