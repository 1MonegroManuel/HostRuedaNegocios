// src/pages/Profile.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    IconButton,
    Stack,
    TextField,
    Typography,
    CircularProgress,
    Chip,
} from "@mui/material";
import { ArrowBackIosNewOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Navigation from "../../navigation/Navigation";
import theme from "../../theme/themes";
import { useAuth } from "../../contexts/AuthContext";
import { empresaService } from "../../apiService/services/empresaService";
import { mesaService } from "../../apiService/services/mesaService";
import { eventoService } from "../../apiService/services/eventoService";

export default function Profile() {
    const navigate = useNavigate();
    const { user, loading, logout, hasRole } = useAuth();
    const [empresa, setEmpresa] = useState<any>(null);
    const [empresaLoading, setEmpresaLoading] = useState(false);
    const [mesaInfo, setMesaInfo] = useState<any>(null);
    const [eventoInfo, setEventoInfo] = useState<any>(null);

    // Cargar empresa para encargados y personal
    useEffect(() => {
        const loadEmpresa = async () => {
            if ((hasRole("encargado") || hasRole("personal")) && user?._id) {
                setEmpresaLoading(true);
                try {
                    let empresaData;
                    if (hasRole("encargado")) {
                        console.log("Cargando empresa para encargado:", user._id);
                        empresaData = await empresaService.getEmpresaByEncargado(user._id);
                    } else if (hasRole("personal")) {
                        console.log("Cargando empresa para personal:", user._id);
                        empresaData = await empresaService.getEmpresaByPersonal(user._id);
                    }
                    console.log("Empresa cargada:", empresaData);
                    setEmpresa(empresaData);
                    
                    // Cargar información de la mesa si está asignada
                    if (empresaData?.mesaId) {
                        try {
                            const mesa = await mesaService.getMesa(empresaData.mesaId);
                            console.log("Mesa cargada:", mesa);
                            setMesaInfo(mesa);
                        } catch (error) {
                            console.error("Error loading mesa:", error);
                            setMesaInfo(null);
                        }
                    }
                    
                    // Cargar información del evento
                    if (empresaData?.eventoId) {
                        try {
                            const evento = await eventoService.getEvento(empresaData.eventoId);
                            console.log("Evento cargado:", evento);
                            setEventoInfo(evento);
                        } catch (error) {
                            console.error("Error loading evento:", error);
                            setEventoInfo(null);
                        }
                    }
                } catch (error) {
                    console.error("Error loading empresa:", error);
                    setEmpresa(null);
                } finally {
                    setEmpresaLoading(false);
                }
            }
        };

        loadEmpresa();
    }, [user, hasRole]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate("/", { replace: true });
            }
        }
    }, [loading, user, navigate]);

    // ✅ TODOS LOS HOOKS Y LÓGICA AL INICIO
    const isAdmin = hasRole("admin");
    const isEncargado = hasRole("encargado");
    const isPersonal = hasRole("personal");

    const fullName = useMemo(() => {
        if (!user) return "";
        const nombre = user.nombre ?? "";
        const apellido = user.apellido ?? "";
        return `${nombre} ${apellido}`.trim();
    }, [user]);

    const goBack = () => navigate(-1);

    const onLogout = async () => {
        await logout();
        navigate("/", { replace: true });
    };

    // ✅ CONDICIONES DE RENDERIZADO AL FINAL
    if (loading || !user || ((hasRole("encargado") || hasRole("personal")) && empresaLoading)) {
        return (
            <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    // ✅ AQUÍ user YA NO ES NULL
    const safeUser = user!;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#fff",
                pb: "88px", // espacio para la bottom nav
            }}
        >
            {/* Header */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={goBack} size="small" sx={{ color: "#1e4b46" }}>
                        <ArrowBackIosNewOutlined />
                    </IconButton>
                    <Typography
                        variant="h2"
                        sx={{ fontWeight: 800, color: "#1e4b46", fontSize: 26 }}
                    >
                        {isAdmin ? "Panel Admin" : "Rueda de negocios"}
                    </Typography>
                </Stack>
            </Box>

            {/* Contenido */}
            <Box sx={{ px: 3 }}>
                <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 1.5 }}>
                    Mis datos
                </Typography>

                <Card sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        {/* Nombre completo */}
                        <Box>
                            <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                Nombre
                            </Typography>
                            <TextField
                                fullWidth
                                value={fullName}
                                disabled
                                placeholder="Tu nombre completo"
                            />
                        </Box>

                        {/* Email */}
                        <Box>
                            <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                Correo Electrónico
                            </Typography>
                            <TextField
                                fullWidth
                                type="email"
                                value={safeUser.email ?? ""}
                                disabled
                                placeholder="correo@dominio.com"
                            />
                        </Box>

                        {/* Teléfono (si existe) */}
                        {safeUser.telefono && (
                            <Box>
                                <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                    Teléfono
                                </Typography>
                                <TextField
                                    fullWidth
                                    value={safeUser.telefono}
                                    disabled
                                    placeholder="Tu teléfono"
                                />
                            </Box>
                        )}

                        {/* Tipo de usuario */}
                        <Box>
                            <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                Tipo de Usuario
                            </Typography>
                            <TextField
                                fullWidth
                                value={safeUser.tipoUsuario === 'admin' ? 'Administrador' : 
                                      safeUser.tipoUsuario === 'encargado' ? 'Encargado' : 
                                      safeUser.tipoUsuario === 'personal' ? 'Personal' : safeUser.tipoUsuario}
                                disabled
                                placeholder="Tipo de usuario"
                            />
                        </Box>
                    </Stack>
                </Card>

                {/* Información de la empresa para encargados y personal */}
                {(isEncargado || isPersonal) && (
                    <>
                        <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 1.5, mt: 3 }}>
                            Información de la empresa
                        </Typography>

                        <Card sx={{ p: 2 }}>
                            <Stack spacing={2}>
                                {/* Nombre de la empresa */}
                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Nombre de la empresa
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        value={empresa?.nombre || "Cargando..."}
                                        disabled
                                        placeholder="Nombre de la empresa"
                                    />
                                </Box>

                                {/* Estado de la empresa */}
                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Estado de la empresa
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Chip
                                            label={
                                                empresa?.estado === 'aceptado' ? 'Aceptado' :
                                                empresa?.estado === 'rechazado' ? 'Rechazado' :
                                                empresa?.estado === 'pendiente' ? 'Pendiente' : 'Cargando...'
                                            }
                                            color={
                                                empresa?.estado === 'aceptado' ? 'success' :
                                                empresa?.estado === 'rechazado' ? 'error' :
                                                empresa?.estado === 'pendiente' ? 'warning' : 'default'
                                            }
                                            variant="filled"
                                        />
                                    </Box>
                                </Box>

                                {/* Información de la mesa asignada */}
                                {empresa?.estado === 'aceptado' && mesaInfo && (
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                            Mesa asignada
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            value={`${mesaInfo.nombre || `Mesa ${mesaInfo.numero}`}${mesaInfo.capacidad ? ` (Capacidad: ${mesaInfo.capacidad})` : ''}`}
                                            disabled
                                            placeholder="Información de la mesa"
                                        />
                                    </Box>
                                )}

                                {/* Rubro de la empresa */}
                                {empresa?.rubro && (
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                            Rubro
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            value={empresa.rubro}
                                            disabled
                                            placeholder="Rubro de la empresa"
                                        />
                                    </Box>
                                )}

                                {/* Información del evento */}
                                {eventoInfo && (
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                            Evento
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            value={eventoInfo.nombre}
                                            disabled
                                            placeholder="Nombre del evento"
                                        />
                                    </Box>
                                )}

                                {/* Fechas del evento */}
                                {eventoInfo && (
                                    <Box>
                                        <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                            Fechas del evento
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            value={`${new Date(eventoInfo.inicio).toLocaleDateString()} - ${new Date(eventoInfo.fin).toLocaleDateString()}`}
                                            disabled
                                            placeholder="Fechas del evento"
                                        />
                                    </Box>
                                )}
                            </Stack>
                        </Card>
                    </>
                )}

                {/* Botones */}
                <Stack spacing={2} sx={{ mt: 3 }}>
                    {/* Botones específicos por tipo de usuario */}
                    {!isAdmin && !isPersonal && (
                        <>
                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                sx={{
                                    color: "#000",
                                    borderRadius: theme.custom.radii.pill,
                                    py: 1.2,
                                    fontWeight: 700,
                                }}
                                onClick={() => navigate("/EditProfile")}
                            >
                                Editar Información
                            </Button>
                            
                            {isEncargado && (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="info"
                                    sx={{
                                        color: "#000",
                                        borderRadius: theme.custom.radii.pill,
                                        py: 1.2,
                                        fontWeight: 700,
                                    }}
                                    onClick={() => navigate("/AddCompanions")}
                                >
                                    Añadir Acompañantes
                                </Button>
                            )}

                            {/* Botón para ver empleados (solo encargados) */}
                            {isEncargado && (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    sx={{
                                        color: "#000",
                                        borderRadius: theme.custom.radii.pill,
                                        py: 1.2,
                                        fontWeight: 700,
                                    }}
                                    onClick={() => navigate("/CompanyEmployees")}
                                >
                                    Ver Empleados
                                </Button>
                            )}
                        </>
                    )}

                    {/* Botón de cerrar sesión para todos */}
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{
                            backgroundColor: "#FF2D2D",
                            color: "#000",
                            borderRadius: theme.custom.radii.pill,
                            py: 1.2,
                            fontWeight: 700,
                            "&:hover": { backgroundColor: "#e12727" },
                        }}
                        onClick={onLogout}
                    >
                        Cerrar Sesión
                    </Button>
                </Stack>
            </Box>

            {/* Navegación inferior */}
            <Navigation />
        </Box>
    );
}
