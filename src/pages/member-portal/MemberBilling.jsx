
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, CreditCard, FileText, Download } from 'lucide-react';

const MemberBillingPage = () => {
  // Placeholder data - replace with actual data fetching
  const billingHistory = [
    { id: 'inv-003', date: '2025-04-01', description: 'Monthly Membership Fee - April', amount: 59.99, status: 'Paid' },
    { id: 'inv-002', date: '2025-03-01', description: 'Monthly Membership Fee - March', amount: 59.99, status: 'Paid' },
    { id: 'inv-001', date: '2025-02-01', description: 'Monthly Membership Fee - February & Sign-up', amount: 79.99, status: 'Paid' },
  ];

  const paymentMethods = [
    { id: 'pm-001', type: 'Visa', last4: '4242', expiry: '12/2027', isDefault: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing Information</h1>
        <p className="text-muted-foreground mt-1">Manage your payment methods, view invoices, and make payments.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary" /> Outstanding Balance</CardTitle>
          <CardDescription>Your current account balance and next payment details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="text-sm text-green-700">Current Balance</p>
              <p className="text-3xl font-bold text-green-600">$0.00</p>
            </div>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md">
              Make a Payment
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Next payment of <strong>$59.99</strong> is due on <strong>May 1, 2025</strong>.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary" /> Payment Methods</CardTitle>
            <CardDescription>Your saved payment options.</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <CreditCard className="mr-1 h-4 w-4" /> Add New Method
          </Button>
        </CardHeader>
        <CardContent>
          {paymentMethods.length > 0 ? (
            <ul className="space-y-3">
              {paymentMethods.map(method => (
                <li key={method.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center">
                    <CreditCard className="h-6 w-6 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-slate-800">{method.type} ending in {method.last4}</p>
                      <p className="text-sm text-slate-500">Expires: {method.expiry}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {method.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>}
                    <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive/80">Remove</Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No payment methods saved.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Billing History</CardTitle>
          <CardDescription>Your past invoices and payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingHistory.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{invoice.description}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${invoice.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        <Button variant="link" size="sm" className="text-primary hover:text-primary/80 p-0 h-auto">
                           <Download className="h-4 w-4 mr-1"/> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No billing history found.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MemberBillingPage;


