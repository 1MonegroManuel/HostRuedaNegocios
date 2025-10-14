// src/pages/Company-Registration.tsx

import { useMemo, useState, useEffect } from "react";
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Stack,
    Checkbox,
    Avatar,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import theme from "../../theme/themes";
import { useCompanyRegistration } from "../../contexts/CompanyRegistrationContext";
import type { Evento } from "../../apiService/types";

// Opciones de rubro (puedes ajustarlas)
const RUBROS = [
    "Agroindustria",
    "Biotecnología",
    "Turismo",
    "Textil",
    "Transporte",
    "Educación",
    "Salud",
    "Comercio",
    "Servicios",
];

const OTRO_VALUE = "__OTRO__";

// Tipo para pasar al siguiente paso
type CompanyData = {
    nombre: string;
    rubro: string;       // puede ser "__OTRO__"
    rubroOtro?: string;  // texto cuando rubro === "__OTRO__"
    descripcion: string;
    intereses: string[];
    isVirtual: boolean;
    eventoId: string;
    nit?: string;
    telefono?: string;
    email?: string;
    sitio_web?: string;
};

export default function CompanyRegistration() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setCompanyData, flowState } = useCompanyRegistration();

    // Obtener evento seleccionado del estado de navegación o del contexto
    const selectedEvent = location.state?.selectedEvent as Evento | undefined || flowState.selectedEvent;

    const [nombre, setNombre] = useState("");
    const [rubro, setRubro] = useState<string>("");
    const [rubroOtro, setRubroOtro] = useState<string>("");
    const [descripcion, setDescripcion] = useState("");
    const [intereses, setIntereses] = useState<string[]>([]);
    const [isVirtual, setIsVirtual] = useState<boolean>(false);
    const [nit, setNit] = useState("");
    const [telefono, setTelefono] = useState("");
    const [email, setEmail] = useState("");
    const [sitioWeb, setSitioWeb] = useState("");

    const rubroSeleccionado = rubro === OTRO_VALUE ? rubroOtro.trim() : rubro;

    // Redirigir si no hay evento seleccionado
    useEffect(() => {
        if (!selectedEvent) {
            navigate("/SelectEvents");
        }
    }, [selectedEvent, navigate]);

    const isValid = useMemo(
        () =>
            selectedEvent &&
            nombre.trim().length > 2 &&
            rubroSeleccionado.length > 0 &&
            descripcion.trim().length > 5,
        [selectedEvent, nombre, rubroSeleccionado, descripcion]
    );

    const goBack = () => navigate("/SelectEvents");

    const goNext = () => {
        if (!isValid || !selectedEvent) return;
        
        const companyData = {
            nombre,
            rubro,
            rubroOtro: rubro === OTRO_VALUE ? rubroOtro.trim() : undefined,
            descripcion,
            intereses,
            isVirtual,
            eventoId: selectedEvent._id,
            nit: nit.trim() || undefined,
            telefono: telefono.trim() || undefined,
            email: email.trim() || undefined,
            sitio_web: sitioWeb.trim() || undefined,
        };

        // Guardamos la info en el contexto y navegamos al siguiente paso
        setCompanyData(companyData);
        navigate("/company-logo", { 
            state: { 
                company: companyData,
                selectedEvent 
            } 
        });
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
                // Fondo centralizado desde tokens del theme
                background: theme.custom.gradients.appBg,
            }}
        >
            <Card
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    px: { xs: 3, sm: 4 },
                    py: { xs: 3, sm: 4 },
                }}
            >
                <Typography variant="h2" sx={{ mb: 2 }}>
                    Registro de Empresa
                </Typography>


                {/* Evento seleccionado */}
                {selectedEvent && (
                    <Card sx={{ mb: 2, border: 1, borderColor: "primary.main", bgcolor: "primary.50" }}>
                        <CardContent sx={{ py: 1.5 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar
                                    src={selectedEvent.logo_url || undefined}
                                    alt={selectedEvent.nombre}
                                    sx={{ width: 32, height: 32 }}
                                >
                                    {selectedEvent.nombre.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {selectedEvent.nombre}
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        <Chip
                                            size="small"
                                            icon={<EventNoteIcon sx={{ fontSize: 14 }} />}
                                            label={new Date(selectedEvent.inicio).toLocaleDateString("es-ES", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                            variant="outlined"
                                            color="primary"
                                            sx={{ fontSize: "0.7rem", height: 18 }}
                                        />
                                        <Chip
                                            size="small"
                                            icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
                                            label={`${selectedEvent.numero_mesas} mesas`}
                                            variant="outlined"
                                            color="secondary"
                                            sx={{ fontSize: "0.7rem", height: 18 }}
                                        />
                                    </Stack>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                <Stack spacing={2}>

                    <TextField
                        label="Nombre de la empresa"
                        placeholder="Acme S.R.L."
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        fullWidth
                        required
                    />

                    <TextField
                        label="NIT (opcional)"
                        placeholder="123456789"
                        value={nit}
                        onChange={(e) => setNit(e.target.value)}
                        fullWidth
                    />


                    <TextField
                        label="Teléfono"
                        placeholder="+591 7 12345678"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Email"
                        type="email"
                        placeholder="empresa@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Sitio web (opcional)"
                        placeholder="https://www.empresa.com"
                        value={sitioWeb}
                        onChange={(e) => setSitioWeb(e.target.value)}
                        fullWidth
                    />

                    {/* Rubro con opción “Otro…” */}
                    <FormControl fullWidth>
                        <InputLabel id="rubro-label">Rubro de la empresa</InputLabel>
                        <Select
                            labelId="rubro-label"
                            label="Rubro de la empresa"
                            value={rubro}
                            onChange={(e) => setRubro(e.target.value as string)}
                        >
                            {RUBROS.map((op) => (
                                <MenuItem key={op} value={op}>
                                    {op}
                                </MenuItem>
                            ))}
                            <MenuItem value={OTRO_VALUE}>Otro…</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Campo visible sólo si se eligió “Otro…” */}
                    {rubro === OTRO_VALUE && (
                        <TextField
                            label="Especifica tu rubro"
                            placeholder="Ej.: Energías Renovables"
                            value={rubroOtro}
                            onChange={(e) => setRubroOtro(e.target.value)}
                            fullWidth
                        />
                    )}

                    <TextField
                        label="Descripción"
                        placeholder="Describe brevemente tu empresa…"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                        maxRows={10}
                        sx={{
                            // ⚠️ Anula la altura fija del theme para multiline
                            "& .MuiOutlinedInput-root.MuiInputBase-multiline": {
                                height: "auto",
                                alignItems: "stretch",
                                padding: 0, // quita padding doble del contenedor
                            },
                            // Ajusta el padding del textarea
                            "& .MuiOutlinedInput-input": {
                                padding: "14px 16px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                            },
                            "& .MuiOutlinedInput-inputMultiline": {
                                padding: "14px 16px",
                            },
                        }}
                    />

                    {/* Rubros de interés: múltiple + freeSolo, chips con variant del theme */}
                    <Autocomplete
                        multiple
                        freeSolo
                        options={RUBROS}
                        value={intereses}
                        onChange={(_e, newValue) => setIntereses(newValue as string[])}
                        filterSelectedOptions
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return (
                                    <Chip
                                        key={key}
                                        variant="tag"     // <-- usa variant del theme
                                        size="small"
                                        label={option}
                                        {...tagProps}
                                    />
                                );
                            })
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Rubros de interés"
                                placeholder="Elige o escribe otros…"
                            />
                        )}
                    />

                    {/* Modalidad */}
                    <Box>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isVirtual}
                                    onChange={(e) => setIsVirtual(e.target.checked)}
                                    color="success"
                                />
                            }
                            label="Participación virtual"
                        />
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: -0.5 }}
                        >
                            Si no marcas, se asume participación presencial.
                        </Typography>
                    </Box>

                    {/* Navegación (usa colores del theme + overrides de botones) */}
                    <Stack direction="row" gap={2} sx={{ mt: 1 }}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            color="warning" 
                            onClick={goBack}
                        >
                            Atrás
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            disabled={!isValid}
                            onClick={goNext}
                        >
                            Continuar
                        </Button>
                    </Stack>
                </Stack>
            </Card>
        </Box>
    );
}
