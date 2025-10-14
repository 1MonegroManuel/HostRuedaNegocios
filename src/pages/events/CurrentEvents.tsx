// src/pages/CurrentEvents.tsx
import { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    CardActions,
    IconButton,
    Stack,
    Alert,
    CircularProgress,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowBackIosNewOutlined from "@mui/icons-material/ArrowBackIosNewOutlined";
import { eventoService } from "../../apiService/services/eventoService";
import { archivoEventoService } from "../../apiService/services/archivoEventoService";
import type { Evento } from "../../apiService/types";

type EventCardProps = Evento & {
    bannerUrl?: string;
    onEdit: (id: string) => void;
    onDetail: (id: string) => void;
    onFinish: (id: string) => void;
};

function EventCard({
    _id,
    nombre,
    descripcion,
    logo_url,
    bannerUrl,
    inicio,
    estado,
    onEdit,
    onDetail,
    onFinish,
}: EventCardProps) {
    return (
        <Card
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 3 },
                borderRadius: 2,
                overflow: "hidden",
            }}
        >
            <CardMedia 
                component="img" 
                height="200" 
                image={bannerUrl || logo_url || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1470&auto=format&fit=crop"} 
                alt={nombre} 
                sx={{ objectFit: "cover" }} 
            />
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                    gutterBottom
                    variant="h6"
                    component="h3"
                    sx={{ fontWeight: 600, color: "primary.main", mb: 2 }}
                >
                    {nombre}
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        mb: 2,
                        minHeight: "60px",
                    }}
                >
                    {descripcion}
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: "auto", pt: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <EventNoteIcon fontSize="small" sx={{ color: "primary.main", opacity: 0.8 }} />
                        <Typography variant="body2" color="text.secondary">
                            {new Date(inicio).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LocationOnIcon fontSize="small" sx={{ color: "primary.main", opacity: 0.8 }} />
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: estado === 'ACTIVO' ? 'success.main' : 
                                      estado === 'FINALIZADO' ? 'text.secondary' : 
                                      estado === 'PROGRAMADO' ? 'info.main' : 'warning.main',
                                fontWeight: estado === 'ACTIVO' ? 600 : 400
                            }}
                        >
                            Estado: {estado}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>

            <CardActions sx={{ p: 2, pt: 0, mt: "auto" }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    gap: 1, 
                    width: '100%' 
                }}>
                    <Button
                        variant="contained"
                        onClick={() => onEdit(_id)}
                        sx={{
                            textTransform: "none",
                            bgcolor: "primary.main",
                            "&:hover": { bgcolor: "primary.main", opacity: 0.9 },
                            py: 1.5,
                            borderRadius: 2,
                            flex: 1,
                            minHeight: 44
                        }}
                    >
                        Editar
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => onDetail(_id)}
                        sx={{
                            textTransform: "none",
                            py: 1.5,
                            borderRadius: 2,
                            flex: 1,
                            minHeight: 44,
                            borderColor: "primary.main",
                            color: "primary.main",
                            "&:hover": {
                                borderColor: "primary.dark",
                                bgcolor: "primary.main",
                                color: "white"
                            }
                        }}
                    >
                        Detalle
                    </Button>
                    {/* Botón: Finalizar evento (solo para eventos activos) */}
                    {estado === 'ACTIVO' && (
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => onFinish(_id)}
                            sx={{
                                textTransform: "none",
                                py: 1.5,
                                borderRadius: 2,
                                flex: 1,
                                minHeight: 44,
                                bgcolor: "success.main",
                                "&:hover": { bgcolor: "success.dark" }
                            }}
                        >
                            Finalizar
                        </Button>
                    )}
                </Box>
            </CardActions>
        </Card>
    );
}

