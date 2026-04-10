import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, signIn, logout, db, signInEmail, signUpEmail, handleFirestoreError, OperationType } from './lib/firebase';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { toast } from 'sonner';
import { UserProfile } from './types';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  LayoutDashboard, 
  LogOut, 
  LogIn,
  User as UserIcon,
  Menu,
  X,
  CheckSquare,
  BarChart3,
  Settings,
  Package,
  Mail,
  Lock,
  ArrowRight,
  Car
} from 'lucide-react';
import EmployeeList from './components/EmployeeList';
import AttendanceTracker from './components/AttendanceTracker';
import PayrollManager from './components/PayrollManager';
import DashboardOverview from './components/DashboardOverview';
import TaskManager from './components/TaskManager';
import ReportingDashboard from './components/ReportingDashboard';
import AdminPanel from './components/AdminPanel';
import InventoryManager from './components/InventoryManager';
import UserProfileView from './components/UserProfileView';
import VehicleManager from './components/VehicleManager';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [companySettings, setCompanySettings] = useState({
    companyName: 'Nexus HRM',
    logoUrl: ''
  });
  
  // Login State
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user profile exists, if not create it
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const isDefaultAdmin = user.email === "shermohamad854@gmail.com";
            const newProfile = {
              email: user.email,
              role: isDefaultAdmin ? 'admin' : 'employee',
              displayName: user.displayName || user.email?.split('@')[0] || 'New User',
              photoURL: user.photoURL || ''
            };
            await setDoc(userRef, newProfile);
            setUserProfile({ id: user.uid, ...newProfile } as UserProfile);
          } else {
            setUserProfile({ id: userSnap.id, ...userSnap.data() } as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // If we can't read the profile yet (e.g. rules propagation delay), 
          // we'll rely on the onSnapshot listener below which has its own error handling
        }

        // Listen for profile changes (role updates)
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUserProfile({ id: snap.id, ...snap.data() } as UserProfile);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        });
      } else {
        setUserProfile(null);
      }
      setUser(user);
      setLoading(false);
    });

    const settingsUnsub = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCompanySettings({
          companyName: data.companyName || 'Nexus HRM',
          logoUrl: data.logoUrl || ''
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/general');
    });

    return () => {
      unsubscribe();
      settingsUnsub();
    };
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsAuthenticating(true);
    try {
      if (loginMode === 'login') {
        await signInEmail(email, password);
        toast.success('Welcome back!');
      } else {
        await signUpEmail(email, password);
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center space-y-6"
        >
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
            {companySettings.logoUrl ? (
              <img src={companySettings.logoUrl} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Users className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{companySettings.companyName}</h1>
            <p className="text-slate-500">Professional Human Resource Management System</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email"
                  type="email" 
                  placeholder="name@company.com" 
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="password"
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-lg font-medium" disabled={isAuthenticating}>
              {isAuthenticating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>{loginMode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" onClick={signIn} className="w-full h-11 font-medium" disabled={isAuthenticating}>
            <LogIn className="mr-2 h-4 w-4" /> Google Account
          </Button>

          <p className="text-sm text-slate-500">
            {loginMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setLoginMode(loginMode === 'login' ? 'signup' : 'login')}
              className="text-primary font-semibold hover:underline"
            >
              {loginMode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  const role = userProfile?.role || 'employee';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'manager', 'employee'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['admin', 'hr', 'manager'] },
    { id: 'attendance', label: 'Attendance', icon: Calendar, roles: ['admin', 'hr', 'manager', 'employee'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['admin', 'hr', 'manager', 'employee'] },
    { id: 'vehicles', label: 'Vehicles', icon: Car, roles: ['admin', 'hr', 'manager'] },
    { id: 'payroll', label: 'Payroll', icon: CreditCard, roles: ['admin', 'hr', 'employee'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'hr', 'manager'] },
    { id: 'reporting', label: 'Reporting', icon: BarChart3, roles: ['admin', 'hr'] },
    { id: 'profile', label: 'My Profile', icon: UserIcon, roles: ['admin', 'hr', 'manager', 'employee'] },
    { id: 'admin', label: 'Admin', icon: Settings, roles: ['admin'] },
  ].filter(item => item.roles.includes(role));

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 shadow-sm`}
      >
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            {companySettings.logoUrl ? (
              <img src={companySettings.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Users className="w-5 h-5 text-white" />
            )}
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight truncate">{companySettings.companyName}</span>}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 font-medium' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center gap-3 p-2 rounded-xl ${isSidebarOpen ? 'bg-slate-50' : ''}`}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-slate-500" />
              </div>
            )}
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] py-0 px-1 capitalize h-4">
                    {role}
                  </Badge>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            )}
            <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              {isSidebarOpen ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 capitalize">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardOverview role={role} />}
              {activeTab === 'employees' && <EmployeeList />}
              {activeTab === 'attendance' && <AttendanceTracker />}
              {activeTab === 'tasks' && <TaskManager />}
              {activeTab === 'payroll' && <PayrollManager />}
              {activeTab === 'inventory' && <InventoryManager />}
              {activeTab === 'vehicles' && <VehicleManager />}
              {activeTab === 'reporting' && <ReportingDashboard />}
              {activeTab === 'profile' && userProfile && <UserProfileView profile={userProfile} />}
              {activeTab === 'admin' && <AdminPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
