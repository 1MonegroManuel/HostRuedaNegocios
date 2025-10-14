// src/pages/CompanyLogoUpload.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, Stack, Typography } from "@mui/material";
import { Upload } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import theme from "../../theme/themes";

// Tipos coherentes con Company-Registration y Registration-Review
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
    logoFile?: File | string | null; // por si volvemos a esta pantalla con un logo ya elegido
};

export default function CompanyLogoUpload() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { company, logoFile } = (state as LocationState) || {};

    // Si entran directo sin "company", regresamos al paso anterior
    useEffect(() => {
        if (!company) navigate("/company-registration", { replace: true });
    }, [company, navigate]);

    const [file, setFile] = useState<File | null>(
        logoFile instanceof File ? logoFile : null
    );
    const [preview, setPreview] = useState<string | null>(
        typeof logoFile === "string" ? logoFile : null
    );

    // Limpiar object URLs cuando cambie el archivo o desmontemos
    useEffect(() => {
        let objUrl: string | null = null;
        if (file) {
            objUrl = URL.createObjectURL(file);
            setPreview(objUrl);
        }
        return () => {
            if (objUrl) URL.revokeObjectURL(objUrl);
        };
    }, [file]);

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        // si f es null, dejamos `preview` como estaba (p.ej. si venía una URL previa)
    };

    const canContinue = useMemo(() => !!file || !!preview, [file, preview]);

    const goBack = () =>
        navigate("/company-registration", { state: { company }, replace: false });

    const goNext = () => {
        if (!company) return;
        // Ahora vamos al registro del encargado, llevando company + logo
        navigate("/employee-registration", {
            state: {
                company,
                logoFile: file ?? preview ?? null,
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
            <Card
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    px: { xs: 3, sm: 4 },
                    py: { xs: 3, sm: 4 },
                }}
            >
                <Typography variant="h2" sx={{ mb: 2 }}>
                    Logo de la Empresa
                </Typography>

                <Stack spacing={2}>
                    {/* Zona de preview con tokens del theme */}
                    <Box
                        sx={{
                            border: `1px dashed ${theme.palette.info.main}`,
                            borderRadius: theme.custom.radii.card,
                            p: 2,
                            bgcolor: "background.paper",
                            textAlign: "center",
                            minHeight: 120,
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        {preview ? (
                            <Box
                                component="img"
                                src={preview}
                                alt="Vista previa del logo de la empresa"
                                sx={{
                                    width: "100%",
                                    maxHeight: 220,
                                    objectFit: "contain",
                                    borderRadius: 2,
                                }}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Sube el logo de tu empresa (PNG/JPG)
                            </Typography>
                        )}
                    </Box>

                    {/* Botón subir (usa overrides del theme) */}
                    <Button variant="outlined" component="label" startIcon={<Upload />}>
                        Subir logo
                        <input hidden type="file" accept="image/*" onChange={onPick} />
                    </Button>

                    {/* Navegación */}
                    <Stack direction="row" gap={2} sx={{ mt: 1 }}>
                        <Button fullWidth variant="contained" color="warning" onClick={goBack}>
                            Atrás
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            disabled={!canContinue}
                            onClick={goNext}
                        >
                            Guardar y continuar
                        </Button>
                    </Stack>
                </Stack>
            </Card>
        </Box>
    );
}
