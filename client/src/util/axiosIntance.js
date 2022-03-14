import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:9000/api/v1",
  withCredentials: true,
  timeout: 3000,
});

export default axiosInstance;
