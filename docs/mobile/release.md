# Mobile release checklist

## Background location

Background location is an explicit partner-safety feature. Enable it only after the required OS permission is granted and the user turns sharing on.

1. Sign in with two test accounts.
2. Link and accept the couple relationship.
3. Enable location sharing.
4. Verify background updates and partner map updates.
5. Turn sharing off and verify updates stop.

## Release checks

- iOS and Android permission copy matches the actual feature.
- EAS profile and signing credentials are configured.
- Notification permissions and push credentials are configured.
- Native Google OAuth is configured where enabled.
- Mobile smoke tests pass before store submission.
