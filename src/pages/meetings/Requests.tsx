// src/pages/Requests.tsx
import {
  Box,
  Card,
  IconButton,
  Stack,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";

import {
  AccessTime,
  Business,
  Person,
  VideoCall,
  Event,
  ArrowBackIosNewOutlined,
  Search,
  CheckCircleOutline,
  Mail,
} from "@mui/icons-material";

import Navigation from "../../navigation/Navigation";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { solicitudReunionService } from "../../apiService/services/solicitudReunionService";
import { empresaService } from "../../apiService/services/empresaService";
import { useAuth } from "../../contexts/AuthContext";
import { CircularProgress, Alert } from "@mui/material";

type Request = {
  _id: string;
  estado: "pendiente" | "aceptada" | "rechazada" | "cancelada";
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

type ActionType = "accept" | "reject";

function Requests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayMsg, setOverlayMsg] = useState<string>("");

  // target para confirmar
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string;
    action: ActionType;
  } | null>(null);

  // Cargar solicitudes recibidas
  useEffect(() => {
    const loadRequests = async () => {
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
          // Para personal, buscar en todas las empresas del evento
          // Necesitaríamos el eventoId, pero por ahora asumimos que el usuario tiene acceso
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

        // Cargar solicitudes recibidas por la empresa del usuario
        const solicitudesResponse = await solicitudReunionService.getSolicitudesRecibidas(
          userEmpresa._id,
          { estado: 'pendiente' }
        );

        setRequests(solicitudesResponse.data as Request[]);
        console.log("📝 Solicitudes recibidas:", solicitudesResponse.data);
        console.log("📝 Primera solicitud (debug):", solicitudesResponse.data[0]);
        if (solicitudesResponse.data[0]) {
          console.log("📝 Empresa solicitante:", getEmpresaData(solicitudesResponse.data[0].empresaSolicitaId));
        }
        
      } catch (error) {
        console.error("❌ Error cargando solicitudes:", error);
        setError("Error al cargar las solicitudes");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [user]);

  // Helper function to get empresa data
  const getEmpresaData = (empresaId: string | any) => {
    return typeof empresaId === 'object' ? empresaId : null;
  };

  // Helper function to get mesa data
  const getMesaData = (mesaId: string | any) => {
    return typeof mesaId === 'object' ? mesaId : null;
  };

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) => {
      const empresa = getEmpresaData(r.empresaSolicitaId);
      return `${empresa?.nombre || ''} ${empresa?.representante || ''}`.toLowerCase().includes(term);
    });
  }, [search, requests]);

  const getColor = (estado: Request["estado"]) => {
    switch (estado) {
      case "pendiente":
        return "info";
      case "aceptada":
        return "success";
      case "rechazada":
        return "error";
      case "cancelada":
        return "warning";
      default:
        return "default";
    }
  };

  const askConfirm = (id: string, action: ActionType) => {
    setConfirmTarget({ id, action });
  };

  const doConfirm = async () => {
    if (!confirmTarget) return;
    const { id, action } = confirmTarget;

    try {
      // Actualizar el estado de la solicitud en el backend
      if (action === "accept") {
        await solicitudReunionService.aceptarSolicitud(id);
      } else {
        await solicitudReunionService.rechazarSolicitud(id);
      }

      // Actualizar el estado local
      setRequests((prev) => prev.filter((r) => r._id !== id));

      // overlay de feedback
      setOverlayMsg(action === "accept" ? "Solicitud aceptada" : "Solicitud rechazada");
      setOverlayOpen(true);
      setTimeout(() => setOverlayOpen(false), 2000);

      console.log(`✅ Solicitud ${action === "accept" ? "aceptada" : "rechazada"}:`, id);
      
    } catch (error) {
      console.error(`❌ Error ${action === "accept" ? "aceptando" : "rechazando"} solicitud:`, error);
      alert(`Error al ${action === "accept" ? "aceptar" : "rechazar"} la solicitud`);
    }

    // cierra el diálogo
    setConfirmTarget(null);
  };

  const cancelConfirm = () => setConfirmTarget(null);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fff", pb: 8 }}>
      {/* Encabezado */}
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
      <Box sx={{ px: 3, mb: 1 }}>
        <TextField
          fullWidth
          placeholder="Busca por nombre, empresa o correo"
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

      {/* Lista de solicitudes */}
      <Box sx={{ px: 3, pb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : filteredRequests.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No tienes solicitudes pendientes
          </Alert>
        ) : (
          <Stack spacing={2}>
            {filteredRequests.map((req) => {
              const fechaInicio = req.inicioPropuesto ? new Date(req.inicioPropuesto) : null;
              const fechaFin = req.finPropuesto ? new Date(req.finPropuesto) : null;
              
              return (
                <Card key={req._id} sx={{ p: 2, borderRadius: 3, backgroundColor: "#f6fdfc" }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start" mt={2}>
                    <Avatar
                      src={getEmpresaData(req.empresaSolicitaId)?.logo_url || `https://i.pravatar.cc/100?u=${getEmpresaData(req.empresaSolicitaId)?._id}`}
                      alt={getEmpresaData(req.empresaSolicitaId)?.nombre || 'Empresa'}
                      sx={{
                        width: 64,
                        height: 64,
                        border: `3px solid ${getColor(req.estado) === "success"
                            ? "#4caf50"
                            : getColor(req.estado) === "error"
                              ? "#f44336"
                              : getColor(req.estado) === "warning"
                                ? "#ff9800"
                                : "#90caf9"
                          }`,
                      }}
                    />

                    <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        <Person fontSize="small" /> {getEmpresaData(req.empresaSolicitaId)?.representante || 'Sin representante'}
                      </Typography>
                      <Typography variant="body2">
                        <Business fontSize="small" /> {getEmpresaData(req.empresaSolicitaId)?.nombre}
                      </Typography>
                      {getEmpresaData(req.empresaSolicitaId)?.email && (
                        <Typography variant="body2">
                          <Mail fontSize="small" /> {getEmpresaData(req.empresaSolicitaId)?.email}
                        </Typography>
                      )}
                      {getEmpresaData(req.empresaSolicitaId)?.sitio_web && (
                        <Typography variant="body2">
                          <Business fontSize="small" /> {getEmpresaData(req.empresaSolicitaId)?.sitio_web}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        {req.tipoReunion === "virtual" ? (
                          <VideoCall fontSize="small" />
                        ) : (
                          <Business fontSize="small" />
                        )}{" "}
                        {req.tipoReunion === "virtual" ? "VIRTUAL" : `PRESENCIAL${getMesaData(req.mesaPreferidaId) ? ` - MESA ${getMesaData(req.mesaPreferidaId)?.numero}` : ''}`}
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
                      {req.mensaje && (
                        <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                          <strong>Mensaje:</strong> {req.mensaje}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={2} mt={2}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => askConfirm(req._id, "accept")}
                    >
                      ACEPTAR
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => askConfirm(req._id, "reject")}
                    >
                      RECHAZAR
                    </Button>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Diálogo de confirmación */}
      <Dialog
        open={!!confirmTarget}
        onClose={cancelConfirm}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Confirmar acción
        </DialogTitle>
        <DialogContent dividers>
          <Typography>
            {confirmTarget?.action === "accept"
              ? "¿Deseas aceptar esta invitación?"
              : "¿Deseas rechazar esta invitación?"}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" color="warning" onClick={cancelConfirm}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={confirmTarget?.action === "accept" ? "success" : "error"}
            sx={{ color: "#000" }}
            onClick={doConfirm}
          >
            {confirmTarget?.action === "accept" ? "Aceptar" : "Rechazar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Overlay de éxito */}
      {overlayOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(30, 75, 70, 0.85)",
            color: "#fff",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <CheckCircleOutline sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h6" fontWeight={800}>
            {overlayMsg}
          </Typography>
        </Box>
      )}

      {/* Navegación inferior */}
      <Navigation />
    </Box>
  );
}

export default Requests;
