import axios from 'axios';

// Determine the API base URL.
// Priority:
// 1. `VITE_API_URL` environment variable
// 2. Current origin with `/api` path
const baseURL =
  import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

export default axios.create({ baseURL });

