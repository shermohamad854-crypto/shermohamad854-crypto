import React, { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Lock, 
  Camera, 
  RefreshCw, 
  Save,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfileViewProps {
  profile: UserProfile;
}

export default function UserProfileView({ profile }: UserProfileViewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile.photoURL || '');
  const [isResetting, setIsResetting] = useState(false);
  
  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      // Update Auth Profile
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL
      });

      // Update Firestore Profile
      await updateDoc(doc(db, 'users', profile.id), {
        displayName,
        photoURL
      });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectPasswordUpdate = async () => {
    if (!auth.currentUser) return;
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('For security, please log out and log back in to change your password directly, or use the reset link below.');
      } else {
        toast.error(error.message || 'Failed to update password');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!profile.email) return;
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, profile.email);
      toast.success('Password reset link sent to your email. Please check your inbox.');
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send reset link');
    } finally {
      setIsResetting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-slate-800">My Profile</h3>
        <p className="text-slate-500">Manage your personal information and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <Card className="lg:col-span-1 border-none shadow-sm h-fit">
          <CardContent className="pt-8 text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 mx-auto">
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-slate-300" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </label>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-slate-900">{profile.displayName || 'New User'}</h4>
              <p className="text-sm text-slate-500 capitalize">{profile.role}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Shield className="w-4 h-4 text-slate-400" />
                <span className="capitalize">{profile.role} Access Level</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your display name and profile picture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Username / Email</Label>
                  <Input value={profile.email} disabled className="bg-slate-50 cursor-not-allowed" />
                  <p className="text-[10px] text-slate-400 italic">Username cannot be changed for security reasons.</p>
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profile Photo URL</Label>
                  <Input 
                    value={photoURL} 
                    onChange={(e) => setPhotoURL(e.target.value)} 
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" /> Security & Password
              </CardTitle>
              <CardDescription>Update your password directly or request a reset link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleDirectPasswordUpdate} 
                  disabled={isUpdatingPassword}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
                >
                  {isUpdatingPassword ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                  Update Password
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Or use email reset</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl flex gap-3 items-start">
                <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Email Verification Link</p>
                  <p className="text-xs text-amber-700 mt-1">
                    If you've forgotten your current password or need to reset it via email, 
                    we can send a verification link to your registered email.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={handlePasswordReset}
                  disabled={isResetting}
                >
                  {isResetting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send Reset Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
