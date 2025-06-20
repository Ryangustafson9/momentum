
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Shield, Edit3, Save, CreditCard, CalendarCheck, AlertTriangle, LifeBuoy, Image as ImageIcon, 
  Fingerprint, Settings as SettingsIcon, MessageSquare, CalendarDays, FileText, Users, LogOut, MoreVertical, 
  PauseCircle, XCircle, Repeat, Trash2, Briefcase, Home, DollarSign, CheckSquare, Eye, Info, PlusCircle, ChevronDown, ChevronUp, UserCog, UserX, UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import { dataService } from '@/services/apiService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, isValid, formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import AssignMembershipDialog from '@/components/admin/members/AssignMembershipDialog';
import ImpersonationConfirmationDialog from '@/components/admin/members/ImpersonationConfirmationDialog';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return "?";
  const names = name.trim().split(' ');
  if (names.length === 0 || names[0] === "") return "?";
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
};

const statusVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success';
    case 'inactive':
    case 'suspended':
    case 'cancelled':
    case 'expired': return 'destructive';
    default: return 'secondary';
  }
};

const ProfileSectionCard = ({ title, icon: Icon, children, actions, description, className }) => (
  <Card className={cn("shadow-md rounded-xl", className)}>
    <CardHeader className="flex flex-row items-start justify-between pb-4">
      <div>
        <CardTitle className="text-xl flex items-center">
          {Icon && <Icon className="mr-2 h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
        {description && <CardDescription className="mt-1">{description}</CardDescription>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const InfoRow = ({ label, value, icon: Icon, children }) => (
  <div className="flex items-start py-1.5">
    {Icon && <Icon className="h-4 w-4 mr-2 mt-1 text-muted-foreground flex-shrink-0" />}
    <div className="flex-grow">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children || <p className="font-medium text-sm">{value || 'N/A'}</p>}
    </div>
  </div>
);

const EditProfileModal = ({ isOpen, onClose, memberData, onSave }) => {
  const [formData, setFormData] = useState({});
  
  useEffect(() => {
    if (memberData) {
      setFormData({
        ...memberData,
        dob: memberData.dob && isValid(new Date(memberData.dob)) ? format(new Date(memberData.dob), 'yyyy-MM-dd') : '',
        join_date: memberData.join_date && isValid(new Date(memberData.join_date)) ? format(new Date(memberData.join_date), 'yyyy-MM-dd') : '',
      });
    }
  }, [memberData]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  if (!isOpen || !memberData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Member Information</DialogTitle>
          <DialogDescription>Update member's personal details. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label htmlFor="first_name">First Name</Label><Input id="first_name" name="first_name" value={formData?.first_name || ''} onChange={handleChange} /></div>
            <div><Label htmlFor="last_name">Last Name</Label><Input id="last_name" name="last_name" value={formData?.last_name || ''} onChange={handleChange} /></div>
          </div>
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={formData?.email || ''} onChange={handleChange} /></div>
          <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" value={formData?.phone || ''} onChange={handleChange} /></div>
          <div><Label htmlFor="address">Address</Label><Input id="address" name="address" value={formData?.address || ''} onChange={handleChange} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label htmlFor="dob">Date of Birth</Label><Input id="dob" name="dob" type="date" value={formData?.dob || ''} onChange={handleChange} /></div>
            <div><Label htmlFor="join_date">Join Date</Label><Input id="join_date" name="join_date" type="date" value={formData?.join_date || ''} onChange={handleChange} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label htmlFor="emergency_contact_name">Emergency Contact Name</Label><Input id="emergency_contact_name" name="emergency_contact_name" value={formData?.emergency_contact_name || ''} onChange={handleChange} /></div>
            <div><Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label><Input id="emergency_contact_phone" name="emergency_contact_phone" value={formData?.emergency_contact_phone || ''} onChange={handleChange} /></div>
          </div>
          <div><Label htmlFor="status">Status</Label>
            <select id="status" name="status" value={formData?.status || ''} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(formData); onClose(); }}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const StaffNotesSection = ({ memberId, staffId }) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState(null); 
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const notesToShow = 3;

  const fetchNotes = useCallback(async () => {
    if (!memberId) return;
    setIsLoadingNotes(true);
    try {
      // TODO: Implement staff notes functionality
      // const staffNotes = await dataService.getStaffMemberNotes(memberId);
      setNotes([]);
    } catch (error) {
      toast({ title: "Error", description: "Could not load staff notes.", variant: "destructive" });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [memberId, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) {
      toast({ title: "Empty Note", description: "Please write something before saving.", variant: "destructive" });
      return;
    }
    try {
      // TODO: Implement staff notes functionality
      // if (editingNote) {
      //   await dataService.updateStaffMemberNote(editingNote.id, newNoteContent);
      //   toast({ title: "Note Updated", description: "Staff note has been successfully updated." });
      // } else {
      //   await dataService.addStaffMemberNote(memberId, staffId, newNoteContent);
      //   toast({ title: "Note Saved", description: "Staff note has been successfully saved." });
      // }
      toast({ title: "Feature Coming Soon", description: "Staff notes functionality will be available soon.", variant: "info" });
      setNewNoteContent('');
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      toast({ title: "Error Saving Note", description: error.message, variant: "destructive" });
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNewNoteContent(note.content);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      // TODO: Implement staff notes functionality
      // await dataService.deleteStaffMemberNote(noteId);
      toast({ title: "Feature Coming Soon", description: "Staff notes functionality will be available soon.", variant: "info" });
      fetchNotes();
    } catch (error) {
      toast({ title: "Error Deleting Note", description: error.message, variant: "destructive" });
    }
  };
  
  const displayedNotes = showAllNotes ? notes : notes.slice(0, notesToShow);

  return (
    <ProfileSectionCard title="Staff Notes" icon={MessageSquare} description="Internal notes about this member." className="col-span-1 md:col-span-2">
      <div className="space-y-4">
        <div>
          <Label htmlFor="newStaffNote" className="sr-only">New Staff Note</Label>
          <Textarea
            id="newStaffNote"
            placeholder="Type staff note here..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            rows={3}
            className="mb-2"
            aria-label="New staff note"
          />
          <div className="flex justify-between items-center">
            <Button onClick={handleSaveNote} size="sm">
              <Save className="mr-2 h-4 w-4" /> {editingNote ? 'Update Note' : 'Save Note'}
            </Button>
            {editingNote && (
              <Button variant="outline" size="sm" onClick={() => { setEditingNote(null); setNewNoteContent(''); }}>
                Cancel Edit
              </Button>
            )}
          </div>
        </div>
        {isLoadingNotes && (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner className="mr-2" />
            <span className="text-gray-600">Loading notes...</span>
          </div>
        )}
        {!isLoadingNotes && notes.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No staff notes for this member yet.</p>
        )}
        {!isLoadingNotes && notes.length > 0 && (
          <div className="space-y-3">
            {displayedNotes.map(note => (
              <div key={note.id} className="p-3 border rounded-md bg-slate-50 dark:bg-slate-800/50 relative group">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  By: {note.staff?.name || 'Unknown Staff'} on {format(new Date(note.created_at), 'PPp')}
                  {note.updated_at && new Date(note.updated_at).getTime() !== new Date(note.created_at).getTime() && (
                    <em> (edited {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })})</em>
                  )}
                </p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditNote(note)}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteNote(note.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {notes.length > notesToShow && (
              <Button variant="link" onClick={() => setShowAllNotes(!showAllNotes)} className="text-sm p-0 h-auto">
                {showAllNotes ? (
                  <> <ChevronUp className="mr-1 h-4 w-4" /> Show Less Notes </>
                ) : (
                  <> <ChevronDown className="mr-1 h-4 w-4" /> Show All {notes.length} Notes </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </ProfileSectionCard>
  );
};


const StaffMemberProfilePage = () => {
  const { id: systemMemberId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [memberData, setMemberData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [membershipLog, setMembershipLog] = useState([]);
  const [isAssignMembershipDialogOpen, setIsAssignMembershipDialogOpen] = useState(false);
  const [isImpersonationDialogOpen, setIsImpersonationDialogOpen] = useState(false);
  const [loggedInStaff, setLoggedInStaff] = useState(null);

  const fetchProfileData = useCallback(async () => {
    console.log('🔍 Starting fetchProfileData for systemMemberId:', systemMemberId);
    setIsLoading(true);

    // Get current staff user from auth
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Auth user:', user?.email);
      if (user) {
        const { data: staffProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        console.log('👨‍💼 Staff profile:', staffProfile?.email);
        setLoggedInStaff(staffProfile || { id: user.id, email: user.email });
      }
    } catch (error) {
      console.error('Error fetching staff profile:', error);
      setLoggedInStaff({ id: 'temp', email: 'temp@example.com' });
    }

    if (!systemMemberId) {
      console.error('❌ No systemMemberId provided');
      toast({ title: "Error", description: "No member ID provided.", variant: "destructive" });
      navigate('/staff-portal/members');
      return;
    }

    console.log('🔍 Fetching member data for ID:', systemMemberId);
    try {
      const [memberDetails, types, attendanceRecordsData, logData] = await Promise.all([
        // Get member by system_member_id or id
        supabase
          .from('profiles')
          .select(`
            *,
            membership:memberships(
              id,
              membership_type_id,
              start_date,
              end_date,
              status,
              membership_type:membership_types(*)
            )
          `)
          .or(`system_member_id.eq.${systemMemberId},id.eq.${systemMemberId}`)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('❌ Error fetching member:', error);
              throw error;
            }
            console.log('✅ Member data fetched:', data);
            return data;
          }),

        // Get membership types
        supabase
          .from('membership_types')
          .select('*')
          .order('name')
          .then(({ data, error }) => {
            if (error) throw error;
            return data || [];
          }),

        // Get attendance records (will be updated after we get the member data)
        Promise.resolve([]),

        // Get membership log (will be updated after we get the member data)
        Promise.resolve([])
      ]);
      
      if (memberDetails) {
        console.log('✅ Setting member data:', memberDetails);
        setMemberData(memberDetails);
        setMembershipTypes(types || []);

        // Now fetch attendance and membership log using the actual member ID
        try {
          const [attendanceData, membershipLogData] = await Promise.all([
            supabase
              .from('attendance')
              .select('*')
              .eq('member_id', memberDetails.id)
              .order('check_in_time', { ascending: false })
              .then(({ data, error }) => {
                if (error) throw error;
                return data || [];
              }),

            supabase
              .from('membership_log')
              .select('*')
              .eq('member_id', memberDetails.id)
              .order('created_at', { ascending: false })
              .then(({ data, error }) => {
                if (error) throw error;
                return data || [];
              })
          ]);

          const allRecords = Array.isArray(attendanceData) ? attendanceData : [];
          setCheckIns(allRecords.filter(r => r.status === 'Present' || r.status === 'Checked In (General)' || r.status === 'Checked In (Class)'));
          setBookings(allRecords.filter(r => r.status === 'Booked' || r.status === 'Cancelled'));
          setMembershipLog(membershipLogData || []);
        } catch (error) {
          console.error("Error fetching attendance/membership log:", error);
          // Continue without this data
          setCheckIns([]);
          setBookings([]);
          setMembershipLog([]);
        }
      } else {
        console.error('❌ No member details found for ID:', systemMemberId);
        toast({ title: "Error", description: "Could not load member details.", variant: "destructive" });
        navigate('/staff-portal/members');
      }
    } catch (error) {
      console.error("❌ Error fetching profile data:", error);
      toast({ title: "Error", description: `Failed to load profile data: ${error.message}`, variant: "destructive" });
    } finally {
      console.log('🏁 Setting isLoading to false');
      setIsLoading(false);
    }
  }, [systemMemberId, navigate, toast]);  useEffect(() => {
    if (systemMemberId) {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('❌ Profile data loading timeout');
        setIsLoading(false);
        toast({ 
          title: "Loading Timeout", 
          description: "Profile data is taking too long to load. Please try again.", 
          variant: "destructive" 
        });
      }, 15000); // 15 second timeout

      fetchProfileData().finally(() => {
        clearTimeout(timeoutId);
      });

      return () => clearTimeout(timeoutId);
    }
  }, [systemMemberId]); // Only depend on systemMemberId, not the function

  const handleEditProfile = () => setIsEditModalOpen(true);

  const handleSaveProfile = async (updatedFormData) => {
    if (!memberData?.id) return;
    try {
      const dob = updatedFormData.dob && updatedFormData.dob !== "" ? new Date(updatedFormData.dob).toISOString().split('T')[0] : null;
      const join_date = updatedFormData.join_date && updatedFormData.join_date !== "" ? new Date(updatedFormData.join_date).toISOString().split('T')[0] : null;
      
      const dataToSave = { 
        ...updatedFormData, 
        dob,
        join_date,
        first_name: updatedFormData.first_name || '',
        last_name: updatedFormData.last_name || '',
      };
      dataToSave.name = `${dataToSave.first_name} ${dataToSave.last_name}`.trim();

      const { data: savedMember, error } = await supabase
        .from('profiles')
        .update(dataToSave)
        .eq('id', memberData.id)
        .select()
        .single();

      if (error) throw error;

      setMemberData(savedMember);
      toast({ title: "Profile Updated", description: "Member's information has been saved." });
      fetchProfileData();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Error", description: `Could not save profile changes. ${error.message}`, variant: "destructive" });
    }
  };
  
  const handleQuickAction = (actionType) => {
     toast({ title: "Feature Coming Soon", description: `"${actionType}" functionality is under development.`, variant: "info" });
  };

  const handleMembershipAssigned = () => {
    fetchProfileData(); 
  };

  const handleConfirmImpersonation = () => {
    setIsImpersonationDialogOpen(false);
    toast({ title: "Impersonation (Conceptual)", description: `Would start impersonating ${memberData?.name}. This is a UI demonstration.`, duration: 5000 });
  };

  if (isLoading || !memberData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading member profile...</p>
          <p className="text-xs text-gray-400 mt-2">
            Loading: {isLoading ? 'true' : 'false'} |
            Member: {memberData ? 'loaded' : 'loading'} |
            Staff: {loggedInStaff ? 'loaded' : 'loading'}
          </p>
        </div>
      </div>
    );
  }
  
  const currentMembership = membershipTypes.find(mt => mt.id === memberData.current_membership_type_id);
  const memberNameForAvatar = memberData.name || "Member";
  const avatarSrc = memberData.profile_picture_url || '';


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-2 sm:px-4 py-6 space-y-6"
    >
      <Card className="overflow-hidden shadow-xl rounded-xl bg-card">
        <div className="p-6 flex flex-col items-center bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/20">
          <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background shadow-lg">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} alt={memberData.name || "Member avatar"} />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-muted rounded-full">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            <AvatarFallback className="text-3xl">{getInitials(memberData.name)}</AvatarFallback>
          </Avatar>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-foreground tracking-tight">{memberData.name || "Member"}</h1>
          <div className="mt-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <span>{currentMembership?.name || 'N/A Membership'}</span>
            <Badge variant={statusVariant(memberData.status)} className="px-3 py-1">{memberData.status || 'Unknown'}</Badge>
            <span>Joined: {memberData.join_date ? format(new Date(memberData.join_date), 'PP') : 'N/A'}</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <Button variant="outline" size="sm" onClick={handleEditProfile}><Edit3 className="mr-2 h-4 w-4" /> Edit Profile</Button>
          <Button variant="outline" size="sm" onClick={() => setIsAssignMembershipDialogOpen(true)}><Briefcase className="mr-2 h-4 w-4" /> Manage Plan</Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickAction('Manage Family')}><Users className="mr-2 h-4 w-4" /> Family</Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickAction('Payment Methods')}><DollarSign className="mr-2 h-4 w-4" /> Payments</Button>
          <Button variant="outline" size="sm" onClick={() => setIsImpersonationDialogOpen(true)}><Eye className="mr-2 h-4 w-4" /> Impersonate</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
           <ProfileSectionCard title="Contact Information" icon={Info} description="Primary contact details.">
              <InfoRow label="Email Address" value={memberData.email} icon={Mail} />
              <InfoRow label="Phone Number" value={memberData.phone} icon={Phone} />
              <InfoRow label="Home Address" value={memberData.address} icon={Home} />
            </ProfileSectionCard>
            <ProfileSectionCard title="Emergency Contact" icon={Shield} description="Who to contact in an emergency.">
              <InfoRow label="Contact Name" value={memberData.emergency_contact_name} icon={User} />
              <InfoRow label="Contact Phone" value={memberData.emergency_contact_phone} icon={Phone} />
            </ProfileSectionCard>
        </div>
        <StaffNotesSection memberId={memberData.id} staffId={loggedInStaff.id} />
      </div>


      <Tabs defaultValue="membership-details" className="w-full">
        <TabsList id="staffProfileTabsTriggerList" className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4 bg-muted/50 rounded-lg p-1">
          <TabsTrigger value="membership-details"><Briefcase className="mr-2 h-4 w-4"/>Membership</TabsTrigger>
          <TabsTrigger value="activity-history"><CheckSquare className="mr-2 h-4 w-4"/>Activity</TabsTrigger>
          <TabsTrigger value="billing-payments"><DollarSign className="mr-2 h-4 w-4"/>Billing</TabsTrigger>
          <TabsTrigger value="family-dependents"><Users className="mr-2 h-4 w-4"/>Family</TabsTrigger>
        </TabsList>
        
        <TabsContent value="membership-details">
            <ProfileSectionCard title="Membership Details" icon={Briefcase} description="Overview of member's current plan and status.">
                <InfoRow label="Membership Type" value={currentMembership?.name || 'N/A'} icon={Briefcase} />
                <InfoRow label="Membership Status" value={memberData.status || 'N/A'} icon={memberData.status === 'Active' ? CheckSquare : AlertTriangle} />
                <InfoRow label="Member Since" value={memberData.join_date ? format(new Date(memberData.join_date), 'PP') : 'N/A'} icon={CalendarDays} />
                <InfoRow label="Plan End Date" value={memberData.membership_end_date ? format(new Date(memberData.membership_end_date), 'PP') : 'Ongoing'} icon={CalendarDays} />
                <InfoRow label="Member ID" value={memberData.system_member_id || memberData.id} icon={Fingerprint} />
                <CardFooter className="pt-4 px-0">
                    <Button onClick={() => setIsAssignMembershipDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Assign/Update Membership</Button>
                </CardFooter>
            </ProfileSectionCard>
        </TabsContent>
        
        <TabsContent value="activity-history">
          <ProfileSectionCard title="Activity History" icon={CalendarCheck} description="Member's check-ins and class bookings.">
            <Tabs defaultValue="check-ins-sub" className="w-full">
              <TabsList className="grid w-full grid-cols-2 gap-1 mb-3 text-sm">
                <TabsTrigger value="check-ins-sub">Check-in Log</TabsTrigger>
                <TabsTrigger value="bookings-sub">Class Bookings</TabsTrigger>
              </TabsList>
              <TabsContent value="check-ins-sub">
                {checkIns.length > 0 ? checkIns.slice(0,10).map(item => (
                  <div key={item.id} className="p-2.5 border-b text-xs">Checked in for <strong>{item.class_name || 'General Access'}</strong> on {format(new Date(item.check_in_time), 'P p')}</div>
                )) : <p className="text-muted-foreground text-center py-4">No check-in history.</p>}
                {checkIns.length > 10 && <Button variant="link" className="mt-2">Show all {checkIns.length} check-ins</Button>}
              </TabsContent>
              <TabsContent value="bookings-sub">
                {bookings.length > 0 ? bookings.slice(0,10).map(item => (
                  <div key={item.id} className="p-2.5 border-b text-xs">Booking for <strong>{item.class_name}</strong> on {format(new Date(item.check_in_time), 'P p')} - <Badge variant={item.status === 'Booked' ? 'default' : 'secondary'} className="text-xs">{item.status}</Badge></div>
                )) : <p className="text-muted-foreground text-center py-4">No booking history.</p>}
                {bookings.length > 10 && <Button variant="link" className="mt-2">Show all {bookings.length} bookings</Button>}
              </TabsContent>
            </Tabs>
          </ProfileSectionCard>
        </TabsContent>

        <TabsContent value="billing-payments">
          <ProfileSectionCard title="Billing & Payments" icon={DollarSign} description="View payment history and manage methods.">
            <p className="text-muted-foreground text-center py-4">Payment history and methods will be shown here. (Coming Soon)</p>
          </ProfileSectionCard>
        </TabsContent>

        <TabsContent value="family-dependents">
          <ProfileSectionCard title="Family & Dependents" icon={Users} description="Manage linked family accounts.">
            <p className="text-muted-foreground text-center py-4">Family and dependent management will be available here. (Coming Soon)</p>
          </ProfileSectionCard>
        </TabsContent>
      </Tabs>
      
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        memberData={memberData}
        onSave={handleSaveProfile}
      />
      <AssignMembershipDialog
        isOpen={isAssignMembershipDialogOpen}
        onClose={() => setIsAssignMembershipDialogOpen(false)}
        memberId={memberData.id}
        memberName={memberData.name}
        currentMembershipTypeId={memberData.current_membership_type_id}
        onMembershipAssigned={handleMembershipAssigned}
      />
      <ImpersonationConfirmationDialog
        isOpen={isImpersonationDialogOpen}
        onClose={() => setIsImpersonationDialogOpen(false)}
        memberName={memberData.name}
        onConfirm={handleConfirmImpersonation}
      />
    </motion.div>
  );
};

export default StaffMemberProfilePage;


