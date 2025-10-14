// src/pages/SelectEvents.tsx
import { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    Button,
    Chip,
    Avatar,
    CircularProgress,
    Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import theme from "../../theme/themes";
import { eventoService } from "../../apiService/services/eventoService";
import type { Evento } from "../../apiService/types";

type EventItem = Evento & {
    iconUrl?: string; // URL del icono/logo del evento
};

export default function SelectEvents() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string>("");

    // Cargar eventos disponibles
    useEffect(() => {
        const loadEvents = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Obtener eventos activos y próximos
                const response = await eventoService.getEventosActivos();
                const eventosData = response.data || [];
                
                // Cargar iconos para cada evento
                const eventsWithIcons = await Promise.all(
                    eventosData.map(async (evento) => {
                        try {
                            // Buscar el icono/logo del evento
                            const iconUrl = evento.logo_url || undefined;
                            return {
                                ...evento,
                                iconUrl
                            };
                        } catch (err) {
                            console.warn(`Error loading icon for event ${evento._id}:`, err);
                            return {
                                ...evento,
                                iconUrl: undefined
                            };
                        }
                    })
                );
                
                setEvents(eventsWithIcons);
            } catch (err: any) {
                setError(err?.message || 'Error al cargar eventos');
                console.error('Error loading events:', err);
            } finally {
                setLoading(false);
            }
        };
        
        loadEvents();
    }, []);

    const selectedEvent = events.find((e) => e._id === selectedEventId) || null;

    const onContinue = () => {
        if (!selectedEvent) return;
        navigate("/company-registration", { state: { selectedEvent } });
    };

    const onBack = () => navigate("/");

    if (loading) {
        return (
            <Box sx={{ 
                minHeight: "100vh", 
                background: theme.custom.gradients.appBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ 
                minHeight: "100vh", 
                background: theme.custom.gradients.appBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2
            }}>
                <Alert severity="error" sx={{ maxWidth: 400 }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", background: theme.custom.gradients.appBg, py: 2 }}>
            <Box sx={{ px: 2, maxWidth: 1200, mx: "auto" }}>
                <Typography variant="h2" sx={{ mb: 2, textAlign: "center", color: "primary.main" }}>
                    Seleccionar Evento
                </Typography>

                {/* Grid de eventos */}
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, 
                    gap: 1.5,
                    mb: 2 
                }}>
                    {events.map((event) => (
                        <EventCard
                            key={event._id}
                            event={event}
                            isSelected={selectedEventId === event._id}
                            onSelect={() => setSelectedEventId(event._id)}
                        />
                    ))}
                </Box>

                {/* Mensaje si no hay eventos */}
                {events.length === 0 && (
                    <Card sx={{ mb: 2, textAlign: 'center', py: 3 }}>
                        <Typography variant="h6" color="text.secondary">
                            No hay eventos disponibles para registro
                        </Typography>
                    </Card>
                )}

                {/* Evento seleccionado */}
                {selectedEvent && (
                    <Card sx={{ mb: 2, border: 2, borderColor: "primary.main", bgcolor: "primary.50" }}>
                        <CardContent sx={{ py: 1.5 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <CheckCircleIcon color="primary" sx={{ fontSize: 20 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {selectedEvent.nombre}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                {/* Botones de navegación */}
                <Stack direction="row" gap={2} justifyContent="center" sx={{ mt: 1 }}>
                    <Button 
                        variant="contained" 
                        color="warning" 
                        onClick={onBack}
                        sx={{ minWidth: 100, py: 1 }}
                    >
                        Atrás
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        sx={{ color: "#000", minWidth: 100, py: 1 }}
                        disabled={!selectedEvent}
                        onClick={onContinue}
                    >
                        Continuar
                    </Button>
                </Stack>
            </Box>
        </Box>
    );
}

/* ===================== Componente EventCard ===================== */

interface EventCardProps {
    event: EventItem;
    isSelected: boolean;
    onSelect: () => void;
}

function EventCard({ event, isSelected, onSelect }: EventCardProps) {
    return (
        <Card
            sx={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
                boxShadow: isSelected 
                    ? "0 8px 25px rgba(25, 118, 210, 0.3)" 
                    : "0 2px 8px rgba(0,0,0,0.1)",
                border: isSelected ? "2px solid" : "1px solid",
                borderColor: isSelected ? "primary.main" : "divider",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                },
            }}
            onClick={onSelect}
        >
            <CardContent sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                {/* Header con icono y título */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                    <Avatar
                        src={event.iconUrl}
                        alt={event.nombre}
                        sx={{ 
                            width: 40, 
                            height: 40,
                            bgcolor: "primary.main"
                        }}
                    >
                        {event.nombre.charAt(0)}
                    </Avatar>
                    <Typography 
                        variant="subtitle1" 
                        sx={{ 
                            fontWeight: 600, 
                            fontSize: "0.9rem",
                            lineHeight: 1.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical"
                        }}
                    >
                        {event.nombre}
                    </Typography>
                </Stack>
                
                {/* Chips informativos */}
                <Stack spacing={0.5} sx={{ mb: 1 }}>
                    <Chip
                        size="small"
                        icon={<EventNoteIcon sx={{ fontSize: 14 }} />}
                        label={new Date(event.inicio).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        })}
                        variant="outlined"
                        color="primary"
                        sx={{ fontSize: "0.7rem", height: 20 }}
                    />
                    <Chip
                        size="small"
                        icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
                        label={`${event.numero_mesas} mesas`}
                        variant="outlined"
                        color="secondary"
                        sx={{ fontSize: "0.7rem", height: 20 }}
                    />
                </Stack>

                {/* Indicador de selección */}
                {isSelected && (
                    <Box sx={{ mt: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                            label="Seleccionado"
                            color="primary"
                            variant="filled"
                            size="small"
                            sx={{ fontSize: "0.7rem" }}
                        />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
