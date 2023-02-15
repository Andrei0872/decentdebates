import axios from "axios";

// TODO: from `.env` file.
export const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
});