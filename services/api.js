import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
  baseURL: "https://backend-behavior-pred-depoy.onrender.com/api",
  timeout: 10000,
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const saveToken = (t) =>
  AsyncStorage.setItem("auth_token", t);

export const clearToken = () =>
  AsyncStorage.removeItem("auth_token");

export default API;