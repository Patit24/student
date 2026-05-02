import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Check, X, AlertCircle, Calendar as CalendarIcon, MessageCircle } from 'lucide-react';
import { useToast } from './Toast';

export default function TutorAttendanceManager({ tutorId, batches, students, isMockMode, tutorName }) {
  const toast = useToast();
  const [selectedBatch, setSelectedBatch] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [attendanceData, setAttendanceData] = useState({
    weeklyOffDays: [0], // 0 = Sunday
    holidays: [],
    records: {} // { studentId: { 'YYYY-MM-DD': 'P' | 'A' | 'L' } }
  });
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, '0');
  const yearMonth = `${year}-${monthStr}`;

  useEffect(() => {
    if (selectedBatch) {
      fetchAttendance();
    }
  }, [selectedBatch, yearMonth]);

  const fetchAttendance = async () => {
    if (isMockMode) {
      const mockKey = `mock_attendance_${tutorId}_${selectedBatch}_${yearMonth}`;
      const data = JSON.parse(localStorage.getItem(mockKey) || 'null');
      if (data) {
        setAttendanceData(data);
      } else {
        setAttendanceData({ weeklyOffDays: [0], holidays: [], records: {} });
      }
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, 'attendance', `${tutorId}_${selectedBatch}_${yearMonth}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setAttendanceData(snap.data());
      } else {
        setAttendanceData({ weeklyOffDays: [0], holidays: [], records: {} });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance');
    }
    setLoading(false);
  };

  const saveAttendance = async (newData) => {
    setAttendanceData(newData);
    if (isMockMode) {
      const mockKey = `mock_attendance_${tutorId}_${selectedBatch}_${yearMonth}`;
      localStorage.setItem(mockKey, JSON.stringify(newData));
      return;
    }

    try {
      const docRef = doc(db, 'attendance', `${tutorId}_${selectedBatch}_${yearMonth}`);
      await setDoc(docRef, newData, { merge: true });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save attendance');
    }
  };

  const toggleAttendance = (studentId, dayStr) => {
    const currentStatus = attendanceData.records[studentId]?.[dayStr];
    let nextStatus = 'P';
    if (currentStatus === 'P') nextStatus = 'A';
    else if (currentStatus === 'A') nextStatus = 'L';
    else if (currentStatus === 'L') nextStatus = null; // Clear

    const newRecords = { ...attendanceData.records };
    if (!newRecords[studentId]) newRecords[studentId] = {};
    
    if (nextStatus) {
      newRecords[studentId][dayStr] = nextStatus;
    } else {
      delete newRecords[studentId][dayStr];
    }

    saveAttendance({ ...attendanceData, records: newRecords });
  };

  const toggleHoliday = (dayStr) => {
    let newHolidays = [...(attendanceData.holidays || [])];
    if (newHolidays.includes(dayStr)) {
      newHolidays = newHolidays.filter(d => d !== dayStr);
    } else {
      newHolidays.push(dayStr);
    }
    saveAttendance({ ...attendanceData, holidays: newHolidays });
  };

  const toggleWeeklyOff = (dayOfWeek) => {
    let newWeeklyOff = [...(attendanceData.weeklyOffDays || [])];
    if (newWeeklyOff.includes(dayOfWeek)) {
      newWeeklyOff = newWeeklyOff.filter(d => d !== dayOfWeek);
    } else {
      newWeeklyOff.push(dayOfWeek);
    }
    saveAttendance({ ...attendanceData, weeklyOffDays: newWeeklyOff });
  };

  const handleSendAlert = (student, consecutiveAbsences) => {
    const phone = (student.phone || '').replace(/\D/g, '');
    const num = phone.startsWith('91') ? phone : `91${phone}`;
    const msg = `Alert from ${tutorName}: \nStudent ${student.name} has been absent for ${consecutiveAbsences} consecutive days. Please ensure they attend the next class to keep up with the batch.`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const batchStudents = students.filter(s => s.batch_id === selectedBatch);

  // Generate Date Array
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    const dayStr = `${yearMonth}-${String(i + 1).padStart(2, '0')}`;
    const dayOfWeek = d.getDay();
    const isWeeklyOff = attendanceData.weeklyOffDays?.includes(dayOfWeek);
    const isHoliday = attendanceData.holidays?.includes(dayStr);
    return { day: i + 1, dayStr, dayOfWeek, isWeeklyOff, isHoliday, isFuture: d > new Date() };
  });

  const getStudentStats = (studentId) => {
    const records = attendanceData.records[studentId] || {};
    let present = 0;
    let late = 0;
    let absent = 0;
    let totalValidDays = 0;

    daysArray.forEach(d => {
      if (!d.isWeeklyOff && !d.isHoliday && !d.isFuture) {
        totalValidDays++;
        if (records[d.dayStr] === 'P') present++;
        if (records[d.dayStr] === 'L') late++;
        if (records[d.dayStr] === 'A') absent++;
      }
    });

    const totalAttended = present + late;
    const percentage = totalValidDays > 0 ? Math.round((totalAttended / totalValidDays) * 100) : 100;
    
    // Check consecutive absences
    let consecutiveAbsences = 0;
    for (let i = daysArray.length - 1; i >= 0; i--) {
      const d = daysArray[i];
      if (d.isFuture || d.isWeeklyOff || d.isHoliday) continue;
      if (records[d.dayStr] === 'A') {
        consecutiveAbsences++;
      } else if (records[d.dayStr] === 'P' || records[d.dayStr] === 'L') {
        break;
      }
    }

    return { totalAttended, percentage, consecutiveAbsences };
  };

  const getBatchAverage = () => {
    if (batchStudents.length === 0) return 0;
    let totalPerc = 0;
    batchStudents.forEach(s => {
      totalPerc += getStudentStats(s.id).percentage;
    });
    return Math.round(totalPerc / batchStudents.length);
  };

  return (
    <div className="glass-panel p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h3><CalendarIcon className="inline mr-2" /> Attendance Dashboard</h3>
        <div className="flex gap-4">
          <input 
            type="month" 
            className="input-field"
            value={yearMonth}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m] = e.target.value.split('-');
                setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 1));
              }
            }}
          />
          <select 
            className="input-field" 
            value={selectedBatch} 
            onChange={e => setSelectedBatch(e.target.value)}
          >
            <option value="">Select a Batch</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedBatch ? (
        <div className="text-center p-8 text-muted">
          <AlertCircle size={40} className="mx-auto mb-4 opacity-50" />
          <p>Select a batch to manage attendance.</p>
        </div>
      ) : loading ? (
        <div className="text-center p-8">Loading attendance...</div>
      ) : (
        <>
          <div className="mb-6 flex gap-4 flex-wrap">
            <div className="glass-panel p-4 flex-1">
              <h4 className="text-sm text-primary mb-2">Weekly Off Days</h4>
              <div className="flex gap-2 flex-wrap">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                  <button 
                    key={day}
                    className={`btn ${attendanceData.weeklyOffDays?.includes(idx) ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={() => toggleWeeklyOff(idx)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="glass-panel p-4 flex-1 flex flex-col justify-center items-center bg-[rgba(79,70,229,0.05)] border border-[rgba(79,70,229,0.2)]">
              <div className="text-sm text-primary mb-1">Batch Average Attendance</div>
              <div className={`text-3xl font-bold ${getBatchAverage() >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                {getBatchAverage()}%
              </div>
            </div>

            <div className="glass-panel p-4 flex-1">
              <h4 className="text-sm text-primary mb-2">Legend</h4>
              <div className="flex gap-4 text-sm flex-wrap">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full"></span> P = Present</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span> A = Absent</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded-full"></span> L = Late</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[rgba(79,70,229,0.5)] rounded-full"></span> H = Holiday</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left" style={{ minWidth: '800px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="p-3 bg-[rgba(255,255,255,0.05)] sticky left-0 z-10 w-48">Student Name</th>
                  <th className="p-3 bg-[rgba(255,255,255,0.05)] text-center w-20">Stats</th>
                  {daysArray.map(d => (
                    <th 
                      key={d.day} 
                      className={`p-2 text-center text-xs ${d.isWeeklyOff ? 'opacity-30' : ''}`}
                      title={d.dayStr}
                    >
                      <div className="mb-1">{d.day}</div>
                      <button 
                        className={`text-[10px] px-1 rounded ${d.isHoliday ? 'bg-primary text-white' : 'bg-[rgba(255,255,255,0.1)]'}`}
                        onClick={() => toggleHoliday(d.dayStr)}
                        title="Toggle Holiday"
                      >
                        H
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batchStudents.length === 0 ? (
                  <tr>
                    <td colSpan={daysArray.length + 2} className="text-center p-8 text-muted">
                      No students found in this batch.
                    </td>
                  </tr>
                ) : (
                  batchStudents.map(student => {
                    const stats = getStudentStats(student.id);
                    return (
                      <tr key={student.id} className="border-t border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="p-3 sticky left-0 bg-[#0f1423] z-10 font-medium">
                          <div className="truncate w-44">{student.name}</div>
                          {stats.consecutiveAbsences >= 3 && (
                            <button 
                              className="text-[10px] text-red-400 flex items-center gap-1 mt-1 hover:text-red-300"
                              onClick={() => handleSendAlert(student, stats.consecutiveAbsences)}
                            >
                              <AlertCircle size={10} /> Alert ({stats.consecutiveAbsences} days)
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-center text-sm">
                          <div className={stats.percentage < 75 ? 'text-red-400' : 'text-green-400'}>
                            {stats.percentage}%
                          </div>
                          <div className="text-[10px] text-muted">{stats.totalAttended}d</div>
                        </td>
                        {daysArray.map(d => {
                          const status = attendanceData.records[student.id]?.[d.dayStr];
                          
                          let cellBg = 'transparent';
                          let cellColor = 'inherit';
                          let displayText = '-';
                          
                          if (status === 'P') { cellBg = 'rgba(34, 197, 94, 0.2)'; cellColor = '#4ade80'; displayText = 'P'; }
                          else if (status === 'A') { cellBg = 'rgba(239, 68, 68, 0.2)'; cellColor = '#f87171'; displayText = 'A'; }
                          else if (status === 'L') { cellBg = 'rgba(234, 179, 8, 0.2)'; cellColor = '#facc15'; displayText = 'L'; }
                          
                          if (d.isHoliday) {
                            return <td key={d.day} className="p-2 text-center text-xs text-primary bg-[rgba(79,70,229,0.1)]">Hol</td>;
                          }
                          if (d.isWeeklyOff) {
                            return <td key={d.day} className="p-2 text-center text-xs text-muted bg-[rgba(255,255,255,0.02)]">Off</td>;
                          }

                          return (
                            <td key={d.day} className="p-1 text-center">
                              <button
                                className={`w-6 h-6 rounded text-xs font-bold transition-colors ${d.isFuture && !status ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[rgba(255,255,255,0.1)]'}`}
                                style={{ backgroundColor: cellBg, color: cellColor }}
                                onClick={() => !d.isFuture && toggleAttendance(student.id, d.dayStr)}
                                disabled={d.isFuture}
                              >
                                {displayText}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
