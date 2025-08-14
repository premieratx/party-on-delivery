import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BranchingLogic {
  id: string;
  condition: string;
  nextQuestionId?: string;
  response?: string;
}

interface Question {
  id: string;
  text: string;
  type: 'open' | 'choice' | 'yes_no';
  choices?: string[];
  branching: BranchingLogic[];
  clientTypes?: string[];
}

interface AssistantConfig {
  voice: string;
  systemPrompt: string;
  questions: Question[];
  clientType: string;
}

const defaultQuestions: Question[] = [
  {
    id: 'welcome',
    text: 'Welcome! I\'m your party planning assistant. What type of event are you planning?',
    type: 'choice',
    choices: ['Birthday Party', 'Wedding', 'Corporate Event', 'Lake Day', 'BnB Stocking', 'Other'],
    branching: [
      { id: 'b1', condition: 'Birthday Party', nextQuestionId: 'birthday_details' },
      { id: 'b2', condition: 'Wedding', nextQuestionId: 'wedding_details' },
      { id: 'b3', condition: 'Corporate Event', nextQuestionId: 'corporate_details' },
      { id: 'b4', condition: 'Lake Day', nextQuestionId: 'lake_details' },
      { id: 'b5', condition: 'BnB Stocking', nextQuestionId: 'bnb_details' },
      { id: 'b6', condition: 'Other', nextQuestionId: 'other_details' }
    ],
    clientTypes: ['all']
  },
  {
    id: 'birthday_details',
    text: 'Great choice! How many guests will be attending your birthday party?',
    type: 'open',
    branching: [
      { id: 'b7', condition: 'any', nextQuestionId: 'birthday_preferences' }
    ],
    clientTypes: ['all']
  },
  {
    id: 'birthday_preferences',
    text: 'What\'s the birthday person\'s favorite type of drinks?',
    type: 'choice',
    choices: ['Beer & Wine', 'Cocktails', 'Non-Alcoholic', 'Everything!'],
    branching: [
      { id: 'b8', condition: 'any', response: 'Perfect! Let me help you build the perfect birthday package.' }
    ],
    clientTypes: ['all']
  }
];

const iconicVoices = [
  { id: 'morgan_freeman', name: 'Morgan Freeman', description: 'Deep, authoritative narrator voice' },
  { id: 'david_attenborough', name: 'David Attenborough', description: 'Gentle British naturalist' },
  { id: 'samuel_jackson', name: 'Samuel L. Jackson', description: 'Intense, commanding presence' },
  { id: 'batman_bale', name: 'Batman (Christian Bale)', description: 'Dark, gravelly superhero voice' },
  { id: 'yoda', name: 'Yoda', description: 'Wise Jedi Master' },
  { id: 'darth_vader', name: 'Darth Vader', description: 'Iconic dark side villain' },
  { id: 'elvis', name: 'Elvis Presley', description: 'The King of Rock and Roll' },
  { id: 'marilyn_monroe', name: 'Marilyn Monroe', description: 'Sultry Hollywood icon' },
  { id: 'churchill', name: 'Winston Churchill', description: 'Powerful British statesman' },
  { id: 'einstein', name: 'Albert Einstein', description: 'Genius physicist accent' },
  { id: 'shakespeare', name: 'Shakespearean Actor', description: 'Classic theatrical British' },
  { id: 'cowboy_eastwood', name: 'Clint Eastwood Cowboy', description: 'Gritty Western hero' },
  { id: 'godfather', name: 'Don Corleone', description: 'Iconic mafia patriarch' },
  { id: 'terminator', name: 'Terminator', description: 'Robotic Austrian accent' },
  { id: 'pirate_depp', name: 'Captain Jack Sparrow', description: 'Quirky pirate charm' },
  { id: 'british_butler', name: 'British Butler', description: 'Refined English servant' },
  { id: 'southern_belle', name: 'Southern Belle', description: 'Sweet Southern charm' },
  { id: 'valley_girl', name: 'Valley Girl', description: 'Trendy California accent' },
  { id: 'new_york', name: 'New Yorker', description: 'Fast-talking Big Apple energy' },
  { id: 'surfer_dude', name: 'Surfer Dude', description: 'Laid-back California cool' }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data } = await req.json();

    switch (action) {
      case 'get_voices':
        return new Response(JSON.stringify({ voices: iconicVoices }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'save_config':
        const { data: configData, error: configError } = await supabase
          .from('ai_assistant_configs')
          .upsert({
            id: data.id || crypto.randomUUID(),
            name: data.name,
            voice: data.voice,
            system_prompt: data.systemPrompt,
            questions: data.questions,
            client_type: data.clientType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (configError) throw configError;

        return new Response(JSON.stringify({ success: true, config: configData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_configs':
        const { data: configs, error: getError } = await supabase
          .from('ai_assistant_configs')
          .select('*')
          .order('created_at', { ascending: false });

        if (getError) throw getError;

        return new Response(JSON.stringify({ configs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_default_questions':
        return new Response(JSON.stringify({ questions: defaultQuestions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'test_conversation':
        const { message, configId, conversationHistory } = data;
        
        // Get configuration
        const { data: config, error: configFetchError } = await supabase
          .from('ai_assistant_configs')
          .select('*')
          .eq('id', configId)
          .single();

        if (configFetchError) throw configFetchError;

        // Process message with OpenAI
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `${config.system_prompt}

You are a party planning assistant with this personality: ${config.voice}.
Available questions and branching logic: ${JSON.stringify(config.questions)}

Use the branching logic to guide the conversation. When a user answers a question, follow the appropriate branch.
Be conversational and helpful while staying in character for the voice: ${config.voice}.`
              },
              ...conversationHistory,
              { role: 'user', content: message }
            ],
            temperature: 0.8,
          }),
        });

        if (!openAIResponse.ok) {
          throw new Error(`OpenAI API error: ${await openAIResponse.text()}`);
        }

        const aiResponse = await openAIResponse.json();
        const assistantMessage = aiResponse.choices[0].message.content;

        // Generate voice audio
        const voiceResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1-hd',
            input: assistantMessage,
            voice: 'alloy', // We'll use OpenAI's voices for now due to copyright concerns
            response_format: 'mp3',
          }),
        });

        if (!voiceResponse.ok) {
          throw new Error(`Voice API error: ${await voiceResponse.text()}`);
        }

        const audioBuffer = await voiceResponse.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

        return new Response(JSON.stringify({
          message: assistantMessage,
          audio: base64Audio,
          voice: config.voice
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in ai-voice-assistant:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});