import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Employee, Attendance, Payroll, Task } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Download, FileText, Filter } from 'lucide-react';
import { Button } from './ui/button';

export default function ReportingDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const unsubEmps = onSnapshot(collection(db, 'employees'), (s) => setEmployees(s.docs.map(d => ({id: d.id, ...d.data()} as Employee))), (e) => handleFirestoreError(e, OperationType.LIST, 'employees'));
    const unsubAtt = onSnapshot(collection(db, 'attendance'), (s) => setAttendance(s.docs.map(d => ({id: d.id, ...d.data()} as Attendance))), (e) => handleFirestoreError(e, OperationType.LIST, 'attendance'));
    const unsubPay = onSnapshot(collection(db, 'payroll'), (s) => setPayroll(s.docs.map(d => ({id: d.id, ...d.data()} as Payroll))), (e) => handleFirestoreError(e, OperationType.LIST, 'payroll'));
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (s) => setTasks(s.docs.map(d => ({id: d.id, ...d.data()} as Task))), (e) => handleFirestoreError(e, OperationType.LIST, 'tasks'));

    return () => {
      unsubEmps();
      unsubAtt();
      unsubPay();
      unsubTasks();
    };
  }, []);

  // Department Distribution Data
  const deptData = employees.reduce((acc: any[], emp) => {
    const existing = acc.find(d => d.name === emp.department);
    if (existing) existing.value++;
    else acc.push({ name: emp.department, value: 1 });
    return acc;
  }, []);

  // Task Status Data
  const taskData = [
    { name: 'Todo', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length },
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
  ];

  // Salary by Department
  const salaryData = employees.reduce((acc: any[], emp) => {
    const existing = acc.find(d => d.name === emp.department);
    if (existing) existing.salary += emp.salary;
    else acc.push({ name: emp.department, salary: emp.salary });
    return acc;
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Reporting & Analytics</h3>
          <p className="text-slate-500">Visual insights into organization performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Department Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Task Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Salary Expenditure by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} width={100} />
                <Tooltip />
                <Bar dataKey="salary" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
