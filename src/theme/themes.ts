import { createTheme } from "@mui/material/styles";

/** ──────────────────────────────────────────────
 *  Augmentations para usar variants personalizados
 *  ────────────────────────────────────────────── */
declare module "@mui/material/Chip" {
    interface ChipPropsVariantOverrides {
        statusOngoing: true;
        statusPending: true;
        statusDone: true;
        tag: true;
        pill: true;
    }
}
declare module "@mui/material/Card" {
    interface CardPropsVariantOverrides {
        soft: true;
    }
}
declare module "@mui/material/Button" {
    interface ButtonPropsVariantOverrides {
        danger: true;
        pillPrimary: true;
    }
}

/** ──────────────────────────────────────────────
 *  Extensión del tema para tokens custom
 *  ────────────────────────────────────────────── */
declare module "@mui/material/styles" {
    interface Theme {
        custom: {
            radii: { card: number; pill: number; field: number };
            shadows: { card: string; button: string; buttonStrong: string; focusHalo: string };
            gradients: { appBg: string };
            input: { height: number; border: string; borderHover: string; borderFocus: string };
            status: {
                ongoing: { bg: string; fg: string };
                pending: { bg: string; fg: string };
                done: { bg: string; fg: string };
            };
        };
    }
    interface ThemeOptions {
        custom?: {
            radii?: Partial<Theme["custom"]["radii"]>;
            shadows?: Partial<Theme["custom"]["shadows"]>;
            gradients?: Partial<Theme["custom"]["gradients"]>;
            input?: Partial<Theme["custom"]["input"]>;
            status?: Partial<Theme["custom"]["status"]>;
        };
    }
}

