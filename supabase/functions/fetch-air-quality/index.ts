import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AirNowObservation {
  DateObserved: string;
  HourObserved: number;
  LocalTimeZone: string;
  ReportingArea: string;
  StateCode: string;
  Latitude: number;
  Longitude: number;
  ParameterName: string;
  AQI: number;
  Category: {
    Number: number;
    Name: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stateCode } = await req.json();
    
    if (!stateCode) {
      return new Response(
        JSON.stringify({ error: 'State code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiKey = Deno.env.get('AIRNOW_API_KEY');
    
    if (!apiKey) {
      console.error('AIRNOW_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Fetch current observations for the state
    const airNowUrl = `https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=${getStateZipCode(stateCode)}&distance=100&API_KEY=${apiKey}`;
    
    console.log(`Fetching air quality data for state: ${stateCode} with zip: ${getStateZipCode(stateCode)}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    let response;
    try {
      response = await fetch(airNowUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError';
      console.error(`AirNow API fetch error for ${stateCode}:`, fetchError);
      return new Response(
        JSON.stringify({ 
          available: false, 
          message: isTimeout 
            ? 'Request timed out. The air quality service is responding slowly. Please try again.' 
            : 'Unable to retrieve air quality data. The service may be temporarily unavailable.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AirNow API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          available: false, 
          message: `Air quality data temporarily unavailable (Status: ${response.status})` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const data: AirNowObservation[] = await response.json();
    
    if (!data || data.length === 0) {
      console.log(`No data available for state: ${stateCode}`);
      return new Response(
        JSON.stringify({ available: false, message: 'Data currently unavailable for this state' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Parse the observations
    const pm25 = data.find(obs => obs.ParameterName === 'PM2.5');
    const pm10 = data.find(obs => obs.ParameterName === 'PM10');
    const ozone = data.find(obs => obs.ParameterName === 'O3' || obs.ParameterName === 'OZONE');
    const no2 = data.find(obs => obs.ParameterName === 'NO2');

    // Fetch weather data from Open-Meteo (free, no API key needed)
    const lat = data[0]?.Latitude || getStateCoordinates(stateCode).lat;
    const lon = data[0]?.Longitude || getStateCoordinates(stateCode).lon;
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;
    
    let weatherData = null;
    try {
      const weatherResponse = await fetch(weatherUrl);
      if (weatherResponse.ok) {
        const weather = await weatherResponse.json();
        weatherData = {
          temperature: weather.current.temperature_2m,
          humidity: weather.current.relative_humidity_2m,
          windSpeed: weather.current.wind_speed_10m,
        };
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
    }

    return new Response(
      JSON.stringify({
        available: true,
        stateCode,
        reportingArea: data[0]?.ReportingArea || stateCode,
        dateObserved: data[0]?.DateObserved,
        timeObserved: data[0]?.HourObserved,
        airQuality: {
          pm25: pm25 ? {
            aqi: pm25.AQI,
            category: pm25.Category.Name,
            categoryNumber: pm25.Category.Number,
          } : null,
          pm10: pm10 ? {
            aqi: pm10.AQI,
            category: pm10.Category.Name,
            categoryNumber: pm10.Category.Number,
          } : null,
          ozone: ozone ? {
            aqi: ozone.AQI,
            category: ozone.Category.Name,
            categoryNumber: ozone.Category.Number,
          } : null,
          no2: no2 ? {
            aqi: no2.AQI,
            category: no2.Category.Name,
            categoryNumber: no2.Category.Number,
          } : null,
        },
        weather: weatherData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in fetch-air-quality function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage, available: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})

// Helper function to get a representative zip code for each state
function getStateZipCode(stateCode: string): string {
  const zipCodes: Record<string, string> = {
    'AL': '35203', 'AK': '99501', 'AZ': '85001', 'AR': '72201', 'CA': '90001',
    'CO': '80201', 'CT': '06101', 'DE': '19901', 'FL': '32301', 'GA': '30301',
    'HI': '96801', 'ID': '83701', 'IL': '60601', 'IN': '46201', 'IA': '50301',
    'KS': '66101', 'KY': '40201', 'LA': '70112', 'ME': '04101', 'MD': '21201',
    'MA': '02101', 'MI': '48201', 'MN': '55101', 'MS': '39201', 'MO': '63101',
    'MT': '59601', 'NE': '68501', 'NV': '89501', 'NH': '03301', 'NJ': '07101',
    'NM': '87101', 'NY': '10001', 'NC': '27601', 'ND': '58501', 'OH': '43201',
    'OK': '73101', 'OR': '97201', 'PA': '19101', 'RI': '02901', 'SC': '29201',
    'SD': '57501', 'TN': '37201', 'TX': '73301', 'UT': '84101', 'VT': '05601',
    'VA': '23218', 'WA': '98101', 'WV': '25301', 'WI': '53701', 'WY': '82001',
  };
  return zipCodes[stateCode] || '10001';
}

// Helper function to get approximate state coordinates
function getStateCoordinates(stateCode: string): { lat: number; lon: number } {
  const coordinates: Record<string, { lat: number; lon: number }> = {
    'AL': { lat: 32.806671, lon: -86.791130 },
    'AK': { lat: 61.370716, lon: -152.404419 },
    'AZ': { lat: 33.729759, lon: -111.431221 },
    'AR': { lat: 34.969704, lon: -92.373123 },
    'CA': { lat: 36.116203, lon: -119.681564 },
    'CO': { lat: 39.059811, lon: -105.311104 },
    'CT': { lat: 41.597782, lon: -72.755371 },
    'DE': { lat: 39.318523, lon: -75.507141 },
    'FL': { lat: 27.766279, lon: -81.686783 },
    'GA': { lat: 33.040619, lon: -83.643074 },
    'HI': { lat: 21.094318, lon: -157.498337 },
    'ID': { lat: 44.240459, lon: -114.478828 },
    'IL': { lat: 40.349457, lon: -88.986137 },
    'IN': { lat: 39.849426, lon: -86.258278 },
    'IA': { lat: 42.011539, lon: -93.210526 },
    'KS': { lat: 38.526600, lon: -96.726486 },
    'KY': { lat: 37.668140, lon: -84.670067 },
    'LA': { lat: 31.169546, lon: -91.867805 },
    'ME': { lat: 44.693947, lon: -69.381927 },
    'MD': { lat: 39.063946, lon: -76.802101 },
    'MA': { lat: 42.230171, lon: -71.530106 },
    'MI': { lat: 43.326618, lon: -84.536095 },
    'MN': { lat: 45.694454, lon: -93.900192 },
    'MS': { lat: 32.741646, lon: -89.678696 },
    'MO': { lat: 38.456085, lon: -92.288368 },
    'MT': { lat: 46.921925, lon: -110.454353 },
    'NE': { lat: 41.125370, lon: -98.268082 },
    'NV': { lat: 38.313515, lon: -117.055374 },
    'NH': { lat: 43.452492, lon: -71.563896 },
    'NJ': { lat: 40.298904, lon: -74.521011 },
    'NM': { lat: 34.840515, lon: -106.248482 },
    'NY': { lat: 42.165726, lon: -74.948051 },
    'NC': { lat: 35.630066, lon: -79.806419 },
    'ND': { lat: 47.528912, lon: -99.784012 },
    'OH': { lat: 40.388783, lon: -82.764915 },
    'OK': { lat: 35.565342, lon: -96.928917 },
    'OR': { lat: 44.572021, lon: -122.070938 },
    'PA': { lat: 40.590752, lon: -77.209755 },
    'RI': { lat: 41.680893, lon: -71.511780 },
    'SC': { lat: 33.856892, lon: -80.945007 },
    'SD': { lat: 44.299782, lon: -99.438828 },
    'TN': { lat: 35.747845, lon: -86.692345 },
    'TX': { lat: 31.054487, lon: -97.563461 },
    'UT': { lat: 40.150032, lon: -111.862434 },
    'VT': { lat: 44.045876, lon: -72.710686 },
    'VA': { lat: 37.769337, lon: -78.169968 },
    'WA': { lat: 47.400902, lon: -121.490494 },
    'WV': { lat: 38.491226, lon: -80.954453 },
    'WI': { lat: 44.268543, lon: -89.616508 },
    'WY': { lat: 42.755966, lon: -107.302490 },
  };
  return coordinates[stateCode] || { lat: 40.0, lon: -100.0 };
}
