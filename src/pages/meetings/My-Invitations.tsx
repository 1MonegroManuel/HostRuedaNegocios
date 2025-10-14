import {
  Box,
  Card,
  Chip,
  IconButton,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";

import {
  ArrowBackIosNewOutlined,
  Search,
  Person,
  Business,
  Email,
  TableRestaurant,
  Event,
  AccessTime,
  VideoCall,
  Cancel,
} from "@mui/icons-material";

import Navigation from "../../navigation/Navigation";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@mui/material";
import { solicitudReunionService } from "../../apiService/services/solicitudReunionService";
import { empresaService } from "../../apiService/services/empresaService";
import { useAuth } from "../../contexts/AuthContext";
type Invitation = {
  _id: string;
  estado: "pendiente" | "aceptada" | "rechazada" | "cancelada";
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

function MyInvitations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get empresa data
  const getEmpresaData = (empresaId: string | any) => {
    return typeof empresaId === 'object' ? empresaId : null;
  };

  // Helper function to get mesa data
  const getMesaData = (mesaId: string | any) => {
    return typeof mesaId === 'object' ? mesaId : null;
  };

  useEffect(() => {
    const loadInvitations = async () => {
      if (!user) {
        setError("Usuario no autenticado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Obtener la empresa del usuario
        console.log("👤 Usuario logueado:", user);
        console.log("🏢 Tipo de usuario:", user.tipoUsuario);
        
        let userEmpresa = null;
        if (user.tipoUsuario === 'encargado') {
          console.log("🔍 Buscando empresa para encargado:", user._id);
          userEmpresa = await empresaService.getEmpresaByEncargado(user._id);
          console.log("🏢 Empresa encontrada para encargado:", userEmpresa);
        } else if (user.tipoUsuario === 'personal') {
          console.log("🔍 Buscando empresa para personal:", user._id);
          const empresasResponse = await empresaService.getEmpresas();
          userEmpresa = empresasResponse.data.find(empresa => 
            empresa.personalIds?.includes(user._id)
          );
          console.log("🏢 Empresa encontrada para personal:", userEmpresa);
        }

        if (!userEmpresa) {
          console.log("❌ No se encontró empresa asociada al usuario");
          setError("No se encontró empresa asociada al usuario");
          setLoading(false);
          return;
        }

        console.log("✅ Empresa del usuario:", userEmpresa);
        console.log("✅ ID de la empresa:", userEmpresa._id);

        // Cargar solicitudes enviadas por la empresa del usuario (todas las invitaciones)
        const [pendientesResponse, canceladasResponse, aceptadasResponse, rechazadasResponse] = await Promise.all([
          solicitudReunionService.getSolicitudesEnviadas(userEmpresa._id, { estado: 'pendiente' }),
          solicitudReunionService.getSolicitudesEnviadas(userEmpresa._id, { estado: 'cancelada' }),
          solicitudReunionService.getSolicitudesEnviadas(userEmpresa._id, { estado: 'aceptada' }),
          solicitudReunionService.getSolicitudesEnviadas(userEmpresa._id, { estado: 'rechazada' })
        ]);
        
        const todasLasSolicitudes = [
          ...pendientesResponse.data,
          ...canceladasResponse.data,
          ...aceptadasResponse.data,
          ...rechazadasResponse.data
        ];

        setInvitations(todasLasSolicitudes as Invitation[]);
        console.log("📤 Solicitudes enviadas (pendientes):", pendientesResponse.data);
        console.log("📤 Solicitudes enviadas (canceladas):", canceladasResponse.data);
        console.log("📤 Solicitudes enviadas (aceptadas):", aceptadasResponse.data);
        console.log("📤 Solicitudes enviadas (rechazadas):", rechazadasResponse.data);
        
      } catch (error) {
        console.error("❌ Error cargando invitaciones:", error);
        setError("Error al cargar las invitaciones");
      } finally {
        setLoading(false);
      }
    };

    loadInvitations();
  }, [user]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return invitations;
    return invitations.filter((i) => {
      const empresa = getEmpresaData(i.empresaObjetivoId);
      return `${empresa?.nombre || ''} ${empresa?.representante || ''}`.toLowerCase().includes(term);
    });
  }, [search, invitations]);

  const getChipProps = (estado: Invitation["estado"]) => {
    switch (estado) {
      case "aceptada":
        return { color: "success" as const, label: "Aceptada" };
      case "rechazada":
        return { color: "error" as const, label: "Rechazada" };
      case "pendiente":
        return { color: "warning" as const, label: "Pendiente" };
      case "cancelada":
        return { color: "default" as const, label: "Cancelada" };
      default:
        return { color: "default" as const, label: "Desconocido" };
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      // Verificar que la invitación esté en estado pendiente
      const invitation = invitations.find(inv => inv._id === invitationId);
      if (!invitation) {
        console.error("❌ Invitación no encontrada");
        setError("Invitación no encontrada");
        return;
      }

      if (invitation.estado !== 'pendiente') {
        console.error("❌ Solo se pueden cancelar invitaciones pendientes");
        setError("Solo se pueden cancelar invitaciones pendientes");
        return;
      }

      const solicitudActualizada = await solicitudReunionService.cancelarSolicitud(invitationId);
      
      // Actualizar el estado de la invitación en lugar de eliminarla
      setInvitations(invitations.map(inv => 
        inv._id === invitationId 
          ? { ...inv, estado: 'cancelada' as const }
          : inv
      ));
      
      console.log("✅ Invitación cancelada exitosamente:", solicitudActualizada);
    } catch (error) {
      console.error("❌ Error cancelando invitación:", error);
      setError("Error al cancelar la invitación");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fff", pb: 8 }}>
      {/* Encabezado */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: "#1e4b46" }}>
            <ArrowBackIosNewOutlined />
          </IconButton>
          <Typography variant="h2" sx={{ fontWeight: 800, color: "#1e4b46", fontSize: 26 }}>
            Mis invitaciones
          </Typography>
        </Stack>
      </Box>

      {/* Buscador */}
      <Box sx={{ px: 3, mb: 1 }}>
        <TextField
          fullWidth
          placeholder="Busca por nombre de empresa o representante"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            backgroundColor: "#fff",
            borderRadius: 2,
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        />
      </Box>

      {/* Estados de carga y error */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Box sx={{ px: 3, pb: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      {/* Lista de invitaciones */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Stack spacing={2}>
          {!loading && !error && filtered.length === 0 && (
            <Card sx={{ p: 3, textAlign: 'center', backgroundColor: "#f6fdfc" }}>
              <Typography variant="body1" color="text.secondary">
                No tienes invitaciones enviadas
              </Typography>
            </Card>
          )}

          {filtered.map((invitation) => {
            const chip = getChipProps(invitation.estado);
            const empresa = getEmpresaData(invitation.empresaObjetivoId);
            const mesa = getMesaData(invitation.mesaPreferidaId);
            const fechaInicio = invitation.inicioPropuesto ? new Date(invitation.inicioPropuesto) : null;
            const fechaFin = invitation.finPropuesto ? new Date(invitation.finPropuesto) : null;

            return (
              <Card key={invitation._id} sx={{ p: 2, borderRadius: 3, backgroundColor: "#f6fdfc" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={empresa?.logo_url || `https://i.pravatar.cc/100?u=${empresa?._id}`}
                      alt={empresa?.nombre || 'Empresa'}
                      sx={{
                        width: 64,
                        height: 64,
                        border: `3px solid ${
                          chip.color === "success"
                            ? "#4caf50"
                            : chip.color === "error"
                            ? "#f44336"
                            : chip.color === "warning"
                            ? "#ff9800"
                            : "#90caf9"
                        }`,
                      }}
                    />
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        <Business fontSize="small" /> {empresa?.nombre || 'Empresa'}
                      </Typography>
                      <Typography variant="body2">
                        <Person fontSize="small" /> {empresa?.representante || 'Sin representante'}
                      </Typography>
                      {empresa?.email && (
                        <Typography variant="body2">
                          <Email fontSize="small" /> {empresa.email}
                        </Typography>
                      )}
                      {empresa?.sitio_web && (
                        <Typography variant="body2">
                          <Business fontSize="small" /> {empresa.sitio_web}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>

                  <Stack alignItems="flex-end" spacing={1}>
                    <Chip label={chip.label} color={chip.color} />
                    <Button
                      size="small"
                      color={invitation.estado === 'pendiente' ? 'error' : 'inherit'}
                      startIcon={<Cancel />}
                      onClick={() => handleCancelInvitation(invitation._id)}
                      disabled={invitation.estado !== 'pendiente'}
                      sx={{
                        opacity: invitation.estado !== 'pendiente' ? 0.6 : 1,
                      }}
                    >
                      {invitation.estado === 'pendiente' ? 'Cancelar' : 
                       invitation.estado === 'cancelada' ? 'Cancelada' :
                       invitation.estado === 'aceptada' ? 'Aceptada' :
                       invitation.estado === 'rechazada' ? 'Rechazada' : 'Desconocido'}
                    </Button>
                  </Stack>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="body2">
                    {invitation.tipoReunion === "virtual" ? (
                      <VideoCall fontSize="small" />
                    ) : (
                      <TableRestaurant fontSize="small" />
                    )}{" "}
                    {invitation.tipoReunion === "virtual" ? "VIRTUAL" : `PRESENCIAL${mesa ? ` - Mesa ${mesa.numero}` : ''}`}
                  </Typography>

                  {fechaInicio && (
                    <Typography variant="body2">
                      <Event fontSize="small" /> {fechaInicio.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  )}

                  {fechaInicio && fechaFin && (
                    <Typography variant="body2">
                      <AccessTime fontSize="small" /> {fechaInicio.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {fechaFin.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  )}

                  {invitation.mensaje && (
                    <Typography variant="body2" sx={{ 
                      backgroundColor: '#f0f0f0', 
                      p: 1, 
                      borderRadius: 1,
                      fontStyle: 'italic'
                    }}>
                      "{invitation.mensaje}"
                    </Typography>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Box>

      {/* Navegación inferior */}
      <Navigation />
    </Box>
  );
}

export default MyInvitations;