// src/pages/EventDetail.tsx
import { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Stack,
    Chip,
    IconButton,
    Link,
    Divider,
    Paper,
    Alert,
    CircularProgress,
    Button,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIosNewOutlined from "@mui/icons-material/ArrowBackIosNewOutlined";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { eventoService } from "../../apiService/services/eventoService";
import { archivoEventoService } from "../../apiService/services/archivoEventoService";
import type { Evento, ArchivoEvento } from "../../apiService/types";

function getFileName(url?: string | null) {
    if (!url) return "";
    try {
        const u = new URL(url);
        const last = u.pathname.split("/").filter(Boolean).pop() || url;
        return decodeURIComponent(last);
    } catch {
        const parts = (url || "").split("?")[0].split("#")[0].split("/");
        return parts[parts.length - 1] || url!;
    }
}

const EventDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [evento, setEvento] = useState<Evento | null>(null);
    const [archivos, setArchivos] = useState<ArchivoEvento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [finishing, setFinishing] = useState(false);

    // Cargar datos del evento
    useEffect(() => {
        const loadEventData = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Cargar evento
                const eventoData = await eventoService.getEvento(id);
                setEvento(eventoData);
                
                // Cargar archivos del evento
                try {
                    const archivosData = await archivoEventoService.getArchivosByEvento(id);
                    setArchivos(archivosData.data || []);
                } catch (archivoError) {
                    console.warn('Error loading files:', archivoError);
                    setArchivos([]);
                }
            } catch (err: any) {
                setError(err?.message || 'Error al cargar el evento');
                console.error('Error loading event:', err);
            } finally {
                setLoading(false);
            }
        };
        
        loadEventData();
    }, [id]);

    const handleFinishEvent = async () => {
        if (!evento) return;
        
        try {
            setFinishing(true);
            await eventoService.cambiarEstadoEvento(evento._id, 'FINALIZADO');
            navigate('/home'); // Volver al home después de finalizar
        } catch (err: any) {
            setError(err?.message || 'Error al finalizar evento');
            console.error('Error finishing event:', err);
        } finally {
            setFinishing(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !evento) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || 'Evento no encontrado'}</Alert>
                <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
                    Volver
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", pb: 3, backgroundColor: "background.default" }}>
            {/* Header simple con back */}
            <Paper
                elevation={0}
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    px: 2,
                    py: 1.5,
                    borderRadius: 0,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => navigate(-1)} size="small">
                        <ArrowBackIosNewOutlined />
                    </IconButton>
                    <Typography variant="h2" sx={{ fontWeight: 800, fontSize: 22 }}>
                        Detalle del evento
                    </Typography>
                </Stack>
            </Paper>

            <Stack spacing={2} sx={{ maxWidth: 980, mx: "auto", px: 2, mt: 2 }}>
                {/* Portada + título + chips */}
                <Card>
                    <Box sx={{ position: "relative" }}>
                        <CardMedia
                            component="img"
                            height="220"
                            image={evento.logo_url || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1470&auto=format&fit=crop"}
                            alt={evento.nombre}
                            sx={{ objectFit: "cover" }}
                        />
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "flex-end",
                                p: 2,
                                background:
                                    "linear-gradient(180deg, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.45) 100%)",
                                color: "#fff",
                            }}
                        >
                            <Stack spacing={0.75} sx={{ width: "100%" }}>
                                <Typography
                                    variant="h5"
                                    sx={{ fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,.35)" }}
                                >
                                    {evento.nombre}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    <Chip
                                        size="small"
                                        icon={<EventNoteIcon sx={{ fontSize: 18, color: "#fff" }} />}
                                        label={new Date(evento.inicio).toLocaleDateString("es-ES", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                        sx={{
                                            bgcolor: "rgba(255,255,255,0.18)",
                                            color: "#fff",
                                            "& .MuiChip-icon": { color: "#fff" },
                                        }}
                                    />
                                    <Chip
                                        size="small"
                                        icon={<LocationOnIcon sx={{ fontSize: 18, color: "#fff" }} />}
                                        label={`Estado: ${evento.estado}`}
                                        sx={{
                                            bgcolor: "rgba(255,255,255,0.18)",
                                            color: "#fff",
                                            "& .MuiChip-icon": { color: "#fff" },
                                        }}
                                    />
                                </Stack>
                            </Stack>
                        </Box>
                    </Box>
                </Card>

                {/* Información general */}
                <Card variant={"soft" as any}>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            Información del evento
                        </Typography>
                        <Stack spacing={1.25}>
                            <Field label="Título" value={evento.nombre} />
                            <Field
                                label="Descripción"
                                value={evento.descripcion}
                                multiline
                            />
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                                <Field
                                    label="Fecha de inicio"
                                    value={new Date(evento.inicio).toLocaleDateString("es-ES", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                />
                                <Field
                                    label="Fecha de fin"
                                    value={new Date(evento.fin).toLocaleDateString("es-ES", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                />
                            </Stack>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                                <Field
                                    label="Duración de reunión"
                                    value={`${evento.duracion_minutos_reunion} minutos`}
                                />
                                <Field
                                    label="Modo de mesas"
                                    value={evento.modo_mesas === 'FIJA_POR_EMPRESA' ? 'Fija por empresa' : 'Por reunión'}
                                />
                            </Stack>
                            <Field
                                label="Estado"
                                value={evento.estado}
                            />
                        </Stack>
                    </CardContent>
                </Card>

                {/* Archivos (solo enlaces) */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            Archivos
                        </Typography>

                        <Stack spacing={1.25} divider={<Divider flexItem />}>
                            {archivos.map((archivo) => (
                                <FileLinkRow 
                                    key={archivo._id}
                                    title={archivo.nombre_archivo || `Archivo ${archivo.tipo}`}
                                    url={archivo.url}
                                />
                            ))}
                            {archivos.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    No hay archivos cargados para este evento.
                                </Typography>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {/* Botón para finalizar evento */}
                {evento.estado === 'ACTIVO' && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                Acciones del evento
                            </Typography>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleFinishEvent}
                                disabled={finishing}
                                startIcon={finishing ? <CircularProgress size={20} /> : null}
                                sx={{ textTransform: 'none' }}
                            >
                                {finishing ? 'Finalizando...' : 'Finalizar evento'}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </Stack>
        </Box>
    );
};

export default EventDetail;

/* ---------- Subcomponentes ---------- */

function Field({
    label,
    value,
    multiline,
}: {
    label: string;
    value: string;
    multiline?: boolean;
}) {
    return (
        <Stack spacing={0.5}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                {label}
            </Typography>
            <Typography
                variant="body1"
                sx={{
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    whiteSpace: multiline ? "pre-wrap" : "normal",
                    wordBreak: "break-word",
                    minHeight: multiline ? "auto" : undefined,
                    height: multiline ? "auto" : undefined,
                    maxHeight: multiline ? "none" : undefined,
                    overflow: multiline ? "visible" : undefined,
                    display: multiline ? "block" : undefined,
                    lineHeight: multiline ? 1.5 : undefined,
                }}
            >
                {value || "—"}
            </Typography>
        </Stack>
    );
}

function FileLinkRow({ title, url }: { title: string; url?: string | null }) {
    const fileName = getFileName(url);
    return (
        <Stack spacing={0.5}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                {title}
            </Typography>
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                }}
            >
                <DescriptionOutlinedIcon fontSize="small" color="action" />
                {url ? (
                    <Link href={url} target="_blank" rel="noopener" underline="hover" sx={{ fontWeight: 600 }}>
                        {fileName}
                    </Link>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No hay archivo cargado
                    </Typography>
                )}
            </Stack>
        </Stack>
    );
}
