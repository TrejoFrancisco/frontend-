//api.js
import axios from "axios";

export const API = axios.create({
  baseURL: "'http://192.168.0.13:8000/api", // cambia por tu ruta
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
