// api.js
import axios from "axios";

// Puedes poner aquí la IP actual de tu servidor local o de producción
const BASE_URL = "http://10.0.139.5:8000/api";

export const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
