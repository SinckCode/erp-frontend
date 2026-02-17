import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { api } from "../api/axios";
import { useAuth } from "../auth/AuthProvider";
import "./LoginPage.scss";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const { data } = await api.post("/auth/login", values);

      // esperamos respuesta uniforme { ok, data: { token, user }, message }
      const payload = data?.data || data;
      if (!payload?.token || !payload?.user) {
        throw new Error("Respuesta de login incompleta (token/user).");
      }

      login({ token: payload.token, user: payload.user });
      nav("/", { replace: true });
    } catch (e) {
      setServerError(e?.response?.data?.message || e.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit(onSubmit)}>
        <h1>ERP Universidad Prueba</h1>
        <p>Inicia sesión para continuar</p>

        <div className="form-group">
          <label>Email</label>
          <input
            {...register("email", { required: "Email requerido" })}
            placeholder="correo@dominio.com"
          />
          {errors.email && <div className="error">{errors.email.message}</div>}
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            {...register("password", { required: "Contraseña requerida" })}
            placeholder="••••••••"
          />
          {errors.password && <div className="error">{errors.password.message}</div>}
        </div>

        {serverError && <div className="error" style={{ marginBottom: 10 }}>{serverError}</div>}

        <button className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
