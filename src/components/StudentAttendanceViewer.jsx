import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from './Toast';

export default function StudentAttendanceViewer({ studentId, batchId, tutorId, isMockMode }) {
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, '0');
  const yearMonth = `${year}-${monthStr}`;

  useEffect(() => {
    if (tutorId && batchId) {
      fetchAttendance();
    }
  }, [yearMonth, tutorId, batchId]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      if (isMockMode) {
        const mockKey = `mock_attendance_${tutorId}_${batchId}_${yearMonth}`;
        const data = JSON.parse(localStorage.getItem(mockKey) || 'null');
        setAttendanceData(data || { weeklyOffDays: [0], holidays: [], records: {} });
      } else {
        const docRef = doc(db, 'attendance', `${tutorId}_${batchId}_${yearMonth}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setAttendanceData(snap.data());
        } else {
          setAttendanceData({ weeklyOffDays: [0], holidays: [], records: {} });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your attendance');
    }
    setLoading(false);
  };

  if (loading) return <div className="p-4 text-center">Loading attendance...</div>;
  if (!attendanceData) return null;

  const records = attendanceData.records[studentId] || {};
  let present = 0;
  let late = 0;
  let absent = 0;
  let totalValidDays = 0;

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    const dayStr = `${yearMonth}-${String(i + 1).padStart(2, '0')}`;
    const dayOfWeek = d.getDay();
    const isWeeklyOff = attendanceData.weeklyOffDays?.includes(dayOfWeek);
    const isHoliday = attendanceData.holidays?.includes(dayStr);
    const isFuture = d > new Date();

    if (!isWeeklyOff && !isHoliday && !isFuture) {
      totalValidDays++;
      if (records[dayStr] === 'P') present++;
      if (records[dayStr] === 'L') late++;
      if (records[dayStr] === 'A') absent++;
    }

    return { day: i + 1, dayStr, isWeeklyOff, isHoliday, isFuture, status: records[dayStr] };
  });

  const totalAttended = present + late;
  const percentage = totalValidDays > 0 ? Math.round((totalAttended / totalValidDays) * 100) : 100;

  return (
    <div className="glass-panel p-6 sm:p-8 mt-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h3 className="flex items-center gap-2">
          <CalendarIcon size={20} className="text-primary" />
          My Attendance
        </h3>
        <input 
          type="month" 
          className="input-field max-w-[200px]"
          value={yearMonth}
          onChange={(e) => {
            if (e.target.value) {
              const [y, m] = e.target.value.split('-');
              setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 1));
            }
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-4 text-center bg-[rgba(255,255,255,0.02)]">
          <div className="text-sm text-muted">Attendance</div>
          <div className={`text-2xl font-bold ${percentage >= 75 ? 'text-green-400' : 'text-red-400'}`}>
            {percentage}%
          </div>
        </div>
        <div className="glass-panel p-4 text-center bg-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.1)]">
          <div className="text-sm text-green-400">Present</div>
          <div className="text-2xl font-bold text-green-400">{present}</div>
        </div>
        <div className="glass-panel p-4 text-center bg-[rgba(234,179,8,0.05)] border border-[rgba(234,179,8,0.1)]">
          <div className="text-sm text-yellow-400">Late</div>
          <div className="text-2xl font-bold text-yellow-400">{late}</div>
        </div>
        <div className="glass-panel p-4 text-center bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.1)]">
          <div className="text-sm text-red-400">Absent</div>
          <div className="text-2xl font-bold text-red-400">{absent}</div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-muted mb-2">{day}</div>
        ))}
        
        {/* Empty cells for starting day of month */}
        {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}

        {daysArray.map(d => {
          let cellClass = "p-2 sm:p-4 rounded-lg flex flex-col items-center justify-center min-h-[60px] border ";
          let statusText = "";

          if (d.isHoliday) {
            cellClass += "bg-[rgba(79,70,229,0.1)] border-[rgba(79,70,229,0.2)] text-primary";
            statusText = "Holiday";
          } else if (d.isWeeklyOff) {
            cellClass += "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.05)] text-muted opacity-50";
            statusText = "Off";
          } else if (d.isFuture) {
            cellClass += "bg-transparent border-[rgba(255,255,255,0.05)] text-muted opacity-30";
          } else if (d.status === 'P') {
            cellClass += "bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-green-400";
            statusText = "Present";
          } else if (d.status === 'L') {
            cellClass += "bg-[rgba(234,179,8,0.1)] border-[rgba(234,179,8,0.2)] text-yellow-400";
            statusText = "Late";
          } else if (d.status === 'A') {
            cellClass += "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-red-400";
            statusText = "Absent";
          } else {
            cellClass += "bg-transparent border-[rgba(255,255,255,0.05)] text-white";
            statusText = "-";
          }

          return (
            <div key={d.day} className={cellClass}>
              <span className="text-sm sm:text-base font-bold mb-1">{d.day}</span>
              <span className="text-[10px] sm:text-xs tracking-wider">{statusText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
