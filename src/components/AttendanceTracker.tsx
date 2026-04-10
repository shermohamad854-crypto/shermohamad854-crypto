import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, addDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Attendance, Employee } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { CheckCircle2, Clock, UserX, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AttendanceTracker() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const empUnsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'employees');
    });

    const attQuery = query(collection(db, 'attendance'), where('date', '==', today));
    const attUnsubscribe = onSnapshot(attQuery, (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
    });

    return () => {
      empUnsubscribe();
      attUnsubscribe();
    };
  }, [today]);

  const handleCheckIn = async (employeeId: string) => {
    try {
      const existing = attendance.find(a => a.employeeId === employeeId);
      if (existing) {
        toast.error('Already checked in for today');
        return;
      }

      const now = new Date();
      const checkInTime = now.toLocaleTimeString();
      const isLate = now.getHours() >= 9 && now.getMinutes() > 0;

      await addDoc(collection(db, 'attendance'), {
        employeeId,
        date: today,
        checkIn: checkInTime,
        status: isLate ? 'late' : 'present',
        timestamp: Timestamp.now()
      });
      toast.success('Check-in successful');
    } catch (error) {
      toast.error('Failed to check in');
    }
  };

  const stats = {
    present: attendance.filter(a => a.status === 'present' || a.status === 'late').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: employees.length - attendance.length
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{stats.present}</div>
            <p className="text-xs text-emerald-600 mt-1">Employees in office</p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Late Arrivals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{stats.late}</div>
            <p className="text-xs text-amber-600 mt-1">After 9:00 AM</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-rose-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-600 flex items-center gap-2">
              <UserX className="w-4 h-4" /> Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-700">{stats.absent}</div>
            <p className="text-xs text-rose-600 mt-1">Not yet checked in</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Daily Attendance Log - {today}</h3>
        </div>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Check-in Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => {
              const record = attendance.find(a => a.employeeId === emp.id);
              return (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="font-medium">{emp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {record ? record.checkIn : '--:--'}
                  </TableCell>
                  <TableCell>
                    {record ? (
                      <Badge variant={record.status === 'present' ? 'default' : 'secondary'} className={record.status === 'late' ? 'bg-amber-100 text-amber-700' : ''}>
                        {record.status}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">Not Checked In</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!record && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckIn(emp.id)}>
                        Check In
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
