import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, BrainCircuit, Mic, MicOff, Volume2, Loader2, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { sendChatMessage, generateSpeechFromText } from '../services/geminiService';

interface ChatBotProps {
  contextData: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

// Helpers for Audio Decoding (Raw PCM)
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const ChatBot: React.FC<ChatBotProps> = ({ contextData, messages, setMessages }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Audio Playback State
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const recognitionRef = useRef<any>(null);
  const originalInputRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    try {
      // Convert internal message format to Gemini API format
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await sendChatMessage(history, userMsg, contextData);
      
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error while thinking. Please try again." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true; // Enable real-time typing effect
      recognition.lang = 'en-US';

      // Capture the current input before starting speech recognition
      originalInputRef.current = input;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        
        // Append transcript to the original input
        const prefix = originalInputRef.current;
        const separator = prefix && !prefix.endsWith(' ') ? ' ' : '';
        setInput(`${prefix}${separator}${transcript}`);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handlePlayAudio = async (text: string, index: number) => {
    // If currently playing this message, stop it
    if (playingMessageIndex === index) {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }
      setPlayingMessageIndex(null);
      return;
    }

    // If playing another message, stop it first
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
      setPlayingMessageIndex(null);
    }

    setLoadingAudioIndex(index);

    try {
      // Generate speech
      const base64Audio = await generateSpeechFromText(text);

      // Initialize Audio Context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      // Resume context if suspended (browser policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Decode audio
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);

      // Play audio
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setPlayingMessageIndex(null);
        currentSourceRef.current = null;
      };

      currentSourceRef.current = source;
      source.start();
      setPlayingMessageIndex(index);

    } catch (err) {
      console.error("Failed to play audio", err);
      alert("Could not generate audio for this message.");
    } finally {
      setLoadingAudioIndex(null);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[85vw] sm:w-[350px] md:w-[450px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-300" />
              <h3 className="font-semibold">Career Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-700 p-1 rounded transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm relative group ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  <div className="markdown-body text-inherit">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {/* Text-to-Speech Button for Model Messages */}
                  {msg.role === 'model' && (
                    <div className="absolute -right-8 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => handlePlayAudio(msg.content, idx)}
                        className="p-1.5 rounded-full bg-gray-200 hover:bg-indigo-100 text-gray-600 hover:text-indigo-600 transition-colors shadow-sm"
                        title="Read aloud"
                      >
                        {loadingAudioIndex === idx ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : playingMessageIndex === idx ? (
                          <StopCircle size={14} className="text-red-500" />
                        ) : (
                          <Volume2 size={14} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-indigo-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-indigo-600 text-sm">
                  <BrainCircuit size={16} className="animate-pulse" />
                  <span className="animate-pulse">Thinking deeply...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the JD or Interview Guide..."
                className="w-full pr-24 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm outline-none transition-all text-gray-900 placeholder-gray-500"
                rows={2}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  onClick={toggleListening}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 animate-pulse' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
              <BrainCircuit size={12} />
              Powered by Gemini 3.0 Pro
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-gray-700 rotate-90 scale-90' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-110'}`}
      >
        {isOpen ? <X className="text-white" /> : <MessageSquare className="text-white" />}
      </button>
    </div>
  );
};