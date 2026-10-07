# A11Y Screen Reader Testing Plan

## Overview
This document outlines screen reader testing procedures for the app's critical flows. Testing should be performed with VoiceOver (iOS), TalkBack (Android), and NVDA (Windows).

## Test Environment Setup

### VoiceOver (iOS)
- Device: iPhone/iPad with latest iOS
- VoiceOver: Settings → Accessibility → VoiceOver → On
- Testing browser: Safari
- Testing app: TestFlight build

### TalkBack (Android)
- Device: Android phone/tablet with latest Android
- TalkBack: Settings → Accessibility → TalkBack → On
- Testing browser: Chrome
- Testing app: APK build

### NVDA (Windows)
- OS: Windows 10/11
- NVDA: Latest version from nvaccess.org
- Testing browser: Chrome/Firefox/Edge
- Testing app: Web version

## Critical Flows to Test

### 1. Login Flow
**Steps:**
1. Navigate to login page
2. Enter email address
3. Enter password
4. Submit form
5. Navigate to dashboard

**Expected Behavior:**
- Email input announced as "Email, edit text"
- Password input announced as "Password, secure edit text"
- Button announced as "Sign in, button"
- Error messages announced with role="alert"
- Success navigation to dashboard

**Test Checklist:**
- [ ] All form fields have accessible labels
- [ ] Error messages are announced
- [ ] Button text is descriptive
- [ ] Focus moves logically through form
- [ ] Skip link works (web only)

### 2. Chat Flow
**Steps:**
1. Navigate to chat page
2. Read existing messages
3. Type new message
4. Send message
5. Navigate to message history

**Expected Behavior:**
- Message input announced as "Message, edit text"
- Send button announced as "Send, button"
- New messages announced via aria-live region
- Message sender identified
- Attachment buttons have labels

**Test Checklist:**
- [ ] Message input has label
- [ ] Send button is discoverable
- [ ] New messages announced
- [ ] Message sender identified
- [ ] Attachment buttons labeled
- [ ] Emoji/sticker pickers accessible

### 3. Vault Flow
**Steps:**
1. Navigate to vault page
2. Enter PIN/phrase
3. View vault items
4. Add new item
5. Edit/delete items

**Expected Behavior:**
- PIN input announced as secure text
- Unlock button labeled
- Vault items announced with type
- Add/edit/delete buttons have labels
- Error messages announced

**Test Checklist:**
- [ ] PIN input labeled
- [ ] Unlock button labeled
- [ ] Vault items type announced
- [ ] Action buttons labeled
- [ ] Error messages announced
- [ ] Loading states announced

### 4. Settings Flow
**Steps:**
1. Navigate to settings page
2. Change theme
3. Change language
4. Manage couple settings
5. Data management options

**Expected Behavior:**
- Settings grouped logically
- Theme switcher labeled
- Language switcher labeled
- Couple settings accessible
- Delete data has confirmation
- Buttons labeled clearly

**Test Checklist:**
- [ ] Settings grouped with headings
- [ ] Theme switcher labeled
- [ ] Language switcher labeled
- [ ] Couple settings accessible
- [ ] Delete confirmation announced
- [ ] Save/apply buttons labeled

## Common Issues to Check

### Navigation
- [ ] Tab order is logical
- [ ] Skip link works (web)
- [ ] Back navigation available
- [ ] Modal close buttons labeled

### Forms
- [ ] All inputs have labels
- [ ] Required fields indicated
- [ ] Error messages clear
- [ ] Success messages clear
- [ ] Form validation announced

### Dynamic Content
- [ ] Loading states announced
- [ ] Live regions work correctly
- [ ] Content updates announced
- [ ] Error toasts announced

### Images/Media
- [ ] Images have alt text
- [ ] Decorative images marked
- [ ] Icons have labels
- [ ] Videos have captions
- [ ] Audio has controls

## Issue Reporting Template

**Issue ID:** [A11Y-XXX]  
**Screen Reader:** [VoiceOver/TalkBack/NVDA]  
**Platform:** [iOS/Android/Windows]  
**Browser:** [Safari/Chrome/Firefox/Edge]  
**Flow:** [Login/Chat/Vault/Settings]  
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**  
**Actual Behavior:**  

**Severity:** [Critical/High/Medium/Low]  
**Attachments:** [Screenshots/audio recordings]

## Testing Schedule
- **Weekly:** Regression testing on critical flows
- **Pre-release:** Full screen reader audit
- **Post-major changes:** Test affected flows only
- **User feedback:** Incorporate reported issues

## Resources
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [VoiceOver User Guide](https://www.apple.com/accessibility/voiceover/guide/)
- [TalkBack User Guide](https://support.google.com/accessibility/android/answer/62863634)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda-documentation.html)
