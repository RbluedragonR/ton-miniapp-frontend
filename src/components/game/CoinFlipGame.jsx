// AR_FRONTEND/src/components/game/CoinFlipGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { InputNumber, Button, Typography, Radio, Spin, message, Alert, Tooltip, Grid } from 'antd';
import {
    ArrowLeftOutlined,
    InfoCircleOutlined,
    SoundOutlined,
    AudioMutedOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { placeCoinflipBet, getUserProfile } from '../../services/api';
import {
    OXYBLE_DECIMALS,
    getJettonWalletAddress,
    getJettonBalance,
    fromOXYBLESmallestUnits,
    COINFLIP_HEADS_IMG,
    COINFLIP_TAILS_IMG,
    COINFLIP_SPINNING_GIF,
    COINFLIP_DEFAULT_IMG,
    FALLBACK_IMAGE_URL
} from '../../utils/tonUtils';
import './CoinFlipGame.css';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const OXYBLE_JETTON_MASTER_ADDRESS_FOR_GAME = import.meta.env.VITE_OXYBLE_TOKEN_MASTER_ADDRESS;

const OXYBLEDiamondIcon = ({ className, size = 24 }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1.68743L2.91506 8.13906L6.01427 17.9017L12 22.3124L17.9857 17.9017L21.085 8.13906L12 1.68743ZM12 3.81226L18.8803 8.7384L16.6601 16.8212L12 20.1873L7.33992 16.8212L5.11966 8.7384L12 3.81226Z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M12 5.68774L6.56225 9.57734L8.43831 16.014L12 18.4377L15.5617 16.014L17.4377 9.57734L12 5.68774ZM12 7.58808L14.6235 9.92429L13.3755 14.9334L12 15.919L10.6245 14.9334L9.37647 9.92429L12 7.58808Z" />
    </svg>
);


const CoinflipGame = ({ onBack }) => {
    const [betAmount, setBetAmount] = useState(0.1);
    const [choice, setChoice] = useState('heads');
    const [isFlipping, setIsFlipping] = useState(false);
    const [gameResult, setGameResult] = useState(null);

    const userFriendlyAddress = useTonAddress();
    const rawAddress = useTonAddress(false);
    const [tonConnectUI] = useTonConnectUI();

    const [OXYBLEGameBalance, setOXYBLEGameBalance] = useState(0);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [isSoundOn, setIsSoundOn] = useState(true);

    const screens = useBreakpoint();

    const fetchOXYBLEGameBalance = useCallback(async (showMsg = false) => {
        if (!rawAddress) {
            setOXYBLEGameBalance(0); return;
        }
        setBalanceLoading(true);
        try {
             const profileRes = await getUserProfile(rawAddress);
             const claimable = Math.floor(parseFloat(profileRes.data?.claimableOXYBLERewards || 0));
             setOXYBLEGameBalance(claimable);
            if (showMsg) message.success("OXYBLE balance refreshed!");
        } catch (e) {
            console.error("Error fetching OXYBLE game balance:", e);
            setOXYBLEGameBalance(0);
            if (showMsg) message.error("Could not refresh OXYBLE balance.");
        } finally {
            setBalanceLoading(false);
        }
    }, [rawAddress]);

    useEffect(() => {
        if (userFriendlyAddress) {
            fetchOXYBLEGameBalance(false);
        } else {
            setOXYBLEGameBalance(0);
        }
    }, [userFriendlyAddress, fetchOXYBLEGameBalance]);

    useEffect(() => {
        [COINFLIP_HEADS_IMG, COINFLIP_TAILS_IMG, COINFLIP_SPINNING_GIF, COINFLIP_DEFAULT_IMG, FALLBACK_IMAGE_URL].forEach(src => {
            if (src && typeof src === 'string') {
                const img = new Image();
                img.src = src.startsWith('/') ? window.location.origin + src : src;
            }
        });
    }, []);

    const handlePlaceBet = async () => {
        if (!rawAddress) {
            message.warn({ content: "Please connect your wallet to play.", className: 'cf-game-message-popup cf-warning-popup' });
            tonConnectUI.openModal(); return;
        }
        if (betAmount <= 0) {
            message.error({ content: "Bet amount must be greater than 0 OXYBLE.", className: 'cf-game-message-popup cf-error-popup' }); return;
        }
        if (betAmount > OXYBLEGameBalance) {
             message.error({ content: "Insufficient OXYBLE balance for this bet.", className: 'cf-game-message-popup cf-error-popup' });
            return;
        }

        setIsFlipping(true);
        setGameResult(null);

        setTimeout(async () => {
            try {
                const response = await placeCoinflipBet({
                    userWalletAddress: rawAddress, betAmountOXYBLE: betAmount, choice
                });

                const newResult = {
                    outcome: response.data.outcome,
                    serverCoinSide: response.data.server_coin_side,
                    amountDeltaOXYBLE: parseFloat(response.data.amount_delta_OXYBLE),
                    yourChoice: choice,
                };
                setGameResult(newResult);
                fetchOXYBLEGameBalance(false);

            } catch (error) {
                console.error("Coinflip bet error:", error);
                const errorMessage = error?.response?.data?.message || "Failed to place bet. Please try again.";
                message.error({
                    content: errorMessage,
                    className: 'cf-game-message-popup cf-error-popup',
                    duration: 4,
                });
                setGameResult({ error: true, message: errorMessage, outcome: 'error', serverCoinSide: choice, amountDeltaOXYBLE: 0, yourChoice: choice });
            } finally {
                setIsFlipping(false);
            }
        }, 1800);
    };

    const getCoinImageSrc = () => {
        if (isFlipping) return COINFLIP_SPINNING_GIF;
        if (gameResult && !gameResult.error && gameResult.serverCoinSide) {
            return gameResult.serverCoinSide === 'heads' ? COINFLIP_HEADS_IMG : COINFLIP_TAILS_IMG;
        }
        return COINFLIP_DEFAULT_IMG;
    };

    const potentialWinAmount = betAmount * 2;

    const handleBetAmountChange = (value) => {
        const newBet = parseFloat(value);
        if (value === null || isNaN(newBet)) {
            setBetAmount(0);
        } else if (newBet < 0.1 && newBet !== 0) {
             setBetAmount(0.1);
        } else {
            setBetAmount(newBet);
        }
    };
    
    let flipButtonText = "FLIP COIN";
    let isFlipButtonDisabled = isFlipping || !userFriendlyAddress || betAmount <= 0 || betAmount > OXYBLEGameBalance;

    if (!userFriendlyAddress) {
        flipButtonText = "Connect Wallet";
    } else if (betAmount <= 0 && userFriendlyAddress) {
        flipButtonText = "Enter Bet Amount";
    }
     else if (betAmount > OXYBLEGameBalance && userFriendlyAddress) {
        flipButtonText = "INSUFFICIENT OXYBLE";
    } else if (isFlipping) {
        flipButtonText = "FLIPPING...";
    }

    const showInsufficientBalanceAlert = userFriendlyAddress && betAmount > 0 && betAmount > OXYBLEGameBalance;


    return (
        <div className="cf-game-page-wrapper">
            <div className="cf-game-header">
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} className="cf-game-header-back-button" aria-label="Go Back"/>
                 <div className="cf-game-header-balance">
                    <OXYBLEDiamondIcon className="cf-balance-icon" size={20}/>
                    <Text className="cf-balance-value">{balanceLoading ? <Spin size="small" /> : OXYBLEGameBalance.toFixed(0)}</Text>
                </div>
            </div>

            <div className="cf-game-main-content">
                <div className="cf-game-title-bar">
                     <Text className="cf-last-flips-text">LAST FLIPS</Text>
                    <Title level={2} className="cf-game-main-title">COIN FLIP</Title>
                    <div className="cf-game-title-actions">
                        <Tooltip title="Game Info: Choose Heads or Tails. If your choice matches the coin flip, you win double your bet in OXYBLE.">
                            <Button type="text" icon={<InfoCircleOutlined />} className="cf-title-action-icon" aria-label="Game Info"/>
                        </Tooltip>
                        <Button
                            type="text"
                            icon={isSoundOn ? <SoundOutlined /> : <AudioMutedOutlined />}
                            onClick={() => setIsSoundOn(!isSoundOn)}
                            className="cf-title-action-icon"
                            aria-label={isSoundOn ? "Mute Sound" : "Unmute Sound"}
                        />
                    </div>
                </div>
                <Paragraph className="cf-game-subtitle">Flip the coin and start the story</Paragraph>

                <div className="cf-coin-stats-area">
                    <div className="cf-game-stat-display left">
                        <Text className="cf-game-stat-value">0</Text>
                        <Text className="cf-game-stat-label">STREAK</Text>
                    </div>
                    <div className={`cf-central-coin-wrapper ${isFlipping ? 'flipping' : ''}`}>
                        <img
                            src={getCoinImageSrc()}
                            alt={isFlipping ? "Coin Spinning" : (gameResult?.serverCoinSide || "OXYBLE Coin")}
                            className="cf-central-coin-image"
                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE_URL; }}
                        />
                    </div>
                    <div className="cf-game-stat-display right">
                        <Text className="cf-game-stat-value">x2</Text>
                        <Text className="cf-game-stat-label">MULTIPLIER</Text>
                    </div>
                </div>

                 {gameResult && (
                    <div className={`cf-game-result-banner ${gameResult.error ? 'error' : gameResult.outcome} active`}>
                        <Text strong className="cf-game-result-banner-title">
                            {gameResult.error ? "Error!" : (gameResult.outcome === 'win' ? "YOU WON!" : "TRY AGAIN!")}
                        </Text>
                        <Text className="cf-game-result-banner-details">
                            {gameResult.error ? gameResult.message :
                            `Coin: ${(gameResult.serverCoinSide || 'N/A').toUpperCase()}. You chose: ${(gameResult.yourChoice || 'N/A').toUpperCase()}. ${gameResult.outcome === 'win' ? `+${(gameResult.amountDeltaOXYBLE || 0).toFixed(OXYBLE_DECIMALS)}` : `-${Math.abs(gameResult.amountDeltaOXYBLE || 0).toFixed(OXYBLE_DECIMALS)}`} OXYBLE.`}
                        </Text>
                    </div>
                )}


                <div className="cf-betting-area">
                    <Text className="cf-bet-area-title">BONUS REWARD</Text>
                    <div className="cf-bet-input-outer-wrapper">
                        <InputNumber
                            className="cf-bet-amount-input"
                            value={betAmount}
                            onChange={handleBetAmountChange}
                            min={0.1}
                            step={0.1}
                            precision={OXYBLE_DECIMALS > 2 ? 2 : OXYBLE_DECIMALS}
                            disabled={isFlipping || !userFriendlyAddress}
                            controls={false}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '')}
                            parser={(value) => value ? value.replace(/[^0-9.]/g, '') : "0"}
                            aria-label="Bet amount in OXYBLE"
                        />
                        <Text className="cf-bet-input-currency-label">OXYBLE</Text>
                    </div>
                     <Button
                        type="primary"
                        className="cf-main-flip-button"
                        onClick={handlePlaceBet}
                        loading={isFlipping}
                        disabled={isFlipButtonDisabled}
                    >
                        {isFlipping ? "Flipping..." : "Top up to play"} 
                    </Button>
                     {showInsufficientBalanceAlert &&
                        <Alert
                            message="Insufficient OXYBLE balance for this bet."
                            type="error"
                            showIcon
                            className="cf-insufficient-alert"
                        />
                    }
                </div>


                <div className="cf-choice-selection-area">
                    <Paragraph className="cf-choice-prompt-text">
                        <CheckCircleOutlined /> Choose a side to win {potentialWinAmount.toFixed(OXYBLE_DECIMALS)} OXYBLE
                    </Paragraph>
                    <Radio.Group
                        onChange={(e) => setChoice(e.target.value)}
                        value={choice}
                        buttonStyle="solid"
                        disabled={isFlipping || !userFriendlyAddress}
                        className="cf-choice-radio-group"
                        aria-label="Choose Heads or Tails"
                    >
                        <Radio.Button value="heads" className="cf-choice-radio-button heads">
                            <OXYBLEDiamondIcon className="cf-choice-radio-icon" size={36}/>
                            <Text>Heads</Text>
                        </Radio.Button>
                        <Radio.Button value="tails" className="cf-choice-radio-button tails">
                            <OXYBLEDiamondIcon className="cf-choice-radio-icon" size={36}/>
                            <Text>Tails</Text>
                        </Radio.Button>
                    </Radio.Group>
                </div>
            </div>
        </div>
    );
};

export default CoinflipGame;