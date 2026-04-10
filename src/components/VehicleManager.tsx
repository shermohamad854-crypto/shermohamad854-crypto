import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Car, 
  FileText, 
  User, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Upload,
  ExternalLink,
  X
} from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Vehicle } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    status: 'active',
    assignmentDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const q = query(collection(db, 'vehicles'), orderBy('vehicleNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehicleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];
      setVehicles(vehicleData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'vehicles');
    });

    return () => unsubscribe();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        toast.error('File size too large. Please upload a file smaller than 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVehicle({ ...newVehicle, nocUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVehicle = async () => {
    try {
      if (!newVehicle.vehicleNumber || !newVehicle.vehicleName || !newVehicle.driverName || !newVehicle.driverContact) {
        toast.error('Please fill in all required fields');
        return;
      }

      setIsSubmitting(true);
      await addDoc(collection(db, 'vehicles'), newVehicle);
      setIsAddDialogOpen(false);
      setNewVehicle({
        status: 'active',
        assignmentDate: new Date().toISOString().split('T')[0],
      });
      toast.success('Vehicle added successfully');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle record?')) {
      try {
        await deleteDoc(doc(db, 'vehicles', id));
        toast.success('Vehicle record deleted');
      } catch (error) {
        toast.error('Failed to delete vehicle');
      }
    }
  };

  const updateStatus = async (id: string, status: Vehicle['status']) => {
    try {
      await updateDoc(doc(db, 'vehicles', id), { status });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Active</Badge>;
      case 'maintenance':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">Maintenance</Badge>;
      case 'retired':
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">Retired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Vehicle Management</h3>
          <p className="text-slate-500">Track and manage company vehicles and assignments</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button className="h-11 px-6" />}>
            <Plus className="mr-2 w-4 h-4" /> Add Vehicle
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vNumber">Vehicle Number</Label>
                  <Input 
                    id="vNumber" 
                    placeholder="e.g. ABC-1234" 
                    value={newVehicle.vehicleNumber || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vName">Vehicle Name</Label>
                  <Input 
                    id="vName" 
                    placeholder="e.g. Toyota Hilux" 
                    value={newVehicle.vehicleName || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicleName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dName">Driver Name</Label>
                  <Input 
                    id="dName" 
                    placeholder="Full Name" 
                    value={newVehicle.driverName || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, driverName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dContact">Driver Contact</Label>
                  <Input 
                    id="dContact" 
                    placeholder="Phone Number" 
                    value={newVehicle.driverContact || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, driverContact: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aDate">Assignment Date</Label>
                  <Input 
                    id="aDate" 
                    type="date" 
                    value={newVehicle.assignmentDate || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, assignmentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hDate">Handover Date (Optional)</Label>
                  <Input 
                    id="hDate" 
                    type="date" 
                    value={newVehicle.handoverDate || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, handoverDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appBy">Approved By</Label>
                  <Input 
                    id="appBy" 
                    placeholder="Person Name" 
                    value={newVehicle.approvedBy || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, approvedBy: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newVehicle.status} 
                    onValueChange={(v: any) => setNewVehicle({ ...newVehicle, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>NOC Document</Label>
                <div className="flex flex-col gap-3">
                  {newVehicle.nocUrl ? (
                    <div className="relative w-full h-32 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                      {newVehicle.nocUrl.startsWith('data:image') ? (
                        <img src={newVehicle.nocUrl} alt="NOC" className="w-full h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-primary" />
                          <span className="text-xs text-slate-500">Document Uploaded</span>
                        </div>
                      )}
                      <button 
                        onClick={() => setNewVehicle({ ...newVehicle, nocUrl: undefined })}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-32 bg-slate-50 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-sm text-slate-600 font-medium">Click to upload NOC</span>
                      <span className="text-xs text-slate-400 mt-1">PDF or Image (Max 1MB)</span>
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddVehicle} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Search by number, name or driver..." 
          className="pl-10 h-11 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Vehicle Info</TableHead>
                <TableHead>Driver Details</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>NOC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredVehicles.map((v) => (
                  <TableRow key={v.id} component={motion.tr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Car className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{v.vehicleNumber}</p>
                          <p className="text-xs text-slate-500">{v.vehicleName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {v.driverName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {v.driverContact}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Assigned: {v.assignmentDate}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          By: {v.approvedBy}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.nocUrl ? (
                        <a 
                          href={v.nocUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View NOC
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No NOC</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={v.status} 
                        onValueChange={(status: any) => updateStatus(v.id, status)}
                      >
                        <SelectTrigger className="w-32 h-8 border-none bg-transparent p-0 focus:ring-0">
                          <SelectValue>{getStatusBadge(v.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-destructive"
                        onClick={() => handleDeleteVehicle(v.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </AnimatePresence>
              {filteredVehicles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p>No vehicles found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
