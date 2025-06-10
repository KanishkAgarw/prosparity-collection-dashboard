import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Upload, Plus, Menu, BarChart, Settings } from "lucide-react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import ExportDialog from "@/components/ExportDialog";
import UploadApplicationDialog from "@/components/UploadApplicationDialog";
import UserManagementDialog from "@/components/UserManagementDialog";

interface AppHeaderProps {
  onExportFull: () => void;
  onExportPtpComments: () => void;
  onApplicationAdded: () => void;
}

const AppHeader = ({ onExportFull, onExportPtpComments, onApplicationAdded }: AppHeaderProps) => {
  const { isAdmin } = useUserRoles();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Collection Monitor</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin-settings')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ExportDialog onExportFull={onExportFull} onExportPtpComments={onExportPtpComments} />
          
        <UploadApplicationDialog onSuccess={onApplicationAdded} />
          
        {isAdmin && <UserManagementDialog />}
        
        {/* Mobile menu */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/analytics')}>
                <BarChart className="mr-2 h-4 w-4" />
                Analytics
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin-settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Settings
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-2">
          <ExportDialog onExportFull={onExportFull} onExportPtpComments={onExportPtpComments} />
          
          <UploadApplicationDialog onSuccess={onApplicationAdded} />
          
          {isAdmin && <UserManagementDialog />}
          
          <span className="text-sm text-gray-600">
            Welcome, {user?.email}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
