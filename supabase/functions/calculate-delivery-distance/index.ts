import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DistanceRequest {
  deliveryAddress: string
  deliveryCity: string
  deliveryState: string
  deliveryZip: string
}

interface DistanceResponse {
  distanceInMiles: number
  durationInMinutes: number
  success: boolean
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const { deliveryAddress, deliveryCity, deliveryState, deliveryZip }: DistanceRequest = await req.json()
    
    if (!deliveryAddress || !deliveryCity || !deliveryState || !deliveryZip) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required address fields' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!googleMapsApiKey) {
      console.error('Google Maps API key not found')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Maps API key not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Store address
    const storeAddress = '7600 North Lamar Blvd Austin, TX 78752'
    
    // Customer address
    const customerAddress = `${deliveryAddress}, ${deliveryCity}, ${deliveryState} ${deliveryZip}`
    
    console.log(`Calculating distance from store: ${storeAddress} to customer: ${customerAddress}`)

    // Call Google Maps Distance Matrix API
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${encodeURIComponent(storeAddress)}&destinations=${encodeURIComponent(customerAddress)}&key=${googleMapsApiKey}&mode=driving`
    
    const response = await fetch(url)
    const data = await response.json()
    
    console.log('Google Maps API response:', JSON.stringify(data, null, 2))

    if (data.status !== 'OK') {
      console.error('Google Maps API error:', data.status, data.error_message)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Google Maps API error: ${data.status}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const element = data.rows[0]?.elements[0]
    if (!element || element.status !== 'OK') {
      console.error('Distance calculation failed:', element?.status)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not calculate distance to this address' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract distance in miles and duration in minutes
    const distanceText = element.distance.text // e.g., "5.2 mi"
    const distanceInMiles = parseFloat(distanceText.replace(' mi', ''))
    
    const durationText = element.duration.text // e.g., "12 mins"
    const durationInMinutes = parseInt(durationText.replace(' mins', '').replace(' min', ''))

    console.log(`Distance: ${distanceInMiles} miles, Duration: ${durationInMinutes} minutes`)

    const result: DistanceResponse = {
      distanceInMiles,
      durationInMinutes,
      success: true
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error calculating distance:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})