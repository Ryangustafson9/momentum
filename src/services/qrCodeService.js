import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import { supabase } from '@/lib/supabaseClient';

/**
 * QR Code Service for Member Access
 * Handles QR code generation, encryption, and validation
 */
export class QRCodeService {
  
  // Secret key for QR code encryption (in production, use environment variable)
  static SECRET_KEY = import.meta.env.VITE_QR_SECRET_KEY || 'momentum-gym-qr-secret-2025';
  
  /**
   * Generate QR code for a member
   */
  static async generateMemberQRCode(profileId, options = {}) {
    try {
      const {
        expiresInDays = 365,
        cardType = 'qr_code',
        issuedBy = null
      } = options;

      // Create encrypted QR code data
      const qrData = await this.createQRCodeData(profileId, expiresInDays);
      
      // Generate QR code image
      const qrCodeImage = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Calculate expiry date
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + expiresInDays);

      // Save to database
      const { data: accessCard, error } = await supabase
        .from('member_access_cards')
        .insert([{
          profile_id: profileId,
          card_type: cardType,
          qr_code_data: qrData,
          is_active: true,
          is_primary: true, // Will be handled by trigger to ensure only one primary
          expires_date: expiresDate.toISOString(),
          issued_by: issuedBy,
          metadata: {
            qr_code_version: '1.0',
            generated_at: new Date().toISOString(),
            expires_in_days: expiresInDays
          }
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving QR code to database:', error);
        throw new Error('Failed to save QR code');
      }

      return {
        success: true,
        qrCodeImage,
        qrCodeData: qrData,
        accessCard,
        expiresDate
      };

    } catch (error) {
      console.error('Error generating QR code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create encrypted QR code data
   */
  static async createQRCodeData(profileId, expiresInDays) {
    const payload = {
      id: profileId,
      exp: Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60), // Expiry timestamp
      iat: Math.floor(Date.now() / 1000), // Issued at timestamp
      type: 'member_access',
      version: '1.0'
    };

    // Encrypt the payload
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload), 
      this.SECRET_KEY
    ).toString();

    // Create final QR code data with prefix
    return `MOMENTUM:${encrypted}`;
  }

  /**
   * Decode and validate QR code data
   */
  static async decodeQRCodeData(qrCodeData) {
    try {
      // Check if it's a Momentum QR code
      if (!qrCodeData.startsWith('MOMENTUM:')) {
        return {
          valid: false,
          reason: 'invalid_format',
          message: 'Invalid QR code format'
        };
      }

      // Extract encrypted data
      const encryptedData = qrCodeData.replace('MOMENTUM:', '');
      
      // Decrypt the data
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.SECRET_KEY);
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedData) {
        return {
          valid: false,
          reason: 'decryption_failed',
          message: 'Failed to decrypt QR code'
        };
      }

      const payload = JSON.parse(decryptedData);

      // Validate payload structure
      if (!payload.id || !payload.exp || !payload.type) {
        return {
          valid: false,
          reason: 'invalid_payload',
          message: 'Invalid QR code payload'
        };
      }

      // Check if QR code has expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return {
          valid: false,
          reason: 'expired',
          message: 'QR code has expired'
        };
      }

      // Verify QR code exists in database and is active
      const { data: accessCard, error } = await supabase
        .from('member_access_cards')
        .select('*')
        .eq('qr_code_data', qrCodeData)
        .eq('is_active', true)
        .single();

      if (error || !accessCard) {
        return {
          valid: false,
          reason: 'not_found',
          message: 'QR code not found or inactive'
        };
      }

      return {
        valid: true,
        profileId: payload.id,
        accessCard,
        payload
      };

    } catch (error) {
      console.error('Error decoding QR code:', error);
      return {
        valid: false,
        reason: 'decode_error',
        message: 'Error decoding QR code'
      };
    }
  }

  /**
   * Get member's active QR codes
   */
  static async getMemberQRCodes(profileId) {
    try {
      const { data: accessCards, error } = await supabase
        .from('member_access_cards')
        .select('*')
        .eq('profile_id', profileId)
        .eq('card_type', 'qr_code')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Generate QR code images for each card
      const qrCodes = await Promise.all(
        (accessCards || []).map(async (card) => {
          try {
            const qrCodeImage = await QRCode.toDataURL(card.qr_code_data, {
              width: 300,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });

            return {
              ...card,
              qrCodeImage
            };
          } catch (error) {
            console.error('Error generating QR image for card:', card.id, error);
            return {
              ...card,
              qrCodeImage: null
            };
          }
        })
      );

      return {
        success: true,
        qrCodes
      };

    } catch (error) {
      console.error('Error fetching member QR codes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Deactivate a QR code
   */
  static async deactivateQRCode(accessCardId, reason = 'manual_deactivation') {
    try {
      const { data, error } = await supabase
        .from('member_access_cards')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
          metadata: {
            deactivated_at: new Date().toISOString(),
            deactivation_reason: reason
          }
        })
        .eq('id', accessCardId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        accessCard: data
      };

    } catch (error) {
      console.error('Error deactivating QR code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate access card number (for non-QR cards)
   */
  static generateAccessCardNumber(prefix = 'MOM') {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Create physical access card
   */
  static async createAccessCard(profileId, cardType = 'rfid', options = {}) {
    try {
      const {
        cardNumber = null,
        expiresInDays = 365,
        issuedBy = null
      } = options;

      const finalCardNumber = cardNumber || this.generateAccessCardNumber();
      
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + expiresInDays);

      const { data: accessCard, error } = await supabase
        .from('member_access_cards')
        .insert([{
          profile_id: profileId,
          card_number: finalCardNumber,
          card_type: cardType,
          is_active: true,
          expires_date: expiresDate.toISOString(),
          issued_by: issuedBy,
          metadata: {
            card_version: '1.0',
            generated_at: new Date().toISOString(),
            expires_in_days: expiresInDays
          }
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        accessCard,
        cardNumber: finalCardNumber
      };

    } catch (error) {
      console.error('Error creating access card:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate access card
   */
  static async validateAccessCard(cardNumber) {
    try {
      const { data: accessCard, error } = await supabase
        .from('member_access_cards')
        .select(`
          *,
          profile:profiles(
            id,
            first_name,
            last_name,
            email,
            status,
            role
          )
        `)
        .eq('card_number', cardNumber)
        .eq('is_active', true)
        .single();

      if (error || !accessCard) {
        return {
          valid: false,
          reason: 'card_not_found',
          message: 'Access card not found or inactive'
        };
      }

      // Check if card is expired
      if (accessCard.expires_date && new Date(accessCard.expires_date) < new Date()) {
        return {
          valid: false,
          reason: 'card_expired',
          message: 'Access card has expired'
        };
      }

      return {
        valid: true,
        accessCard,
        profile: accessCard.profile
      };

    } catch (error) {
      console.error('Error validating access card:', error);
      return {
        valid: false,
        reason: 'validation_error',
        message: 'Error validating access card'
      };
    }
  }

  /**
   * Get QR code for display (without sensitive data)
   */
  static async getDisplayQRCode(profileId) {
    try {
      const { data: accessCard, error } = await supabase
        .from('member_access_cards')
        .select('qr_code_data, expires_date, is_active')
        .eq('profile_id', profileId)
        .eq('card_type', 'qr_code')
        .eq('is_active', true)
        .eq('is_primary', true)
        .single();

      if (error || !accessCard) {
        // Generate new QR code if none exists
        return await this.generateMemberQRCode(profileId);
      }

      // Generate QR code image
      const qrCodeImage = await QRCode.toDataURL(accessCard.qr_code_data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        success: true,
        qrCodeImage,
        expiresDate: accessCard.expires_date,
        isActive: accessCard.is_active
      };

    } catch (error) {
      console.error('Error getting display QR code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default QRCodeService;