export default function CurrentEvents() {
    const [eventsWithBanners, setEventsWithBanners] = useState<(Evento & { bannerUrl?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<'todos' | 'activos' | 'programados' | 'finalizados'>('todos');
    const navigate = useNavigate();

    // Cargar eventos al montar el componente y cuando cambie el filtro
    useEffect(() => {
        const loadEvents = async () => {
            try {
                setLoading(true);
                setError(null);
                
                let response;
                switch (filtro) {
                    case 'todos':
                        response = await eventoService.getTodosEventos();
                        break;
                    case 'activos':
                        response = await eventoService.getEventosActivos();
                        break;
                    case 'programados':
                        response = await eventoService.getEventosProximos();
                        break;
                    case 'finalizados':
                        response = await eventoService.getEventosPasados();
                        break;
                    default:
                        response = await eventoService.getTodosEventos();
                }
                
                // Cargar banners para cada evento
                const eventsWithBannersData = await Promise.all(
                    (response.data || []).map(async (evento) => {
                        try {
                            const archivosResponse = await archivoEventoService.getArchivosByEvento(evento._id);
                            const banner = archivosResponse.data?.find(archivo => archivo.tipo === 'OTRO');
                            return {
                                ...evento,
                                bannerUrl: banner?.url
                            };
                        } catch (err) {
                            console.warn(`Error loading banner for event ${evento._id}:`, err);
                            return evento;
                        }
                    })
                );
                
                setEventsWithBanners(eventsWithBannersData);
            } catch (err: any) {
                setError(err?.message || 'Error al cargar eventos');
                console.error('Error loading events:', err);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, [filtro]);

    const goEdit = (id: string) => navigate(`/EditEvent/${id}`);
    const goDetail = (id: string) => navigate(`/EventDetail/${id}`);
    
    const finishEvent = async (id: string) => {
        try {
            await eventoService.cambiarEstadoEvento(id, 'FINALIZADO');
            // Actualizar la lista local
            setEventsWithBanners(prev => prev.filter(e => e._id !== id));
        } catch (err: any) {
            setError(err?.message || 'Error al finalizar evento');
            console.error('Error finishing event:', err);
        }
    };

    return (
        <Box sx={{ p: 2, backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
            {/* Header */}
            <Box sx={{ px: 2, pt: 1.5, pb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: "#1e4b46" }}>
                        <ArrowBackIosNewOutlined />
                    </IconButton>
                    <Typography variant="h2" sx={{ fontWeight: 800, color: "#1e4b46", fontSize: 26 }}>
                        Rueda de negocios
                    </Typography>
                </Stack>
            </Box>

            {/* Grid de eventos */}
            <Box sx={{ p: 3, maxWidth: "1400px", mx: "auto" }}>
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="h5"
                        component="h1"
                        sx={{ fontWeight: 600, color: "primary.main", mb: 2 }}
                    >
                        Eventos
                    </Typography>
                    
                    {/* Filtros con botones */}
                    <ToggleButtonGroup
                        value={filtro}
                        exclusive
                        onChange={(_, newFiltro) => newFiltro && setFiltro(newFiltro)}
                        aria-label="filtro eventos"
                        sx={{
                            '& .MuiToggleButton-root': {
                                textTransform: 'none',
                                fontWeight: 500,
                                px: 2,
                                py: 1,
                                borderRadius: 2,
                                border: '1px solid #e0e0e0',
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                    }
                                }
                            }
                        }}
                    >
                        <ToggleButton value="todos">Todos</ToggleButton>
                        <ToggleButton value="activos">Activos</ToggleButton>
                        <ToggleButton value="programados">Programados</ToggleButton>
                        <ToggleButton value="finalizados">Finalizados</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Mostrar errores */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Loading */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
                        gap: { xs: 2, sm: 3 },
                        px: { xs: 1, sm: 0 }
                    }}>
                        {eventsWithBanners.map((ev) => (
                            <EventCard
                                key={ev._id}
                                {...ev}
                                onEdit={goEdit}
                                onDetail={goDetail}
                                onFinish={finishEvent}
                            />
                        ))}
                        {eventsWithBanners.length === 0 && !loading && (
                            <Box sx={{ textAlign: "center", color: "text.secondary", py: 6, gridColumn: '1 / -1' }}>
                                <Typography variant="body1">
                                    {filtro === 'todos' && 'No hay eventos disponibles.'}
                                    {filtro === 'activos' && 'No hay eventos activos.'}
                                    {filtro === 'programados' && 'No hay eventos programados.'}
                                    {filtro === 'finalizados' && 'No hay eventos finalizados.'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
