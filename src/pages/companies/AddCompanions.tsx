import {
  Box,
  Stack,
  TextField,
  Typography,
  IconButton,
  Button,
  Card,
} from "@mui/material";
import {
  ArrowBackIosNewOutlined,
  Delete,
  Edit,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import theme from "../../theme/themes";
import Navigation from "../../navigation/Navigation";
import { authService } from "../../apiService/services/authService";
import { empresaService } from "../../apiService/services/empresaService";
import { useAuth } from "../../contexts/AuthContext";

type Companion = {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
};

// Removed ROLE_OPTIONS as it's not needed for personal users

export default function AddCompanions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [draft, setDraft] = useState<Companion>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
  });

  const [companions, setCompanions] = useState<Companion[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const updateDraft = (changes: Partial<Companion>) =>
    setDraft((prev) => ({ ...prev, ...changes }));

  const isDraftValid =
    draft.nombre.trim().length > 1 &&
    draft.apellido.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(draft.email);

  const addOrUpdateCompanion = () => {
    if (!isDraftValid) return;

    if (editIndex !== null) {
      const updated = [...companions];
      updated[editIndex] = { ...draft };
      setCompanions(updated);
      setEditIndex(null);
    } else {
      setCompanions((arr) => [...arr, { ...draft }]);
    }

    setDraft({ nombre: "", apellido: "", email: "", telefono: "" });
  };

  const removeCompanion = (idx: number) =>
    setCompanions((arr) => arr.filter((_, i) => i !== idx));

  // Removed viewCompanion function as it's not used

  const editCompanion = (idx: number) => {
    setDraft(companions[idx]);
    setEditIndex(idx);
  };

  const guardarCompanions = async () => {
    try {
      if (!user?._id) {
        alert("Error: Usuario no autenticado");
        return;
      }

      // Obtener información de la empresa del encargado
      let empresaInfo = { id: null, nombre: 'Empresa' };
      try {
        const empresa = await empresaService.getEmpresaByEncargado(user._id);
        empresaInfo = { id: empresa._id, nombre: empresa.nombre };
      } catch (error) {
        console.warn('No se pudo obtener información de la empresa:', error);
      }

      // Crear empleados en el backend
      const createdEmployeeIds = [];
      const errors = [];
      
      for (const companion of companions) {
        try {
          console.log(`Creating employee: ${companion.nombre} ${companion.apellido} (${companion.email})`);
          const result = await authService.createEmployee({
            nombre: companion.nombre,
            apellido: companion.apellido,
            email: companion.email,
            telefono: companion.telefono || null,
            empresaId: empresaInfo.id,
            empresaNombre: empresaInfo.nombre
          });
          createdEmployeeIds.push(result.user._id);
          console.log(`✅ Employee created: ${result.user._id}`);
        } catch (error: any) {
          console.error(`❌ Error creating employee ${companion.email}:`, error);
          errors.push({
            email: companion.email,
            nombre: `${companion.nombre} ${companion.apellido}`,
            error: error.message || 'Error desconocido'
          });
        }
      }
      
      if (errors.length > 0) {
        const errorMessage = errors.map(e => `${e.nombre} (${e.email}): ${e.error}`).join('\n');
        alert(`Algunos empleados no pudieron ser creados:\n\n${errorMessage}\n\nLos empleados creados exitosamente se guardarán.`);
      }
      
      if (createdEmployeeIds.length > 0) {
        // Obtener la empresa del encargado
        const empresa = await empresaService.getEmpresaByEncargado(user._id);
        
        // Actualizar la empresa con los IDs de los empleados creados
        const updatedPersonalIds = [...(empresa.personalIds || []), ...createdEmployeeIds];
        
        await empresaService.updateEmpresa(empresa._id, {
          personalIds: updatedPersonalIds
        });
        
        console.log(`✅ Updated empresa ${empresa._id} with ${createdEmployeeIds.length} new employees`);
        
        // Guardar en sessionStorage para el flujo de registro (si es necesario)
        sessionStorage.setItem("wizard_companions", JSON.stringify(createdEmployeeIds));
        navigate(-1);
      } else {
        alert("No se pudo crear ningún empleado. Verifica los datos e intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error creating employees:", error);
      alert("Error al crear empleados. Intenta nuevamente.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fff", pb: "88px" }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: "#1e4b46" }}>
            <ArrowBackIosNewOutlined />
          </IconButton>
          <Typography variant="h5" fontWeight={800} color="#1e4b46">
            Añadir Empleados
          </Typography>
        </Stack>
      </Box>

      {/* Formulario */}
      <Box sx={{ px: 3 }}>
        <Stack spacing={2} sx={{ mb: 1 }}>
          <TextField
            label="Nombre"
            value={draft.nombre}
            onChange={(e) => updateDraft({ nombre: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Apellido"
            value={draft.apellido}
            onChange={(e) => updateDraft({ apellido: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Correo Electrónico"
            type="email"
            value={draft.email}
            onChange={(e) => updateDraft({ email: e.target.value })}
            fullWidth
            required
            helperText="Las credenciales se enviarán a este correo"
          />
          <TextField
            label="Teléfono (Opcional)"
            type="tel"
            value={draft.telefono}
            onChange={(e) => updateDraft({ telefono: e.target.value })}
            fullWidth
            placeholder="+591 7 12345678"
          />
        </Stack>

        <Button
          fullWidth
          variant="contained"
          color="success"
          disabled={!isDraftValid}
          onClick={addOrUpdateCompanion}
        >
          {editIndex !== null ? "Actualizar" : "Añadir"}
        </Button>

        {/* Lista de acompañantes */}
        {companions.length > 0 && (
          <Stack spacing={1.5} sx={{ mt: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Empleados añadidos
      </Typography>
            {companions.map((c, i) => (
<Card
  key={`${c.email}-${i}`}
  sx={{
    border: `1px solid ${theme.palette.info.main}`,
    borderRadius: theme.custom.radii.field,
    px: 1.5,
    py: 1.5,
    backgroundColor: "#fff",
  }}
>
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Stack spacing={0.5}>
      <Typography variant="body2" fontWeight={700}>
        Nombre: {c.nombre} {c.apellido}
      </Typography>
      <Typography variant="body2">
        Correo: {c.email}
      </Typography>
      <Typography variant="body2">
        Teléfono: {c.telefono || 'No especificado'}
      </Typography>
    </Stack>

    <Stack direction="row" spacing={1}>
      <IconButton aria-label="Editar" color="info" onClick={() => editCompanion(i)}>
        <Edit />
      </IconButton>
      <IconButton aria-label="Eliminar" color="error" onClick={() => removeCompanion(i)}>
        <Delete />
      </IconButton>
    </Stack>
  </Stack>
</Card>
            ))}
          </Stack>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
          disabled={companions.length === 0}
          onClick={guardarCompanions}
        >
          Guardar empleados
        </Button>
      </Box>

      {/* Navegación inferior */}
      <Navigation />
    </Box>
  );
}