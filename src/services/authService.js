// Authentication Service for OXYBLE App
// Handles Telegram WebApp authentication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.oxyble.com';

/**
 * Get Telegram WebApp data
 */
export const getTelegramWebAppData = () => {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        return {
            initData: tg.initData,
            initDataUnsafe: tg.initDataUnsafe,
            user: tg.initDataUnsafe?.user,
            webAppInfo: tg.initDataUnsafe?.web_app_info,
            platform: tg.platform,
            version: tg.version,
            colorScheme: tg.colorScheme,
            themeParams: tg.themeParams,
            isExpanded: tg.isExpanded,
            viewportHeight: tg.viewportHeight,
            viewportStableHeight: tg.viewportStableHeight,
            headerColor: tg.headerColor,
            backgroundColor: tg.backgroundColor,
            isClosingConfirmationEnabled: tg.isClosingConfirmationEnabled,
            backButton: tg.backButton,
            mainButton: tg.mainButton,
            hapticFeedback: tg.hapticFeedback,
            cloudStorage: tg.cloudStorage,
            invoice: tg.invoice,
            settings: tg.settings,
            data: tg.data,
            ready: tg.ready,
            expand: tg.expand,
            close: tg.close,
            isVersionAtLeast: tg.isVersionAtLeast,
            setHeaderColor: tg.setHeaderColor,
            setBackgroundColor: tg.setBackgroundColor,
            enableClosingConfirmation: tg.enableClosingConfirmation,
            disableClosingConfirmation: tg.disableClosingConfirmation,
            onEvent: tg.onEvent,
            offEvent: tg.offEvent,
            sendData: tg.sendData,
            switchInlineQuery: tg.switchInlineQuery,
            openLink: tg.openLink,
            openTelegramLink: tg.openTelegramLink,
            openInvoice: tg.openInvoice,
            showPopup: tg.showPopup,
            showAlert: tg.showAlert,
            showConfirm: tg.showConfirm,
            showScanQrPopup: tg.showScanQrPopup,
            closeScanQrPopup: tg.closeScanQrPopup,
            readTextFromClipboard: tg.readTextFromClipboard,
            requestWriteAccess: tg.requestWriteAccess,
            requestContact: tg.requestContact,
            invokeCustomMethod: tg.invokeCustomMethod,
            isClosingConfirmationEnabled: tg.isClosingConfirmationEnabled,
            isExpanded: tg.isExpanded,
            viewportHeight: tg.viewportHeight,
            viewportStableHeight: tg.viewportStableHeight,
            headerColor: tg.headerColor,
            backgroundColor: tg.backgroundColor,
            isClosingConfirmationEnabled: tg.isClosingConfirmationEnabled,
            backButton: tg.backButton,
            mainButton: tg.mainButton,
            hapticFeedback: tg.hapticFeedback,
            cloudStorage: tg.cloudStorage,
            invoice: tg.invoice,
            settings: tg.settings,
            data: tg.data,
            ready: tg.ready,
            expand: tg.expand,
            close: tg.close,
            isVersionAtLeast: tg.isVersionAtLeast,
            setHeaderColor: tg.setHeaderColor,
            setBackgroundColor: tg.setBackgroundColor,
            enableClosingConfirmation: tg.enableClosingConfirmation,
            disableClosingConfirmation: tg.disableClosingConfirmation,
            onEvent: tg.onEvent,
            offEvent: tg.offEvent,
            sendData: tg.sendData,
            switchInlineQuery: tg.switchInlineQuery,
            openLink: tg.openLink,
            openTelegramLink: tg.openTelegramLink,
            openInvoice: tg.openInvoice,
            showPopup: tg.showPopup,
            showAlert: tg.showAlert,
            showConfirm: tg.showConfirm,
            showScanQrPopup: tg.showScanQrPopup,
            closeScanQrPopup: tg.closeScanQrPopup,
            readTextFromClipboard: tg.readTextFromClipboard,
            requestWriteAccess: tg.requestWriteAccess,
            requestContact: tg.requestContact,
            invokeCustomMethod: tg.invokeCustomMethod
        };
    }
    return null;
};

