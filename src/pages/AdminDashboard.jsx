import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { Users, DollarSign, Activity, CheckCircle, XCircle, Upload, FileText, Trash2, Plus, Globe, Package, LogOut, LayoutDashboard } from 'lucide-react';
import { uploadGlobalAsset, subscribeGlobalAssets, deleteGlobalAsset, uploadFileToStorage } from '../db.service';
import { useToast } from '../components/Toast';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminDashboard() {
  const { isMockMode, currentUser } = useAppContext();
  const toast = useToast();

  // KPIs & Tutors
  const [tutors, setTutors] = useState([]);
  
  useEffect(() => {
    if (isMockMode || currentUser?.uid === 'admin-1') {
      const q = query(collection(db, 'users'), where('role', '==', 'tutor'));
      const unsub = onSnapshot(q, (snap) => {
        const real = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (real.length > 0) {
          setTutors(real);
        } else {
          setTutors([
            { id: 't1', name: 'Demo Tutor', email: 'tutor@demo.com', subscription_tier: 'pro', subscription_status: 'active' },
            { id: 't2', name: 'New Teacher', email: 'new@demo.com', subscription_tier: 'growth', subscription_status: 'inactive' },
          ]);
        }
      });
      return unsub;
    }
    const q = query(collection(db, 'users'), where('role', '==', 'tutor'));
    return onSnapshot(q, (snap) => {
      setTutors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [isMockMode, currentUser]);

  const totalTutors = tutors.length;
  const activeTutors = tutors.filter(t => t.subscription_status === 'active').length;
  
  // Calculate Revenue
  const revenue = tutors.reduce((acc, tutor) => {
    if (tutor.subscription_status === 'active') {
      if (tutor.subscription_tier === 'pro') return acc + 99;
      if (tutor.subscription_tier === 'growth') return acc + 29;
    }
    return acc;
  }, 0);

  // Asset Manager State
  const [globalAssets, setGlobalAssets] = useState([]);
  const [newAsset, setNewAsset] = useState({ title: '', class_name: '', subject: '', is_free: true, price: 0 });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isMockMode || currentUser?.uid === 'admin-1') {
      setGlobalAssets([
        { id: 'ga1', title: 'Calculus Guide', class_name: '12th', subject: 'Maths', is_free: true, price: 0 },
        { id: 'ga2', title: 'Physics Formula Sheet', class_name: '11th', subject: 'Physics', is_free: false, price: 99 },
      ]);
      return;
    }
    const unsub = subscribeGlobalAssets(setGlobalAssets);
    return unsub;
  }, [isMockMode, currentUser]);

  const handleUploadAsset = async (e) => {
    e.preventDefault();
    if (!newAsset.title || !file) {
      toast.error('Please provide a title and select a file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File is too large (>20MB). Please use a compressed PDF.');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      let file_url = '#';
      if (!isMockMode) {
        console.log("Starting upload to Storage...");
        file_url = await uploadFileToStorage(file, 'global_library', (p) => setUploadProgress(p));
      }
      console.log("Saving asset to Firestore...");
      await uploadGlobalAsset({ ...newAsset, file_url });
      setNewAsset({ title: '', class_name: '', subject: '', is_free: true, price: 0 });
      setFile(null);
      setUploadProgress(0);
      toast.success('Asset uploaded successfully! 🚀');
    } catch (err) {
      console.error('Upload error:', err);
      if (err.message.includes('CORS')) {
        toast.error('CORS Error: Please run the gsutil command I provided in the chat.');
      } else {
        toast.error('Upload failed: ' + err.message);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (window.confirm('Delete this asset?')) {
      try {
        await deleteGlobalAsset(id);
        toast.success('Asset deleted');
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const toggleTutorStatus = async (id, currentStatus) => {
    if (isMockMode) {
      setTutors(prev => prev.map(t => t.id === id ? { ...t, subscription_status: currentStatus === 'active' ? 'inactive' : 'active' } : t));
      return;
    }
    try {
      await updateDoc(doc(db, 'users', id), {
        subscription_status: currentStatus === 'active' ? 'inactive' : 'active'
      });
      toast.success('Tutor status updated');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const navigate = useNavigate();
  const { logout } = useAppContext();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="container mt-8 animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div className="flex justify-between items-start mb-8" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="flex items-center gap-2">
            <LayoutDashboard size={28} color="var(--primary)"/> 
            Super Admin Dashboard
          </h2>
          <p className="text-muted">Master Oversight & Global Asset Control</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel p-4 flex gap-8 items-center" style={{ padding: '0.75rem 1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Tutors</p>
              <h3 style={{ margin: 0 }}>{totalTutors}</h3>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'var(--border)' }} />
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Revenue</p>
              <h3 style={{ margin: 0, color: 'var(--secondary)' }}>${revenue}</h3>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            <LogOut size={16}/> Logout
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="flex gap-4 mb-8" style={{ flexWrap: 'wrap' }}>
        <div className="glass-panel p-4 flex items-center gap-4" style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ padding: '1rem', background: 'rgba(79, 70, 229, 0.2)', borderRadius: '50%' }}>
            <Users size={24} color="var(--primary)" />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Total Registered Tutors</p>
            <h3>{totalTutors}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-4" style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%' }}>
            <Activity size={24} color="var(--secondary)" />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Active Tutors</p>
            <h3>{activeTutors}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-4" style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '50%' }}>
            <DollarSign size={24} color="var(--danger)" />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Platform Revenue</p>
            <h3>₹{revenue}</h3>
          </div>
        </div>
      </div>

      <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
        {/* Global Asset Manager */}
        <div className="glass-panel p-8" style={{ flex: 1, minWidth: '400px' }}>
          <h3 className="mb-4 flex items-center gap-2"><Upload size={20}/> Global Asset Library</h3>
          <p className="text-muted mb-6" style={{ fontSize: '0.85rem' }}>Upload PDFs directly from your device for the global library.</p>
          
          <form onSubmit={handleUploadAsset} className="flex-col gap-4">
            <input 
              type="text" className="input-field" placeholder="Asset Title" 
              value={newAsset.title} onChange={e => setNewAsset({...newAsset, title: e.target.value})} required 
            />
            <div className="flex gap-4">
              <input 
                type="text" className="input-field" placeholder="Class (e.g. 10th)" 
                value={newAsset.class_name} onChange={e => setNewAsset({...newAsset, class_name: e.target.value})} 
              />
              <input 
                type="text" className="input-field" placeholder="Subject" 
                value={newAsset.subject} onChange={e => setNewAsset({...newAsset, subject: e.target.value})} 
              />
            </div>
            
            <div className="flex-col gap-2">
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select PDF Material</label>
              <input 
                type="file" accept="application/pdf" className="input-field" 
                onChange={e => setFile(e.target.files[0])} required 
              />
            </div>
            
            <div className="flex items-center justify-between p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input 
                  type="checkbox" checked={newAsset.is_free} 
                  onChange={e => setNewAsset({...newAsset, is_free: e.target.checked, price: e.target.checked ? 0 : newAsset.price})} 
                />
                Is Free?
              </label>
              {!newAsset.is_free && (
                <div className="flex items-center gap-2">
                  <span>Price: ₹</span>
                  <input 
                    type="number" className="input-field" style={{ width: '80px', padding: '0.3rem' }}
                    value={newAsset.price} onChange={e => setNewAsset({...newAsset, price: Number(e.target.value)})}
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? `Uploading (${Math.round(uploadProgress)}%)` : <><Plus size={18}/> Upload to Library</>}
            </button>
            
            {uploading && (
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '0.5rem' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
              </div>
            )}
          </form>

          <div className="mt-8">
            <h4 className="mb-4">Live Assets</h4>
            <div className="flex-col gap-2">
              {globalAssets.map(asset => (
                <div key={asset.id} className="flex justify-between items-center p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{asset.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {asset.class_name} · {asset.subject} · {asset.is_free ? <span style={{ color: 'var(--secondary)' }}>Free</span> : <span>₹{asset.price}</span>}
                    </p>
                  </div>
                  <button onClick={() => handleDeleteAsset(asset.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Registered Tutors Management */}
        <div className="glass-panel p-8" style={{ flex: 1.5, minWidth: '500px' }}>
          <h3 className="mb-6 flex items-center gap-2"><Users size={22}/> Registered Tutors</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem 0' }}>Tutor Details</th>
                  <th>Subscription</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {tutors.map(tutor => (
                  <tr key={tutor.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1.2rem 0' }}>
                      <div style={{ fontWeight: 600 }}>{tutor.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tutor.email}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2" style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                        <Package size={14} color="var(--primary)" />
                        {tutor.subscription_tier || 'Free'}
                      </div>
                    </td>
                    <td>
                      {tutor.subscription_status === 'active' ? (
                        <span style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}><CheckCircle size={14}/> Active</span>
                      ) : (
                        <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}><XCircle size={14}/> Inactive</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className={`btn ${tutor.subscription_status === 'active' ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}
                        onClick={() => toggleTutorStatus(tutor.id, tutor.subscription_status)}
                      >
                        {tutor.subscription_status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
