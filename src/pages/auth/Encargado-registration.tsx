import { useState, useMemo } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Stack,
    Alert,
    CircularProgress,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import theme from "../../theme/themes";
import { useCompanyRegistration } from "../../contexts/CompanyRegistrationContext";
import { useAuth } from "../../contexts/AuthContext";
import type { EncargadoData } from "../../hooks/useCompanyRegistrationFlow";

export default function EncargadoRegistration() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setEncargadoData, flowState } = useCompanyRegistration();
    const { register } = useAuth();

    // Obtener datos del estado de navegación
    const { company, selectedEvent } = location.state || {};

    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [telefono, setTelefono] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = useMemo(
        () =>
            nombre.trim().length > 1 &&
            apellido.trim().length > 1 &&
            email.trim().length > 5 &&
            username.trim().length > 3 &&
            password.length >= 6 &&
            password === confirmPassword,
        [nombre, apellido, email, username, password, confirmPassword]
    );

    const goBack = () => navigate("/company-logo", { state: { company, selectedEvent } });

    const goNext = async () => {
        if (!isValid) return;

        setLoading(true);
        setError(null);

        try {
            // Crear usuario encargado
            const encargadoData: EncargadoData = {
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                email: email.trim(),
                username: username.trim(),
                password,
                telefono: telefono.trim() || undefined,
            };

            // Registrar usuario en el sistema
            const result = await register({
                ...encargadoData,
                tipoUsuario: 'encargado'
            });

            if (result.success && result.user) {
                // Guardar datos en el contexto
                setEncargadoData(encargadoData);
                
                // Navegar al siguiente paso
                navigate("/personal-registration", {
                    state: {
                        company,
                        selectedEvent,
                        encargadoId: result.user._id
                    }
                });
            } else {
                setError(result.message || "Error al crear el usuario encargado");
            }
        } catch (err: any) {
            setError(err?.message || "Error al crear el usuario encargado");
        } finally {
            setLoading(false);
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
                background: theme.custom.gradients.appBg,
            }}
        >
            <Card
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    px: { xs: 3, sm: 4 },
                    py: { xs: 3, sm: 4 },
                }}
            >
                <Typography variant="h2" sx={{ mb: 2 }}>
                    Datos del Encargado
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Stack spacing={2}>
                    <TextField
                        label="Nombre"
                        placeholder="Juan"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Apellido"
                        placeholder="Pérez"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Email"
                        type="email"
                        placeholder="juan.perez@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Teléfono (opcional)"
                        placeholder="+591 7 12345678"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Nombre de usuario"
                        placeholder="juan.perez"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Contraseña"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        required
                    />

                    <TextField
                        label="Confirmar contraseña"
                        type="password"
                        placeholder="Repite la contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        fullWidth
                        required
                        error={password !== confirmPassword && confirmPassword.length > 0}
                        helperText={
                            password !== confirmPassword && confirmPassword.length > 0
                                ? "Las contraseñas no coinciden"
                                : ""
                        }
                    />

                    {/* Navegación */}
                    <Stack direction="row" gap={2} sx={{ mt: 1 }}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            color="warning" 
                            onClick={goBack}
                            disabled={loading}
                        >
                            Atrás
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            disabled={!isValid || loading}
                            onClick={goNext}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {loading ? "Creando..." : "Continuar"}
                        </Button>
                    </Stack>
                </Stack>
            </Card>
        </Box>
    );
}
