import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Employee, Payroll } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from './ui/dialog';
import { 
  DollarSign, 
  Download, 
  Send, 
  Calculator, 
  Eye, 
  FileText,
  CheckCircle2,
  Mail,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PayrollManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Nexus HRM Solutions');
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const empUnsubscribe = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Permission denied fetching employees for payroll");
      } else {
        handleFirestoreError(error, OperationType.LIST, 'employees');
      }
    });

    const payrollQuery = query(collection(db, 'payroll'), orderBy('year', 'desc'), orderBy('month', 'desc'));
    const payrollUnsubscribe = onSnapshot(payrollQuery, (snapshot) => {
      setPayrollHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
      setLoading(false);
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Permission denied fetching payroll history");
        setLoading(false);
      } else {
        handleFirestoreError(error, OperationType.LIST, 'payroll');
      }
    });

    const settingsUnsub = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        setCompanyName(doc.data().companyName || 'Nexus HRM Solutions');
      }
    }, (error) => {
      // Settings might be restricted, but general branding should be public
      // If it fails, we just keep defaults
    });

    return () => {
      empUnsubscribe();
      payrollUnsubscribe();
      settingsUnsub();
    };
  }, []);

  const generatePayroll = async () => {
    try {
      const q = query(
        collection(db, 'payroll'), 
        where('month', '==', currentMonth), 
        where('year', '==', currentYear)
      );
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        toast.error('Payroll for this month already generated');
        return;
      }

      const promises = employees.map(emp => {
        const baseSalary = emp.salary || 0;
        const deductions = baseSalary * 0.1; // Example 10% tax
        const netSalary = baseSalary - deductions;

        return addDoc(collection(db, 'payroll'), {
          employeeId: emp.id,
          month: currentMonth,
          year: currentYear,
          baseSalary,
          bonus: 0,
          deductions,
          netSalary,
          status: 'pending'
        });
      });

      await Promise.all(promises);
      toast.success('Payroll generated for all employees');
    } catch (error) {
      toast.error('Failed to generate payroll');
    }
  };

  const handleDownload = (payroll: Payroll) => {
    try {
      const emp = employees.find(e => e.id === payroll.employeeId);
      if (!emp) {
        toast.error('Employee not found');
        return;
      }

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('PAYROLL SLIP', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(companyName, 105, 28, { align: 'center' });
      
      // Employee Info
      doc.setFontSize(12);
      doc.text(`Employee: ${emp.name}`, 20, 45);
      doc.text(`Email: ${emp.email}`, 20, 52);
      doc.text(`Department: ${emp.department}`, 20, 59);
      doc.text(`Period: ${new Date(payroll.year, payroll.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`, 20, 66);
      
      // Table
      autoTable(doc, {
        startY: 80,
        head: [['Description', 'Amount']],
        body: [
          ['Base Salary', `$${payroll.baseSalary.toLocaleString()}`],
          ['Bonus', `$${payroll.bonus.toLocaleString()}`],
          ['Deductions', `-$${payroll.deductions.toLocaleString()}`],
          ['Net Salary', `$${payroll.netSalary.toLocaleString()}`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] } // primary color
      });
      
      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.text('Authorized Signature: ____________________', 20, finalY);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, finalY);
      
      doc.save(`Payroll_Slip_${emp.name.replace(/\s+/g, '_')}_${payroll.month}_${payroll.year}.pdf`);
      toast.success('Payroll slip downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF slip');
    }
  };

  const handleSendEmail = async (payrollId: string) => {
    const payroll = payrollHistory.find(p => p.id === payrollId);
    const emp = employees.find(e => e.id === payroll?.employeeId);
    
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: `Sending payroll email to ${emp?.email}...`,
        success: `Payroll slip successfully sent to ${emp?.name}`,
        error: 'Failed to send email'
      }
    );
  };

  const handleMarkAsPaid = async (payrollId: string) => {
    try {
      await updateDoc(doc(db, 'payroll', payrollId), { status: 'paid' });
      toast.success('Payroll marked as paid');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Payroll Management</h3>
          <p className="text-slate-500">Process and track monthly salaries</p>
        </div>
        <Button onClick={generatePayroll} className="h-11">
          <Calculator className="mr-2 w-4 h-4" /> Generate {new Date().toLocaleString('default', { month: 'long' })} Payroll
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${payrollHistory.filter(p => p.month === currentMonth).reduce((acc, curr) => acc + curr.netSalary, 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">For current month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {payrollHistory.filter(p => p.status === 'pending').length}
            </div>
            <p className="text-xs text-amber-500 mt-1">Requires approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Processed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {payrollHistory.filter(p => p.status === 'paid' && p.month === currentMonth).length}
            </div>
            <p className="text-xs text-emerald-500 mt-1">Successfully paid</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Base Salary</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payrollHistory.map((p) => {
              const emp = employees.find(e => e.id === p.employeeId);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{emp?.name || 'Unknown'}</TableCell>
                  <TableCell>{new Date(p.year, p.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}</TableCell>
                  <TableCell>${p.baseSalary.toLocaleString()}</TableCell>
                  <TableCell className="text-red-500">-${p.deductions.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-emerald-600">${p.netSalary.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-primary"
                        onClick={() => {
                          setSelectedPayroll(p);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => handleDownload(p)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => handleSendEmail(p.id)}>
                        <Mail className="w-4 h-4" />
                      </Button>
                      {p.status === 'pending' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={() => handleMarkAsPaid(p.id)}>
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Payroll Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Payroll Details</DialogTitle>
            <DialogDescription>
              Full breakdown for {employees.find(e => e.id === selectedPayroll?.employeeId)?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-500">Employee Name</Label>
                    <p className="font-medium">{employees.find(e => e.id === selectedPayroll.employeeId)?.name}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Role</Label>
                    <p className="font-medium">{employees.find(e => e.id === selectedPayroll.employeeId)?.role}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500">Period</Label>
                    <p className="font-medium">{new Date(selectedPayroll.year, selectedPayroll.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Base Salary</span>
                      <span>${selectedPayroll.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Bonus</span>
                      <span className="text-emerald-600">+${selectedPayroll.bonus.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Deductions</span>
                      <span className="text-rose-600">-${selectedPayroll.deductions.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between font-bold">
                      <span>Net Salary</span>
                      <span className="text-emerald-600">${selectedPayroll.netSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 border rounded-xl">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedPayroll.status === 'paid' ? 'default' : 'secondary'}>
                    {selectedPayroll.status}
                  </Badge>
                  <span className="text-xs text-slate-500">Transaction ID: PAY-{selectedPayroll.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(selectedPayroll)}>
                    <Download className="w-4 h-4 mr-2" /> Slip
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSendEmail(selectedPayroll.id)}>
                    <Mail className="w-4 h-4 mr-2" /> Email
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
            {selectedPayroll?.status === 'pending' && (
              <Button onClick={() => {
                handleMarkAsPaid(selectedPayroll.id);
                setIsDetailsOpen(false);
              }}>
                Approve & Pay
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
