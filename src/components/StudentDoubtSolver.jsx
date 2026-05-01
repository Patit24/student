import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Send, Bot, User, Loader2 } from 'lucide-react';
import '../pages/StudentDashboard.css';

export default function StudentDoubtSolver({ tutorId }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I am your AI Teaching Assistant. How can I help you today? You can ask a question or upload an image of your doubt.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !fileInputRef.current?.files[0]) return;

    const userMsg = { role: 'user', text: input };
    if (fileInputRef.current?.files[0]) {
      userMsg.image = URL.createObjectURL(fileInputRef.current.files[0]);
    }
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsTyping(true);

    // Ultra-fast <600ms latency simulation for "Google-Mode" local implementation
    setTimeout(() => {
      let aiResponse = "I see your question. Based on the syllabus, the key concept here is to apply Newton's second law. Let me break it down step-by-step...";
      if (userMsg.image) {
        aiResponse = "I've analyzed the image you uploaded. This looks like a calculus problem regarding limits. The first step is to factorize the numerator.";
      } else if (userMsg.text.toLowerCase().includes('chemistry')) {
        aiResponse = "For chemistry doubts, remember to balance the equation first! Let me know the exact reaction.";
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, 450); // < 600ms
  };

  return (
    <div className="sd-card" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #F5C518, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Instant Doubt Solver</h3>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Google-Mode AI Assistant • Replies in &lt;1s</p>
        </div>
      </div>

      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '1rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? '#3B82F6' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {msg.role === 'user' ? <User size={16} color="#FFF" /> : <Bot size={16} color="#F5C518" />}
            </div>
            <div style={{ background: msg.role === 'user' ? '#3B82F6' : 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px', borderTopRightRadius: msg.role === 'user' ? 0 : '16px', borderTopLeftRadius: msg.role === 'ai' ? 0 : '16px', maxWidth: '80%', color: msg.role === 'user' ? '#FFF' : '#F0F4FF', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {msg.image && <img src={msg.image} alt="Upload" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '0.5rem' }} />}
              {msg.text && <div>{msg.text}</div>}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="#F5C518" />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px', borderTopLeftRadius: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={16} className="animate-spin" color="#F5C518" />
              <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.8rem', background: '#0B1120' }}>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={(e) => {
            if (e.target.files[0]) toast?.success('Image attached! Type a question and send.');
          }}
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()} 
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
        >
          <ImageIcon size={20} />
        </button>
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Ask a question..." 
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F4FF', padding: '0 1rem', borderRadius: '12px', outline: 'none', fontSize: '0.9rem' }}
        />
        <button 
          type="submit" 
          disabled={!input.trim() && !fileInputRef.current?.files?.[0]} 
          style={{ background: '#F5C518', border: 'none', color: '#000', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (!input.trim() && !fileInputRef.current?.files?.[0]) ? 0.5 : 1 }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
