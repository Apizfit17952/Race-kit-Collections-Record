import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, Package, Users, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface RaceKit {
  id: string;
  kit_number: string;
  status: string;
  runner_id: string;
  runners: {
    id: string;
    participant_id: string | null;
    full_name: string;
    bib_number: string;
    category: string | null;
    race_distance: string | null;
  } | null;
}

interface Representative {
  id: string;
  full_name: string;
  id_number: string;
  id_type: string;
  phone: string | null;
  relationship: string | null;
}

interface KitCollectorProps {
  onBack: () => void;
}

const KitCollector = ({ onBack }: KitCollectorProps) => {
  const [raceKits, setRaceKits] = useState<RaceKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [collectingKit, setCollectingKit] = useState<string | null>(null);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [selectedKit, setSelectedKit] = useState<RaceKit | null>(null);
  const [collectionType, setCollectionType] = useState<'self' | 'representative'>('self');
  const [representativeDetails, setRepresentativeDetails] = useState({
    full_name: '',
    id_number: '',
    id_type: 'ic',
    phone: '',
    relationship: ''
  });
  const [notes, setNotes] = useState('');

  const fetchRaceKits = async () => {
    try {
      const { data, error } = await supabase
        .from('race_kits')
        .select(`
          *,
          runners (
            id,
            participant_id,
            full_name,
            bib_number,
            category,
            race_distance
          )
        `)
        .order('kit_number');

      if (error) {
        toast.error("Error fetching race kits: " + error.message);
        return;
      }

      setRaceKits(data || []);
    } catch (error) {
      toast.error("An error occurred while fetching race kits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaceKits();
  }, []);

  const filteredKits = raceKits.filter(kit =>
    kit.kit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kit.runners?.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (kit.runners?.participant_id && kit.runners.participant_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openCollectionDialog = (kit: RaceKit) => {
    setSelectedKit(kit);
    setCollectionType('self');
    setRepresentativeDetails({
      full_name: '',
      id_number: '',
      id_type: 'ic',
      phone: '',
      relationship: ''
    });
    setNotes('');
    setIsCollectionDialogOpen(true);
  };

  const collectKit = async () => {
    if (!selectedKit) return;

    // Validate representative details if representative collection
    if (collectionType === 'representative') {
      if (!representativeDetails.full_name || !representativeDetails.id_number) {
        toast.error("Please fill in representative's full name and ID number");
        return;
      }
    }

    setCollectingKit(selectedKit.id);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to collect kits");
        return;
      }

      let representativeId = null;

      // If representative collection, create representative with live details
      if (collectionType === 'representative') {
        const { data: newRep, error: repError } = await supabase
          .from('representatives')
          .insert({
            full_name: representativeDetails.full_name,
            id_number: representativeDetails.id_number,
            id_type: representativeDetails.id_type,
            phone: representativeDetails.phone || null,
            relationship: representativeDetails.relationship || null
          })
          .select()
          .single();

        if (repError) {
          toast.error("Error creating representative: " + repError.message);
          return;
        }

        representativeId = newRep.id;
      }

      // Create collection record
      const { error: collectionError } = await supabase
        .from('kit_collections')
        .insert({
          race_kit_id: selectedKit.id,
          collected_by_user_id: user.id,
          representative_id: representativeId,
          collection_type: collectionType,
          notes: notes || null
        });

      if (collectionError) {
        toast.error("Error recording collection: " + collectionError.message);
        return;
      }

      const collectionMessage = collectionType === 'self' 
        ? "Kit collected successfully!" 
        : "Kit collected by representative successfully!";
      
      toast.success(collectionMessage);
      
      // Close dialog and refresh data
      setIsCollectionDialogOpen(false);
      fetchRaceKits();
    } catch (error) {
      toast.error("An error occurred while collecting the kit");
    } finally {
      setCollectingKit(null);
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
              <h1 className="text-2xl font-bold text-foreground">Kit Collection</h1>
              <p className="text-sm text-muted-foreground">Process kit distributions and collections</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by kit number, runner name, or participant ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading race kits...</div>
        ) : (
          <div className="grid gap-4">
            {filteredKits.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm ? "No kits found matching your search." : "No race kits found. Create race kits from the runner management page."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredKits.map((kit) => (
                <Card key={kit.id} className={kit.status === 'collected' ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Kit #{kit.kit_number}
                            <Badge variant={kit.status === 'collected' ? 'default' : 'secondary'}>
                              {kit.status}
                            </Badge>
                          </CardTitle>
                          {kit.runners && (
                            <CardDescription className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {kit.runners.full_name}
                              {kit.runners.participant_id && ` (${kit.runners.participant_id})`}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {kit.status === 'pending' ? (
                          <Button
                            onClick={() => openCollectionDialog(kit)}
                            disabled={collectingKit === kit.id}
                            size="sm"
                          >
                            {collectingKit === kit.id ? 'Collecting...' : 'Collect Kit'}
                          </Button>
                        ) : (
                          <Badge variant="outline">Collected</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {kit.runners && (
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>Category: {kit.runners.category || 'Not specified'}</div>
                        <div>Distance: {kit.runners.race_distance || 'Not specified'}</div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      <footer className="py-6 px-4 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © ApizFit6007 2025
        </div>
      </footer>

      {/* Collection Dialog */}
      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] p-0 flex flex-col">
          <DialogHeader className="p-6">
            <DialogTitle>Collect Race Kit</DialogTitle>
            <DialogDescription>
              {selectedKit && `Collecting kit #${selectedKit.kit_number} for ${selectedKit.runners?.full_name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-0 pb-24">
            <div className="grid gap-4">
            {/* Collection Type Selection */}
            <div className="grid gap-2">
              <Label>Collection Type</Label>
              <RadioGroup value={collectionType} onValueChange={(value: 'self' | 'representative') => setCollectionType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="self" id="self" />
                  <Label htmlFor="self" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Self Collection (Runner collects their own kit)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="representative" id="representative" />
                  <Label htmlFor="representative" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Representative Collection (Someone else collects on behalf)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Representative Details Form - Only shown when representative collection is selected */}
            {collectionType === 'representative' && (
              <div className="grid gap-3 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Representative Details</h4>
                <p className="text-sm text-muted-foreground">
                  Enter the representative's details as they are present for collection.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="rep_name">Full Name *</Label>
                  <Input
                    id="rep_name"
                    value={representativeDetails.full_name}
                    onChange={(e) => setRepresentativeDetails({ ...representativeDetails, full_name: e.target.value })}
                    placeholder="Enter representative's full name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rep_id">ID Number *</Label>
                  <Input
                    id="rep_id"
                    value={representativeDetails.id_number}
                    onChange={(e) => setRepresentativeDetails({ ...representativeDetails, id_number: e.target.value })}
                    placeholder="Enter ID number"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rep_id_type">ID Type</Label>
                  <Select value={representativeDetails.id_type} onValueChange={(value) => setRepresentativeDetails({ ...representativeDetails, id_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ic">IC (Identity Card)</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving_license">Driving License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rep_phone">Phone Number</Label>
                  <Input
                    id="rep_phone"
                    value={representativeDetails.phone}
                    onChange={(e) => setRepresentativeDetails({ ...representativeDetails, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rep_relationship">Relationship to Runner</Label>
                  <Input
                    id="rep_relationship"
                    value={representativeDetails.relationship}
                    onChange={(e) => setRepresentativeDetails({ ...representativeDetails, relationship: e.target.value })}
                    placeholder="e.g., spouse, friend, family member"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about the collection..."
                rows={3}
              />
            </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t bg-background">
            <div className="flex justify-end w-full gap-3">
              <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={collectKit} 
                disabled={collectingKit === selectedKit?.id}
                className="min-w-[120px]"
              >
                {collectingKit === selectedKit?.id ? 'Collecting...' : 'Collect Kit'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KitCollector;