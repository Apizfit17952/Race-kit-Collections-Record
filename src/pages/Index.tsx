import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, ClipboardCheck, Shield } from "lucide-react";
import AuthPage from "@/components/AuthPage";
import Dashboard from "@/components/Dashboard";
import RunnerManager from "@/components/RunnerManager";
import KitCollector from "@/components/KitCollector";
import AdminPanel from "@/components/AdminPanel";
import ResetPassword from "@/components/ResetPassword";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderUserContent = () => {
    switch (currentPage) {
      case 'runners':
        return <RunnerManager onBack={() => setCurrentPage('dashboard')} />;
      case 'collector':
        return <KitCollector onBack={() => setCurrentPage('dashboard')} />;
      case 'admin':
        // Check if user is admin before allowing access
        if (userRole === 'admin') {
          return <AdminPanel onBack={() => setCurrentPage('dashboard')} />;
        } else {
          // Redirect non-admin users back to dashboard
          setCurrentPage('dashboard');
          return <Dashboard user={user!} onNavigate={setCurrentPage} />;
        }
      case 'reset-password':
        return <ResetPassword />;
      default:
        return <Dashboard user={user!} onNavigate={setCurrentPage} />;
    }
  };

  if (user) {
    return renderUserContent();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            Race Kit Management System
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Streamline your race event logistics with our comprehensive kit management platform. 
            Track runners, manage kits, and handle collections efficiently.
          </p>
          <AuthPage />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            How to Get Started
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>1. Sign Up</CardTitle>
                <CardDescription>
                  Create your account to access the race kit management system
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>2. Add Runners</CardTitle>
                <CardDescription>
                  Register race participants and manage their information
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Package className="h-8 w-8 text-primary mb-2" />
                <CardTitle>3. Manage Kits</CardTitle>
                <CardDescription>
                  Track race kits, assign them to runners, and monitor inventory
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <ClipboardCheck className="h-8 w-8 text-primary mb-2" />
                <CardTitle>4. Handle Collections</CardTitle>
                <CardDescription>
                  Process kit collections and maintain detailed logs
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Runner Management</h3>
              <p className="text-muted-foreground">
                Keep track of all race participants with detailed profiles including contact information, 
                race categories, and collection status.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Kit Tracking</h3>
              <p className="text-muted-foreground">
                Monitor race kit inventory, assign kits to specific runners, and track their 
                distribution status in real-time.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Representative System</h3>
              <p className="text-muted-foreground">
                Allow authorized representatives to collect kits on behalf of runners with 
                proper verification and logging.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Audit Trail</h3>
              <p className="text-muted-foreground">
                Maintain complete collection logs with timestamps, collector information, 
                and verification details for full accountability.
              </p>
            </div>
          </div>
        </div>
      </section>
      <footer className="py-8 px-4 border-t bg-muted/30">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          © ApizFit6007 2025
        </div>
      </footer>
    </div>
  );
};

export default Index;
