// src/pages/Participants.tsx
import { useMemo, useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
    Backdrop,
    Tooltip,
    Collapse,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    ArrowBackIosNewOutlined,
    Language,
    PictureAsPdf,
    Search,
    CheckCircleOutline,
    ExpandMore,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "../../navigation/Navigation";
import theme from "../../theme/themes";
import { empresaService } from "../../apiService/services/empresaService";
import { solicitudReunionService } from "../../apiService/services/solicitudReunionService";
import { eventoService } from "../../apiService/services/eventoService";
import { mesaService } from "../../apiService/services/mesaService";
import { useAuth } from "../../contexts/AuthContext";

type Company = {
    _id: string;
    nombre: string;
    representante: string;
    rubro: string;
    sitio_web?: string | null;
    logo_url?: string | null;
    estado: 'pendiente' | 'aceptado' | 'rechazado';
    eventoId: string;
    encargadoId?: string | null;
    personalIds: string[];
    isVirtual?: boolean;
};

// Datos simulados eliminados - ahora se cargan desde la API

type MeetingDraft = {
    companyId: string | null;
    usuarioSolicitaId: string | null;
    mesaPreferidaId: string | null;
    inicioPropuesto: string | null;
    finPropuesto: string | null;
    tipoReunion: 'virtual' | 'presencial';
    mensaje: string;
};

export default function Participants() {
    const navigate = useNavigate();
    const { id: eventoId } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [evento, setEvento] = useState<any>(null);
    const [empresaUsuario, setEmpresaUsuario] = useState<any>(null);
    const [mesaUsuario, setMesaUsuario] = useState<any>(null); // Usado en el diálogo para mostrar mesa asignada
    const [solicitudesExistentes, setSolicitudesExistentes] = useState<Set<string>>(new Set()); // IDs de empresas con solicitudes pendientes

    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return companies;
        return companies.filter(
            (c) =>
                c.nombre.toLowerCase().includes(term) ||
                c.representante.toLowerCase().includes(term) ||
                c.rubro.toLowerCase().includes(term)
        );
    }, [q, companies]);

    // Cargar empresas aceptadas del evento, información del evento y empresa del usuario
    useEffect(() => {
        const loadData = async () => {
            if (!eventoId || !user) {
                setError("No se encontró ID del evento o usuario");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log("🔍 Loading data for evento:", eventoId, "user:", user._id);
                
                // Cargar información del evento
                const eventoData = await eventoService.getEvento(eventoId);
                setEvento(eventoData);
                console.log("📅 Evento cargado:", eventoData);
                console.log("🕐 Fechas del evento - Inicio:", eventoData.inicio, "Fin:", eventoData.fin);
                console.log("🕐 Duración calculada:", (new Date(eventoData.fin).getTime() - new Date(eventoData.inicio).getTime()) / (1000 * 60 * 60), "horas");
                
                // Cargar empresa del usuario si es encargado o personal
                let userEmpresa = null;
                if (user.tipoUsuario === 'encargado') {
                    userEmpresa = await empresaService.getEmpresaByEncargado(user._id);
                } else if (user.tipoUsuario === 'personal') {
                    // Para personal, necesitamos encontrar la empresa donde trabaja
                    const empresasResponse = await empresaService.getEmpresasByEvento(eventoId);
                    userEmpresa = empresasResponse.data.find(empresa => 
                        empresa.personalIds?.includes(user._id)
                    );
                }
                
                if (userEmpresa) {
                    setEmpresaUsuario(userEmpresa);
                    console.log("🏢 Empresa del usuario:", userEmpresa);
                    
                    // Cargar información de la mesa si la empresa tiene una asignada
                    if (userEmpresa.mesaId) {
                        const mesa = await mesaService.getMesa(userEmpresa.mesaId);
                        setMesaUsuario(mesa);
                        console.log("🪑 Mesa del usuario:", mesa);
                    }
                }
                
                // Obtener todas las empresas del evento
                const response = await empresaService.getEmpresasByEvento(eventoId);
                console.log("📋 Companies response:", response);
                
                // Filtrar solo las empresas aceptadas, excluyendo la empresa del usuario actual
                const acceptedCompanies = response.data
                    .filter(empresa => empresa.estado === 'aceptado')
                    .filter(empresa => {
                        // Si el usuario es encargado, excluir su propia empresa
                        if (user?.tipoUsuario === 'encargado' && empresa.encargadoId === user._id) {
                            return false;
                        }
                        // Si el usuario es personal, excluir la empresa donde trabaja
                        if (user?.tipoUsuario === 'personal' && empresa.personalIds?.includes(user._id)) {
                            return false;
                        }
                        return true;
                    })
                    .map(empresa => ({
                        _id: empresa._id,
                        nombre: empresa.nombre,
                        representante: (empresa as any).representante || 'No especificado',
                        rubro: empresa.rubro || 'No especificado',
                        sitio_web: empresa.sitio_web,
                        logo_url: empresa.logo_url,
                        estado: empresa.estado,
                        eventoId: empresa.eventoId,
                        encargadoId: empresa.encargadoId,
                        personalIds: empresa.personalIds || [],
                        isVirtual: empresa.isVirtual || false
                    }));
                console.log("✅ Accepted companies:", acceptedCompanies);
                
                setCompanies(acceptedCompanies);
                
                // Cargar solicitudes existentes para este usuario
                if (userEmpresa) {
                    try {
                        console.log("🔍 Consultando solicitudes para usuario:", user._id, "evento:", eventoId, "estado: pendiente");
                        
                        // Consultar solicitudes enviadas por la empresa del usuario
                        const solicitudesEnviadas = await solicitudReunionService.getSolicitudesEnviadas(userEmpresa._id, {
                            eventoId,
                            estado: 'pendiente'
                        });
                        
                        // Consultar solicitudes recibidas por la empresa del usuario
                        const solicitudesRecibidas = await solicitudReunionService.getSolicitudesRecibidas(userEmpresa._id, {
                            eventoId,
                            estado: 'pendiente'
                        });
                        
                        console.log("📝 Solicitudes enviadas:", solicitudesEnviadas);
                        console.log("📝 Solicitudes recibidas:", solicitudesRecibidas);
                        
                        // Crear un set con todas las empresas que ya tienen solicitudes pendientes
                        // Para solicitudes enviadas: la empresa objetivo es la que recibe la solicitud
                        // Para solicitudes recibidas: la empresa solicitante es la que envió la solicitud
                        const empresasConSolicitud = new Set([
                            ...solicitudesEnviadas.data.map(solicitud => {
                                // empresaObjetivoId puede ser un objeto o un string
                                const empresaId = typeof solicitud.empresaObjetivoId === 'object' 
                                    ? (solicitud.empresaObjetivoId as any)._id 
                                    : solicitud.empresaObjetivoId;
                                return String(empresaId);
                            }),
                            ...solicitudesRecibidas.data.map(solicitud => {
                                // empresaSolicitaId puede ser un objeto o un string
                                const empresaId = typeof solicitud.empresaSolicitaId === 'object' 
                                    ? (solicitud.empresaSolicitaId as any)._id 
                                    : solicitud.empresaSolicitaId;
                                return String(empresaId);
                            })
                        ]);
                        
                        setSolicitudesExistentes(empresasConSolicitud);
                        console.log("📝 Empresas con solicitudes existentes:", empresasConSolicitud);
                        console.log("📝 Array de empresas con solicitudes:", Array.from(empresasConSolicitud));
                    } catch (error) {
                        console.warn("⚠️ No se pudieron cargar las solicitudes existentes:", error);
                    }
                }
            } catch (error) {
                console.error("❌ Error loading data:", error);
                setError("Error al cargar los datos");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [eventoId, user]);

    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<MeetingDraft>({
        companyId: null,
        usuarioSolicitaId: user?._id || null,
        mesaPreferidaId: null,
        inicioPropuesto: null,
        finPropuesto: null,
        tipoReunion: 'presencial',
        mensaje: "",
    });

    const [expandedMediaId, setExpandedMediaId] = useState<string | null>(null);
    const [sent, setSent] = useState<Record<string, boolean>>({});
    const [overlayOpen, setOverlayOpen] = useState(false);

    const currentCompany =
        companies.find((c) => c._id === draft.companyId) || null;

    const openPdf = (company: Company) => {
        // Generar PDF con información de la empresa
        const pdfContent = `
            <html>
                <head>
                    <title>Información de ${company.nombre}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .logo { max-width: 200px; max-height: 100px; }
                        .info { margin: 20px 0; }
                        .label { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${company.nombre}</h1>
                        ${company.logo_url ? `<img src="${company.logo_url}" alt="Logo" class="logo">` : ''}
                    </div>
                    <div class="info">
                        <p><span class="label">Representante:</span> ${company.representante}</p>
                        <p><span class="label">Rubro:</span> ${company.rubro}</p>
                        <p><span class="label">Estado:</span> ${company.estado}</p>
                        ${company.sitio_web ? `<p><span class="label">Sitio web:</span> ${company.sitio_web}</p>` : ''}
                        <p><span class="label">Personal:</span> ${company.personalIds.length} empleados</p>
                    </div>
                </body>
            </html>
        `;
        
        const blob = new Blob([pdfContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
    };
    
    const openUrl = (url?: string | null) => {
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const openDialogFor = (companyId: string) => {
        // Determinar el tipo de reunión basado en si la empresa del usuario es virtual
        const tipoReunion = empresaUsuario?.isVirtual ? 'virtual' : 'presencial';
        
        setDraft({ 
            companyId, 
            usuarioSolicitaId: user?._id || null,
            mesaPreferidaId: empresaUsuario?.mesaId || null, // Usar la mesa de la empresa del usuario
            inicioPropuesto: null,
            finPropuesto: null,
            tipoReunion,
            mensaje: ""
        });
        setOpen(true);
    };

    const submitRequest = async () => {
        if (!draft.companyId || !draft.usuarioSolicitaId || !draft.inicioPropuesto || !eventoId || !empresaUsuario) {
            console.error("❌ Faltan datos requeridos para enviar la solicitud");
            return;
        }
        
        // Validar que la fecha esté dentro del rango del evento
        const inicio = new Date(draft.inicioPropuesto);
        const eventoInicio = new Date(evento?.inicio);
        const eventoFin = new Date(evento?.fin);
        
        // Extraer solo la fecha (sin hora) para comparar correctamente
        const inicioFecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
        const eventoInicioFecha = new Date(eventoInicio.getFullYear(), eventoInicio.getMonth(), eventoInicio.getDate());
        const eventoFinFecha = new Date(eventoFin.getFullYear(), eventoFin.getMonth(), eventoFin.getDate());
        
        // Verificar que la fecha esté dentro del rango del evento (incluyendo el día de fin)
        if (inicioFecha < eventoInicioFecha || inicioFecha > eventoFinFecha) {
            alert(`La fecha seleccionada debe estar entre ${eventoInicio.toLocaleDateString()} y ${eventoFin.toLocaleDateString()}`);
            return;
        }
        
        // Verificar que la hora esté entre 8:00 AM y 5:00 PM
        const hora = inicio.getHours();
        if (hora < 8 || hora > 17) {
            alert("La hora debe estar entre las 8:00 AM y las 5:00 PM");
            return;
        }
        
        // Calcular fin usando la duración del evento
        const duracionMinutos = evento?.duracion_minutos_reunion || 30; // Fallback a 30 minutos
        const fin = new Date(inicio.getTime() + duracionMinutos * 60000);
        
        // Verificar que la reunión no termine después de las 5:00 PM
        if (fin.getHours() > 17 || (fin.getHours() === 17 && fin.getMinutes() > 0)) {
            alert(`La reunión terminaría después de las 5:00 PM. Selecciona una hora más temprana o reduce la duración.`);
            return;
        }
        
        console.log("📝 Enviando solicitud de reunión:", {
            eventoId,
            empresaSolicitaId: empresaUsuario._id, // La empresa del usuario logueado (quien solicita)
            empresaObjetivoId: draft.companyId, // La empresa a la que se envía la solicitud (objetivo)
            usuarioSolicitaId: draft.usuarioSolicitaId,
            mesaPreferidaId: draft.mesaPreferidaId,
            inicioPropuesto: inicio.toISOString(),
            finPropuesto: fin.toISOString(),
            tipoReunion: draft.tipoReunion,
            mensaje: draft.mensaje,
            estado: 'pendiente'
        });
        
        console.log("🕐 Fechas del evento:", {
            eventoInicio: evento?.inicio,
            eventoFin: evento?.fin,
            inicioPropuesto: inicio.toISOString(),
            finPropuesto: fin.toISOString(),
            inicioUTC: new Date(evento?.inicio),
            finUTC: new Date(evento?.fin)
        });
        
        // Crear la solicitud de reunión
        const solicitudData = {
            eventoId,
            empresaSolicitaId: empresaUsuario._id, // La empresa del usuario logueado (quien solicita)
            empresaObjetivoId: draft.companyId!, // La empresa a la que se envía la solicitud (objetivo)
            usuarioSolicitaId: draft.usuarioSolicitaId!,
            mesaPreferidaId: draft.mesaPreferidaId,
            inicioPropuesto: inicio.toISOString(),
            finPropuesto: fin.toISOString(),
            tipoReunion: draft.tipoReunion,
            mensaje: draft.mensaje || null,
            estado: 'pendiente' as const
        };
        
        try {
            // Verificar si ya existe una solicitud pendiente antes de crear
            const verificacion = await solicitudReunionService.verificarSolicitudExistente(
                eventoId,
                empresaUsuario._id, // empresa del usuario (quien solicita)
                draft.companyId!    // empresa objetivo (a quien se solicita)
            );
            
            if (verificacion.exists) {
                alert("⚠️ Ya existe una solicitud pendiente entre tu empresa y esta empresa en este evento.\n\nPor favor, espera a que la empresa responda a tu solicitud anterior.");
                return;
            }
            
            await solicitudReunionService.createSolicitudReunion(solicitudData);
            console.log("✅ Solicitud enviada exitosamente");
            
            // Solo ejecutar el código de éxito si la solicitud se crea exitosamente
            setOpen(false);
            setSent((s) => ({ ...s, [draft.companyId as string]: true }));
            
            // Actualizar el estado de solicitudes existentes para reflejar el cambio inmediatamente
            setSolicitudesExistentes(prev => new Set([...prev, draft.companyId as string]));
            
            setOverlayOpen(true);
            setTimeout(() => setOverlayOpen(false), 3000);
            
        } catch (error: any) {
            console.error("❌ Error enviando solicitud:", error);
            console.error("❌ Error message:", error.message);
            console.error("❌ Error status:", error.response?.status);
            console.error("❌ Error data:", error.response?.data);
            console.error("❌ Full error object:", error);
            
            if (error.response?.status === 409) {
                // Verificar si es un error de rango de fechas o duplicado
                const errorMessage = error.response?.data?.error || '';
                if (errorMessage.includes('rango propuesto debe estar dentro del evento')) {
                    alert("⚠️ Error de validación de fechas.\n\nLas fechas seleccionadas están fuera del rango del evento. Por favor, selecciona fechas que estén dentro del período del evento.");
                } else if (errorMessage.includes('DUPLICATE_KEY') || errorMessage.includes('duplicado')) {
                    alert("⚠️ Ya existe una solicitud pendiente entre estas dos empresas en este evento.\n\nPor favor, espera a que la empresa responda a tu solicitud anterior o contacta al administrador si necesitas hacer cambios.");
                } else {
                    alert(`⚠️ Error de validación: ${errorMessage}\n\nPor favor, verifica los datos ingresados e inténtalo de nuevo.`);
                }
            } else if (error.message?.includes('409')) {
                // Fallback para cuando el status no está disponible pero el mensaje indica 409
                alert("⚠️ Ya existe una solicitud pendiente entre estas dos empresas en este evento.\n\nPor favor, espera a que la empresa responda a tu solicitud anterior o contacta al administrador si necesitas hacer cambios.");
            } else {
                alert("❌ Error al enviar la solicitud.\n\nPor favor, verifica tu conexión e inténtalo de nuevo. Si el problema persiste, contacta al administrador.");
            }
            return;
        }
    };

    const requestBtnSx = {
        borderRadius: 1,
        fontWeight: 800,
        px: { xs: 1.25, sm: 2 },
        py: { xs: 0.8, sm: 1 },
        fontSize: { xs: 12, sm: 14 },
    } as const;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                bgcolor: "background.default",
                pb: "88px",
            }}
        >
            {/* Header */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: "primary.dark" }}>
                        <ArrowBackIosNewOutlined />
                    </IconButton>
                    <Typography variant="h2" sx={{ color: "text.primary" }}>
                        Rueda de negocios
                    </Typography>
                </Stack>
            </Box>

            {/* Search */}
            <Box sx={{ px: 3, mb: 1 }}>
                <TextField
                    fullWidth
                    placeholder="Busca por nombre, empresa o correo"
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

            {/* Lista */}
            <Box sx={{ px: 3, pb: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                ) : filtered.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        No hay empresas aceptadas en este evento
                    </Alert>
                ) : (
                <Stack spacing={1.5}>
                    {filtered.map((c) => {
                            const expanded = expandedMediaId === c._id;
                            const isSent = !!sent[c._id]; // Estado temporal para mostrar que se acaba de enviar
                            const tieneSolicitudPendiente = solicitudesExistentes.has(c._id); // Estado persistente: ya existe una solicitud pendiente
                            
                            // Debug para verificar el estado
                            if (c._id === '68dae01702d76f34d4bd87f1') { // ID de empresa1 según los logs
                                console.log("🔍 Debug empresa1:", {
                                    empresaId: c._id,
                                    tieneSolicitudPendiente,
                                    solicitudesExistentes: Array.from(solicitudesExistentes),
                                    empresaIdInSet: solicitudesExistentes.has(c._id)
                                });
                            }

                        return (
                            <Card
                                    key={c._id}
                                elevation={0}
                                sx={{
                                    borderRadius: '15px',
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                                }}
                            >
                                <Box sx={{ p: 1.25 }}>
                                    <Stack direction="row" alignItems="center" spacing={1.25}>
                                        {/* Avatar clickeable */}
                                        <Box
                                            role="button"
                                            onClick={() =>
                                                    setExpandedMediaId((cur) => (cur === c._id ? null : c._id))
                                            }
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: "50%",
                                                    background: theme.palette.primary.main,
                                                display: "grid",
                                                placeItems: "center",
                                                color: "common.white",
                                                fontWeight: 900,
                                                cursor: "pointer",
                                                transform: expanded ? "scale(1.08)" : "scale(1)",
                                                transition: "transform 150ms ease",
                                                boxShadow: expanded ? theme.custom.shadows.button : "none",
                                            }}
                                        >
                                                <span style={{ fontSize: 18 }}>{c.nombre[0]}</span>
                                        </Box>

                                        {/* Texto */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Typography
                                                    sx={{
                                                        fontWeight: 800,
                                                        lineHeight: 1.1,
                                                        fontSize: { xs: 14.5, sm: 16 },
                                                        color: "text.primary",
                                                    }}
                                                >
                                                        {c.nombre}
                                                </Typography>
                                                <ExpandMore
                                                    sx={{
                                                        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                                                        transition: "transform 150ms ease",
                                                        fontSize: 18,
                                                        color: alpha(theme.palette.text.primary, 0.5),
                                                    }}
                                                />
                                            </Stack>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: 12.5, sm: 13.5 } }}
                                            >
                                                    {c.representante}
                                            </Typography>

                                            <Chip
                                                size="small"
                                                    label={c.rubro}
                                                sx={{
                                                    mt: 0.5,
                                                    bgcolor: theme.custom.status.pending.bg,
                                                    color: theme.custom.status.pending.fg,
                                                    fontWeight: 700,
                                                    height: 22,
                                                    fontSize: { xs: 11, sm: 12 },
                                                }}
                                            />
                                        </Box>

                                        {/* Botón solicitar */}
                                        <Button
                                            variant="contained"
                                            color={tieneSolicitudPendiente ? "warning" : isSent ? "success" : "primary"}
                                            onClick={() => openDialogFor(c._id)}
                                            disabled={tieneSolicitudPendiente || isSent}
                                            sx={{
                                                ...requestBtnSx,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {tieneSolicitudPendiente 
                                                ? "Solicitud enviada" 
                                                : isSent 
                                                    ? "Solicitud enviada" 
                                                    : "Solicitar reunión"
                                            }
                                        </Button>
                                    </Stack>

                                    {/* Panel de acciones (URL/PDF) */}
                                    <Collapse in={expanded} unmountOnExit>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{ mt: 1.25, pl: { xs: 6.5, sm: 6.5 } }}
                                        >
                                                <Tooltip title={c.sitio_web ? "Abrir sitio" : "Sin sitio"}>
                                                <span>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                            onClick={() => openUrl(c.sitio_web)}
                                                            disabled={!c.sitio_web}
                                                        startIcon={<Language />}
                                                        sx={{
                                                            fontWeight: 700,
                                                            borderRadius: 2,
                                                            px: { xs: 1.25, sm: 1.75 },
                                                            fontSize: { xs: 12, sm: 13 },
                                                        }}
                                                    >
                                                        Sitio web
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                                <Tooltip title="Generar PDF">
                                                <span>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                            onClick={() => openPdf(c)}
                                                        startIcon={<PictureAsPdf />}
                                                        sx={{
                                                            fontWeight: 700,
                                                            borderRadius: 2,
                                                            px: { xs: 1.25, sm: 1.75 },
                                                            fontSize: { xs: 12, sm: 13 },
                                                        }}
                                                    >
                                                        PDF
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        </Stack>
                                    </Collapse>
                                </Box>
                            </Card>
                        );
                    })}
                </Stack>
                )}
            </Box>

            {/* Diálogo: solicitar reunión */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: '15' } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: "text.primary" }}>
                    {currentCompany
                        ? `Solicitar reunión con ${currentCompany.nombre}`
                        : "Solicitar reunión"}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        {/* Información de la empresa del usuario */}
                        {empresaUsuario && (
                            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
                                    Tu empresa: {empresaUsuario.nombre}
                                </Typography>
                                {mesaUsuario && (
                                    <Typography variant="body2" color="text.secondary">
                                        Mesa asignada: {mesaUsuario.nombre || `Mesa ${mesaUsuario.numero}`}
                                    </Typography>
                                )}
                                <Typography variant="body2" color="text.secondary">
                                    Modalidad: {empresaUsuario.isVirtual ? 'Virtual' : 'Presencial'}
                                </Typography>
                            </Box>
                        )}

                        {/* Información de duración de reunión */}
                        {evento && (
                            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Duración de reunión: {evento.duracion_minutos_reunion} minutos
                                </Typography>
                            </Box>
                        )}

                        <TextField
                            select
                            label="Tipo de Reunión"
                            value={draft.tipoReunion}
                            onChange={(e) =>
                                setDraft((d) => ({ ...d, tipoReunion: e.target.value as 'virtual' | 'presencial' }))
                            }
                            SelectProps={{ native: true }}
                            fullWidth
                            disabled={empresaUsuario?.isVirtual} // No editable si la empresa es virtual
                            helperText={empresaUsuario?.isVirtual ? "Tu empresa es virtual, por lo que las reuniones serán virtuales" : ""}
                        >
                            <option value="presencial">Presencial</option>
                            <option value="virtual">Virtual</option>
                        </TextField>

                        <TextField
                            label="Fecha y Hora de Inicio"
                            type="datetime-local"
                            value={draft.inicioPropuesto || ""}
                            onChange={(e) => setDraft((d) => ({ ...d, inicioPropuesto: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            inputProps={{
                                min: evento ? `${new Date(evento.inicio).toISOString().split('T')[0]}T08:00` : undefined,
                                max: evento ? `${new Date(evento.fin).toISOString().split('T')[0]}T17:00` : undefined,
                                step: "3600" // Intervalos de 1 hora
                            }}
                            helperText={
                                evento 
                                    ? `Fechas: ${new Date(evento.inicio).toLocaleDateString()} - ${new Date(evento.fin).toLocaleDateString()} | Horario: 8:00 AM - 5:00 PM`
                                    : "Selecciona una fecha y hora para la reunión"
                            }
                        />

                        <TextField
                            label="Motivo de la solicitud"
                            multiline
                            rows={3}
                            value={draft.mensaje}
                            onChange={(e) => setDraft((d) => ({ ...d, mensaje: e.target.value }))}
                            placeholder="Explica brevemente el motivo de la solicitud de reunión..."
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)} color="warning" variant="contained">
                        Cancelar
                    </Button>
                    <Button
                        onClick={submitRequest}
                        variant="contained"
                        color="success"
                        sx={{ color: "#000" }}
                        disabled={!draft.companyId || !draft.usuarioSolicitaId || !draft.inicioPropuesto}
                    >
                        Enviar solicitud
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Overlay de éxito */}
            <Backdrop
                open={overlayOpen}
                sx={{
                    zIndex: (th) => th.zIndex.modal + 1,
                    background: theme.palette.primary.main,
                    color: "common.white",
                }}
            >
                <Stack alignItems="center" spacing={2}>
                    <CheckCircleOutline sx={{ fontSize: 90 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Solicitud enviada correctamente
                    </Typography>
                </Stack>
            </Backdrop>

            <Navigation />
        </Box>
    );
}
