# Telegram Authentication Implementation for OXYBLE

This document explains the complete Telegram authentication workflow implemented in the OXYBLE app.

## Overview

The OXYBLE app now supports **Telegram WebApp authentication**, allowing users to authenticate seamlessly when accessing the app through Telegram. This provides:

- **Secure authentication** via Telegram's official WebApp API
- **Automatic user creation** and profile management
- **Wallet linking** to Telegram accounts
- **Referral system integration** with Telegram users
- **Telegram Stars balance display** (placeholder for future API)

## Architecture

### Backend Components

1. **`/src/utils/telegramAuth.js`** - Authentication utilities
   - `checkTelegramAuth()` - Verifies Telegram initData signature
   - `extractTelegramUserData()` - Extracts user info from initData
   - `extractTelegramWebAppInfo()` - Extracts WebApp metadata

2. **`/src/controllers/authController.js`** - Authentication controller
   - `authenticateTelegram()` - Main authentication endpoint
   - `getAuthStatus()` - Check user authentication status
   - `linkWallet()` - Link wallet to Telegram user

3. **`/src/routes/authRoutes.js`** - Authentication routes
   - `POST /api/auth/telegram` - Authenticate user
   - `GET /api/auth/status` - Get auth status
   - `POST /api/auth/link-wallet` - Link wallet

4. **`/src/services/userService.js`** - Enhanced user service
   - `ensureUserExists()` - Creates/updates users with Telegram data
   - `getUserByTelegramId()` - Find user by Telegram ID
   - `linkWalletToTelegramUser()` - Link wallet to Telegram account
   - `updateTelegramUserData()` - Update Telegram user info

5. **Database Migration** - `migrations/007_add_telegram_auth_columns.js`
   - Adds Telegram-specific columns to users table
   - Creates indexes for efficient lookups

### Frontend Components

1. **`/src/services/authService.js`** - Authentication service
   - `getTelegramWebAppData()` - Get WebApp data
   - `authenticateTelegram()` - Authenticate with backend
   - `autoAuthenticate()` - Auto-authenticate on app load
   - `getStoredAuthData()` - Get cached auth data

2. **`/src/contexts/TelegramAuthContext.jsx`** - React context
   - Manages authentication state
   - Provides authentication methods
   - Auto-initializes Telegram WebApp

3. **`/src/components/TelegramAuthStatus.jsx`** - Auth status display
   - Shows authentication status in header
   - Displays user info when authenticated

4. **`/src/components/TelegramStarsBalance.jsx`** - Stars balance display
   - Shows Telegram Stars balance (mock for now)
   - Ready for future Telegram Stars API

5. **`/src/components/TelegramStars.jsx`** - Rating system
   - Star rating functionality
   - Reward system integration

## API Endpoints

### Authentication

```http
POST /api/auth/telegram
Content-Type: application/json

{
  "initData": "query_id=...&user=...&auth_date=...&hash=...",
  "walletAddress": "EQ...", // Optional
  "referrerCode": "ABC123"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "telegram_id": 123456789,
    "telegram_username": "username",
    "wallet_address": "EQ...",
    "referral_code": "ABC123",
    "balance": "100.00"
  },
  "telegram_user": {
    "id": 123456789,
    "username": "username",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Auth Status

```http
GET /api/auth/status?telegramId=123456789
GET /api/auth/status?walletAddress=EQ...
```

### Link Wallet

```http
POST /api/auth/link-wallet
Content-Type: application/json

{
  "telegramId": 123456789,
  "walletAddress": "EQ..."
}
```

## Database Schema

### Users Table (Enhanced)

```sql
-- New Telegram-specific columns
ALTER TABLE users ADD COLUMN telegram_username VARCHAR;
ALTER TABLE users ADD COLUMN telegram_first_name VARCHAR;
ALTER TABLE users ADD COLUMN telegram_last_name VARCHAR;
ALTER TABLE users ADD COLUMN telegram_language_code VARCHAR(10);
ALTER TABLE users ADD COLUMN telegram_is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN web_app_info JSONB;
ALTER TABLE users ADD COLUMN last_telegram_auth TIMESTAMP;

