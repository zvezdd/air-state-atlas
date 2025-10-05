import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface AQIData {
  aqi: number;
  category: string;
  pm25: number;
  pm10: number;
}

export const AQIHeader = ({ open }: { open: boolean }) => {
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUSAAQI = async () => {
      if (!open) return;
      
      setIsLoading(true);
      
      try {
        // Fetch data for multiple representative states and average them
        const states = ["CA", "NY", "TX", "FL", "IL"];
        const promises = states.map(state =>
          supabase.functions.invoke("fetch-air-quality", {
            body: { stateCode: state },
          })
        );

        const results = await Promise.all(promises);
        const validData = results
          .filter(r => r.data && !r.error)
          .map(r => r.data);

        if (validData.length > 0) {
          // Calculate averages
          const avgAQI = Math.round(
            validData.reduce((sum, d) => sum + (d.airQuality?.aqi || 0), 0) / validData.length
          );
          const avgPM25 = Math.round(
            validData.reduce((sum, d) => sum + (d.airQuality?.pm25 || 0), 0) / validData.length
          );
          const avgPM10 = Math.round(
            validData.reduce((sum, d) => sum + (d.airQuality?.pm10 || 0), 0) / validData.length
          );

          // Determine category based on AQI
          let category = "Good";
          if (avgAQI > 300) category = "Hazardous";
          else if (avgAQI > 200) category = "Very Unhealthy";
          else if (avgAQI > 150) category = "Unhealthy";
          else if (avgAQI > 100) category = "Unhealthy for Sensitive Groups";
          else if (avgAQI > 50) category = "Moderate";

          setAqiData({
            aqi: avgAQI,
            category,
            pm25: avgPM25,
            pm10: avgPM10,
          });
        }
      } catch (error) {
        console.error("Error fetching USA AQI:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUSAAQI();
  }, [open]);

  const getAQIColor = (aqi: number) => {
    if (aqi > 300) return "bg-purple-600";
    if (aqi > 200) return "bg-red-600";
    if (aqi > 150) return "bg-orange-600";
    if (aqi > 100) return "bg-yellow-600";
    if (aqi > 50) return "bg-yellow-400";
    return "bg-green-600";
  };

  if (!open) return null;

  return (
    <div className="fixed top-16 right-0 left-0 bg-background/95 backdrop-blur-sm border-b border-border p-4 z-40 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-bold mb-3 text-center">USA Air Quality Overview</h2>
        
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </div>
        ) : aqiData ? (
          <div className="space-y-3">
            {/* AQI Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span>AQI: {aqiData.aqi}</span>
                <span className="font-medium">{aqiData.category}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full ${getAQIColor(aqiData.aqi)} transition-all duration-500 flex items-center justify-center text-white text-xs font-bold`}
                  style={{ width: `${Math.min((aqiData.aqi / 500) * 100, 100)}%` }}
                >
                  {aqiData.aqi}
                </div>
              </div>
            </div>

            {/* Particles */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <div className="font-medium">PM2.5</div>
                <div className="text-lg font-bold">{aqiData.pm25} μg/m³</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <div className="font-medium">PM10</div>
                <div className="text-lg font-bold">{aqiData.pm10} μg/m³</div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">Unable to load air quality data</p>
        )}
      </div>
    </div>
  );
};
