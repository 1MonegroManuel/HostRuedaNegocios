// src/pages/auth/ResetPassword.tsx
import { Box, Button, Card, TextField, Typography, Alert, CircularProgress } from "@mui/material";
import { LockOutlined, ArrowBack, Visibility, VisibilityOff } from "@mui/icons-material";
import theme from "../../theme/themes";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { authService } from "../../apiService/services/authService";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validaciones
    if (!code) {
      setError("Por favor, ingresa el código de recuperación");
      return;
    }

    if (!newPassword) {
      setError("Por favor, ingresa tu nueva contraseña");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await authService.resetPassword(code, newPassword);
      
      // Mostrar mensaje de éxito y redirigir
      navigate("/", { 
        state: { 
          message: "Contraseña restablecida exitosamente. Ya puedes iniciar sesión." 
        } 
      });
    } catch (err: any) {
      setError(err?.message || "Error al restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/forgot-password");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background: theme.custom.gradients.appBg,
      }}
    >
      <Card sx={{ px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4 }, maxWidth: 400, width: "100%" }}>
        {/* Logo */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <img
            src="../public/Logo.png"
            alt="Logo"
            style={{ width: 120, height: 120, objectFit: "contain" }}
          />
        </Box>

        {/* Título */}
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            fontWeight: 700,
            color: theme.palette.primary.main,
            mb: 1,
          }}
        >
          Nueva Contraseña
        </Typography>

        {/* Descripción */}
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            color: theme.palette.text.secondary,
            mb: 3,
          }}
        >
          Ingresa el código enviado a tu correo y tu nueva contraseña
        </Typography>

        {/* Email (solo lectura) */}
        {email && (
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.primary.light,
              borderRadius: 1,
              mb: 2,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.primary.main }}>
              {email}
            </Typography>
          </Box>
        )}

        {/* Código */}
        <TextField
          fullWidth
          label="Código de Recuperación"
          placeholder="Ingresa el código de 6 dígitos"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          sx={{ mb: 2 }}
          disabled={loading}
          inputProps={{ maxLength: 6 }}
        />

        {/* Nueva Contraseña */}
        <TextField
          fullWidth
          label="Nueva Contraseña"
          placeholder="Ingresa tu nueva contraseña"
          type={showPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          InputProps={{
            startAdornment: <LockOutlined sx={{ mr: 1, color: theme.palette.primary.main }} />,
            endAdornment: (
              <Button
                onClick={togglePasswordVisibility}
                sx={{ minWidth: "auto", p: 0.5 }}
                disabled={loading}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </Button>
            ),
          }}
          sx={{ mb: 2 }}
          disabled={loading}
        />

        {/* Confirmar Contraseña */}
        <TextField
          fullWidth
          label="Confirmar Contraseña"
          placeholder="Confirma tu nueva contraseña"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          InputProps={{
            startAdornment: <LockOutlined sx={{ mr: 1, color: theme.palette.primary.main }} />,
            endAdornment: (
              <Button
                onClick={toggleConfirmPasswordVisibility}
                sx={{ minWidth: "auto", p: 0.5 }}
                disabled={loading}
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </Button>
            ),
          }}
          sx={{ mb: 2 }}
          disabled={loading}
        />

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Botón Restablecer */}
        <Button
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          onClick={handleSubmit}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ mb: 2 }}
        >
          {loading ? "Restableciendo..." : "Restablecer Contraseña"}
        </Button>

        {/* Botón Volver */}
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={handleBack}
          startIcon={<ArrowBack />}
          disabled={loading}
        >
          Volver
        </Button>
      </Card>
    </Box>
  );
}
