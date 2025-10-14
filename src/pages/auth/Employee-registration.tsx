import { useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import theme from "../../theme/themes";

type CompanyData = {
    nombre: string;
    rubro?: string;
    rubroOtro?: string;
    descripcion?: string;
    intereses?: string[];
    isVirtual?: boolean;
};

type WizardState = {
    company?: CompanyData;
    logoFile?: File | string | null;
    receiptFile?: File | string | null;
};

export default function EmployeeRegistration() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { company, logoFile, receiptFile } = (state || {}) as WizardState;

    const [principal, setPrincipal] = useState({
        nombre: "",
        apellido: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        telefono: "",
    });

    const isPrincipalValid =
        principal.nombre.trim().length > 1 &&
        principal.apellido.trim().length > 1 &&
        /^\S+@\S+\.\S+$/.test(principal.email) &&
        principal.username.trim().length > 3 &&
        principal.password.length >= 6 &&
        principal.password === principal.confirmPassword &&
        principal.telefono.trim().length > 5;

    const canContinue = useMemo(() => isPrincipalValid, [isPrincipalValid]);

    const updatePrincipal = (field: keyof typeof principal, value: string) =>
        setPrincipal((p) => ({ ...p, [field]: value }));

    const goBack = () => navigate(-1);

    const goNext = () => {
        if (!canContinue) return;
        navigate("/registration-review", {
            state: {
                company,
                logoFile,
                receiptFile,
                principal,
            },
        });
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

                <Stack spacing={2}>
                    <TextField
                        label="Nombre"
                        value={principal.nombre}
                        onChange={(e) => updatePrincipal("nombre", e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Apellido"
                        value={principal.apellido}
                        onChange={(e) => updatePrincipal("apellido", e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Correo Electrónico"
                        type="email"
                        value={principal.email}
                        onChange={(e) => updatePrincipal("email", e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Nombre de usuario"
                        value={principal.username}
                        onChange={(e) => updatePrincipal("username", e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Contraseña"
                        type="password"
                        value={principal.password}
                        onChange={(e) => updatePrincipal("password", e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Confirmar contraseña"
                        type="password"
                        value={principal.confirmPassword}
                        onChange={(e) => updatePrincipal("confirmPassword", e.target.value)}
                        fullWidth
                        error={principal.password !== principal.confirmPassword && principal.confirmPassword.length > 0}
                        helperText={
                            principal.password !== principal.confirmPassword && principal.confirmPassword.length > 0
                                ? "Las contraseñas no coinciden"
                                : ""
                        }
                    />
                    <TextField
                        label="Teléfono Celular"
                        value={principal.telefono}
                        onChange={(e) => updatePrincipal("telefono", e.target.value)}
                        fullWidth
                    />
                </Stack>

                <Stack direction="row" gap={2} sx={{ mt: 4 }}>
                    <Button fullWidth variant="contained" color="warning" onClick={goBack}>
                        Atrás
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        sx={{ color: "#000" }}
                        disabled={!canContinue}
                        onClick={goNext}
                    >
                        Siguiente
                    </Button>
                </Stack>
            </Card>
        </Box>
    );
}