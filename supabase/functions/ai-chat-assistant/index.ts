import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
    const { message, conversation, questionCount, context, adminMode = false } = await req.json();
    
    // Initialize Supabase client for product data access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check for admin mode activation
    const isAdminActivation = message.toLowerCase().includes('schwing');
    const isAdminMode = adminMode || isAdminActivation;
    
    // If schwing is detected, switch to admin mode
    if (isAdminActivation && !adminMode) {
      return new Response(JSON.stringify({
        response: "🔓 Admin mode activated! You can now ask me about:\n• Product knowledge and training data\n• What I know about specific categories\n• How to improve my responses\n• Training data gaps\n\nWhat would you like to know about my training?",
        updatedConversation: conversation,
        adminMode: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enhanced system prompt with comprehensive product knowledge and business context
    const systemPrompt = isAdminMode ? 
      `You are in ADMIN MODE for Party On Delivery's AI assistant. Your role is to help the admin understand and improve your training data and knowledge base.

ADMIN CAPABILITIES:
- Explain your knowledge about products, categories, and training data
- Identify gaps in your knowledge that could be improved
- Suggest training improvements based on questions
- Be transparent about what you know and don't know
- Help optimize the conversation flow and product recommendations

CURRENT TRAINING DATA SUMMARY:
- Product Categories: Craft Beer (1000+ local/national), Wine (500+ bottles), Premium Spirits (800+ bottles), Mixers & Garnishes, Party Supplies, Non-Alcoholic
- Austin Local Focus: Lazarus Brewing, Austin Beerworks, ABGB, local distilleries  
- Event Types: Birthday, wedding, corporate, graduation, holiday, BBQ, cocktail parties, housewarming
- Guest Count Handling: 1-500+ people with scalable recommendations
- Budget Ranges: Low ($50-150), Medium ($150-400), High ($400-1000+)
- Conversation Flow: Occasion → Guest Count → Preferences → Budget → Recommendations

REAL PRODUCT DATA ACCESS:
- I have access to live Shopify product data including names, prices, descriptions, categories
- I can recommend specific brands and products from our actual inventory
- Product data includes: ${await getProductDataSummary(supabase)}

Answer admin questions about training data, knowledge gaps, and improvement suggestions.` :
      `You are an expert AI party planning assistant for Party On Delivery, Austin's premier alcohol delivery service. You specialize in curating the perfect drink selection for any occasion.

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

LIVE PRODUCT KNOWLEDGE:
${await getProductSamples(supabase)}

GATHERING STRATEGY (BE EFFICIENT):
1. If they mention MULTIPLE pieces of info in one message, extract ALL of it
2. Don't ask for info you already have - acknowledge what they've told you
3. Prioritize: Occasion → Guest Count → Preferences → Budget
4. Once you have 3 of these 4 pieces, suggest creating recommendations immediately
5. Don't repeat questions - if they've answered, move on
6. Be conversational and natural - avoid robotic repetition

CONVERSATION RULES:
${isAdminMode ? 
  `- Answer questions about training data and knowledge base
  - Explain what you know about specific product categories
  - Suggest improvements to conversation flow or product knowledge
  - Be detailed and technical when explaining your capabilities
  - Help identify knowledge gaps and training opportunities` :
  `- NEVER repeat questions you've already asked or information you already have
  - Extract ALL information from each user message (don't miss details)
  - Acknowledge what they've shared: "Got it! A birthday party for 20 people..."
  - Ask for ONE missing piece of info at a time
  - When you have 3/4 key details (occasion, guests, preferences, budget), say "I have enough info to create recommendations!"
  - Be natural and conversational, not robotic
  - Don't use repetitive phrases like "sounds great" every time`}

PERSONALITY: ${isAdminMode ? 'Detailed technical assistant focused on training analysis' :
               context?.agentTone === 'professional' ? 'Professional and knowledgeable' : 
               context?.agentTone === 'casual' ? 'Friendly and laid-back' :
               context?.agentTone === 'luxury' ? 'Sophisticated and refined' :
               'Enthusiastic and energetic'} ${isAdminMode ? 'system analyst' : 'party planning expert'}.

${isAdminMode ? 
  'Provide detailed analysis about training data, knowledge gaps, and suggestions for improvement.' :
  `Based on their message, either:
  1. Extract new information and ask the next logical question
  2. If you have enough details (occasion + guest count + preferences), suggest creating recommendations
  3. Always acknowledge what they've told you and build on it
  
  Respond naturally with 2-4 complete sentences. Be helpful and engaging while gathering the information needed.`}`;

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
        temperature: 0.7,
        max_tokens: 800
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
      updatedConversation: isAdminMode ? conversation : updatedConversation,
      adminMode: isAdminMode
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

// Helper function to get product data summary for admin mode
async function getProductDataSummary(supabase: any): Promise<string> {
  try {
    const { data: products, error } = await supabase
      .from('shopify_products_cache')
      .select('title, data')
      .limit(10);
    
    if (error || !products) return 'Unable to access product data';
    
    return `${products.length} sample products loaded, including: ${products.map((p: any) => p.title).slice(0, 3).join(', ')}...`;
  } catch (error) {
    return 'Product data access error';
  }
}

// Helper function to get product samples for conversation context
async function getProductSamples(supabase: any): Promise<string> {
  try {
    const { data: products, error } = await supabase
      .from('shopify_products_cache')
      .select('title, data')
      .limit(20);
    
    if (error || !products) return 'No products available';
    
    const beerProducts = products.filter((p: any) => 
      p.title.toLowerCase().includes('beer') || 
      p.title.toLowerCase().includes('ipa') ||
      p.title.toLowerCase().includes('lager')
    );
    
    const wineProducts = products.filter((p: any) => 
      p.title.toLowerCase().includes('wine') || 
      p.title.toLowerCase().includes('chardonnay') ||
      p.title.toLowerCase().includes('cabernet')
    );
    
    const spiritProducts = products.filter((p: any) => 
      p.title.toLowerCase().includes('whiskey') || 
      p.title.toLowerCase().includes('vodka') ||
      p.title.toLowerCase().includes('tequila') ||
      p.title.toLowerCase().includes('gin')
    );
    
    let productSummary = '';
    if (beerProducts.length > 0) {
      productSummary += `\n- BEER: ${beerProducts.slice(0, 3).map((p: any) => p.title).join(', ')}`;
    }
    if (wineProducts.length > 0) {
      productSummary += `\n- WINE: ${wineProducts.slice(0, 3).map((p: any) => p.title).join(', ')}`;
    }
    if (spiritProducts.length > 0) {
      productSummary += `\n- SPIRITS: ${spiritProducts.slice(0, 3).map((p: any) => p.title).join(', ')}`;
    }
    
    return productSummary || 'Loading product data...';
  } catch (error) {
    return 'Product data unavailable';
  }
}