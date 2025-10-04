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

    // Search for photos of the state
    const queries = [
      `${stateName} landmark`,
      `${stateName} cityscape`,
      `${stateName} nature landscape`
    ];

    const photoPromises = queries.map(async (query) => {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
        {
          headers: {
            'Authorization': PEXELS_API_KEY
          }
        }
      );

      if (!response.ok) {
        console.error(`Pexels API error for query "${query}":`, response.status);
        return null;
      }

      const data = await response.json();
      return data.photos?.[0]?.src?.large || null;
    });

    const photos = await Promise.all(photoPromises);
    const validPhotos = photos.filter(photo => photo !== null);

    console.log(`Fetched ${validPhotos.length} photos for ${stateName}`);

    return new Response(
      JSON.stringify({ photos: validPhotos }),
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
