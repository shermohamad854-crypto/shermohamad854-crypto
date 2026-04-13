import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Employee, Attendance, UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Users, 
  CalendarCheck, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface DashboardOverviewProps {
  role: UserProfile['role'];
}

export default function DashboardOverview({ role }: DashboardOverviewProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const empUnsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (error) => {
      // If it's a permission error, we just show empty
      if (error.code === 'permission-denied') {
        console.warn("Permission denied fetching employees for dashboard");
      } else {
        handleFirestoreError(error, OperationType.LIST, 'employees');
      }
    });

    const attUnsubscribe = onSnapshot(query(collection(db, 'attendance'), limit(100)), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Permission denied fetching attendance for dashboard");
        setLoading(false);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'attendance');
      }
    });

    return () => {
      empUnsubscribe();
      attUnsubscribe();
    };
  }, []);

  const stats = [
    { 
      label: 'Total Employees', 
      value: employees.length, 
      icon: Users, 
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'On Leave', 
      value: employees.filter(e => e.status === 'on-leave').length, 
      icon: CalendarCheck, 
      color: 'bg-amber-500',
      trend: '-2%',
      trendUp: false
    },
    { 
      label: 'Avg. Attendance', 
      value: '94%', 
      icon: TrendingUp, 
      color: 'bg-emerald-500',
      trend: '+5%',
      trendUp: true
    },
    { 
      label: 'Late Today', 
      value: attendance.filter(a => a.status === 'late' && a.date === new Date().toISOString().split('T')[0]).length, 
      icon: Clock, 
      color: 'bg-rose-500',
      trend: '+1%',
      trendUp: false
    },
  ];

  const chartData = [
    { name: 'Mon', attendance: 45 },
    { name: 'Tue', attendance: 52 },
    { name: 'Wed', attendance: 48 },
    { name: 'Thu', attendance: 61 },
    { name: 'Fri', attendance: 55 },
    { name: 'Sat', attendance: 20 },
    { name: 'Sun', attendance: 15 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-current/20`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.trend}
                  {stat.trendUp ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <h4 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h4>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {attendance.slice(0, 5).map((log, i) => {
                const emp = employees.find(e => e.id === log.employeeId);
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                      {emp?.name.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{emp?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">Checked in at {log.checkIn}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {log.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
