import { useState, useEffect } from "react";
import { Box, Card, CardContent, CardMedia, Typography, Button, CardActions, IconButton, Stack, Alert, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import EventNoteIcon from '@mui/icons-material/EventNote';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIosNewOutlined from '@mui/icons-material/ArrowBackIosNewOutlined';
import { eventoService } from "../../apiService/services/eventoService";
import { archivoEventoService } from "../../apiService/services/archivoEventoService";
import type { Evento } from "../../apiService/types";

interface EventCardProps extends Evento {
  bannerUrl?: string;
  onDetail: (id: string) => void;
}

function EventCard({ _id, nombre, descripcion, bannerUrl, logo_url, inicio, numero_mesas, onDetail }: EventCardProps) {
  return (
    <Card sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 3
      },
      borderRadius: 2,
      overflow: 'hidden'
    }}>
      <CardMedia
        component="img"
        height="180"
        image={bannerUrl || logo_url || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"}
        alt={nombre}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography 
          gutterBottom 
          variant="h6" 
          component="h3" 
          sx={{ 
            fontWeight: 600,
            color: 'primary.main',
            mb: 2
          }}
        >
          {nombre}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ 
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          mb: 2,
          minHeight: '60px'
        }}>
          {descripcion}
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1.5,
          mt: 'auto',
          pt: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventNoteIcon fontSize="small" sx={{ color: 'primary.main', opacity: 0.8 }} />
            <Typography variant="body2" color="text.secondary">
              {new Date(inicio).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon fontSize="small" sx={{ color: 'primary.main', opacity: 0.8 }} />
            <Typography variant="body2" color="text.secondary">
              {numero_mesas} mesas
            </Typography>
          </Box>
        </Box>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0, mt: 'auto' }}>
        <Button 
          fullWidth
          variant="contained" 
          onClick={() => onDetail(_id)}
          sx={{ 
            textTransform: 'none',
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.main',
              opacity: 0.9
            },
            py: 1,
            borderRadius: 1
          }}
        >
          Ver detalles
        </Button>
      </CardActions>
    </Card>
  );
}

export default function EventFinished() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<(Evento & { bannerUrl?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar eventos finalizados
  useEffect(() => {
    const loadFinishedEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener eventos finalizados
        const response = await eventoService.getEventosPasados();
        const eventosData = response.data || [];
        
        // Cargar banners para cada evento
        const eventsWithBanners = await Promise.all(
          eventosData.map(async (evento) => {
            try {
              const archivosResponse = await archivoEventoService.getArchivosByEvento(evento._id);
              const banner = archivosResponse.data?.find(archivo => archivo.tipo === 'OTRO');
              return {
                ...evento,
                bannerUrl: banner?.url
              };
            } catch (err) {
              console.warn(`Error loading banner for event ${evento._id}:`, err);
              return evento;
            }
          })
        );
        
        setEvents(eventsWithBanners);
      } catch (err: any) {
        setError(err?.message || 'Error al cargar eventos finalizados');
        console.error('Error loading finished events:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadFinishedEvents();
  }, []);

  const handleDetail = (id: string) => {
    navigate(`/EventFinishedPage/${id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <Box sx={{ px: 2, pt: 1.5, pb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: "#1e4b46" }}>
            <ArrowBackIosNewOutlined />
          </IconButton>
          <Typography variant="h2" sx={{ fontWeight: 800, color: "1e4b46", fontSize: 26 }}>
            Rueda de negocios
          </Typography>
        </Stack>
      </Box>
      
      <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
        <Typography 
          variant="h5" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 600, 
            color: 'primary.main',
            mb: 3
          }}
        >
          Eventos Finalizados
        </Typography>
        
        {/* Mostrar errores */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {events.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No hay eventos finalizados disponibles.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {events.map((event) => (
              <EventCard key={event._id} {...event} onDetail={handleDetail} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}