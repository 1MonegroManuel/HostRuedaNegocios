// src/pages/CompanyReceipt.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    Stack,
    Typography,
} from "@mui/material";
import { Upload, PictureAsPdf } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import theme from "../../theme/themes";

type CompanyData = {
    nombre: string;
    rubro: string;           // puede ser "__OTRO__"
    rubroOtro?: string;
    descripcion: string;
    intereses: string[];
    isVirtual: boolean;
};

type LocationState = {
    company?: CompanyData;
    logoFile?: File | string | null;
    receiptFile?: File | string | null; // por si vuelven a esta pantalla ya con comprobante
};

export default function CompanyReceiptUpload() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { company, logoFile, receiptFile } = (state as LocationState) || {};

    // Si entran directo sin company, regresamos al paso anterior
    useEffect(() => {
        if (!company) navigate("/company-registration", { replace: true });
    }, [company, navigate]);

    // Estado del comprobante
    const [file, setFile] = useState<File | null>(
        receiptFile instanceof File ? receiptFile : null
    );

    // Si venimos con URL previa (por ejemplo, si ya lo subiste antes y lo guardaste en el backend)
    const [stringUrl, setStringUrl] = useState<string | null>(
        typeof receiptFile === "string" ? receiptFile : null
    );

    // URL local para ver/descargar el File (imagen o PDF)
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    // Crear / limpiar objectURL del File
    useEffect(() => {
        if (!file) {
            setFileUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setFileUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const isPdfUrl = (url: string) => /\.pdf($|\?)/i.test(url);

    // ¿Podemos mostrar preview de imagen?
    const isImage = useMemo(() => {
        if (file) return file.type.startsWith("image/");
        if (stringUrl) return !isPdfUrl(stringUrl);
        return false;
    }, [file, stringUrl]);

    const viewUrl = file ? fileUrl : stringUrl;

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        // si selecciona un nuevo archivo, descartamos la URL previa (si había)
        setStringUrl(null);
    };

    const canContinue = !!file || !!stringUrl;

    const goBack = () =>
        navigate("/company-logo", { state: { company, logoFile, receiptFile: file ?? stringUrl ?? null } });

    const finish = () => {
        if (!company) return;
        navigate("/Employee-registration", {
            state: {
                company,
                logoFile: logoFile ?? null,
                receiptFile: file ?? stringUrl ?? null,
            },
        });
    };

    if (!company) return null;

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
            <Card sx={{ width: "100%", maxWidth: 420, px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 4 } }}>
                <Typography variant="h2" sx={{ mb: 2 }}>
                    Comprobante de Pago
                </Typography>

                <Stack spacing={2}>
                    <Box
                        sx={{
                            border: `1px dashed ${theme.palette.info.main}`,
                            borderRadius: theme.custom.radii.card,
                            p: 2,
                            backgroundColor: "#fff",
                            textAlign: "center",
                            minHeight: 120,
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        {viewUrl ? (
                            isImage ? (
                                <img
                                    src={viewUrl}
                                    alt="Comprobante"
                                    style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 12 }}
                                />
                            ) : (
                                <Stack alignItems="center" spacing={1}>
                                    <PictureAsPdf />
                                    <Button
                                        variant="contained"
                                        color="success"
                                        sx={{ color: "#000" }}
                                        onClick={() => window.open(viewUrl, "_blank", "noopener,noreferrer")}
                                    >
                                        Ver / Descargar PDF
                                    </Button>
                                </Stack>
                            )
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Sube tu comprobante (PDF o imagen)
                            </Typography>
                        )}
                    </Box>

                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<Upload />}
                        sx={{ borderRadius: theme.custom.radii.pill }}
                    >
                        Subir comprobante
                        <input hidden type="file" accept="image/*,application/pdf" onChange={onPick} />
                    </Button>

                    <Stack direction="row" gap={2} sx={{ mt: 1 }}>
                        <Button fullWidth variant="contained" color="warning" onClick={goBack}>
                            Atrás
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            sx={{ color: "#000" }}
                            disabled={!canContinue}
                            onClick={finish}
                        >
                            Guardar y continuar
                        </Button>
                    </Stack>
                </Stack>
            </Card>
        </Box>
    );
}
