import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  Info, 
  Radio, 
  Globe 
} from 'lucide-react';

export const VoiceButton = ({ 
  onTranscript, 
  disabled = false, 
  resetKey = null,
  onListeningChange = null 
}) => {
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-IN'); // en-IN default as required

  const recognitionRef = useRef(null);
  const shouldBeListeningRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const onListeningChangeRef = useRef(onListeningChange);
  const processedIndicesRef = useRef(new Set());

  // Keep callback refs updated without re-triggering effects
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onListeningChangeRef.current = onListeningChange;
  }, [onListeningChange]);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setInterimTranscript('');
    if (onListeningChangeRef.current) {
      onListeningChangeRef.current(false);
    }
  }, []);

  // Stop listening when resetKey changes (e.g. question advances)
  useEffect(() => {
    if (resetKey !== null && shouldBeListeningRef.current) {
      stopListening();
    }
  }, [resetKey, stopListening]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      shouldBeListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const startListening = async () => {
    setErrorMessage('');
    setNoticeMessage('');
    setInterimTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a Web Speech API compatible browser.');
      return;
    }

    // 1. Explicitly request & verify microphone permission using MediaDevices API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release stream tracks immediately so SpeechRecognition can bind cleanly
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Microphone permission check failed:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage('Microphone access denied. Please click the lock or camera icon in your browser address bar and set Microphone to "Allow".');
          return;
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage('No microphone detected on your system. Please plug in or enable an audio input device.');
          return;
        } else {
          setErrorMessage('Unable to access microphone: ' + (err.message || 'Please check audio device settings.'));
          return;
        }
      }
    }

    // 2. Clear any lingering recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang || 'en-IN';
      recognition.maxAlternatives = 1;

      processedIndicesRef.current.clear();
      shouldBeListeningRef.current = true;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage('');
        setNoticeMessage('');
        if (onListeningChangeRef.current) {
          onListeningChangeRef.current(true);
        }
      };

      recognition.onresult = (event) => {
        let newFinalChunks = [];
        let liveInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            // Guarantee each result index is processed exactly once to prevent duplicate words
            if (!processedIndicesRef.current.has(i)) {
              processedIndicesRef.current.add(i);
              const text = res[0].transcript.trim();
              if (text) {
                newFinalChunks.push(text);
              }
            }
          } else {
            liveInterim += res[0].transcript;
          }
        }

        setInterimTranscript(liveInterim);

        if (newFinalChunks.length > 0) {
          const combinedChunk = newFinalChunks.join(' ');
          if (onTranscriptRef.current) {
            onTranscriptRef.current(combinedChunk);
          }
          setNoticeMessage('');
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error event:', event.error);
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            setErrorMessage('Microphone access denied. Please click the permissions icon in your browser address bar and set Microphone to "Allow".');
            shouldBeListeningRef.current = false;
            setIsListening(false);
            if (onListeningChangeRef.current) onListeningChangeRef.current(false);
            break;
          case 'audio-capture':
            setErrorMessage('No microphone was found or audio capture is blocked by your operating system.');
            shouldBeListeningRef.current = false;
            setIsListening(false);
            if (onListeningChangeRef.current) onListeningChangeRef.current(false);
            break;
          case 'network':
            setErrorMessage('Speech recognition network error. Please verify your internet connection.');
            shouldBeListeningRef.current = false;
            setIsListening(false);
            if (onListeningChangeRef.current) onListeningChangeRef.current(false);
            break;
          case 'no-speech':
            setNoticeMessage('No speech detected. Please speak clearly into your microphone.');
            break;
          case 'aborted':
            // Normal event when stopping
            break;
          default:
            setErrorMessage(`Speech recognition error: ${event.error}`);
            break;
        }
      };

      recognition.onend = () => {
        setInterimTranscript('');
        // If the user did not click stop, smoothly restart to support continuous multiple-sentence answers
        if (shouldBeListeningRef.current) {
          try {
            processedIndicesRef.current.clear();
            recognition.start();
          } catch {
            setTimeout(() => {
              if (shouldBeListeningRef.current) {
                try {
                  processedIndicesRef.current.clear();
                  recognition.start();
                } catch {}
              }
            }, 300);
          }
        } else {
          setIsListening(false);
          if (onListeningChangeRef.current) {
            onListeningChangeRef.current(false);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition instance:', err);
      setErrorMessage('Failed to start speech recognition: ' + (err.message || 'Please check microphone permissions.'));
      shouldBeListeningRef.current = false;
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setSelectedLang(newLang);
    // If currently listening, restart with new language
    if (isListening) {
      stopListening();
      setTimeout(() => {
        startListening();
      }, 200);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>Speech recognition is unsupported in this browser. Please use Chrome or Edge for voice input.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Main Microphone Button */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          title={isListening ? "Click to stop voice recording" : "Click to speak your answer with microphone"}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            isListening
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shadow-lg shadow-rose-500/20'
              : 'bg-[#151922] hover:bg-[#1c222e] text-gray-200 hover:text-white border border-white/10 hover:border-[#1684FF]/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            <>
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative" />
              </div>
              <MicOff className="w-4 h-4 text-rose-400" />
              <span>Stop Microphone</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-[#1684FF]" />
              <span>Voice Answer</span>
            </>
          )}
        </button>

        {/* Language Selection Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#151922] border border-white/10 text-xs text-gray-300">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <select
            value={selectedLang}
            onChange={handleLanguageChange}
            disabled={disabled}
            className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer"
            title="Speech recognition accent/language"
          >
            <option value="en-IN" className="bg-[#101318] text-white">English (India - en-IN)</option>
            <option value="en-US" className="bg-[#101318] text-white">English (US - en-US)</option>
            <option value="en-GB" className="bg-[#101318] text-white">English (UK - en-GB)</option>
          </select>
        </div>

        {/* Active Listening Indicator */}
        {isListening && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300 animate-fadeIn">
            <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            <span>Listening to speech...</span>
          </div>
        )}
      </div>

      {/* Live Interim Speech Preview */}
      {isListening && interimTranscript && (
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2 animate-fadeIn">
          <Radio className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <span className="italic leading-relaxed">
            Hearing: "{interimTranscript}"
          </span>
        </div>
      )}

      {/* Notice Message (e.g. no-speech) */}
      {noticeMessage && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 animate-fadeIn">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export const AISpeechButton = ({ textToRead, onStateChange }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeak = () => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      if (onStateChange) onStateChange('IDLE');
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (onStateChange) onStateChange('SPEAKING');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (onStateChange) onStateChange('IDLE');
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        if (onStateChange) onStateChange('IDLE');
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleSpeak}
      title={isSpeaking ? 'Stop speaking' : 'Read question aloud'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
        isSpeaking
          ? 'bg-[#1684FF]/20 text-[#1684FF] border border-[#1684FF]/30'
          : 'bg-[#151922] hover:bg-white/10 text-gray-300 border border-white/10'
      }`}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-[#1684FF]" />
          <span>Stop AI Voice</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Read Question</span>
        </>
      )}
    </button>
  );
};
