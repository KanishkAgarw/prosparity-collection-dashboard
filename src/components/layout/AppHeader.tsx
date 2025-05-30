
import { useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Download, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import UploadApplicationDialog from "@/components/UploadApplicationDialog";
import AdminUserManagement from "@/components/AdminUserManagement";

interface AppHeaderProps {
  onExport: () => void;
  onApplicationAdded: () => void;
}

const AppHeader = ({ onExport, onApplicationAdded }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserName, fetchProfiles } = useUserProfiles();

  // Fetch user profile when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchProfiles([user.id]);
    }
  }, [user?.id, fetchProfiles]);

  const userDisplayName = useMemo(() => {
    if (!user) return '';
    return getUserName(user.id, user.email || '');
  }, [user, getUserName]);

  const isAdmin = user?.email === 'kanishk@prosparity.in';

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        toast.error("Error signing out");
      } else {
        toast.success("Signed out successfully");
        navigate('/auth');
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out");
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/879123ce-9339-4aec-90c9-3857e3b77417.png" 
            alt="Prosparity Logo" 
            className="h-7 w-auto"
          />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Collection Dashboard</h1>
          </div>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onExport} className="h-8 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            {isAdmin && <UploadApplicationDialog onApplicationsAdded={onApplicationAdded} />}
            {isAdmin && <AdminUserManagement isAdmin={isAdmin} />}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium truncate max-w-[120px]">{userDisplayName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900 h-8 text-xs"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile User Info and Log Out */}
        <div className="sm:hidden flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium truncate max-w-[150px]">{userDisplayName}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-900 h-8"
          >
            Log Out
          </Button>
        </div>
      </div>
    </>
  );
};

export default AppHeader;
