// src/pages/Login.jsx
import { Box, Button, Link, TextField, Typography, Divider, Card, Alert, CircularProgress } from "@mui/material";
import { EmailOutlined, LockOutlined } from "@mui/icons-material";
import theme from "../../theme/themes";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // 👈 TIPADO CORRECTO // sin tipos en .jsx

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor, completa todos los campos");
      return;
    }
    try {
      setError(null);
      await login({ identifier: email, password });
      // Redirigir a la página principal (que ahora maneja ambos roles)
      navigate("/home");
    } catch (err: any) {
      setError("Error al iniciar sesión: " + (err?.message ?? "Desconocido"));
      console.error("Login error:", err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background: theme.custom.gradients.appBg, // fondo global del login
      }}
    >
      {/* Tarjeta blanca */}
      <Card sx={{ px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4 } }}>
        {/* Logo */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
          <img
            src="../public/Logo.png"
            alt="Logo"
            style={{ width: 202, height: 202, objectFit: "contain" }}
          />
        </Box>

        {/* Descripción */}
        <Typography
          variant="body2"
          sx={{ textAlign: "center", color: theme.palette.text.secondary, mb: 3 }}
        >
          Conecta, crece y potencia tu negocio en la red empresarial más
          importante del Beni
        </Typography>

        {/* Email */}
        <TextField
          fullWidth
          label="Email o Usuario"
          placeholder="Ingresa tu email (ej: admin@ruedanegocios.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{
            startAdornment: <EmailOutlined sx={{ mr: 1, color: theme.palette.primary.main }} />,
          }}
          sx={{ mb: 2 }}
        />

        {/* Password */}
        <TextField
          fullWidth
          type="password"
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            startAdornment: <LockOutlined sx={{ mr: 1, color: theme.palette.primary.main }} />,
          }}
          sx={{ mb: 1 }}
        />

        {/* Olvidaste tu contraseña */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Link 
            href="#" 
            underline="none" 
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              navigate("/forgot-password");
            }}
            sx={{ cursor: "pointer" }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Botón Iniciar sesión */}
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          disabled={isLoading}
          sx={{ mb: 2.5 }}
          onClick={handleLogin}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>

        {/* Separador con punto */}
        <Box sx={{ position: "relative", my: 2.5 }}>
          <Divider>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: theme.palette.primary.main,
              }}
            />
          </Divider>
        </Box>

        {/* Botón Registrar empresa */}
        <Button
          fullWidth
          variant="contained"
          color="success"
          onClick={() => navigate("/SelectEvents")}
        >
          Registrar Empresa
        </Button>

        {/* Credenciales de prueba */}
        <Box sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", mb: 1 }}>
            🔑 Credenciales de prueba:
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            Admin: admin@ruedanegocios.com / Admin2024!
          </Typography>
          <Typography variant="caption" sx={{ display: "block" }}>
            Test: test@example.com / password123
          </Typography>
        </Box>

        {/* Footer */}
        <Typography sx={{ mt: 3, fontSize: 11, textAlign: "center", color: "#8a8a8a" }}>
          © 2025 Rueda de Negocios del Beni. Todos los derechos reservados.
        </Typography>
      </Card>
    </Box>
  );
}
