// src/navigation/Navigation.tsx
import * as React from "react";
import {
    BottomNavigation,
    BottomNavigationAction,
    Paper,
    Alert,
    Typography,
    Button,
} from "@mui/material";
import {
    HomeOutlined,
    PersonOutline,
    NotificationsNoneOutlined,
    AccountCircleOutlined,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import type { SxProps, Theme } from "@mui/material/styles";
import { useAuth } from "../contexts/AuthContext";
import { empresaService } from "../apiService/services/empresaService";

export type NavItem = {
    label?: string;
    to: string;
    icon: React.ReactNode;
    value?: string;
    match?: "startsWith" | "exact";
    requiresAuth?: boolean;
    allowedRoles?: string[];
    requiresApprovedCompany?: boolean;
};

export interface NavigationProps {
    items?: NavItem[];
    fixed?: boolean;
    showLabels?: boolean;
    elevation?: number;
    paperSx?: SxProps<Theme>;
    navSx?: SxProps<Theme>;
    /** Tamaño de iconos en px (por defecto 32) */
    iconSize?: number;
}

// Items base para diferentes tipos de usuario
const adminItems: NavItem[] = [
    { 
        label: "", 
        to: "/home", 
        icon: <HomeOutlined />, 
        value: "home", 
        match: "startsWith",
        requiresAuth: true,
        allowedRoles: ["admin"]
    },
    { 
        label: "", 
        to: "/Profile", 
        icon: <AccountCircleOutlined />, 
        value: "profile", 
        match: "startsWith",
        requiresAuth: true
    },
    { 
        label: "", 
        to: "/Notifications", 
        icon: <NotificationsNoneOutlined />, 
        value: "notifications", 
        match: "startsWith",
        requiresAuth: true
    },
];

const encargadoItems: NavItem[] = [
    { 
        label: "", 
        to: "/home", 
        icon: <HomeOutlined />, 
        value: "home", 
        match: "startsWith",
        requiresAuth: true,
        allowedRoles: ["encargado"],
        requiresApprovedCompany: true
    },
    { 
        label: "", 
        to: "/Profile", 
        icon: <PersonOutline />, 
        value: "profile", 
        match: "startsWith",
        requiresAuth: true
    },
    { 
        label: "", 
        to: "/Notifications", 
        icon: <NotificationsNoneOutlined />, 
        value: "notifications", 
        match: "startsWith",
        requiresAuth: true
    },
];

const personalItems: NavItem[] = [
    { 
        label: "", 
        to: "/home", 
        icon: <HomeOutlined />, 
        value: "home", 
        match: "startsWith",
        requiresAuth: true,
        allowedRoles: ["personal"]
    },
    { 
        label: "", 
        to: "/Profile", 
        icon: <PersonOutline />, 
        value: "profile", 
        match: "startsWith",
        requiresAuth: true
    },
    { 
        label: "", 
        to: "/Notifications", 
        icon: <NotificationsNoneOutlined />, 
        value: "notifications", 
        match: "startsWith",
        requiresAuth: true
    },
];

export default function Navigation({
    items,
    fixed = true,
    showLabels = false,
    elevation = 3,
    paperSx,
    navSx,
    iconSize = 40,
}: NavigationProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading, hasRole } = useAuth();
    const [empresa, setEmpresa] = React.useState<any>(null);
    const [empresaLoading, setEmpresaLoading] = React.useState(false);

    // Cargar empresa para encargados
    React.useEffect(() => {
        const loadEmpresa = async () => {
            if (hasRole("encargado") && user?._id) {
                setEmpresaLoading(true);
                try {
                    const empresaData = await empresaService.getEmpresaByEncargado(user._id);
                    setEmpresa(empresaData);
                } catch (error) {
                    console.error("Error loading empresa:", error);
                    setEmpresa(null);
                } finally {
                    setEmpresaLoading(false);
                }
            }
        };

        loadEmpresa();
    }, [user, hasRole]);

    // Determinar items según el tipo de usuario
    const getItemsForUser = (): NavItem[] => {
        if (items) return items; // Si se pasan items personalizados, usarlos
        
        if (!user) return []; // Sin usuario, sin navegación
        
        if (hasRole("admin")) return adminItems;
        if (hasRole("encargado")) {
            // Si la empresa está pendiente o rechazada, solo mostrar perfil y notificaciones
            if (empresa?.estado === 'pendiente' || empresa?.estado === 'rechazado') {
                return encargadoItems.filter(item => 
                    item.to === "/Profile" || item.to === "/Notifications"
                );
            }
            // Solo si está aceptada, mostrar navegación completa
            if (empresa?.estado === 'aceptado') {
                return encargadoItems;
            }
            // Si no hay empresa o estado desconocido, solo perfil y notificaciones
            return encargadoItems.filter(item => 
                item.to === "/Profile" || item.to === "/Notifications"
            );
        }
        if (hasRole("personal")) return personalItems;
        
        return [];
    };

    const navigationItems = getItemsForUser();

    // ✅ TODOS LOS HOOKS AL NIVEL SUPERIOR
    const currentValue = React.useMemo(() => {
        const exact = navigationItems.find((it) => it.match === "exact" && location.pathname === it.to);
        if (exact) return exact.value ?? exact.to;
        const starts = navigationItems.find((it) => location.pathname.startsWith(it.to));
        if (starts) return starts.value ?? starts.to;
        const first = navigationItems[0];
        return first?.value ?? first?.to ?? "";
    }, [navigationItems, location.pathname]);

    // Función para renderizar iconos (sin hooks)
    const renderIcon = React.useCallback((icon: React.ReactNode) => {
        if (React.isValidElement(icon)) {
            const prevSx = (icon.props as any)?.sx ?? {};
            return React.cloneElement(icon as any, {
                sx: { fontSize: iconSize, ...prevSx },
            });
        }
        return icon;
    }, [iconSize]);

    // Memoizar el contenido para evitar re-renders innecesarios
    const content = React.useMemo(() => {
        // Si no hay usuario autenticado, mostrar mensaje
        if (!loading && !user) {
            return (
                <Paper
                    elevation={elevation}
                    sx={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        p: 2,
                        ...paperSx,
                    }}
                >
                    <Alert 
                        severity="warning" 
                        action={
                            <Button 
                                color="inherit" 
                                size="small" 
                                onClick={() => navigate("/")}
                            >
                                Iniciar Sesión
                            </Button>
                        }
                    >
                        <Typography variant="body2">
                            Debes iniciar sesión para acceder a la navegación
                        </Typography>
                    </Alert>
                </Paper>
            );
        }

        // Si está cargando usuario o empresa, no mostrar nada
        if (loading || (hasRole("encargado") && empresaLoading)) {
            return null;
        }

        // Si no hay items de navegación, no mostrar nada
        if (navigationItems.length === 0) {
            return null;
        }

        // Renderizar navegación normal
        const nav = (
            <BottomNavigation
                value={currentValue}
                showLabels={showLabels}
                onChange={(_e: any, newValue: any) => {
                    const target = navigationItems.find((it) => (it.value ?? it.to) === newValue);
                    if (target) navigate(target.to);
                }}
                sx={{
                    "& .MuiBottomNavigationAction-root": {
                        color: (t: any) => t.palette.primary.dark,
                        minWidth: 0,
                        py: 3,
                    },
                    "& .MuiSvgIcon-root": { fontSize: iconSize },
                    "& .Mui-selected": { color: (t: any) => t.palette.primary.dark },
                    ...navSx,
                }}
            >
                {navigationItems.map((it) => (
                    <BottomNavigationAction
                        key={it.value ?? it.to}
                        value={it.value ?? it.to}
                        icon={renderIcon(it.icon)}
                        label={it.label}
                        aria-label={it.label}
                    />
                ))}
            </BottomNavigation>
        );

        if (!fixed) return nav;

        return (
            <Paper
                elevation={elevation}
                sx={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    pb: "env(safe-area-inset-bottom)",
                    ...paperSx,
                }}
            >
                {nav}
            </Paper>
        );
    }, [loading, user, empresaLoading, navigationItems, elevation, paperSx, navigate, renderIcon, currentValue, showLabels, fixed, iconSize, navSx]);

    // Retornar el contenido memoizado
    return content;
}
