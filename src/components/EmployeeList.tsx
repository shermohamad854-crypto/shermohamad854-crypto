import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Employee } from '../types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from './ui/dialog';
import { Label } from './ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Badge } from './ui/badge';
import { Plus, Search, MoreVertical, Edit, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    status: 'active',
    department: '',
    role: '',
    joinDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Only fetch if user is likely to have permission (UI check)
    // The actual enforcement is in Firestore Rules
    const unsubscribe = onSnapshot(query(collection(db, 'employees'), orderBy('name')), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(docs);
      setLoading(false);
    }, (error) => {
      // If it's a permission error, we just stop loading and show empty
      if (error.code === 'permission-denied') {
        console.warn("Permission denied fetching employees list");
        setLoading(false);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'employees');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddEmployee = async () => {
    try {
      if (!newEmployee.name || !newEmployee.email || !newEmployee.role || !newEmployee.department) {
        toast.error('Please fill in all required fields');
        return;
      }
      await addDoc(collection(db, 'employees'), newEmployee);
      setIsAddDialogOpen(false);
      setNewEmployee({ status: 'active', joinDate: new Date().toISOString().split('T')[0] });
      toast.success('Employee added successfully');
    } catch (error) {
      toast.error('Failed to add employee');
      console.error(error);
    }
  };

  const handleEditEmployee = async () => {
    try {
      if (!editingEmployee || !editingEmployee.name || !editingEmployee.email || !editingEmployee.role || !editingEmployee.department) {
        toast.error('Please fill in all required fields');
        return;
      }
      const { id, ...data } = editingEmployee;
      await updateDoc(doc(db, 'employees', id), data);
      setIsEditDialogOpen(false);
      setEditingEmployee(null);
      toast.success('Employee updated successfully');
    } catch (error) {
      toast.error('Failed to update employee');
      console.error(error);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
      toast.success('Employee deleted');
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search employees..." 
            className="pl-10 h-11 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button className="h-11 px-6" />}>
            <UserPlus className="mr-2 w-4 h-4" /> Add Employee
          </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    value={newEmployee.name || ''}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    className="col-span-3" 
                    value={newEmployee.email || ''}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role</Label>
                  <Input 
                    id="role" 
                    className="col-span-3" 
                    value={newEmployee.role || ''}
                    onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">Dept.</Label>
                  <Select onValueChange={(v: string) => setNewEmployee({...newEmployee, department: v})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Office Administration">Office Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="salary" className="text-right">Salary</Label>
                  <Input 
                    id="salary" 
                    type="number" 
                    className="col-span-3" 
                    value={newEmployee.salary || ''}
                    onChange={(e) => setNewEmployee({...newEmployee, salary: Number(e.target.value)})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddEmployee}>Save Employee</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input 
                  id="edit-name" 
                  className="col-span-3" 
                  value={editingEmployee?.name || ''}
                  onChange={(e) => setEditingEmployee(prev => prev ? {...prev, name: e.target.value} : null)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  className="col-span-3" 
                  value={editingEmployee?.email || ''}
                  onChange={(e) => setEditingEmployee(prev => prev ? {...prev, email: e.target.value} : null)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">Role</Label>
                <Input 
                  id="edit-role" 
                  className="col-span-3" 
                  value={editingEmployee?.role || ''}
                  onChange={(e) => setEditingEmployee(prev => prev ? {...prev, role: e.target.value} : null)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-department" className="text-right">Dept.</Label>
                <Select 
                  value={editingEmployee?.department}
                  onValueChange={(v: string) => setEditingEmployee(prev => prev ? {...prev, department: v} : null)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Office Administration">Office Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">Status</Label>
                <Select 
                  value={editingEmployee?.status}
                  onValueChange={(v: any) => setEditingEmployee(prev => prev ? {...prev, status: v} : null)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-salary" className="text-right">Salary</Label>
                <Input 
                  id="edit-salary" 
                  type="number" 
                  className="col-span-3" 
                  value={editingEmployee?.salary || ''}
                  onChange={(e) => setEditingEmployee(prev => prev ? {...prev, salary: Number(e.target.value)} : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditEmployee}>Update Employee</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[250px]">Employee</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-slate-50/50" />
                </TableRow>
              ))
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{emp.role}</TableCell>
                  <TableCell className="text-slate-600">{emp.department}</TableCell>
                  <TableCell>
                    <Badge variant={emp.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">{emp.joinDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary"
                        onClick={() => {
                          setEditingEmployee(emp);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger render={
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        } />
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Employee</DialogTitle>
                          </DialogHeader>
                          <p className="py-4 text-slate-600">
                            Are you sure you want to delete <strong>{emp.name}</strong>? This action cannot be undone.
                          </p>
                          <DialogFooter>
                            <DialogClose render={<Button variant="outline">Cancel</Button>} />
                            <Button variant="destructive" onClick={() => handleDeleteEmployee(emp.id)}>Delete</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