const theme = createTheme({
    palette: {
        primary: { main: "#6BAF33", dark: "#4DA41A", light: "#8ED34D", contrastText: "#ffffff" },
        secondary: { main: "#E9E7A1" },
        success: { main: "#8ED34D" },
        warning: { main: "#E9E7A1", dark: "#E2DE8C", contrastText: "#3e3e3e" },
        info: { main: "#B6E26D", dark: "#6BAF33" },
        text: { primary: "#000000", secondary: "#6E7071" },
        grey: { 100: "#F5FAF2", 200: "#EAF6E1", 300: "#BEEA9A", 700: "#6E7071" },
        background: { default: "#ffffff", paper: "#f8fffe" },
    },

    typography: {
        fontFamily: ["Raleway", "sans-serif"].join(","),
        h1: { fontSize: 28, fontWeight: 800 },
        h2: { fontSize: 20, fontWeight: 700 },
        body1: { fontSize: 14 },
        button: { textTransform: "none", fontWeight: 700 },
    },

    shape: { borderRadius: 12 },

    custom: {
        radii: { card: 24, pill: 20, field: 20 },
        shadows: {
            card: "0 25px 50px rgba(107,175,51,0.15), 0 10px 30px rgba(0,0,0,0.10)",
            button: "0 6px 14px rgba(0,0,0,0.12)",
            buttonStrong: "0 8px 20px rgba(110,176,50,0.35)",
            focusHalo: "0 0 0 4px rgba(107,175,51,0.12)",
        },
        gradients: { appBg: "linear-gradient(0deg, #4DA41A 0%, #6BAF33 60%)" },
        input: {
            height: 52,
            border: "#B6E26D",
            borderHover: "#6BAF33",
            borderFocus: "#6BAF33",
        },
        status: {
            ongoing: { bg: "rgba(251,170,41,0.25)", fg: "#6b5200" },
            pending: { bg: "rgba(251,170,41,0.18)", fg: "#6b5200" },
            done: { bg: "rgba(142,211,77,0.25)", fg: "#054d12" },
        },
    },

    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: { background: "linear-gradient(0deg, #4DA41A 0%, #6BAF33 60%)" },
            },
        },

        /** ─ Buttons ─ **/
        MuiButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: theme.custom.radii.pill,
                    boxShadow: theme.custom.shadows.button,
                    fontWeight: 700,
                    paddingTop: 12,
                    paddingBottom: 12,
                }),
                containedWarning: ({ theme }) => ({
                    backgroundColor: theme.palette.warning.main,
                    color: theme.palette.warning.contrastText,
                    "&:hover": { backgroundColor: theme.palette.warning.dark },
                }),
                containedSuccess: ({ theme }) => ({
                    backgroundColor: theme.palette.primary.light,
                    color: theme.palette.common.black,
                    boxShadow: theme.custom.shadows.buttonStrong,
                    "&:hover": { backgroundColor: "#7AC83F" },
                }),
            },
            variants: [
                {
                    // Botón rojo (Logout / acciones destructivas)
                    props: { variant: "danger" as any },
                    style: ({ theme }) => ({
                        backgroundColor: "#FF2D2D",
                        color: theme.palette.common.black,
                        "&:hover": { backgroundColor: "#e12727" },
                    }),
                },
                {
                    // Botón primario en píldora (si lo quieres explícito)
                    props: { variant: "pillPrimary" as any },
                    style: ({ theme }) => ({
                        backgroundColor: theme.palette.primary.dark,
                        color: theme.palette.common.white,
                        borderRadius: theme.custom.radii.pill,
                        boxShadow: theme.custom.shadows.buttonStrong,
                        "&:hover": { backgroundColor: theme.palette.primary.main },
                    }),
                },
            ],
        },

        /** ─ TextField (inputs) ─ **/
        MuiTextField: {
            defaultProps: { variant: "outlined", size: "medium" },
            styleOverrides: {
                root: ({ theme }) => ({
                    "& .MuiOutlinedInput-root": {
                        borderRadius: theme.custom.radii.field,
                        backgroundColor: theme.palette.common.white,
                        height: theme.custom.input.height,
                        "& fieldset": { borderColor: theme.custom.input.border },
                        "&:hover fieldset": { borderColor: theme.custom.input.borderHover },
                        "&.Mui-focused fieldset": { borderColor: theme.custom.input.borderFocus, borderWidth: 2 },
                        "& .MuiOutlinedInput-input": {
                            padding: "14px 16px",
                            color: theme.palette.text.primary,
                            "&::placeholder": { color: theme.palette.text.secondary, opacity: 1 },
                        },
                        "&.MuiInputBase-adornedStart .MuiOutlinedInput-input": { paddingLeft: 0 },
                        "&.Mui-focused": { boxShadow: theme.custom.shadows.focusHalo },
                    },
                }),
            },
        },
        MuiInputAdornment: {
            styleOverrides: { root: { color: "#6BAF33" } },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: ({ theme }) => ({ fontWeight: 600, color: theme.palette.text.primary }),
            },
        },

        /** ─ Select/Menu ─ **/
        MuiSelect: {
            styleOverrides: {
                select: ({ theme }) => ({ padding: "14px 16px" }),
                icon: ({ theme }) => ({ color: theme.palette.primary.dark }),
            },
        },
        MuiMenuItem: {
            styleOverrides: { root: { minHeight: 44, fontWeight: 600 } },
        },

        /** ─ Card ─ **/
        MuiCard: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: theme.custom.radii.card,
                    boxShadow: theme.custom.shadows.card,
                    background: "linear-gradient(135deg, #ffffff 0%, #f8fffe 100%)",
                }),
            },
            variants: [
                {
                    props: { variant: "soft" as any },
                    style: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.info.main}`,
                    }),
                },
            ],
        },

        /** ─ Chip ─ **/
        MuiChip: {
            styleOverrides: {
                root: ({ theme }) => ({ fontWeight: 800 }),
            },
            variants: [
                // Estado: En curso
                {
                    props: { variant: "statusOngoing" as any, size: "small" },
                    style: ({ theme }) => ({
                        backgroundColor: theme.custom.status.ongoing.bg,
                        color: theme.custom.status.ongoing.fg,
                        height: 22,
                    }),
                },
                // Estado: Pendiente
                {
                    props: { variant: "statusPending" as any, size: "small" },
                    style: ({ theme }) => ({
                        backgroundColor: theme.custom.status.pending.bg,
                        color: theme.custom.status.pending.fg,
                        height: 22,
                    }),
                },
                // Estado: Finalizada
                {
                    props: { variant: "statusDone" as any, size: "small" },
                    style: ({ theme }) => ({
                        backgroundColor: theme.custom.status.done.bg,
                        color: theme.custom.status.done.fg,
                        height: 22,
                    }),
                },
                // Tag genérico (p. ej. rubro)
                {
                    props: { variant: "tag" as any, size: "small" },
                    style: ({ theme }) => ({
                        backgroundColor: "rgba(251,170,41,0.30)",
                        color: "#5b4a00",
                        height: 22,
                    }),
                },
                // Chip estilo píldora
                {
                    props: { variant: "pill" as any, size: "small" },
                    style: ({ theme }) => ({
                        borderRadius: theme.custom.radii.pill,
                        height: 22,
                    }),
                },
            ],
        },

        /** ─ Bottom navigation ─ **/
        MuiBottomNavigation: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    paddingBottom: "env(safe-area-inset-bottom)",
                }),
            },
        },
        MuiBottomNavigationAction: {
            styleOverrides: {
                root: ({ theme }) => ({
                    minWidth: 0,
                    color: theme.palette.primary.dark,
                    "&.Mui-selected": { color: theme.palette.primary.dark },
                    // Tamaño de icono por defecto más grande (y responsive)
                    "& .MuiSvgIcon-root": { fontSize: 28 },
                    "@media (max-width:600px)": {
                        "& .MuiSvgIcon-root": { fontSize: 26 },
                    },
                }),
                label: { fontWeight: 700 },
            },
        },

        /** ─ Dialog ─ **/
        MuiDialog: {
            styleOverrides: {
                paper: ({ theme }) => ({
                    borderRadius: theme.custom.radii.card,
                }),
            },
        },
        MuiDialogTitle: {
            styleOverrides: { root: { fontWeight: 800 } },
        },

        /** ─ Tooltip ─ **/
        MuiTooltip: {
            styleOverrides: {
                tooltip: ({ theme }) => ({
                    fontSize: 12,
                    borderRadius: 8,
                    backgroundColor: theme.palette.grey[700],
                }),
                arrow: ({ theme }) => ({ color: theme.palette.grey[700] }),
            },
        },

        /** ─ IconButton (colores por defecto coherentes) ─ **/
        MuiIconButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    color: theme.palette.primary.dark,
                    "&:hover": { backgroundColor: theme.palette.grey[100] },
                }),
            },
        },

        /** ─ Divider ─ **/
        MuiDivider: {
            styleOverrides: {
                root: ({ theme }) => ({
                    "&::before, &::after": { borderColor: theme.palette.grey[300] },
                }),
            },
        },
    },
});

export default theme;
