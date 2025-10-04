import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatePopup } from "./StatePopup";
import usMapBackground from "@/assets/usmap.svg";

interface StateData {
  name: string;
  code: string;
}

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

export const USMap = () => {
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const states = [
    { name: "California", code: "CA", x: 8, y: 52 },
    { name: "Texas", code: "TX", x: 42, y: 75 },
    { name: "Florida", code: "FL", x: 80, y: 82 },
    { name: "New York", code: "NY", x: 85, y: 28 },
    { name: "Pennsylvania", code: "PA", x: 82, y: 35 },
    { name: "Illinois", code: "IL", x: 62, y: 42 },
    { name: "Ohio", code: "OH", x: 72, y: 38 },
    { name: "Georgia", code: "GA", x: 75, y: 68 },
    { name: "North Carolina", code: "NC", x: 80, y: 58 },
    { name: "Michigan", code: "MI", x: 70, y: 28 },
    { name: "New Jersey", code: "NJ", x: 86, y: 36 },
    { name: "Virginia", code: "VA", x: 80, y: 52 },
    { name: "Washington", code: "WA", x: 12, y: 15 },
    { name: "Arizona", code: "AZ", x: 22, y: 65 },
    { name: "Massachusetts", code: "MA", x: 88, y: 25 },
    { name: "Tennessee", code: "TN", x: 68, y: 58 },
    { name: "Indiana", code: "IN", x: 68, y: 42 },
    { name: "Missouri", code: "MO", x: 56, y: 52 },
    { name: "Maryland", code: "MD", x: 82, y: 48 },
    { name: "Wisconsin", code: "WI", x: 62, y: 30 },
    { name: "Colorado", code: "CO", x: 32, y: 48 },
    { name: "Minnesota", code: "MN", x: 56, y: 25 },
    { name: "South Carolina", code: "SC", x: 78, y: 65 },
    { name: "Alabama", code: "AL", x: 68, y: 68 },
    { name: "Louisiana", code: "LA", x: 58, y: 78 },
    { name: "Kentucky", code: "KY", x: 72, y: 50 },
    { name: "Oregon", code: "OR", x: 10, y: 28 },
    { name: "Oklahoma", code: "OK", x: 48, y: 62 },
    { name: "Connecticut", code: "CT", x: 87, y: 30 },
    { name: "Utah", code: "UT", x: 24, y: 45 },
    { name: "Iowa", code: "IA", x: 56, y: 38 },
    { name: "Nevada", code: "NV", x: 15, y: 45 },
    { name: "Arkansas", code: "AR", x: 58, y: 62 },
    { name: "Mississippi", code: "MS", x: 62, y: 70 },
    { name: "Kansas", code: "KS", x: 48, y: 48 },
    { name: "New Mexico", code: "NM", x: 32, y: 62 },
    { name: "Nebraska", code: "NE", x: 48, y: 38 },
    { name: "West Virginia", code: "WV", x: 78, y: 48 },
    { name: "Idaho", code: "ID", x: 20, y: 30 },
    { name: "Hawaii", code: "HI", x: 25, y: 90 },
    { name: "New Hampshire", code: "NH", x: 88, y: 22 },
    { name: "Maine", code: "ME", x: 90, y: 15 },
    { name: "Montana", code: "MT", x: 28, y: 22 },
    { name: "Rhode Island", code: "RI", x: 89, y: 28 },
    { name: "Delaware", code: "DE", x: 84, y: 45 },
    { name: "South Dakota", code: "SD", x: 45, y: 30 },
    { name: "North Dakota", code: "ND", x: 42, y: 20 },
    { name: "Alaska", code: "AK", x: 5, y: 88 },
    { name: "Vermont", code: "VT", x: 87, y: 20 },
    { name: "Wyoming", code: "WY", x: 32, y: 32 },
  ];

  const handleStateClick = async (state: StateData) => {
    setSelectedState(state);
    setIsLoading(true);
    setAirQualityData(null);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-air-quality', {
        body: { stateCode: state.code }
      });

      if (error) throw error;

      setAirQualityData(data);
      
      if (!data.available) {
        toast.info(`No data available for ${state.name}`);
      }
    } catch (error) {
      console.error('Error fetching air quality data:', error);
      toast.error('Failed to fetch air quality data');
      setAirQualityData({ available: false, message: 'Failed to fetch data' });
    } finally {
      setIsLoading(false);
    }
  };

  const closePopup = () => {
    setSelectedState(null);
    setAirQualityData(null);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
      {/* Title */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-5xl font-bold bg-gradient-accent bg-clip-text text-transparent mb-2">
          Environmental Air Quality Monitor
        </h1>
        <p className="text-muted-foreground text-lg">
          Click any state to view real-time air quality and weather data
        </p>
      </div>

      {/* Map Container - Interactive positioned map */}
      <div className="relative max-w-6xl w-full glass rounded-2xl p-4 shadow-glow-lg">
        {/* US Map Background */}
        <div className="relative w-full" style={{ paddingBottom: '62.5%' }}>
          <img 
            src={usMapBackground} 
            alt="US Map" 
            className="absolute inset-0 w-full h-full object-contain opacity-70"
          />
          
          {/* Positioned state buttons */}
          {states.map((state) => (
            <button
              key={state.code}
              onClick={() => handleStateClick(state)}
              onMouseEnter={() => setHoveredState(state.code)}
              onMouseLeave={() => setHoveredState(null)}
              style={{
                position: 'absolute',
                left: `${state.x}%`,
                top: `${state.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              className={`
                glass rounded-lg px-2 py-1 text-xs font-bold
                transition-all duration-300 hover-scale
                ${hoveredState === state.code ? 'shadow-glow ring-2 ring-primary z-10' : ''}
                hover:bg-primary/30 hover:text-primary
                focus:outline-none focus:ring-2 focus:ring-primary
                min-w-[2.5rem]
              `}
              aria-label={`View air quality data for ${state.name}`}
            >
              {state.code}
            </button>
          ))}
        </div>

        {/* Hover tooltip */}
        {hoveredState && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 glass rounded-lg px-4 py-2 animate-fade-in z-20">
            <p className="text-sm font-medium">
              {states.find(s => s.code === hoveredState)?.name}
            </p>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full">
        <div className="glass rounded-xl p-4 hover-scale">
          <div className="text-3xl mb-2">💨</div>
          <h3 className="font-semibold text-primary mb-1">Air Quality Index</h3>
          <p className="text-sm text-muted-foreground">
            Real-time PM2.5, Ozone, and NO₂ measurements
          </p>
        </div>
        <div className="glass rounded-xl p-4 hover-scale">
          <div className="text-3xl mb-2">🌤️</div>
          <h3 className="font-semibold text-accent mb-1">Weather Data</h3>
          <p className="text-sm text-muted-foreground">
            Current temperature, humidity, and wind speed
          </p>
        </div>
        <div className="glass rounded-xl p-4 hover-scale">
          <div className="text-3xl mb-2">🗺️</div>
          <h3 className="font-semibold text-primary mb-1">All 50 States</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive coverage across the United States
          </p>
        </div>
      </div>

      {/* Popup */}
      {selectedState && (
        <StatePopup
          stateName={selectedState.name}
          stateCode={selectedState.code}
          data={airQualityData}
          isLoading={isLoading}
          onClose={closePopup}
        />
      )}
    </div>
  );
};
