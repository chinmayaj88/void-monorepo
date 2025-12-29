import { createHash } from 'crypto';

export interface DeviceInfo {
    userAgent: string;
    ipAddress: string;
    deviceName?: string;
}

export interface DeviceFingerprint {
    fingerprint: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

export class DeviceFingerprintService {
    /**
     * Generates a unique device fingerprint from user agent and IP
     * This is used to identify devices for security purposes
     */
    static generateFingerprint(info: DeviceInfo): string {
        // Combine user agent and IP to create fingerprint
        // In production, you might want to include more factors
        const data = `${info.userAgent}|${info.ipAddress}`;
        return createHash('sha256').update(data).digest('hex');
    }

    /**
     * Detects device type from user agent
     */
    static detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
        const ua = userAgent.toLowerCase();
        
        if (/tablet|ipad|playbook|silk/i.test(ua)) {
            return 'tablet';
        }
        
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
            return 'mobile';
        }
        
        if (/desktop|laptop|macintosh|windows|linux/i.test(ua)) {
            return 'desktop';
        }
        
        return 'unknown';
    }

    /**
     * Extracts device name from user agent
     */
    static extractDeviceName(userAgent: string): string {
        // Try to extract browser and OS info
        const ua = userAgent;
        
        // Extract browser
        let browser = 'Unknown Browser';
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('Opera')) browser = 'Opera';
        
        // Extract OS
        let os = 'Unknown OS';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iOS')) os = 'iOS';
        
        return `${os} - ${browser}`;
    }

    /**
     * Creates a complete device fingerprint object
     */
    static createDeviceFingerprint(info: DeviceInfo): DeviceFingerprint {
        const fingerprint = this.generateFingerprint(info);
        const deviceName = info.deviceName || this.extractDeviceName(info.userAgent);
        const deviceType = this.detectDeviceType(info.userAgent);
        
        return {
            fingerprint,
            deviceName,
            deviceType,
        };
    }
}

