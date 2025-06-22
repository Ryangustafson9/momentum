/**
 * Corporate Discount Calculator Utility
 * Handles complex discount calculations for corporate partnerships
 */

export class CorporateDiscountCalculator {
  
  /**
   * Calculate the best applicable discount for a member
   * @param {Object} memberAffiliation - Member's corporate affiliation data
   * @param {Array} discounts - Available corporate discounts
   * @param {Object} membershipDetails - Membership type and pricing details
   * @param {Object} options - Additional calculation options
   * @returns {Object} Discount calculation result
   */
  static calculateBestDiscount(memberAffiliation, discounts, membershipDetails, options = {}) {
    if (!memberAffiliation || !discounts || discounts.length === 0) {
      return {
        discountAmount: 0,
        discountPercentage: 0,
        appliedDiscount: null,
        calculationDetails: null,
        eligibleDiscounts: []
      };
    }

    const { membershipTypeId, basePrice, isFamily = false } = membershipDetails;
    const { employeeCount = 0 } = memberAffiliation.corporate_partners || {};
    
    // Filter eligible discounts
    const eligibleDiscounts = this.filterEligibleDiscounts(
      discounts, 
      membershipTypeId, 
      employeeCount, 
      isFamily
    );

    if (eligibleDiscounts.length === 0) {
      return {
        discountAmount: 0,
        discountPercentage: 0,
        appliedDiscount: null,
        calculationDetails: null,
        eligibleDiscounts: []
      };
    }

    // Calculate discount amounts for each eligible discount
    const calculatedDiscounts = eligibleDiscounts.map(discount => {
      const calculation = this.calculateDiscountAmount(discount, basePrice, employeeCount, isFamily);
      return {
        discount,
        ...calculation
      };
    });

    // Find the best discount (highest amount)
    const bestDiscount = calculatedDiscounts.reduce((best, current) => 
      current.discountAmount > best.discountAmount ? current : best
    );

    return {
      discountAmount: bestDiscount.discountAmount,
      discountPercentage: bestDiscount.discountPercentage,
      appliedDiscount: bestDiscount.discount,
      calculationDetails: bestDiscount.calculationDetails,
      eligibleDiscounts: calculatedDiscounts
    };
  }

  /**
   * Filter discounts based on eligibility criteria
   */
  static filterEligibleDiscounts(discounts, membershipTypeId, employeeCount, isFamily) {
    const now = new Date();
    
    return discounts.filter(discount => {
      // Check if discount is active
      if (!discount.is_active) return false;

      // Check date validity
      if (discount.start_date && new Date(discount.start_date) > now) return false;
      if (discount.end_date && new Date(discount.end_date) < now) return false;

      // Check usage limits
      if (discount.max_uses && discount.current_uses >= discount.max_uses) return false;

      // Check membership type specificity
      if (discount.discount_type === 'membership_specific') {
        if (discount.membership_type_id !== membershipTypeId) return false;
      }

      // Check tiered eligibility
      if (discount.discount_type === 'tiered') {
        if (employeeCount < discount.tier_min_employees || 
            employeeCount > discount.tier_max_employees) return false;
      }

      // Check family plan eligibility
      if (discount.discount_type === 'family_bonus' && !isFamily) return false;

      return true;
    });
  }

  /**
   * Calculate discount amount for a specific discount rule
   */
  static calculateDiscountAmount(discount, basePrice, employeeCount, isFamily) {
    let discountAmount = 0;
    let discountPercentage = 0;
    let calculationDetails = {};

    switch (discount.discount_type) {
      case 'percentage':
        discountPercentage = discount.discount_value;
        discountAmount = (basePrice * discountPercentage) / 100;
        calculationDetails = {
          type: 'percentage',
          basePrice,
          percentage: discountPercentage,
          calculation: `${basePrice} × ${discountPercentage}% = ${discountAmount.toFixed(2)}`
        };
        break;

      case 'fixed_amount':
        discountAmount = Math.min(discount.discount_value, basePrice);
        discountPercentage = (discountAmount / basePrice) * 100;
        calculationDetails = {
          type: 'fixed_amount',
          basePrice,
          fixedAmount: discount.discount_value,
          actualDiscount: discountAmount,
          calculation: `Fixed $${discount.discount_value} (max: ${basePrice})`
        };
        break;

      case 'membership_specific':
        discountPercentage = discount.discount_value;
        discountAmount = (basePrice * discountPercentage) / 100;
        calculationDetails = {
          type: 'membership_specific',
          basePrice,
          percentage: discountPercentage,
          membershipType: discount.membership_type_id,
          calculation: `Membership-specific ${discountPercentage}% = ${discountAmount.toFixed(2)}`
        };
        break;

      case 'tiered':
        discountPercentage = discount.discount_value;
        discountAmount = (basePrice * discountPercentage) / 100;
        calculationDetails = {
          type: 'tiered',
          basePrice,
          percentage: discountPercentage,
          employeeCount,
          tierRange: `${discount.tier_min_employees}-${discount.tier_max_employees}`,
          calculation: `Tiered ${discountPercentage}% (${employeeCount} employees) = ${discountAmount.toFixed(2)}`
        };
        break;

      case 'family_bonus':
        if (isFamily) {
          discountPercentage = discount.discount_value;
          discountAmount = (basePrice * discountPercentage) / 100;
          calculationDetails = {
            type: 'family_bonus',
            basePrice,
            percentage: discountPercentage,
            calculation: `Family bonus ${discountPercentage}% = ${discountAmount.toFixed(2)}`
          };
        }
        break;

      default:
        calculationDetails = {
          type: 'unknown',
          error: `Unknown discount type: ${discount.discount_type}`
        };
    }

    // Apply family bonus if applicable and not already a family discount
    if (isFamily && discount.applies_to_family && discount.discount_type !== 'family_bonus') {
      const familyBonus = 0.05; // Additional 5% for family plans
      const bonusAmount = (basePrice * familyBonus);
      discountAmount += bonusAmount;
      discountPercentage = (discountAmount / basePrice) * 100;
      
      calculationDetails.familyBonus = {
        applied: true,
        bonusPercentage: familyBonus * 100,
        bonusAmount: bonusAmount.toFixed(2),
        totalDiscount: discountAmount.toFixed(2)
      };
    }

    return {
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      discountPercentage: Math.round(discountPercentage * 100) / 100,
      calculationDetails
    };
  }

