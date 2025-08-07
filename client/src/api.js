import axios from 'axios';

// Determine the API base URL.
// Priority:
// 1. VITE_API_URL environment variable
// 2. During local development, fall back to the backend running on localhost:4000
// 3. In production, default to the current origin
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin);

export default axios.create({ baseURL });

