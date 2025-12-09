import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Mic, MicOff, Globe, Loader2, Bot, User } from 'lucide-react';
import { generateAIResponse } from '../services/aiService';
import { useLanguage } from '../context/LanguageContext';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'नमस्ते! मैं आपका कृषि मित्र हूं। मुझसे खेती के बारे में कुछ भी पूछें! 🌾', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  
  const { language, setLanguage, languages, t } = useLanguage();
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Update initial greeting based on language
  useEffect(() => {
    const greetings = {
      'en-IN': 'Hello! I am Krishi Mitra. Ask me anything about farming! 🌾',
      'hi-IN': 'नमस्ते! मैं आपका कृषि मित्र हूं। मुझसे खेती के बारे में कुछ भी पूछें! 🌾',
      'gu-IN': 'નમસ્તે! હું તમારો કૃષિ મિત્ર છું. મને ખેતી વિશે કંઈ પણ પૂછો! 🌾',
      'ta-IN': 'வணக்கம்! நான் உங்கள் கிருஷி மித்ரா. விவசாயம் பற்றி எதையும் கேளுங்கள்! 🌾',
      'te-IN': 'నమస్కారం! నేను మీ కృషి మిత్ర. వ్యవసాయం గురించి నన్ను ఏమైనా అడగండి! 🌾',
      'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಮಿತ್ರ. ಕೃಷಿಯ ಬಗ್ಗೆ ಏನೇ ಕೇಳಿ! 🌾',
      'mr-IN': 'नमस्कार! मी तुमचा कृषी मित्र आहे. मला शेतीबद्दल काहीही विचारा! 🌾',
      'bn-IN': 'নমস্কার! আমি আপনার কৃষি মিত্র। আমাকে চাষাবাদ সম্পর্কে যা খুশি জিজ্ঞাসা করুন! 🌾',
      'pa-IN': 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਕ੍ਰਿਸ਼ੀ ਮਿੱਤਰ ਹਾਂ। ਮੈਨੂੰ ਖੇਤੀ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ! 🌾'
    };
    
    setMessages([{ 
      id: 1, 
      type: 'bot', 
      text: greetings[language] || greetings['en-IN'], 
      time: new Date() 
    }]);
  }, [language]);

  // Fetch user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback
          setLocation({ lat: 23.0225, lng: 72.5714 });
          fetchWeather(23.0225, 72.5714);
        }
      );
    }
  }, []);

  // Fetch weather for context
  const fetchWeather = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=1c0ff9c24c32fb28e6644ec4110fd944`
      );
      const data = await res.json();
      setWeather({
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        city: data.name
      });
    } catch (e) {
      console.error('Weather fetch failed:', e);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update speech language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 9) return 'Kharif (Monsoon)';
    if (month >= 10 || month <= 2) return 'Rabi (Winter)';
    return 'Zaid (Summer)';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { id: Date.now(), type: 'user', text: input, time: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Build context for AI
    const langName = languages.find(l => l.code === language)?.name || 'Hindi';
    const context = `You are Krishi Mitra AI (कृषि मित्र), a helpful farming assistant for Indian farmers.

IMPORTANT: Respond in ${langName} language. Be friendly and practical.

CURRENT CONTEXT:
- User's Location: ${weather?.city || 'India'} (Lat: ${location?.lat?.toFixed(2)}, Lng: ${location?.lng?.toFixed(2)})
- Current Weather: ${weather?.temp}°C, ${weather?.condition}, ${weather?.humidity}% humidity
- Current Season: ${getCurrentSeason()}
- Current Date: ${new Date().toLocaleDateString('en-IN')}

USER'S QUESTION: ${input}

Provide helpful, practical advice. If they ask about crops, consider their location and season. Keep responses concise (2-3 paragraphs max).`;

    try {
      const response = await generateAIResponse(context, language);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response || 'माफ़ कीजिए, मुझे जवाब देने में समस्या हो रही है। कृपया दोबारा पूछें।',
        time: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: 'कनेक्शन में समस्या है। कृपया बाद में प्रयास करें।',
        time: new Date()
      }]);
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Panel */}
      <div className={`chatbot-panel ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <Bot size={24} />
            <div>
              <h3>{t('chatbot_title')}</h3>
              <span className="chatbot-status">
                {weather ? `${weather.city} • ${weather.temp}°C` : 'Online'}
              </span>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <select 
              className="chatbot-lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.native}</option>
              ))}
            </select>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`chatbot-message ${msg.type}`}>
              <div className="message-avatar">
                {msg.type === 'bot' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="message-content">
                <p>{msg.text}</p>
                <span className="message-time">{formatTime(msg.time)}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chatbot-message bot">
              <div className="message-avatar"><Bot size={18} /></div>
              <div className="message-content typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-area">
          <button 
            className={`chatbot-voice-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            title={`Voice input (${languages.find(l => l.code === language)?.native})`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat_placeholder')}
            disabled={isLoading}
          />
          <button 
            className="chatbot-send-btn"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>

      {/* FAB Button */}
      <button 
        className={`chatbot-fab ${isOpen ? 'hidden' : ''}`} 
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Chat"
      >
        <MessageSquare size={24} />
      </button>
    </>
  );
};

export default ChatBot;