  /**
   * Calculate total savings for a corporate partnership
   */
  static calculatePartnershipSavings(memberAffiliations, discounts) {
    let totalSavings = 0;
    let totalMembers = 0;
    let memberBreakdown = [];

    memberAffiliations.forEach(affiliation => {
      if (affiliation.verification_status !== 'approved') return;

      const membershipDetails = {
        membershipTypeId: affiliation.membership_type_id,
        basePrice: affiliation.base_price || 0,
        isFamily: affiliation.is_family || false
      };

      const discountResult = this.calculateBestDiscount(
        affiliation,
        discounts,
        membershipDetails
      );

      if (discountResult.discountAmount > 0) {
        totalSavings += discountResult.discountAmount;
        totalMembers++;
        
        memberBreakdown.push({
          memberId: affiliation.member_id,
          memberName: affiliation.member_name,
          discountAmount: discountResult.discountAmount,
          discountPercentage: discountResult.discountPercentage,
          appliedDiscount: discountResult.appliedDiscount
        });
      }
    });

    return {
      totalSavings,
      totalMembers,
      averageSavings: totalMembers > 0 ? totalSavings / totalMembers : 0,
      memberBreakdown
    };
  }

  /**
   * Validate discount configuration
   */
  static validateDiscountConfiguration(discount) {
    const errors = [];

    // Required fields
    if (!discount.discount_name) {
      errors.push('Discount name is required');
    }

    if (!discount.discount_type) {
      errors.push('Discount type is required');
    }

    if (!discount.discount_value || discount.discount_value <= 0) {
      errors.push('Discount value must be greater than 0');
    }

    // Type-specific validations
    switch (discount.discount_type) {
      case 'percentage':
        if (discount.discount_value > 100) {
          errors.push('Percentage discount cannot exceed 100%');
        }
        break;

      case 'tiered':
        if (!discount.tier_min_employees || !discount.tier_max_employees) {
          errors.push('Tiered discounts require employee count range');
        }
        if (discount.tier_min_employees >= discount.tier_max_employees) {
          errors.push('Minimum employee count must be less than maximum');
        }
        break;

      case 'membership_specific':
        if (!discount.membership_type_id) {
          errors.push('Membership-specific discounts require a membership type');
        }
        break;
    }

    // Date validations
    if (discount.start_date && discount.end_date) {
      if (new Date(discount.start_date) >= new Date(discount.end_date)) {
        errors.push('Start date must be before end date');
      }
    }

    // Usage limit validation
    if (discount.max_uses && discount.max_uses < 1) {
      errors.push('Maximum uses must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format discount for display
   */
  static formatDiscountDisplay(discount) {
    let displayText = '';
    
    switch (discount.discount_type) {
      case 'percentage':
        displayText = `${discount.discount_value}% off`;
        break;
      case 'fixed_amount':
        displayText = `$${discount.discount_value} off`;
        break;
      case 'membership_specific':
        displayText = `${discount.discount_value}% off specific memberships`;
        break;
      case 'tiered':
        displayText = `${discount.discount_value}% off (${discount.tier_min_employees}-${discount.tier_max_employees} employees)`;
        break;
      case 'family_bonus':
        displayText = `${discount.discount_value}% family bonus`;
        break;
      default:
        displayText = `${discount.discount_value}% off`;
    }

    if (discount.applies_to_family && discount.discount_type !== 'family_bonus') {
      displayText += ' + family bonus';
    }

    return displayText;
  }
}

export default CorporateDiscountCalculator;

