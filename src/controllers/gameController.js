
const gameService = require('../services/gameService'); 
const { OXYBLE_TOKEN_MASTER_ADDRESS } = require('../config/envConfig');
const { Address } = require('@ton/core'); 


const isValidTonAddress = (addr) => {
    try {
        Address.parse(addr);
        return true;
    } catch (e) {
        return false;
    }
};

exports.handleCoinflipBet = async (req, res, next) => {
    try {
        const { userWalletAddress, betAmountOXYBLE, choice } = req.body;

        
        if (!userWalletAddress || !betAmountOXYBLE || !choice) {
            return res.status(400).json({ message: "Missing required bet information (userWalletAddress, betAmountOXYBLE, choice)." });
        }
        if (!isValidTonAddress(userWalletAddress)) {
             return res.status(400).json({ message: "Invalid userWalletAddress format." });
        }
        const numericBetAmount = parseFloat(betAmountOXYBLE);
        if (isNaN(numericBetAmount) || numericBetAmount <= 0) {
            return res.status(400).json({ message: "Invalid OXYBLE bet amount."});
        }
        if (choice !== 'heads' && choice !== 'tails') {
            return res.status(400).json({ message: "Invalid choice. Must be 'heads' or 'tails'." });
        }

        
        
        
        
        

        const gameResult = await gameService.playCoinflip({
            userWalletAddress,
            betAmountOXYBLE: numericBetAmount,
            choice
        });

        res.status(200).json(gameResult);

    } catch (error) {
        if (error.message.includes("Insufficient balance for bet") || error.message.includes("Bet amount exceeds limit")) { 
            return res.status(400).json({ message: error.message });
        }
        console.error("CTRL: Error in handleCoinflipBet:", error.message, error.stack);
        next(error);
    }
};














