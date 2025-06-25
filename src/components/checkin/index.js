/**
 * Check-In System Components
 * 
 * Comprehensive check-in module with QR code scanning, manual check-in,
 * member self-service, and tablet-optimized station interface.
 */

// Core check-in components
export { default as QRCodeScanner } from './QRCodeScanner';
export { default as ManualCheckIn } from './ManualCheckIn';
export { default as CheckInStation } from './CheckInStation';
export { default as CheckInAnalytics } from './CheckInAnalytics';

// Services
export { default as CheckInService } from '../../services/checkinService';
export { default as QRCodeService } from '../../services/qrCodeService';

/**
 * Usage Examples:
 * 
 * // QR Code Scanner for staff interface
 * import { QRCodeScanner } from '@/components/checkin';
 * <QRCodeScanner 
 *   onCheckInSuccess={handleSuccess}
 *   onCheckInFailed={handleFailure}
 *   locationId="location-123"
 *   staffMemberId="staff-456"
 * />
 * 
 * // Manual check-in interface
 * import { ManualCheckIn } from '@/components/checkin';
 * <ManualCheckIn 
 *   onCheckInSuccess={handleSuccess}
 *   locationId="location-123"
 *   staffMemberId="staff-456"
 * />
 * 
 * // Check-in analytics dashboard
 * import { CheckInAnalytics } from '@/components/checkin';
 * <CheckInAnalytics
 *   locationId="location-123"
 * />
 *
 * // Full check-in station for tablets
 * import { CheckInStation } from '@/components/checkin';
 * <CheckInStation 
 *   locationId="location-123"
 *   stationId="entrance-1"
 *   staffMemberId="staff-456"
 * />
 * 
 * // Using services directly
 * import { CheckInService, QRCodeService } from '@/components/checkin';
 * 
 * // Manual check-in
 * const result = await CheckInService.manualCheckIn(profileId, staffId);
 * 
 * // QR code check-in
 * const result = await CheckInService.checkInByQRCode(qrData);
 * 
 * // Generate member QR code
 * const qrCode = await QRCodeService.generateMemberQRCode(profileId);
 */
