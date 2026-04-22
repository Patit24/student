import React, { useState, useEffect, useRef } from 'react';
import { useAppContext as useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';
import { rtdb } from '../firebase';
import { ref, onValue, push } from 'firebase/database';

export default function ChatSidebar({ roomId }) {
  const { currentUser, isMockMode } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isMockMode) {
      // Mock chat
      setMessages([
        { id: 1, sender: 'System', text: 'Welcome to the live chat!', role: 'system' }
      ]);
      return;
    }

    const chatRef = ref(rtdb, `chats/${roomId}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [roomId, isMockMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      sender: currentUser?.name || 'Anonymous',
      role: currentUser?.role || 'student',
      text: input.trim(),
      timestamp: Date.now()
    };

    if (isMockMode) {
      setMessages([...messages, { id: Date.now(), ...newMessage }]);
    } else {
      const chatRef = ref(rtdb, `chats/${roomId}`);
      await push(chatRef, newMessage);
    }
    
    setInput('');
  };

  return (
    <div className="flex-col h-full" style={{ flex: 1, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ 
            background: msg.role === 'tutor' ? 'rgba(79, 70, 229, 0.2)' : 'var(--surface-hover)', 
            padding: '0.5rem 0.75rem', 
            borderRadius: 'var(--radius-sm)',
            alignSelf: msg.role === 'system' ? 'center' : 'flex-start',
            borderLeft: msg.role === 'tutor' ? '3px solid var(--primary)' : 'none',
            fontSize: '0.9rem'
          }}>
            {msg.role !== 'system' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                {msg.sender} {msg.role === 'tutor' ? '(Tutor)' : ''}
              </div>
            )}
            <div style={{ color: msg.role === 'system' ? 'var(--text-muted)' : 'var(--text)' }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      
      <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.75rem' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
