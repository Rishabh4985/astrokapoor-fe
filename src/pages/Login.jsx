import React from "react";
import LoginComponent from "../components/shared/LoginComponent";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role, token, userData) => {
    console.log("Login Success:", role);
    login(role, token, userData);
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "seller") {
      navigate("/seller");
    }
  };

  return <LoginComponent onLogin={handleLogin} />;
};

export default LoginPage;
