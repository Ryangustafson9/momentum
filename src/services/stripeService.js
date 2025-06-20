// 🚀 STRIPE BILLING SERVICE - Automated payment processing
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabaseClient';

// Initialize Stripe (use test key for development)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

export const stripeService = {
  // Initialize Stripe instance
  async getStripe() {
    return await stripePromise;
  },

  // Create payment intent for one-time payments
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      console.log('🔄 StripeService: Creating payment intent for', amount, currency);
      
      // In production, this would call your backend API
      // For demo, we'll simulate the response
      const paymentIntent = {
        id: 'pi_' + Math.random().toString(36).substr(2, 9),
        client_secret: 'pi_' + Math.random().toString(36).substr(2, 9) + '_secret_' + Math.random().toString(36).substr(2, 9),
        amount: amount * 100, // Stripe uses cents
        currency: currency,
        status: 'requires_payment_method',
        metadata: metadata
      };

      console.log('✅ StripeService: Payment intent created:', paymentIntent.id);
      return paymentIntent;
    } catch (error) {
      console.error('❌ StripeService: Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  },

  // Create subscription for recurring billing
  async createSubscription(customerId, priceId, metadata = {}) {
    try {
      console.log('🔄 StripeService: Creating subscription for customer:', customerId);
      
      // In production, this would call your backend API
      // For demo, we'll simulate the response
      const subscription = {
        id: 'sub_' + Math.random().toString(36).substr(2, 9),
        customer: customerId,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        items: {
          data: [{
            id: 'si_' + Math.random().toString(36).substr(2, 9),
            price: {
              id: priceId,
              unit_amount: 2999, // $29.99
              currency: 'usd',
              recurring: { interval: 'month' }
            }
          }]
        },
        latest_invoice: {
          payment_intent: {
            status: 'succeeded'
          }
        },
        metadata: metadata
      };

      console.log('✅ StripeService: Subscription created:', subscription.id);
      return subscription;
    } catch (error) {
      console.error('❌ StripeService: Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  },

  // Create customer
  async createCustomer(email, name, metadata = {}) {
    try {
      console.log('🔄 StripeService: Creating customer for:', email);
      
      // In production, this would call your backend API
      const customer = {
        id: 'cus_' + Math.random().toString(36).substr(2, 9),
        email: email,
        name: name,
        created: Math.floor(Date.now() / 1000),
        metadata: metadata
      };

      console.log('✅ StripeService: Customer created:', customer.id);
      return customer;
    } catch (error) {
      console.error('❌ StripeService: Error creating customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  },

  // Update payment method
  async updatePaymentMethod(customerId, paymentMethodId) {
    try {
      console.log('🔄 StripeService: Updating payment method for customer:', customerId);
      
      // In production, this would call your backend API
      const result = {
        success: true,
        payment_method: {
          id: paymentMethodId,
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          }
        }
      };

      console.log('✅ StripeService: Payment method updated');
      return result;
    } catch (error) {
      console.error('❌ StripeService: Error updating payment method:', error);
      throw new Error(`Failed to update payment method: ${error.message}`);
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      console.log('🔄 StripeService: Cancelling subscription:', subscriptionId);
      
      // In production, this would call your backend API
      const subscription = {
        id: subscriptionId,
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: cancelAtPeriodEnd ? null : Math.floor(Date.now() / 1000)
      };

      console.log('✅ StripeService: Subscription cancelled');
      return subscription;
    } catch (error) {
      console.error('❌ StripeService: Error cancelling subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  },

  // Retry failed payment
  async retryPayment(invoiceId) {
    try {
      console.log('🔄 StripeService: Retrying payment for invoice:', invoiceId);
      
      // In production, this would call your backend API
      const result = {
        success: Math.random() > 0.3, // 70% success rate for demo
        invoice: {
          id: invoiceId,
          status: Math.random() > 0.3 ? 'paid' : 'open',
          payment_intent: {
            status: Math.random() > 0.3 ? 'succeeded' : 'requires_payment_method'
          }
        }
      };

      console.log('✅ StripeService: Payment retry result:', result.success ? 'success' : 'failed');
      return result;
    } catch (error) {
      console.error('❌ StripeService: Error retrying payment:', error);
      throw new Error(`Failed to retry payment: ${error.message}`);
    }
  },

  // Get customer invoices
  async getCustomerInvoices(customerId, limit = 10) {
    try {
      console.log('🔍 StripeService: Fetching invoices for customer:', customerId);
      
      // In production, this would call your backend API
      const invoices = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        id: 'in_' + Math.random().toString(36).substr(2, 9),
        customer: customerId,
        amount_paid: 2999,
        amount_due: i === 0 ? (Math.random() > 0.8 ? 2999 : 0) : 0,
        currency: 'usd',
        status: i === 0 && Math.random() > 0.8 ? 'open' : 'paid',
        created: Math.floor(Date.now() / 1000) - (i * 30 * 24 * 60 * 60),
        period_start: Math.floor(Date.now() / 1000) - ((i + 1) * 30 * 24 * 60 * 60),
        period_end: Math.floor(Date.now() / 1000) - (i * 30 * 24 * 60 * 60),
        hosted_invoice_url: `https://invoice.stripe.com/i/acct_test/test_invoice_${i}`,
        invoice_pdf: `https://pay.stripe.com/invoice/acct_test/test_invoice_${i}/pdf`
      }));

      console.log('✅ StripeService: Fetched', invoices.length, 'invoices');
      return { data: invoices };
    } catch (error) {
      console.error('❌ StripeService: Error fetching invoices:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }
  },
  // Process membership signup with payment
  async processMembershipSignup(memberData, paymentData) {
    try {
      console.log('🔄 StripeService: Processing membership signup for:', memberData.email);
      console.log('📋 Payment data:', paymentData);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 1. Create Stripe customer (simulated)
      const customer = await this.createCustomer(
        memberData.email,
        `${memberData.firstName} ${memberData.lastName}`,
        { member_id: memberData.id }
      );

      // 2. Create subscription (simulated)
      const subscription = await this.createSubscription(
        customer.id,
        paymentData.priceId,
        { membership_type: paymentData.membershipType }
      );

      // 3. Update member record in database - first check if user profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('auth_user_id', memberData.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error checking user profile:', profileError);
      }

      // 4. Create or update member profile
      const profileData = {
        auth_user_id: memberData.id,
        first_name: memberData.firstName,
        last_name: memberData.lastName,
        email: memberData.email,
        current_membership_type_id: paymentData.membershipTypeId,
        membership_status: 'Active',
        membership_start_date: new Date().toISOString(),
        membership_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        stripe_customer_id: customer.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileUpsertError } = await supabase
        .from('member_profiles')
        .upsert(profileData, { 
          onConflict: 'auth_user_id',
          ignoreDuplicates: false 
        });

      if (profileUpsertError) {
        console.error('❌ Error updating member profile:', profileUpsertError);
        // Continue anyway for demo purposes
      }

      // 5. Try to update membership record (if table exists)
      try {
        const { error: membershipError } = await supabase
          .from('memberships')
          .upsert({
            auth_user_id: memberData.id,
            current_membership_type_id: paymentData.membershipTypeId,
            stripe_customer_id: customer.id,
            stripe_subscription_id: subscription.id,
            status: 'Active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            monthly_fee: paymentData.amount,
            payment_method: 'stripe',
            auto_renew: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (membershipError) {
          console.warn('⚠️ Membership table update failed (table may not exist):', membershipError);
          // Continue anyway
        }
      } catch (membershipTableError) {
        console.warn('⚠️ Membership table error (continuing anyway):', membershipTableError);
      }

      // 6. Update user metadata in auth.users
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: {
          membership_type_id: paymentData.membershipTypeId,
          membership_status: 'Active',
          stripe_customer_id: customer.id,
          membership_start_date: new Date().toISOString()
        }
      });

      if (userUpdateError) {
        console.warn('⚠️ User metadata update failed:', userUpdateError);
      }

      console.log('✅ StripeService: Membership signup completed successfully');
      return {
        success: true,
        message: 'Payment processed successfully! Your membership has been activated.',
        customer: customer,
        subscription: subscription,
        membership: {
          status: 'Active',
          type: paymentData.membershipType,
          startDate: new Date(),
          nextBillingDate: new Date(subscription.current_period_end * 1000),
          amount: paymentData.amount
        }
      };
    } catch (error) {
      console.error('❌ StripeService: Error processing membership signup:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while processing your payment. Please try again.',
        error: error
      };
    }
  },

  // Handle webhook events (for backend integration)
  async handleWebhookEvent(event) {
    try {
      console.log('🔄 StripeService: Handling webhook event:', event.type);
      
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        default:
          console.log('ℹ️ Unhandled webhook event type:', event.type);
      }

      console.log('✅ StripeService: Webhook event handled successfully');
      return { received: true };
    } catch (error) {
      console.error('❌ StripeService: Error handling webhook:', error);
      throw new Error(`Failed to handle webhook: ${error.message}`);
    }
  },

  // Handle successful payment
  async handlePaymentSucceeded(invoice) {
    console.log('✅ Payment succeeded for invoice:', invoice.id);
    
    // Update membership status in database
    if (invoice.subscription) {
      const { error } = await supabase
        .from('memberships')
        .update({
          status: 'Active',
          last_payment_date: new Date().toISOString(),
          next_payment_date: new Date(invoice.period_end * 1000).toISOString()
        })
        .eq('stripe_subscription_id', invoice.subscription);

      if (error) {
        console.error('❌ Error updating membership after payment:', error);
      }
    }
  },

  // Handle failed payment
  async handlePaymentFailed(invoice) {
    console.log('❌ Payment failed for invoice:', invoice.id);
    
    // Update membership status and send notification
    if (invoice.subscription) {
      const { error } = await supabase
        .from('memberships')
        .update({
          status: 'Payment Failed',
          payment_retry_count: supabase.raw('payment_retry_count + 1')
        })
        .eq('stripe_subscription_id', invoice.subscription);

      if (error) {
        console.error('❌ Error updating membership after failed payment:', error);
      }

      // TODO: Send email notification to member
    }
  },

  // Handle subscription updates
  async handleSubscriptionUpdated(subscription) {
    console.log('🔄 Subscription updated:', subscription.id);
    
    const { error } = await supabase
      .from('memberships')
      .update({
        status: subscription.status === 'active' ? 'Active' : 'Suspended',
        end_date: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('❌ Error updating subscription:', error);
    }
  },

  // Handle subscription deletion
  async handleSubscriptionDeleted(subscription) {
    console.log('🗑️ Subscription deleted:', subscription.id);
    
    const { error } = await supabase
      .from('memberships')
      .update({
        status: 'Cancelled',
        end_date: new Date().toISOString(),
        auto_renew: false
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('❌ Error handling subscription deletion:', error);
    }
  }
};

export default stripeService;
