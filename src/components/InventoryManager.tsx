import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { InventoryItem, Employee } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
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
import { Edit, Package, Plus, Search, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    status: 'available',
    quantity: 1,
    unit: 'pcs'
  });

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
    });

    const empUnsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'employees');
    });

    return () => {
      unsubscribe();
      empUnsubscribe();
    };
  }, []);

  const handleAddItem = async () => {
    try {
      if (!newItem.name || !newItem.category) {
        toast.error('Please fill in required fields');
        return;
      }
      await addDoc(collection(db, 'inventory'), newItem);
      setIsAddDialogOpen(false);
      setNewItem({ status: 'available', quantity: 1, unit: 'pcs' });
      toast.success('Inventory item added');
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleEditItem = async () => {
    try {
      if (!editingItem || !editingItem.name || !editingItem.category) {
        toast.error('Please fill in required fields');
        return;
      }
      const { id, ...data } = editingItem;
      await updateDoc(doc(db, 'inventory', id), data);
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast.success('Item updated successfully');
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Inventory Management</h3>
          <p className="text-slate-500">Track company assets and equipment</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button className="h-11" />}>
            <Plus className="mr-2 w-4 h-4" /> Add Item
          </DialogTrigger>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Item Name</Label>
                  <Input 
                    value={newItem.name || ''} 
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Input 
                      value={newItem.category || ''} 
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Quantity</Label>
                    <Input 
                      type="number"
                      value={newItem.quantity || 1} 
                      onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select onValueChange={(v: any) => setNewItem({...newItem, status: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddItem}>Save Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Item Name</Label>
                <Input 
                  value={editingItem?.name || ''} 
                  onChange={(e) => setEditingItem(prev => prev ? {...prev, name: e.target.value} : null)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Input 
                  value={editingItem?.category || ''} 
                  onChange={(e) => setEditingItem(prev => prev ? {...prev, category: e.target.value} : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Quantity</Label>
                  <Input 
                    type="number" 
                    value={editingItem?.quantity || ''} 
                    onChange={(e) => setEditingItem(prev => prev ? {...prev, quantity: Number(e.target.value)} : null)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Unit</Label>
                  <Input 
                    value={editingItem?.unit || ''} 
                    onChange={(e) => setEditingItem(prev => prev ? {...prev, unit: e.target.value} : null)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select 
                  value={editingItem?.status}
                  onValueChange={(v: any) => setEditingItem(prev => prev ? {...prev, status: v} : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assigned To</Label>
                <Select 
                  value={editingItem?.assignedTo}
                  onValueChange={(v: string) => setEditingItem(prev => prev ? {...prev, assignedTo: v} : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditItem}>Update Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Search inventory..." 
          className="pl-10 h-11 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const emp = employees.find(e => e.id === item.assignedTo);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity} {item.unit}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'available' ? 'default' : 'secondary'} className="capitalize">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {emp ? (
                      <div className="flex items-center gap-2 text-xs">
                        <User className="w-3 h-3" /> {emp.name}
                      </div>
                    ) : '--'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary"
                        onClick={() => {
                          setEditingItem(item);
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
                            <DialogTitle>Delete Item</DialogTitle>
                          </DialogHeader>
                          <p className="py-4 text-slate-600">
                            Are you sure you want to delete <strong>{item.name}</strong>?
                          </p>
                          <DialogFooter>
                            <DialogClose render={<Button variant="outline">Cancel</Button>} />
                            <Button variant="destructive" onClick={() => deleteItem(item.id)}>Delete</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
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
