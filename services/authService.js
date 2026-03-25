import API, { saveToken, clearToken } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ LOGIN FIXED
export const login = async (email, password) => {
  try {
    const res = await API.post("/auth/login", { email, password });

    console.log("LOGIN RESPONSE:", res.data);

    // save token
    await saveToken(res.data.token);

    // save user
    await AsyncStorage.setItem(
      "auth_user",
      JSON.stringify(res.data.user || res.data)
    );

    // 🔥 RETURN USER (THIS WAS MISSING)
    return res.data.user || res.data;

  } catch (e) {
    console.log("LOGIN ERROR:", e.response?.data || e.message);
    throw e;
  }
};

// ✅ REGISTER FIXED (also return user)
export const register = async (data) => {
  const res = await API.post("/auth/register", data);

  await saveToken(res.data.token);

  return res.data.user || res.data; // 🔥 important
};

// ✅ LOGOUT
export const logout = async () => {
  await clearToken();
  await AsyncStorage.removeItem("auth_user");
};