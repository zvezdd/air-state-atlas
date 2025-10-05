import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AirQualityData {
  available: boolean;
  stateCode?: string;
  reportingArea?: string;
  dateObserved?: string;
  timeObserved?: number;
  message?: string;
  airQuality?: {
    pm25: {
      aqi: number;
      category: string;
      categoryNumber: number;
    } | null;
    pm10: {
      aqi: number;
      category: string;
      categoryNumber: number;
    } | null;
    ozone: {
      aqi: number;
      category: string;
      categoryNumber: number;
    } | null;
    no2: {
      aqi: number;
      category: string;
      categoryNumber: number;
    } | null;
  };
  weather?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  } | null;
}

interface StatePopupProps {
  stateName: string;
  stateCode: string;
  data: AirQualityData | null;
  isLoading: boolean;
  onClose: () => void;
}

const getAQIColor = (categoryNumber: number) => {
  const colors = {
    1: "text-green-400", // Good
    2: "text-yellow-400", // Moderate
    3: "text-orange-400", // Unhealthy for Sensitive Groups
    4: "text-red-400", // Unhealthy
    5: "text-purple-400", // Very Unhealthy
    6: "text-pink-400", // Hazardous
  };
  return colors[categoryNumber as keyof typeof colors] || "text-foreground";
};

export const StatePopup = ({ stateName, stateCode, data, isLoading, onClose }: StatePopupProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass relative w-full max-w-2xl rounded-2xl p-6 shadow-glow-lg animate-scale-in">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 hover:bg-primary/20 hover:text-primary"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-primary mb-1">{stateName}</h2>
          <p className="text-sm text-muted-foreground">
            {data?.reportingArea && `${data.reportingArea} • `}
            {stateCode}
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 animate-pulse-glow rounded-full border-4 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Fetching environmental data...</p>
          </div>
        )}

        {/* No data available */}
        {!isLoading && data && !data.available && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🌫️</div>
            <p className="text-xl text-muted-foreground">{data.message || "Data currently unavailable"}</p>
            <p className="text-sm text-muted-foreground mt-2">Please try another state</p>
          </div>
        )}

        {/* Data display */}
        {!isLoading && data && data.available && (
          <div className="space-y-6">
            {/* Air Quality Section */}
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="text-2xl">💨</span>
                Air Quality Index
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* PM2.5 */}
                <div className="glass rounded-xl p-4 hover-scale">
                  <div className="text-sm text-muted-foreground mb-1">PM2.5</div>
                  {data.airQuality?.pm25 ? (
                    <>
                      <div className={`text-3xl font-bold ${getAQIColor(data.airQuality.pm25.categoryNumber)}`}>
                        {data.airQuality.pm25.aqi}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {data.airQuality.pm25.category}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">No data</div>
                  )}
                </div>

                {/* PM10 */}
                <div className="glass rounded-xl p-4 hover-scale">
                  <div className="text-sm text-muted-foreground mb-1">PM10</div>
                  {data.airQuality?.pm10 ? (
                    <>
                      <div className={`text-3xl font-bold ${getAQIColor(data.airQuality.pm10.categoryNumber)}`}>
                        {data.airQuality.pm10.aqi}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {data.airQuality.pm10.category}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">No data</div>
                  )}
                </div>

                {/* Ozone */}
                <div className="glass rounded-xl p-4 hover-scale">
                  <div className="text-sm text-muted-foreground mb-1">Ozone (O₃)</div>
                  {data.airQuality?.ozone ? (
                    <>
                      <div className={`text-3xl font-bold ${getAQIColor(data.airQuality.ozone.categoryNumber)}`}>
                        {data.airQuality.ozone.aqi}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {data.airQuality.ozone.category}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">No data</div>
                  )}
                </div>

                {/* NO2 */}
                <div className="glass rounded-xl p-4 hover-scale">
                  <div className="text-sm text-muted-foreground mb-1">Nitrogen (NO₂)</div>
                  {data.airQuality?.no2 ? (
                    <>
                      <div className={`text-3xl font-bold ${getAQIColor(data.airQuality.no2.categoryNumber)}`}>
                        {data.airQuality.no2.aqi}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {data.airQuality.no2.category}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Weather Section */}
            {data.weather && (
              <div>
                <h3 className="text-xl font-semibold text-accent mb-4 flex items-center gap-2">
                  <span className="text-2xl">🌤️</span>
                  Meteorological Data
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass rounded-xl p-4 hover-scale">
                    <div className="text-sm text-muted-foreground mb-1">Temperature</div>
                    <div className="text-2xl font-bold text-accent">
                      {data.weather.temperature}°C
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4 hover-scale">
                    <div className="text-sm text-muted-foreground mb-1">Humidity</div>
                    <div className="text-2xl font-bold text-accent">
                      {data.weather.humidity}%
                    </div>
                  </div>
                  <div className="glass rounded-xl p-4 hover-scale">
                    <div className="text-sm text-muted-foreground mb-1">Wind Speed</div>
                    <div className="text-2xl font-bold text-accent">
                      {data.weather.windSpeed} km/h
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamp */}
            {data.dateObserved && (
              <div className="text-xs text-muted-foreground text-center pt-4 border-t border-primary/20">
                Data observed: {data.dateObserved} at {data.timeObserved}:00
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
