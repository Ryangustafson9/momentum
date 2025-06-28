import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, PenTool, Check, X } from 'lucide-react';

const AgreementStep = ({ 
  salesData, 
  updateSalesData, 
  updateStepValidation, 
  existingMember 
}) => {
  const [formData, setFormData] = useState(salesData.agreement);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [signaturePad, setSignaturePad] = useState(null);
  const canvasRef = useRef(null);

  // Generate membership agreement text
  const generateAgreementText = () => {
    const { personalInfo, membershipSelection } = salesData;
    const memberName = `${personalInfo.first_name} ${personalInfo.last_name}`;
    const membershipName = membershipSelection.membershipType?.name || 'Selected Membership';
    const monthlyFee = membershipSelection.monthlyFee || 0;
    const enrollmentFee = membershipSelection.enrollmentFee || 0;
    const startDate = new Date(membershipSelection.startDate).toLocaleDateString();
    const contractLength = membershipSelection.contractLength || 0;

    return `
MEMBERSHIP AGREEMENT

Member Information:
Name: ${memberName}
Email: ${personalInfo.email}
Phone: ${personalInfo.phone}
Address: ${personalInfo.address}, ${personalInfo.city}, ${personalInfo.state} ${personalInfo.zip_code}

Membership Details:
Plan: ${membershipName}
Start Date: ${startDate}
Monthly Fee: $${monthlyFee.toFixed(2)}
${enrollmentFee > 0 ? `Enrollment Fee: $${enrollmentFee.toFixed(2)}` : ''}
Contract Length: ${contractLength} months

TERMS AND CONDITIONS:

1. MEMBERSHIP TERMS
This agreement grants the member access to the fitness facility and its amenities for the duration specified above.

2. PAYMENT TERMS
Monthly fees are due on the same date each month as the start date. Enrollment fees are due upon signing this agreement.

3. CANCELLATION POLICY
Members may cancel their membership with 30 days written notice. Cancellation fees may apply as outlined in the membership terms.

4. FACILITY RULES
Members agree to follow all facility rules and regulations. Violation of rules may result in membership termination.

5. LIABILITY WAIVER
Member acknowledges that participation in fitness activities involves inherent risks and agrees to hold the facility harmless from any injuries or damages.

6. AUTOMATIC RENEWAL
Unless cancelled in writing, this membership will automatically renew for successive terms.

By signing below, I acknowledge that I have read, understood, and agree to be bound by the terms and conditions of this membership agreement.

Member Signature: _________________________ Date: _____________

Print Name: ${memberName}
    `.trim();
  };

  // Initialize signature pad
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      
      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = 150;
      
      setSignaturePad(ctx);
    }
  }, []);

  // Handle mouse/touch events for signature
  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    signaturePad.beginPath();
    signaturePad.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    signaturePad.lineTo(x, y);
    signaturePad.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      signaturePad.closePath();
      
      // Save signature as data URL
      const signatureData = canvasRef.current.toDataURL();
      handleInputChange('signature', signatureData);
    }
  };

  // Clear signature
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleInputChange('signature', null);
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    
    if (field === 'signature' && value) {
      newFormData.signedAt = new Date().toISOString();
      newFormData.ipAddress = 'localhost'; // In production, get actual IP
    }
    
    setFormData(newFormData);
    updateSalesData('agreement', newFormData);
  };

  // Validate form
  const validateForm = () => {
    const isValid = hasAgreed && formData.signature;
    updateStepValidation('agreement', isValid);
    return isValid;
  };

  // Validate on form data changes
  useEffect(() => {
    validateForm();
  }, [formData, hasAgreed]);

  // Initialize form data and agreement text
  useEffect(() => {
    setFormData(salesData.agreement);
    const agreementText = generateAgreementText();
    handleInputChange('terms', agreementText);
  }, [salesData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">Membership Agreement</h3>
        <p className="text-sm text-muted-foreground">
          Review the agreement and provide your electronic signature
        </p>
      </div>

      {/* Agreement Text */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Membership Agreement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {formData.terms}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Agreement Checkbox */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="agreement-checkbox"
              checked={hasAgreed}
              onCheckedChange={setHasAgreed}
            />
            <div className="space-y-1">
              <Label 
                htmlFor="agreement-checkbox" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and agree to the terms and conditions
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you acknowledge that you have read, understood, and agree to be bound by the membership agreement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Electronic Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Electronic Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">
              Please sign in the box below using your mouse or finger
            </Label>
            <div className="mt-2 border-2 border-dashed border-muted-foreground rounded-lg p-2">
              <canvas
                ref={canvasRef}
                className="w-full cursor-crosshair bg-white rounded"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                Sign above to complete your membership agreement
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            </div>
          </div>

          {formData.signature && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Signature captured successfully</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Signed on {new Date(formData.signedAt).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Agreement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Member:</span>
              <span className="font-medium">
                {salesData.personalInfo.first_name} {salesData.personalInfo.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Membership:</span>
              <span className="font-medium">
                {salesData.membershipSelection.membershipType?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Fee:</span>
              <span className="font-medium">
                ${salesData.membershipSelection.monthlyFee?.toFixed(2)}
              </span>
            </div>
            {salesData.membershipSelection.enrollmentFee > 0 && (
              <div className="flex justify-between">
                <span>Enrollment Fee:</span>
                <span className="font-medium">
                  ${salesData.membershipSelection.enrollmentFee?.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Start Date:</span>
              <span className="font-medium">
                {new Date(salesData.membershipSelection.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Agreement Status:</span>
              <span className={`font-medium ${hasAgreed && formData.signature ? 'text-green-600' : 'text-red-600'}`}>
                {hasAgreed && formData.signature ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgreementStep;
