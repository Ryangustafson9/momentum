import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Calendar, MapPin } from 'lucide-react';

const PersonalInfoStep = ({ salesData, updateSalesData, updateStepValidation, existingMember }) => {
  const { personalInfo } = salesData;

  // Validate the form
  useEffect(() => {
    const isValid = 
      personalInfo.first_name?.trim() && 
      personalInfo.last_name?.trim() && 
      personalInfo.email?.trim() && 
      personalInfo.phone?.trim();
    
    updateStepValidation('personal-info', isValid);
  }, [personalInfo, updateStepValidation]);

  // Update form data
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateSalesData('personalInfo', { [name]: value });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="flex items-center gap-2">
              <User className="h-4 w-4" /> First Name
            </Label>
            <Input
              id="first_name"
              name="first_name"
              value={personalInfo.first_name}
              onChange={handleChange}
              placeholder="First name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="last_name" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Last Name
            </Label>
            <Input
              id="last_name"
              name="last_name"
              value={personalInfo.last_name}
              onChange={handleChange}
              placeholder="Last name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={personalInfo.email}
              onChange={handleChange}
              placeholder="Email address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={personalInfo.phone}
              onChange={handleChange}
              placeholder="Phone number"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dob" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Date of Birth
            </Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              value={personalInfo.dob}
              onChange={handleChange}
              placeholder="Date of birth"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Address
            </Label>
            <Input
              id="address"
              name="address"
              value={personalInfo.address}
              onChange={handleChange}
              placeholder="Street address"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoStep;