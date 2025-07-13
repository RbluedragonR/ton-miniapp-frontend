// AR_FRONTEND/src/App.jsx
import React, { useEffect, Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { TonConnectUIProvider, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { Layout, Menu, ConfigProvider, theme as antdTheme, Typography, Grid, Spin, Button, Dropdown } from 'antd';
import {
    CheckSquareFilled,
    PlaySquareFilled,
    PushpinFilled,
    CreditCardFilled,
    UserOutlined as UserFilled,
    SwapOutlined, // NEW: Added icon for Wallet/Swap
    SettingOutlined,
    BulbOutlined,
    BulbFilled,
} from '@ant-design/icons';
import './App.css';
import ResponsiveMobileNav from './components/ResponsiveMobileNav';
import TelegramStars from './components/TelegramStars';
import TelegramStarsBalance from './components/TelegramStarsBalance';
import TelegramAuthStatus from './components/TelegramAuthStatus';
import { TelegramAuthProvider, useTelegramAuth } from './contexts/TelegramAuthContext';
import { TONCONNECT_MANIFEST_URL } from './utils/constants';
import { getUserProfile } from './services/api';

// --- Page Imports (Your original lazy loading preserved) ---
const EarnPage = lazy(() => import('./pages/EarnPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const UserPage = lazy(() => import('./pages/UserPage'));
const TaskPage = lazy(() => import('./pages/TaskPage'));
const PushPage = lazy(() => import('./pages/PushPage'));
// --- NEW: Lazy load the new pages ---
const SwapPage = lazy(() => import('./pages/SwapPage'));
const PlinkoGame = lazy(() => import('./components/game/plinko/PlinkoGame'));

// --- Original Game Component Imports (Preserved for routing) ---
const CoinflipGame = lazy(() => import('./components/game/CoinFlipGame'));
const CrashGame = lazy(() => import('./components/game/crash/CrashGame'));


const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

// MODIFIED: Added Wallet/Swap to your original menu configuration
const menuConfig = [
    { key: '/tasks', icon: <CheckSquareFilled />, labelText: "TASK" },
    { key: '/game', icon: <PlaySquareFilled />, labelText: "GAME" },
    { key: '/push', icon: <PushpinFilled />, labelText: "PUSH" },
    { key: '/earn', icon: <CreditCardFilled />, labelText: "EARN" },
    { key: '/swap', icon: <SwapOutlined />, labelText: "WALLET" }, // NEW ENTRY
    { key: '/user', icon: <UserFilled />, labelText: "USER" },
];

const DesktopMenu = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // --- REVISION: REACT HOOKS RULE FIX ---
    // Moved this useEffect hook to the top-level of the component.
    // Calling hooks inside conditions, loops, or nested functions violates the Rules of Hooks
    // and was the likely cause of crashes like "Minified React error #310". This fixes it.
    useEffect(() => {
        const isValidPath = menuConfig.some(item => location.pathname.startsWith(item.key));
        if (!isValidPath && location.pathname !== '/') { // Avoid redirect loops on the root path
          navigate('/game', { replace: true });
        }
    }, [navigate, location.pathname]);

    let currentPath = location.pathname;
    if (currentPath === '/') currentPath = '/game';
    if (currentPath.startsWith('/game/')) {
        currentPath = '/game';
    }

    if (!menuConfig.some(item => item.key === currentPath)) {
        currentPath = '/game';
    }


    const desktopMenuItems = menuConfig.map(item => ({
        key: item.key,
        icon: React.cloneElement(item.icon, { style: { fontSize: '16px' } }),
        label: item.labelText,
        onClick: () => navigate(item.key),
        style: { padding: '0 18px', fontSize: '0.9rem', fontWeight: 500 },
    }));

    return (
        <Sider
            width={200}
            className="desktop-sider"
            breakpoint="lg"
            collapsedWidth="0"
            trigger={null}
        >
            <div className="desktop-sider-logo-container">
            </div>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[currentPath]}
                items={desktopMenuItems}
                style={{ height: 'calc(100% - 60px)', borderRight: 0, background: 'transparent', padding: '10px 0' }}
            />
        </Sider>
    );
};

function App() {
    const screens = useBreakpoint();
    const isMobile = !screens.lg;
    const [tonConnectUI, setOptions] = useTonConnectUI();
    const location = useLocation();
    const navigate = useNavigate();

    // Telegram authentication
    const { 
        user: telegramUser, 
        telegramUser: tgUser, 
        isLoading: telegramLoading, 
        isAuthenticated: telegramAuthenticated,
        authenticate: telegramAuthenticate,
        walletAddress: telegramWalletAddress
    } = useTelegramAuth();

    // NEW: Central state for user data, as requested
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(false);
    const wallet = useTonWallet();

    // NEW: Theme state management
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('OXYBLE_THEME');
        return savedTheme || 'dark';
    });

    // Save theme to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('OXYBLE_THEME', theme);
        // Update document body class for global theme
        document.body.className = `theme-${theme}`;
        console.log('Theme changed to:', theme);
    }, [theme]);

     useEffect(() => {
        if (location.pathname === '/') {
            navigate('/game', { replace: true });
        }
    }, [location.pathname, navigate]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode) {
            localStorage.setItem('OXYBLEReferralCode', refCode);
        }
    }, [setOptions]);

    // Auto-authenticate when wallet connects
    useEffect(() => {
        if (wallet?.account?.address && telegramAuthenticated) {
            telegramAuthenticate(wallet.account.address);
        }
    }, [wallet?.account?.address, telegramAuthenticated, telegramAuthenticate]);

    // NEW: Effect to fetch user data when wallet connects
    // useEffect(() => {
    //     const onAuth = async () => {
    //         if (wallet?.account?.address) {
    //             setLoadingUser(true);
    //             try {
    //                 const urlParams = new URLSearchParams(window.location.search);
    //                 const launchParams = {
    //                     telegram_id: urlParams.get('telegram_id'),
    //                     username: urlParams.get('username'),
    //                     referrer: localStorage.getItem('OXYBLEReferralCode'),
    //                 };
    //                 const { data: profile } = await getUserProfile(wallet.account.address, launchParams);
    //                 setUser(profile);
    //             } catch (error) {
    //                 console.error("Failed to fetch user profile:", error);
    //                 setUser(null);
    //             } finally {
    //                 setLoadingUser(false);
    //             }
    //         } else {
    //             setUser(null);
    //         }
    //     };
    //     onAuth();
    // }, [wallet?.account?.address]);

    // Theme configuration based on current theme
    const getThemeConfig = () => {
        if (theme === 'light') {
            return {
                algorithm: antdTheme.defaultAlgorithm,
                token: {
                    colorPrimary: '#A3AECF',
                    colorInfo: '#A3AECF',
                    colorSuccess: '#4CAF50',
                    colorError: '#F44336',
                    colorWarning: '#FFC107',
                    colorTextBase: '#1a1a1a',
                    colorText: '#1a1a1a',
                    colorTextSecondary: `rgba(26, 26, 26, 0.7)`,
                    colorTextTertiary: `rgba(26, 26, 26, 0.5)`,
                    colorTextQuaternary: `rgba(26, 26, 26, 0.3)`,
                    colorBgBase: '#ffffff',
                    colorBgContainer: '#f5f5f5',
                    colorBgElevated: '#ffffff',
                    colorBgLayout: '#fafafa',
                    colorBorder: '#d9d9d9',
                    colorBorderSecondary: `rgba(217, 217, 217, 0.7)`,
                    colorSplit: '#d9d9d9',
                    borderRadius: 10,
                    borderRadiusLG: 14,
                    borderRadiusSM: 6,
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
                    controlHeight: 38,
                    controlHeightLG: 42,
                    controlHeightSM: 30,
                    fontSize: 14,
                    wireframe: false,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    boxShadowSecondary: '0 6px 20px rgba(0, 0, 0, 0.15)',
                },
                components: {
                    Layout: {
                        headerBg: '#ffffff',
                        siderBg: '#f5f5f5',
                        bodyBg: '#fafafa',
                    },
                    Menu: {
                        itemBg: 'transparent',
                        itemSelectedBg: `rgba(163, 174, 207, 0.1)`,
                        itemColor: `rgba(26, 26, 26, 0.7)`,
                        itemSelectedColor: '#A3AECF',
                        itemHoverBg: `rgba(163, 174, 207, 0.07)`,
                        itemHoverColor: '#A3AECF',
                        itemHeight: 42,
                        popupBg: '#ffffff',
                    },
                    Button: {
                        colorPrimary: '#A3AECF',
                        colorPrimaryBg: '#A3AECF',
                        colorPrimaryHover: '#8D9AC3', 
                        colorTextLightSolid: '#08090A', 
                        defaultBg: '#f5f5f5',
                        defaultColor: '#1a1a1a',
                        defaultBorderColor: '#d9d9d9',
                        defaultHoverBg: `rgba(245, 245, 245, 0.7)`,
                        defaultHoverBorderColor: '#A3AECF',
                        defaultHoverColor: '#A3AECF',
                        defaultActiveBg: `rgba(245, 245, 245, 0.6)`,
                        borderRadius: 8,
                    },
                    Card: {
                        colorBgContainer: '#ffffff',
                        colorBorderSecondary: '#d9d9d9',
                        colorTextHeading: '#1a1a1a',
                        actionsBg: '#ffffff',
                        headBg: '#ffffff',
                    },
                    Modal: {
                        colorBgElevated: '#ffffff',
                        colorTextHeading: '#1a1a1a',
                        titleColor: '#1a1a1a',
                        headerBg: '#ffffff',
                        footerBg: '#ffffff',
                    },
                    Input: {
                        colorBgContainer: '#ffffff',
                        colorBorder: '#d9d9d9',
                        colorText: '#1a1a1a',
                        colorTextPlaceholder: `rgba(26, 26, 26, 0.5)`,
                        addonBg: '#f5f5f5',
                    },
                    InputNumber: {
                        colorBgContainer: '#ffffff',
                        colorBorder: '#d9d9d9',
                        colorText: '#1a1a1a',
                        handleBg: '#ffffff',
                        handleHoverColor: '#1a1a1a',
                        colorTextPlaceholder: `rgba(26, 26, 26, 0.5)`,
                    },
                    Statistic: {
                        titleFontSize: 13,
                        contentFontSize: 20,
                        colorTextDescription: `rgba(26, 26, 26, 0.7)`,
                        colorText: '#1a1a1a',
                    },
                    Radio: {
                        buttonSolidCheckedBg: '#A3AECF', 
                        buttonSolidCheckedColor: '#08090A', 
                        buttonSolidCheckedHoverBg: '#8D9AC3', 
                        buttonSolidCheckedActiveBg: '#7C8BAE', 
                        colorBorder: '#d9d9d9',
                        buttonBg: '#f5f5f5',
                        buttonPaddingInline: 15,
                        buttonColor: `rgba(26, 26, 26, 0.6)`,
                        wrapperBg: '#f5f5f5',
                    },
                    Tabs: {
                        cardBg: '#ffffff',
                        itemColor: `rgba(26, 26, 26, 0.7)`,
                        itemSelectedColor: '#A3AECF',
                        itemHoverColor: '#A3AECF',
                        inkBarColor: '#A3AECF',
                        horizontalMargin: '0',
                        titleFontSize: isMobile ? 14 : 15,
                    },
                    Spin: {
                        colorPrimary: '#A3AECF',
                        colorText: '#1a1a1a',
                    },
                    Alert: {
                        colorInfoBg: `rgba(163, 174, 207, 0.05)`,
                        colorInfoBorder: `rgba(163, 174, 207, 0.2)`,
                        colorSuccessBg: 'rgba(76, 175, 80, 0.1)',
                        colorSuccessBorder: 'rgba(76, 175, 80, 0.2)',
                        colorWarningBg: 'rgba(255, 193, 7, 0.1)',
                        colorWarningBorder: 'rgba(255, 193, 7, 0.2)',
                        colorErrorBg: 'rgba(244, 67, 54, 0.1)',
                        colorErrorBorder: 'rgba(244, 67, 54, 0.2)',
                        defaultPadding: '8px 12px',
                        withDescriptionPadding: '12px 15px',
                    },
                    List: {
                        colorSplit: '#d9d9d9',
                    },
                    Descriptions: {
                        colorTextSecondary: `rgba(26, 26, 26, 0.7)`,
                        colorText: '#1a1a1a',
                        labelBg: 'transparent',
                        itemPaddingBottom: 8,
                        extraColor: `rgba(26, 26, 26, 0.7)`,
                        titleColor: '#1a1a1a',
                    },
                    Empty: {
                        colorTextDisabled: `rgba(26, 26, 26, 0.5)`,
                        colorText: `rgba(26, 26, 26, 0.7)`,
                    },
                    Dropdown: {
                        colorBgElevated: '#ffffff',
                        colorBorderSecondary: '#d9d9d9',
                        controlItemBgHover: `rgba(163, 174, 207, 0.1)`,
                        controlItemBgActive: `rgba(163, 174, 207, 0.15)`,
                        colorText: '#1a1a1a',
                    },
                    Select: {
                        colorBgElevated: '#ffffff',
                        optionSelectedBg: `rgba(163, 174, 207, 0.15)`,
                        optionSelectedColor: '#A3AECF',
                        optionActiveBg: `rgba(163, 174, 207, 0.1)`,
                        colorTextPlaceholder: `rgba(26, 26, 26, 0.5)`,
                    }
                },
            };
        } else {
            // Dark theme (original)
            const APP_PRIMARY_COLOR = '#A3AECF';
            const APP_BG_DARK_ELEMENT = '#08090A';
            const APP_BG_DARK_SECTION = '#111215';
            const APP_BG_DARK_CONTAINER = '#1C1C1E';
            const APP_MAIN_BG = '#000000';
            const APP_BORDER_COLOR = '#2D3142';
            const APP_BUTTON_PRIMARY_BG = '#A3AECF'; 
            const APP_BUTTON_PRIMARY_TEXT = '#08090A'; 

            return {
                algorithm: antdTheme.darkAlgorithm,
                token: {
                    colorPrimary: APP_PRIMARY_COLOR,
                    colorInfo: APP_PRIMARY_COLOR,
                    colorSuccess: '#4CAF50',
                    colorError: '#F44336',
                    colorWarning: '#FFC107',
                    colorTextBase: APP_PRIMARY_COLOR,
                    colorText: APP_PRIMARY_COLOR,
                    colorTextSecondary: `rgba(163, 174, 207, 0.7)`,
                    colorTextTertiary: `rgba(163, 174, 207, 0.5)`,
                    colorTextQuaternary: `rgba(163, 174, 207, 0.3)`,
                    colorBgBase: APP_MAIN_BG,
                    colorBgContainer: APP_BG_DARK_ELEMENT,
                    colorBgElevated: APP_BG_DARK_SECTION,
                    colorBgLayout: APP_MAIN_BG,
                    colorBorder: APP_BORDER_COLOR,
                    colorBorderSecondary: `rgba(45, 49, 66, 0.7)`,
                    colorSplit: APP_BORDER_COLOR,
                    borderRadius: 10,
                    borderRadiusLG: 14,
                    borderRadiusSM: 6,
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
                    controlHeight: 38,
                    controlHeightLG: 42,
                    controlHeightSM: 30,
                    fontSize: 14,
                    wireframe: false,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    boxShadowSecondary: '0 6px 20px rgba(0, 0, 0, 0.25)',
                },
                components: {
                    Layout: {
                        headerBg: APP_BG_DARK_SECTION,
                        siderBg: APP_BG_DARK_SECTION,
                        bodyBg: APP_MAIN_BG,
                    },
                    Menu: {
                        itemBg: 'transparent',
                        itemSelectedBg: `rgba(163, 174, 207, 0.1)`,
                        itemColor: `rgba(163, 174, 207, 0.7)`,
                        itemSelectedColor: APP_PRIMARY_COLOR,
                        itemHoverBg: `rgba(163, 174, 207, 0.07)`,
                        itemHoverColor: APP_PRIMARY_COLOR,
                        itemHeight: 42,
                        popupBg: APP_BG_DARK_SECTION,
                    },
                    Button: {
                        colorPrimary: APP_BUTTON_PRIMARY_BG,
                        colorPrimaryBg: APP_BUTTON_PRIMARY_BG,
                        colorPrimaryHover: '#8D9AC3', 
                        colorTextLightSolid: APP_BUTTON_PRIMARY_TEXT, 
                        defaultBg: APP_BG_DARK_ELEMENT,
                        defaultColor: APP_PRIMARY_COLOR,
                        defaultBorderColor: APP_BG_DARK_ELEMENT,
                        defaultHoverBg: `rgba(8, 9, 10, 0.7)`,
                        defaultHoverBorderColor: APP_PRIMARY_COLOR,
                        defaultHoverColor: APP_PRIMARY_COLOR,
                        defaultActiveBg: `rgba(8, 9, 10, 0.6)`,
                        borderRadius: 8,
                    },
                    Card: {
                        colorBgContainer: APP_BG_DARK_ELEMENT,
                        colorBorderSecondary: APP_BORDER_COLOR,
                        colorTextHeading: APP_PRIMARY_COLOR,
                        actionsBg: APP_BG_DARK_ELEMENT,
                        headBg: APP_BG_DARK_ELEMENT,
                    },
                    Modal: {
                        colorBgElevated: APP_BG_DARK_ELEMENT,
                        colorTextHeading: APP_PRIMARY_COLOR,
                        titleColor: APP_PRIMARY_COLOR,
                        headerBg: APP_BG_DARK_ELEMENT,
                        footerBg: APP_BG_DARK_ELEMENT,
                    },
                    Input: {
                        colorBgContainer: APP_BG_DARK_ELEMENT,
                        colorBorder: APP_BORDER_COLOR,
                        colorText: APP_PRIMARY_COLOR,
                        colorTextPlaceholder: `rgba(163, 174, 207, 0.5)`,
                        addonBg: APP_BG_DARK_CONTAINER,
                    },
                    InputNumber: {
                        colorBgContainer: APP_BG_DARK_ELEMENT,
                        colorBorder: APP_BORDER_COLOR,
                        colorText: APP_PRIMARY_COLOR,
                        handleBg: APP_BG_DARK_ELEMENT,
                        handleHoverColor: APP_PRIMARY_COLOR,
                        colorTextPlaceholder: `rgba(163, 174, 207, 0.5)`,
                    },
                    Statistic: {
                        titleFontSize: 13,
                        contentFontSize: 20,
                        colorTextDescription: `rgba(163, 174, 207, 0.7)`,
                        colorText: APP_PRIMARY_COLOR,
                    },
                    Radio: {
                        buttonSolidCheckedBg: APP_BUTTON_PRIMARY_BG, 
                        buttonSolidCheckedColor: APP_BUTTON_PRIMARY_TEXT, 
                        buttonSolidCheckedHoverBg: '#8D9AC3', 
                        buttonSolidCheckedActiveBg: '#7C8BAE', 
                        colorBorder: APP_BORDER_COLOR,
                        buttonBg: APP_BG_DARK_CONTAINER,
                        buttonPaddingInline: 15,
                        buttonColor: `rgba(163, 174, 207, 0.6)`,
                        wrapperBg: APP_BG_DARK_CONTAINER,
                    },
                    Tabs: {
                        cardBg: APP_BG_DARK_ELEMENT,
                        itemColor: `rgba(163, 174, 207, 0.7)`,
                        itemSelectedColor: APP_PRIMARY_COLOR,
                        itemHoverColor: APP_PRIMARY_COLOR,
                        inkBarColor: APP_PRIMARY_COLOR,
                        horizontalMargin: '0',
                        titleFontSize: isMobile ? 14 : 15,
                    },
                    Spin: {
                        colorPrimary: APP_PRIMARY_COLOR,
                        colorText: APP_PRIMARY_COLOR,
                    },
                    Alert: {
                        colorInfoBg: `rgba(163, 174, 207, 0.05)`,
                        colorInfoBorder: `rgba(163, 174, 207, 0.2)`,
                        colorSuccessBg: 'rgba(76, 175, 80, 0.1)',
                        colorSuccessBorder: 'rgba(76, 175, 80, 0.2)',
                        colorWarningBg: 'rgba(255, 193, 7, 0.1)',
                        colorWarningBorder: 'rgba(255, 193, 7, 0.2)',
                        colorErrorBg: 'rgba(244, 67, 54, 0.1)',
                        colorErrorBorder: 'rgba(244, 67, 54, 0.2)',
                        defaultPadding: '8px 12px',
                        withDescriptionPadding: '12px 15px',
                    },
                    List: {
                        colorSplit: APP_BORDER_COLOR,
                    },
                    Descriptions: {
                        colorTextSecondary: `rgba(163, 174, 207, 0.7)`,
                        colorText: APP_PRIMARY_COLOR,
                        labelBg: 'transparent',
                        itemPaddingBottom: 8,
                        extraColor: `rgba(163, 174, 207, 0.7)`,
                        titleColor: APP_PRIMARY_COLOR,
                    },
                    Empty: {
                        colorTextDisabled: `rgba(163, 174, 207, 0.5)`,
                        colorText: `rgba(163, 174, 207, 0.7)`,
                    },
                    Dropdown: {
                        colorBgElevated: APP_BG_DARK_SECTION,
                        colorBorderSecondary: APP_BORDER_COLOR,
                        controlItemBgHover: `rgba(163, 174, 207, 0.1)`,
                        controlItemBgActive: `rgba(163, 174, 207, 0.15)`,
                        colorText: APP_PRIMARY_COLOR,
                    },
                    Select: {
                        colorBgElevated: APP_BG_DARK_SECTION,
                        optionSelectedBg: `rgba(163, 174, 207, 0.15)`,
                        optionSelectedColor: APP_PRIMARY_COLOR,
                        optionActiveBg: `rgba(163, 174, 207, 0.1)`,
                        colorTextPlaceholder: `rgba(163, 174, 207, 0.5)`,
                    }
                },
            };
        }
    };

    // Settings dropdown items
    const settingsItems = [
        {
            key: 'theme',
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {theme === 'light' ? <BulbFilled /> : <BulbOutlined />}
                    Theme: {theme === 'dark' ? 'Light' : 'Dark'}
                </div>
            ),
            onClick: () => setTheme(theme === 'light' ? 'dark' : 'light'),
        },
    ];

    const loadingSpinner = (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 120px)' }}>
            <Spin size="large" tip="Loading Page..." />
        </div>
    );

     const pageProps = { 
        user: telegramUser || user, 
        setUser, 
        loadingUser: telegramLoading || loadingUser,
        telegramUser: tgUser,
        telegramAuthenticated
    };

    return (
        <ConfigProvider theme={getThemeConfig()}>
            <Layout className="app-layout">
                <Header className="app-header">
                    <div className="app-header-logo-area">
                        <img src="/img/OXYBLE-logo-header.png" alt="OXYBLE" className="app-header-logo" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <Title level={isMobile ? 5 : 4} className="app-header-title">OXYBLE</Title>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <TelegramAuthStatus />
                        <TelegramStarsBalance />
                        <Dropdown
                            menu={{ items: settingsItems }}
                            placement="bottomRight"
                            trigger={['click']}
                        >
                            <Button
                                type="text"
                                icon={<SettingOutlined />}
                                className="settings-button"
                                aria-label="Settings"
                            />
                        </Dropdown>
                        <TelegramStars />
                    </div>
                </Header>
                <Layout className="app-main-layout-container">
                    {!isMobile && <DesktopMenu />}
                    <Layout className={`app-content-wrapper ${isMobile ? "mobile-view" : ""}`}>
                        <Content className="app-content">
                            <Suspense fallback={loadingSpinner}>
                                <Routes>
                                    {/* Your original routes are preserved */}
                                    <Route path="/" element={<GamePage {...pageProps} />} /> 
                                    <Route path="/tasks" element={<TaskPage {...pageProps} />} />
                                    <Route path="/earn" element={<EarnPage {...pageProps} />} />
                                    <Route path="/game" element={<GamePage {...pageProps} />} />
                                    <Route path="/push" element={<PushPage {...pageProps} />} />
                                    <Route path="/user" element={<UserPage {...pageProps} />} />
                                    <Route path="/game/coinflip" element={<CoinflipGame {...pageProps} />} />
                                    <Route path="/game/crash" element={<CrashGame {...pageProps} />} />
                                    
                                    {/* --- NEW ROUTES ADDED HERE --- */}
                                    <Route path="/swap" element={<SwapPage {...pageProps} />} />
                                    <Route path="/game/plinko" element={<PlinkoGame {...pageProps} />} />
                                </Routes>
                            </Suspense>
                        </Content>
                    </Layout>
                </Layout>
                {isMobile && <ResponsiveMobileNav menuConfig={menuConfig} />}
            </Layout>
        </ConfigProvider>
    );
}

// Your RootApp wrapper is preserved and correct
const RootApp = () => (
    <Router>
        <TelegramAuthProvider>
            <TonConnectUIProvider manifestUrl={TONCONNECT_MANIFEST_URL}>
                <App />
            </TonConnectUIProvider>
        </TelegramAuthProvider>
    </Router>
);

export default RootApp;
