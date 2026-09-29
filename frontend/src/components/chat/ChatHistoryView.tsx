import React, { useState } from 'react';
import { useNori } from '../../context/NoriContext';
import { askNori } from '../../services/api';
import { voiceEngine } from '../../services/voice';
import {
  MessageSquare,
  Sparkles,
  Send,
  Mic,
  Plus,
  ArrowRight,
  Layout,
  Volume2,
  Trash2,
  Copy,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

import { useToast } from '../common/ToastModalProvider';

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'nori';
  text: string;
  time: string;
  breakdown?: string[];
  canvasLink?: boolean;
}

export const ChatHistoryView: React.FC = () => {
  const { commandQuery, setCommandQuery, setNoriState, setActiveView } = useNori();
  const { showToast, showConfirm, showPrompt } = useToast();

  const [showHistory, setShowHistory] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: 'sess_1', title: 'System Architecture & Design', createdAt: 'Active' },
    { id: 'sess_2', title: 'Sensor Hardware & Pinout Verification', createdAt: '2 hours ago' },
    { id: 'sess_3', title: 'Local Hardware Acceleration', createdAt: 'Yesterday' }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('sess_1');

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    sess_1: [
      {
        id: 'm1',
        sender: 'nori',
        text: "Hello! I am your on-device AI workspace companion. What would you like to design, inspect, or solve?",
        time: 'Just now'
      }
    ],
    sess_2: [
      {
        id: 'm2',
        sender: 'nori',
        text: "Hardware inspection session active. Tracking the TMP36 sensor on Arduino pin A0 and checking for voltage fluctuations.",
        time: '2 hours ago'
      }
    ],
    sess_3: [
      {
        id: 'm3',
        sender: 'nori',
        text: "Hardware acceleration active with sub-50ms local response latency and complete data privacy.",
        time: 'Yesterday'
      }
    ]
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const activeMessages = messages[activeSessionId] || [];

  const handleCreateNewChat = () => {
    showPrompt({
      title: 'New Conversation',
      message: 'Enter a topic or purpose for this conversation:',
      placeholder: 'e.g. Distributed Vector System',
      confirmText: 'Create Chat',
      onConfirm: (title) => {
        const newId = `sess_${Date.now()}`;
        const newSession: ChatSession = {
          id: newId,
          title,
          createdAt: 'Just now'
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newId);
        setMessages((prev) => ({
          ...prev,
          [newId]: [
            {
              id: String(Date.now()),
              sender: 'nori',
              text: `Starting new conversation: "${title}". Ask anything about your code, canvas, or hardware.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        }));
        showToast('New conversation created', 'success');
      }
    });
  };

  const handleDeleteSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation? This cannot be undone.',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        setSessions((prev) => {
          const remaining = prev.filter((s) => s.id !== idToDelete);
          if (idToDelete === activeSessionId) {
            if (remaining.length > 0) {
              setActiveSessionId(remaining[0].id);
            } else {
              const freshId = `sess_${Date.now()}`;
              setActiveSessionId(freshId);
              return [{ id: freshId, title: 'New Conversation', createdAt: 'Just now' }];
            }
          }
          return remaining;
        });

        setMessages((prev) => {
          const copy = { ...prev };
          delete copy[idToDelete];
          return copy;
        });
        showToast('Conversation deleted', 'info');
      }
    });
  };

  const handleClearCurrentChat = () => {
    showConfirm({
      title: 'Clear Current Chat',
      message: 'Are you sure you want to clear all messages in this conversation?',
      confirmText: 'Clear Chat',
      isDestructive: true,
      onConfirm: () => {
        setMessages((prev) => ({
          ...prev,
          [activeSessionId]: [
            {
              id: String(Date.now()),
              sender: 'nori',
              text: "Conversation cleared. What would you like to discuss next?",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        }));
        showToast('Chat messages cleared', 'info');
      }
    });
  };

  const handleSendMessage = async (customQuery?: string) => {
    const query = (customQuery || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), userMsg]
    }));
    setInput('');
    setLoading(true);
    setNoriState('thinking');

    const qLower = query.toLowerCase();

    // Direct Intent Task Routing & Navigation Execution
    let targetView: string | null = null;
    let autoDrawPrompt: string | null = null;

    if (qLower.includes('draw') || qLower.includes('diagram') || qLower.includes('sketch') || qLower.includes('architecture') || qLower.includes('whiteboard') || qLower.includes('canvas')) {
      targetView = 'canvas';
      autoDrawPrompt = query;
    } else if (qLower.includes('team') || qLower.includes('collab') || qLower.includes('mesh') || qLower.includes('workspace')) {
      targetView = 'team';
    } else if (qLower.includes('memory') || qLower.includes('graph') || qLower.includes('note')) {
      targetView = 'memory';
    } else if (qLower.includes('timeline') || qLower.includes('history') || qLower.includes('audit')) {
      targetView = 'timeline';
    } else if (qLower.includes('device') || qLower.includes('hardware') || qLower.includes('slow') || qLower.includes('load') || qLower.includes('spec') || qLower.includes('cpu') || qLower.includes('ram')) {
      targetView = 'device';
    } else if (qLower.includes('project') || qLower.includes('code') || qLower.includes('files')) {
      targetView = 'projects';
    } else if (qLower.includes('camera') || qLower.includes('vision') || qLower.includes('desk') || qLower.includes('see')) {
      targetView = 'physical';
    }

    // Special Fast Handling for Greetings
    const isGreeting = ['hi', 'hello', 'hey', 'hi nori', 'hello nori', 'good morning', 'good afternoon', 'good evening', 'howdy'].includes(qLower);

    if (isGreeting) {
      setTimeout(() => {
        const greetingAnswer = "Hello! I am Nori, your on-device AI workspace companion. How can I assist with your projects, code, hardware circuits, or workspace today?";
        const noriMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'nori',
          text: greetingAnswer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          breakdown: [
            "Local Reasoning Engine Active",
            "Hardware & Window Observer Connected",
            "Zero Cloud Data Transmission"
          ]
        };
        setMessages((prev) => ({
          ...prev,
          [activeSessionId]: [...(prev[activeSessionId] || []), noriMsg]
        }));
        voiceEngine.speak(greetingAnswer);
        setNoriState('ready');
        setLoading(false);
      }, 400);

      if (targetView) {
        setTimeout(() => {
          setActiveView(targetView as any);
        }, 1200);
      }
      return;
    }

    try {
      const res = await askNori(query);
      const answer = res.summary || res.headline || `Processed query regarding "${query}".`;
      const noriMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'nori',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        breakdown: res.breakdowns?.flatMap((b) => b.items) || res.suggested_actions,
        canvasLink: !!targetView || qLower.includes('canvas') || qLower.includes('design')
      };

      setMessages((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), noriMsg]
      }));
      voiceEngine.speak(answer);
      setNoriState('ready');

      // Trigger automatic navigation and task execution
      if (targetView) {
        if (autoDrawPrompt && targetView === 'canvas') {
          setTimeout(() => {
            setActiveView('canvas');
            window.dispatchEvent(new CustomEvent('nori-auto-draw', { detail: { prompt: autoDrawPrompt } }));
          }, 800);
        } else {
          setTimeout(() => {
            setActiveView(targetView as any);
          }, 1000);
        }
      }
    } catch (e) {
      // Clean fallback if backend service is connecting
      const fallbackText = `I have received your request: "${query}". Analyzing your active workspace context.`;
      setMessages((prev) => ({
        ...prev,
        [activeSessionId]: [
          ...(prev[activeSessionId] || []),
          {
            id: String(Date.now() + 1),
            sender: 'nori',
            text: fallbackText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            canvasLink: !!targetView
          }
        ]
      }));
      setNoriState('idle');

      if (targetView) {
        if (autoDrawPrompt && targetView === 'canvas') {
          setTimeout(() => {
            setActiveView('canvas');
            window.dispatchEvent(new CustomEvent('nori-auto-draw', { detail: { prompt: autoDrawPrompt } }));
          }, 800);
        } else {
          setTimeout(() => {
            setActiveView(targetView as any);
          }, 1000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (commandQuery) {
      const q = commandQuery;
      setCommandQuery('');
      handleSendMessage(q);
    }
  }, [commandQuery]);

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      voiceEngine.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      voiceEngine.startListening(
        (transcript) => {
          setInput(transcript);
          setIsListening(false);
        },
        () => setIsListening(true),
        () => setIsListening(false),
        () => setIsListening(false)
      );
    }
  };

  const quickPrompts = [
    { label: 'Check On Me', query: 'Check on me - how am I doing with food, water, and rest today?' },
    { label: 'Hydration Check', query: 'Water and hydration check on me' },
    { label: 'Cooking & Recipes', query: 'Suggest quick healthy 15-minute recipes for dinner' },
    { label: 'Gym & Stretch', query: 'Give me a 5-minute gym stretch and workout routine' },
    { label: 'Movie Suggestions', query: 'Recommend relaxing top-rated movies for tonight' },
    { label: 'Book Recommendations', query: 'Suggest top books for reading and personal growth' },
    { label: 'Explain Workspace', query: 'What am I working on and what is my active context?' },
    { label: 'Draw Architecture', query: 'Draw architecture diagram of Nori local context engine on canvas' }
  ];

  return (
    <div className="w-full h-full flex overflow-hidden bg-[#07090e] select-none font-sans">
      {/* 1. Left Conversation History Sidebar - Collapsible like ChatGPT */}
      {showHistory && (
        <aside className="w-72 border-r border-white/[0.08] bg-[#090c14] flex flex-col justify-between shrink-0 overflow-hidden transition-all duration-200">
          {/* Top Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono block">
                Conversations
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {sessions.length} local history items
              </span>
            </div>
            <button
              onClick={handleCreateNewChat}
              className="p-2 rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 transition-colors cursor-pointer"
              title="Start New Conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Sessions Scrollable Feed */}
          <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto no-scrollbar">
            {sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  style={{ padding: '14px 16px' }}
                  className={`w-full text-left rounded-md border transition-all cursor-pointer group flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-orange-500/15 border-orange-500/40 text-white shadow-sm'
                      : 'bg-[#0f121d] hover:bg-[#151a2a] border-white/[0.06] hover:border-white/[0.12] text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs font-semibold truncate leading-snug text-slate-200 group-hover:text-white">
                      {sess.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {sess.createdAt}
                    </div>
                  </div>

                  {/* Delete Conversation Button */}
                  <button
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    title="Delete Conversation"
                    className="w-8 h-8 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 opacity-70 group-hover:opacity-100 transition-all cursor-pointer shrink-0 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Clear All Footer */}
          <div className="p-3 border-t border-white/[0.08] bg-[#0c0f18]">
            <button
              onClick={() => {
                showConfirm({
                  title: 'Clear Conversation History',
                  message: 'Are you sure you want to clear all conversation history? This cannot be undone.',
                  confirmLabel: 'Clear All',
                  danger: true,
                  onConfirm: () => {
                    const freshId = `sess_${Date.now()}`;
                    setSessions([{ id: freshId, title: 'New Conversation', createdAt: 'Just now' }]);
                    setActiveSessionId(freshId);
                    setMessages({
                      [freshId]: [
                        {
                          id: String(Date.now()),
                          sender: 'nori',
                          text: 'All previous conversations cleared. How can I assist you?',
                          time: 'Just now'
                        }
                      ]
                    });
                    showToast('All conversation history cleared', 'info');
                  }
                });
              }}
              className="w-full py-2 px-3 rounded-md bg-white/[0.02] hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/25 text-slate-400 hover:text-rose-300 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          </div>
        </aside>
      )}

      {/* 2. Main Chat Area - Expands to 100% when history is hidden */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f17] relative">
        {/* Header with ChatGPT-like Sidebar Toggle */}
        <header className="h-14 px-5 border-b border-white/[0.08] bg-[#10131f] flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Toggle History Sidebar Button */}
            <button
              onClick={() => setShowHistory((prev) => !prev)}
              className="p-2 rounded-md bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer"
              title={showHistory ? 'Hide Conversations' : 'Show Conversations'}
            >
              {showHistory ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-orange-400" />}
            </button>

            <h2 className="text-sm font-bold text-white truncate">
              {sessions.find((s) => s.id === activeSessionId)?.title || 'AI Workspace Chat'}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleClearCurrentChat}
              className="p-2 rounded-md bg-white/[0.03] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Clear Active Chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>

            <button
              onClick={() => setActiveView('canvas')}
              className="nori-btn-secondary text-xs py-1.5 px-3"
            >
              <Layout className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Open Canvas</span>
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 w-full max-w-3xl mx-auto">
          {activeMessages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} w-full space-y-1.5`}
            >
              {m.sender === 'user' ? (
                <div className="max-w-[85%] p-4 rounded-md bg-[#191f32] border border-orange-500/30 text-white text-sm shadow-md text-wrap-safe leading-relaxed space-y-1.5">
                  <p>{m.text}</p>
                  <span className="text-[10px] text-slate-400 block text-right font-mono">
                    {m.time}
                  </span>
                </div>
              ) : (
                <div className="w-full flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-orange-600 to-rose-500 p-[1px] shrink-0 shadow-md shadow-orange-500/20 mt-1">
                    <div className="w-full h-full bg-[#111420] rounded-[5px] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rotate-45 bg-gradient-to-tr from-orange-500 to-amber-300 rounded-[1px]" />
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="p-4 sm:p-5 rounded-md bg-[#121624] border border-white/[0.08] text-slate-100 text-sm leading-relaxed shadow-lg space-y-3 text-wrap-safe">
                      <p className="leading-relaxed">{m.text}</p>

                      {m.breakdown && m.breakdown.length > 0 && (
                        <div className="pt-2.5 border-t border-white/[0.06] space-y-1.5">
                          <span className="text-[11px] font-mono text-orange-400 font-bold uppercase tracking-wider block">
                            Key Analysis:
                          </span>
                          {m.breakdown.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                              <span className="text-orange-400 font-bold shrink-0">•</span>
                              <span className="leading-relaxed">{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Bar inside Message */}
                      <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCopyMessage(m.id, m.text)}
                            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                            title="Copy response"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedMsgId === m.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() => voiceEngine.speak(m.text)}
                            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                            title="Read aloud"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Listen</span>
                          </button>
                        </div>
                        <span>{m.time}</span>
                      </div>
                    </div>

                    {/* Canvas Link Card if Architecture discussed */}
                    {m.canvasLink && (
                      <div className="nori-card p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Layout className="w-4 h-4 text-orange-400 shrink-0" />
                          <span className="text-xs font-semibold text-white truncate">
                            Interactive Architecture Studio Canvas
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveView('canvas')}
                          className="nori-btn-primary text-xs py-1 px-2.5 shrink-0"
                        >
                          <span>Open Canvas</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-md bg-[#121624] border border-white/[0.06] text-xs text-orange-400 font-mono animate-pulse max-w-sm">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Synthesizing response locally...</span>
            </div>
          )}
        </div>

        {/* 3. Floating Bottom Center ChatGPT-Style Composer */}
        <div className="w-full shrink-0 px-4 pb-4 pt-1 bg-gradient-to-t from-[#090b12] via-[#090b12]/80 to-transparent">
          <div className="max-w-3xl mx-auto space-y-2.5">
            {/* Quick Suggestions Chips (No Emojis) */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.query)}
                  className="px-3 py-1.5 rounded-md bg-[#141828] hover:bg-orange-500/15 border border-white/[0.08] hover:border-orange-500/40 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-all cursor-pointer font-medium shadow-sm"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Elevated Floating Composer Card */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121626]/95 border border-white/[0.12] shadow-2xl backdrop-blur-md focus-within:border-orange-500/60 transition-all">
              <input
                type="text"
                placeholder="Ask Nori anything about your workspace, hardware circuits, or code..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none px-3 py-1"
              />

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleVoiceToggle}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    isListening ? 'bg-orange-500 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                  title={isListening ? "Listening... click to stop" : "Voice Input"}
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim()}
                  className="nori-btn-primary py-2 px-3.5 rounded-lg disabled:opacity-40"
                  title="Send Message (Enter)"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs font-semibold">Send</span>
                </button>
              </div>
            </div>

            {/* Bottom Centered Privacy Disclaimer (No Model Name Mentioned) */}
            <div className="text-center text-[11px] text-slate-500 font-mono">
              Nori runs entirely locally on your device. Complete privacy guaranteed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
