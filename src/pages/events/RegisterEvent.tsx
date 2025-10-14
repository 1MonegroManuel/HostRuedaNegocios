// src/pages/RegisterEvent.tsx
import { useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    TextField,
    Typography,
    Stack,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { Upload } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import theme from "../../theme/themes";
import { useEventRegistration } from "../../hooks/useEventRegistration";

type FileField = File | null;

export default function RegisterEvent() {
    const navigate = useNavigate();
    const { loading, error, registerEvent, clearError } = useEventRegistration();

    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [logo, setLogo] = useState<FileField>(null);
    const [portada, setPortada] = useState<FileField>(null);
    const [fechaInicio, setFechaInicio] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1); // 1 hora en el futuro
        return now.toISOString().slice(0, 16); // Formato datetime-local
    });
    const [fechaFin, setFechaFin] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 3); // 3 horas en el futuro
        return now.toISOString().slice(0, 16); // Formato datetime-local
    });
    const [duracionReunion, setDuracionReunion] = useState("30");
    const [numeroMesas, setNumeroMesas] = useState("10");
    const [modoMesas, setModoMesas] = useState<'FIJA_POR_EMPRESA' | 'POR_REUNION'>('FIJA_POR_EMPRESA');

    const isValid = useMemo(() => {
        const fechaInicioDate = new Date(fechaInicio);
        const fechaFinDate = new Date(fechaFin);
        
        return (
            nombre.trim().length > 2 &&
            descripcion.trim().length > 5 &&
            !!logo &&
            !!fechaInicio &&
            !!fechaFin &&
            !!duracionReunion &&
            parseInt(duracionReunion) > 0 &&
            !!numeroMesas &&
            parseInt(numeroMesas) > 0 &&
            fechaFinDate > fechaInicioDate // Validar que fin > inicio
        );
    }, [nombre, descripcion, logo, fechaInicio, fechaFin, duracionReunion, numeroMesas]);

    const handleFile =
        (setter: (f: FileField) => void) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0] ?? null;
                setter(f);
            };

    // Registrar evento usando la API
    const onSubmit = async () => {
        if (!isValid) return;
        
        clearError();
        
        const eventData = {
            nombre,
            descripcion,
            inicio: fechaInicio,
            fin: fechaFin,
            duracion_minutos_reunion: parseInt(duracionReunion),
            numero_mesas: parseInt(numeroMesas),
            modo_mesas: modoMesas,
            logo: logo!,
            portada: portada || undefined,
        };

        const result = await registerEvent(eventData);
        
        if (result.success) {
            // Redirigir a la página de eventos o mostrar éxito
            navigate("/current-events");
        }
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
            <Card sx={{ width: "100%", maxWidth: 420, px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4 } }}>
                <Typography variant="h2" sx={{ mb: 2 }}>
                    Registro del evento
                </Typography>

                {/* Mostrar errores */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
                        {error}
                    </Alert>
                )}

                {/* Validación de fechas */}
                {fechaInicio && fechaFin && new Date(fechaFin) <= new Date(fechaInicio) && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        La fecha de fin debe ser posterior a la fecha de inicio
                    </Alert>
                )}

                <Stack spacing={2}>
                    <TextField
                        label="Nombre del evento"
                        placeholder="Rueda de negocios del Beni"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        fullWidth
                        variant="outlined"
                    />

                    {/* Descripción dinámica */}
                    <TextField
                        label="Descripción"
                        placeholder="Describe brevemente tu evento…"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
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

                    {/* Fechas */}
                    <TextField
                        label="Fecha de inicio"
                        type="datetime-local"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Fecha de fin"
                        type="datetime-local"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                    />

                    {/* Duración de reunión */}
                    <TextField
                        label="Duración de reunión (minutos)"
                        type="number"
                        value={duracionReunion}
                        onChange={(e) => setDuracionReunion(e.target.value)}
                        fullWidth
                        variant="outlined"
                        inputProps={{ min: 1, max: 120 }}
                    />

                    {/* Número de mesas */}
                    <TextField
                        label="Número de mesas"
                        type="number"
                        value={numeroMesas}
                        onChange={(e) => setNumeroMesas(e.target.value)}
                        fullWidth
                        variant="outlined"
                        inputProps={{ min: 1, max: 100 }}
                    />

                    {/* Modo de mesas */}
                    <FormControl fullWidth>
                        <InputLabel id="modo-mesas-label">Modo de mesas</InputLabel>
                        <Select
                            labelId="modo-mesas-label"
                            label="Modo de mesas"
                            value={modoMesas}
                            onChange={(e) => setModoMesas(e.target.value as 'FIJA_POR_EMPRESA' | 'POR_REUNION')}
                        >
                            <MenuItem value="FIJA_POR_EMPRESA">Fija por empresa</MenuItem>
                            <MenuItem value="POR_REUNION">Por reunión</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Logo */}
                    <Stack spacing={0.5}>
                        <Typography fontWeight={600}>Logo del evento</Typography>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<Upload />}
                                sx={{ borderRadius: theme.custom.radii.pill }}
                            >
                                Subir logo
                                <input hidden type="file" accept="image/*" onChange={handleFile(setLogo)} />
                            </Button>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {logo ? logo.name : "Ningún archivo seleccionado"}
                            </Typography>
                        </Stack>
                    </Stack>

                    {/* Portada */}
                    <Stack spacing={0.5}>
                        <Typography fontWeight={600}>Portada del evento</Typography>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<Upload />}
                                sx={{ borderRadius: theme.custom.radii.pill }}
                            >
                                Subir portada
                                <input hidden type="file" accept="image/*" onChange={handleFile(setPortada)} />
                            </Button>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    flex: 1,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {portada ? portada.name : "Ningún archivo seleccionado"}
                            </Typography>
                        </Stack>
                    </Stack>

                    {/* Navegación */}
                    <Stack direction="row" gap={2} sx={{ mt: 1 }}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            color="warning" 
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            Atrás
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            sx={{ color: "#000" }}
                            disabled={!isValid || loading}
                            onClick={onSubmit}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {loading ? "Registrando..." : "Registrar Evento"}
                        </Button>
                    </Stack>
                </Stack>
            </Card>
        </Box>
    );
}
