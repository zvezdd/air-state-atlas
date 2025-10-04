import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";

interface AirQualityData {
  available: boolean;
  stateCode?: string;
  reportingArea?: string;
  dateObserved?: string;
  timeObserved?: number;
  message?: string;
  airQuality?: {
    pm25: { aqi: number; category: string; categoryNumber: number } | null;
    ozone: { aqi: number; category: string; categoryNumber: number } | null;
    no2: { aqi: number; category: string; categoryNumber: number } | null;
  };
  weather?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  } | null;
}

interface StateSplitViewProps {
  stateName: string;
  stateCode: string;
  data: AirQualityData | null;
  isLoading: boolean;
  onClose: () => void;
}

const getAQIValue = (data: AirQualityData | null): number => {
  if (!data?.available || !data.airQuality) return 0;
  const pm25 = data.airQuality.pm25?.aqi || 0;
  const ozone = data.airQuality.ozone?.aqi || 0;
  const no2 = data.airQuality.no2?.aqi || 0;
  return Math.max(pm25, ozone, no2);
};

const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return "bg-green-500";
  if (aqi <= 100) return "bg-yellow-500";
  if (aqi <= 150) return "bg-orange-500";
  if (aqi <= 200) return "bg-red-500";
  if (aqi <= 300) return "bg-purple-500";
  return "bg-red-900";
};

const getAQICategory = (aqi: number): string => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

export const StateSplitView = ({ stateName, stateCode, data, isLoading, onClose }: StateSplitViewProps) => {
  const aqiValue = getAQIValue(data);
  const aqiColor = getAQIColor(aqiValue);
  const aqiCategory = getAQICategory(aqiValue);

  // Using picsum.photos for reliable placeholder images
  const stateImages = [
    `https://picsum.photos/seed/${stateCode}1/800/600`,
    `https://picsum.photos/seed/${stateCode}2/800/600`,
    `https://picsum.photos/seed/${stateCode}3/800/600`,
  ];

  return (
    <div className="w-1/2 p-8 overflow-y-auto bg-background relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 glass rounded-full p-2 hover:bg-destructive/20 transition-colors"
        aria-label="Close split view"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Images and AQI Content */}
      <div className="w-full">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-2 bg-gradient-accent bg-clip-text text-transparent">
            {stateName}
          </h2>
          <p className="text-muted-foreground mb-6">{stateCode}</p>

          {/* State Images */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            {stateImages.map((img, idx) => (
              <div key={idx} className="glass rounded-xl overflow-hidden hover-scale">
                <img
                  src={img}
                  alt={`${stateName} landmark ${idx + 1}`}
                  className="w-full h-64 object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* Air Quality Index */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-2xl font-semibold mb-4">Air Quality Index</h3>
            
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ) : data?.available && aqiValue > 0 ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-3xl font-bold">{aqiValue}</span>
                    <span className="text-lg font-medium">{aqiCategory}</span>
                  </div>
                  <Progress 
                    value={(aqiValue / 500) * 100} 
                    className="h-4"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {data.airQuality?.pm25 && (
                    <div className="glass rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">PM2.5</p>
                      <p className="text-xl font-bold">{data.airQuality.pm25.aqi}</p>
                      <p className="text-xs">{data.airQuality.pm25.category}</p>
                    </div>
                  )}
                  {data.airQuality?.ozone && (
                    <div className="glass rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Ozone</p>
                      <p className="text-xl font-bold">{data.airQuality.ozone.aqi}</p>
                      <p className="text-xs">{data.airQuality.ozone.category}</p>
                    </div>
                  )}
                  {data.airQuality?.no2 && (
                    <div className="glass rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">NO₂</p>
                      <p className="text-xl font-bold">{data.airQuality.no2.aqi}</p>
                      <p className="text-xs">{data.airQuality.no2.category}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No air quality data available for {stateName}</p>
            )}
          </div>

          {/* Weather Data */}
          {data?.weather && (
            <div className="glass rounded-xl p-6 mt-4">
              <h3 className="text-xl font-semibold mb-4">Weather</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Temperature</p>
                  <p className="text-2xl font-bold">{data.weather.temperature}°F</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Humidity</p>
                  <p className="text-2xl font-bold">{data.weather.humidity}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Wind Speed</p>
                  <p className="text-2xl font-bold">{data.weather.windSpeed} mph</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
