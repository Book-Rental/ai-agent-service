import axios from "axios";
import { env } from "./env.js";


export const backendClient = axios.create({
  baseURL: env.BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});