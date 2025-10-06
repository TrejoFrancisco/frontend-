import axios from "axios";

const BASE_URL = "https://apirestaurant.xolotlcl.com/api";

export const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});
