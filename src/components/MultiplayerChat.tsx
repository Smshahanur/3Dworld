import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { ChatMessage, AVATAR_COLORS } from '../multiplayer/types';
import { multiplayerService } from '../multiplayer/multiplayerService';
import { soundManager } from '../utils/audio';

interface MultiplayerChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUserId?: string;
}

export const MultiplayerChat: React.FC<MultiplayerChatProps> = ({
  isOpen,
  onClose,
  messages,
  currentUserId,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await multiplayerService.sendChatMessage(text);
      soundManager.playInteractSound();
    } catch (err) {
      console.warn('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-3 sm:left-6 z-40 w-80 sm:w-96 rounded-2xl bg-[#080d1a]/95 backdrop-blur-md border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col h-80 sm:h-96 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 to-slate-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            Village Global Chat
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
            <MessageSquare className="w-8 h-8 text-cyan-400/40 mb-2" />
            <p className="font-medium text-slate-300">Welcome to 3DWorld Chat!</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Say hello to other residents exploring the village.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUserId === msg.senderId;
            const colorHex = AVATAR_COLORS.find((c) => c.id === msg.avatarColor)?.hex || '#06b6d4';
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[95%] ${
                  isMe ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span className={`font-semibold ${isMe ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {msg.senderName}
                  </span>
                  <span className="text-slate-500">{timeStr}</span>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-2xl break-words max-w-full text-slate-100 ${
                    isMe
                      ? 'bg-cyan-600/30 border border-cyan-400/40 rounded-tr-xs'
                      : 'bg-slate-800/80 border border-white/10 rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-white/10 bg-slate-950/80 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            maxLength={160}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message (max 160)..."
            className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            aria-label="Send message"
            className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
