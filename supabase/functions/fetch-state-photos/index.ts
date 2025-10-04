import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stateName } = await req.json();
    
    if (!stateName) {
      return new Response(
        JSON.stringify({ error: 'State name is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY');
    
    if (!PEXELS_API_KEY) {
      console.error('PEXELS_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Search for photos of the state - fetch more to ensure uniqueness
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(stateName)}&per_page=15`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) {
      console.error(`Pexels API error:`, response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch photos' }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    // Get unique photos by ID and take first 3
    const uniquePhotos = new Map();
    data.photos?.forEach((photo: any) => {
      if (!uniquePhotos.has(photo.id)) {
        uniquePhotos.set(photo.id, photo.src.large);
      }
    });
    
    const photos = Array.from(uniquePhotos.values()).slice(0, 3);

    console.log(`Fetched ${photos.length} unique photos for ${stateName}`);

    return new Response(
      JSON.stringify({ photos }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching state photos:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
