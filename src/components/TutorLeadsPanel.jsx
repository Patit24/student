import React from 'react';
import { useAppContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { 
  Phone, Mail, MessageSquare, Calendar, 
  CheckCircle, Clock, Trash2, ExternalLink
} from 'lucide-react';

export default function TutorLeadsPanel() {
  const { currentUser, mockLeads, setMockLeads } = useAppContext();
  const toast = useToast();

  const myLeads = mockLeads.filter(l => l.tutor_id === currentUser?.uid)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const updateLeadStatus = (leadId, newStatus) => {
    setMockLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    toast.info(`Lead marked as ${newStatus}`);
  };

  const deleteLead = (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      setMockLeads(prev => prev.filter(l => l.id !== leadId));
      toast.success('Lead deleted');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="flex items-center gap-2"><MessageSquare size={20} /> Student Inquiries (Leads)</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Track and respond to potential students who contacted you through your profile.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
              <th className="p-4">Student</th>
              <th className="p-4">Interest</th>
              <th className="p-4">Status</th>
              <th className="p-4">Received</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {myLeads.length > 0 ? (
              myLeads.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-row">
                  <td className="p-4">
                    <div style={{ fontWeight: 600 }}>{lead.student_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.phone}</div>
                  </td>
                  <td className="p-4">
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '4px', 
                        background: lead.type === 'demo' ? 'rgba(79,70,229,0.1)' : 'rgba(16,185,129,0.1)',
                        color: lead.type === 'demo' ? 'var(--primary)' : 'var(--secondary)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        marginRight: '0.5rem',
                        textTransform: 'uppercase'
                      }}>
                        {lead.type === 'demo' ? 'Free Demo' : 'Callback'}
                      </span>
                      Class {lead.class} · {lead.subject}
                    </div>
                    {lead.message && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                        "{lead.message}"
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <select 
                      value={lead.status} 
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                      style={{ 
                        background: lead.status === 'new' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                        color: lead.status === 'new' ? 'var(--danger)' : 'var(--text)',
                        border: '1px solid var(--border)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="p-4" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <a 
                        href={`tel:${lead.phone}`} 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', borderRadius: '4px' }}
                        title="Call Student"
                      >
                        <Phone size={14} />
                      </a>
                      <a 
                        href={`https://wa.me/91${lead.phone}?text=Hi%20${lead.student_name},%20I%20received%20your%20inquiry%20on%20Antigravity%20Tuition%20regarding%20${lead.subject}%20classes.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '0.4rem', borderRadius: '4px', color: '#25D366' }}
                        title="WhatsApp"
                      >
                        <MessageSquare size={14} />
                      </a>
                      <button 
                        onClick={() => deleteLead(lead.id)}
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', borderRadius: '4px', color: 'var(--danger)' }}
                        title="Delete Lead"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-muted">
                  No inquiries yet. Make sure your profile is complete and informative!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
