import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { 
    isTelegramWebApp, 
    initializeTelegramWebApp, 
    autoAuthenticate, 
    authenticateTelegram,
    getCurrentUser,
    getTelegramUser,
    isAuthenticated,
    clearStoredAuthData,
    linkWallet
} from '../services/authService';

const TelegramAuthContext = createContext();

export const useTelegramAuth = () => {
    const context = useContext(TelegramAuthContext);
    if (!context) {
        throw new Error('useTelegramAuth must be used within a TelegramAuthProvider');
    }
    return context;
};

export const TelegramAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [telegramUser, setTelegramUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize Telegram WebApp
    const initialize = useCallback(async () => {
        try {
            if (isTelegramWebApp()) {
                initializeTelegramWebApp();
                setIsInitialized(true);
                console.log('Telegram WebApp initialized');
            } else {
                console.log('Not in Telegram WebApp environment');
                setIsInitialized(false);
            }
        } catch (error) {
            console.error('Failed to initialize Telegram WebApp:', error);
            setIsInitialized(false);
        }
    }, []);

    // Auto-authenticate user
    const authenticate = useCallback(async (walletAddress = null) => {
        try {
            setIsLoading(true);
            
            if (!isTelegramWebApp()) {
                console.log('Not in Telegram WebApp environment, skipping authentication');
                return null;
            }

            // Check if already authenticated
            if (isAuthenticated()) {
                const currentUser = getCurrentUser();
                const currentTelegramUser = getTelegramUser();
                setUser(currentUser);
                setTelegramUser(currentTelegramUser);
                console.log('User already authenticated:', currentUser);
                return currentUser;
            }

            // Auto-authenticate
            const authUser = await autoAuthenticate(walletAddress);
            if (authUser) {
                setUser(authUser);
                setTelegramUser(getTelegramUser());
                message.success('Telegram authentication successful!');
                console.log('Authentication successful:', authUser);
            } else {
                console.log('Auto-authentication failed or not needed');
            }

            return authUser;
        } catch (error) {
            console.error('Authentication error:', error);
            message.error('Telegram authentication failed: ' + error.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Manual authentication
    const manualAuthenticate = useCallback(async (walletAddress = null, referrerCode = null) => {
        try {
            setIsLoading(true);
            
            if (!isTelegramWebApp()) {
                throw new Error('Not in Telegram WebApp environment');
            }

            const authResult = await authenticateTelegram(walletAddress, referrerCode);
            setUser(authResult.user);
            setTelegramUser(authResult.telegram_user);
            
            message.success('Telegram authentication successful!');
            console.log('Manual authentication successful:', authResult.user);
            
            return authResult.user;
        } catch (error) {
            console.error('Manual authentication error:', error);
            message.error('Telegram authentication failed: ' + error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Link wallet to Telegram user
    const linkWalletToUser = useCallback(async (telegramId, walletAddress) => {
        try {
            setIsLoading(true);
            
            const result = await linkWallet(telegramId, walletAddress);
            setUser(result.user);
            
            message.success('Wallet linked successfully!');
            console.log('Wallet linked:', result.user);
            
            return result.user;
        } catch (error) {
            console.error('Link wallet error:', error);
            message.error('Failed to link wallet: ' + error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Logout
    const logout = useCallback(() => {
        clearStoredAuthData();
        setUser(null);
        setTelegramUser(null);
        message.success('Logged out successfully');
        console.log('User logged out');
    }, []);

    // Check authentication status
    const checkAuthStatus = useCallback(() => {
        if (isAuthenticated()) {
            const currentUser = getCurrentUser();
            const currentTelegramUser = getTelegramUser();
            setUser(currentUser);
            setTelegramUser(currentTelegramUser);
            return true;
        }
        return false;
    }, []);

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            await initialize();
            
            // Check if already authenticated
            if (checkAuthStatus()) {
                console.log('User already authenticated on mount');
            }
            
            setIsLoading(false);
        };

        init();
    }, [initialize, checkAuthStatus]);

    const value = {
        // State
        user,
        telegramUser,
        isLoading,
        isInitialized,
        isAuthenticated: !!user,
        isTelegramWebApp: isTelegramWebApp(),
        
        // Actions
        authenticate,
        manualAuthenticate,
        linkWalletToUser,
        logout,
        checkAuthStatus,
        
        // User info
        telegramId: telegramUser?.id,
        telegramUsername: telegramUser?.username,
        telegramFirstName: telegramUser?.first_name,
        telegramLastName: telegramUser?.last_name,
        telegramLanguageCode: telegramUser?.language_code,
        telegramIsPremium: telegramUser?.is_premium,
        
        // App user info
        walletAddress: user?.wallet_address,
        referralCode: user?.referral_code,
        balance: user?.balance,
        userId: user?.id
    };

    return (
        <TelegramAuthContext.Provider value={value}>
            {children}
        </TelegramAuthContext.Provider>
    );
}; 