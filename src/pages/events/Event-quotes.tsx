// src/pages/EventQuotes.tsx
import { useMemo, useState, useEffect } from "react";
import {
    Box,
    Card,
    Chip,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
    Tooltip,
    useMediaQuery,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    ArrowBackIosNewOutlined,
    Search,
    Business,
    PhoneIphone,
    MailOutline,
    CalendarMonth,
    AccessTime,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import Navigation from "../../navigation/Navigation";
import { solicitudReunionService } from "../../apiService/services/solicitudReunionService";
import { empresaService } from "../../apiService/services/empresaService";
import { mesaService } from "../../apiService/services/mesaService";
// import { eventoService } from "../../apiService/services/eventoService";
import { useAuth } from "../../contexts/AuthContext";

// ──────────────────────────────────────────────────────────
// Modo compacto (ajusta tamaños desde aquí)
const COMPACT = true;
const SIZES = {
    cardPadding: COMPACT ? 0.9 : 1.4, // padding del Card
    cardRadius: COMPACT ? 1 : 2, // radio de borde
    titleFont: COMPACT ? 15 : 17, // título empresa
    chipHeight: COMPACT ? 20 : 22,
    chipFont: COMPACT ? 11 : 12,
    rowGap: COMPACT ? 0.4 : 0.6, // separación entre filas de info
    listSpacing: COMPACT ? 0.8 : 1.2, // distancia entre cards
    tableSize: COMPACT ? 24 : 32, // diámetro de las mesas
    tableGap: COMPACT ? 0.6 : 0.9, // separación entre mesas
    sectionMargin: COMPACT ? 0.75 : 1.2, // márgenes de secciones
};
// ──────────────────────────────────────────────────────────

// Tipos para reuniones reales
type Status = "ongoing" | "upcoming" | "completed";
type Reunion = {
    _id: string;
    status: Status;
    empresaSolicitaId: string | {
        _id: string;
        nombre: string;
        email?: string;
        telefono?: string;
    };
    empresaObjetivoId: string | {
        _id: string;
        nombre: string;
        email?: string;
        telefono?: string;
    };
    mesaPreferidaId?: string | {
        _id: string;
        numero: number;
        nombre?: string;
    } | null;
    inicioPropuesto?: Date | null;
    finPropuesto?: Date | null;
    tipoReunion: "virtual" | "presencial";
    mensaje?: string | null;
    creada_en?: Date;
    actualizada_en?: Date;
};

// Mesas reales del evento
type Mesa = { 
    _id: string;
    numero: number; 
    nombre?: string;
    ocupada: boolean;
    eventoId: string;
};

// Helper functions
const getEmpresaData = (empresaId: string | any) => {
    return typeof empresaId === 'object' ? empresaId : null;
};

const getMesaData = (mesaId: string | any) => {
    return typeof mesaId === 'object' ? mesaId : null;
};

const determineStatus = (inicio: Date | null, fin: Date | null): Status => {
    if (!inicio || !fin) return "upcoming";
    
    const now = new Date();
    const startTime = new Date(inicio);
    const endTime = new Date(fin);
    
    if (now >= startTime && now <= endTime) {
        return "ongoing";
    } else if (now < startTime) {
        return "upcoming";
    } else {
        return "completed";
    }
};

export default function EventQuotes() {
    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up("sm"));
    const navigate = useNavigate();
    const { user } = useAuth();

    const [statusTab, setStatusTab] = useState<"all" | Status>("all");
    const [q, setQ] = useState("");
    const [reuniones, setReuniones] = useState<Reunion[]>([]);
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar datos del evento
    useEffect(() => {
        const loadEventData = async () => {
            if (!user) {
                setError("Usuario no autenticado");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // Obtener la empresa del usuario para acceder al evento
                let userEmpresa = null;
                if (user.tipoUsuario === 'encargado') {
                    userEmpresa = await empresaService.getEmpresaByEncargado(user._id);
                } else if (user.tipoUsuario === 'personal') {
                    const empresasResponse = await empresaService.getEmpresas();
                    userEmpresa = empresasResponse.data.find(empresa => 
                        empresa.personalIds?.includes(user._id)
                    );
                }

                if (!userEmpresa) {
                    setError("No se encontró empresa asociada al usuario");
                    setLoading(false);
                    return;
                }

                // Cargar TODAS las solicitudes aceptadas del evento (no solo las de la empresa del usuario)
                // Necesitamos obtener todas las empresas del evento para buscar todas las solicitudes
                const empresasResponse = await empresaService.getEmpresas();
                const empresasDelEvento = empresasResponse.data.filter(empresa => empresa.eventoId === userEmpresa.eventoId);
                
                // Cargar solicitudes enviadas y recibidas de todas las empresas del evento
                const solicitudesPromises = empresasDelEvento.map(async (empresa) => {
                    const [enviadas, recibidas] = await Promise.all([
                        solicitudReunionService.getSolicitudesEnviadas(empresa._id, { estado: 'aceptada' }),
                        solicitudReunionService.getSolicitudesRecibidas(empresa._id, { estado: 'aceptada' })
                    ]);
                    return [...enviadas.data, ...recibidas.data];
                });
                
                const todasLasSolicitudesArrays = await Promise.all(solicitudesPromises);
                const todasLasSolicitudes = todasLasSolicitudesArrays.flat();

                // Eliminar duplicadas usando un Map con _id como clave
                const solicitudesUnicas = new Map();
                todasLasSolicitudes.forEach(solicitud => {
                    solicitudesUnicas.set(solicitud._id, solicitud);
                });
                const solicitudesSinDuplicados = Array.from(solicitudesUnicas.values());

                // Ordenar por fecha de inicio
                const todasLasSolicitudesOrdenadas = solicitudesSinDuplicados.sort((a, b) => {
                    const fechaA = a.inicioPropuesto ? new Date(a.inicioPropuesto).getTime() : 0;
                    const fechaB = b.inicioPropuesto ? new Date(b.inicioPropuesto).getTime() : 0;
                    return fechaA - fechaB;
                });

                // Determinar el estado de cada reunión basado en la hora actual
                const reunionesConEstado = todasLasSolicitudesOrdenadas.map(solicitud => ({
                    ...solicitud,
                    status: determineStatus(
                        solicitud.inicioPropuesto ? new Date(solicitud.inicioPropuesto) : null, 
                        solicitud.finPropuesto ? new Date(solicitud.finPropuesto) : null
                    )
                }));

                setReuniones(reunionesConEstado as Reunion[]);

                // Cargar mesas del evento
                const mesasResponse = await mesaService.getMesas({ eventoId: userEmpresa.eventoId });
                
                // Marcar mesas como ocupadas si hay una reunión en curso en esa mesa
                const now = new Date();
                const mesasConEstadoOcupacion = mesasResponse.data.map((mesa: any) => {
                    const isOcupada = reunionesConEstado.some(reunion => {
                        const mesaReunionId = getMesaData(reunion.mesaPreferidaId)?._id;
                        const inicio = reunion.inicioPropuesto ? new Date(reunion.inicioPropuesto) : null;
                        const fin = reunion.finPropuesto ? new Date(reunion.finPropuesto) : null;
                        
                        // La mesa está ocupada si:
                        // 1. La reunión es presencial
                        // 2. La mesa de la reunión coincide con esta mesa
                        // 3. La reunión está actualmente en curso (now está entre inicio y fin)
                        return (
                            reunion.tipoReunion === 'presencial' &&
                            mesaReunionId === mesa._id &&
                            inicio && fin &&
                            now >= inicio && now <= fin
                        );
                    });
                    
                    return { ...mesa, ocupada: isOcupada };
                });
                
                setMesas(mesasConEstadoOcupacion as any);

                console.log("🏢 Empresas del evento:", empresasDelEvento.length);
                console.log("📝 Todas las solicitudes encontradas (con duplicados):", todasLasSolicitudes.length);
                console.log("📝 Solicitudes únicas (sin duplicados):", solicitudesSinDuplicados.length);
                console.log("📅 Reuniones con estado:", reunionesConEstado);
                console.log("🪑 Mesas originales:", mesasResponse.data);
                console.log("🪑 Mesas con estado de ocupación:", mesasConEstadoOcupacion);
                
            } catch (error) {
                console.error("❌ Error cargando datos del evento:", error);
                setError("Error al cargar los datos del evento");
            } finally {
                setLoading(false);
            }
        };

        loadEventData();
    }, [user]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        return reuniones.filter((reunion) => {
            const matches = statusTab === "all" ? true : reunion.status === statusTab;
            if (!matches) return false;
            if (!term) return true;
            
            const empresa1 = getEmpresaData(reunion.empresaSolicitaId);
            const empresa2 = getEmpresaData(reunion.empresaObjetivoId);
            
            return (
                empresa1?.nombre?.toLowerCase().includes(term) ||
                empresa2?.nombre?.toLowerCase().includes(term) ||
                empresa1?.email?.toLowerCase().includes(term) ||
                empresa2?.email?.toLowerCase().includes(term) ||
                empresa1?.telefono?.toLowerCase().includes(term) ||
                empresa2?.telefono?.toLowerCase().includes(term)
            );
        });
    }, [statusTab, q, reuniones]);

    const statusChip = (s: Status) => {
        const base = { fontWeight: 800, height: SIZES.chipHeight, fontSize: SIZES.chipFont } as const;
        if (s === "ongoing")
            return (
                <Chip
                    label="En curso"
                    size="small"
                    sx={{ ...base, bgcolor: alpha("#FBAA29", 0.25), color: "#6b5200" }}
                />
            );
        if (s === "upcoming")
            return (
                <Chip
                    label="Próxima"
                    size="small"
                    sx={{ ...base, bgcolor: alpha("#2196F3", 0.18), color: "#0d47a1" }}
                />
            );
        return (
            <Chip
                label="Finalizada"
                size="small"
                sx={{
                    ...base,
                    bgcolor: alpha(theme.palette.success.main, 0.25),
                    color: "#054d12",
                }}
            />
        );
    };

    // Chips de filtro (arriba)
    const chipFilterSx = {
        fontWeight: 800,
        px: 0.6,
        height: SIZES.chipHeight - 1,
        fontSize: SIZES.chipFont - 1,
        borderRadius: 1.5,
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#fff",
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

            {/* Buscador */}
            <Box sx={{ px: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Busca por empresa, correo o teléfono"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* Filtros (scroll horizontal) */}
            <Box
                sx={{
                    px: 2,
                    mt: 1,
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                    "&::-webkit-scrollbar": { display: "none" },
                }}
            >
                <Stack direction="row" spacing={0.6} alignItems="center" sx={{ whiteSpace: "nowrap" }}>
                    <Chip
                        label="Todas"
                        size="small"
                        onClick={() => setStatusTab("all")}
                        color={statusTab === "all" ? "success" : "default"}
                        sx={chipFilterSx}
                    />
                    <Chip
                        label="En curso"
                        size="small"
                        onClick={() => setStatusTab("ongoing")}
                        color={statusTab === "ongoing" ? "success" : "default"}
                        sx={chipFilterSx}
                    />
                    <Chip
                        label="Próximas"
                        size="small"
                        onClick={() => setStatusTab("upcoming")}
                        color={statusTab === "upcoming" ? "success" : "default"}
                        sx={chipFilterSx}
                    />
                    <Chip
                        label="Finalizadas"
                        size="small"
                        onClick={() => setStatusTab("completed")}
                        color={statusTab === "completed" ? "success" : "default"}
                        sx={chipFilterSx}
                    />
                </Stack>
            </Box>

            {/* Estados de carga y error */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Box sx={{ px: 3, pb: 2 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            )}

            {/* Lista (scrollable). Mesas queda abajo con mt:"auto" */}
            <Box sx={{ px: 2, py: 1.0, flex: 1, overflowY: "auto" }}>
                {!loading && !error && (
                <Stack spacing={SIZES.listSpacing}>
                        {filtered.length === 0 ? (
                            <Card sx={{ p: 3, textAlign: 'center', backgroundColor: "#f6fdfc" }}>
                                <Typography variant="body1" color="text.secondary">
                                    No hay reuniones programadas
                                </Typography>
                            </Card>
                        ) : (
                            filtered.map((reunion) => {
                                const empresa1 = getEmpresaData(reunion.empresaSolicitaId);
                                const empresa2 = getEmpresaData(reunion.empresaObjetivoId);
                                const mesa = getMesaData(reunion.mesaPreferidaId);
                                const fechaInicio = reunion.inicioPropuesto ? new Date(reunion.inicioPropuesto) : null;
                                const fechaFin = reunion.finPropuesto ? new Date(reunion.finPropuesto) : null;

                                return (
                        <Card
                                        key={reunion._id}
                            elevation={0}
                            sx={{
                                p: smUp ? SIZES.cardPadding : SIZES.cardPadding,
                                borderRadius: SIZES.cardRadius,
                                overflow: "visible",
                                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                {/* Marca de empresa */}
                                <Box
                                    sx={{
                                        minWidth: { xs: 48, sm: 56 },
                                        height: { xs: 38, sm: 42 },
                                        borderRadius: 8,
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: theme.palette.primary.dark,
                                        color: "#fff",
                                    }}
                                >
                                    <Business sx={{ fontSize: { xs: 20, sm: 22 } }} />
                                </Box>

                                {/* Contenido */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.5}>
                                        <Typography
                                            sx={{
                                                fontWeight: 800,
                                                lineHeight: 1.1,
                                                fontSize: { xs: SIZES.titleFont, sm: SIZES.titleFont + 1 },
                                            }}
                                        >
                                                        {empresa1?.nombre} ↔ {empresa2?.nombre}
                                        </Typography>
                                                    {statusChip(reunion.status)}
                                    </Stack>

                                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.3 }}>
                                                    {empresa1?.telefono && <Row icon={<PhoneIphone />} text={empresa1.telefono} />}
                                                    {empresa2?.telefono && <Row icon={<PhoneIphone />} text={empresa2.telefono} />}
                                                    {empresa1?.email && <Row icon={<MailOutline />} text={empresa1.email} />}
                                                    {empresa2?.email && <Row icon={<MailOutline />} text={empresa2.email} />}
                                    </Stack>

                                    <Stack direction="row" spacing={1.2} sx={{ mt: SIZES.rowGap }}>
                                                    {fechaInicio && (
                                                        <Row icon={<CalendarMonth />} text={fechaInicio.toLocaleDateString('es-ES')} />
                                                    )}
                                                    {fechaInicio && fechaFin && (
                                                        <Row icon={<AccessTime />} text={`${fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`} />
                                                    )}
                                                    {mesa && (
                                                        <Row icon={<Business />} text={`Mesa ${mesa.numero}`} />
                                                    )}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Card>
                                );
                            })
                        )}
                </Stack>
                )}
            </Box>

            {/* Mesas */}
            {!loading && !error && (
            <Box sx={{ px: 1.5, pt: 0.75, pb: 1.2, mt: "auto", backgroundColor: "#fff" }}>
                <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                    Mesas presenciales
                </Typography>
                    <TablesRow tables={mesas} size={SIZES.tableSize} gap={SIZES.tableGap} />

                    {/* Mesas virtuales comentadas por ahora */}
                    {/* <Typography sx={{ fontWeight: 800, color: "#1e4b46", mt: SIZES.sectionMargin, mb: 0.5 }}>
                    Mesas virtuales
                </Typography>
                    <TablesRow tables={tablesVirtual} size={SIZES.tableSize} gap={SIZES.tableGap} /> */}
            </Box>
            )}

            <Navigation />
        </Box>
    );
}

/** ── Helpers UI ─────────────────────────────────────────── */

function TablesRow({ tables, size = 32, gap = 0.9 }: { tables: Mesa[]; size?: number; gap?: number }) {
    return (
        <Box
            sx={{
                display: "flex",
                gap,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                pb: 0.3,
                "&::-webkit-scrollbar": { display: "none" },
            }}
        >
            {tables.map((mesa) => {
                const bg = mesa.ocupada ? "#E53935" : "#6BAF33";
                return (
                    <Tooltip key={mesa._id} title={mesa.ocupada ? "Ocupada" : "Libre"}>
                        <Box
                            sx={{
                                flex: "0 0 auto",
                                width: size,
                                height: size,
                                borderRadius: "50%",
                                display: "grid",
                                placeItems: "center",
                                fontWeight: 800,
                                color: "#fff",
                                backgroundColor: bg,
                                fontSize: Math.max(10, size * 0.37),
                            }}
                        >
                            {mesa.numero}
                        </Box>
                    </Tooltip>
                );
            })}
        </Box>
    );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Box sx={{ opacity: 0.65, display: "grid", placeItems: "center" }}>{icon}</Box>
            <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                {text}
            </Typography>
        </Stack>
    );
}

// function Legend({ color, label }: { color: string; label: string }) {
//     return (
//         <Stack direction="row" spacing={0.5} alignItems="center">
//             <Dot color={color} />
//             <Typography variant="body2">{label}</Typography>
//         </Stack>
//     );
// }

// function Dot({ color }: { color: string }) {
//     return (
//         <Box
//             sx={{
//                 width: 12,
//                 height: 12,
//                 borderRadius: "50%",
//                 backgroundColor: color,
//                 boxShadow: `0 0 0 2px ${alpha(color, 0.25)}`,
//             }}
//         />
//     );
// }

// function formatDate(iso: string) {
//     const [y, m, d] = iso.split("-").map(Number);
//     return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
// }
