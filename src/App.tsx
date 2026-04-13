import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, signIn, logout, db, signInEmail, signUpEmail, handleFirestoreError, OperationType } from './lib/firebase';
import { Button } from './components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
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
  
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  
  // Login State
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Cleanup previous profile listener if any
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial fetch
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserProfile({ id: userSnap.id, ...userSnap.data() } as UserProfile);
          } else {
            // Create profile if it doesn't exist
            // Match firestore rules: admin requires verified email
            const isDefaultAdmin = firebaseUser.email === "shermohamad854@gmail.com" && firebaseUser.emailVerified;
            const newProfile = {
              email: firebaseUser.email,
              role: isDefaultAdmin ? 'admin' : 'employee',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
              photoURL: firebaseUser.photoURL || ''
            };
            await setDoc(userRef, newProfile);
            setUserProfile({ id: firebaseUser.uid, ...newProfile } as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching initial user profile:", error);
        }

        // Start real-time listener
        profileUnsub = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUserProfile({ id: snap.id, ...snap.data() } as UserProfile);
          }
        }, (error) => {
          if (auth.currentUser) {
            console.error("Profile listener error:", error);
          }
        });
      } else {
        setUser(null);
        setUserProfile(null);
      }
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
      // Settings might be restricted, but general branding should be public
      // If it fails, we just keep defaults
    });

    return () => {
      unsubscribe();
      if (profileUnsub) profileUnsub();
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
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please sign in instead.');
        setLoginMode('login');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
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

  const role = userProfile?.role || 'employee';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          <div className="p-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="bg-primary w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                {companySettings.logoUrl ? (
                  <img src={companySettings.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Users className="w-6 h-6 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Welcome to {companySettings.companyName}</h1>
              <p className="text-slate-500">Please sign in to access your workspace</p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="name@company.com" 
                    className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-primary"
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
                    className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20" disabled={isAuthenticating}>
                {isAuthenticating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>{loginMode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="ml-2 w-4 h-4" /></>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-medium">Or continue with</span></div>
            </div>

            <Button variant="outline" onClick={signIn} className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors" disabled={isAuthenticating}>
              <LogIn className="mr-2 h-4 w-4" /> Google Account
            </Button>

            <p className="text-center text-sm text-slate-500">
              {loginMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => setLoginMode(loginMode === 'login' ? 'signup' : 'login')}
                className="text-primary font-bold hover:underline"
              >
                {loginMode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400">© 2024 {companySettings.companyName}. All rights reserved.</p>
          </div>
        </motion.div>
        <Toaster />
      </div>
    );
  }

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
