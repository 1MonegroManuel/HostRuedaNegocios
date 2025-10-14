// src/pages/EventRegistrationReview.tsx
import { useEffect, useCallback, useState } from "react";
import {
    Box,
    Button,
    Card,
    Stack,
    Typography,
    Divider,
    Link,
    Backdrop,
} from "@mui/material";
import { CheckCircleOutline } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import theme from "../../theme/themes";

type EventDraft = {
    nombre: string;
    descripcion: string;
    fechaInicio: string; // ISO
    fechaFin: string;    // ISO
    numeroMesas: string;
};

type LocationState = {
    event?: EventDraft;
    files?: { logo: File | null; portada: File | null } | null;
};

export default function EventRegistrationReview() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { event, files } = (state as LocationState) || {};

    const [successOpen, setSuccessOpen] = useState(false);

    // Si entran sin datos, volver atrás
    useEffect(() => {
        if (!event) navigate("/company-registration", { replace: true });
    }, [event, navigate]);

    if (!event) return null;

    const onBack = () => navigate(-1);

    const openFileInNewTab = useCallback((fileOrUrl?: File | string | null) => {
        if (!fileOrUrl) return;
        let href = "";
        let revoke: string | null = null;

        if (fileOrUrl instanceof File) {
            href = URL.createObjectURL(fileOrUrl);
            revoke = href; // la revocamos luego de abrir
        } else if (typeof fileOrUrl === "string") {
            href = fileOrUrl;
        }

        if (href) {
            window.open(href, "_blank", "noopener,noreferrer");
            if (revoke) setTimeout(() => URL.revokeObjectURL(revoke!), 3000);
        }
    }, []);

    const getFileName = (fileOrUrl?: File | string | null) => {
        if (!fileOrUrl) return "";
        if (fileOrUrl instanceof File) return fileOrUrl.name;
        try {
            const u = new URL(fileOrUrl);
            const last = u.pathname.split("/").filter(Boolean).pop() || fileOrUrl;
            return decodeURIComponent(last);
        } catch {
            const clean = fileOrUrl.split("?")[0].split("#")[0];
            const parts = clean.split("/");
            return parts[parts.length - 1] || fileOrUrl;
        }
    };

    const onRegister = () => {
        // Aquí harías el POST real a tu backend con:
        // { ...event, logo: files?.logo, portada: files?.portada }
        setSuccessOpen(true);
        setTimeout(() => {
            navigate("/HomeAdmin", {
                replace: true,
                state: { toast: "Evento registrado correctamente" },
            });
        }, 2500);
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: theme.custom.gradients.appBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                py: 3,
            }}
        >
            <Card sx={{ width: "100%", maxWidth: 520, px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4 } }}>
                <Typography variant="h2" sx={{ mb: 2 }}>
                    Confirmar registro
                </Typography>

                <Stack spacing={1.25} sx={{ mb: 2 }}>
                    <Row label="Nombre" value={event.nombre} />
                    <Row
                        label="Fecha de inicio"
                        value={new Date(event.fechaInicio).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    />
                    <Row
                        label="Fecha de fin"
                        value={new Date(event.fechaFin).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    />
                    <Row label="Nº de mesas" value={event.numeroMesas} />
                </Stack>

                {/* Portada (solo nombre como link que abre nueva pestaña) */}
                <FieldTitle>Portada</FieldTitle>
                {files?.portada ? (
                    <Link
                        component="button"
                        type="button"
                        underline="hover"
                        onClick={() => openFileInNewTab(files.portada!)}
                        sx={{ fontWeight: 700, mb: 2, textAlign: "left" }}
                    >
                        {getFileName(files.portada)}
                    </Link>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No proporcionada
                    </Typography>
                )}

                {/* Logo (solo nombre como link que abre nueva pestaña) */}
                <FieldTitle>Logo</FieldTitle>
                {files?.logo ? (
                    <Link
                        component="button"
                        type="button"
                        underline="hover"
                        onClick={() => openFileInNewTab(files.logo!)}
                        sx={{ fontWeight: 700, mb: 2, textAlign: "left" }}
                    >
                        {getFileName(files.logo)}
                    </Link>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No proporcionado
                    </Typography>
                )}

                {/* Descripción (dinámica) */}
                <FieldTitle>Descripción</FieldTitle>
                <Box
                    sx={{
                        border: 1,
                        borderColor: "info.main",
                        borderRadius: theme.custom.radii.field,
                        bgcolor: "background.paper",
                        px: 1.5,
                        py: 1,
                        mb: 2,
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                        }}
                    >
                        {event.descripcion}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Acciones */}
                <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                    <Button variant="contained" color="warning" fullWidth onClick={() => onBack()}>
                        Volver
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        sx={{ color: "#000" }}
                        onClick={onRegister}
                    >
                        Registrar
                    </Button>
                </Stack>
            </Card>

            {/* Pantalla verde de éxito */}
            <Backdrop
                open={successOpen}
                sx={{
                    zIndex: (th) => th.zIndex.modal + 1,
                    background: theme.palette.primary.main,
                    color: "#fff",
                }}
            >
                <Stack alignItems="center" spacing={2}>
                    <CheckCircleOutline sx={{ fontSize: 96, color: "#fff" }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, textAlign: "center" }}>
                        Evento registrado correctamente
                    </Typography>
                </Stack>
            </Backdrop>
        </Box>
    );
}

function FieldTitle({ children }: { children: React.ReactNode }) {
    return (
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.secondary", mb: 0.75 }}>
            {children}
        </Typography>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ width: 150, color: "text.secondary" }}>{label}:</Typography>
            <Typography sx={{ fontWeight: 700, flex: 1, wordBreak: "break-word" }}>
                {value}
            </Typography>
        </Stack>
    );
}
