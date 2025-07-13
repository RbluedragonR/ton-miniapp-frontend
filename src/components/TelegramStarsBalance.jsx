import React, { useEffect, useState } from 'react';
import { StarFilled } from '@ant-design/icons';
import { Tooltip, Spin } from 'antd';

// Placeholder for future Telegram API integration
async function fetchTelegramStarsBalance() {
    // If Telegram exposes a JS API, use it here
    // Example: return await window.Telegram.WebApp.getStarsBalance();
    
    // For now, return a mock balance for demonstration
    // In the future, this will use the official Telegram Stars API
    if (window.Telegram && window.Telegram.WebApp) {
        // Mock balance based on user ID for demo purposes
        const userId = window.Telegram.WebApp.initDataUnsafe?.user?.id;
        if (userId) {
            // Generate a mock balance based on user ID
            const mockBalance = (userId % 1000) + 50; // Between 50-1049 stars
            return mockBalance;
        }
    }
    return null; // Not available yet
}

const TelegramStarsBalance = () => {
    const [stars, setStars] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchTelegramStarsBalance().then(balance => {
            if (mounted) {
                setStars(balance);
                setLoading(false);
            }
        });
        return () => { mounted = false; };
    }, []);

    return (
        <Tooltip title="Your Telegram Stars balance" placement="bottom">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 48 }}>
                <StarFilled style={{ color: '#FFD700', fontSize: 20 }} />
                <span style={{ fontWeight: 600, fontSize: '1rem', color: '#FFD700' }}>
                    {loading ? <Spin size="small" /> : (stars !== null ? stars : '—')}
                </span>
                <span style={{ color: '#FFD700', fontWeight: 500, fontSize: '0.9rem', marginLeft: 2 }}>Stars</span>
            </div>
        </Tooltip>
    );
};

export default TelegramStarsBalance; 