import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Home, 
  Shield, 
  Users,
  KeySquare,
  CalendarDays
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InlineEditField from '@/components/ui/InlineEditField';

const PersonalInfoStep = ({ data, updateData, errors, memberId }) => {
  const personalInfo = data.personalInfo || {};

  const handleFieldChange = (fieldName, value) => {
    updateData('personalInfo', { [fieldName]: value });
  };

  return (
    <div className="p-4 space-y-6">

      {/* Personal & Contact Information Card */}
      <Card className="border-0 shadow-none max-w-none">
        <CardContent className="space-y-5 p-8">
          
          {/* Personal Details Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Details
            </h3>

            {/* Access Card Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InlineEditField
                label="Access Card Number"
                value={personalInfo.access_card_number || ''}
                fieldName="access_card_number"
                placeholder="Enter access card number"
                onChange={handleFieldChange}
                error={errors.access_card_number}
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InlineEditField
                label="First Name"
                value={personalInfo.first_name || ''}
                fieldName="first_name"
                isRequired={true}
                placeholder="Enter first name"
                onChange={handleFieldChange}
                error={errors.first_name}
              />
              <InlineEditField
                label="Last Name"
                value={personalInfo.last_name || ''}
                fieldName="last_name"
                isRequired={true}
                placeholder="Enter last name"
                onChange={handleFieldChange}
                error={errors.last_name}
              />
            </div>

            {/* Date of Birth and Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InlineEditField
                label="Date of Birth"
                value={personalInfo.date_of_birth || ''}
                fieldName="date_of_birth"
                type="date"
                placeholder="Select date of birth"
                onChange={handleFieldChange}
                error={errors.date_of_birth}
              />
              <InlineEditField
                label="Gender"
                value={personalInfo.gender || ''}
                fieldName="gender"
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                  { value: 'Prefer not to say', label: 'Prefer not to say' }
                ]}
                placeholder="Select gender"
                onChange={handleFieldChange}
                error={errors.gender}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="pt-4 border-t border-gray-200/60">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Contact Information
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InlineEditField
                  label="Email Address"
                  value={personalInfo.email || ''}
                  fieldName="email"
                  type="email"
                  isRequired={true}
                  placeholder="Enter email address"
                  onChange={handleFieldChange}
                  error={errors.email}
                />
                <InlineEditField
                  label="Phone Number"
                  value={personalInfo.phone || ''}
                  fieldName="phone"
                  type="tel"
                  isRequired={true}
                  placeholder="Enter phone number"
                  onChange={handleFieldChange}
                  error={errors.phone}
                />
              </div>
            </div>
          </div>

          {/* Mailing Address Section */}
          <div className="pt-4 border-t border-gray-200/60">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Home className="h-5 w-5 text-purple-600" />
              Mailing Address
            </h3>

            <div className="space-y-4">
              <InlineEditField
                label="Street Address"
                value={personalInfo.address || ''}
                fieldName="address"
                placeholder="Enter street address"
                onChange={handleFieldChange}
                error={errors.address}
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <InlineEditField
                  label="City"
                  value={personalInfo.city || ''}
                  fieldName="city"
                  placeholder="Enter city"
                  onChange={handleFieldChange}
                  error={errors.city}
                />
                <InlineEditField
                  label="State"
                  value={personalInfo.state || ''}
                  fieldName="state"
                  placeholder="Enter state"
                  onChange={handleFieldChange}
                  error={errors.state}
                />
                <InlineEditField
                  label="ZIP Code"
                  value={personalInfo.zip_code || ''}
                  fieldName="zip_code"
                  placeholder="Enter ZIP code"
                  onChange={handleFieldChange}
                  error={errors.zip_code}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="pt-4 border-t border-gray-200/60">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              Emergency Contact
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InlineEditField
                  label="Contact Name"
                  value={personalInfo.emergency_contact_name || ''}
                  fieldName="emergency_contact_name"
                  placeholder="Enter emergency contact name"
                  onChange={handleFieldChange}
                  error={errors.emergency_contact_name}
                />
                <InlineEditField
                  label="Relationship"
                  value={personalInfo.emergency_contact_relationship || ''}
                  fieldName="emergency_contact_relationship"
                  options={[
                    { value: 'Spouse', label: 'Spouse' },
                    { value: 'Parent', label: 'Parent' },
                    { value: 'Child', label: 'Child' },
                    { value: 'Sibling', label: 'Sibling' },
                    { value: 'Friend', label: 'Friend' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  placeholder="Select relationship"
                  onChange={handleFieldChange}
                  error={errors.emergency_contact_relationship}
                />
              </div>
              <InlineEditField
                label="Emergency Phone"
                value={personalInfo.emergency_contact_phone || ''}
                fieldName="emergency_contact_phone"
                type="tel"
                placeholder="Enter emergency contact phone"
                onChange={handleFieldChange}
                error={errors.emergency_contact_phone}
              />
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default PersonalInfoStep;
