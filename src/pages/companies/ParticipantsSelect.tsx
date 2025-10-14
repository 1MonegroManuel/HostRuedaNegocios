import { useMemo, useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    Chip,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import {
    ArrowBackIosNewOutlined,
    Language,
    PictureAsPdf,
    Search,
    CheckCircleOutline,
    ExpandMore,
    Event,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import Navigation from "../../navigation/Navigation";
import theme from "../../theme/themes"; 
import { empresaService } from "../../apiService/services/empresaService";
import { eventoService } from "../../apiService/services/eventoService";
import { mesaService } from "../../apiService/services/mesaService";
import type { Empresa, Mesa } from "../../apiService/types"; 

// Tipos para la interfaz
type CompanyCard = {
    id: string;
    name: string;
    contact: string;
    sector: string;
    estado: string;
    eventoId: string;
    eventoNombre: string;
    eventoFechas: string;
    mesaId?: string | null;
    pdf?: string | null;
    url?: string | null;
    iconBg?: string;
    isVirtual: boolean; // Agregar campo para distinguir empresas virtuales vs presenciales
};

export default function ParticipantsSelect() {
    const navigate = useNavigate();

    // Estado para datos
    const [empresas, setEmpresas] = useState<CompanyCard[]>([]);
    const [mesasDisponibles, setMesasDisponibles] = useState<Mesa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // búsqueda
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return empresas;
        return empresas.filter(
            (c) =>
                c.name.toLowerCase().includes(term) ||
                c.contact.toLowerCase().includes(term) ||
                c.sector.toLowerCase().includes(term)
        );
    }, [q, empresas]);

    // expand de media (pdf/url) por card
    const [expandedMediaId, setExpandedMediaId] = useState<string | null>(null);

    // éxito por compañía
    const [overlayOpen] = useState(false);

    // Estado para el popup de selección de mesa
    const [mesaSelectionOpen, setMesaSelectionOpen] = useState(false);
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | null>(null);
    const [mesaSeleccionada, setMesaSeleccionada] = useState<string>("");

    // Cargar datos
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Cargar todas las empresas
                const empresasData = await empresaService.getEmpresas();
                
                // Obtener el primer evento para cargar mesas disponibles
                const empresasArray = (empresasData as any).data || (empresasData as any).items || [];
                console.log('📊 Empresas cargadas:', empresasArray.length);
                
                if (empresasArray.length > 0) {
                    const primerEventoId = empresasArray[0].eventoId;
                    console.log('🎯 Cargando mesas para evento:', primerEventoId);
                    
                    try {
                        const mesas = await mesaService.getMesasDisponibles(primerEventoId);
                        console.log('🪑 Mesas disponibles cargadas:', mesas.length, mesas);
                        setMesasDisponibles(mesas);
                    } catch (err) {
                        console.error('❌ Error loading mesas:', err);
                    }
                } else {
                    console.log('⚠️ No hay empresas para cargar mesas');
                }

                // Transformar empresas a formato de tarjeta con información del evento
                const empresasCards: CompanyCard[] = await Promise.all(
                    ((empresasData as any).data || (empresasData as any).items || []).map(async (empresa: Empresa) => {
                        try {
                            // Obtener información del evento para cada empresa
                            const eventoData = await eventoService.getEvento(empresa.eventoId);
                            
                            return {
                                id: empresa._id,
                                name: empresa.nombre,
                                contact: (empresa as any).representante || 'Sin representante',
                                sector: empresa.rubro || 'Sin rubro',
                                estado: empresa.estado,
                                eventoId: empresa.eventoId,
                                eventoNombre: eventoData.nombre,
                                eventoFechas: `${new Date(eventoData.inicio).toLocaleDateString()} - ${new Date(eventoData.fin).toLocaleDateString()}`,
                                mesaId: empresa.mesaId || null,
                                url: empresa.sitio_web || null,
                                pdf: null, // Por implementar
                                iconBg: getIconBg(empresa.rubro || ''),
                                isVirtual: empresa.isVirtual || false,
                            };
                        } catch (err) {
                            console.error(`Error loading evento for empresa ${empresa._id}:`, err);
                            return {
                                id: empresa._id,
                                name: empresa.nombre,
                                contact: (empresa as any).representante || 'Sin representante',
                                sector: empresa.rubro || 'Sin rubro',
                                estado: empresa.estado,
                                eventoId: empresa.eventoId,
                                eventoNombre: 'Evento no encontrado',
                                eventoFechas: 'Fechas no disponibles',
                                mesaId: empresa.mesaId || null,
                                url: empresa.sitio_web || null,
                                pdf: null,
                                iconBg: getIconBg(empresa.rubro || ''),
                                isVirtual: empresa.isVirtual || false,
                            };
                        }
                    })
                );

                setEmpresas(empresasCards);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Función para obtener color de icono basado en rubro
    const getIconBg = (rubro: string): string => {
        const colors = {
            'Agroindustria': '#4b9e2b',
            'Biotecnología': '#e1b227',
            'Turismo': '#d1aa00',
            'Tecnología': '#2196f3',
            'Servicios': '#9c27b0',
            'Manufactura': '#ff9800',
        };
        return colors[rubro as keyof typeof colors] || theme.palette.primary.main;
    };

    const openUrl = (url?: string | null) => {
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    // Funciones para manejar acciones
    const handleAceptar = async (empresaId: string) => {
        console.log('🎯 handleAceptar llamado para empresa:', empresaId);
        
        // Obtener la empresa para saber su eventoId y modalidad
        const empresa = empresas.find(emp => emp.id === empresaId);
        if (!empresa) {
            console.error('❌ Empresa no encontrada:', empresaId);
            return;
        }
        
        console.log('🏢 Empresa encontrada:', empresa);
        console.log('💻 Empresa virtual:', empresa.isVirtual);
        
        // Si es empresa virtual, solo cambiar estado (no necesita mesa)
        if (empresa.isVirtual) {
            console.log('💻 Empresa virtual, solo cambiando estado');
            try {
                await empresaService.updateEmpresa(empresaId, { estado: 'aceptado' });
                setEmpresas(prev => prev.map(emp => 
                    emp.id === empresaId ? { ...emp, estado: 'aceptado' } : emp
                ));
                console.log('✅ Empresa virtual aceptada exitosamente');
            } catch (err) {
                console.error('❌ Error al aceptar empresa virtual:', err);
            }
            return;
        }
        
        // Para empresas presenciales, verificar mesas disponibles
        try {
            const mesasDelEvento = await mesaService.getMesasDisponibles(empresa.eventoId);
            console.log('🪑 Mesas disponibles para el evento:', mesasDelEvento.length, mesasDelEvento);
            
            // Si hay mesas disponibles, mostrar popup de selección
            if (mesasDelEvento.length > 0) {
                console.log('✅ Hay mesas disponibles, abriendo popup');
                setMesasDisponibles(mesasDelEvento);
                setEmpresaSeleccionada(empresaId);
                setMesaSeleccionada("");
                setMesaSelectionOpen(true);
            } else {
                console.log('⚠️ No hay mesas disponibles para empresa presencial');
                // Mostrar mensaje de error al usuario
                alert('No hay mesas disponibles para asignar. Por favor, contacte al administrador del evento.');
            }
        } catch (err) {
            console.error('❌ Error cargando mesas del evento:', err);
            alert('Error al cargar las mesas disponibles. Por favor, intente nuevamente.');
        }
    };

    const handleRechazar = async (empresaId: string) => {
        try {
            console.log('❌ Rechazando empresa:', empresaId);
            
            // Obtener la empresa actual para verificar si tiene mesa asignada
            const empresaActual = empresas.find(emp => emp.id === empresaId);
            
            await empresaService.updateEmpresa(empresaId, { 
                estado: 'rechazado'
                // El backend manejará automáticamente la liberación de mesa
            });
            
            console.log('✅ Empresa rechazada exitosamente');
            
            // Actualizar estado local
            setEmpresas(prev => prev.map(emp => 
                emp.id === empresaId ? { 
                    ...emp, 
                    estado: 'rechazado',
                    mesaId: null // Limpiar mesaId en el estado local
                } : emp
            ));
            
            // Si la empresa tenía mesa asignada, recargar mesas disponibles
            if (empresaActual && empresaActual.mesaId && !empresaActual.isVirtual) {
                try {
                    const nuevasMesasDisponibles = await mesaService.getMesasDisponibles(empresaActual.eventoId);
                    setMesasDisponibles(nuevasMesasDisponibles);
                    console.log('🔄 Mesas disponibles actualizadas después del rechazo');
                } catch (err) {
                    console.error('Error recargando mesas disponibles:', err);
                }
            }
        } catch (err) {
            console.error('❌ Error al rechazar empresa:', err);
            alert('Error al rechazar la empresa. Por favor, intente nuevamente.');
        }
    };

    const handlePendiente = async (empresaId: string) => {
        try {
            console.log('⏳ Cambiando empresa a pendiente:', empresaId);
            
            // Obtener la empresa actual para verificar si tiene mesa asignada
            const empresaActual = empresas.find(emp => emp.id === empresaId);
            
            await empresaService.updateEmpresa(empresaId, { 
                estado: 'pendiente'
                // El backend manejará automáticamente la liberación de mesa
            });
            
            console.log('✅ Empresa cambiada a pendiente exitosamente');
            
            // Actualizar estado local
            setEmpresas(prev => prev.map(emp => 
                emp.id === empresaId ? { 
                    ...emp, 
                    estado: 'pendiente',
                    mesaId: null // Limpiar mesaId en el estado local
                } : emp
            ));
            
            // Si la empresa tenía mesa asignada, recargar mesas disponibles
            if (empresaActual && empresaActual.mesaId && !empresaActual.isVirtual) {
                try {
                    const nuevasMesasDisponibles = await mesaService.getMesasDisponibles(empresaActual.eventoId);
                    setMesasDisponibles(nuevasMesasDisponibles);
                    console.log('🔄 Mesas disponibles actualizadas después de cambiar a pendiente');
                } catch (err) {
                    console.error('Error recargando mesas disponibles:', err);
                }
            }
        } catch (err) {
            console.error('❌ Error al cambiar a pendiente:', err);
            alert('Error al cambiar el estado a pendiente. Por favor, intente nuevamente.');
        }
    };

    // Funciones para manejar el popup de selección de mesa
    const handleConfirmarMesa = async () => {
        if (!empresaSeleccionada || !mesaSeleccionada) return;

        try {
            console.log('🎯 Asignando mesa:', mesaSeleccionada, 'a empresa:', empresaSeleccionada);
            
            // El backend manejará automáticamente la asignación de mesa y cambio de estado
            await empresaService.updateEmpresa(empresaSeleccionada, { 
                estado: 'aceptado',
                mesaId: mesaSeleccionada
            });
            
            console.log('✅ Mesa asignada exitosamente');
            
            // Actualizar estado local de la empresa
            setEmpresas(prev => prev.map(emp => 
                emp.id === empresaSeleccionada ? { 
                    ...emp, 
                    estado: 'aceptado',
                    mesaId: mesaSeleccionada
                } : emp
            ));
            
            // Recargar mesas disponibles para el evento
            const empresa = empresas.find(emp => emp.id === empresaSeleccionada);
            if (empresa) {
                try {
                    const nuevasMesasDisponibles = await mesaService.getMesasDisponibles(empresa.eventoId);
                    setMesasDisponibles(nuevasMesasDisponibles);
                    console.log('🔄 Mesas disponibles actualizadas:', nuevasMesasDisponibles.length);
                } catch (err) {
                    console.error('Error recargando mesas disponibles:', err);
                }
            }
            
            // Cerrar popup
            setMesaSelectionOpen(false);
            setEmpresaSeleccionada(null);
            setMesaSeleccionada("");
        } catch (err) {
            console.error('❌ Error al asignar mesa:', err);
            alert('Error al asignar la mesa. Por favor, intente nuevamente.');
        }
    };

    const handleCancelarMesa = () => {
        setMesaSelectionOpen(false);
        setEmpresaSeleccionada(null);
        setMesaSeleccionada("");
    };

    const handleGenerarPDF = async (empresaId: string) => {
        try {
            // Obtener información completa de la empresa
            const empresa = await empresaService.getEmpresa(empresaId);
            
            // Obtener información del evento
            let eventoInfo = { nombre: 'No especificado', fechas: 'No especificado' };
            try {
                const evento = await eventoService.getEvento(empresa.eventoId);
                eventoInfo = {
                    nombre: evento.nombre,
                    fechas: `${new Date(evento.inicio).toLocaleDateString()} - ${new Date(evento.fin).toLocaleDateString()}`
                };
            } catch (err) {
                console.error('Error loading evento for PDF:', err);
            }
            
            // Obtener información del encargado
            let encargadoInfo = { nombre: 'No especificado', email: 'No especificado' };
            try {
                if (empresa.encargadoId) {
                    const encargado = await empresaService.getEmpresaByEncargado(empresa.encargadoId);
                    encargadoInfo = {
                        nombre: `${encargado.nombre || 'No especificado'}`,
                        email: encargado.email || 'No especificado'
                    };
                }
            } catch (err) {
                console.error('Error loading encargado for PDF:', err);
            }
            
            // Crear contenido del PDF
            const pdfContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Información de ${empresa.nombre}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .section { margin-bottom: 25px; }
                        .section h2 { color: #1e4b46; border-bottom: 2px solid #1e4b46; padding-bottom: 5px; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                        .info-item { margin-bottom: 10px; }
                        .label { font-weight: bold; color: #333; }
                        .value { color: #666; }
                        .logo { max-width: 200px; max-height: 100px; margin: 20px 0; }
                        .status { padding: 5px 10px; border-radius: 15px; color: white; font-weight: bold; }
                        .status.aceptado { background-color: #4caf50; }
                        .status.pendiente { background-color: #ff9800; }
                        .status.rechazado { background-color: #f44336; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${empresa.nombre}</h1>
                        ${empresa.logo_url ? `<img src="${empresa.logo_url}" alt="Logo" class="logo">` : ''}
                        <p>Información de la Empresa</p>
                    </div>

                    <div class="section">
                        <h2>Información General</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="label">Nombre:</span>
                                <span class="value">${empresa.nombre}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">NIT:</span>
                                <span class="value">${empresa.nit || 'No especificado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Rubro:</span>
                                <span class="value">${empresa.rubro || 'No especificado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Representante:</span>
                                <span class="value">${(empresa as any).representante || 'No especificado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Teléfono:</span>
                                <span class="value">${empresa.telefono || 'No especificado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Email:</span>
                                <span class="value">${empresa.email || 'No especificado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Sitio Web:</span>
                                <span class="value">${empresa.sitio_web || 'No especificado'}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Estado:</span>
                                <span class="status ${empresa.estado}">${getEstadoText(empresa.estado)}</span>
                            </div>
                        </div>
                    </div>

                    ${empresa.descripcion ? `
                    <div class="section">
                        <h2>Descripción</h2>
                        <p>${empresa.descripcion}</p>
                    </div>
                    ` : ''}

                    <div class="section">
                        <h2>Información del Evento</h2>
                        <div class="info-item">
                            <span class="label">Evento:</span>
                            <span class="value">${eventoInfo.nombre}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Fechas:</span>
                            <span class="value">${eventoInfo.fechas}</span>
                        </div>
                    </div>

                    <div class="section">
                        <h2>Modalidad de Participación</h2>
                        <div class="info-item">
                            <span class="label">Tipo:</span>
                            <span class="value">${empresa.isVirtual ? 'Virtual' : 'Presencial'}</span>
                        </div>
                    </div>

                    <div class="section">
                        <h2>Información de Contacto</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="label">Encargado:</span>
                                <span class="value">${encargadoInfo.nombre}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Email Encargado:</span>
                                <span class="value">${encargadoInfo.email}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">Personal:</span>
                                <span class="value">${empresa.personalIds?.length || 0} empleados registrados</span>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <p><em>Documento generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</em></p>
                    </div>
                </body>
                </html>
            `;

            // Crear ventana para imprimir
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(pdfContent);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }
        } catch (err) {
            console.error('Error al generar PDF:', err);
            alert('Error al generar el PDF');
        }
    };

    // Función para obtener color del estado
    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'aceptado': return 'success';
            case 'rechazado': return 'error';
            case 'pendiente': return 'warning';
            default: return 'default';
        }
    };

    // Función para obtener texto del estado
    const getEstadoText = (estado: string) => {
        switch (estado) {
            case 'aceptado': return 'Aceptado';
            case 'rechazado': return 'Rechazado';
            case 'pendiente': return 'Pendiente';
            default: return estado;
        }
    };

    // Estados de carga y error
    if (loading) {
        return (
            <Box sx={{ 
                minHeight: "100vh", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                backgroundColor: "#fff"
            }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ 
                minHeight: "100vh", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                backgroundColor: "#fff",
                px: 3
            }}>
                <Alert severity="error" sx={{ maxWidth: 400 }}>
                    {error}
                </Alert>
            </Box>
        );
    }



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
                        Participantes
                    </Typography>
                </Stack>
                
                {/* Indicador de mesas disponibles */}
                <Box sx={{ mt: 1, px: 2 }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Mesas disponibles: {mesasDisponibles.length}
                        {empresas.length > 0 && (
                            <span style={{ marginLeft: 8, fontSize: '0.75rem' }}>
                                (Empresas presenciales pendientes: {empresas.filter(emp => !emp.isVirtual && emp.estado === 'pendiente').length})
                            </span>
                        )}
                    </Typography>
                </Box>
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
                {filtered.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            {q ? 'No se encontraron empresas con ese criterio de búsqueda' : 'No hay empresas registradas'}
                        </Typography>
                    </Box>
                ) : (
                <Stack spacing={1.5}>
                    {filtered.map((c) => {
                        const expanded = expandedMediaId === c.id;

                        return (
                            <Card
                                key={c.id}
                                elevation={0}
                                sx={{
                                    borderRadius: 1, 
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                                    maxWidth: 400,
                                    minWidth: 0,
                                    margin: '0 auto',
                                    px: 1,
                                    py: 1,
                                }}
                            >
                                <Box sx={{ p: 1.25 }}>
                                    <Stack direction="row" alignItems="center" spacing={1.25}>
                                        {/* Avatar clickeable */}
                                        <Box
                                            role="button"
                                            onClick={() =>
                                                setExpandedMediaId((cur) => (cur === c.id ? null : c.id))
                                            }
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: "50%",
                                                background: c.iconBg ?? theme.palette.primary.main,
                                                display: "grid",
                                                placeItems: "center",
                                                color: "#fff",
                                                fontWeight: 900,
                                                cursor: "pointer",
                                                transform: expanded ? "scale(1.08)" : "scale(1)",
                                                transition: "transform 150ms ease",
                                                boxShadow: expanded
                                                    ? "0 6px 18px rgba(0,0,0,0.2)"
                                                    : "none",
                                            }}
                                        >
                                            <span style={{ fontSize: 18 }}>{c.name[0]}</span>
                                        </Box>

                                        {/* Texto */}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Typography
                                                    sx={{
                                                        fontWeight: 800,
                                                        lineHeight: 1.1,
                                                        fontSize: { xs: 14.5, sm: 16 },
                                                    }}
                                                >
                                                    {c.name}
                                                </Typography>
                                                <ExpandMore
                                                    sx={{
                                                        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                                                        transition: "transform 150ms ease",
                                                        fontSize: 18,
                                                        color: alpha("#000", 0.5),
                                                    }}
                                                />
                                            </Stack>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: 12.5, sm: 13.5 } }}
                                            >
                                                {c.contact}
                                            </Typography>

                                            {/* Información del evento */}
                                            <Box sx={{ mt: 0.5 }}>
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <Event sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ 
                                                            fontSize: { xs: 11, sm: 12 },
                                                            fontWeight: 600,
                                                            color: theme.palette.primary.main
                                                        }}
                                                    >
                                                        {c.eventoNombre}
                                                    </Typography>
                                                </Stack>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ 
                                                        fontSize: { xs: 10, sm: 11 },
                                                        ml: 2
                                                    }}
                                                >
                                                    {c.eventoFechas}
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                            <Chip
                                                size="small"
                                                label={c.sector}
                                                sx={{
                                                    bgcolor: alpha("#FBAA29", 0.3),
                                                    color: "#5b4a00",
                                                    fontWeight: 700,
                                                    height: 22,
                                                    fontSize: { xs: 11, sm: 12 },
                                                }}
                                            />
                                                <Chip
                                                    size="small"
                                                    label={getEstadoText(c.estado)}
                                                    color={getEstadoColor(c.estado) as any}
                                                    variant="filled"
                                                    sx={{
                                                        height: 22,
                                                        fontSize: { xs: 11, sm: 12 },
                                                        fontWeight: 700,
                                                    }}
                                                />
                                                <Chip
                                                    size="small"
                                                    label={c.isVirtual ? 'Virtual' : 'Presencial'}
                                                    sx={{
                                                        bgcolor: c.isVirtual ? alpha("#9c27b0", 0.3) : alpha("#4caf50", 0.3),
                                                        color: c.isVirtual ? "#6a1b9a" : "#2e7d32",
                                                        fontWeight: 700,
                                                        height: 22,
                                                        fontSize: { xs: 11, sm: 12 },
                                                    }}
                                                />
                                            </Stack>
                                        </Box>
                                        <Stack direction="column" spacing={0.5} sx={{ minWidth: 10 }}>
                                            {/* Botones dinámicos según el estado */}
                                            {c.estado === 'pendiente' && (
                                                <>
    <Button
        variant="contained"
        color="success"
        size="small"
                                                        onClick={() => handleAceptar(c.id)}
        sx={{
            borderRadius: 2,
            fontWeight: 700,
            px: 1,
            py: 0.2,
            fontSize: 11,
            minWidth: 0,
            width: '100%',
            lineHeight: 2,
        }}
    >
        Aceptar
    </Button>
    <Button
        variant="contained"
        color="error"
        size="small"
                                                        onClick={() => handleRechazar(c.id)}
                                                        sx={{
                                                            borderRadius: 2,
                                                            fontWeight: 700,
                                                            px: 1,
                                                            py: 0.2,
                                                            fontSize: 11,
                                                            minWidth: 0,
                                                            width: '100%',
                                                            lineHeight: 2,
                                                        }}
                                                    >
                                                        Rechazar
                                                    </Button>
                                                </>
                                            )}
                                            
                                            {c.estado === 'aceptado' && (
                                                <>
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        size="small"
                                                        onClick={() => handleRechazar(c.id)}
        sx={{
            borderRadius: 2,
            fontWeight: 700,
            px: 1,
            py: 0.2,
            fontSize: 11,
            minWidth: 0,
            width: '100%',
            lineHeight: 2,
        }}
    >
        Rechazar
    </Button>
    <Button
                                                        variant="contained"
                                                        color="warning"
                                                        size="small"
                                                        onClick={() => handlePendiente(c.id)}
                                                        sx={{
                                                            borderRadius: 2,
                                                            fontWeight: 700,
                                                            px: 1,
                                                            py: 0.2,
                                                            fontSize: 11,
                                                            minWidth: 0,
                                                            width: '100%',
                                                            lineHeight: 2,
                                                        }}
                                                    >
                                                        Pendiente
                                                    </Button>
                                                </>
                                            )}
                                            
                                            {c.estado === 'rechazado' && (
                                                <>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        onClick={() => handleAceptar(c.id)}
                                                        sx={{
                                                            borderRadius: 2,
                                                            fontWeight: 700,
                                                            px: 1,
                                                            py: 0.2,
                                                            fontSize: 11,
                                                            minWidth: 0,
                                                            width: '100%',
                                                            lineHeight: 2,
                                                        }}
                                                    >
                                                        Aceptar
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="warning"
        size="small"
                                                        onClick={() => handlePendiente(c.id)}
        sx={{
            borderRadius: 2,
            fontWeight: 700,
            px: 1,
            py: 0.2,
            fontSize: 11,
            minWidth: 0,
            width: '100%',
            lineHeight: 2,
        }}
    >
                                                        Pendiente
    </Button>
                                                </>
                                            )}
                                            
</Stack>
                                    </Stack>

                                    {/* Panel de acciones (URL/PDF) */}
                                    <Collapse in={expanded} unmountOnExit>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{ mt: 1.25, pl: { xs: 6.5, sm: 6.5 } }}
                                        >
                                            <Tooltip title={c.url ? "Abrir sitio" : "Sin sitio"}>
                                                <span>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => openUrl(c.url)}
                                                        disabled={!c.url}
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
                                            <Tooltip title="Generar PDF de la empresa">
                                                <span>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => handleGenerarPDF(c.id)}
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
            {/* Overlay de éxito (3s) */}
            <Backdrop
                open={overlayOpen}
                sx={{
                    zIndex: (th) => th.zIndex.modal + 1,
                    background: theme.palette.primary.main,
                    color: "#fff",
                }}
            >
                <Stack alignItems="center" spacing={2}>
                    <CheckCircleOutline sx={{ fontSize: 90 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Solicitud enviada correctamente
                    </Typography>
                </Stack>
            </Backdrop>
            
            {/* Popup de selección de mesa */}
            <Dialog 
                open={mesaSelectionOpen} 
                onClose={handleCancelarMesa}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: "#1e4b46" }}>
                        Asignar Mesa
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        {/* Información de la empresa */}
                        {empresaSeleccionada && (
                            <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                    Empresa a asignar:
                                </Typography>
                                <Typography variant="body2">
                                    {empresas.find(emp => emp.id === empresaSeleccionada)?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Modalidad: Presencial
                                </Typography>
                            </Box>
                        )}
                        
                        <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                            Selecciona una mesa disponible para asignar a la empresa:
                        </Typography>
                        
                        <FormControl fullWidth>
                            <InputLabel>Mesa</InputLabel>
                            <Select
                                value={mesaSeleccionada}
                                onChange={(e) => setMesaSeleccionada(e.target.value)}
                                label="Mesa"
                            >
                                {mesasDisponibles.map((mesa) => (
                                    <MenuItem key={mesa._id} value={mesa._id}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {mesa.nombre || `Mesa ${mesa.numero}`}
                                            </Typography>
                                            {mesa.capacidad && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Capacidad: {mesa.capacidad} asientos
                                                </Typography>
                                            )}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        {mesasDisponibles.length === 0 && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    No hay mesas disponibles
                                </Typography>
                                <Typography variant="caption">
                                    Todas las mesas están ocupadas o el evento ha finalizado. Contacte al administrador.
                                </Typography>
                            </Alert>
                        )}
                        
                        {mesasDisponibles.length > 0 && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="caption">
                                    Se encontraron {mesasDisponibles.length} mesa(s) disponible(s) para asignar.
                                </Typography>
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button 
                        onClick={handleCancelarMesa}
                        variant="outlined"
                        sx={{ textTransform: 'none' }}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirmarMesa}
                        variant="contained"
                        disabled={!mesaSeleccionada || mesasDisponibles.length === 0}
                        sx={{ 
                            textTransform: 'none',
                            backgroundColor: theme.palette.primary.main,
                            '&:hover': {
                                backgroundColor: theme.palette.primary.dark,
                            }
                        }}
                    >
                        Asignar Mesa
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Barra inferior */}
            <Navigation />
        </Box>
    );
}
