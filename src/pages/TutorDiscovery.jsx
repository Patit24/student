import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { 
  Search, MapPin, BookOpen, Star, 
  Filter, CheckCircle, GraduationCap, 
  Users, ChevronRight, Clock
} from 'lucide-react';
import './TutorDiscovery.css';

export default function TutorDiscovery() {
  const { mockTutors } = useAppContext();
  const navigate = useNavigate();

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [teachingMode, setTeachingMode] = useState('');

  // Extract unique subjects, classes, boards from all tutors
  const allSubjects = useMemo(() => {
    const set = new Set();
    mockTutors.forEach(t => t.subjects?.forEach(s => set.add(s)));
    return Array.from(set);
  }, [mockTutors]);

  const allBoards = useMemo(() => {
    const set = new Set();
    mockTutors.forEach(t => t.boards?.forEach(b => set.add(b)));
    return Array.from(set);
  }, [mockTutors]);

  const filteredTutors = useMemo(() => {
    return mockTutors.filter(t => {
      const matchSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.subjects?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchLocation = !locationTerm || 
        t.location?.area?.toLowerCase().includes(locationTerm.toLowerCase()) || 
        t.location?.city?.toLowerCase().includes(locationTerm.toLowerCase()) || 
        t.location?.pincode?.includes(locationTerm);
      const matchClass = !selectedClass || t.classes?.includes(selectedClass);
      const matchSubject = !selectedSubject || t.subjects?.includes(selectedSubject);
      const matchBoard = !selectedBoard || t.boards?.includes(selectedBoard);
      const matchMode = !teachingMode || t.teaching_mode === teachingMode || t.teaching_mode === 'both';

      return matchSearch && matchLocation && matchClass && matchSubject && matchBoard && matchMode;
    });
  }, [mockTutors, searchTerm, locationTerm, selectedClass, selectedSubject, selectedBoard, teachingMode]);

  return (
    <div className="container discovery-root animate-fade-in">
      <header className="discovery-header">
        <h1>Find Your <span className="text-primary">Perfect Tutor</span></h1>
        <p>Verified subject experts in your neighborhood, ready to help you excel.</p>
      </header>

      {/* Main Search Bar */}
      <div className="search-bar-container">
        <div className="search-input-group">
          <label>Subject or Tutor Name</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="e.g. Mathematics, Rahul Sharma" 
              style={{ paddingLeft: '35px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="search-input-group">
          <label>Location (Area, City or Pincode)</label>
          <div style={{ position: 'relative' }}>
            <MapPin size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="e.g. Salt Lake, Kolkata" 
              style={{ paddingLeft: '35px' }}
              value={locationTerm}
              onChange={(e) => setLocationTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="search-input-group" style={{ flex: '0 0 150px' }}>
          <label>Class</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Any Class</option>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="discovery-grid">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--text)' }}>
            <Filter size={18} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Filters</h3>
          </div>

          <div className="filter-group">
            <h4>Subject</h4>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full">
              <option value="">All Subjects</option>
              {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <h4>Board</h4>
            <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)} className="w-full">
              <option value="">All Boards</option>
              {allBoards.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <h4>Teaching Mode</h4>
            <div className="checkbox-group">
              {['online', 'home', 'both'].map(mode => (
                <label key={mode} className="checkbox-item">
                  <input 
                    type="radio" 
                    name="mode" 
                    checked={teachingMode === mode} 
                    onChange={() => setTeachingMode(mode)}
                  />
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </label>
              ))}
              <label className="checkbox-item">
                <input 
                  type="radio" 
                  name="mode" 
                  checked={teachingMode === ''} 
                  onChange={() => setTeachingMode('')}
                />
                Any Mode
              </label>
            </div>
          </div>

          <button 
            className="btn btn-outline w-full" 
            style={{ marginTop: '1rem', fontSize: '0.85rem' }}
            onClick={() => {
              setSearchTerm('');
              setLocationTerm('');
              setSelectedClass('');
              setSelectedSubject('');
              setSelectedBoard('');
              setTeachingMode('');
            }}
          >
            Clear All Filters
          </button>
        </aside>

        {/* Tutor List */}
        <main className="tutor-list">
          <div className="flex justify-between items-center mb-2">
            <p style={{ fontSize: '0.9rem' }}>Showing <strong>{filteredTutors.length}</strong> tutors found</p>
          </div>

          {filteredTutors.length > 0 ? (
            filteredTutors.map(tutor => (
              <div key={tutor.id} className="tutor-card">
                <div className="tutor-img-container">
                  {tutor.is_verified && (
                    <div className="verified-badge">
                      <CheckCircle size={12} /> Verified
                    </div>
                  )}
                  <img src={tutor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&size=200`} alt={tutor.name} />
                </div>

                <div className="tutor-info">
                  <div className="tutor-name-row">
                    <h3 style={{ margin: 0 }}>{tutor.name}</h3>
                    <div className="tutor-rating">
                      <Star size={16} fill="#F5C518" />
                      {tutor.rating || 'N/A'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <MapPin size={14} />
                    {tutor.location?.area}, {tutor.location?.city}
                  </div>

                  <div className="tutor-subjects">
                    {tutor.subjects?.map(s => <span key={s} className="subject-tag">{s}</span>)}
                  </div>

                  <p className="tutor-bio">{tutor.bio}</p>

                  <div className="tutor-meta">
                    <div className="tutor-meta-item">
                      <GraduationCap size={14} />
                      {tutor.experience} exp.
                    </div>
                    <div className="tutor-meta-item">
                      <BookOpen size={14} />
                      Class {tutor.classes?.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="tutor-actions">
                  <div className="tutor-price">
                    {tutor.fees_range?.split(' ')[0]} <span>/ mo</span>
                  </div>
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => navigate(`/tutor/${tutor.id}`)}
                  >
                    View Profile
                  </button>
                  <button 
                    className="btn btn-outline w-full"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => navigate(`/tutor/${tutor.id}?action=demo`)}
                  >
                    Book Free Demo
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel p-8 text-center" style={{ marginTop: '2rem' }}>
              <h3>No Tutors Found</h3>
              <p>Try adjusting your filters or searching in a different area.</p>
              <button className="btn btn-primary mt-4" onClick={() => {
                setSearchTerm('');
                setLocationTerm('');
                setSelectedClass('');
                setSelectedSubject('');
                setSelectedBoard('');
                setTeachingMode('');
              }}>Reset Search</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
