import axios from "axios";

const BASE_URL = "http://10.0.139.5:8000/api";

export const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
