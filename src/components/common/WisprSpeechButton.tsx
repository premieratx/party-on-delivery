import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WisprSpeechButtonProps {
  onTranscription: (text: string) => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
}

export const WisprSpeechButton: React.FC<WisprSpeechButtonProps> = ({
  onTranscription,
  onStartListening,
  onStopListening,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      onStartListening?.();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscription(finalTranscript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      onStopListening?.();
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      toast({
        title: "Speech recognition error",
        description: event.error,
        variant: "destructive",
      });
    };

    recognition.start();
    setRecognition(recognition);
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsListening(false);
  };

  return (
    <Button
      onClick={isListening ? stopListening : startListening}
      variant={isListening ? "destructive" : "default"}
      size="sm"
      className="gap-2"
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      {isListening ? "Stop" : "Speak"}
    </Button>
  );
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}