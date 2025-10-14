// src/pages/EventSchedule.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ImageBoardPage from "../common/ImageBoardPage";
import { archivoEventoService } from "../../apiService/services/archivoEventoService";

export default function EventSchedule() {
    const { id } = useParams<{ id: string }>();
    const [cronogramaUrl, setCronogramaUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCronograma = async () => {
            if (!id) {
                console.log("❌ No hay ID de evento");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log("🔍 Loading cronograma for evento:", id);
                
                // Obtener cronogramas del evento
                const cronogramasResponse = await archivoEventoService.getCronogramas(id);
                console.log("📋 Cronogramas response:", cronogramasResponse);
                
                if (cronogramasResponse.data && cronogramasResponse.data.length > 0) {
                    // Tomar el primer cronograma encontrado
                    const cronograma = cronogramasResponse.data[0];
                    console.log("📅 Cronograma encontrado:", cronograma);
                    setCronogramaUrl(cronograma.url);
                } else {
                    console.log("❌ No se encontraron cronogramas");
                    setCronogramaUrl(null);
                }
            } catch (error) {
                console.error("❌ Error loading cronograma:", error);
                setCronogramaUrl(null);
            } finally {
                setLoading(false);
            }
        };

        loadCronograma();
    }, [id]);

    if (loading) {
        return <ImageBoardPage boardTitle="Cronograma del evento" imageUrl={undefined} />;
    }

    return <ImageBoardPage boardTitle="Cronograma del evento" imageUrl={cronogramaUrl || undefined} />;
}
