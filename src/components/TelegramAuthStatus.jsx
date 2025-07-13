import React from 'react';
import { Avatar, Tooltip, Badge } from 'antd';
import { UserOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTelegramAuth } from '../contexts/TelegramAuthContext';

const TelegramAuthStatus = () => {
    const { 
        telegramUser, 
        isAuthenticated, 
        isLoading, 
        isTelegramWebApp,
        telegramUsername,
        telegramFirstName,
        telegramLastName
    } = useTelegramAuth();

    if (!isTelegramWebApp) {
        return null; // Don't show anything if not in Telegram WebApp
    }

    if (isLoading) {
        return (
            <Tooltip title="Loading Telegram authentication..." placement="bottom">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Loading...</span>
                </div>
            </Tooltip>
        );
    }

    if (!isAuthenticated || !telegramUser) {
        return (
            <Tooltip title="Not authenticated with Telegram" placement="bottom">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Badge status="error" />
                    <Avatar size="small" icon={<ExclamationCircleOutlined />} />
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Not Auth</span>
                </div>
            </Tooltip>
        );
    }

    // User is authenticated
    const displayName = telegramUsername || 
                       `${telegramFirstName || ''} ${telegramLastName || ''}`.trim() || 
                       `User ${telegramUser.id}`;

    return (
        <Tooltip 
            title={`Authenticated as ${displayName}`} 
            placement="bottom"
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Badge status="success" />
                <Avatar 
                    size="small" 
                    icon={<CheckCircleOutlined />}
                    style={{ backgroundColor: '#52c41a' }}
                />
                <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 500,
                    color: 'var(--app-primary-text-light)',
                    maxWidth: 80,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {displayName}
                </span>
            </div>
        </Tooltip>
    );
};

export default TelegramAuthStatus; 