-- Indexes for performance
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_telegram_username ON users(telegram_username);
```

## Authentication Flow

### 1. App Initialization
```javascript
// App.jsx
const RootApp = () => (
  <Router>
    <TelegramAuthProvider>
      <TonConnectUIProvider manifestUrl={TONCONNECT_MANIFEST_URL}>
        <App />
      </TonConnectUIProvider>
    </TelegramAuthProvider>
  </Router>
);
```

### 2. Auto-Authentication
```javascript
// TelegramAuthContext.jsx
useEffect(() => {
  const init = async () => {
    await initialize();
    if (checkAuthStatus()) {
      console.log('User already authenticated');
    }
    setIsLoading(false);
  };
  init();
}, []);
```

### 3. Wallet Connection Integration
```javascript
// App.jsx
useEffect(() => {
  if (wallet?.account?.address && telegramAuthenticated) {
    telegramAuthenticate(wallet.account.address);
  }
}, [wallet?.account?.address, telegramAuthenticated]);
```

## Security Features

### 1. HMAC-SHA256 Verification
```javascript
// Backend: telegramAuth.js
function checkTelegramAuth(initData, botToken) {
  // Parse initData and verify hash
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  return computedHash === hash;
}
```

### 2. Input Validation
- Validates Telegram user data
- Validates TON wallet addresses
- Sanitizes all inputs

### 3. Error Handling
- Comprehensive error messages
- Graceful fallbacks for non-Telegram environments
- Secure error responses

## Environment Variables

### Backend (.env)
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
CORS_WHITELIST=https://web.telegram.org,https://your-domain.com
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=https://api.oxyble.com
```

## Usage Examples

### Basic Authentication
```javascript
import { useTelegramAuth } from './contexts/TelegramAuthContext';

const MyComponent = () => {
  const { 
    user, 
    telegramUser, 
    isAuthenticated, 
    authenticate 
  } = useTelegramAuth();

  if (!isAuthenticated) {
    return <button onClick={() => authenticate()}>Login with Telegram</button>;
  }

  return <div>Welcome, {telegramUser.username}!</div>;
};
```

### Wallet Linking
```javascript
const { linkWalletToUser } = useTelegramAuth();

const handleLinkWallet = async () => {
  try {
    await linkWalletToUser(telegramId, walletAddress);
    message.success('Wallet linked successfully!');
  } catch (error) {
    message.error('Failed to link wallet');
  }
};
```

## Telegram Stars Integration

### Current Implementation
- **Mock balance display** based on user ID
- **Ready for future API** when Telegram exposes Stars balance
- **Placeholder functions** for real Stars API integration

### Future Integration
```javascript
// When Telegram Stars API is available
async function fetchTelegramStarsBalance() {
  if (window.Telegram?.WebApp?.getStarsBalance) {
    return await window.Telegram.WebApp.getStarsBalance();
  }
  return null;
}
```

## Testing

### Development Environment
1. Set up Telegram Bot with WebApp
2. Configure bot token in backend
3. Test authentication flow
4. Verify database updates

### Production Deployment
1. Run database migration
2. Set environment variables
3. Deploy backend and frontend
4. Test in Telegram WebApp

## Troubleshooting

### Common Issues

1. **"Not in Telegram WebApp environment"**
   - App must be opened through Telegram
   - Check if `window.Telegram.WebApp` exists

2. **"Invalid Telegram authentication"**
   - Verify bot token is correct
   - Check initData format
   - Ensure proper HMAC verification

3. **"User not found"**
   - Check database connection
   - Verify user creation logic
   - Check migration status

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('OXYBLE_DEBUG', 'true');
```

## Future Enhancements

1. **Real Telegram Stars API** integration
2. **Advanced user analytics** with Telegram data
3. **Push notifications** via Telegram Bot API
4. **Multi-language support** based on Telegram language
5. **Premium features** for Telegram Premium users

## Support

For issues or questions about the Telegram authentication implementation:

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database migration has been run
4. Test in a proper Telegram WebApp environment

---

**Note:** This implementation provides a solid foundation for Telegram authentication while maintaining compatibility with existing wallet-based authentication systems. 