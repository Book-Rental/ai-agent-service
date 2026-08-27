import axios from "axios";
import { env } from "./env.js";


export const backendClient = axios.create({
  baseURL: env.EXISTING_BACKEND_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});