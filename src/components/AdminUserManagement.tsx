
import { useState } from 'react';
import { Settings, UserPlus, Users, Eye, EyeOff, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface AdminUserManagementProps {
  isAdmin: boolean;
}

const AdminUserManagement = ({ isAdmin }: AdminUserManagementProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [resetPassword, setResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('Creating user with:', { email, fullName, resetPassword });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: undefined,
        }
      });

      console.log('User creation response:', { data, error });

      if (error) {
        console.error('User creation error:', error);
        if (error.message.includes('User already registered')) {
          toast.error('User already exists with this email');
        } else {
          toast.error(error.message);
        }
      } else {
        console.log('User created successfully');
        toast.success(`User created successfully! Email: ${email}`);
        
        // Reset form
        setEmail('');
        setPassword('');
        setFullName('');
        setResetPassword(false);
        setOpen(false);
      }
    } catch (error) {
      console.error('Unexpected error creating user:', error);
      toast.error('An error occurred while creating the user');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const downloadTemplate = () => {
    // Create template data with example row
    const templateData = [
      {
        'Email (User ID)': 'user@example.com',
        'Full Name': 'John Doe',
        'Password': 'SecurePassword123'
      }
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 25 }, // Email (User ID)
      { wch: 20 }, // Full Name
      { wch: 15 }  // Password
    ];
    
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Template');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `user-bulk-upload-template-${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
    
    toast.success('Template downloaded successfully!');
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={downloadTemplate}
        className="hidden sm:flex"
      >
        <Download className="h-4 w-4 mr-2" />
        Download Template
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              User Management
            </DialogTitle>
            <DialogDescription>
              Create new users and manage existing accounts. Users will receive login credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (User ID) *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password *</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={generatePassword}
                  className="text-xs"
                >
                  Generate
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="resetPassword" 
                checked={resetPassword}
                onCheckedChange={(checked) => setResetPassword(checked as boolean)}
              />
              <Label 
                htmlFor="resetPassword" 
                className="text-sm font-normal cursor-pointer"
              >
                Send password reset email after creation
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
