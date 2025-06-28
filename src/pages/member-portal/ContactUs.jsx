import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  Send,
  CheckCircle,
  HelpCircle,
  Users,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const ContactUs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'normal',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = {
    phone: '(555) 123-4567',
    email: 'info@momentumfitness.com',
    address: '123 Fitness Street, Wellness City, WC 12345',
    hours: {
      weekdays: '5:00 AM - 11:00 PM',
      saturday: '6:00 AM - 10:00 PM',
      sunday: '7:00 AM - 9:00 PM'
    }
  };

  const categories = [
    { value: 'membership', label: 'Membership Questions', icon: <Users className="h-4 w-4" /> },
    { value: 'billing', label: 'Billing & Payments', icon: <CreditCard className="h-4 w-4" /> },
    { value: 'reservations', label: 'Reservations & Bookings', icon: <Calendar className="h-4 w-4" /> },
    { value: 'facilities', label: 'Facilities & Equipment', icon: <MapPin className="h-4 w-4" /> },
    { value: 'programs', label: 'Programs & Classes', icon: <Users className="h-4 w-4" /> },
    { value: 'technical', label: 'Technical Support', icon: <HelpCircle className="h-4 w-4" /> },
    { value: 'feedback', label: 'Feedback & Suggestions', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'other', label: 'Other', icon: <HelpCircle className="h-4 w-4" /> }
  ];

  const faqItems = [
    {
      question: 'How do I book a court reservation?',
      answer: 'Go to the Reservations page, select your preferred date, court, and time slot, then click "Book Reservation".'
    },
    {
      question: 'Can I cancel my membership online?',
      answer: 'Membership cancellations require 30 days notice. Please contact our member services team to process your cancellation.'
    },
    {
      question: 'How do I add family members to my account?',
      answer: 'Visit the Account Access page to add family members and set their portal permissions.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and ACH bank transfers for membership payments.'
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.category || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({
        subject: '',
        category: '',
        priority: 'normal',
        message: ''
      });
      
      toast({
        title: "Message Sent Successfully! 📧",
        description: "We'll get back to you within 24 hours.",
        variant: "default"
      });
    }, 2000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-muted-foreground">Get in touch with our team for support, questions, or feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Brief description of your inquiry"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Please provide details about your question or concern..."
                    rows={6}
                    required
                  />
                </div>

                <div className="flex justify-between items-center">
                  <Badge className={getPriorityColor(formData.priority)}>
                    {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} Priority
                  </Badge>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-gray-600">{contactInfo.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-gray-600">{contactInfo.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-gray-600">{contactInfo.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Hours of Operation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Monday - Friday</span>
                <span className="text-sm">{contactInfo.hours.weekdays}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Saturday</span>
                <span className="text-sm">{contactInfo.hours.saturday}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Sunday</span>
                <span className="text-sm">{contactInfo.hours.sunday}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Email: Within 24 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Phone: Immediate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Emergency: Call directly</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <h4 className="font-medium mb-2">{item.question}</h4>
                <p className="text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactUs;
