import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("trilens_user");
    const token = localStorage.getItem("trilens_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (studentId, password) => {
    const res = await api.post("/auth/login", { studentId, password });
    localStorage.setItem("trilens_token", res.data.token);
    localStorage.setItem("trilens_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    localStorage.setItem("trilens_token", res.data.token);
    localStorage.setItem("trilens_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("trilens_token");
    localStorage.removeItem("trilens_user");
    localStorage.removeItem("trilens_ai_context");
    localStorage.removeItem("trilens_active_session");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
