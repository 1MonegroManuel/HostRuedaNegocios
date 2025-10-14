// src/pages/Notifications.tsx
import {
    Box,
    Card,
    CardActionArea,
    IconButton,
    Stack,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    Divider,
} from "@mui/material";
import {
    ArrowBackIosNewOutlined,
    CheckCircle,
    Cancel,
    Schedule,
    PersonAdd,
    Business,
    Event,
    Assignment,
    Notifications as NotificationsIcon,
    Email,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react";
import Navigation from "../../navigation/Navigation";
import theme from "../../theme/themes";
import { alpha } from "@mui/material/styles";
import { useAuth } from "../../contexts/AuthContext";
import { notificacionService, type Notificacion } from "../../apiService/services/notificacionService";

export default function Notifications() {
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'usuario' | 'empresa'>('usuario');

    const isAdmin = hasRole('admin');
    const isEncargado = hasRole('encargado');

    useEffect(() => {
        if (user) {
            loadNotificaciones();
        }
    }, [user, activeTab]);

    const loadNotificaciones = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔔 Cargando notificaciones para tab:', activeTab);
            console.log('🔔 Usuario actual:', user);

            let response;
            if (activeTab === 'usuario') {
                console.log('🔔 Llamando a getNotificacionesUsuario');
                response = await notificacionService.getNotificacionesUsuario();
            } else {
                console.log('🔔 Llamando a getNotificacionesEmpresa');
                response = await notificacionService.getNotificacionesEmpresa();
            }

            console.log('🔔 Respuesta recibida:', response);
            setNotificaciones(response.data || []);
        } catch (err) {
            console.error('❌ Error cargando notificaciones:', err);
            console.error('❌ Error details:', {
                message: (err as any)?.message,
                status: (err as any)?.status,
                response: (err as any)?.response
            });

            // Manejar diferentes tipos de errores
            const errorMessage = (err as any)?.message || '';
            if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
                if (activeTab === 'empresa') {
                    setError('No tienes empresa asociada o no hay notificaciones de empresa disponibles');
                } else {
                    setError('No se encontraron notificaciones');
                }
            } else {
                setError('Error al cargar las notificaciones');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notificacion: Notificacion) => {
        // Marcar como leída si no lo está
        if (notificacion.estado !== 'leida') {
            try {
                await notificacionService.marcarComoLeida(notificacion._id);
                // Actualizar el estado local
                setNotificaciones(prev =>
                    prev.map(n =>
                        n._id === notificacion._id
                            ? { ...n, estado: 'leida' as const }
                            : n
                    )
                );
            } catch (err) {
                console.error('Error marcando notificación como leída:', err);
            }
        }

        // Navegar según el tipo de notificación
        switch (notificacion.tipo) {
            case 'solicitud_aceptada':
            case 'solicitud_rechazada':
            case 'nueva_solicitud':
                navigate('/Meeting');
                break;
            case 'reunion_proxima':
                navigate('/Meeting');
                break;
            case 'empleado_registrado':
                navigate('/CompanyEmployees');
                break;
            case 'nueva_empresa':
                if (isAdmin) {
                    navigate('/ParticipantsSelect');
                } else {
                    navigate('/Home');
                }
                break;
            case 'cambio_estado_empresa':
            case 'mesa_asignada':
            case 'encargado_asignado':
                navigate('/Profile');
                break;
            case 'inicio_evento':
            case 'fin_evento':
                navigate('/Home');
                break;
            default:
                navigate('/Home');
                break;
        }
    };

    const getNotificationIcon = (tipo: string) => {
        switch (tipo) {
            case 'solicitud_aceptada':
                return <CheckCircle sx={{ color: '#4caf50' }} />;
            case 'solicitud_rechazada':
                return <Cancel sx={{ color: '#f44336' }} />;
            case 'nueva_solicitud':
                return <Assignment sx={{ color: '#2196f3' }} />;
            case 'reunion_proxima':
                return <Schedule sx={{ color: '#ff9800' }} />;
            case 'empleado_registrado':
                return <PersonAdd sx={{ color: '#9c27b0' }} />;
            case 'nueva_empresa':
                return <Business sx={{ color: '#607d8b' }} />;
            case 'cambio_estado_empresa':
            case 'mesa_asignada':
            case 'encargado_asignado':
                return <Business sx={{ color: '#795548' }} />;
            case 'inicio_evento':
            case 'fin_evento':
                return <Event sx={{ color: '#3f51b5' }} />;
            default:
                return <NotificationsIcon sx={{ color: '#666' }} />;
        }
    };

    const getCanalIcon = (canal: string) => {
        switch (canal) {
            case 'email':
                return <Email sx={{ fontSize: 16, color: '#666' }} />;
            case 'app':
                return <NotificationsIcon sx={{ fontSize: 16, color: '#666' }} />;
            default:
                return <NotificationsIcon sx={{ fontSize: 16, color: '#666' }} />;
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'leida':
                return 'default';
            case 'enviada':
                return 'success';
            case 'pendiente':
                return 'warning';
            case 'fallida':
                return 'error';
            default:
                return 'default';
        }
    };

    const getEstadoLabel = (estado: string) => {
        switch (estado) {
            case 'leida':
                return 'Leída';
            case 'enviada':
                return 'Enviada';
            case 'pendiente':
                return 'Pendiente';
            case 'fallida':
                return 'Fallida';
            default:
                return estado;
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#ffffffff",
                pb: "88px",
            }}
        >
            {/* Header */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: "#1e4b46" }}>
                        <ArrowBackIosNewOutlined />
                    </IconButton>
                    <Typography variant="h2" sx={{ fontWeight: 800, color: "#1e4b46", fontSize: 26 }}>
                        Rueda de negocios
                    </Typography>
                </Stack>
            </Box>

            {/* Tabs para diferentes tipos de notificaciones */}
            <Box sx={{ px: 2, mb: 2 }}>
                <Stack direction="row" spacing={1}>
                    <Chip
                        label="Mis Notificaciones"
                        variant={activeTab === 'usuario' ? 'filled' : 'outlined'}
                        color={activeTab === 'usuario' ? 'primary' : 'default'}
                        onClick={() => setActiveTab('usuario')}
                        sx={{
                            fontWeight: activeTab === 'usuario' ? 600 : 400,
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                        }}
                    />
                    {(isEncargado || isAdmin) && (
                        <Chip
                            label="Notificaciones de Empresa"
                            variant={activeTab === 'empresa' ? 'filled' : 'outlined'}
                            color={activeTab === 'empresa' ? 'primary' : 'default'}
                            onClick={() => setActiveTab('empresa')}
                            sx={{
                                fontWeight: activeTab === 'empresa' ? 600 : 400,
                                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                            }}
                        />
                    )}
                </Stack>
            </Box>

            {/* Listado */}
            <Box sx={{ px: 4 }}>
                <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 3 }}>
                    {activeTab === 'usuario' ? 'Mis Notificaciones' : 'Notificaciones de Empresa'}
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                ) : notificaciones.length === 0 ? (
                    <Card sx={{ p: 3, textAlign: 'center', backgroundColor: "#f6fdfc" }}>
                        <Typography variant="body1" color="text.secondary">
                            No tienes notificaciones
                        </Typography>
                    </Card>
                ) : (
                    <Stack spacing={2}>
                        {notificaciones.map((notificacion, index) => (
                            <React.Fragment key={notificacion._id}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: theme.custom.radii.card,
                                        backgroundColor: notificacion.estado === 'leida'
                                            ? alpha(theme.palette.primary.main, 0.08)
                                            : alpha(theme.palette.primary.main, 0.14),
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
                                        opacity: notificacion.estado === 'leida' ? 0.7 : 1,
                                    }}
                                >
                                    <CardActionArea
                                        onClick={() => handleNotificationClick(notificacion)}
                                        sx={{ p: 1.5, borderRadius: theme.custom.radii.card }}
                                    >
                                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                            {/* Icono de tipo de notificación */}
                                            <Box sx={{ mt: 0.5 }}>
                                                {getNotificationIcon(notificacion.tipo)}
                                            </Box>

                                            {/* Contenido principal */}
                                            <Box sx={{ flex: 1 }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                                                    <Typography sx={{
                                                        fontWeight: notificacion.estado === 'leida' ? 500 : 700,
                                                        color: "#000",
                                                        lineHeight: 1.25,
                                                        fontSize: '0.95rem'
                                                    }}>
                                                        {notificacion.titulo}
                                                    </Typography>

                                                    {/* Estado y canal */}
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        {getCanalIcon(notificacion.canal)}
                                                        <Chip
                                                            label={getEstadoLabel(notificacion.estado)}
                                                            size="small"
                                                            color={getEstadoColor(notificacion.estado) as any}
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                                        />
                                                    </Stack>
                                                </Stack>

                                                <Typography variant="body2" sx={{
                                                    color: "text.primary",
                                                    lineHeight: 1.4,
                                                    mb: 1
                                                }}>
                                                    {notificacion.mensaje}
                                                </Typography>

                                                {/* Información adicional del payload */}
                                                {notificacion.payload && (
                                                    <Box sx={{ mb: 1 }}>
                                                        {notificacion.payload.empresaObjetivo && (
                                                            <Typography variant="caption" sx={{
                                                                color: "text.secondary",
                                                                display: 'block',
                                                                fontWeight: 500
                                                            }}>
                                                                Empresa: {notificacion.payload.empresaObjetivo}
                                                            </Typography>
                                                        )}
                                                        {notificacion.payload.fechaReunion && (
                                                            <Typography variant="caption" sx={{
                                                                color: "text.secondary",
                                                                display: 'block'
                                                            }}>
                                                                Fecha: {new Date(notificacion.payload.fechaReunion).toLocaleDateString()}
                                                            </Typography>
                                                        )}
                                                        {notificacion.payload.tipoReunion && (
                                                            <Typography variant="caption" sx={{
                                                                color: "text.secondary",
                                                                display: 'block'
                                                            }}>
                                                                Tipo: {notificacion.payload.tipoReunion}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}

                                                <Typography variant="caption" sx={{
                                                    color: "text.secondary",
                                                    display: 'block'
                                                }}>
                                                    {new Date(notificacion.creada_en).toLocaleString()}
                                                </Typography>
                                            </Box>

                                            {/* Indicador de no leída */}
                                            {notificacion.estado !== 'leida' && (
                                                <Box
                                                    sx={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: theme.palette.primary.main,
                                                        mt: 0.5
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                    </CardActionArea>
                                </Card>

                                {/* Divider entre notificaciones */}
                                {index < notificaciones.length - 1 && (
                                    <Divider sx={{ opacity: 0.3 }} />
                                )}
                            </React.Fragment>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* Barra inferior reutilizable */}
            <Navigation />
        </Box>
    );
}
