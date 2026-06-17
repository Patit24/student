import React, { useState, useEffect } from 'react';
import { 
  Trophy, Users, DollarSign, Plus, Trash2, ShieldCheck, 
  ChevronRight, Calendar, MapPin, Search, AlertCircle, CheckCircle
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '../Toast';

export default function ContestManager() {
  const toast = useToast();
  const [matches, setMatches] = useState([]);
  const [contests, setContests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list' or 'create'

  const [form, setForm] = useState({
    matchId: '',
    matchName: '',
    series: '',
    entryFee: '',
    maxSpots: '',
    prizePool: '',
  });

  const [prizeTiers, setPrizeTiers] = useState([
    { fromRank: 1, toRank: 1, amount: '', users: 1 }
  ]);

  const rapidApiKey = '31700195e1msh02df4f8b64b4e4ap155e90jsnf3f06bb3a97e';

  useEffect(() => {
    fetchMatches();
    const q = query(collection(db, 'contests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setContests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://cricket-live-line1.p.rapidapi.com/upcomingMatches', {
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'cricket-live-line1.p.rapidapi.com'
        }
      });
      const data = await response.json();
      if (data.status && data.data) {
        setMatches(data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch matches');
    } finally {
      setIsLoading(false);
    }
  };

  const addPrizeTier = () => {
    const lastTier = prizeTiers[prizeTiers.length - 1];
    const nextRank = lastTier.toRank + 1;
    setPrizeTiers([...prizeTiers, { fromRank: nextRank, toRank: nextRank, amount: '', users: 1 }]);
  };

  const removePrizeTier = (index) => {
    setPrizeTiers(prizeTiers.filter((_, i) => i !== index));
  };

  const handleCreateContest = async () => {
    if (!form.matchId || !form.entryFee || !form.maxSpots || !form.prizePool) {
      toast.error('Please fill all required fields');
      return;
    }

    const totalAllocated = prizeTiers.reduce((acc, tier) => acc + (Number(tier.amount) * tier.users), 0);
    if (totalAllocated > Number(form.prizePool)) {
      toast.error(`Prize allocation (${totalAllocated}) exceeds prize pool (${form.prizePool})`);
      return;
    }

    try {
      await addDoc(collection(db, 'contests'), {
        ...form,
        entryFee: Number(form.entryFee),
        maxSpots: Number(form.maxSpots),
        prizePool: Number(form.prizePool),
        prizeTiers,
        spotsLeft: Number(form.maxSpots),
        createdAt: serverTimestamp(),
        status: 'upcoming'
      });
      toast.success('Contest created successfully! 🏆');
      setActiveView('list');
      setForm({ matchId: '', matchName: '', series: '', entryFee: '', maxSpots: '', prizePool: '' });
      setPrizeTiers([{ fromRank: 1, toRank: 1, amount: '', users: 1 }]);
    } catch (err) {
      toast.error('Failed to create contest');
    }
  };

  const deleteContest = async (id) => {
    if (window.confirm('Delete this contest?')) {
      await deleteDoc(doc(db, 'contests', id));
      toast.success('Contest deleted');
    }
  };

  return (
    <div className="contest-manager">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
          <Trophy size={28} color="var(--admin-accent)" /> 
          CONTEST FACTORY
        </h2>
        <button 
          className="btn-premium" 
          onClick={() => setActiveView(activeView === 'list' ? 'create' : 'list')}
        >
          {activeView === 'list' ? <Plus size={18} /> : <ChevronRight size={18} />}
          {activeView === 'list' ? 'CREATE NEW CONTEST' : 'BACK TO LIST'}
        </button>
      </div>

      {activeView === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-premium">
          {/* Step 1: Select Match */}
          <div className="glass-card p-6">
            <h4 className="flex items-center gap-2 mb-6 text-accent uppercase tracking-widest text-xs font-bold">
              <Calendar size={16} /> Step 1: Select Match
            </h4>
            <div className="match-selector-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {isLoading ? (
                <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2" /> Fetching real-time feed...</div>
              ) : matches.map(match => (
                <div 
                  key={match.match_id} 
                  className={`match-select-card ${form.matchId === match.match_id.toString() ? 'selected' : ''}`}
                  onClick={() => setForm({
                    ...form, 
                    matchId: match.match_id.toString(),
                    matchName: `${match.team_a} vs ${match.team_b}`,
                    series: match.series
                  })}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{match.team_a} vs {match.team_b}</span>
                    <span className="text-[10px] text-accent font-black">{match.match_date}</span>
                  </div>
                  <div className="text-[10px] opacity-60 mt-1">{match.series}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Contest Details */}
          <div className="glass-card p-6">
            <h4 className="flex items-center gap-2 mb-6 text-accent uppercase tracking-widest text-xs font-bold">
              <ShieldCheck size={16} /> Step 2: Configure Parameters
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="input-group">
                <label className="input-label">Entry Fee (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="e.g. 49"
                  value={form.entryFee}
                  onChange={e => setForm({...form, entryFee: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Max Spots</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="e.g. 100"
                  value={form.maxSpots}
                  onChange={e => setForm({...form, maxSpots: e.target.value})}
                />
              </div>
              <div className="input-group col-span-2">
                <label className="input-label">Total Prize Pool (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="e.g. 10000"
                  value={form.prizePool}
                  onChange={e => setForm({...form, prizePool: e.target.value})}
                />
              </div>
            </div>

            <h4 className="flex items-center gap-2 mb-4 text-accent uppercase tracking-widest text-xs font-bold">
              <DollarSign size={16} /> Prize Distribution
            </h4>
            
            <div className="prize-tiers-list mb-6">
              {prizeTiers.map((tier, index) => (
                <div key={index} className="flex gap-2 items-end mb-3 animate-slide-in">
                  <div className="flex-1">
                    <label className="text-[10px] text-secondary">Ranks</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        className="input-field-sm text-center" 
                        value={tier.fromRank}
                        onChange={e => {
                          const nt = [...prizeTiers];
                          nt[index].fromRank = Number(e.target.value);
                          setPrizeTiers(nt);
                        }}
                      />
                      <span>-</span>
                      <input 
                        type="number" 
                        className="input-field-sm text-center" 
                        value={tier.toRank}
                        onChange={e => {
                          const nt = [...prizeTiers];
                          nt[index].toRank = Number(e.target.value);
                          nt[index].users = (nt[index].toRank - nt[index].fromRank) + 1;
                          setPrizeTiers(nt);
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-secondary">Prize (₹)</label>
                    <input 
                      type="number" 
                      className="input-field-sm" 
                      placeholder="Amt"
                      value={tier.amount}
                      onChange={e => {
                        const nt = [...prizeTiers];
                        nt[index].amount = e.target.value;
                        setPrizeTiers(nt);
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-secondary mb-3">
                    {tier.users} User(s)
                  </div>
                  <button className="btn-icon mb-1" onClick={() => removePrizeTier(index)}>
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              ))}
              <button className="text-xs text-accent font-bold flex items-center gap-1 mt-2" onClick={addPrizeTier}>
                <Plus size={14} /> ADD PRIZE TIER
              </button>
            </div>

            <button className="btn-approve w-full py-4 font-black tracking-widest" onClick={handleCreateContest}>
              ACTIVATE CONTEST
            </button>
          </div>
        </div>
      ) : (
        <div className="table-responsive glass-card p-6">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Match & Series</th>
                <th>Fee</th>
                <th>Spots</th>
                <th>Pool</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {contests.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="font-bold">{c.matchName}</div>
                    <div className="text-[10px] text-secondary">{c.series}</div>
                  </td>
                  <td>₹{c.entryFee}</td>
                  <td>{c.spotsLeft}/{c.maxSpots}</td>
                  <td className="text-accent font-bold">₹{c.prizePool}</td>
                  <td>
                    <span className={`badge ${c.status === 'live' ? 'badge-success' : 'badge-pending'}`}>
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon" onClick={() => deleteContest(c.id)}>
                      <Trash2 size={16} color="#EF4444" />
                    </button>
                  </td>
                </tr>
              ))}
              {contests.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-20 opacity-30">
                    No active contests. Start by creating one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const Loader2 = ({ className }) => <div className={`loader ${className}`} />;
