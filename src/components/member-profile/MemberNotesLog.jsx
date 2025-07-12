import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const MemberNotesLog = ({ memberId }) => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ content: '', type: 'general', priority: 'normal' });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (memberId) {
      loadMemberNotes();
    }
  }, [memberId]);

  const loadMemberNotes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('member_notes')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Manually fetch staff info for each note
      const notesWithStaff = await Promise.all(
        (data || []).map(async (note) => {
          if (note.created_by) {
            const { data: staffData } = await supabase
              .from('profiles')
              .select('first_name, last_name, display_name')
              .eq('id', note.created_by)
              .single();

            return { ...note, created_by_profile: staffData };
          }
          return note;
        })
      );

      setNotes(notesWithStaff);
    } catch (error) {
      console.error('Error loading member notes:', error);
      // Create table if it doesn't exist
      if (error.code === '42P01') {
        await createNotesTable();
        setNotes([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createNotesTable = async () => {
    try {
      const { error } = await supabase.rpc('create_member_notes_table');
      if (error) throw error;
    } catch (error) {
      console.warn('Could not create member_notes table:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('member_notes')
        .insert({
          member_id: memberId,
          content: newNote.content.trim(),
          type: newNote.type,
          priority: newNote.priority,
          created_by: user?.id
        })
        .select('*')
        .single();

      if (error) throw error;

      // Fetch staff info for the new note
      if (data.created_by) {
        const { data: staffData } = await supabase
          .from('profiles')
          .select('first_name, last_name, display_name')
          .eq('id', data.created_by)
          .single();

        data.created_by_profile = staffData;
      }

      setNotes(prev => [data, ...prev]);
      setNewNote({ content: '', type: 'general', priority: 'normal' });
      setIsAddingNote(false);

      toast({
        title: "Success",
        description: "Note added successfully"
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive"
      });
    }
  };

  const deleteNote = async (noteId) => {
    try {
      const { error } = await supabase
        .from('member_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  const getNoteTypeIcon = (type) => {
    switch (type) {
      case 'important': return <Flag className="h-4 w-4 text-red-500" />;
      case 'billing': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'complaint': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'general': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNoteTypeBadge = (type, priority) => {
    const baseClasses = "text-xs";
    
    if (priority === 'high') {
      return <Badge variant="destructive" className={baseClasses}>{type}</Badge>;
    }
    
    switch (type) {
      case 'important': return <Badge variant="destructive" className={baseClasses}>Important</Badge>;
      case 'billing': return <Badge variant="default" className={baseClasses}>Billing</Badge>;
      case 'complaint': return <Badge variant="secondary" className={baseClasses}>Complaint</Badge>;
      case 'general': return <Badge variant="outline" className={baseClasses}>General</Badge>;
      default: return <Badge variant="outline" className={baseClasses}>{type}</Badge>;
    }
  };

  const getStaffName = (note) => {
    const profile = note.created_by_profile;
    if (profile) {
      return profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return 'Unknown Staff';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes & Communication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes & Communication
            <Badge variant="secondary">{notes.length}</Badge>
          </CardTitle>
          <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={newNote.type} onValueChange={(value) => setNewNote(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="important">Important</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="complaint">Complaint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={newNote.priority} onValueChange={(value) => setNewNote(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Note</label>
                  <Textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your note here..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addNote}>
                    Add Note
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No notes yet</p>
            <p className="text-xs text-gray-400">Add the first note to start tracking communication</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getNoteTypeIcon(note.type)}
                    {getNoteTypeBadge(note.type, note.priority)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-gray-900">{note.content}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {getStaffName(note)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberNotesLog;
