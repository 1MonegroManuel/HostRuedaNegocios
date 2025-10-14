import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Chip,
  Avatar,
} from "@mui/material";
import { ArrowBackIosNewOutlined, Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Navigation from "../../navigation/Navigation";
import theme from "../../theme/themes";
import { useAuth } from "../../contexts/AuthContext";
import { empresaService } from "../../apiService/services/empresaService";
import { authService } from "../../apiService/services/authService";

type Employee = {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  tipoUsuario: string;
  creado_en: string;
};

export default function CompanyEmployees() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<any>(null);

  useEffect(() => {
    const loadEmployees = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        
        // Obtener la empresa del encargado
        const empresaData = await empresaService.getEmpresaByEncargado(user._id);
        setEmpresa(empresaData);

        // Obtener información de los empleados
        if (empresaData.personalIds && empresaData.personalIds.length > 0) {
          try {
            console.log('Loading employees with IDs:', empresaData.personalIds);
            const employeesData = await authService.getUsersByIds(empresaData.personalIds);
            console.log('Employees loaded:', employeesData);
            // Mapear Usuario[] a Employee[]
            const mappedEmployees: Employee[] = employeesData.map(emp => ({
              _id: emp._id,
              nombre: emp.nombre,
              apellido: emp.apellido,
              email: emp.email,
              telefono: emp.telefono || undefined,
              tipoUsuario: emp.tipoUsuario,
              creado_en: emp.creado_en || new Date().toISOString()
            }));
            setEmployees(mappedEmployees);
          } catch (error) {
            console.error('Error loading employees:', error);
            setEmployees([]);
          }
        } else {
          setEmployees([]);
        }
      } catch (error) {
        console.error("Error loading employees:", error);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [user]);

  const goBack = () => navigate(-1);

  const getEmployeeInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
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
          <IconButton onClick={goBack} size="small" sx={{ color: "#1e4b46" }}>
            <ArrowBackIosNewOutlined />
          </IconButton>
          <Typography
            variant="h2"
            sx={{ fontWeight: 800, color: "#1e4b46", fontSize: 26 }}
          >
            Empleados de la Empresa
          </Typography>
        </Stack>
      </Box>

      {/* Contenido */}
      <Box sx={{ px: 3 }}>
        {/* Información de la empresa */}
        {empresa && (
          <Card sx={{ p: 2, mb: 3 }}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 800, color: "#1e4b46" }}>
                {empresa.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {employees.length} empleado{employees.length !== 1 ? 's' : ''} registrado{employees.length !== 1 ? 's' : ''}
              </Typography>
            </Stack>
          </Card>
        )}

        {/* Lista de empleados */}
        {employees.length > 0 ? (
          <Stack spacing={2}>
            <Typography sx={{ fontWeight: 800, color: "#1e4b46" }}>
              Lista de Empleados
            </Typography>
            
            {employees.map((employee) => (
              <Card key={employee._id} sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Avatar */}
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {getEmployeeInitials(employee.nombre, employee.apellido)}
                  </Avatar>

                  {/* Información del empleado */}
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                      {employee.nombre} {employee.apellido}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {employee.email}
                    </Typography>
                    {employee.telefono && (
                      <Typography variant="body2" color="text.secondary">
                        {employee.telefono}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Registrado: {formatDate(employee.creado_en)}
                    </Typography>
                  </Box>

                  {/* Chip de tipo de usuario */}
                  <Chip
                    label="Personal"
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : (
          <Card sx={{ p: 3, textAlign: "center" }}>
            <Stack spacing={2} alignItems="center">
              <Person sx={{ fontSize: 48, color: "text.secondary" }} />
              <Typography variant="h6" color="text.secondary">
                No hay empleados registrados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Los empleados que agregues aparecerán aquí
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/AddCompanions")}
                sx={{
                  borderRadius: theme.custom.radii.pill,
                  px: 3,
                }}
              >
                Agregar Empleados
              </Button>
            </Stack>
          </Card>
        )}

        {/* Botón para agregar más empleados */}
        {employees.length > 0 && (
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            sx={{
              borderRadius: theme.custom.radii.pill,
              py: 1.2,
              fontWeight: 700,
              mt: 3,
            }}
            onClick={() => navigate("/AddCompanions")}
          >
            Agregar Más Empleados
          </Button>
        )}
      </Box>

      {/* Navegación inferior */}
      <Navigation />
    </Box>
  );
}
