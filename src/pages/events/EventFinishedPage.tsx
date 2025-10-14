import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Avatar, Divider, CircularProgress, IconButton, Stack, Alert, CardMedia } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { PeopleAltOutlined, HandshakeOutlined, EventSeatOutlined, AttachMoneyOutlined } from '@mui/icons-material';
import ArrowBackIosNewOutlined from '@mui/icons-material/ArrowBackIosNewOutlined';
import Navigation from '../../navigation/Navigation';
import { eventoService } from '../../apiService/services/eventoService';
import { archivoEventoService } from '../../apiService/services/archivoEventoService';
import type { Evento } from '../../apiService/types';

interface MetricCardProps {
  icon: React.ReactElement;
  value: string;
  label: string;
}

const MetricCard = ({ icon, value, label }: MetricCardProps) => (
  <Paper 
    elevation={2} 
    sx={{ 
      p: 3, 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      borderRadius: 2
    }}
  >
    <Avatar sx={{ bgcolor: 'primary.main', mb: 2, width: 60, height: 60 }}>
      {React.cloneElement(icon, { 
        sx: { 
          fontSize: 32,
          color: 'white' 
        } 
      } as any)}
    </Avatar>
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      {value}
    </Typography>
    <Typography variant="body1" color="text.secondary">
      {label}
    </Typography>
  </Paper>
);

const EventFinishedPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const eventoData = await eventoService.getEvento(id);
        setEvento(eventoData);
        
        // Cargar banner del evento
        try {
          const archivosResponse = await archivoEventoService.getArchivosByEvento(id);
          const banner = archivosResponse.data?.find(archivo => archivo.tipo === 'OTRO');
          if (banner) {
            setBannerUrl(banner.url);
          }
        } catch (bannerError) {
          console.warn('Error loading banner:', bannerError);
        }
      } catch (error: any) {
        setError(error?.message || 'Error al cargar los datos del evento');
        console.error('Error al cargar los datos del evento:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [id]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !evento) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Evento no encontrado'}
        </Alert>
        <Typography variant="h6">No se encontró el evento solicitado</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          El evento puede haber sido eliminado o no existir.
        </Typography>
      </Box>
    );
  }

  // Datos simulados para las métricas (en el futuro se pueden obtener de estadísticas reales)
  const metrics = [
    { icon: <PeopleAltOutlined />, value: '0', label: 'Participantes' },
    { icon: <HandshakeOutlined />, value: '0', label: 'Tratos Cerrados' },
    { icon: <AttachMoneyOutlined />, value: 'Bs. 0', label: 'Monto Total en Negocios' },
    { icon: <EventSeatOutlined />, value: evento.numero_mesas.toString(), label: 'Mesas' },
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      pb: '88px', // Space for bottom navigation
    }}>
      <Box sx={{ px: 2, pt: 1.5, pb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: "#1e4b46" }}>
            <ArrowBackIosNewOutlined />
          </IconButton>
          <Typography variant="h2" sx={{ fontWeight: 800, color: "#1e4b46", fontSize: 26 }}>
            Rueda de negocios
          </Typography>
        </Stack>
      </Box>
      <Box sx={{ p: 3, flex: 1 }}>
        {/* Banner del evento */}
        <Paper elevation={3} sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="250"
              image={bannerUrl || evento.logo_url || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1470&auto=format&fit=crop"}
              alt={evento.nombre}
              sx={{ objectFit: 'cover' }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'flex-end',
                p: 3,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.6) 100%)',
                color: '#fff',
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    fontSize: { xs: '1.8rem', sm: '2.5rem' }
                  }}
                >
                  {evento.nombre}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    opacity: 0.9,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    fontSize: { xs: '1rem', sm: '1.2rem' }
                  }}
                >
                  Evento Finalizado
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ 
            fontWeight: 600, 
            mb: 3,
            color: 'primary.main',
            textAlign: 'center'
          }}
        >
          Resumen del evento
        </Typography>

        {/* Información adicional del evento */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Información del Evento
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Descripción</Typography>
              <Typography variant="body1">{evento.descripcion}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Fecha de inicio</Typography>
              <Typography variant="body1">
                {new Date(evento.inicio).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Fecha de fin</Typography>
              <Typography variant="body1">
                {new Date(evento.fin).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Duración de reunión</Typography>
              <Typography variant="body1">{evento.duracion_minutos_reunion} minutos</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Modo de mesas</Typography>
              <Typography variant="body1">
                {evento.modo_mesas === 'FIJA_POR_EMPRESA' ? 'Fija por empresa' : 'Por reunión'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Estado</Typography>
              <Typography variant="body1" sx={{ 
                color: evento.estado === 'FINALIZADO' ? 'success.main' : 'warning.main',
                fontWeight: 600
              }}>
                {evento.estado}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4
        }}>
          {metrics.map((metric, index) => (
            <Box key={index}>
              <MetricCard 
                icon={metric.icon}
                value={metric.value}
                label={metric.label}
              />
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            ¡Gracias por participar!
          </Typography>
          <Typography color="text.secondary" paragraph>
            Esperamos que hayas tenido una excelente experiencia en nuestro evento.
          </Typography>
        </Box>
      </Box>

      {/* Navegación inferior */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000,
          borderRadius: 0,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16
        }} 
        elevation={3}
      >
        <Navigation />
      </Paper>
    </Box>
  );
};

export default EventFinishedPage;