// src/api/api.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4040/api",
  timeout: 15000,
});


const API = async ({ url, method = "GET", responseType = "json", data = null, params = null, headers = {} }) => {
  try {
    const res = await apiClient({
      url,
      method,
      responseType,
      data,
      params,
      headers,
    });

    return res.data;
  } catch (err) {
    throw err.response?.data || err.message || "API Error";
  }
};

export default API;
