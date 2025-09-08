import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, ClipboardCheck, LogOut, Plus, Settings } from "lucide-react";
import { toast } from "sonner";

interface DashboardProps {
  user: User;
  onNavigate: (page: string) => void;
}

const Dashboard = ({ user, onNavigate }: DashboardProps) => {
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRunners: 0,
    availableKits: 0,
    collectedKits: 0,
    collectionRate: 0
  });

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Successfully signed out!");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      setUserRole(data?.role || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch total runners
      const { count: totalRunners } = await supabase
        .from('runners')
        .select('*', { count: 'exact', head: true });

      // Fetch available kits (pending status)
      const { count: availableKits } = await supabase
        .from('race_kits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch collected kits
      const { count: collectedKits } = await supabase
        .from('race_kits')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'collected');

      // Calculate collection rate
      const totalKits = (availableKits || 0) + (collectedKits || 0);
      const collectionRate = totalKits > 0 ? Math.round(((collectedKits || 0) / totalKits) * 100) : 0;

      setStats({
        totalRunners: totalRunners || 0,
        availableKits: availableKits || 0,
        collectedKits: collectedKits || 0,
        collectionRate
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUserRole();
  }, [user.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Race Kit Manager</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user.email}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSignOut} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {loading ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRunners}</div>
              <p className="text-xs text-muted-foreground">Registered participants</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Kits</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableKits}</div>
              <p className="text-xs text-muted-foreground">Ready for distribution</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collected Kits</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.collectedKits}</div>
              <p className="text-xs text-muted-foreground">Successfully distributed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.collectionRate}%</div>
              <p className="text-xs text-muted-foreground">Kits distributed</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Manage Runners
              </CardTitle>
              <CardDescription>
                Add, edit, and manage race participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => onNavigate('runners')}>
                <Plus className="h-4 w-4 mr-2" />
                Manage Runners
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Kit Collection
              </CardTitle>
              <CardDescription>
                Process kit distributions and collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => onNavigate('collector')}>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Collect Kits
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Panel Card - Only show for admin users */}
        {userRole === 'admin' && (
          <Card className="cursor-pointer hover:shadow-md transition-shadow mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage system users, roles, and access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => onNavigate('admin')}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Getting Started Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to set up your race kit management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Add Runners</h4>
                  <p className="text-sm text-muted-foreground">
                    Start by registering all race participants with their contact details and race information.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Create Race Kits</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up your race kit inventory with kit numbers, sizes, and assign them to runners.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Manage Collections</h4>
                  <p className="text-sm text-muted-foreground">
                    Process kit collections, verify identities, and maintain detailed logs of all distributions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="py-6 px-4 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © ApizFit6007 2025
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;