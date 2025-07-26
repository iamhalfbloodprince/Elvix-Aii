import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MicrophoneIcon, StopIcon, PlayIcon, AdjustmentsHorizontalIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { vscBackground, vscForeground, vscBorder } from '../vscIndexScript';

interface VoiceCommand {
  id: string;
  transcript: string;
  confidence: number;
  intent: string;
  parameters: Record<string, any>;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  timestamp: Date;
}

interface VoiceSettings {
  language: string;
  sensitivity: number;
  autoExecute: boolean;
  voiceFeedback: boolean;
  continuousListening: boolean;
  wakeWord: string;
  preferredVoice: string;
}

interface SpeechIntent {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  action: string;
  parameters: Record<string, any>;
}

export default function VoiceInterface() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({
    language: 'en-US',
    sensitivity: 0.7,
    autoExecute: false,
    voiceFeedback: true,
    continuousListening: false,
    wakeWord: 'hey elvix',
    preferredVoice: 'natural'
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [supportedCommands, setSupportedCommands] = useState<string[]>([]);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Voice command patterns
  const commandPatterns = {
    // Code generation
    create: {
      patterns: [
        /create (?:a )?(.+?) (?:component|function|class|file)/i,
        /generate (?:a )?(.+?) (?:for|that|to) (.+)/i,
        /build (?:a )?(.+?) (?:component|module|service)/i
      ],
      intent: 'generate_code',
      examples: [
        "Create a React component for user authentication",
        "Generate a function to validate email addresses",
        "Build a REST API service for user management"
      ]
    },
    modify: {
      patterns: [
        /(?:refactor|optimize|improve) (?:the )?(.+)/i,
        /add (.+?) to (?:the )?(.+)/i,
        /remove (.+?) from (?:the )?(.+)/i,
        /update (?:the )?(.+?) (?:to|with) (.+)/i
      ],
      intent: 'modify_code',
      examples: [
        "Refactor the authentication logic",
        "Add error handling to the API calls",
        "Remove unused imports from the component"
      ]
    },
    debug: {
      patterns: [
        /(?:debug|fix|troubleshoot) (?:the )?(.+)/i,
        /find (?:the )?(?:bug|error|issue) in (.+)/i,
        /what's wrong with (.+)/i
      ],
      intent: 'debug_code',
      examples: [
        "Debug the login functionality",
        "Find the error in the payment processing",
        "What's wrong with the API response handling"
      ]
    },
    test: {
      patterns: [
        /(?:write|create|generate) tests for (.+)/i,
        /test (?:the )?(.+)/i,
        /add test coverage to (.+)/i
      ],
      intent: 'generate_tests',
      examples: [
        "Write tests for the user service",
        "Create unit tests for the authentication module",
        "Add test coverage to the payment system"
      ]
    },
    explain: {
      patterns: [
        /(?:explain|describe|what (?:does|is)) (?:this )?(.+)/i,
        /how (?:does|do) (?:this )?(.+?) work/i,
        /walk me through (?:the )?(.+)/i
      ],
      intent: 'explain_code',
      examples: [
        "Explain this authentication flow",
        "How does this component work",
        "Walk me through the API integration"
      ]
    },
    navigate: {
      patterns: [
        /(?:go to|open|show) (?:the )?(.+)/i,
        /find (?:the )?(.+?) (?:file|function|component)/i,
        /search for (.+)/i
      ],
      intent: 'navigate',
      examples: [
        "Go to the user service file",
        "Open the authentication component",
        "Find the payment processing function"
      ]
    }
  };

  useEffect(() => {
    initializeSpeechRecognition();
    initializeAudioContext();
    loadSupportedCommands();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = settings.language;
      
      recognition.onstart = () => {
        setIsListening(true);
        console.log('Voice recognition started');
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setCurrentTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          processVoiceCommand(finalTranscript, event.results[event.resultIndex][0].confidence);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (settings.continuousListening) {
          setTimeout(() => startListening(), 500);
        }
      };
    }
  };

  const initializeAudioContext = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  const loadSupportedCommands = () => {
    const commands: string[] = [];
    Object.values(commandPatterns).forEach(pattern => {
      commands.push(...pattern.examples);
    });
    setSupportedCommands(commands);
  };

  const startListening = async () => {
    if (!recognitionRef.current) return;
    
    try {
      // Request microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect audio stream to analyzer for voice level detection
      if (audioContextRef.current && analyzerRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
        source.connect(analyzerRef.current);
        startVoiceLevelDetection();
      }
      
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start listening:', error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsListening(false);
    setVoiceLevel(0);
  };

  const startVoiceLevelDetection = () => {
    if (!analyzerRef.current) return;
    
    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const detectLevel = () => {
      analyzerRef.current!.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      
      const average = sum / bufferLength;
      setVoiceLevel(average / 255);
      
      animationFrameRef.current = requestAnimationFrame(detectLevel);
    };
    
    detectLevel();
  };

  const processVoiceCommand = async (transcript: string, confidence: number) => {
    setIsProcessing(true);
    
    const command: VoiceCommand = {
      id: Date.now().toString(),
      transcript,
      confidence,
      intent: '',
      parameters: {},
      status: 'processing',
      timestamp: new Date()
    };
    
    setCommands(prev => [command, ...prev.slice(0, 9)]); // Keep last 10 commands
    
    try {
      // Analyze intent
      const intent = await analyzeIntent(transcript);
      command.intent = intent.intent;
      command.parameters = intent.parameters;
      
      // Execute command if confidence is high enough
      if (confidence >= settings.sensitivity) {
        if (settings.autoExecute || await confirmExecution(command)) {
          const result = await executeCommand(command);
          command.result = result;
          command.status = 'completed';
          
          if (settings.voiceFeedback) {
            await provideFeedback(command);
          }
        }
      } else {
        command.status = 'failed';
        command.result = { error: 'Low confidence, command not executed' };
      }
    } catch (error) {
      command.status = 'failed';
      command.result = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    setCommands(prev => prev.map(cmd => cmd.id === command.id ? command : cmd));
    setIsProcessing(false);
    setCurrentTranscript('');
  };

  const analyzeIntent = async (transcript: string): Promise<SpeechIntent> => {
    // Check wake word if continuous listening is enabled
    if (settings.continuousListening && !transcript.toLowerCase().includes(settings.wakeWord.toLowerCase())) {
      return {
        intent: 'ignored',
        confidence: 0,
        entities: {},
        action: 'none',
        parameters: {}
      };
    }
    
    // Match against command patterns
    for (const [category, pattern] of Object.entries(commandPatterns)) {
      for (const regex of pattern.patterns) {
        const match = transcript.match(regex);
        if (match) {
          return {
            intent: pattern.intent,
            confidence: 0.9,
            entities: { matches: match.slice(1) },
            action: category,
            parameters: { target: match[1], modifier: match[2] }
          };
        }
      }
    }
    
    // Fallback to general intent
    return {
      intent: 'general_coding',
      confidence: 0.5,
      entities: {},
      action: 'process',
      parameters: { description: transcript }
    };
  };

  const confirmExecution = async (command: VoiceCommand): Promise<boolean> => {
    // For now, return true. In a real implementation, this would show a confirmation dialog
    return true;
  };

  const executeCommand = async (command: VoiceCommand): Promise<any> => {
    // This would interface with the AgenticWorkflow system
    console.log('Executing command:', command);
    
    switch (command.intent) {
      case 'generate_code':
        return await generateCode(command.parameters);
      case 'modify_code':
        return await modifyCode(command.parameters);
      case 'debug_code':
        return await debugCode(command.parameters);
      case 'generate_tests':
        return await generateTests(command.parameters);
      case 'explain_code':
        return await explainCode(command.parameters);
      case 'navigate':
        return await navigateToCode(command.parameters);
      default:
        return { message: 'Command processed', action: command.intent };
    }
  };

  const provideFeedback = async (command: VoiceCommand) => {
    const feedbackText = generateFeedbackText(command);
    await speakText(feedbackText);
  };

  const generateFeedbackText = (command: VoiceCommand): string => {
    if (command.status === 'completed') {
      switch (command.intent) {
        case 'generate_code':
          return `Code generated successfully for ${command.parameters.target}`;
        case 'modify_code':
          return `Successfully modified ${command.parameters.target}`;
        case 'debug_code':
          return `Debugging completed for ${command.parameters.target}`;
        case 'generate_tests':
          return `Tests generated for ${command.parameters.target}`;
        case 'explain_code':
          return `Explanation provided for ${command.parameters.target}`;
        case 'navigate':
          return `Navigated to ${command.parameters.target}`;
        default:
          return 'Command completed successfully';
      }
    } else {
      return `Sorry, I couldn't complete that command. ${command.result?.error || ''}`;
    }
  };

  const speakText = async (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = speechSynthesis.getVoices().find(voice => 
        voice.name.includes(settings.preferredVoice) || voice.default
      ) || null;
      speechSynthesis.speak(utterance);
    }
  };

  // Mock implementations for demo purposes
  const generateCode = async (params: any) => ({ generated: true, files: 1 });
  const modifyCode = async (params: any) => ({ modified: true, changes: 3 });
  const debugCode = async (params: any) => ({ debugged: true, issues: 2, fixed: 2 });
  const generateTests = async (params: any) => ({ tests: 5, coverage: 85 });
  const explainCode = async (params: any) => ({ explanation: "Code explanation provided" });
  const navigateToCode = async (params: any) => ({ navigated: true, location: params.target });

  const cleanup = () => {
    stopListening();
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: vscBackground, color: vscForeground }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: vscBorder }}>
        <h2 className="text-lg font-semibold">ELVIX Voice Coding</h2>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2 rounded hover:bg-gray-700"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Voice Controls */}
      <div className="flex flex-col items-center p-6 space-y-4">
        {/* Main Voice Button */}
        <div className="relative">
          <button
            onClick={toggleListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 shadow-lg animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
            disabled={isProcessing}
          >
            {isListening ? (
              <StopIcon className="w-8 h-8 text-white" />
            ) : (
              <MicrophoneIcon className="w-8 h-8 text-white" />
            )}
          </button>
          
          {/* Voice Level Indicator */}
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping"
                 style={{ opacity: voiceLevel }}></div>
          )}
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="text-sm text-gray-400">
            {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Click to start voice coding'}
          </p>
          {currentTranscript && (
            <p className="mt-2 text-blue-400 italic">"{currentTranscript}"</p>
          )}
        </div>

        {/* Voice Level Visualizer */}
        {isListening && (
          <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${voiceLevel * 100}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Command History */}
      <div className="flex-1 p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Commands</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {commands.map((command) => (
            <div
              key={command.id}
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: command.status === 'completed' ? '#1a4c1a' : 
                               command.status === 'failed' ? '#4c1a1a' : '#1a3a4c',
                borderColor: vscBorder
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{command.intent.replace(/_/g, ' ')}</span>
                <span className="text-xs text-gray-400">
                  {command.confidence.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-1">"{command.transcript}"</p>
              {command.result && (
                <p className="text-xs text-gray-400">
                  {JSON.stringify(command.result, null, 2)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-4 border-t" style={{ borderColor: vscBorder }}>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Quick Commands</h3>
        <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
          <div>"Create a React component for user login"</div>
          <div>"Debug the authentication service"</div>
          <div>"Add error handling to the API calls"</div>
          <div>"Generate tests for the payment module"</div>
        </div>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Voice Settings</h3>
            
            {/* Language */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>
            </div>

            {/* Sensitivity */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Sensitivity: {settings.sensitivity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={settings.sensitivity}
                onChange={(e) => setSettings(prev => ({ ...prev, sensitivity: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* Auto Execute */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoExecute}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoExecute: e.target.checked }))}
                  className="mr-2"
                />
                Auto-execute high confidence commands
              </label>
            </div>

            {/* Voice Feedback */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.voiceFeedback}
                  onChange={(e) => setSettings(prev => ({ ...prev, voiceFeedback: e.target.checked }))}
                  className="mr-2"
                />
                Voice feedback
              </label>
            </div>

            {/* Continuous Listening */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.continuousListening}
                  onChange={(e) => setSettings(prev => ({ ...prev, continuousListening: e.target.checked }))}
                  className="mr-2"
                />
                Continuous listening
              </label>
            </div>

            {/* Wake Word */}
            {settings.continuousListening && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Wake Word</label>
                <input
                  type="text"
                  value={settings.wakeWord}
                  onChange={(e) => setSettings(prev => ({ ...prev, wakeWord: e.target.value }))}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  placeholder="hey elvix"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}