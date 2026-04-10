import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Task, Employee } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from './ui/dialog';
import { Label } from './ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { CheckCircle2, Circle, Clock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    status: 'todo',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('dueDate'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      setLoading(false);
    });

    const empUnsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    });

    return () => {
      unsubscribe();
      empUnsubscribe();
    };
  }, []);

  const handleAddTask = async () => {
    try {
      if (!newTask.title || !newTask.assignedTo) {
        toast.error('Please fill in required fields');
        return;
      }
      await addDoc(collection(db, 'tasks'), newTask);
      setIsAddDialogOpen(false);
      setNewTask({ status: 'todo', priority: 'medium', dueDate: new Date().toISOString().split('T')[0] });
      toast.success('Task assigned successfully');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { status });
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteTask = async (id: string) => {
    if (confirm('Delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        toast.success('Task deleted');
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Circle className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-800">Tasks</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11">
              <Plus className="mr-2 w-4 h-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign New Task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input 
                  value={newTask.title || ''} 
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Assigned To</Label>
                <Select onValueChange={(v) => setNewTask({...newTask, assignedTo: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select onValueChange={(v: any) => setNewTask({...newTask, priority: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Input 
                    type="date" 
                    value={newTask.dueDate || ''} 
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTask}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['todo', 'in-progress', 'completed'].map((status) => (
          <div key={status} className="space-y-4">
            <h4 className="font-semibold text-slate-500 uppercase text-xs tracking-wider px-2">
              {status.replace('-', ' ')} ({tasks.filter(t => t.status === status).length})
            </h4>
            <div className="space-y-3">
              {tasks.filter(t => t.status === status).map((task) => {
                const emp = employees.find(e => e.id === task.assignedTo);
                return (
                  <Card key={task.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <button 
                          onClick={() => {
                            const nextStatus = status === 'todo' ? 'in-progress' : status === 'in-progress' ? 'completed' : 'todo';
                            updateTaskStatus(task.id, nextStatus as any);
                          }}
                        >
                          {getStatusIcon(task.status)}
                        </button>
                        <Badge variant="outline" className={`text-[10px] ${
                          task.priority === 'high' ? 'text-rose-500 border-rose-200 bg-rose-50' :
                          task.priority === 'medium' ? 'text-amber-500 border-amber-200 bg-amber-50' :
                          'text-slate-500 border-slate-200 bg-slate-50'
                        }`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div>
                        <h5 className="font-medium text-slate-800">{task.title}</h5>
                        <p className="text-xs text-slate-500 mt-1">Assigned to: {emp?.name || 'Unknown'}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.dueDate}
                        </span>
                        <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
