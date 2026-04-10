export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  salary: number;
  status: 'active' | 'on-leave' | 'terminated';
  photoURL?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'paid';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  assignedTo?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'out-of-stock';
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  displayName?: string;
  photoURL?: string;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleName: string;
  nocUrl?: string;
  driverName: string;
  driverContact: string;
  assignmentDate: string;
  approvedBy: string;
  handoverDate?: string;
  status: 'active' | 'maintenance' | 'retired';
}
