// src/pages/auth/ForgotPassword.tsx
import { Box, Button, Card, TextField, Typography, Alert, CircularProgress } from "@mui/material";
import { EmailOutlined, ArrowBack } from "@mui/icons-material";
import theme from "../../theme/themes";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { authService } from "../../apiService/services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Por favor, ingresa un correo electrónico válido");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await authService.requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Error al enviar el código de recuperación");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleContinue = () => {
    navigate("/reset-password", { state: { email } });
  };

  if (success) {
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
            Código Enviado
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
            Hemos enviado un código de recuperación a:
          </Typography>

          {/* Email */}
          <Box
            sx={{
              p: 2,
              backgroundColor: theme.palette.primary.light,
              borderRadius: 1,
              mb: 3,
              textAlign: "center",
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              {email}
            </Typography>
          </Box>

          {/* Instrucciones */}
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: theme.palette.text.secondary,
              mb: 3,
            }}
          >
            Revisa tu bandeja de entrada y spam. El código expira en 15 minutos.
          </Typography>

          {/* Botón Continuar */}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleContinue}
            sx={{ mb: 2 }}
          >
            Continuar
          </Button>

          {/* Botón Volver */}
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Volver al Login
          </Button>
        </Card>
      </Box>
    );
  }

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
          Recuperar Contraseña
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
          Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña
        </Typography>

        {/* Email */}
        <TextField
          fullWidth
          label="Correo Electrónico"
          placeholder="Ingresa tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{
            startAdornment: <EmailOutlined sx={{ mr: 1, color: theme.palette.primary.main }} />,
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

        {/* Botón Enviar */}
        <Button
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          onClick={handleSubmit}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ mb: 2 }}
        >
          {loading ? "Enviando..." : "Enviar Código"}
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
          Volver al Login
        </Button>
      </Card>
    </Box>
  );
}
