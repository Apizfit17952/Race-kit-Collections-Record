import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Search, Users, UserX, UserCheck, Shield, Mail, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  email?: string;
  role?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel = ({ onBack }: AdminPanelProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | 'delete'>('deactivate');
  const [processing, setProcessing] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, let's check what columns exist in the profiles table
      const { data: tableInfo, error: tableError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (tableError) {
        console.error('Table structure error:', tableError);
        setError(`Database error: ${tableError.message}`);
        return;
      }

      // Now fetch all users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        setError(`Error fetching users: ${error.message}`);
        return;
      }

      console.log('Fetched users:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      setError("An unexpected error occurred while fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const email = user.email || '';
    const role = user.role || '';
    const status = user.status || 'active';
    
    const matchesSearch = email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    const matchesRole = roleFilter === "all" || role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleUserAction = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      let error;

      if (actionType === 'deactivate') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ status: 'inactive' })
          .eq('user_id', selectedUser.user_id);
        error = updateError;
      } else if (actionType === 'activate') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ status: 'active' })
          .eq('user_id', selectedUser.user_id);
        error = updateError;
      } else if (actionType === 'delete') {
        // Hard delete - remove from profiles table
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', selectedUser.user_id);
        error = deleteError;
      }

      if (error) {
        toast.error(`Error ${actionType === 'deactivate' ? 'deactivating' : actionType === 'activate' ? 'activating' : 'deleting'} user: ` + error.message);
        return;
      }

      const actionText = actionType === 'deactivate' ? 'deactivated' : actionType === 'activate' ? 'activated' : 'deleted';
      toast.success(`User successfully ${actionText}!`);
      
      // Refresh user list
      fetchUsers();
      setIsConfirmDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error("An error occurred while processing the request");
    } finally {
      setProcessing(false);
    }
  };

  const openConfirmDialog = (user: UserProfile, action: 'deactivate' | 'activate' | 'delete') => {
    setSelectedUser(user);
    setActionType(action);
    setIsConfirmDialogOpen(true);
  };

  const getStatusBadge = (status: string | undefined) => {
    const userStatus = status || 'active';
    return userStatus === 'active' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <UserX className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getRoleBadge = (role: string | undefined) => {
    const userRole = role || 'user';
    const roleColors = {
      admin: "bg-red-100 text-red-800",
      organizer: "bg-blue-100 text-blue-800",
      user: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge variant="outline" className={roleColors[userRole as keyof typeof roleColors]}>
        <Shield className="h-3 w-3 mr-1" />
        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
      </Badge>
    );
  };

  const getActionButtons = (user: UserProfile) => {
    const status = user.status || 'active';
    
    if (status === 'active') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openConfirmDialog(user, 'deactivate')}
          className="text-orange-600 border-orange-200 hover:bg-orange-50"
        >
          <UserX className="h-4 w-4 mr-1" />
          Deactivate
        </Button>
      );
    } else {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openConfirmDialog(user, 'activate')}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Activate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openConfirmDialog(user, 'delete')}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      );
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-foreground">User Management</h1>
                <p className="text-sm text-muted-foreground">Manage system users and access permissions</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                Setup Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-red-700">
                  The user management system requires database setup. Please run the following SQL in your Supabase dashboard:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                  <pre className="whitespace-pre-wrap">
{`-- Add status field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Update existing profiles to have 'active' status
UPDATE public.profiles SET status = 'active' WHERE status IS NULL;

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);`}
                  </pre>
                </div>
                <Button onClick={fetchUsers} className="mt-4">
                  Try Again After Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-sm text-muted-foreground">Manage system users and access permissions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="organizer">Organizer</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => (u.status || 'active') === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <UserX className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {users.filter(u => u.status === 'inactive').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || roleFilter !== "all" 
                      ? "No users found matching your filters." 
                      : "No users found."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {user.email || `User ${user.user_id.slice(0, 8)}...`}
                            {getStatusBadge(user.status)}
                            {getRoleBadge(user.role)}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {user.created_at ? `Joined ${new Date(user.created_at).toLocaleDateString()}` : 'Date not available'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getActionButtons(user)}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'deactivate' ? 'Deactivate User' : 
               actionType === 'activate' ? 'Activate User' : 'Delete User'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'deactivate' && `Are you sure you want to deactivate ${selectedUser?.email || 'this user'}? They will no longer be able to access the system.`}
              {actionType === 'activate' && `Are you sure you want to reactivate ${selectedUser?.email || 'this user'}? They will regain access to the system.`}
              {actionType === 'delete' && `Are you sure you want to permanently delete ${selectedUser?.email || 'this user'}? This action cannot be undone and will remove all their data.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUserAction}
              disabled={processing}
              variant={actionType === 'delete' ? 'destructive' : 'default'}
            >
              {processing ? 'Processing...' : 
               actionType === 'deactivate' ? 'Deactivate' :
               actionType === 'activate' ? 'Activate' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
