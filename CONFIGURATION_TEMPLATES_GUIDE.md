# Configuration Templates System

## Overview

The **Configuration Templates** system provides a flexible way to create, manage, and reuse configuration settings for different types of fitness businesses. This system allows administrators to define pre-configured templates that can be applied when setting up new locations or updating existing ones.

## What are Configuration Templates?

Configuration templates are predefined sets of business rules, billing configurations, and payment settings that can be applied to locations based on their business type. For example:

- **Gym Franchise Template**: Standard monthly billing, family discounts, personal training
- **Boutique Fitness Template**: Session-based billing, class packages, premium pricing
- **Martial Arts Template**: Belt testing fees, uniform sales, tournament registration
- **Yoga Studio Template**: Class passes, workshop pricing, teacher training fees

## Template Structure

Each configuration template contains three main sections:

### 1. Billing Configuration
- **Membership billing type** (monthly, annual, session-based, flexible)
- **Late fees and grace periods**
- **Family discounts and multi-member pricing**
- **Personal training rates**
- **Day passes and guest passes**
- **Initiation fees**
- **Annual discount options**

### 2. Payment Configuration
- **Accepted payment methods** (credit card, bank transfer, cash, etc.)
- **Payment processor** (Stripe, Square, PayPal, Authorize.Net)
- **Auto-payment settings**
- **Payment retry logic**
- **Failed payment handling**

### 3. Business Rules
- **Minimum membership duration**
- **Cancellation notice requirements**
- **Membership freeze policies**
- **Transfer policies and fees**
- **Prorated billing rules**
- **Suspension and reactivation policies**

## Template Categories

Templates are organized by business type:

- **Gym Franchise**: Traditional gym chains and franchises
- **Boutique Fitness**: Specialized fitness studios (HIIT, Pilates, etc.)
- **Martial Arts**: Karate, BJJ, MMA, and other martial arts schools
- **Yoga Studio**: Yoga and meditation studios
- **CrossFit Box**: CrossFit and functional fitness gyms
- **Swimming Pool**: Aquatic centers and swim schools
- **Personal Training**: Personal training studios and independent trainers
- **Custom**: User-created templates for unique business models

## How to Use Templates

### Creating a Template
1. Navigate to **Admin Panel > Templates**
2. Click **"Create Template"**
3. Fill in basic information (name, description, category)
4. Configure billing settings in the **Billing** tab
5. Set up payment options in the **Payment** tab
6. Define business rules in the **Business Rules** tab
7. Save the template

### Applying a Template
Templates can be applied when:
- Creating a new location (select template during setup)
- Updating an existing location's configuration
- Migrating from old billing rules to new ones

### Template Management
- **View**: See all configuration details in a readable format
- **Edit**: Modify existing templates (non-official templates only)
- **Duplicate**: Create a copy of any template to use as a starting point
- **Export/Import**: Share templates between organizations
- **Usage Tracking**: See how many locations use each template

## Official vs Custom Templates

### Official Templates
- Created and maintained by Momentum
- Marked with a ⭐ **Official** badge
- Cannot be edited (but can be duplicated)
- Updated automatically with best practices
- Thoroughly tested across multiple locations

### Custom Templates
- Created by individual organizations
- Fully editable by the creating organization
- Can be shared with other organizations
- Usage tracked for popularity insights

## Template Migration

When applying a new template to an existing location, you can choose:

- **Apply to All**: Update all existing memberships immediately
- **Grandfather All**: Keep existing members on old rules, new rules for new members only
- **New Members Only**: Only apply to future memberships (default)
- **Selective**: Choose specific memberships to update

## Benefits

### For Administrators
- **Consistency**: Ensure all locations follow standardized business practices
- **Speed**: Quick setup of new locations with proven configurations
- **Best Practices**: Access to industry-tested billing and business rules
- **Flexibility**: Customize templates to match specific business needs

### For Multi-Location Organizations
- **Standardization**: Maintain consistency across all locations
- **Rapid Expansion**: Quickly configure new locations
- **A/B Testing**: Test different configurations across locations
- **Reporting**: Compare performance across different template types

### For Franchises
- **Brand Consistency**: Ensure all franchisees follow brand standards
- **Compliance**: Meet regulatory and business requirements
- **Support**: Reduce support burden with standardized configurations
- **Updates**: Roll out policy changes across all locations efficiently

## Integration with Location Management

Templates integrate seamlessly with the location management system:
- Templates are automatically applied during location creation
- Existing configurations can be saved as new templates
- Template changes can trigger migration workflows
- Analytics track template performance across locations

## Future Enhancements

Planned improvements include:
- **Template Versioning**: Track changes and roll back if needed
- **Conditional Rules**: Templates that adapt based on location characteristics
- **AI Recommendations**: Suggest optimal templates based on business data
- **Industry Benchmarking**: Compare template performance against industry standards
- **Template Marketplace**: Share and discover templates across organizations
