import axios from "axios";

const BASE_URL = "http://192.168.1.15:8000/api";

export const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});
