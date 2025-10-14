// src/pages/EditEvent.tsx
import { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    TextField,
    Typography,
    Button,
    Stack,
    IconButton,
    Chip,
    Paper,
    Link,
    Alert,
    CircularProgress,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIosNewOutlined from "@mui/icons-material/ArrowBackIosNewOutlined";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { eventoService } from "../../apiService/services/eventoService";
import { archivoEventoService } from "../../apiService/services/archivoEventoService";
import { storageService } from "../../apiService/services/storageService";
import type { Evento } from "../../apiService/types";

/* ===================== Util ===================== */

function getFileName(url?: string | null) {
    if (!url) return "";
    try {
        const u = new URL(url);
        const last = u.pathname.split("/").filter(Boolean).pop() || url;
        return decodeURIComponent(last);
    } catch {
        // si no es URL absoluta
        const parts = url.split("?")[0].split("#")[0].split("/");
        return parts[parts.length - 1] || url;
    }
}

const isPdfUrl = (url?: string | null) => !!url && /\.pdf(\?|$)/i.test(url);

export default function EditEvent() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    
    // Estados para el evento
    const [evento, setEvento] = useState<Evento | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Campos editables
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [inicio, setInicio] = useState("");
    const [fin, setFin] = useState("");
    const [duracionReunion, setDuracionReunion] = useState("");
    const [numeroMesas, setNumeroMesas] = useState("");
    const [modoMesas, setModoMesas] = useState<'FIJA_POR_EMPRESA' | 'POR_REUNION'>('FIJA_POR_EMPRESA');
    
    // URLs de archivos
    const [portadaUrl, setPortadaUrl] = useState<string | null>(null);
    const [mapaUrl, setMapaUrl] = useState<string | null>(null);
    const [cronogramaUrl, setCronogramaUrl] = useState<string | null>(null);
    
    // IDs de archivos para actualización
    const [portadaId, setPortadaId] = useState<string | null>(null);
    const [mapaId, setMapaId] = useState<string | null>(null);
    const [cronogramaId, setCronogramaId] = useState<string | null>(null);

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
                const archivosData = await archivoEventoService.getArchivosByEvento(id);
                
                // Separar archivos por tipo
                const portada = archivosData.data?.find(a => a.tipo === 'OTRO');
                const mapa = archivosData.data?.find(a => a.tipo === 'MAPA');
                const cronograma = archivosData.data?.find(a => a.tipo === 'CRONOGRAMA');
                
                // Establecer URLs e IDs
                if (portada) {
                    setPortadaUrl(portada.url);
                    setPortadaId(portada._id);
                }
                if (mapa) {
                    setMapaUrl(mapa.url);
                    setMapaId(mapa._id);
                }
                if (cronograma) {
                    setCronogramaUrl(cronograma.url);
                    setCronogramaId(cronograma._id);
                }
                
                // Establecer campos del formulario
                setNombre(eventoData.nombre || "");
                setDescripcion(eventoData.descripcion || "");
                setInicio(new Date(eventoData.inicio).toISOString().slice(0, 16));
                setFin(new Date(eventoData.fin).toISOString().slice(0, 16));
                setDuracionReunion(eventoData.duracion_minutos_reunion.toString());
                setNumeroMesas(eventoData.numero_mesas.toString());
                setModoMesas(eventoData.modo_mesas);
                
            } catch (err: any) {
                setError(err?.message || 'Error al cargar el evento');
                console.error('Error loading event:', err);
            } finally {
                setLoading(false);
            }
        };
        
        loadEventData();
    }, [id]);

    // Función para subir archivo y mantener URL
    const uploadFile = async (file: File, tipo: 'OTRO' | 'MAPA' | 'CRONOGRAMA', archivoId?: string) => {
        try {
            let uploadResult;
            
            // Si hay una URL existente, usar replaceFile para mantener la URL
            const existingUrl = tipo === 'OTRO' ? portadaUrl : 
                               tipo === 'MAPA' ? mapaUrl : cronogramaUrl;
            
            if (existingUrl && archivoId) {
                // CASO 1: Reemplazar archivo existente manteniendo la URL
                uploadResult = await storageService.replaceFile(file, existingUrl);
                
                // Actualizar el registro existente con la nueva URL (por si cambió)
                await archivoEventoService.updateArchivo(archivoId, {
                    url: uploadResult.url,        // Actualizar URL por si cambió
                    nombre_archivo: file.name,    // Nuevo nombre
                    mime: file.type              // Nuevo tipo MIME
                });
            } else {
                // CASO 2: Subir archivo nuevo (primera vez)
                uploadResult = await storageService.uploadFile(file, `eventos/${tipo.toLowerCase()}s`);
                
                // Crear nuevo registro
                await archivoEventoService.createArchivo({
                    eventoId: id!,
                    tipo,
                    url: uploadResult.url,
                    nombre_archivo: file.name,
                    mime: file.type
                });
            }
            
            return uploadResult.url;
        } catch (err: any) {
            throw new Error(`Error al subir archivo: ${err?.message || 'Desconocido'}`);
        }
    };

    const pickFile = (accept: string, tipo: 'OTRO' | 'MAPA' | 'CRONOGRAMA') => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            
            try {
                setSaving(true);
                const url = await uploadFile(file, tipo, 
                    tipo === 'OTRO' ? portadaId || undefined : 
                    tipo === 'MAPA' ? mapaId || undefined : cronogramaId || undefined
                );
                
                // Actualizar URL local
                if (tipo === 'OTRO') {
                    setPortadaUrl(url);
                    if (!portadaId) {
                        // Si es nuevo archivo, recargar la lista
                        const archivosData = await archivoEventoService.getArchivosByEvento(id!);
                        const portada = archivosData.data?.find(a => a.tipo === 'OTRO');
                        if (portada) setPortadaId(portada._id);
                    }
                } else if (tipo === 'MAPA') {
                    setMapaUrl(url);
                    if (!mapaId) {
                        const archivosData = await archivoEventoService.getArchivosByEvento(id!);
                        const mapa = archivosData.data?.find(a => a.tipo === 'MAPA');
                        if (mapa) setMapaId(mapa._id);
                    }
                } else if (tipo === 'CRONOGRAMA') {
                    setCronogramaUrl(url);
                    if (!cronogramaId) {
                        const archivosData = await archivoEventoService.getArchivosByEvento(id!);
                        const cronograma = archivosData.data?.find(a => a.tipo === 'CRONOGRAMA');
                        if (cronograma) setCronogramaId(cronograma._id);
                    }
                }
            } catch (err: any) {
                setError(err?.message || 'Error al subir archivo');
            } finally {
                setSaving(false);
            }
        };
        input.click();
    };

    const handlePickCover = () => pickFile("image/*", 'OTRO');
    const handlePickMap = () => pickFile("image/*,application/pdf", 'MAPA');
    const handlePickSchedule = () => pickFile("image/*,application/pdf", 'CRONOGRAMA');

    const onDownload = (url?: string | null) => {
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    // Guardar cambios del evento
    const handleSave = async () => {
        if (!evento) return;
        
        try {
            setSaving(true);
            setError(null);
            
            await eventoService.updateEvento(evento._id, {
                nombre,
                descripcion,
                inicio: new Date(inicio).toISOString(),
                fin: new Date(fin).toISOString(),
                duracion_minutos_reunion: parseInt(duracionReunion),
                numero_mesas: parseInt(numeroMesas),
                modo_mesas: modoMesas
            });
            
            navigate('/current-events');
        } catch (err: any) {
            setError(err?.message || 'Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!evento) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6">Evento no encontrado</Typography>
                <Button onClick={() => navigate('/current-events')} sx={{ mt: 2 }}>
                    Volver a eventos
                </Button>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                pb: 3,
                backgroundColor: "background.default",
            }}
        >
            {/* Header */}
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
                        Editar evento
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : null}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </Stack>
            </Paper>

            {/* Mostrar errores */}
            {error && (
                <Box sx={{ p: 2 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            )}

            {/* Contenido */}
            <Stack spacing={2} sx={{ maxWidth: 980, mx: "auto", px: 2, mt: 2 }}>
                {/* Portada */}
                <Card>
                    <Box sx={{ position: "relative" }}>
                        <CardMedia
                            component="img"
                            height="220"
                            image={portadaUrl || evento.logo_url || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1470&auto=format&fit=crop"}
                            alt="portada"
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
                            <Stack spacing={0.5} sx={{ width: "100%" }}>
                                <Typography
                                    variant="h5"
                                    sx={{ fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,.35)" }}
                                >
                                    {nombre || "Sin título"}
                                </Typography>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    flexWrap="wrap"
                                >
                                    <Chip
                                        size="small"
                                        icon={<EventNoteIcon sx={{ fontSize: 18, color: "#fff" }} />}
                                        label={new Date(inicio).toLocaleDateString("es-ES", {
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
                                        label={`${numeroMesas} mesas`}
                                        sx={{
                                            bgcolor: "rgba(255,255,255,0.18)",
                                            color: "#fff",
                                            "& .MuiChip-icon": { color: "#fff" },
                                        }}
                                    />
                                    <Box sx={{ flex: 1 }} />
                                    <Button
                                        variant="outlined"
                                        startIcon={<UploadIcon />}
                                        onClick={handlePickCover}
                                        disabled={saving}
                                        sx={{
                                            color: "#fff",
                                            borderColor: "rgba(255,255,255,0.7)",
                                            "&:hover": {
                                                borderColor: "#fff",
                                                bgcolor: "rgba(255,255,255,0.08)",
                                            },
                                        }}
                                        size="small"
                                    >
                                        Cambiar portada
                                    </Button>
                                </Stack>
                            </Stack>
                        </Box>
                    </Box>
                </Card>

                {/* Form principal */}
                <Card sx={{ overflow: 'hidden' }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            mb: 3, 
                            color: "text.primary"
                        }}>
                            Información del evento
                        </Typography>

                        <Stack spacing={2}>
                            <TextField
                                label="Nombre del evento"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                fullWidth
                                variant="outlined"
                            />

                            <TextField
                                label="Descripción"
                                value={descripcion || ""}
                                onChange={(e) => setDescripcion(e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                                variant="outlined"
                                placeholder="Describe el evento..."
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& textarea': {
                                            width: '100% !important',
                                            maxWidth: '100% !important',
                                            overflow: 'hidden !important',
                                            wordWrap: 'break-word !important',
                                            wordBreak: 'break-word !important',
                                            whiteSpace: 'pre-wrap !important',
                                            resize: 'vertical !important',
                                            minHeight: '80px !important',
                                            maxHeight: '200px !important',
                                        }
                                    }
                                }}
                            />

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                <TextField
                                    label="Fecha de inicio"
                                    type="datetime-local"
                                    value={inicio}
                                    onChange={(e) => setInicio(e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Fecha de fin"
                                    type="datetime-local"
                                    value={fin}
                                    onChange={(e) => setFin(e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                <TextField
                                    label="Duración de reunión (minutos)"
                                    type="number"
                                    value={duracionReunion}
                                    onChange={(e) => setDuracionReunion(e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    inputProps={{ min: 1 }}
                                />
                                <TextField
                                    label="Número de mesas"
                                    type="number"
                                    value={numeroMesas}
                                    onChange={(e) => setNumeroMesas(e.target.value)}
                                    fullWidth
                                    variant="outlined"
                                    inputProps={{ min: 1 }}
                                />
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Mapa */}
                <FileRowNoPreview
                    title="Mapa del evento"
                    url={mapaUrl}
                    onUpload={handlePickMap}
                    onOpen={() => onDownload(mapaUrl)}
                    saving={saving}
                />

                {/* Cronograma */}
                <FileRowNoPreview
                    title="Cronograma del evento"
                    url={cronogramaUrl}
                    onUpload={handlePickSchedule}
                    onOpen={() => onDownload(cronogramaUrl)}
                    saving={saving}
                />
            </Stack>
        </Box>
    );
}

/* ===================== Subcomponentes ===================== */

/**
 * Muestra SOLO el nombre del archivo con icono + link,
 * y botones pequeños "Subir/Reemplazar" y "Descargar".
 * Sin botón "Quitar" y responsivo (fullWidth en mobile).
 */
function FileRowNoPreview({
    title,
    url,
    onUpload,
    onOpen,
    saving = false,
}: {
    title: string;
    url: string | null;
    onUpload: () => void;
    onOpen: () => void;
    saving?: boolean;
}) {
    const fileName = getFileName(url);
    const isPdf = isPdfUrl(url);

    return (
        <Card>
            <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {title}
                    </Typography>
                    <Chip size="small" variant={"pill" as any} label=".jpg / .png / .pdf" />
                </Stack>

                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                        p: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        bgcolor: "background.paper",
                    }}
                >
                    <DescriptionOutlinedIcon
                        color={isPdf ? "error" : "action"}
                        fontSize="small"
                    />
                    {url ? (
                        <Link
                            href={url}
                            target="_blank"
                            rel="noopener"
                            underline="hover"
                            sx={{ fontWeight: 600 }}
                        >
                            {fileName}
                        </Link>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No hay archivo cargado
                        </Typography>
                    )}
                </Stack>

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ mt: 1 }}
                >
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={saving ? <CircularProgress size={16} /> : <UploadIcon />}
                        onClick={onUpload}
                        disabled={saving}
                        fullWidth
                        sx={{ maxWidth: { sm: 220 } }}
                    >
                        {saving ? 'Subiendo...' : 'Subir/Reemplazar'}
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={onOpen}
                        disabled={!url || saving}
                        fullWidth
                        sx={{ maxWidth: { sm: 220 } }}
                    >
                        Descargar
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
}
