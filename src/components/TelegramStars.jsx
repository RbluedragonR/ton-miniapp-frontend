import React, { useState, useEffect } from 'react';
import { Button, Modal, message, Rate, Typography, Space, Alert, Tooltip } from 'antd';
import { StarFilled, StarOutlined, GiftOutlined, TrophyOutlined } from '@ant-design/icons';
import { 
    submitTelegramRating, 
    getTelegramUserData, 
    openTelegramRating, 
    calculateRewardForRating,
    saveRatingToLocalStorage,
    getRatingFromLocalStorage,
    isTelegramEnvironment
} from '../services/telegramStarsService';
import './TelegramStars.css';

const { Text, Title } = Typography;

const TelegramStars = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [rating, setRating] = useState(0);
    const [hasRated, setHasRated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userRewards, setUserRewards] = useState(null);

    // Check if user has already rated
    useEffect(() => {
        const savedRatingData = getRatingFromLocalStorage();
        if (savedRatingData) {
            setHasRated(true);
            setRating(savedRatingData.rating);
            if (savedRatingData.reward) {
                setUserRewards(savedRatingData.reward);
            }
        }
    }, []);

    const handleStarClick = (value) => {
        setRating(value);
    };

    const handleRateApp = async () => {
        if (rating === 0) {
            message.warning('Please select a rating before submitting.');
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Get user data
            const userData = getTelegramUserData();
            
            // Calculate reward for the rating
            const reward = calculateRewardForRating(rating);
            
            // Submit rating to backend (if API is available)
            try {
                await submitTelegramRating(rating, userData);
            } catch (apiError) {
                console.warn('API submission failed, continuing with local storage:', apiError);
            }
            
            // Save rating and reward to localStorage
            const ratingData = saveRatingToLocalStorage(rating, reward);
            setHasRated(true);
            setUserRewards(reward);

            // Show success message
            if (reward.amount > 0) {
                message.success(`Thank you for your ${rating}-star rating! You've earned ${reward.amount} ${reward.type}!`);
            } else {
                message.success('Thank you for your feedback!');
            }

            // Open Telegram rating interface
            openTelegramRating();

            setIsModalVisible(false);
            
        } catch (error) {
            message.error('Failed to submit rating. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenModal = () => {
        if (hasRated) {
            // Show rewards if already rated
            if (userRewards) {
                message.info(`You've already rated us ${rating} stars and earned ${userRewards.amount} ${userRewards.type}!`);
            } else {
                message.info('You have already rated our app. Thank you!');
            }
        } else {
            // Check if we're in Telegram environment
            if (!isTelegramEnvironment()) {
                message.warning('This feature works best in Telegram. Please open this app in Telegram for the full experience.');
            }
            setIsModalVisible(true);
        }
    };

    const getStarIcon = () => {
        if (hasRated && userRewards) {
            return <TrophyOutlined />;
        }
        return <StarOutlined />;
    };

    const getButtonText = () => {
        if (hasRated && userRewards) {
            return `${rating}★ +${userRewards.amount}`;
        }
        return 'Rate App';
    };

    const getButtonTooltip = () => {
        if (hasRated && userRewards) {
            return `You rated us ${rating} stars and earned ${userRewards.amount} ${userRewards.type}!`;
        }
        return 'Rate OXYBLE and earn rewards!';
    };

    return (
        <>
            <Tooltip title={getButtonTooltip()} placement="bottom">
                <Button
                    type="text"
                    icon={getStarIcon()}
                    onClick={handleOpenModal}
                    className="telegram-stars-button"
                    aria-label="Rate App"
                >
                    {getButtonText()}
                </Button>
            </Tooltip>

            <Modal
                title={
                    <Space>
                        <StarFilled style={{ color: '#FFD700' }} />
                        <span>Rate OXYBLE</span>
                    </Space>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                centered
                width={400}
                className="telegram-stars-modal"
            >
                <div className="stars-modal-content">
                    <Title level={4} style={{ textAlign: 'center', marginBottom: 16 }}>
                        How would you rate OXYBLE?
                    </Title>
                    
                    <Text style={{ textAlign: 'center', display: 'block', marginBottom: 24, opacity: 0.8 }}>
                        Your feedback helps us improve and rewards you with OXYBLE tokens!
                    </Text>

                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Rate 
                            value={rating} 
                            onChange={handleStarClick}
                            style={{ fontSize: 32 }}
                            character={<StarFilled />}
                        />
                    </div>

                    {rating > 0 && (
                        <Alert
                            message={
                                <Space>
                                    <GiftOutlined />
                                    <span>Reward for {rating} stars:</span>
                                </Space>
                            }
                            description={calculateRewardForRating(rating).message}
                            type="success"
                            showIcon={false}
                            style={{ marginBottom: 24 }}
                        />
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleRateApp}
                            loading={isSubmitting}
                            disabled={rating === 0}
                            icon={<StarFilled />}
                            style={{ marginRight: 12 }}
                        >
                            Submit Rating
                        </Button>
                        <Button
                            onClick={() => setIsModalVisible(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                    </div>

                    <div style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 8 }}>
                        <Text style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                            <strong>Note:</strong> After submitting, you'll be redirected to Telegram to complete your rating.
                        </Text>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default TelegramStars; 