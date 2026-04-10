import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Mail, 
  Lock,
  RefreshCw,
  Save,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

import UserAccessManager from './UserAccessManager';

export default function AdminPanel() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'Nexus HRM Solutions',
    supportEmail: 'support@nexushrm.com',
    timezone: 'UTC (GMT+0)',
    currency: 'USD ($)',
    logoUrl: ''
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        setSettings(prev => ({ ...prev, ...doc.data() }));
      }
    });
    return () => unsub();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-slate-800">Admin Console</h3>
        <p className="text-slate-500">System configuration and security settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-slate-100">General</TabsTrigger>
          <TabsTrigger value="branding" className="rounded-lg data-[state=active]:bg-slate-100">Branding</TabsTrigger>
          <TabsTrigger value="access" className="rounded-lg data-[state=active]:bg-slate-100">User Access</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-slate-100">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-slate-100">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" /> Organization Settings
              </CardTitle>
              <CardDescription>Configure basic information about your company.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    value={settings.companyName} 
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input 
                    value={settings.supportEmail} 
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    placeholder="support@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input 
                    value={settings.timezone} 
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input 
                    value={settings.currency} 
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" /> Company Branding
              </CardTitle>
              <CardDescription>Upload your company logo and customize the look.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                {settings.logoUrl ? (
                  <div className="relative group">
                    <img src={settings.logoUrl} alt="Logo" className="h-32 object-contain mb-4 rounded-lg" />
                    <button 
                      onClick={() => setSettings({ ...settings, logoUrl: '' })}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Upload Company Logo</p>
                      <p className="text-xs text-slate-500">PNG, JPG up to 2MB</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*"
                        className="max-w-xs mx-auto cursor-pointer"
                        onChange={handleLogoUpload}
                      />
                      <p className="text-[10px] text-slate-400">Or use a URL</p>
                      <Input 
                        type="text" 
                        placeholder="Paste Logo URL here" 
                        className="max-w-xs mx-auto h-8 text-xs"
                        onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Branding
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <UserAccessManager />
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" /> Security & Access
              </CardTitle>
              <CardDescription>Manage authentication methods and user permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">Require 2FA for all admin accounts</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-sm">IP Whitelisting</p>
                    <p className="text-xs text-slate-500">Restrict access to specific IP ranges</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notification Channels
              </CardTitle>
              <CardDescription>Setup how users receive system alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SMTP Server</Label>
                <Input placeholder="smtp.example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input defaultValue="587" />
                </div>
                <div className="space-y-2">
                  <Label>Encryption</Label>
                  <Input defaultValue="TLS" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" /> Data Management
              </CardTitle>
              <CardDescription>Backup and restore your system data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-4">
                <Database className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <p className="font-medium">Automated Backups</p>
                  <p className="text-sm text-slate-500">Last backup performed 2 hours ago</p>
                </div>
                <Button variant="outline">Download Latest Backup</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
