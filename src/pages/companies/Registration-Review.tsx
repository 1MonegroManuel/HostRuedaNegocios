// src/pages/RegistrationReview.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    Chip,
    Divider,
    Stack,
    Typography,
    Backdrop,
    Alert,
    CircularProgress,
} from "@mui/material";
import { CheckCircleOutline } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import theme from "../../theme/themes";
import { useAuth } from "../../contexts/AuthContext";
import { empresaService } from "../../apiService/services/empresaService";
import { storageService } from "../../apiService/services/storageService";

type Principal = {
    nombre: string;
    apellido: string;
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    telefono: string;
};

type Companion = { nombre: string; email: string; cargo: string };

type CompanyData = {
    nombre: string;
    rubro?: string;
    rubroOtro?: string;
    descripcion?: string;
    intereses?: string[];
    isVirtual?: boolean;
    eventoId: string;
    nit?: string;
    telefono?: string;
    email?: string;
    sitio_web?: string;
};

type LocationState = {
    company?: CompanyData;
    logoFile?: File | string | null;
    principal?: Principal;
    companions?: Companion[];
};

export default function RegistrationReview() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { company, logoFile, principal } =
        (state as LocationState) || {};
    const { register } = useAuth();

    const [successOpen, setSuccessOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // URL para previsualizar el logo si es File
    const [logoURL, setLogoURL] = useState<string | null>(null);

    // Validación de flujo
    useEffect(() => {
        if (!principal || !company) {
            navigate("/Employee-registration", { replace: true });
        }
    }, [principal, company, navigate]);

    // Crear object URL si logo viene como File; si es string, usar directo
    useEffect(() => {
        let logoObjUrl: string | null = null;
        if (logoFile instanceof File) {
            logoObjUrl = URL.createObjectURL(logoFile);
            setLogoURL(logoObjUrl);
        } else if (typeof logoFile === "string") {
            setLogoURL(logoFile);
        } else {
            setLogoURL(null);
        }
        return () => {
            if (logoObjUrl) URL.revokeObjectURL(logoObjUrl);
        };
    }, [logoFile]);

    const rubroShown = useMemo(() => {
        if (!company) return "";
        if (company.rubro && company.rubro !== "__OTRO__") return company.rubro;
        if (company.rubro === "__OTRO__" && company.rubroOtro) return company.rubroOtro;
        return company.rubro ?? "";
    }, [company]);

    const onSend = async () => {
        if (!company || !principal) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Crear usuario encargado
            const encargadoResult = await register({
                nombre: principal.nombre,
                apellido: principal.apellido,
                email: principal.email,
                username: principal.username,
                password: principal.password,
                telefono: principal.telefono,
                tipoUsuario: 'encargado'
            });

            if (!encargadoResult.success || !encargadoResult.user) {
                throw new Error(encargadoResult.message || "Error al crear el usuario encargado");
            }

            // 2. Subir logo si existe
            let logoUrl: string | undefined;
            if (logoFile instanceof File) {
                const uploadResult = await storageService.uploadFile(logoFile);
                logoUrl = uploadResult.url;
            } else if (typeof logoFile === "string") {
                logoUrl = logoFile;
            }

            // 3. Crear empresa
            const empresaData = {
                eventoId: company.eventoId,
                nombre: company.nombre,
                nit: company.nit,
                rubro: company.rubro,
                representante: `${principal.nombre} ${principal.apellido}`, // Nombre del encargado
                telefono: company.telefono,
                email: company.email,
                sitio_web: company.sitio_web,
                logo_url: logoUrl,
                descripcion: company.descripcion,
                isVirtual: company.isVirtual || false,
                encargadoId: encargadoResult.user._id,
                personalIds: [], // Por ahora vacío
                estado: 'pendiente' as const
            };

            const empresaResult = await empresaService.createEmpresa(empresaData);

            console.log("Empresa creada:", empresaResult);
            
            if (!empresaResult) {
                throw new Error("Error al crear la empresa");
            }

            // 4. Mostrar éxito
            setSuccessOpen(true);
            setTimeout(() => navigate("/", { replace: true }), 5000);

        } catch (err: any) {
            console.error("Error en onSend:", err);
            setError(err?.message || "Error al procesar la solicitud");
        } finally {
            setLoading(false);
        }
    };

    const onBack = () => navigate(-1);

    if (!principal || !company) return null;

    return (
        <Box sx={{ minHeight: "100vh", background: theme.custom.gradients.appBg }}>
            
            {/* Contenido */}
            <Box
                sx={{
                    minHeight: "calc(100vh - 64px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 2,
                    py: 3,
                }}
            >
                <Card
                    sx={{
                        width: "100%",
                        maxWidth: 560,
                        px: { xs: 3, sm: 4 },
                        py: { xs: 3, sm: 4 },
                    }}
                >
                    {/* Encabezado de tarjeta */}
                    <Stack spacing={0.5} sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
                            Revisa tu información
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Verifica los datos antes de enviar la solicitud.
                        </Typography>
                    </Stack>

                    {/* Empresa */}
                    <SectionTitle>Empresa</SectionTitle>
                    <Stack spacing={1.25} sx={{ mb: 2 }}>
                        <Row label="Nombre" value={company.nombre} />
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {rubroShown && <Chip size="small" label={`Rubro: ${rubroShown}`} />}
                            <Chip
                                size="small"
                                color={company.isVirtual ? "info" : "success"}
                                label={`Modalidad: ${company.isVirtual ? "Virtual" : "Presencial"}`}
                            />
                        </Stack>
                    </Stack>

                    {/* Logo */}
                    <SectionTitle>Logo</SectionTitle>
                    <Stack sx={{ mb: 2 }}>
                        {logoURL ? (
                            <Box
                                component="img"
                                src={logoURL}
                                alt="Logo de la empresa"
                                sx={{
                                    display: "block",
                                    width: "auto",
                                    height: 72,
                                    maxWidth: "100%",
                                    objectFit: "contain",
                                    borderRadius: 1,
                                    border: 1,
                                    borderColor: "info.main",
                                    bgcolor: "common.white",
                                    p: 0.75,
                                }}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No proporcionado
                            </Typography>
                        )}
                    </Stack>

                    {/* Descripción (dinámica y resistente a textos largos) */}
                    {company.descripcion && (
                        <>
                            <SectionTitle>Descripción</SectionTitle>
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
                                    {company.descripcion}
                                </Typography>
                            </Box>
                        </>
                    )}

                    {/* Intereses */}
                    {company.intereses && company.intereses.length > 0 && (
                        <>
                            <SectionTitle>Rubros de interés</SectionTitle>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2 }}>
                                {company.intereses.map((it, idx) => (
                                    <Chip key={`${it}-${idx}`} label={it} size="small" />
                                ))}
                            </Stack>
                        </>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Encargado */}
                    <SectionTitle>Encargado</SectionTitle>
                    <Stack spacing={0.6} sx={{ mb: 2 }}>
                        <Row label="Nombre" value={`${principal.nombre} ${principal.apellido}`} />
                        <Row label="Correo" value={principal.email} />
                        <Row label="Usuario" value={principal.username} />
                        <Row label="Teléfono" value={principal.telefono} />
                        <Row label="Cargo" value="Encargado" />
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* Error */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* Acciones */}
                    <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                        <Button 
                            variant="contained" 
                            color="warning" 
                            fullWidth 
                            onClick={onBack}
                            disabled={loading}
                        >
                            Volver
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            sx={{ color: "#000" }}
                            onClick={onSend}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {loading ? "Enviando..." : "Enviar solicitud"}
                        </Button>
                    </Stack>
                </Card>
            </Box>

            {/* Overlay de éxito */}
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
                        Solicitud enviada correctamente
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Serás redirigido al inicio en 5 segundos…
                    </Typography>
                </Stack>
            </Backdrop>
        </Box>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <Typography
            variant="subtitle2"
            sx={{ fontWeight: 800, color: "text.secondary", mb: 0.75 }}
        >
            {children}
        </Typography>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ width: 140, color: "text.secondary" }}>{label}:</Typography>
            <Typography sx={{ fontWeight: 700, flex: 1, wordBreak: "break-word" }}>
                {value}
            </Typography>
        </Stack>
    );
}
