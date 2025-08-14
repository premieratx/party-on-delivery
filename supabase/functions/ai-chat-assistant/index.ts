import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation, questionCount, context } = await req.json();
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Build context for the AI based on current conversation state
    const systemPrompt = `You are a helpful AI assistant for Party On Delivery, specializing in helping customers plan events and select the right drinks and party supplies.

Current conversation context:
- Occasion: ${conversation.occasion || 'Not specified'}
- Guest Count: ${conversation.guestCount || 'Not specified'} 
- Preferences: ${conversation.preferences?.join(', ') || 'Not specified'}
- Budget: ${conversation.budget || 'Not specified'}
- Event Date: ${conversation.eventDate || 'Not specified'}
- Additional Info: ${conversation.additionalInfo || 'None'}

Questions asked so far: ${questionCount}

Your goal is to gather information about:
1. Type of occasion/event
2. Number of guests attending  
3. Drink preferences (beer, wine, spirits, cocktails, etc.)
4. Budget range
5. Event date (to determine urgency)
6. Any special requirements

Ask follow-up questions naturally based on what information is still missing. Keep responses conversational and helpful. If you have enough information (3+ key details), suggest moving to product recommendations.

Be friendly, brief, and focused on gathering the essential details to make great recommendations.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://order.partyondelivery.com',
        'X-Title': 'Party On Delivery AI Assistant',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Extract any new information from the user's message
    const updatedConversation = { ...conversation };
    
    // Simple keyword extraction (in a real app, use more sophisticated NLP)
    const lowerMessage = message.toLowerCase();
    
    // Extract occasion
    if (!updatedConversation.occasion) {
      const occasions = ['birthday', 'wedding', 'party', 'celebration', 'graduation', 'anniversary', 'holiday', 'christmas', 'new year', 'bbq', 'barbecue'];
      for (const occasion of occasions) {
        if (lowerMessage.includes(occasion)) {
          updatedConversation.occasion = occasion;
          break;
        }
      }
    }
    
    // Extract guest count
    if (!updatedConversation.guestCount) {
      const numberMatch = lowerMessage.match(/(\d+)\s*(people|guests|person)/);
      if (numberMatch) {
        updatedConversation.guestCount = parseInt(numberMatch[1]);
      }
    }
    
    // Extract budget
    if (!updatedConversation.budget) {
      const budgetMatch = lowerMessage.match(/\$(\d+)/);
      if (budgetMatch) {
        updatedConversation.budget = `$${budgetMatch[1]}`;
      } else if (lowerMessage.includes('budget')) {
        if (lowerMessage.includes('low') || lowerMessage.includes('cheap')) {
          updatedConversation.budget = 'low';
        } else if (lowerMessage.includes('high') || lowerMessage.includes('expensive')) {
          updatedConversation.budget = 'high';
        } else if (lowerMessage.includes('medium') || lowerMessage.includes('moderate')) {
          updatedConversation.budget = 'medium';
        }
      }
    }

    // Extract preferences
    const drinkTypes = ['beer', 'wine', 'whiskey', 'vodka', 'rum', 'gin', 'cocktails', 'mixed drinks', 'spirits'];
    const foundPreferences = drinkTypes.filter(type => lowerMessage.includes(type));
    if (foundPreferences.length > 0) {
      updatedConversation.preferences = [...(updatedConversation.preferences || []), ...foundPreferences];
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      updatedConversation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Chat Assistant Error:', error);
    return new Response(JSON.stringify({ 
      response: "I'm sorry, I'm having trouble processing that. Could you try again?",
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});