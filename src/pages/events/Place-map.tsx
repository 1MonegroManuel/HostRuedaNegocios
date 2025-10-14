// src/pages/VenueMap.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ImageBoardPage from "../common/ImageBoardPage";
import { archivoEventoService } from "../../apiService/services/archivoEventoService";

export default function VenueMap() {
    const { id } = useParams<{ id: string }>();
    const [mapaUrl, setMapaUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMapa = async () => {
            if (!id) {
                console.log("❌ No hay ID de evento");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log("🔍 Loading mapa for evento:", id);
                
                // Obtener mapas del evento
                const mapasResponse = await archivoEventoService.getMapas(id);
                console.log("📋 Mapas response:", mapasResponse);
                
                if (mapasResponse.data && mapasResponse.data.length > 0) {
                    // Tomar el primer mapa encontrado
                    const mapa = mapasResponse.data[0];
                    console.log("🗺️ Mapa encontrado:", mapa);
                    setMapaUrl(mapa.url);
                } else {
                    console.log("❌ No se encontraron mapas");
                    setMapaUrl(null);
                }
            } catch (error) {
                console.error("❌ Error loading mapa:", error);
                setMapaUrl(null);
            } finally {
                setLoading(false);
            }
        };

        loadMapa();
    }, [id]);

    if (loading) {
        return <ImageBoardPage boardTitle="Mapa del lugar" imageUrl={undefined} />;
    }

    return <ImageBoardPage boardTitle="Mapa del lugar" imageUrl={mapaUrl || undefined} />;
}
