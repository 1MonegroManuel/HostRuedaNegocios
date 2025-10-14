// src/pages/EditProfile.tsx
import { useState, useEffect } from "react";
import {
    Autocomplete,
    Box,
    Button,
    Card,
    Chip,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";
import { ArrowBackIosNewOutlined, Upload } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Navigation from "../../navigation/Navigation";
import theme from "../../theme/themes";
import { useAuth } from "../../contexts/AuthContext";
import { empresaService } from "../../apiService/services/empresaService";
import { storageService } from "../../apiService/services/storageService";

type FileField = File | null;

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

export default function EditProfile() {
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const isEncargado = hasRole("encargado");

    // ——— Estados de carga
    const [loading, setLoading] = useState(false);
    const [empresaLoading, setEmpresaLoading] = useState(false);

    // ——— Datos personales
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");

    // ——— Datos empresa
    const [empresa, setEmpresa] = useState("");
    const [rubro, setRubro] = useState<string>("");
    const [rubroOtro, setRubroOtro] = useState<string>("");
    const [descripcion, setDescripcion] = useState("");
    const [sitioWeb, setSitioWeb] = useState("");
    const [telefonoEmpresa, setTelefonoEmpresa] = useState("");
    const [emailEmpresa, setEmailEmpresa] = useState("");
    const [intereses, setIntereses] = useState<string[]>([]);
    const [logo, setLogo] = useState<FileField>(null);
    const [logoUrl, setLogoUrl] = useState<string>("");

    // ——— Datos adicionales (comprobante de pago)
    const [comprobanteFile, setComprobanteFile] = useState<FileField>(null);
    const [comprobanteUrl, setComprobanteUrl] = useState("");

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            if (user) {
                // Cargar datos del usuario
                setNombre(user.nombre || "");
                setApellido(user.apellido || "");
                setEmail(user.email || "");
                setTelefono(user.telefono || "");

                // Si es encargado, cargar datos de la empresa
                if (isEncargado && user._id) {
                    setEmpresaLoading(true);
                    try {
                        const empresaData = await empresaService.getEmpresaByEncargado(user._id);
                        setEmpresa(empresaData.nombre || "");
                        setRubro(empresaData.rubro || "");
                        setDescripcion(empresaData.descripcion || "");
                        setSitioWeb(empresaData.sitio_web || "");
                        setTelefonoEmpresa(empresaData.telefono || "");
                        setEmailEmpresa(empresaData.email || "");
                        setLogoUrl(empresaData.logo_url || "");
                        setComprobanteUrl((empresaData as any).comprobante_pago_url || "");
                    } catch (error) {
                        console.error("Error loading empresa:", error);
                    } finally {
                        setEmpresaLoading(false);
                    }
                }
            }
        };

        loadInitialData();
    }, [user, isEncargado]);

    const handleFile =
        (setter: (f: FileField) => void) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0] ?? null;
                setter(f);
            };

    const goBack = () => navigate(-1);

    const onSave = async () => {
        setLoading(true);
        try {
            // Actualizar datos del usuario
            // TODO: Implementar actualización de usuario

            // Si es encargado, actualizar datos de la empresa
            if (isEncargado && user?._id) {
                const empresaData: any = {
                    nombre: empresa,
                    rubro: rubro === OTRO_VALUE ? rubroOtro : rubro,
                    descripcion: descripcion,
                    sitio_web: sitioWeb,
                    telefono: telefonoEmpresa,
                    email: emailEmpresa,
                };

                // Subir logo si se seleccionó uno nuevo
                if (logo) {
                    const logoResponse = await storageService.uploadFile(logo);
                    empresaData.logo_url = logoResponse.url;
                }

                // Subir comprobante si se seleccionó uno nuevo
                if (comprobanteFile) {
                    const comprobanteResponse = await storageService.uploadFile(comprobanteFile);
                    empresaData.comprobante_pago_url = comprobanteResponse.url;
                } else if (comprobanteUrl) {
                    empresaData.comprobante_pago_url = comprobanteUrl;
                }

                // Obtener ID de la empresa
                const empresaInfo = await empresaService.getEmpresaByEncargado(user._id);
                await empresaService.updateEmpresa(empresaInfo._id, empresaData);
            }

            navigate("/Profile");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error al guardar los cambios");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#fff",
                pb: "88px", // espacio para bottom nav
            }}
        >
            {/* Header */}
            <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={goBack} size="small" sx={{ color: "#1e4b46" }}>
                        <ArrowBackIosNewOutlined />
                    </IconButton>
                    <Typography variant="h2" sx={{ fontWeight: 800, color: "#1e4b46", fontSize: 26 }}>
                        Rueda de negocios
                    </Typography>
                </Stack>
                <Typography align="center" sx={{ mt: 1, fontWeight: 800, color: "#1e4b46" }}>
                    Perfil
                </Typography>
            </Box>

            {/* Contenido */}
            <Box sx={{ px: 3, pt: 1 }}>
                {/* ——— Bloque: datos personales */}
                <Card sx={{ p: 2, mb: 2 }}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>Nombre</Typography>
                            <TextField 
                                fullWidth 
                                value={nombre} 
                                onChange={(e) => setNombre(e.target.value)}
                                disabled={loading || empresaLoading}
                            />
                        </Box>

                        <Box>
                            <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>Apellido</Typography>
                            <TextField 
                                fullWidth 
                                value={apellido} 
                                onChange={(e) => setApellido(e.target.value)}
                                disabled={loading || empresaLoading}
                            />
                        </Box>

                        <Box>
                            <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                Correo Electrónico
                            </Typography>
                            <TextField
                                fullWidth
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading || empresaLoading}
                            />
                        </Box>


                        <Box>
                            <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                Teléfono Celular
                            </Typography>
                            <TextField
                                fullWidth
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                disabled={loading || empresaLoading}
                            />
                        </Box>
                    </Stack>
                </Card>

                {/* ——— Título sección empresa (solo para encargados) */}
                {isEncargado && (
                    <>
                        <Typography align="center" sx={{ fontWeight: 800, color: "#1e4b46", mb: 1 }}>
                            Datos de la empresa
                        </Typography>

                        {/* ——— Bloque: datos empresa */}
                        <Card sx={{ p: 2 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Nombre de la empresa
                                    </Typography>
                                    <TextField 
                                        fullWidth 
                                        value={empresa} 
                                        onChange={(e) => setEmpresa(e.target.value)}
                                        disabled={loading || empresaLoading}
                                    />
                                </Box>

                                {/* Rubro + "Otro…" */}
                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Rubro de la empresa
                                    </Typography>
                                    <FormControl fullWidth>
                                        <InputLabel id="rubro-label">Rubro de la empresa</InputLabel>
                                        <Select
                                            labelId="rubro-label"
                                            label="Rubro de la empresa"
                                            value={rubro}
                                            onChange={(e) => setRubro(e.target.value as string)}
                                            disabled={loading || empresaLoading}
                                        >
                                            {RUBROS.map((op) => (
                                                <MenuItem key={op} value={op}>
                                                    {op}
                                                </MenuItem>
                                            ))}
                                            <MenuItem value={OTRO_VALUE}>Otro…</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {rubro === OTRO_VALUE && (
                                        <TextField
                                            sx={{ mt: 1 }}
                                            label="Especifica tu rubro"
                                            placeholder="Ej.: Energías Renovables"
                                            value={rubroOtro}
                                            onChange={(e) => setRubroOtro(e.target.value)}
                                            fullWidth
                                            disabled={loading || empresaLoading}
                                        />
                                    )}
                                </Box>

                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Descripción
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        maxRows={6}
                                        InputProps={{
                                            sx: { '& textarea': { resize: 'none' } }
                                        }}
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        disabled={loading || empresaLoading}
                                    />
                                </Box>

                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Sitio Web
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="url"
                                        placeholder="https://www.ejemplo.com"
                                        value={sitioWeb}
                                        onChange={(e) => setSitioWeb(e.target.value)}
                                        disabled={loading || empresaLoading}
                                    />
                                </Box>

                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Teléfono de la Empresa
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="tel"
                                        placeholder="+591 7 12345678"
                                        value={telefonoEmpresa}
                                        onChange={(e) => setTelefonoEmpresa(e.target.value)}
                                        disabled={loading || empresaLoading}
                                    />
                                </Box>

                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Email de la Empresa
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="email"
                                        placeholder="empresa@ejemplo.com"
                                        value={emailEmpresa}
                                        onChange={(e) => setEmailEmpresa(e.target.value)}
                                        disabled={loading || empresaLoading}
                                    />
                                </Box>

                                {/* Rubros de interés – múltiple + freeSolo */}
                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Rubros de interés
                                    </Typography>
                                    <Autocomplete
                                        multiple
                                        freeSolo
                                        options={RUBROS}
                                        value={intereses}
                                        onChange={(_e, val) => setIntereses(val as string[])}
                                        filterSelectedOptions
                                        disabled={loading || empresaLoading}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip variant="filled" label={option} {...getTagProps({ index })} />
                                            ))
                                        }
                                        renderInput={(params) => <TextField {...params} placeholder="Elige o escribe otros…" />}
                                    />
                                </Box>


                                {/* Logo de la empresa */}
                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Logo de la Empresa
                                    </Typography>
                                    {logoUrl && (
                                        <Box sx={{ mb: 1 }}>
                                            <img 
                                                src={logoUrl} 
                                                alt="Logo actual" 
                                                style={{ 
                                                    maxWidth: 100, 
                                                    maxHeight: 100, 
                                                    objectFit: 'contain',
                                                    border: '1px solid #ddd',
                                                    borderRadius: 4
                                                }} 
                                            />
                                        </Box>
                                    )}
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={<Upload />}
                                            disabled={loading || empresaLoading}
                                            sx={{ borderRadius: theme.custom.radii.pill }}
                                        >
                                            {logoUrl ? "Cambiar logo" : "Subir logo"}
                                            <input hidden type="file" accept="image/*" onChange={handleFile(setLogo)} />
                                        </Button>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                        >
                                            {logo ? logo.name : (logoUrl ? "Logo actual" : "Ningún archivo seleccionado")}
                                        </Typography>
                                    </Stack>
                                </Box>

                                {/* Comprobante de pago */}
                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#1e4b46", mb: 0.5 }}>
                                        Comprobante de Pago
                                    </Typography>
                                    {comprobanteUrl && (
                                        <Box sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Comprobante actual: 
                                                <a href={comprobanteUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: theme.palette.primary.main }}>
                                                    Ver comprobante
                                                </a>
                                            </Typography>
                                        </Box>
                                    )}
                                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={<Upload />}
                                            disabled={loading || empresaLoading}
                                            sx={{ borderRadius: theme.custom.radii.pill }}
                                        >
                                            {comprobanteUrl ? "Cambiar comprobante" : "Subir comprobante"}
                                            <input hidden type="file" accept="application/pdf,image/*" onChange={handleFile(setComprobanteFile)} />
                                        </Button>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                        >
                                            {comprobanteFile ? comprobanteFile.name : (comprobanteUrl ? "Comprobante actual" : "Ningún archivo seleccionado")}
                                        </Typography>
                                    </Stack>
                                    <TextField
                                        placeholder="o pega una URL del comprobante…"
                                        value={comprobanteUrl}
                                        onChange={(e) => setComprobanteUrl(e.target.value)}
                                        fullWidth
                                        disabled={loading || empresaLoading}
                                    />
                                </Box>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="success"
                                    disabled={loading || empresaLoading}
                                    sx={{ color: "#000", mt: 1, py: 1.2, borderRadius: theme.custom.radii.pill, fontWeight: 700 }}
                                    onClick={onSave}
                                >
                                    {loading ? <CircularProgress size={20} color="inherit" /> : "Guardar Cambios"}
                                </Button>
                            </Stack>
                        </Card>
                    </>
                )}
            </Box>

            {/* Bottom Navigation */}
            <Navigation />
        </Box>
    );
}
