# Game Monitor App

A React Native application for monitoring children's gaming behavior and providing parental controls. The app allows parents to track their children's gaming sessions, receive real-time alerts, and manage gaming restrictions.

## Features

- **User Authentication**: Secure login and registration system
- **Role-based Access**: Separate interfaces for parents and children
- **Real-time Monitoring**: WebSocket-based alerts for gaming activity
- **Session Tracking**: Automatic logging of gaming sessions with duration
- **Parental Controls**: Set time limits and restrictions on gaming
- **Dashboard Analytics**: View detailed gaming statistics and patterns
- **Child Linking**: Parents can link and monitor multiple children

## Tech Stack

- **Frontend**: React Native 0.84.1
- **Navigation**: React Navigation v7
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Real-time**: WebSocket
- **Backend**: Node.js/Express (hosted on Render)
- **Database**: MongoDB

## Prerequisites

- Node.js >= 22.11.0
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development)
- CocoaPods (for iOS)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GameMonitorAppNew
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (iOS only)
   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   ```

## Running the App

### Start Metro Bundler
```bash
npm start
```

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## Project Structure

```
GameMonitorAppNew/
├── android/                 # Android native code
├── ios/                     # iOS native code
├── screens/                 # React Native screens
│   ├── LoginScreen.js       # Authentication screen
│   ├── RegisterScreen.js     # User registration
│   ├── DashboardScreen.js   # Child dashboard
│   ├── ParentScreen.js      # Parent monitoring interface
│   └── MainScreen.js        # Main app screen
├── services/                # API and external services
│   ├── api.js              # Axios configuration and interceptors
│   ├── authService.js      # Authentication API calls
│   ├── parentService.js    # Parent-specific API calls
│   ├── sessionService.js   # Session tracking API calls
│   └── socket.js           # WebSocket connection
├── utils/                   # Utility functions
│   ├── format.js           # Data formatting utilities
│   ├── gameDetector.js     # Game detection logic
│   └── theme.js            # App theming
├── __tests__/               # Test files
└── vendor/                  # Third-party dependencies
```

## API Integration

The app communicates with a backend API hosted at `https://backend-behavior-pred-depoy.onrender.com/api`.

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Parent Endpoints
- `GET /parent/children` - Get linked children
- `GET /parent/dashboard/:id` - Get child dashboard data
- `POST /parent/link` - Link a child account
- `PUT /parent/controls/:id` - Update parental controls

### Session Endpoints
- `POST /sessions/log` - Log gaming session
- `GET /sessions/my` - Get user's sessions
- `POST /sessions/:id/feedback` - Submit session feedback

### API Configuration

The API is configured in `services/api.js` with:
- Base URL: `https://backend-behavior-pred-depoy.onrender.com/api`
- Automatic token authentication via interceptors
- Token storage in AsyncStorage

## Real-time Features

The app uses WebSocket connections for real-time alerts:
- Connection URL: `ws://10.0.2.2:5050/ws` (Android emulator)
- Authentication via JWT tokens
- Real-time notifications for gaming activity

## Development

### Code Quality
```bash
# Run linter
npm run lint

# Run tests
npm test
```

### Building for Production

#### Android

##### Method 1: Using React Native CLI (Recommended)
```bash
# Build release APK
cd android
./gradlew assembleRelease

# Build release AAB (for Google Play Store)
./gradlew bundleRelease
```

##### Method 2: Using Android Studio
1. Open Android Studio
2. Select "Open an existing Android Studio project"
3. Navigate to your project's `android` folder
4. Wait for Gradle sync to complete
5. Go to Build → Generate Signed Bundle/APK
6. Choose APK or Android App Bundle
7. Create or select a keystore
8. Select release build variant
9. Build the APK

##### Testing in Android Studio
1. Open the project in Android Studio (File → Open → select `android` folder)
2. Wait for Gradle sync
3. Connect an Android device or start an emulator
4. Click the "Run" button (green play icon) or press Shift+F10
5. Select your device/emulator from the deployment target dialog

##### Installing APK on Device
```bash
# For debug APK (development)
npx react-native run-android

# For release APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Or use Android Studio's Install option
```

##### Common Android Build Issues
- **Gradle sync failed**: Clean and rebuild
  ```bash
  cd android
  ./gradlew clean
  ./gradlew build
  ```
- **SDK location not found**: Set ANDROID_HOME environment variable
- **Missing NDK**: Install NDK through Android Studio SDK Manager
- **Permission denied**: Run `chmod +x gradlew`

#### iOS
```bash
cd ios
xcodebuild -workspace GameMonitorAppNew.xcworkspace -scheme GameMonitorAppNew -configuration Release
```

## Environment Configuration

For different environments (development, staging, production), update the `baseURL` in `services/api.js`:

```javascript
const API = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? 'https://your-production-api.com/api'
    : 'https://backend-behavior-pred-depoy.onrender.com/api',
  timeout: 10000,
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
2. **iOS build failures**: Ensure CocoaPods are installed and up to date
3. **Android build failures**: Check Android SDK and NDK versions
4. **API connection issues**: Verify internet connection and API endpoint availability

### WebSocket Connection

For Android emulator, use `10.0.2.2` as the WebSocket host. For physical devices or iOS simulator, use your computer's IP address.

## License

This project is licensed under the MIT License.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
