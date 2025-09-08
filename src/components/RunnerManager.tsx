import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { toast } from "sonner";

interface Runner {
  id: string;
  participant_id: string | null;
  bib_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  category: string | null;
  race_distance: string | null;
  registration_date: string;
}

interface RunnerManagerProps {
  onBack: () => void;
}

const RunnerManager = ({ onBack }: RunnerManagerProps) => {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRunners = async () => {
    try {
      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .order('registration_date', { ascending: false });

      if (error) {
        toast.error("Error fetching runners: " + error.message);
        return;
      }

      setRunners(data || []);
    } catch (error) {
      toast.error("An error occurred while fetching runners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunners();
  }, []);

  const filteredRunners = runners.filter(runner =>
    runner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    runner.bib_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (runner.participant_id && runner.participant_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const createRaceKits = async () => {
    try {
      setLoading(true);
      const kitsToCreate = runners.map(runner => ({
        kit_number: runner.bib_number,
        runner_id: runner.id,
        status: 'pending',
        contents: []
      }));

      const { error } = await supabase
        .from('race_kits')
        .insert(kitsToCreate);

      if (error) {
        toast.error("Error creating race kits: " + error.message);
        return;
      }

      toast.success(`Successfully created ${kitsToCreate.length} race kits!`);
    } catch (error) {
      toast.error("An error occurred while creating race kits");
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-2xl font-bold text-foreground">Runner Management</h1>
              <p className="text-sm text-muted-foreground">Manage race participants and their information</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search runners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading runners...</div>
        ) : (
          <div className="grid gap-4">
            {filteredRunners.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm ? "No runners found matching your search." : "No runners found. Upload runner data to get started."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRunners.map((runner) => (
                <Card key={runner.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {runner.full_name}
                          <span className="text-sm font-normal text-muted-foreground">
                            (Bib: {runner.bib_number})
                          </span>
                        </CardTitle>
                        <CardDescription>
                          {runner.participant_id && `ID: ${runner.participant_id} • `}
                          {runner.category} • {runner.race_distance}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Email: {runner.email || 'Not provided'}</div>
                      <div>Phone: {runner.phone || 'Not provided'}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default RunnerManager;