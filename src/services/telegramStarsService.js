// Telegram Stars Service for OXYBLE App
// Handles star rating functionality and reward distribution

const TELEGRAM_STARS_API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.oxyble.com';

export const submitTelegramRating = async (rating, userData) => {
    try {
        const response = await fetch(`${TELEGRAM_STARS_API_BASE}/telegram/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rating: rating,
                telegramUserId: userData?.telegramUserId,
                username: userData?.username,
                walletAddress: userData?.walletAddress,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                platform: 'web'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error submitting Telegram rating:', error);
        throw error;
    }
};

export const getTelegramRatingStatus = async (userData) => {
    try {
        const response = await fetch(`${TELEGRAM_STARS_API_BASE}/telegram/rating-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                telegramUserId: userData?.telegramUserId,
                walletAddress: userData?.walletAddress
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting Telegram rating status:', error);
        throw error;
    }
};

export const claimTelegramReward = async (rating, userData) => {
    try {
        const response = await fetch(`${TELEGRAM_STARS_API_BASE}/telegram/claim-reward`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rating: rating,
                telegramUserId: userData?.telegramUserId,
                username: userData?.username,
                walletAddress: userData?.walletAddress,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error claiming Telegram reward:', error);
        throw error;
    }
};

export const getTelegramUserData = () => {
    // Extract Telegram user data from WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        return {
            telegramUserId: tg.initDataUnsafe?.user?.id,
            username: tg.initDataUnsafe?.user?.username,
            firstName: tg.initDataUnsafe?.user?.first_name,
            lastName: tg.initDataUnsafe?.user?.last_name,
            languageCode: tg.initDataUnsafe?.user?.language_code,
            isPremium: tg.initDataUnsafe?.user?.is_premium,
            platform: tg.platform,
            version: tg.version
        };
    }
    return null;
};

export const openTelegramRating = () => {
    // Open Telegram rating interface
    if (window.Telegram && window.Telegram.WebApp) {
        // Use Telegram WebApp API to open rating
        window.Telegram.WebApp.openTelegramLink('https://t.me/OXYBLE_Bot?start=rate');
    } else {
        // Fallback for non-Telegram environment
        window.open('https://t.me/OXYBLE_Bot?start=rate', '_blank');
    }
};

export const calculateRewardForRating = (rating) => {
    // Calculate OXYBLE reward based on rating
    switch (rating) {
        case 5:
            return { amount: 50, type: 'OXYBLE', message: 'Excellent! You earned 50 OXYBLE tokens!' };
        case 4:
            return { amount: 25, type: 'OXYBLE', message: 'Great! You earned 25 OXYBLE tokens!' };
        case 3:
            return { amount: 10, type: 'OXYBLE', message: 'Good! You earned 10 OXYBLE tokens!' };
        case 2:
        case 1:
            return { amount: 0, type: 'OXYBLE', message: 'Thank you for your feedback!' };
        default:
            return { amount: 0, type: 'OXYBLE', message: 'Please select a rating.' };
    }
};

export const saveRatingToLocalStorage = (rating, reward) => {
    const ratingData = {
        rating: rating,
        reward: reward,
        timestamp: new Date().toISOString(),
        version: '1.0'
    };
    
    localStorage.setItem('OXYBLE_TELEGRAM_RATING', JSON.stringify(ratingData));
    return ratingData;
};

export const getRatingFromLocalStorage = () => {
    const savedRating = localStorage.getItem('OXYBLE_TELEGRAM_RATING');
    if (savedRating) {
        try {
            return JSON.parse(savedRating);
        } catch (error) {
            console.error('Error parsing saved rating:', error);
            return null;
        }
    }
    return null;
};

export const clearRatingFromLocalStorage = () => {
    localStorage.removeItem('OXYBLE_TELEGRAM_RATING');
};

export const isTelegramEnvironment = () => {
    return !!(window.Telegram && window.Telegram.WebApp);
};

export const getTelegramAppVersion = () => {
    if (window.Telegram && window.Telegram.WebApp) {
        return window.Telegram.WebApp.version;
    }
    return null;
}; 