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

    // Enhanced system prompt with comprehensive product knowledge and business context
    const systemPrompt = `You are an expert AI party planning assistant for Party On Delivery, Austin's premier alcohol delivery service. You specialize in curating the perfect drink selection for any occasion.

BUSINESS CONTEXT:
- Party On Delivery serves Austin, TX with same-day alcohol delivery
- We stock 1000+ premium beverages: craft beers, wines, spirits, mixers, party supplies
- We serve everything from intimate gatherings to large events (500+ people)
- Our specialty is creating customized party packages that perfectly match the occasion

CURRENT CONVERSATION STATE:
- Occasion: ${conversation.occasion || 'Not specified'}
- Guest Count: ${conversation.guestCount || 'Not specified'} 
- Drink Preferences: ${conversation.preferences?.join(', ') || 'Not specified'}
- Budget Range: ${conversation.budget || 'Not specified'}
- Event Date: ${conversation.eventDate || 'Not specified'}
- Additional Details: ${conversation.additionalInfo || 'None'}
- Questions Asked: ${questionCount}

PRODUCT CATEGORIES WE OFFER:
- Craft Beer: Local Austin breweries (Lazarus, Austin Beerworks, ABGB), IPAs, lagers, sours
- Wine: Reds, whites, rosé, champagne, prosecco for toasts and celebrations  
- Premium Spirits: Whiskey, vodka, rum, gin, tequila for cocktails and shots
- Mixers & Garnishes: Tonic, soda, bitters, fresh citrus, herbs
- Party Supplies: Ice, cups, napkins, bottle openers
- Non-Alcoholic: Sodas, sparkling water, energy drinks

GATHERING STRATEGY:
1. Identify the EXACT occasion (birthday, wedding, corporate, casual hangout, etc.)
2. Determine precise guest count (affects quantities and variety)
3. Understand drinking preferences and any restrictions
4. Establish realistic budget range
5. Learn about event style (formal, casual, themed)
6. Ask about timing and delivery logistics

CONVERSATION RULES:
- Remember ALL previous information shared (maintain perfect context)
- Ask ONE focused question at a time
- Use their name/details they've shared to personalize responses
- Show expertise by suggesting specific products when appropriate
- If they mention specific brands/types, remember and reference them
- When you have 4+ key details, offer to create recommendations

PERSONALITY: ${context?.agentTone === 'professional' ? 'Professional and knowledgeable' : 
               context?.agentTone === 'casual' ? 'Friendly and laid-back' :
               context?.agentTone === 'luxury' ? 'Sophisticated and refined' :
               'Enthusiastic and energetic'} party planning expert.

Based on their message, either:
1. Extract new information and ask the next logical question
2. If you have enough details (occasion + guest count + preferences), suggest creating recommendations
3. Always acknowledge what they've told you and build on it

Keep responses under 2 sentences and maintain the conversation flow naturally.`;

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Enhanced information extraction from user's message
    const updatedConversation = { ...conversation };
    const lowerMessage = message.toLowerCase();
    
    // Extract occasion with more comprehensive matching
    if (!updatedConversation.occasion) {
      const occasions = {
        'birthday': ['birthday', 'bday', 'born', 'turning'],
        'wedding': ['wedding', 'marriage', 'bride', 'groom', 'reception'],
        'corporate': ['corporate', 'work', 'office', 'business', 'company'],
        'graduation': ['graduation', 'graduate', 'diploma', 'degree'],
        'anniversary': ['anniversary', 'years together'],
        'holiday': ['holiday', 'christmas', 'thanksgiving', 'new year', 'nye'],
        'bbq': ['bbq', 'barbecue', 'grill', 'outdoor', 'backyard'],
        'cocktail party': ['cocktail', 'cocktails', 'mixer', 'social'],
        'housewarming': ['housewarming', 'new house', 'new home'],
        'casual hangout': ['hangout', 'chill', 'casual', 'friends over']
      };
      
      for (const [occasion, keywords] of Object.entries(occasions)) {
        if (keywords.some(keyword => lowerMessage.includes(keyword))) {
          updatedConversation.occasion = occasion;
          break;
        }
      }
    }
    
    // Extract guest count with multiple patterns
    if (!updatedConversation.guestCount || updatedConversation.guestCount === 0) {
      const patterns = [
        /(\d+)\s*(people|guests|person|folks|friends)/,
        /about\s*(\d+)/,
        /around\s*(\d+)/,
        /(\d+)\s*of\s*us/,
        /(small|intimate).*(5|6|7|8)/,
        /(big|large).*(20|30|40|50)/
      ];
      
      for (const pattern of patterns) {
        const match = lowerMessage.match(pattern);
        if (match) {
          updatedConversation.guestCount = parseInt(match[1]);
          break;
        }
      }
      
      // Handle descriptive sizes
      if (lowerMessage.includes('small') || lowerMessage.includes('intimate')) {
        updatedConversation.guestCount = updatedConversation.guestCount || 6;
      } else if (lowerMessage.includes('medium') || lowerMessage.includes('moderate')) {
        updatedConversation.guestCount = updatedConversation.guestCount || 15;
      } else if (lowerMessage.includes('large') || lowerMessage.includes('big')) {
        updatedConversation.guestCount = updatedConversation.guestCount || 30;
      }
    }
    
    // Extract budget with more nuanced understanding
    if (!updatedConversation.budget) {
      const budgetPatterns = [
        { pattern: /\$(\d+)/, type: 'exact' },
        { pattern: /(budget|spend|willing to pay).*(low|cheap|minimal)/i, value: 'low' },
        { pattern: /(budget|spend|willing to pay).*(high|expensive|premium)/i, value: 'high' },
        { pattern: /(budget|spend|willing to pay).*(medium|moderate|reasonable)/i, value: 'medium' },
        { pattern: /(tight|limited|small).*(budget|money)/i, value: 'low' },
        { pattern: /(generous|flexible|good).*(budget|money)/i, value: 'high' }
      ];
      
      for (const { pattern, type, value } of budgetPatterns) {
        const match = lowerMessage.match(pattern);
        if (match) {
          updatedConversation.budget = type === 'exact' ? `$${match[1]}` : value;
          break;
        }
      }
    }

    // Extract drink preferences with brand awareness
    const drinkTypes = {
      'beer': ['beer', 'lager', 'ale', 'ipa', 'stout', 'pilsner', 'corona', 'heineken'],
      'wine': ['wine', 'chardonnay', 'cabernet', 'merlot', 'pinot', 'prosecco', 'champagne'],
      'whiskey': ['whiskey', 'bourbon', 'scotch', 'rye', 'jameson', 'jack daniels'],
      'vodka': ['vodka', 'grey goose', 'absolut', 'titos'],
      'rum': ['rum', 'bacardi', 'captain morgan'],
      'gin': ['gin', 'tanqueray', 'hendricks'],
      'tequila': ['tequila', 'patron', 'jose cuervo'],
      'cocktails': ['cocktails', 'mixed drinks', 'martini', 'margarita', 'mojito']
    };
    
    for (const [type, keywords] of Object.entries(drinkTypes)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        if (!updatedConversation.preferences) updatedConversation.preferences = [];
        if (!updatedConversation.preferences.includes(type)) {
          updatedConversation.preferences.push(type);
        }
      }
    }

    // Extract additional context
    if (lowerMessage.includes('indoor') || lowerMessage.includes('inside')) {
      updatedConversation.additionalInfo = (updatedConversation.additionalInfo || '') + ' Indoor event.';
    }
    if (lowerMessage.includes('outdoor') || lowerMessage.includes('outside') || lowerMessage.includes('patio')) {
      updatedConversation.additionalInfo = (updatedConversation.additionalInfo || '') + ' Outdoor event.';
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