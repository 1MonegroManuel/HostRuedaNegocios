import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Rating,
  Stack,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { encuestaService } from '../apiService/services/encuestaService';
import type { EncuestaCreate, EncuestaPendiente } from '../apiService/services/encuestaService';

interface EncuestaPopupProps {
  open: boolean;
  onClose: () => void;
  encuestaPendiente: EncuestaPendiente | null;
  empresaId: string;
  onSuccess: () => void;
}

export default function EncuestaPopup({
  open,
  onClose,
  encuestaPendiente,
  empresaId,
  onSuccess,
}: EncuestaPopupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para los campos de la encuesta
  const [calificacionGeneral, setCalificacionGeneral] = useState<number>(0);
  const [matchNegocio, setMatchNegocio] = useState<number>(0);
  const [puntualidad, setPuntualidad] = useState<number>(0);
  const [interesContraparte, setInteresContraparte] = useState<number>(0);
  const [recomendarNps, setRecomendarNps] = useState<number>(0);
  const [montoAcordado, setMontoAcordado] = useState<string>('');
  const [montoPersonalizado, setMontoPersonalizado] = useState<string>('');
  const [comentarios, setComentarios] = useState<string>('');

  // Opciones predefinidas de montos
  const montosPredefinidos = [
    { value: '', label: 'No se acordó monto' },
    { value: '1000', label: '$1,000 USD' },
    { value: '5000', label: '$5,000 USD' },
    { value: '10000', label: '$10,000 USD' },
    { value: '25000', label: '$25,000 USD' },
    { value: '50000', label: '$50,000 USD' },
    { value: '100000', label: '$100,000 USD' },
    { value: '250000', label: '$250,000 USD' },
    { value: '500000', label: '$500,000 USD' },
    { value: '1000000', label: '$1,000,000 USD' },
    { value: 'otro', label: 'Otro monto' },
  ];

  const handleSubmit = async () => {
    if (!encuestaPendiente) return;

    if (calificacionGeneral === 0) {
      setError('La calificación general es obligatoria');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determinar el monto acordado
      let montoFinal: number | null = null;
      if (montoAcordado === 'otro' && montoPersonalizado) {
        montoFinal = parseFloat(montoPersonalizado);
      } else if (montoAcordado && montoAcordado !== '') {
        montoFinal = parseFloat(montoAcordado);
      }

      const encuestaData: EncuestaCreate = {
        eventoId: encuestaPendiente.eventoId,
        solicitudReunionId: encuestaPendiente.solicitudReunionId,
        empresaId: empresaId,
        calificacion_general: calificacionGeneral,
        match_negocio: matchNegocio > 0 ? matchNegocio : null,
        puntualidad: puntualidad > 0 ? puntualidad : null,
        interes_contraparte: interesContraparte > 0 ? interesContraparte : null,
        recomendar_nps: recomendarNps,
        monto_acordado: montoFinal,
        comentarios: comentarios.trim() || null,
      };

      await encuestaService.createEncuesta(encuestaData);

      // Limpiar formulario
      setCalificacionGeneral(0);
      setMatchNegocio(0);
      setPuntualidad(0);
      setInteresContraparte(0);
      setRecomendarNps(0);
      setMontoAcordado('');
      setMontoPersonalizado('');
      setComentarios('');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al enviar la encuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!encuestaPendiente) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} color="#1e4b46" component="div">
            Encuesta de Satisfacción
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Reunión con: <strong>{encuestaPendiente.empresaContraparte.nombre}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fecha: {new Date(encuestaPendiente.fechaReunion).toLocaleDateString()}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Calificación General - Obligatoria */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Calificación General *
            </Typography>
            <Rating
              value={calificacionGeneral}
              onChange={(_, value) => setCalificacionGeneral(value || 0)}
              size="large"
              icon={<Star fontSize="inherit" />}
              emptyIcon={<StarBorder fontSize="inherit" />}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {calificacionGeneral === 0 && 'Selecciona una calificación'}
              {calificacionGeneral === 1 && 'Muy insatisfecho'}
              {calificacionGeneral === 2 && 'Insatisfecho'}
              {calificacionGeneral === 3 && 'Neutral'}
              {calificacionGeneral === 4 && 'Satisfecho'}
              {calificacionGeneral === 5 && 'Muy satisfecho'}
            </Typography>
          </Box>

          {/* Match de Negocio */}
          <Box>
            <Typography variant="h6" gutterBottom>
              ¿Qué tan bien encajó el negocio?
            </Typography>
            <Rating
              value={matchNegocio}
              onChange={(_, value) => setMatchNegocio(value || 0)}
              size="large"
              icon={<Star fontSize="inherit" />}
              emptyIcon={<StarBorder fontSize="inherit" />}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {matchNegocio === 0 && 'Opcional'}
              {matchNegocio === 1 && 'No encajó nada'}
              {matchNegocio === 2 && 'Poco encaje'}
              {matchNegocio === 3 && 'Encaje moderado'}
              {matchNegocio === 4 && 'Buen encaje'}
              {matchNegocio === 5 && 'Excelente encaje'}
            </Typography>
          </Box>

          {/* Puntualidad */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Puntualidad
            </Typography>
            <Rating
              value={puntualidad}
              onChange={(_, value) => setPuntualidad(value || 0)}
              size="large"
              icon={<Star fontSize="inherit" />}
              emptyIcon={<StarBorder fontSize="inherit" />}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {puntualidad === 0 && 'Opcional'}
              {puntualidad === 1 && 'Muy impuntual'}
              {puntualidad === 2 && 'Impuntual'}
              {puntualidad === 3 && 'Regular'}
              {puntualidad === 4 && 'Puntual'}
              {puntualidad === 5 && 'Muy puntual'}
            </Typography>
          </Box>

          {/* Interés de la Contraparte */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Interés mostrado por la contraparte
            </Typography>
            <Rating
              value={interesContraparte}
              onChange={(_, value) => setInteresContraparte(value || 0)}
              size="large"
              icon={<Star fontSize="inherit" />}
              emptyIcon={<StarBorder fontSize="inherit" />}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {interesContraparte === 0 && 'Opcional'}
              {interesContraparte === 1 && 'Sin interés'}
              {interesContraparte === 2 && 'Poco interés'}
              {interesContraparte === 3 && 'Interés moderado'}
              {interesContraparte === 4 && 'Buen interés'}
              {interesContraparte === 5 && 'Excelente interés'}
            </Typography>
          </Box>

          {/* NPS - Recomendación */}
          <Box>
            <Typography variant="h6" gutterBottom>
              ¿Qué tan probable es que recomiendes esta empresa? (NPS)
            </Typography>
            <Rating
              value={recomendarNps}
              onChange={(_, value) => setRecomendarNps(value || 0)}
              size="large"
              max={10}
              icon={<Star fontSize="inherit" />}
              emptyIcon={<StarBorder fontSize="inherit" />}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {recomendarNps === 0 && 'Escala de 0 a 10'}
              {recomendarNps >= 1 && recomendarNps <= 6 && 'Detractor'}
              {recomendarNps >= 7 && recomendarNps <= 8 && 'Neutral'}
              {recomendarNps >= 9 && recomendarNps <= 10 && 'Promotor'}
            </Typography>
          </Box>

          {/* Monto Acordado */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Monto aproximado acordado
            </Typography>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Selecciona el monto acordado</InputLabel>
              <Select
                value={montoAcordado}
                onChange={(e) => setMontoAcordado(e.target.value)}
                label="Selecciona el monto acordado"
              >
                {montosPredefinidos.map((monto) => (
                  <MenuItem key={monto.value} value={monto.value}>
                    {monto.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Campo para monto personalizado */}
            {montoAcordado === 'otro' && (
              <TextField
                fullWidth
                variant="outlined"
                label="Ingresa el monto en USD"
                type="number"
                value={montoPersonalizado}
                onChange={(e) => setMontoPersonalizado(e.target.value)}
                placeholder="Ej: 15000"
                sx={{ mt: 2 }}
                inputProps={{ min: 0, step: 1 }}
              />
            )}

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Indica el monto aproximado en USD que se acordó entre las empresas
            </Typography>
          </Box>

          {/* Comentarios */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Comentarios adicionales
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="Comparte tu experiencia, sugerencias o comentarios sobre la reunión..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              variant="outlined"
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || calificacionGeneral === 0}
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Enviando...' : 'Enviar Encuesta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
