import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Shield, Edit3, Save, CreditCard, CalendarCheck, AlertTriangle, LifeBuoy, Image as ImageIcon, 
  Fingerprint, Settings as SettingsIcon, MessageSquare, CalendarDays, FileText, Users, LogOut, MoreVertical, 
  PauseCircle, XCircle, Repeat, Trash2, Briefcase, Home, DollarSign, CheckSquare, Eye, Info, PlusCircle, ChevronDown, ChevronUp, Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast.js';
import { useNavigate } from 'react-router-dom';
import dataService from '@/services/dataService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, isValid, formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import AssignPlanDialog from '@/components/member/AssignPlanDialog.jsx';
import { cn } from '@/lib/utils';

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

const ProfileSectionCard = ({ title, icon: Icon, children, actions, description }) => (
  <Card className="shadow-md rounded-xl">
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

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start py-1.5">
    {Icon && <Icon className="h-4 w-4 mr-2 mt-1 text-muted-foreground flex-shrink-0" />}
    <div className="flex-grow">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium text-sm">{value || 'N/A'}</p>
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
      });
    }
  }, [memberData]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  if (!isOpen || !memberData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-lg bg-card my-8">
        <CardHeader>
          <CardTitle>Edit Personal Information</CardTitle>
          <CardDescription>Update your personal details. Click save when you're done.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label htmlFor="first_name">First Name</Label><Input id="first_name" name="first_name" value={formData?.first_name || ''} onChange={handleChange} /></div>
            <div><Label htmlFor="last_name">Last Name</Label><Input id="last_name" name="last_name" value={formData?.last_name || ''} onChange={handleChange} /></div>
          </div>
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={formData?.email || ''} onChange={handleChange} /></div>
          <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" value={formData?.phone || ''} onChange={handleChange} /></div>
          <div><Label htmlFor="address">Address</Label><Input id="address" name="address" value={formData?.address || ''} onChange={handleChange} /></div>
          <div><Label htmlFor="dob">Date of Birth</Label><Input id="dob" name="dob" type="date" value={formData?.dob || ''} onChange={handleChange} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label htmlFor="emergency_contact_name">Emergency Contact Name</Label><Input id="emergency_contact_name" name="emergency_contact_name" value={formData?.emergency_contact_name || ''} onChange={handleChange} /></div>
            <div><Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label><Input id="emergency_contact_phone" name="emergency_contact_phone" value={formData?.emergency_contact_phone || ''} onChange={handleChange} /></div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(formData); onClose(); }}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const ProfileNotesTab = ({ memberId }) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const notesToShow = 5;

  const fetchNotes = useCallback(async () => {
    if (!memberId) return;
    setIsLoadingNotes(true);
    try {
      const memberNotes = await dataService.getMemberNotes(memberId);
      setNotes(memberNotes || []);
    } catch (error) {
      toast({ title: "Error", description: "Could not load your notes.", variant: "destructive" });
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
      await dataService.addMemberNote(memberId, newNoteContent);
      setNewNoteContent('');
      fetchNotes();
      toast({ title: "Note Saved", description: "Your note has been successfully saved." });
    } catch (error) {
      toast({ title: "Error Saving Note", description: error.message, variant: "destructive" });
    }
  };

  const displayedNotes = showAllNotes ? notes : notes.slice(0, notesToShow);

  return (
    <ProfileSectionCard title="My Personal Notes" icon={MessageSquare} description="Jot down your personal reminders or thoughts.">
      <div className="space-y-4">
        <div>
          <Label htmlFor="newNote" className="sr-only">New Note</Label>
          <Textarea
            id="newNote"
            placeholder="Type your note here..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            rows={3}
            className="mb-2"
          />
          <Button onClick={handleSaveNote} size="sm">
            <Save className="mr-2 h-4 w-4" /> Save Note
          </Button>
        </div>
        {isLoadingNotes && <LoadingSpinner text="Loading notes..." />}
        {!isLoadingNotes && notes.length === 0 && (
          <p className="text-muted-foreground text-center py-4">You haven't added any notes yet.</p>
        )}
        {!isLoadingNotes && notes.length > 0 && (
          <div className="space-y-3">
            {displayedNotes.map(note => (
              <div key={note.id} className="p-3 border rounded-md bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </p>
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

const PersonalInfoTabContent = ({ memberData }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <ProfileSectionCard title="Contact Information" icon={Info} description="Your primary contact details.">
      <InfoRow label="Email Address" value={memberData.email} icon={Mail} />
      <InfoRow label="Phone Number" value={memberData.phone} icon={Phone} />
      <InfoRow label="Home Address" value={memberData.address} icon={Home} />
    </ProfileSectionCard>
    <ProfileSectionCard title="Emergency Contact" icon={Shield} description="Who to contact in an emergency.">
      <InfoRow label="Contact Name" value={memberData.emergency_contact_name} icon={User} />
      <InfoRow label="Contact Phone" value={memberData.emergency_contact_phone} icon={Phone} />
    </ProfileSectionCard>
  </div>
);

const MembershipDetailsTabContent = ({ memberData, currentMembership }) => (
  <ProfileSectionCard title="Membership Details" icon={Briefcase} description="Overview of your current plan and status.">
      <InfoRow label="Membership Type" value={currentMembership?.name || 'N/A'} icon={Briefcase} />
      <InfoRow label="Membership Status" value={memberData.status || 'N/A'} icon={memberData.status === 'Active' ? CheckSquare : AlertTriangle} />
      <InfoRow label="Member Since" value={memberData.join_date ? format(new Date(memberData.join_date), 'PP') : 'N/A'} icon={CalendarDays} />
      <InfoRow label="Plan End Date" value={memberData.membership_end_date ? format(new Date(memberData.membership_end_date), 'PP') : 'Ongoing'} icon={CalendarDays} />
      <InfoRow label="Member ID" value={memberData.system_member_id || memberData.id} icon={Fingerprint} />
  </ProfileSectionCard>
);

const ActivityHistoryTabContent = ({ checkIns, bookings }) => (
  <ProfileSectionCard title="Activity History" icon={CalendarCheck} description="Your check-ins and class bookings.">
    <Tabs defaultValue="check-ins-sub" className="w-full">
      <TabsList className="grid w-full grid-cols-2 gap-1 mb-3 text-sm">
        <TabsTrigger value="check-ins-sub">Check-in Log</TabsTrigger>
        <TabsTrigger value="bookings-sub">Class Bookings</TabsTrigger>
      </TabsList>
      <TabsContent value="check-ins-sub">
        {checkIns.length > 0 ? checkIns.map(item => (
          <div key={item.id} className="p-2.5 border-b text-xs">Checked in for <strong>{item.class_name || 'General Access'}</strong> on {format(new Date(item.check_in_time), 'P p')}</div>
        )) : <p className="text-muted-foreground text-center py-4">No check-in history.</p>}
      </TabsContent>
      <TabsContent value="bookings-sub">
        {bookings.length > 0 ? bookings.map(item => (
          <div key={item.id} className="p-2.5 border-b text-xs">Booking for <strong>{item.class_name}</strong> on {format(new Date(item.check_in_time), 'P p')} - <Badge variant={item.status === 'Booked' ? 'default' : 'secondary'} className="text-xs">{item.status}</Badge></div>
        )) : <p className="text-muted-foreground text-center py-4">No booking history.</p>}
      </TabsContent>
    </Tabs>
  </ProfileSectionCard>
);

const BillingPaymentsTabContent = () => (
  <ProfileSectionCard title="Billing & Payments" icon={DollarSign} description="View your payment history and manage methods.">
    <p className="text-muted-foreground text-center py-4">Payment history and methods will be shown here. (Coming Soon)</p>
  </ProfileSectionCard>
);


const MemberProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [memberData, setMemberData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignPlanModalOpen, setIsAssignPlanModalOpen] = useState(false);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [membershipLog, setMembershipLog] = useState([]);

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    const loggedInUser = dataService.auth.getLoggedInUser();
    if (!loggedInUser || (loggedInUser.role !== 'member' && !loggedInUser.isImpersonating) ) {
      toast({ title: "Access Denied", description: "Please log in as a member.", variant: "destructive"});
      navigate('/login');
      return;
    }
    
    const memberIdToFetch = loggedInUser.id;

    try {
      const [memberDetails, types, attendanceRecordsData, logData] = await Promise.all([
        dataService.getMemberById(memberIdToFetch),
        dataService.getMembershipTypes(), 
        dataService.getAttendanceRecords({ memberId: memberIdToFetch }),
        dataService.getMembershipLogForMember(memberIdToFetch)
      ]);
      
      if (memberDetails) {
        setMemberData(memberDetails);
        setMembershipTypes(types || []);
        const allRecords = Array.isArray(attendanceRecordsData) ? attendanceRecordsData : [];
        setCheckIns(allRecords.filter(r => r.status === 'Present' || r.status === 'Checked In (General)' || r.status === 'Checked In (Class)'));
        setBookings(allRecords.filter(r => r.status === 'Booked' || r.status === 'Cancelled'));
        setMembershipLog(logData || []);
      } else {
        toast({ title: "Error", description: "Could not load member details.", variant: "destructive" });
        navigate('/');
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast({ title: "Error", description: "Failed to load profile data.", variant: "destructive" });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleEditProfile = () => setIsEditModalOpen(true);
  const handleOpenAssignPlanModal = () => setIsAssignPlanModalOpen(true);

  const handleSaveProfile = async (updatedFormData) => {
    if (!memberData?.id) return;
    try {
      const dob = updatedFormData.dob && updatedFormData.dob !== "" ? new Date(updatedFormData.dob).toISOString().split('T')[0] : null;
      const dataToSave = { 
        ...updatedFormData, 
        dob,
        first_name: updatedFormData.first_name || '',
        last_name: updatedFormData.last_name || '',
      };
      dataToSave.name = `${dataToSave.first_name} ${dataToSave.last_name}`.trim();

      const savedMember = await dataService.updateMember(memberData.id, dataToSave);
      setMemberData(savedMember);
      toast({ title: "Profile Updated", description: "Your personal information has been saved." });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Error", description: `Could not save profile changes. ${error.message}`, variant: "destructive" });
    }
  };
  
  const handlePlanAssignmentSuccess = (updatedMemberData) => {
    setMemberData(updatedMemberData); 
    fetchProfileData(); 
  };

  const handleQuickAction = (actionType) => {
     if (actionType === 'Update Membership') {
        handleOpenAssignPlanModal();
     } else {
        toast({ title: "Feature Coming Soon", description: `"${actionType}" functionality is under development.`, variant: "info" });
     }
  };

  if (isLoading || !memberData) {
    return <LoadingSpinner text="Loading your profile..." className="mt-20 h-screen" />;
  }
  
  const currentMembership = membershipTypes.find(mt => mt.id === memberData.current_membership_type_id);
  const memberNameForAvatar = memberData.name || "Member";
  const avatarSrc = memberData.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberNameForAvatar)}&background=random&color=fff&size=128`;


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
            <AvatarImage src={avatarSrc} alt={memberData.name || "Member avatar"} />
            <AvatarFallback className="text-3xl">{getInitials(memberData.name)}</AvatarFallback>
          </Avatar>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-foreground tracking-tight">{memberData.name || "Member"}</h1>
          <div className="mt-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <span>{currentMembership?.name || 'N/A Membership'}</span>
            <Badge variant={statusVariant(memberData.status)} className="px-3 py-1">{memberData.status || 'Unknown'}</Badge>
            <span>Joined: {memberData.join_date ? format(new Date(memberData.join_date), 'PP') : 'N/A'}</span>
            {memberData.role === 'staff' && <Badge variant="secondary" className="px-3 py-1"><Shield className="h-3 w-3 mr-1.5"/>Staff Member</Badge>}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <Button variant="outline" size="sm" onClick={handleEditProfile}><Edit3 className="mr-2 h-4 w-4" /> Edit Profile</Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickAction('Update Membership')}><Award className="mr-2 h-4 w-4" /> Manage Plans</Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickAction('Manage Family')}><Users className="mr-2 h-4 w-4" /> Family</Button>
          <Button variant="outline" size="sm" onClick={() => handleQuickAction('Payment Methods')}><DollarSign className="mr-2 h-4 w-4" /> Payments</Button>
          <Button variant="outline" size="sm" onClick={() => document.getElementById('activityTabsTriggerList')?.querySelector('button[value="activity-history"]')?.click()}><CalendarCheck className="mr-2 h-4 w-4" /> Activity</Button>
        </div>
      </Card>

      <Tabs defaultValue="personal-info" className="w-full">
        <TabsList id="activityTabsTriggerList" className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4 bg-muted/50 rounded-lg p-1">
          <TabsTrigger value="personal-info"><User className="mr-2 h-4 w-4"/>Personal</TabsTrigger>
          <TabsTrigger value="membership-details"><Briefcase className="mr-2 h-4 w-4"/>Membership</TabsTrigger>
          <TabsTrigger value="activity-history"><CheckSquare className="mr-2 h-4 w-4"/>Activity</TabsTrigger>
          <TabsTrigger value="billing-payments"><DollarSign className="mr-2 h-4 w-4"/>Billing</TabsTrigger>
          <TabsTrigger value="notes-comments"><MessageSquare className="mr-2 h-4 w-4"/>Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-info">
          <PersonalInfoTabContent memberData={memberData} />
        </TabsContent>
        <TabsContent value="membership-details">
          <MembershipDetailsTabContent memberData={memberData} currentMembership={currentMembership} />
        </TabsContent>
        <TabsContent value="activity-history">
          <ActivityHistoryTabContent checkIns={checkIns} bookings={bookings} />
        </TabsContent>
        <TabsContent value="billing-payments">
          <BillingPaymentsTabContent />
        </TabsContent>
        <TabsContent value="notes-comments">
           <ProfileNotesTab memberId={memberData.id} />
        </TabsContent>
      </Tabs>
      
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        memberData={memberData}
        onSave={handleSaveProfile}
      />
      <AssignPlanDialog
        isOpen={isAssignPlanModalOpen}
        onOpenChange={setIsAssignPlanModalOpen}
        member={memberData}
        onAssignmentSuccess={handlePlanAssignmentSuccess}
      />
    </motion.div>
  );
};

export default MemberProfilePage;


