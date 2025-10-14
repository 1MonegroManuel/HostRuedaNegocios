import {
  Box,
  Card,
  Chip,
  IconButton,
  Stack,
  Typography,
  Tooltip,
  Avatar,
} from "@mui/material";

import {
  Call,
  Message,
  Business,
  Person,
  Mail,
  Event,
  AccessTime,
  CheckCircle,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import Navigation from "../../navigation/Navigation";
import { useState, useEffect } from "react";
import { solicitudReunionService } from "../../apiService/services/solicitudReunionService";
import { empresaService } from "../../apiService/services/empresaService";
import { useAuth } from "../../contexts/AuthContext";
import { CircularProgress, Alert } from "@mui/material";

type AgendaItem = {
  _id: string;
  estado: "aceptada";
  empresaSolicitaId: string | {
    _id: string;
    nombre: string;
    representante?: string;
    email?: string;
    sitio_web?: string;
    logo_url?: string;
  };
  empresaObjetivoId: string | {
    _id: string;
    nombre: string;
    representante?: string;
    email?: string;
    sitio_web?: string;
    logo_url?: string;
  };
  usuarioSolicitaId: string;
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

const getEmpresaData = (empresaId: string | any) => {
  return typeof empresaId === 'object' ? empresaId : null;
};

const getMesaData = (mesaId: string | any) => {
  return typeof mesaId === 'object' ? mesaId : null;
};

const getEstadoChip = (estado: AgendaItem["estado"]) => {
  switch (estado) {
    case "aceptada":
      return {
        label: "Confirmada",
        color: "success" as const,
        icon: <CheckCircle fontSize="small" />,
      };
    default:
      return {
        label: "Desconocido",
        color: "default" as const,
        icon: undefined,
      };
  }
};

function MyAgenda() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmpresa, setUserEmpresa] = useState<any>(null);

  // Cargar agenda (solicitudes aceptadas)
  useEffect(() => {
    const loadAgenda = async () => {
      if (!user) {
        setError("Usuario no autenticado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Obtener la empresa del usuario
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

        // Guardar la empresa del usuario en el estado
        setUserEmpresa(userEmpresa);

        // Cargar solicitudes aceptadas (tanto enviadas como recibidas)
        const [solicitudesEnviadas, solicitudesRecibidas] = await Promise.all([
          solicitudReunionService.getSolicitudesEnviadas(
            userEmpresa._id,
            { estado: 'aceptada' }
          ),
          solicitudReunionService.getSolicitudesRecibidas(
            userEmpresa._id,
            { estado: 'aceptada' }
          )
        ]);

        // Combinar ambas listas y ordenar por fecha
        const todasLasSolicitudes = [
          ...solicitudesEnviadas.data,
          ...solicitudesRecibidas.data
        ].sort((a, b) => {
          const fechaA = a.inicioPropuesto ? new Date(a.inicioPropuesto).getTime() : 0;
          const fechaB = b.inicioPropuesto ? new Date(b.inicioPropuesto).getTime() : 0;
          return fechaA - fechaB;
        });

        setAgendaItems(todasLasSolicitudes as AgendaItem[]);
        console.log("📅 Agenda cargada:", todasLasSolicitudes);
        
      } catch (error) {
        console.error("❌ Error cargando agenda:", error);
        setError("Error al cargar la agenda");
      } finally {
        setLoading(false);
      }
    };

    loadAgenda();
  }, [user]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
        pb: "88px", // espacio para la navegación inferior
      }}
    >
      {/* Encabezado con botón de retroceso */}
      <Box sx={{ display: "flex", alignItems: "center", px: 3, pt: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBack sx={{ color: "#1e4b46" }} />
        </IconButton>
        <Typography variant="h5" fontWeight={800}>
          Mi Agenda
        </Typography>
      </Box>

      {/* Lista de reuniones */}
      <Box sx={{ px: 3, pt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : agendaItems.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No tienes reuniones programadas
          </Alert>
        ) : (
          <Stack spacing={2}>
            {agendaItems.map((item) => {
              const estado = getEstadoChip(item.estado);
              const fechaInicio = item.inicioPropuesto ? new Date(item.inicioPropuesto) : null;
              const fechaFin = item.finPropuesto ? new Date(item.finPropuesto) : null;
              
              // Determinar qué empresa mostrar (la otra empresa en la reunión)
              // Si soy la empresa que solicitó, muestro la empresa objetivo
              // Si soy la empresa objetivo, muestro la empresa que solicitó
              const miEmpresaId = userEmpresa?._id;
              const empresaSolicitaId = getEmpresaData(item.empresaSolicitaId)?._id || item.empresaSolicitaId;
              const otraEmpresa = empresaSolicitaId === miEmpresaId 
                ? getEmpresaData(item.empresaObjetivoId)
                : getEmpresaData(item.empresaSolicitaId);

              return (
                <Card
                  key={item._id}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: "#f6fdfc",
                    transition: "0.3s",
                    "&:hover": {
                      boxShadow: 4,
                      backgroundColor: "#e0f7fa",
                    },
                  }}
                >
                  {/* Empresa + Estado */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={otraEmpresa?.logo_url || `https://i.pravatar.cc/100?u=${otraEmpresa?._id}`}
                        alt={otraEmpresa?.nombre || 'Empresa'}
                        sx={{
                          width: 48,
                          height: 48,
                          border: `2px solid ${
                            estado.color === "success"
                              ? "#4caf50"
                              : "#90caf9"
                          }`,
                        }}
                      />
                      <Stack spacing={0.3}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          <Person fontSize="small" /> {otraEmpresa?.representante || 'Sin representante'}
                        </Typography>
                        <Typography variant="body2">
                          <Business fontSize="small" /> {otraEmpresa?.nombre}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Chip icon={estado.icon} label={estado.label} color={estado.color} />
                  </Stack>

                  {/* Contacto + Mesa */}
                  <Stack direction="row" justifyContent="space-between" mt={1.5}>
                    <Stack spacing={0.5}>
                      {otraEmpresa?.email && (
                        <Typography variant="body2">
                          <Mail fontSize="small" /> {otraEmpresa.email}
                        </Typography>
                      )}
                      {otraEmpresa?.sitio_web && (
                        <Typography variant="body2">
                          <Business fontSize="small" /> {otraEmpresa.sitio_web}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <Event fontSize="small" /> 
                        {item.tipoReunion === "virtual" 
                          ? " Reunión Virtual" 
                          : ` Mesa: ${getMesaData(item.mesaPreferidaId)?.numero || 'No asignada'}`
                        }
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      {otraEmpresa?.sitio_web && (
                        <Tooltip title="Visitar sitio web">
                          <IconButton 
                            component="a" 
                            href={otraEmpresa.sitio_web.startsWith('http') ? otraEmpresa.sitio_web : `https://${otraEmpresa.sitio_web}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Call />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Ver mensaje">
                        <IconButton disabled={!item.mensaje}>
                          <Message />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  {/* Mensaje */}
                  {item.mensaje && (
                    <Stack spacing={0.5} mt={1}>
                      <Typography variant="body2" sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                        <strong>Mensaje:</strong> {item.mensaje}
                      </Typography>
                    </Stack>
                  )}

                  {/* Horario */}
                  {fechaInicio && fechaFin && (
                    <Stack direction="row" spacing={1} mt={1.5}>
                      <AccessTime fontSize="small" />
                      <Typography variant="body2">
                        {fechaInicio.toLocaleDateString('es-ES', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })} - {fechaInicio.toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} a {fechaFin.toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    </Stack>
                  )}
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Navegación inferior */}
      <Navigation />
    </Box>
  );
}

export default MyAgenda;