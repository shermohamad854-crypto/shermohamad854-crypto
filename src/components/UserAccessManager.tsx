import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Search, 
  Mail, 
  UserCheck,
  Edit,
  Plus,
  X,
  Lock,
  RefreshCw
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from './ui/dialog';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export default function UserAccessManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New User Form State
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'employee' as UserProfile['role'],
    displayName: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      toast.error('Email and password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a secondary Firebase app to create user without signing out current admin
      const secondaryAppName = 'secondary';
      const secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
      const uid = userCredential.user.uid;

      // 2. Create Firestore Profile
      await setDoc(doc(db, 'users', uid), {
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.displayName,
        photoURL: ''
      });

      // 3. Sign out from secondary app to clean up
      await signOut(secondaryAuth);

      toast.success('User created successfully');
      setIsAddUserOpen(false);
      setNewUser({ email: '', password: '', role: 'employee', displayName: '' });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserRole = async (userId: string, role: UserProfile['role']) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const deleteUserAccess = async (userId: string) => {
    if (confirm('Are you sure you want to remove this user\'s access?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        toast.success('User access removed');
      } catch (error) {
        toast.error('Failed to remove access');
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">User Access Management</h3>
          <p className="text-sm text-slate-500">Manage system roles and permissions</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="h-10">
              <UserPlus className="w-4 h-4 mr-2" /> Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new employee to the system. They can log in with these credentials.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@company.com" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>System Role</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(v: any) => setNewUser({ ...newUser, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Search users by email or name..." 
          className="pl-10 h-11 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Assign New Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <span>{user.displayName || 'New User'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    user.role === 'admin' ? 'default' : 
                    user.role === 'hr' ? 'secondary' : 
                    user.role === 'manager' ? 'outline' : 'secondary'
                  } className="capitalize">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select 
                    defaultValue={user.role} 
                    onValueChange={(v: any) => updateUserRole(user.id, v)}
                  >
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteUserAccess(user.id)}
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Card className="border-none shadow-sm bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Role Permissions Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-xs uppercase text-slate-400 mb-2">Admin</p>
            <p className="text-xs text-slate-600">Full system access, settings, and user management.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-xs uppercase text-slate-400 mb-2">HR</p>
            <p className="text-xs text-slate-600">Employee directory, payroll processing, and attendance management.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-xs uppercase text-slate-400 mb-2">Manager</p>
            <p className="text-xs text-slate-600">Task assignment, inventory tracking, and attendance viewing.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-xs uppercase text-slate-400 mb-2">Employee</p>
            <p className="text-xs text-slate-600">Personal dashboard, task completion, and payroll slip access.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
