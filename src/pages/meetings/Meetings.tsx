// src/pages/Meetings.tsx
import {
  Box,
  Button,
  Stack,
  Typography,
  IconButton,
  styled
} from "@mui/material";
import type { ButtonProps } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Navigation from "../../navigation/Navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export default function Meetings() {
  const navigate = useNavigate();

  const menu = [
    { 
      label: "Solicitudes", 
      to: "/Meeting/Requests",
      icon: <RequestQuoteIcon sx={{ fontSize: 40, mb: 1 }} />
    },
    { 
      label: "Mis invitaciones", 
      to: "/Meeting/Invitations",
      icon: <EventAvailableIcon sx={{ fontSize: 40, mb: 1 }} />
    },
    { 
      label: "Mi Agenda", 
      to: "/Meeting/MyAgenda",
      icon: <CalendarMonthIcon sx={{ fontSize: 40, mb: 1 }} />
    },
  ];
  
  const MenuButton = styled(Button)<ButtonProps & { component: typeof RouterLink; to: string }>(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '160px',
    width: 'calc(50% - 8px)', // 50% width with gap between items
    borderRadius: '12px !important',
    padding: '16px',
    textTransform: 'none',
    boxShadow: theme.shadows[2],
    '&:hover': {
        boxShadow: theme.shadows[4],
    },
    '& .MuiButton-label': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        height: '100%',
        justifyContent: 'center',
    },
  }));

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
      <Box sx={{ display: "flex", alignItems: "center", px: 2, pt: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1, color: "primary.dark" }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" sx={{ color: "#1e4b46", fontWeight: 800, fontSize: 26 }}>
          Rueda de negocios
        </Typography>
      </Box>

      {/* Contenido */}
      <Box sx={{ px: 3, pt: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 2, fontSize: 20, color: "#1e4b46" }}>
          Mis reuniones
        </Typography>

        <Stack 
          direction="row" 
          flexWrap="wrap" 
          gap={2}
          justifyContent="space-between"
          sx={{ '& > *': { flex: '0 0 calc(50% - 8px)' } }}
        >
          {menu.map((item) => (
            <MenuButton
              key={item.to}
              component={RouterLink}
              to={item.to}
              variant="contained"
              color="primary"
            >
              {item.icon}
              {item.label}
            </MenuButton>
          ))}
        </Stack>
      </Box>

      {/* Bottom Navigation */}
      <Navigation />
    </Box>
  );
}
