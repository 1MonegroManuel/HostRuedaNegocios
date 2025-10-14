// src/pages/Home.tsx
import {
    Box,
    Button,
    Stack,
    Typography,
    Alert,
    styled
} from "@mui/material";
import type { ButtonProps } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import Navigation from "../../navigation/Navigation";
import { useAuth } from "../../contexts/AuthContext";
import { empresaService } from "../../apiService/services/empresaService";
import { useState, useEffect } from "react";
import { useEncuestasPendientes } from "../../hooks/useEncuestasPendientes";
import EncuestaPopup from "../../components/EncuestaPopup";

// Iconos para usuarios comunes
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupsIcon from '@mui/icons-material/Groups';
import MapIcon from '@mui/icons-material/Map';
import ScheduleIcon from '@mui/icons-material/Schedule';

// Iconos para administradores
import EventIcon from "@mui/icons-material/Event";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import QuizIcon from "@mui/icons-material/Quiz";

export default function Home() {
    const { user, hasRole, loading } = useAuth();
    const [empresa, setEmpresa] = useState<any>(null);
    const [empresaLoading, setEmpresaLoading] = useState(false);
    
    // Estados para encuestas
    const [showEncuestaPopup, setShowEncuestaPopup] = useState(false);
    const [currentEncuesta, setCurrentEncuesta] = useState<any>(null);
    
    const isAdmin = hasRole('admin');
    const isEncargado = hasRole('encargado');
    const isPersonal = hasRole('personal');
    
    // Hook para encuestas pendientes (solo para encargados)
    const { 
        encuestasPendientes, 
        hasEncuestasPendientes, 
        refetch: refetchEncuestas 
    } = useEncuestasPendientes(isEncargado && empresa?._id ? empresa._id : null);

    // Cargar empresa para encargados y personal
    useEffect(() => {
        const loadEmpresa = async () => {
            if ((hasRole("encargado") || hasRole("personal")) && user?._id) {
                setEmpresaLoading(true);
                try {
                    let empresaData;
                    if (hasRole("encargado")) {
                        console.log("Cargando empresa para encargado en Home:", user._id);
                        empresaData = await empresaService.getEmpresaByEncargado(user._id);
                    } else if (hasRole("personal")) {
                        console.log("Cargando empresa para personal en Home:", user._id);
                        empresaData = await empresaService.getEmpresaByPersonal(user._id);
                    }
                    console.log("Empresa cargada en Home:", empresaData);
                    setEmpresa(empresaData);
                } catch (error) {
                    console.error("Error loading empresa en Home:", error);
                    setEmpresa(null);
                } finally {
                    setEmpresaLoading(false);
                }
            }
        };

        loadEmpresa();
    }, [user, hasRole]);
    
    // Función para mostrar popup de encuesta
    const handleShowEncuesta = (encuesta: any) => {
        setCurrentEncuesta(encuesta);
        setShowEncuestaPopup(true);
    };
    
    // Función para cerrar popup de encuesta
    const handleCloseEncuesta = () => {
        setShowEncuestaPopup(false);
        setCurrentEncuesta(null);
    };
    
    // Función para cuando se envía exitosamente una encuesta
    const handleEncuestaSuccess = () => {
        refetchEncuestas();
    };

    // Si está cargando, mostrar loading
    if (loading || ((hasRole("encargado") || hasRole("personal")) && empresaLoading)) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#fff",
                }}
            >
                <Typography>Cargando...</Typography>
            </Box>
        );
    }

    // Si no hay usuario, redirigir al login
    if (!user) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#fff",
                }}
            >
                <Typography>Redirigiendo al login...</Typography>
            </Box>
        );
    }

    // Si es encargado y la empresa no está aceptada, mostrar mensaje
    if (isEncargado && empresa && empresa.estado !== 'aceptado') {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#fff",
                    px: 3,
                    pb: "88px",
                }}
            >
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, color: "#1e4b46", mb: 2, textAlign: "center" }}
                >
                    Acceso Restringido
                </Typography>
                <Typography
                    variant="body1"
                    sx={{ color: "#666", textAlign: "center", mb: 2 }}
                >
                    Tu empresa está en estado: <strong>{empresa.estado}</strong>
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ color: "#999", textAlign: "center" }}
                >
                    Solo puedes acceder a tu perfil y notificaciones hasta que tu empresa sea aceptada.
                </Typography>
            </Box>
        );
    }

    // Menú para usuarios comunes (personal, dueño)
    const commonMenu = [
        { 
            label: "Participantes", 
            to: empresa?.eventoId ? `/Participant/${empresa.eventoId}` : "#",
            icon: <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
        },
        { 
            label: "Citas del evento", 
            to: "/EventQuotes",
            icon: <EventNoteIcon sx={{ fontSize: 40, mb: 1 }} />
        },
        { 
            label: "Mis reuniones", 
            to: "/Meeting",
            icon: <GroupsIcon sx={{ fontSize: 40, mb: 1 }} />
        },
        { 
            label: "Mapa del lugar", 
            to: empresa?.eventoId ? `/PlaceMap/${empresa.eventoId}` : "#",
            icon: <MapIcon sx={{ fontSize: 40, mb: 1 }} />
        },
        { 
            label: "Cronograma de Charlas", 
            to: empresa?.eventoId ? `/Schedule/${empresa.eventoId}` : "#",
            icon: <ScheduleIcon sx={{ fontSize: 40, mb: 1 }} />
        },
    ];

    // Menú específico para usuarios PERSONAL (solo 3 opciones)
    const personalMenu = [
        { 
            label: "Citas del evento", 
            to: "/EventQuotes",
            icon: <EventNoteIcon sx={{ fontSize: 40, mb: 1 }} />
        },
        { 
            label: "Mapa del lugar", 
            to: empresa?.eventoId ? `/PlaceMap/${empresa.eventoId}` : "#",
            icon: <MapIcon sx={{ fontSize: 40, mb: 1 }} />
        },
        { 
            label: "Cronograma de Charlas", 
            to: empresa?.eventoId ? `/Schedule/${empresa.eventoId}` : "#",
            icon: <ScheduleIcon sx={{ fontSize: 40, mb: 1 }} />
        },
    ];

    // Debug: Log empresa state
    console.log("🏢 Home - empresa state:", empresa);
    console.log("🏢 Home - empresa.eventoId:", empresa?.eventoId);

    // Menú para administradores
    const adminMenu = [
        {
            label: "Registrar Evento",
            to: "/RegisterEvent",
            icon: <EventIcon sx={{ fontSize: 40, mb: 1 }} />,
        },
        {
            label: "Eventos Finalizados",
            to: "/EventFinished",
            icon: <EventAvailableIcon sx={{ fontSize: 40, mb: 1 }} />,
        },
        {
            label: "Aceptar Solicitudes",
            to: "/ParticipantsSelect",
            icon: <HowToRegIcon sx={{ fontSize: 40, mb: 1 }} />,
        },
        {
            label: "Eventos actuales",
            to: "/current-events",
            icon: <EventNoteIcon sx={{ fontSize: 40, mb: 1 }} />,
        },
    ];

    // Seleccionar el menú según el rol
    const getMenu = () => {
        if (isAdmin) return adminMenu;
        if (isEncargado) return commonMenu;
        if (isPersonal) return personalMenu;
        return [];
    };

    const menu = getMenu();
    
    const MenuButton = styled(Button)<ButtonProps & { component: typeof RouterLink; to: string }>(({ theme }) => ({
        display: 'flex',
        flexDirection: 'column',
        height: '160px',
        width: 'calc(50% - 8px)', // 50% width with gap between items
        borderRadius: '12px !important',
        padding: '16px',
        textTransform: 'none',
        boxShadow: theme.shadows[2],
        '&:hover': {
            boxShadow: theme.shadows[4],
        },
        '& .MuiButton-label': {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            height: '100%',
            justifyContent: 'center',
        },
    }));

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#fff",
                // deja espacio para la nav fija
                pb: "88px",
            }}
        >
            <Box sx={{ px: 3, pt: 3 }}>
                <Typography
                    variant="h2"
                    sx={{ fontWeight: 800, color: "#1e4b46", mb: 2, fontSize: 26 }}
                >
                    Rueda de negocios
                </Typography>

                {user && (
                    <Typography sx={{ fontWeight: 600, mb: 1, color: "#666" }}>
                        Bienvenido, {user.nombre} {user.apellido}
                    </Typography>
                )}

                <Typography sx={{ fontWeight: 700, mb: 2 }}>
                    {isAdmin ? "Panel de Administración" : 
                     isEncargado ? "Panel de Encargado" : 
                     isPersonal ? "Panel de Personal" : "Menú Principal"}
                </Typography>

                {/* Notificación de encuestas pendientes para encargados */}
                {isEncargado && hasEncuestasPendientes && (
                    <Box sx={{ mb: 3 }}>
                        <Alert 
                            severity="info" 
                            sx={{ 
                                borderRadius: 2,
                                '& .MuiAlert-message': { width: '100%' }
                            }}
                            action={
                                <Button 
                                    color="inherit" 
                                    size="small"
                                    onClick={() => handleShowEncuesta(encuestasPendientes[0])}
                                    startIcon={<QuizIcon />}
                                >
                                    Completar
                                </Button>
                            }
                        >
                            <Typography variant="body2">
                                Tienes {encuestasPendientes.length} encuesta{encuestasPendientes.length > 1 ? 's' : ''} pendiente{encuestasPendientes.length > 1 ? 's' : ''} de reuniones finalizadas.
                            </Typography>
                        </Alert>
                    </Box>
                )}

                <Stack 
                    direction="row" 
                    flexWrap="wrap" 
                    gap={2}
                    justifyContent="space-between"
                    sx={{ '& > *': { flex: '0 0 calc(50% - 8px)' } }}
                >
                    {menu.map((item, index) => (
                        <MenuButton
                            key={`${item.label}-${index}`}
                            component={RouterLink}
                            to={item.to}
                            variant="contained"
                            color="primary"
                        >
                            {item.icon}
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {item.label}
                            </Typography>
                        </MenuButton>
                    ))}
                </Stack>
            </Box>

            {/* Barra inferior reutilizable - diferente según el rol */}
            <Navigation />
            
            {/* Popup de Encuesta */}
            <EncuestaPopup
                open={showEncuestaPopup}
                onClose={handleCloseEncuesta}
                encuestaPendiente={currentEncuesta}
                empresaId={empresa?._id || ''}
                onSuccess={handleEncuestaSuccess}
            />
        </Box>
    );
}
