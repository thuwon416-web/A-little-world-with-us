# QA Checklist

## Login and auth
- Sign in with valid user
- Sign in with invalid credential
- Logout redirect to login
- Protected tab redirects when unauthenticated

## Chat
- Send text message while online
- Send while offline and confirm queue
- See sync banner change after reconnect
- Open message thread and reply
- Verify message ordering

## Location sharing
- Allow permission flow
- Deny permission and show graceful error
- Toggle sharing on/off
- Verify location updates and timestamp display

## Calls
- Start audio call
- Start video call
- Accept and reject incoming call states
- Ensure camera and microphone permission handling

## AI assistant
- Gift ideas generation
- Date ideas generation
- Message helper flow
- Error handling and retry

## Notifications
- Ask permission and register token
- Trigger local reminder
- Confirm scheduled reminders list updates

## Offline mode
- No network state shows banner
- Pending count rises when offline
- Sync retries when connection returns

## Performance
- Launch time under a reasonable threshold for target device
- Scroll performance in chats and reminders
- Battery and memory usage under review

## Device compatibility
- iOS simulator
- Android emulator
- Low-end Android device
- Dark mode validation
