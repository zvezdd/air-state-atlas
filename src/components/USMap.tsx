import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatePopup } from "./StatePopup";

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
    { name: "California", code: "CA" },
    { name: "Texas", code: "TX" },
    { name: "Florida", code: "FL" },
    { name: "New York", code: "NY" },
    { name: "Pennsylvania", code: "PA" },
    { name: "Illinois", code: "IL" },
    { name: "Ohio", code: "OH" },
    { name: "Georgia", code: "GA" },
    { name: "North Carolina", code: "NC" },
    { name: "Michigan", code: "MI" },
    { name: "New Jersey", code: "NJ" },
    { name: "Virginia", code: "VA" },
    { name: "Washington", code: "WA" },
    { name: "Arizona", code: "AZ" },
    { name: "Massachusetts", code: "MA" },
    { name: "Tennessee", code: "TN" },
    { name: "Indiana", code: "IN" },
    { name: "Missouri", code: "MO" },
    { name: "Maryland", code: "MD" },
    { name: "Wisconsin", code: "WI" },
    { name: "Colorado", code: "CO" },
    { name: "Minnesota", code: "MN" },
    { name: "South Carolina", code: "SC" },
    { name: "Alabama", code: "AL" },
    { name: "Louisiana", code: "LA" },
    { name: "Kentucky", code: "KY" },
    { name: "Oregon", code: "OR" },
    { name: "Oklahoma", code: "OK" },
    { name: "Connecticut", code: "CT" },
    { name: "Utah", code: "UT" },
    { name: "Iowa", code: "IA" },
    { name: "Nevada", code: "NV" },
    { name: "Arkansas", code: "AR" },
    { name: "Mississippi", code: "MS" },
    { name: "Kansas", code: "KS" },
    { name: "New Mexico", code: "NM" },
    { name: "Nebraska", code: "NE" },
    { name: "West Virginia", code: "WV" },
    { name: "Idaho", code: "ID" },
    { name: "Hawaii", code: "HI" },
    { name: "New Hampshire", code: "NH" },
    { name: "Maine", code: "ME" },
    { name: "Montana", code: "MT" },
    { name: "Rhode Island", code: "RI" },
    { name: "Delaware", code: "DE" },
    { name: "South Dakota", code: "SD" },
    { name: "North Dakota", code: "ND" },
    { name: "Alaska", code: "AK" },
    { name: "Vermont", code: "VT" },
    { name: "Wyoming", code: "WY" },
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

      {/* Map Container - Using custom SVG as visual reference with state buttons overlay */}
      <div className="relative max-w-5xl w-full glass rounded-2xl p-8 shadow-glow-lg">
        {/* Background image for visual reference */}
        <div className="absolute inset-0 opacity-30 rounded-2xl overflow-hidden pointer-events-none">
          <img 
            src="/src/assets/usmap.jpg" 
            alt="US Map Background" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Interactive state grid */}
        <div className="relative grid grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2 p-4">
          {states.map((state) => (
            <button
              key={state.code}
              onClick={() => handleStateClick(state)}
              onMouseEnter={() => setHoveredState(state.code)}
              onMouseLeave={() => setHoveredState(null)}
              className={`
                glass rounded-lg p-2 text-xs font-semibold
                transition-all duration-300 hover-scale
                ${hoveredState === state.code ? 'shadow-glow ring-2 ring-primary' : ''}
                hover:bg-primary/20 hover:text-primary
                focus:outline-none focus:ring-2 focus:ring-primary
              `}
              aria-label={`View air quality data for ${state.name}`}
            >
              {state.code}
            </button>
          ))}
        </div>

        {/* Hover tooltip */}
        {hoveredState && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 glass rounded-lg px-4 py-2 animate-fade-in">
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
