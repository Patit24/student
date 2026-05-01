import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, Send, Bot, User, Loader2, History, CheckCircle2, ChevronRight, Calculator, Microscope, Atom } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import '../pages/StudentDashboard.css';

export default function StudentDoubtSolver({ tutorId, studentId }) {
  const [activeMode, setActiveMode] = useState('chat'); // 'chat' or 'history'
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Welcome to Logic-Scan! Snap a photo of any math or science problem, and I will help you break down the logic step-by-step.', type: 'welcome' }
  ]);
  const [historyList, setHistoryList] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0: idle, 1: scanning, 2: logic analysis, 3: rendering
  const chatRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!studentId) return;
    const q = query(collection(db, 'doubts'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setHistoryList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [studentId]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isTyping, scanStep]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !fileInputRef.current?.files[0]) return;

    const userMsg = { role: 'user', text: input, createdAt: new Date() };
    const file = fileInputRef.current?.files[0];
    if (file) userMsg.image = URL.createObjectURL(file);
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setScanStep(1); 
    
    setTimeout(() => {
      setScanStep(2); 
      setTimeout(() => {
        setScanStep(3); 
        setTimeout(async () => {
          let logicSteps = [];
          let finalSolution = "";
          const qText = userMsg.text.toLowerCase();

          // DYNAMIC LOGIC ENGINE (Mimicking the System Instruction)
          if (userMsg.image) {
            // Simulated Vision Analysis
            logicSteps = [
              { title: "Parsing Image Data", desc: "Detected a visual expression: $f(x) = x^2 - 4x + 4$." },
              { title: "Mathematical Law", desc: "Applying the Perfect Square Trinomial rule: $(a-b)^2 = a^2 - 2ab + b^2$." }
            ];
            finalSolution = "The expression simplifies to $(x - 2)^2$. The root is $x = 2$.";
          } else if (qText.includes('+') || qText.includes('-') || qText.includes('*') || qText.includes('/')) {
            // Basic Arithmetic
            logicSteps = [
              { title: "Parsing Arithmetic", desc: `Identified numbers and operators in: "${userMsg.text}"` },
              { title: "Basic Arithmetic Law", desc: "Applying standard order of operations (BODMAS/PEMDAS)." }
            ];
            // Simple evaluation simulation
            try { 
              const result = eval(userMsg.text.replace(/[^-()\d/*+.]/g, '')); 
              finalSolution = `The calculated result is $${result}$.`;
            } catch { finalSolution = "The result depends on the specific numbers provided."; }
          } else if (qText.includes('atom') || qText.includes('reaction') || qText.includes('chemistry')) {
            // Chemistry
            logicSteps = [
              { title: "Chemical Parsing", desc: "Identified chemical species or atomic structures." },
              { title: "Chemical Law", desc: "Applying the Law of Definite Proportions or Stoichiometry." }
            ];
            finalSolution = "In chemistry, always ensure the molecular structure is stable and electrons are balanced.";
          } else if (qText.includes('force') || qText.includes('motion') || qText.includes('physics')) {
            // Physics
            logicSteps = [
              { title: "Physical Parameter Parsing", desc: "Extracted forces, mass, or acceleration variables." },
              { title: "Newton's Laws", desc: "Applying Newton's Second Law: $F = ma$." }
            ];
            finalSolution = "The net force is the product of mass and acceleration.";
          } else {
            // Default Dynamic Response
            logicSteps = [
              { title: "Logic Parsing", desc: "Extracted core inquiry from your question." },
              { title: "PPR Logical Rule", desc: "Identifying the first-principle law applicable here." }
            ];
            finalSolution = "Based on your query, the best path is to break down the variables and solve step-by-step.";
          }

          const aiMsg = { role: 'ai', steps: logicSteps, solution: finalSolution, text: finalSolution };
          setMessages(prev => [...prev, aiMsg]);
          setScanStep(0);

          try {
            await addDoc(collection(db, 'doubts'), {
              studentId,
              tutorId: tutorId || 'global',
              question: userMsg.text || 'Image Doubt',
              imageUrl: userMsg.image || null,
              response: aiMsg,
              createdAt: serverTimestamp()
            });
          } catch (err) { console.error("History save error:", err); }

        }, 400);
      }, 500);
    }, 600);
  };

  return (
    <div className="sd-card" style={{ display: 'flex', flexDirection: 'column', height: '650px', padding: 0, overflow: 'hidden', border: '1px solid rgba(245,197,24,0.15)' }}>
      {/* Header with Tab Toggles */}
      <div style={{ padding: '0.8rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #F5C518, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
            <Sparkles size={18} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Logic-Scan AI</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveMode('chat')} style={{ background: activeMode === 'chat' ? 'rgba(245,197,24,0.1)' : 'transparent', border: 'none', color: activeMode === 'chat' ? '#F5C518' : '#64748B', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>SOLVER</button>
          <button onClick={() => setActiveMode('history')} style={{ background: activeMode === 'history' ? 'rgba(245,197,24,0.1)' : 'transparent', border: 'none', color: activeMode === 'history' ? '#F5C518' : '#64748B', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><History size={14} /> HISTORY</button>
        </div>
      </div>

      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {activeMode === 'chat' ? (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: msg.role === 'user' ? '#3B82F6' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {msg.role === 'user' ? <User size={16} color="#FFF" /> : <Bot size={16} color="#F5C518" />}
                </div>
                <div style={{ background: msg.role === 'user' ? '#3B82F6' : 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '20px', borderTopRightRadius: msg.role === 'user' ? 0 : '20px', borderTopLeftRadius: msg.role === 'ai' ? 0 : '20px', maxWidth: '85%', color: msg.role === 'user' ? '#FFF' : '#F0F4FF', fontSize: '0.92rem', lineHeight: 1.6, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  {msg.image && <img src={msg.image} alt="Doubt" style={{ maxWidth: '100%', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.1)' }} />}
                  
                  {msg.steps ? (
                    <div className="flex-col gap-4">
                      {msg.steps.map((step, si) => (
                        <div key={si} style={{ borderLeft: '2px solid rgba(245,197,24,0.3)', paddingLeft: '1rem', marginBottom: '1rem' }}>
                          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#F5C518', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Step {si+1}: {step.title}</p>
                          <div style={{ opacity: 0.9 }}><MathRenderer text={step.desc} /></div>
                        </div>
                      ))}
                      <div style={{ background: 'rgba(34,197,94,0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <p style={{ margin: 0, fontWeight: 800, color: '#22C55E', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} /> LOGICAL CONCLUSION</p>
                        <div style={{ marginTop: '0.5rem' }}><MathRenderer text={msg.solution} /></div>
                      </div>
                    </div>
                  ) : (
                    <MathRenderer text={msg.text} />
                  )}
                </div>
              </div>
            ))}

            {scanStep > 0 && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={16} color="#F5C518" /></div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '20px', borderTopLeftRadius: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Loader2 size={18} className="animate-spin" color="#F5C518" />
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#F5C518' }}>
                      {scanStep === 1 ? 'VISUAL SCANNING...' : scanStep === 2 ? 'CORE LOGIC ANALYSIS...' : 'RENDERING SOLUTION...'}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#F5C518', width: scanStep === 1 ? '30%' : scanStep === 2 ? '65%' : '95%', transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-col gap-4">
            {historyList.map(item => (
              <div key={item.id} className="sd-card" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>{item.question}</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B' }}>{item.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={14} color="#22C55E" /> Solved via Logic-Scan
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
            {historyList.length === 0 && <p style={{ textAlign: 'center', color: '#64748B', padding: '3rem 0' }}>No doubt history found.</p>}
          </div>
        )}
      </div>

      {activeMode === 'chat' && (
        <form onSubmit={handleSend} style={{ padding: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '1rem', background: '#0B1120' }}>
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)', color: '#F5C518', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
            <ImageIcon size={22} />
          </button>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a question or snap a photo..." style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F4FF', padding: '0 1.2rem', borderRadius: '14px', outline: 'none', fontSize: '0.95rem' }} />
          <button type="submit" disabled={scanStep > 0 || (!input.trim() && !fileInputRef.current?.files?.[0])} style={{ background: '#F5C518', border: 'none', color: '#000', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (scanStep > 0 || (!input.trim() && !fileInputRef.current?.files?.[0])) ? 0.5 : 1 }}>
            <Send size={20} />
          </button>
        </form>
      )}
    </div>
  );
}

function MathRenderer({ text }) {
  if (!text) return null;
  const parts = text.split(/(\$.*?\$)/g);
  return (
    <span>
      {parts.map((p, i) => {
        if (p.startsWith('$') && p.endsWith('$')) {
          return <InlineMath key={i} math={p.slice(1, -1)} />;
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
