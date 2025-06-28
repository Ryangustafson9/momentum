/**
 * Note Settings Manager Component
 * Admin interface for managing note subjects, templates, and settings
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  GripVertical,
  FileText,
  Tag,
  Palette,
  RotateCcw
} from 'lucide-react';
import NoteSettingsService from '@/services/noteSettingsService';

const CATEGORIES = [
  { value: 'action', label: 'Action Required' },
  { value: 'service', label: 'Service Related' },
  { value: 'issue', label: 'Issues & Problems' },
  { value: 'financial', label: 'Financial' },
  { value: 'facility', label: 'Facility & Equipment' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'medical', label: 'Medical' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'general', label: 'General' }
];

const COLOR_OPTIONS = [
  { value: 'bg-red-100 text-red-800 border-red-200', label: 'Red', preview: 'bg-red-100' },
  { value: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Orange', preview: 'bg-orange-100' },
  { value: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Yellow', preview: 'bg-yellow-100' },
  { value: 'bg-green-100 text-green-800 border-green-200', label: 'Green', preview: 'bg-green-100' },
  { value: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Blue', preview: 'bg-blue-100' },
  { value: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Purple', preview: 'bg-purple-100' },
  { value: 'bg-pink-100 text-pink-800 border-pink-200', label: 'Pink', preview: 'bg-pink-100' },
  { value: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Emerald', preview: 'bg-emerald-100' },
  { value: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Indigo', preview: 'bg-indigo-100' },
  { value: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Gray', preview: 'bg-gray-100' }
];

const NoteSettingsManager = () => {
  const [subjects, setSubjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    icon: '📝',
    colorClass: 'bg-gray-100 text-gray-800 border-gray-200',
    category: 'general',
    description: '',
    isActive: true,
    displayOrder: 999
  });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    description: '',
    category: 'general',
    isActive: true,
    isDefault: false
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subjectsData, templatesData, settingsData] = await Promise.all([
        NoteSettingsService.getNoteSubjects(),
        NoteSettingsService.getNoteTemplates(),
        NoteSettingsService.getNoteSettings()
      ]);
      
      setSubjects(subjectsData);
      setTemplates(templatesData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading note settings:', error);
      toast({
        title: "Error",
        description: "Failed to load note settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSubject = async () => {
    try {
      if (editingSubject) {
        await NoteSettingsService.updateNoteSubject(editingSubject.id, subjectForm);
        toast({ title: "Subject Updated", description: "Note subject has been updated successfully." });
      } else {
        await NoteSettingsService.createNoteSubject(subjectForm);
        toast({ title: "Subject Created", description: "New note subject has been created successfully." });
      }
      
      setShowSubjectDialog(false);
      setEditingSubject(null);
      resetSubjectForm();
      loadData();
    } catch (error) {
      console.error('Error saving subject:', error);
      toast({
        title: "Error",
        description: "Failed to save note subject",
        variant: "destructive"
      });
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await NoteSettingsService.updateNoteTemplate(editingTemplate.id, templateForm);
        toast({ title: "Template Updated", description: "Note template has been updated successfully." });
      } else {
        await NoteSettingsService.createNoteTemplate(templateForm);
        toast({ title: "Template Created", description: "New note template has been created successfully." });
      }
      
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      resetTemplateForm();
      loadData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save note template",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await NoteSettingsService.deleteNoteSubject(subjectId);
      toast({ title: "Subject Deleted", description: "Note subject has been deleted successfully." });
      loadData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: "Failed to delete note subject",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await NoteSettingsService.deleteNoteTemplate(templateId);
      toast({ title: "Template Deleted", description: "Note template has been deleted successfully." });
      loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete note template",
        variant: "destructive"
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      await NoteSettingsService.updateNoteSettings(settings);
      toast({ title: "Settings Saved", description: "Note settings have been saved successfully." });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save note settings",
        variant: "destructive"
      });
    }
  };

  const resetSubjectForm = () => {
    setSubjectForm({
      name: '',
      icon: '📝',
      colorClass: 'bg-gray-100 text-gray-800 border-gray-200',
      category: 'general',
      description: '',
      isActive: true,
      displayOrder: 999
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      subject: '',
      content: '',
      description: '',
      category: 'general',
      isActive: true,
      isDefault: false
    });
  };

  const openSubjectDialog = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectForm({
        name: subject.name,
        icon: subject.icon,
        colorClass: subject.color_class,
        category: subject.category,
        description: subject.description || '',
        isActive: subject.is_active,
        displayOrder: subject.display_order
      });
    } else {
      setEditingSubject(null);
      resetSubjectForm();
    }
    setShowSubjectDialog(true);
  };

  const openTemplateDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        name: template.name,
        subject: template.subject || '',
        content: template.content,
        description: template.description || '',
        category: template.category,
        isActive: template.is_active,
        isDefault: template.is_default
      });
    } else {
      setEditingTemplate(null);
      resetTemplateForm();
    }
    setShowTemplateDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Note Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Note Settings Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="subjects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="settings">General Settings</TabsTrigger>
            </TabsList>

            {/* Subjects Tab */}
            <TabsContent value="subjects" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Note Subjects</h3>
                <Button onClick={() => openSubjectDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                        <span className="text-lg">{subject.icon}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{subject.name}</h4>
                          <Badge className={subject.color_class}>
                            {subject.category}
                          </Badge>
                          {!subject.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        {subject.description && (
                          <p className="text-sm text-gray-600">{subject.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSubjectDialog(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Note Templates</h3>
                <Button onClick={() => openTemplateDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {templates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
                    >
                      <FileText className="h-5 w-5 text-gray-500 mt-1" />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{template.name}</h4>
                          {template.subject && (
                            <Badge variant="outline">{template.subject}</Badge>
                          )}
                          <Badge className="bg-purple-100 text-purple-800">
                            {template.category}
                          </Badge>
                          {template.is_default && (
                            <Badge className="bg-green-100 text-green-800">Default</Badge>
                          )}
                          {!template.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {template.content.substring(0, 100)}...
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTemplateDialog(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </TabsContent>

            {/* General Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <h3 className="text-lg font-medium">General Note Settings</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require-subject">Require Subject</Label>
                    <p className="text-sm text-gray-600">Make subject field mandatory for all notes</p>
                  </div>
                  <Switch
                    id="require-subject"
                    checked={settings.require_subject || false}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, require_subject: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-generate">Auto-generate Subject</Label>
                    <p className="text-sm text-gray-600">Automatically create subjects from note content</p>
                  </div>
                  <Switch
                    id="auto-generate"
                    checked={settings.auto_generate_subject !== false}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_generate_subject: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-templates">Enable Templates</Label>
                    <p className="text-sm text-gray-600">Allow staff to use note templates</p>
                  </div>
                  <Switch
                    id="enable-templates"
                    checked={settings.enable_templates !== false}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_templates: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-length">Maximum Note Length</Label>
                  <Input
                    id="max-length"
                    type="number"
                    value={settings.max_note_length || 2000}
                    onChange={(e) => setSettings(prev => ({ ...prev, max_note_length: parseInt(e.target.value) }))}
                    min="100"
                    max="10000"
                  />
                  <p className="text-sm text-gray-600">Maximum characters allowed in a note</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-template">Default Template</Label>
                  <Select
                    value={settings.default_template_id || ''}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, default_template_id: value || null }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default template..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Default Template</SelectItem>
                      {templates.filter(t => t.is_active).map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">Template to load by default when creating notes</p>
                </div>

                <Button onClick={handleSaveSettings} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Subject Dialog */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </DialogTitle>
            <DialogDescription>
              Configure the subject details and appearance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter subject name..."
              />
            </div>

            <div>
              <Label htmlFor="subject-icon">Icon</Label>
              <Input
                id="subject-icon"
                value={subjectForm.icon}
                onChange={(e) => setSubjectForm(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="📝"
                maxLength="10"
              />
            </div>

            <div>
              <Label htmlFor="subject-category">Category</Label>
              <Select
                value={subjectForm.category}
                onValueChange={(value) => setSubjectForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject-color">Color</Label>
              <Select
                value={subjectForm.colorClass}
                onValueChange={(value) => setSubjectForm(prev => ({ ...prev, colorClass: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${color.preview}`}></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject-description">Description (optional)</Label>
              <Textarea
                id="subject-description"
                value={subjectForm.description}
                onChange={(e) => setSubjectForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe when to use this subject..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="subject-active">Active</Label>
              <Switch
                id="subject-active"
                checked={subjectForm.isActive}
                onCheckedChange={(checked) => setSubjectForm(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            {/* Preview */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">Preview:</Label>
              <div className="mt-2">
                <Badge className={subjectForm.colorClass}>
                  <span className="mr-1">{subjectForm.icon}</span>
                  {subjectForm.name || 'Subject Name'}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubject}>
              {editingSubject ? 'Update' : 'Create'} Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Add New Template'}
            </DialogTitle>
            <DialogDescription>
              Create a reusable note template with predefined content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name..."
              />
            </div>

            <div>
              <Label htmlFor="template-subject">Default Subject</Label>
              <Select
                value={templateForm.subject}
                onValueChange={(value) => setTemplateForm(prev => ({ ...prev, subject: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default subject..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Default Subject</SelectItem>
                  {subjects.filter(s => s.is_active).map(subject => (
                    <SelectItem key={subject.id} value={subject.name}>
                      <span className="mr-2">{subject.icon}</span>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-content">Template Content</Label>
              <Textarea
                id="template-content"
                value={templateForm.content}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter template content with placeholders like [MEMBER_NAME], [DATE], etc..."
                rows={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use placeholders like [MEMBER_NAME], [DATE], [STAFF_NAME] for dynamic content
              </p>
            </div>

            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe when to use this template..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="template-category">Category</Label>
              <Select
                value={templateForm.category}
                onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="template-active">Active</Label>
                <p className="text-sm text-gray-600">Make template available for use</p>
              </div>
              <Switch
                id="template-active"
                checked={templateForm.isActive}
                onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="template-default">Default Template</Label>
                <p className="text-sm text-gray-600">Load this template by default</p>
              </div>
              <Switch
                id="template-default"
                checked={templateForm.isDefault}
                onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, isDefault: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoteSettingsManager;
