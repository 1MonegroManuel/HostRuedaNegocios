// src/pages/ImageBoardPage.tsx
import React from "react";
import {
    Box,
    Button,
    Card,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { ArrowBackIosNewOutlined, FileDownload, ZoomOutMap } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Navigation from "../../navigation/Navigation";

export type ImageBoardPageProps = {
    /** Header grande */
    headerTitle?: string;              // default: "Rueda de negocios"
    /** Título del tablero (Mapa / Cronograma) */
    boardTitle: string;
    /** URL absoluta/relativa servida por tu backend */
    imageUrl?: string;
    /** (Opcional) clave para fallback de localStorage si no llega imageUrl */
    storageKey?: string;
};

export default function ImageBoardPage({
    headerTitle = "Rueda de negocios",
    boardTitle,
    imageUrl,
    storageKey,
}: ImageBoardPageProps) {
    const navigate = useNavigate();
    const [src, setSrc] = React.useState<string | null>(imageUrl ?? null);
    const [previewOpen, setPreviewOpen] = React.useState(false);

    // Si no viene imageUrl, intenta fallback localStorage (opcional)
    React.useEffect(() => {
        if (imageUrl) {
            setSrc(imageUrl);
            return;
        }
        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved) setSrc(saved);
        }
    }, [imageUrl, storageKey]);

    const downloadImage = () => {
        if (!src) return;
        // Abrir la URL de la imagen en una nueva ventana para descarga
        window.open(src, '_blank');
    };

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#fff", pb: "88px" }}>
            {/* Header */}
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: "#1e4b46" }}>
                        <ArrowBackIosNewOutlined />
                    </IconButton>
                    <Typography variant="h2" sx={{ fontWeight: 800, color: "#1e4b46", fontSize: 26 }}>
                        {headerTitle}
                    </Typography>
                </Stack>
            </Box>

            {/* Contenido */}
            <Box sx={{ px: 3, pb: 2, display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
                <Typography sx={{ fontWeight: 800, color: "#1e4b46" }}>{boardTitle}</Typography>

                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.08)",
                        p: { xs: 1, sm: 1.5 },
                        // Ocupa la mayor parte de la pantalla
                        flex: 1,
                        display: "flex",
                        minHeight: { xs: "60vh", sm: "70vh" },
                    }}
                >
                    <Box sx={{ position: "relative", width: "100%", height: "100%", borderRadius: 2, overflow: "hidden", bgcolor: "#f5f5f5" }}>
                        {/* Imagen (click para ampliar) */}
                        {src ? (
                            <Box
                                onClick={() => setPreviewOpen(true)}
                                sx={{
                                    cursor: "zoom-in",
                                    width: "100%",
                                    height: "100%",
                                    display: "grid",
                                    placeItems: "center",
                                    "& img": { width: "100%", height: "100%", objectFit: "contain", display: "block" },
                                }}
                            >
                                <img src={src} alt={boardTitle} />
                            </Box>
                        ) : (
                            <Stack alignItems="center" justifyContent="center" sx={{ width: "100%", height: "100%", color: "#777", textAlign: "center", px: 2 }}>
                                <Typography variant="body2">No hay imagen disponible.</Typography>
                                <Typography variant="caption">Cuando el administrador la suba en el backend, aparecerá aquí.</Typography>
                            </Stack>
                        )}

                        {/* Acciones superpuestas (arriba-derecha) */}
                        <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 8, right: 8 }}>
                            <Tooltip title="Ampliar">
                                <span>
                                    <IconButton size="small" onClick={() => setPreviewOpen(true)} disabled={!src} sx={{ bgcolor: "rgba(255,255,255,0.9)" }}>
                                        <ZoomOutMap fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Descargar">
                                <span>
                                    <IconButton size="small" onClick={downloadImage} disabled={!src} sx={{ bgcolor: "rgba(255,255,255,0.9)" }}>
                                        <FileDownload fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Stack>
                    </Box>
                </Card>

                {/* Acciones inferiores (solo descargar) */}
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={downloadImage} disabled={!src}>
                        Descargar
                    </Button>
                </Stack>
            </Box>

            {/* Vista previa ampliada */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>{boardTitle}</DialogTitle>
                <DialogContent dividers sx={{ display: "grid", placeItems: "center" }}>
                    {src && <img src={src} alt={boardTitle} style={{ width: "100%", height: "auto", maxHeight: "80vh", objectFit: "contain" }} />}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)} color="warning" variant="contained">
                        Cerrar
                    </Button>
                    <Button onClick={downloadImage} color="success" variant="contained" sx={{ color: "#000" }} disabled={!src}>
                        Descargar
                    </Button>
                </DialogActions>
            </Dialog>

            <Navigation />
        </Box>
    );
}