/**
 * Check if we're in a Telegram WebApp environment
 */
export const isTelegramWebApp = () => {
    return !!(window.Telegram && window.Telegram.WebApp);
};

/**
 * Initialize Telegram WebApp
 */
export const initializeTelegramWebApp = () => {
    if (isTelegramWebApp()) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        // Set theme colors
        tg.setHeaderColor('#111215');
        tg.setBackgroundColor('#000000');
        
        return true;
    }
    return false;
};

/**
 * Authenticate user via Telegram WebApp
 */
export const authenticateTelegram = async (walletAddress = null, referrerCode = null) => {
    try {
        const tgData = getTelegramWebAppData();
        
        if (!tgData || !tgData.initData) {
            throw new Error('Telegram WebApp data not available');
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/telegram`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initData: tgData.initData,
                walletAddress: walletAddress,
                referrerCode: referrerCode
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Authentication failed');
        }

        const data = await response.json();
        
        // Store authentication data in localStorage
        localStorage.setItem('OXYBLE_TELEGRAM_AUTH', JSON.stringify({
            user: data.user,
            telegram_user: data.telegram_user,
            web_app_info: data.web_app_info,
            authenticated_at: new Date().toISOString()
        }));

        return data;
    } catch (error) {
        console.error('Telegram authentication error:', error);
        throw error;
    }
};

/**
 * Get authentication status
 */
export const getAuthStatus = async (telegramId = null, walletAddress = null) => {
    try {
        const params = new URLSearchParams();
        if (telegramId) params.append('telegramId', telegramId);
        if (walletAddress) params.append('walletAddress', walletAddress);

        const response = await fetch(`${API_BASE_URL}/api/auth/status?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error('Failed to get auth status');
        }

        return await response.json();
    } catch (error) {
        console.error('Get auth status error:', error);
        throw error;
    }
};

/**
 * Link wallet to existing Telegram user
 */
export const linkWallet = async (telegramId, walletAddress) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/link-wallet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                telegramId: telegramId,
                walletAddress: walletAddress
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to link wallet');
        }

        return await response.json();
    } catch (error) {
        console.error('Link wallet error:', error);
        throw error;
    }
};

/**
 * Get stored authentication data
 */
export const getStoredAuthData = () => {
    try {
        const authData = localStorage.getItem('OXYBLE_TELEGRAM_AUTH');
        return authData ? JSON.parse(authData) : null;
    } catch (error) {
        console.error('Error parsing stored auth data:', error);
        return null;
    }
};

/**
 * Clear stored authentication data
 */
export const clearStoredAuthData = () => {
    localStorage.removeItem('OXYBLE_TELEGRAM_AUTH');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    const authData = getStoredAuthData();
    return !!(authData && authData.user);
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
    const authData = getStoredAuthData();
    return authData ? authData.user : null;
};

/**
 * Get Telegram user data
 */
export const getTelegramUser = () => {
    const authData = getStoredAuthData();
    return authData ? authData.telegram_user : null;
};

/**
 * Get WebApp info
 */
export const getWebAppInfo = () => {
    const authData = getStoredAuthData();
    return authData ? authData.web_app_info : null;
};

/**
 * Auto-authenticate on app load
 */
export const autoAuthenticate = async (walletAddress = null) => {
    try {
        if (!isTelegramWebApp()) {
            console.log('Not in Telegram WebApp environment');
            return null;
        }

        // Check if already authenticated
        if (isAuthenticated()) {
            console.log('Already authenticated');
            return getCurrentUser();
        }

        // Get referrer code from URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const referrerCode = urlParams.get('ref') || localStorage.getItem('OXYBLEReferralCode');

        // Authenticate
        const authResult = await authenticateTelegram(walletAddress, referrerCode);
        console.log('Auto-authentication successful:', authResult.user);
        
        return authResult.user;
    } catch (error) {
        console.error('Auto-authentication failed:', error);
        return null;
    }
}; 