import axios from "axios";
import { BACKEND_URL } from "@/env";


const api = axios.create({ baseURL: BACKEND_URL });


api.interceptors.request.use((config) => {
if (typeof window !== "undefined") {
const token = localStorage.getItem("access_token");
if (token) config.headers.Authorization = `Bearer ${token}`;
}
return config;
});


export default api;