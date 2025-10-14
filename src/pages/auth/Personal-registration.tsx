import { useState, useMemo } from "react";
import {
    Box,
    Button,
    Card,
    TextField,
    Typography,
    Stack,
    Alert,
    CircularProgress,
    IconButton,
    Chip,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import theme from "../../theme/themes";
import { useCompanyRegistration } from "../../contexts/CompanyRegistrationContext";
import type { PersonalData } from "../../hooks/useCompanyRegistrationFlow";

interface PersonalItem {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
}

export default function PersonalRegistration() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setPersonalData, setPersonalIds } = useCompanyRegistration();

    // Obtener datos del estado de navegación
    const { company, selectedEvent, encargadoId } = location.state || {};

    const [personal, setPersonal] = useState<PersonalItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValid = useMemo(
        () => personal.length >= 0 && personal.length <= 6 && 
              personal.every(p => p.nombre.trim() && p.apellido.trim() && p.email.trim()),
        [personal]
    );

    const addPersonal = () => {
        if (personal.length < 6) {
            const newPersonal: PersonalItem = {
                id: Date.now().toString(),
                nombre: "",
                apellido: "",
                email: "",
                telefono: "",
            };
            setPersonal([...personal, newPersonal]);
        }
    };

    const removePersonal = (id: string) => {
        setPersonal(personal.filter(p => p.id !== id));
    };

    const updatePersonal = (id: string, field: keyof PersonalItem, value: string) => {
        setPersonal(personal.map(p => 
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const goBack = () => navigate("/encargado-registration", { state: { company, selectedEvent } });

    const goNext = async () => {
        if (!isValid) return;

        setLoading(true);
        setError(null);

        try {
            const personalIds: string[] = [];

            // Crear usuarios para cada empleado
            for (const empleado of personal) {
                if (empleado.nombre.trim() && empleado.apellido.trim() && empleado.email.trim()) {
                    // Generar username automático
                    const username = `${empleado.nombre.toLowerCase()}.${empleado.apellido.toLowerCase()}`;
                    
                    // Generar password automático
                    const password = Math.random().toString(36).slice(-8);

                    // TODO: Implementar creación de usuarios del personal
                    // Por ahora simulamos la creación
                    const mockUserId = `personal_${Date.now()}_${Math.random()}`;
                    personalIds.push(mockUserId);
                    
                    // TODO: Enviar email de invitación con credenciales
                    console.log(`Enviar email a ${empleado.email} con username: ${username} y password: ${password}`);
                }
            }

            // Guardar datos en el contexto
            const personalData: PersonalData = {
                personal: personal.map(p => ({
                    nombre: p.nombre,
                    apellido: p.apellido,
                    email: p.email,
                    telefono: p.telefono || undefined,
                }))
            };

            setPersonalData(personalData);
            setPersonalIds(personalIds);

            // Navegar al siguiente paso
            navigate("/registration-review", {
                state: {
                    company,
                    selectedEvent,
                    encargadoId,
                    personalIds
                }
            });
        } catch (err: any) {
            setError(err?.message || "Error al crear los usuarios del personal");
        } finally {
            setLoading(false);
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
            <Card
                sx={{
                    width: "100%",
                    maxWidth: 500,
                    px: { xs: 3, sm: 4 },
                    py: { xs: 3, sm: 4 },
                }}
            >
                <Typography variant="h2" sx={{ mb: 2 }}>
                    Personal de la Empresa
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Agrega hasta 6 empleados que participarán en el evento. Se les enviará una invitación por correo.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Stack spacing={2}>
                    {/* Lista de personal */}
                    {personal.map((empleado, index) => (
                        <Card key={empleado.id} variant="outlined" sx={{ p: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <Chip 
                                    label={`Empleado ${index + 1}`} 
                                    size="small" 
                                    color="primary" 
                                />
                                <Box sx={{ flexGrow: 1 }} />
                                <IconButton 
                                    size="small" 
                                    onClick={() => removePersonal(empleado.id)}
                                    color="error"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Stack>

                            <Stack spacing={2}>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Nombre"
                                        placeholder="María"
                                        value={empleado.nombre}
                                        onChange={(e) => updatePersonal(empleado.id, 'nombre', e.target.value)}
                                        fullWidth
                                        size="small"
                                    />
                                    <TextField
                                        label="Apellido"
                                        placeholder="González"
                                        value={empleado.apellido}
                                        onChange={(e) => updatePersonal(empleado.id, 'apellido', e.target.value)}
                                        fullWidth
                                        size="small"
                                    />
                                </Stack>

                                <TextField
                                    label="Email"
                                    type="email"
                                    placeholder="maria.gonzalez@empresa.com"
                                    value={empleado.email}
                                    onChange={(e) => updatePersonal(empleado.id, 'email', e.target.value)}
                                    fullWidth
                                    size="small"
                                />

                                <TextField
                                    label="Teléfono (opcional)"
                                    placeholder="+591 7 12345678"
                                    value={empleado.telefono}
                                    onChange={(e) => updatePersonal(empleado.id, 'telefono', e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Stack>
                        </Card>
                    ))}

                    {/* Botón para agregar personal */}
                    {personal.length < 6 && (
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={addPersonal}
                            sx={{ mt: 2 }}
                        >
                            Agregar Empleado
                        </Button>
                    )}

                    {/* Mensaje si no hay personal */}
                    {personal.length === 0 && (
                        <Card variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                            <Typography variant="body2" color="text.secondary">
                                No hay empleados agregados. Puedes continuar sin personal o agregar hasta 6 empleados.
                            </Typography>
                        </Card>
                    )}

                    {/* Navegación */}
                    <Stack direction="row" gap={2} sx={{ mt: 3 }}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            color="warning" 
                            onClick={goBack}
                            disabled={loading}
                        >
                            Atrás
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            disabled={!isValid || loading}
                            onClick={goNext}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {loading ? "Creando..." : "Continuar"}
                        </Button>
                    </Stack>
                </Stack>
            </Card>
        </Box>
    );
}
