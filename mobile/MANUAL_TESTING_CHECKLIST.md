# Cloud Clips - Manual Testing Checklist

This document provides a comprehensive manual testing checklist to verify all critical features work correctly before each release.

**Last Updated:** December 3, 2025
**Version:** 1.0.0

---

## Quick Start

Before running manual tests:

1. Ensure the backend is running: `cd backend && go run cmd/main.go`
2. Start the mobile app: `cd mobile && bun dev`
3. Use a fresh test account or reset test data
4. Test on both iOS and Android devices when possible

---

## Test Execution Tracking

Use this table to track test execution for each release:

| Release Version | Tester | Date | Platform | Pass/Fail |
|-----------------|--------|------|----------|-----------|
| v1.0.0 | | | iOS | |
| v1.0.0 | | | Android | |

---

## 1. Authentication (Priority: CRITICAL)

### 1.1 Email Signup

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1.1.1 | Create new account with email/password | 1. Open app 2. Tap "Get Started" 3. Tap "Sign Up" 4. Fill all fields 5. Tap "Create Account" | Account created, user redirected to home | [ ] |
| 1.1.2 | Signup with invalid email | Enter invalid email format (e.g., "test@") | Error message: "Invalid email format" | [ ] |
| 1.1.3 | Signup with weak password | Enter password less than 8 chars | Error message about password requirements | [ ] |
| 1.1.4 | Signup with mismatched passwords | Enter different passwords in password and confirm fields | Error message: "Passwords don't match" | [ ] |
| 1.1.5 | Signup with existing email | Use an email that's already registered | Error message: "Email already in use" | [ ] |
| 1.1.6 | Signup with empty fields | Leave required fields empty | Error messages for required fields | [ ] |

### 1.2 Email Login

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1.2.1 | Login with valid credentials | Enter valid email and password | User logged in, redirected to home | [ ] |
| 1.2.2 | Login with invalid email | Enter non-existent email | Error message: "Invalid credentials" | [ ] |
| 1.2.3 | Login with wrong password | Enter wrong password | Error message: "Invalid credentials" | [ ] |
| 1.2.4 | Login with empty fields | Leave email or password empty | Error messages for required fields | [ ] |

### 1.3 OAuth (Google & Apple)

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1.3.1 | Sign in with Google | Tap "Continue with Google", complete OAuth | Account created/logged in | [ ] |
| 1.3.2 | Cancel Google OAuth | Start Google OAuth, then cancel | Returns to login screen gracefully | [ ] |
| 1.3.3 | Sign in with Apple (iOS only) | Tap "Continue with Apple", complete OAuth | Account created/logged in | [ ] |
| 1.3.4 | Cancel Apple OAuth (iOS only) | Start Apple OAuth, then cancel | Returns to login screen gracefully | [ ] |

### 1.4 Password Reset

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1.4.1 | Request password reset | 1. Tap "Forgot Password" 2. Enter email 3. Tap "Send" | Success message, email sent | [ ] |
| 1.4.2 | Reset with non-existent email | Enter email not in system | Generic success message (security) | [ ] |
| 1.4.3 | Complete password reset | Click link in email, set new password | Password updated, can login | [ ] |
| 1.4.4 | Use expired reset link | Use reset link after expiration | Error message: "Link expired" | [ ] |

### 1.5 Email Verification

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1.5.1 | Verify email after signup | Click verification link in email | Email verified, banner removed | [ ] |
| 1.5.2 | Resend verification email | Tap "Resend" on verification banner | New email sent | [ ] |
| 1.5.3 | Use expired verification link | Use link after expiration | Error message, option to resend | [ ] |

### 1.6 Biometric Authentication

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1.6.1 | Enable biometric auth | Settings > Enable Biometrics | Biometric prompt appears | [ ] |
| 1.6.2 | Login with biometrics | App launch with biometrics enabled | Biometric prompt, auto-login on success | [ ] |
| 1.6.3 | Disable biometric auth | Settings > Disable Biometrics | Biometrics disabled, requires password | [ ] |
| 1.6.4 | Biometric failure fallback | Fail biometric auth 3 times | Fallback to password login | [ ] |

### 1.7 Logout & Session

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1.7.1 | Logout | Profile > Logout | Session cleared, redirected to login | [ ] |
| 1.7.2 | Session persistence | Login, close app, reopen | User remains logged in | [ ] |
| 1.7.3 | Session expiry | Wait for token expiry | Token refreshes automatically | [ ] |

---

## 2. Barber Discovery (Priority: HIGH)

### 2.1 Browse Barbers

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 2.1.1 | View barber list | Open Home tab | List of barbers displayed | [ ] |
| 2.1.2 | Load more barbers | Scroll to bottom of list | More barbers loaded (pagination) | [ ] |
| 2.1.3 | Pull to refresh | Pull down on barber list | List refreshed | [ ] |
| 2.1.4 | Empty state | Search with no results | "No barbers found" message | [ ] |

### 2.2 Search Barbers

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 2.2.1 | Search by name | Type barber name in search | Matching barbers shown | [ ] |
| 2.2.2 | Search by location | Type city/area name | Barbers in that area shown | [ ] |
| 2.2.3 | Search by specialty | Type "fade" or "beard" | Barbers with that specialty shown | [ ] |
| 2.2.4 | Clear search | Tap clear button | All barbers shown again | [ ] |

### 2.3 Filter Barbers

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 2.3.1 | Filter by rating | Set minimum rating (e.g., 4 stars) | Only 4+ star barbers shown | [ ] |
| 2.3.2 | Filter by distance | Set max distance (e.g., 5 miles) | Only nearby barbers shown | [ ] |
| 2.3.3 | Filter by price range | Set price range | Barbers within range shown | [ ] |
| 2.3.4 | Combine filters | Apply multiple filters | Results match all criteria | [ ] |
| 2.3.5 | Clear filters | Tap "Clear All" | All filters removed | [ ] |

### 2.4 Barber Profile

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 2.4.1 | View barber profile | Tap on barber card | Profile page opens | [ ] |
| 2.4.2 | View barber info | On profile page | Name, bio, rating, location visible | [ ] |
| 2.4.3 | View services | Scroll to services section | All services with prices listed | [ ] |
| 2.4.4 | View gallery | Tap gallery tab | Photo gallery displayed | [ ] |
| 2.4.5 | View reviews | Tap reviews tab | Customer reviews displayed | [ ] |
| 2.4.6 | View availability | Tap "View Availability" | Calendar with available slots | [ ] |

### 2.5 Map View

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 2.5.1 | Toggle map view | Tap map icon on discovery screen | Map view with pins shown | [ ] |
| 2.5.2 | Tap barber pin | Tap a pin on map | Barber info card appears | [ ] |
| 2.5.3 | Navigate from pin | Tap "View Profile" on card | Opens barber profile | [ ] |
| 2.5.4 | Current location | Allow location access | Map centers on user location | [ ] |

---

## 3. Booking Flow (Priority: CRITICAL)

### 3.1 Service Selection

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 3.1.1 | Select single service | Tap on a service | Service selected, highlighted | [ ] |
| 3.1.2 | Select multiple services | Tap on multiple services | All selected, total updated | [ ] |
| 3.1.3 | Deselect service | Tap selected service again | Service deselected, total updated | [ ] |
| 3.1.4 | View service details | Tap info icon on service | Duration and description shown | [ ] |

### 3.2 Date/Time Selection

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 3.2.1 | Select date | Tap on date in calendar | Date selected, available times shown | [ ] |
| 3.2.2 | Select time slot | Tap on available time | Time selected, highlighted | [ ] |
| 3.2.3 | Select past date | Try to tap past date | Past dates disabled/unselectable | [ ] |
| 3.2.4 | Select unavailable time | Try to tap booked slot | Slot disabled/unselectable | [ ] |
| 3.2.5 | Navigate months | Tap next/prev month arrows | Calendar updates correctly | [ ] |

### 3.3 Booking Confirmation

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 3.3.1 | Review booking summary | On confirmation screen | Service, date, time, price correct | [ ] |
| 3.3.2 | Add booking notes | Tap "Add Notes", enter text | Notes saved to booking | [ ] |
| 3.3.3 | Apply coupon | Enter valid coupon code | Discount applied, total updated | [ ] |
| 3.3.4 | Apply invalid coupon | Enter invalid code | Error message shown | [ ] |
| 3.3.5 | Confirm booking | Tap "Confirm & Pay" | Proceeds to payment | [ ] |

### 3.4 Booking Completion

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 3.4.1 | Successful booking | Complete payment | Confirmation screen shown | [ ] |
| 3.4.2 | Receive confirmation | After booking | Push notification received | [ ] |
| 3.4.3 | Add to calendar | Tap "Add to Calendar" | Calendar event created | [ ] |
| 3.4.4 | View booking details | Tap "View Appointment" | Appointment details shown | [ ] |

### 3.5 Manage Appointments

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 3.5.1 | View upcoming appointments | Go to Appointments tab | Upcoming list displayed | [ ] |
| 3.5.2 | View past appointments | Tap "Past" tab | History displayed | [ ] |
| 3.5.3 | Cancel appointment | Tap "Cancel", confirm | Appointment cancelled | [ ] |
| 3.5.4 | Cancel within policy | Cancel with 24+ hours notice | Full refund processed | [ ] |
| 3.5.5 | Cancel outside policy | Cancel with <24 hours | Cancellation fee applied | [ ] |
| 3.5.6 | Reschedule appointment | Tap "Reschedule" | Date/time picker opens | [ ] |
| 3.5.7 | Complete reschedule | Select new date/time, confirm | Appointment updated | [ ] |

---

## 4. Payment Processing (Priority: CRITICAL)

### 4.1 Payment Methods

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 4.1.1 | Add credit card | Profile > Payment Methods > Add | Card saved securely | [ ] |
| 4.1.2 | Add invalid card number | Enter invalid card number (wrong length) | Error: "Invalid card number" | [ ] |
| 4.1.3 | Add expired card | Enter card with past expiration date | Error: "Card has expired" | [ ] |
| 4.1.4 | Add card with invalid CVV | Enter 2-digit CVV for Visa | Error: "Invalid security code" | [ ] |
| 4.1.5 | View saved cards | Profile > Payment Methods | All saved cards listed with masked numbers | [ ] |
| 4.1.6 | Set default card | Tap "Set as Default" | Card marked as default with checkmark | [ ] |
| 4.1.7 | Remove card | Swipe left, tap Delete | Card removed, confirmation shown | [ ] |
| 4.1.8 | Add multiple cards | Add 3+ different cards | All cards saved and listed | [ ] |
| 4.1.9 | Card type detection | Enter Visa/Mastercard/Amex | Correct card logo displayed | [ ] |

### 4.2 Checkout

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 4.2.1 | Pay with saved card | Select saved card, confirm | Payment successful | [ ] |
| 4.2.2 | Pay with new card | Add new card at checkout | Payment successful, card optionally saved | [ ] |
| 4.2.3 | Save new card option | Check "Save card" during checkout | Card appears in saved cards after purchase | [ ] |
| 4.2.4 | 3D Secure flow | Use card 4000000000003220 | 3DS prompt appears, complete auth | [ ] |
| 4.2.5 | 3D Secure cancelled | Start 3DS, then cancel | Returns to checkout, can retry | [ ] |
| 4.2.6 | Payment declined - insufficient funds | Use card 4000000000009995 | Error: "Insufficient funds" | [ ] |
| 4.2.7 | Payment declined - generic | Use card 4000000000000002 | Error: "Payment declined", can retry | [ ] |
| 4.2.8 | Network error during payment | Turn off network mid-payment | Error: "Network error", can retry | [ ] |
| 4.2.9 | Apply loyalty points | Toggle "Use Points" | Points applied, new total calculated | [ ] |
| 4.2.10 | Partial points redemption | Use some points (not all) | Remaining balance charged to card | [ ] |

### 4.3 Coupon Codes

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 4.3.1 | Apply valid coupon (percentage) | Enter "FIRST10" | 10% discount applied, total updated | [ ] |
| 4.3.2 | Apply valid coupon (fixed amount) | Enter "SUMMER20" | $20 discount applied | [ ] |
| 4.3.3 | Apply invalid coupon | Enter "INVALIDCODE" | Error: "Invalid coupon code" | [ ] |
| 4.3.4 | Apply expired coupon | Enter expired coupon code | Error: "Coupon has expired" | [ ] |
| 4.3.5 | Apply coupon below minimum | Use coupon with min spend on small order | Error: "Minimum spend $X required" | [ ] |
| 4.3.6 | Remove coupon | Tap "Remove" on applied coupon | Discount removed, original total shown | [ ] |
| 4.3.7 | Multiple coupons | Try to add second coupon | Error: "Only one coupon per order" | [ ] |
| 4.3.8 | Coupon + loyalty points | Apply coupon, then toggle points | Both discounts applied correctly | [ ] |
| 4.3.9 | First-time user coupon | New user applies "FIRST10" | Discount applied | [ ] |
| 4.3.10 | Reuse first-time coupon | Existing user applies "FIRST10" | Error: "Coupon for new users only" | [ ] |

### 4.4 Refunds

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 4.4.1 | View refund status | After cancellation, check order | Refund status: "Processing" | [ ] |
| 4.4.2 | Receive refund (full) | Cancel within policy period | Full refund credited, status: "Refunded" | [ ] |
| 4.4.3 | Partial refund | Cancel outside policy period | Partial refund minus fee, breakdown shown | [ ] |
| 4.4.4 | Points refund | Cancel order paid with points | Points returned to account | [ ] |
| 4.4.5 | Combined refund | Cancel order with card + points | Card refunded, points restored | [ ] |
| 4.4.6 | Refund timeline | Check refund after processing | "3-5 business days" notice shown | [ ] |
| 4.4.7 | Refund to deleted card | Refund when card removed | Refund still processed to original card | [ ] |
| 4.4.8 | Dispute refund | Contact support about refund | Support ticket created | [ ] |

### 4.5 Payment History

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 4.5.1 | View all transactions | Profile > Payment History | All transactions listed chronologically | [ ] |
| 4.5.2 | View transaction details | Tap on transaction | Full details: amount, date, card, status | [ ] |
| 4.5.3 | Filter by date | Select date range | Filtered transactions shown | [ ] |
| 4.5.4 | Filter by type | Select "Refunds" only | Only refunds shown | [ ] |
| 4.5.5 | Download receipt | Tap "Download Receipt" | PDF receipt downloaded | [ ] |
| 4.5.6 | Empty history | New user views history | "No transactions yet" message | [ ] |

---

## 5. Chat & Communication (Priority: MEDIUM)

### 5.1 Starting Conversations

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 5.1.1 | Start chat from barber profile | Tap "Message" on barber profile | Chat screen opens with barber info | [ ] |
| 5.1.2 | Start chat from booking | Tap "Contact Barber" on appointment | Chat opens, booking context included | [ ] |
| 5.1.3 | Start chat from order | Tap "Contact" on product order | Chat opens with order reference | [ ] |
| 5.1.4 | View existing conversations | Go to Messages tab | All conversations listed | [ ] |
| 5.1.5 | Search conversations | Type in search bar | Matching conversations shown | [ ] |
| 5.1.6 | Empty conversations | New user opens Messages | "No conversations yet" message | [ ] |

### 5.2 Sending Messages

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 5.2.1 | Send text message | Type message, tap send | Message sent, displayed with timestamp | [ ] |
| 5.2.2 | Send long message | Send 500+ character message | Message sent, displayed correctly | [ ] |
| 5.2.3 | Send emoji | Send message with emojis | Emojis displayed correctly | [ ] |
| 5.2.4 | Send image from gallery | Tap camera > Select from gallery | Image uploaded and sent | [ ] |
| 5.2.5 | Take and send photo | Tap camera > Take photo | Photo captured and sent | [ ] |
| 5.2.6 | Send multiple images | Select 3+ images | All images sent as separate messages | [ ] |
| 5.2.7 | Send while offline | Type message with no network | Message queued, sent when online | [ ] |
| 5.2.8 | Failed message retry | Message fails to send | "Retry" button appears, tap to resend | [ ] |
| 5.2.9 | Delete sent message | Long press message > Delete | "Message deleted" placeholder shown | [ ] |

### 5.3 Receiving Messages

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 5.3.1 | Receive message in chat | Other party sends message | Message appears instantly | [ ] |
| 5.3.2 | Receive message in app | Other party sends while in different screen | Badge count updates | [ ] |
| 5.3.3 | Receive message background | Other party sends while app backgrounded | Push notification received | [ ] |
| 5.3.4 | Receive message closed | Other party sends while app closed | Push notification received | [ ] |
| 5.3.5 | Message read receipts | View message sent by other | "Read" status shown to sender | [ ] |
| 5.3.6 | Typing indicator | Other party is typing | "Typing..." indicator shown | [ ] |

### 5.4 Chat History

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 5.4.1 | Load chat history | Open existing conversation | Previous messages loaded | [ ] |
| 5.4.2 | Load older messages | Scroll to top of chat | Older messages load (pagination) | [ ] |
| 5.4.3 | Search in conversation | Tap search icon, enter text | Matching messages highlighted | [ ] |
| 5.4.4 | Jump to date | Tap date picker, select date | Scrolls to that date's messages | [ ] |
| 5.4.5 | View media gallery | Tap "Media" in chat info | All shared images shown | [ ] |

### 5.5 Chat Notifications

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 5.5.1 | Enable chat notifications | Settings > Notifications > Messages ON | Chat notifications enabled | [ ] |
| 5.5.2 | Disable chat notifications | Settings > Notifications > Messages OFF | No chat notifications | [ ] |
| 5.5.3 | Mute specific conversation | Chat > Info > Mute | No notifications from this chat | [ ] |
| 5.5.4 | Unmute conversation | Chat > Info > Unmute | Notifications resume | [ ] |
| 5.5.5 | Notification sound | Receive message | Custom notification sound plays | [ ] |
| 5.5.6 | Notification tap | Tap chat notification | Opens specific conversation | [ ] |
| 5.5.7 | Quick reply from notification | Long press notification > Reply | Reply sent without opening app | [ ] |

### 5.6 Chat Management

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 5.6.1 | Archive conversation | Swipe left > Archive | Conversation moved to archive | [ ] |
| 5.6.2 | View archived chats | Messages > Archived | Archived conversations listed | [ ] |
| 5.6.3 | Unarchive conversation | Swipe left on archived > Unarchive | Conversation restored | [ ] |
| 5.6.4 | Delete conversation | Swipe left > Delete > Confirm | Conversation permanently deleted | [ ] |
| 5.6.5 | Block user | Chat > Info > Block | User blocked, cannot send messages | [ ] |
| 5.6.6 | Report conversation | Chat > Info > Report | Report submitted to admin | [ ] |

---

## 6. Products & Shop (Priority: MEDIUM)

### 6.1 Product Browsing

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 6.1.1 | View products | Open Shop tab | Product grid/list displayed | [ ] |
| 6.1.2 | View by category | Tap "Hair Care" category | Only hair care products shown | [ ] |
| 6.1.3 | View all categories | Tap "Categories" | All categories listed | [ ] |
| 6.1.4 | Search products by name | Type "pomade" in search | Matching products shown | [ ] |
| 6.1.5 | Search products by brand | Type "Baxter" in search | Brand's products shown | [ ] |
| 6.1.6 | No search results | Search "ZZZZNONEXISTENT" | "No products found" message | [ ] |
| 6.1.7 | Sort by price (low-high) | Tap Sort > Price Low to High | Products sorted ascending | [ ] |
| 6.1.8 | Sort by price (high-low) | Tap Sort > Price High to Low | Products sorted descending | [ ] |
| 6.1.9 | Sort by popularity | Tap Sort > Most Popular | Products sorted by sales/views | [ ] |
| 6.1.10 | Sort by newest | Tap Sort > Newest | Most recent products first | [ ] |
| 6.1.11 | Filter by price range | Set $10-$30 range | Only products in range shown | [ ] |
| 6.1.12 | Filter by rating | Select 4+ stars | Only 4+ star products shown | [ ] |
| 6.1.13 | Combine filters | Category + Price + Rating | Results match all criteria | [ ] |
| 6.1.14 | Clear filters | Tap "Clear All" | All filters removed | [ ] |
| 6.1.15 | Pull to refresh | Pull down on product list | Products refreshed | [ ] |
| 6.1.16 | Infinite scroll | Scroll to bottom | More products load | [ ] |

### 6.2 Product Details

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 6.2.1 | View product details | Tap on product | Detail page with full info | [ ] |
| 6.2.2 | View product images | Swipe through images | Image carousel works | [ ] |
| 6.2.3 | Zoom product image | Pinch to zoom on image | Image zooms in/out | [ ] |
| 6.2.4 | View product description | Scroll on detail page | Full description visible | [ ] |
| 6.2.5 | View product reviews | Tap "Reviews" section | Customer reviews listed | [ ] |
| 6.2.6 | View product rating | On detail page | Star rating and count shown | [ ] |
| 6.2.7 | Check stock status | On detail page | "In Stock" or "Out of Stock" shown | [ ] |
| 6.2.8 | Out of stock product | View out of stock item | "Add to Cart" disabled, "Notify Me" shown | [ ] |
| 6.2.9 | Notify when available | Tap "Notify Me" on out of stock | Confirmation: "We'll notify you" | [ ] |
| 6.2.10 | View related products | Scroll to bottom | "You might also like" section | [ ] |
| 6.2.11 | Select variant (size) | Tap size option | Price updates if different | [ ] |
| 6.2.12 | Select variant (scent) | Tap scent option | Selection highlighted | [ ] |

### 6.3 Shopping Cart

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 6.3.1 | Add to cart | Tap "Add to Cart" | Item added, cart badge updates | [ ] |
| 6.3.2 | Add with variant | Select size, then add | Correct variant in cart | [ ] |
| 6.3.3 | Add multiple same item | Tap "Add to Cart" twice | Quantity increases to 2 | [ ] |
| 6.3.4 | View cart | Tap cart icon | Cart screen with all items | [ ] |
| 6.3.5 | Update quantity (+) | Tap + button | Quantity increases, total updates | [ ] |
| 6.3.6 | Update quantity (-) | Tap - button | Quantity decreases, total updates | [ ] |
| 6.3.7 | Set quantity to 0 | Tap - until 0 | Item removed from cart | [ ] |
| 6.3.8 | Remove item | Swipe left > Remove | Item removed | [ ] |
| 6.3.9 | Clear entire cart | Tap "Clear Cart" > Confirm | Cart emptied | [ ] |
| 6.3.10 | Empty cart view | Remove all items | "Your cart is empty" message | [ ] |
| 6.3.11 | Cart persistence | Add items, close app, reopen | Cart items still present | [ ] |
| 6.3.12 | Price change notification | If product price changed | "Price updated" notice shown | [ ] |
| 6.3.13 | Out of stock in cart | Item goes out of stock | Warning shown, can remove | [ ] |
| 6.3.14 | Save for later | Swipe right > Save | Item moved to "Saved" section | [ ] |
| 6.3.15 | Move from saved to cart | Tap "Move to Cart" on saved item | Item returns to cart | [ ] |

### 6.4 Product Checkout

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 6.4.1 | Proceed to checkout | Tap "Checkout" | Order summary screen | [ ] |
| 6.4.2 | Select saved address | Tap on saved address | Address selected | [ ] |
| 6.4.3 | Add new address | Tap "Add Address", fill form | New address saved and selected | [ ] |
| 6.4.4 | Edit address | Tap edit on address | Address updated | [ ] |
| 6.4.5 | Select shipping method | Choose Standard/Express | Shipping cost and ETA update | [ ] |
| 6.4.6 | Free shipping threshold | Cart above $50 | Free shipping option available | [ ] |
| 6.4.7 | Apply product coupon | Enter "FREESHIP" | Shipping discount applied | [ ] |
| 6.4.8 | Review order | On checkout summary | Items, shipping, tax, total correct | [ ] |
| 6.4.9 | Place order | Tap "Place Order" | Payment processed, confirmation shown | [ ] |
| 6.4.10 | Order confirmation screen | After successful order | Order number, items, delivery estimate | [ ] |
| 6.4.11 | Order confirmation email | After successful order | Email received with order details | [ ] |
| 6.4.12 | Guest checkout | Checkout without account | Can complete purchase, prompted to create account | [ ] |

### 6.5 Order Management

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 6.5.1 | View order history | Profile > Orders | All orders listed chronologically | [ ] |
| 6.5.2 | View active orders | Tap "Active" tab | Only in-progress orders shown | [ ] |
| 6.5.3 | View completed orders | Tap "Completed" tab | Only delivered orders shown | [ ] |
| 6.5.4 | View order details | Tap on order | Full order info displayed | [ ] |
| 6.5.5 | Track order status | Tap "Track Order" | Status timeline shown | [ ] |
| 6.5.6 | View shipping info | On order details | Carrier, tracking number shown | [ ] |
| 6.5.7 | Open tracking link | Tap tracking number | Carrier's tracking page opens | [ ] |
| 6.5.8 | Cancel order | Tap "Cancel Order" (before shipped) | Order cancelled, refund initiated | [ ] |
| 6.5.9 | Cannot cancel shipped | Try cancel shipped order | "Cannot cancel shipped orders" message | [ ] |
| 6.5.10 | Reorder | Tap "Order Again" | Items added to cart | [ ] |
| 6.5.11 | Report order issue | Tap "Report Issue" | Issue form opens | [ ] |
| 6.5.12 | Rate product | Tap "Rate" on delivered order | Review form opens | [ ] |
| 6.5.13 | Empty order history | New user views orders | "No orders yet" message | [ ] |

### 6.6 Wishlists & Favorites

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 6.6.1 | Add to wishlist | Tap heart icon on product | Product added, heart filled | [ ] |
| 6.6.2 | Remove from wishlist | Tap filled heart | Product removed | [ ] |
| 6.6.3 | View wishlist | Profile > Wishlist | All saved products shown | [ ] |
| 6.6.4 | Add wishlist to cart | Tap "Add to Cart" on wishlist item | Item added to cart | [ ] |
| 6.6.5 | Share wishlist | Tap "Share" on wishlist | Share sheet opens | [ ] |
| 6.6.6 | Empty wishlist | Remove all items | "No saved products" message | [ ] |

---

## 7. Loyalty Program (Priority: MEDIUM)

### 7.1 Loyalty Enrollment

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 7.1.1 | View loyalty prompt | New user, first booking/purchase | "Join Loyalty Program" prompt | [ ] |
| 7.1.2 | Enroll in loyalty | Tap "Join Now" | Enrolled, welcome bonus shown | [ ] |
| 7.1.3 | Skip enrollment | Tap "Maybe Later" | Prompt dismissed, shown again later | [ ] |
| 7.1.4 | Enroll from profile | Profile > Join Loyalty | Enrolled successfully | [ ] |
| 7.1.5 | Already enrolled | Try to enroll again | "Already a member" message | [ ] |

### 7.2 Loyalty Status

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 7.2.1 | View loyalty dashboard | Profile > Loyalty | Dashboard with tier, points, rewards | [ ] |
| 7.2.2 | View current tier | On loyalty dashboard | Tier name and icon (Bronze/Silver/Gold/Platinum) | [ ] |
| 7.2.3 | View points balance | On loyalty dashboard | Current points prominently displayed | [ ] |
| 7.2.4 | View tier progress | On loyalty dashboard | Progress bar to next tier | [ ] |
| 7.2.5 | View tier benefits | Tap "View Benefits" | List of current tier perks | [ ] |
| 7.2.6 | View next tier benefits | Tap "Next Tier" | Preview of upgrade benefits | [ ] |
| 7.2.7 | Tier upgrade notification | Earn enough points | "Congratulations! You're now Silver" | [ ] |
| 7.2.8 | Tier downgrade warning | Points expiring | Warning about potential tier loss | [ ] |

### 7.3 Points Earning

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 7.3.1 | Earn points - booking | Complete appointment | Points credited (1 point per $1) | [ ] |
| 7.3.2 | Earn points - product purchase | Buy product | Points credited | [ ] |
| 7.3.3 | Bonus points - first booking | Complete first ever booking | 100 bonus points + base points | [ ] |
| 7.3.4 | Bonus points - birthday | Complete booking on birthday month | 2x points earned | [ ] |
| 7.3.5 | Bonus points - promotion | During promo period | Extra points as advertised | [ ] |
| 7.3.6 | Tier multiplier | Higher tier earns more | Silver: 1.25x, Gold: 1.5x, Platinum: 2x | [ ] |
| 7.3.7 | Points pending | After booking/purchase | Points show as "Pending" | [ ] |
| 7.3.8 | Points confirmed | After appointment completed | Points move to available balance | [ ] |
| 7.3.9 | View earning breakdown | Tap on transaction | Details of points calculation | [ ] |

### 7.4 Points History

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 7.4.1 | View all transactions | Loyalty > History | All point activities listed | [ ] |
| 7.4.2 | Filter by earned | Tap "Earned" tab | Only earning transactions | [ ] |
| 7.4.3 | Filter by redeemed | Tap "Redeemed" tab | Only redemption transactions | [ ] |
| 7.4.4 | Filter by expired | Tap "Expired" tab | Only expired points | [ ] |
| 7.4.5 | View transaction details | Tap on transaction | Full details: date, amount, source | [ ] |
| 7.4.6 | Pagination | Scroll to bottom | Older transactions load | [ ] |
| 7.4.7 | Empty history | New member views history | "No transactions yet" message | [ ] |

### 7.5 Rewards Catalog

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 7.5.1 | View available rewards | Loyalty > Rewards | All redeemable rewards listed | [ ] |
| 7.5.2 | View reward categories | Tap category filter | Rewards by type (Discounts, Free Items, Experiences) | [ ] |
| 7.5.3 | View reward details | Tap on reward | Description, points cost, terms | [ ] |
| 7.5.4 | Affordable rewards | Rewards user can afford | Highlighted or sorted first | [ ] |
| 7.5.5 | Unaffordable rewards | Rewards above balance | Shows "Need X more points" | [ ] |
| 7.5.6 | Limited time rewards | Special offers | "Ends in X days" countdown | [ ] |
| 7.5.7 | Out of stock reward | View unavailable reward | "Currently unavailable" message | [ ] |

### 7.6 Rewards Redemption

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 7.6.1 | Redeem discount reward | Tap "Redeem" on $10 off | Coupon code generated | [ ] |
| 7.6.2 | Redeem free service | Tap "Redeem" on free haircut | Voucher generated with code | [ ] |
| 7.6.3 | Insufficient points | Try redeem without enough | Error: "Need X more points" | [ ] |
| 7.6.4 | Confirm redemption | Confirm dialog | Points deducted, reward issued | [ ] |
| 7.6.5 | Cancel redemption | Tap "Cancel" on confirm | Returns to rewards list | [ ] |
| 7.6.6 | View redeemed rewards | My Rewards tab | All active rewards/vouchers | [ ] |
| 7.6.7 | Use reward at checkout | Select reward during booking | Discount applied automatically | [ ] |
| 7.6.8 | Reward expiration | View reward with expiry | Expiration date clearly shown | [ ] |
| 7.6.9 | Expired reward | View expired reward | Marked as expired, cannot use | [ ] |
| 7.6.10 | Reward usage history | View used rewards | Past redemptions with dates | [ ] |

### 7.7 Referral Program

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 7.7.1 | View referral section | Loyalty > Refer Friends | Referral info and code shown | [ ] |
| 7.7.2 | View unique referral code | On referral screen | Personal code displayed (e.g., "JOHN1234") | [ ] |
| 7.7.3 | Copy referral code | Tap "Copy" button | Code copied, "Copied!" confirmation | [ ] |
| 7.7.4 | Share referral link | Tap "Share" | Share sheet with pre-filled message | [ ] |
| 7.7.5 | Share via specific app | Select WhatsApp/SMS/Email | Opens app with referral message | [ ] |
| 7.7.6 | View referral stats | On referral screen | "X friends invited, Y signed up, Z points earned" | [ ] |
| 7.7.7 | New user enters code | During signup, enter referral code | Code accepted, both get credits | [ ] |
| 7.7.8 | Invalid referral code | Enter wrong code during signup | Error: "Invalid referral code" | [ ] |
| 7.7.9 | Own referral code | Try to use own code | Error: "Cannot use your own code" | [ ] |
| 7.7.10 | Referral reward - referrer | Friend completes first booking | Referrer gets 500 points | [ ] |
| 7.7.11 | Referral reward - referee | Complete first booking with code | New user gets 500 points | [ ] |
| 7.7.12 | Pending referral | Friend signed up but not booked | Shows as "Pending" in referral list | [ ] |
| 7.7.13 | Completed referral | Friend completed first booking | Shows as "Completed" with earned points | [ ] |
| 7.7.14 | Referral leaderboard | View top referrers | Leaderboard with rankings | [ ] |
| 7.7.15 | Referral limit | Exceed monthly referral limit | Message about limit reached | [ ] |

### 7.8 Points Expiration

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 7.8.1 | View expiring points | On loyalty dashboard | "X points expiring in Y days" | [ ] |
| 7.8.2 | Expiration warning | 30 days before expiry | Push notification about expiring points | [ ] |
| 7.8.3 | Points expired | After expiration date | Points removed from balance | [ ] |
| 7.8.4 | Extend expiration | Make qualifying purchase | Expiration extended by 12 months | [ ] |

---

## 8. Profile & Settings (Priority: MEDIUM) - 52 test cases

### 8.1 Profile Management

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 8.1.1 | View profile | Tap Profile tab | Profile info displayed with name, email, photo | [ ] |
| 8.1.2 | View profile sections | On profile screen | See Edit Profile, Settings, Payment Methods, Addresses, Notifications, Language, Help, Logout | [ ] |
| 8.1.3 | Edit name | Tap Edit > Change name > Save | Name updated, confirmation shown | [ ] |
| 8.1.4 | Edit email | Tap Edit > Change email > Save | Verification email sent, pending update | [ ] |
| 8.1.5 | Invalid email validation | Enter invalid email format | Error: "Invalid email format" | [ ] |
| 8.1.6 | Empty name validation | Clear name field, save | Error: "Name is required" | [ ] |
| 8.1.7 | Upload avatar from gallery | Tap avatar > Choose from Gallery | Photo picker opens | [ ] |
| 8.1.8 | Upload avatar from camera | Tap avatar > Take Photo | Camera opens | [ ] |
| 8.1.9 | Remove avatar | Tap avatar > Remove Photo > Confirm | Default avatar shown | [ ] |
| 8.1.10 | Avatar upload failure | Upload large file (>10MB) | Error: "File too large" | [ ] |
| 8.1.11 | Edit phone number | Tap Edit > Change phone > Save | Phone updated | [ ] |
| 8.1.12 | Invalid phone validation | Enter invalid phone format | Error: "Invalid phone number" | [ ] |

### 8.2 Notification Settings

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 8.2.1 | View notification settings | Profile > Notifications | All notification categories displayed | [ ] |
| 8.2.2 | Toggle booking reminders | Tap toggle for booking reminders | Setting saved | [ ] |
| 8.2.3 | Set reminder times | Select 24h, 1h, 15min options | Selected times saved | [ ] |
| 8.2.4 | Toggle chat notifications | Tap toggle for chat messages | Setting saved | [ ] |
| 8.2.5 | Configure chat preview | Set "Show message content" | Preview setting saved | [ ] |
| 8.2.6 | Toggle promotional notifications | Tap toggle for promotions | Setting saved | [ ] |
| 8.2.7 | Toggle order updates | Tap toggle for order updates | Setting saved | [ ] |
| 8.2.8 | Toggle loyalty notifications | Tap toggle for loyalty updates | Setting saved | [ ] |
| 8.2.9 | Set notification sound | Select different sound | Sound changed, preview plays | [ ] |
| 8.2.10 | Enable quiet hours | Toggle quiet hours, set times | Quiet hours enabled | [ ] |
| 8.2.11 | Disable all push notifications | Toggle master push switch OFF | All notifications disabled, warning shown | [ ] |
| 8.2.12 | Email notification settings | Configure email preferences | Email settings saved | [ ] |

### 8.3 Language Settings

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 8.3.1 | View language options | Profile > Language | English, Spanish, French displayed | [ ] |
| 8.3.2 | Change to Spanish | Select Spanish | App text changes to Spanish | [ ] |
| 8.3.3 | Change to French | Select French | App text changes to French | [ ] |
| 8.3.4 | Change back to English | Select English | App text changes to English | [ ] |
| 8.3.5 | Language persistence | Change language, restart app | Language setting persists | [ ] |

### 8.4 Privacy & Security Settings

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 8.4.1 | View privacy settings | Settings > Privacy | Privacy options displayed | [ ] |
| 8.4.2 | Change profile visibility | Set to Private | Profile hidden from public search | [ ] |
| 8.4.3 | Toggle online status | Turn off Show Online Status | Online status hidden | [ ] |
| 8.4.4 | Toggle analytics | Disable analytics | Analytics tracking disabled | [ ] |
| 8.4.5 | View security settings | Settings > Security | Security options displayed | [ ] |
| 8.4.6 | Change password - wrong current | Enter wrong current password | Error: "Current password is incorrect" | [ ] |
| 8.4.7 | Change password - success | Enter correct current, new valid password | Password updated | [ ] |
| 8.4.8 | Enable biometrics | Settings > Security > Biometrics | Biometric prompt, setting enabled | [ ] |
| 8.4.9 | View active sessions | Settings > Security > Active Sessions | List of logged in devices | [ ] |

### 8.5 Help & Support

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 8.5.1 | View help center | Profile > Help | Help options displayed | [ ] |
| 8.5.2 | Browse FAQ categories | Tap FAQ | Categories: Booking, Payments, Account | [ ] |
| 8.5.3 | Expand FAQ question | Tap on a question | Answer expands | [ ] |
| 8.5.4 | Contact via email | Help > Contact Us > Email | Email form opens | [ ] |
| 8.5.5 | Submit support request | Fill and submit form | "Message sent" confirmation | [ ] |
| 8.5.6 | Report a problem | Help > Report a Problem | Problem report form opens | [ ] |
| 8.5.7 | Submit problem report | Select type, describe, submit | "Report submitted" confirmation | [ ] |
| 8.5.8 | View Terms of Service | Help > Terms of Service | Terms document displayed | [ ] |
| 8.5.9 | View Privacy Policy | Help > Privacy Policy | Privacy policy displayed | [ ] |
| 8.5.10 | View app version | Settings > About | Version and build number shown | [ ] |

### 8.6 Address Management

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 8.6.1 | View addresses | Profile > Addresses | Address list displayed | [ ] |
| 8.6.2 | Add new address | Tap Add Address, fill form | Address saved | [ ] |
| 8.6.3 | Address validation | Leave required fields empty | Validation errors shown | [ ] |
| 8.6.4 | Edit address | Tap address, edit, save | Address updated | [ ] |
| 8.6.5 | Delete address | Swipe left > Delete > Confirm | Address removed | [ ] |
| 8.6.6 | Set default address | Tap "Set as Default" | Default badge shown | [ ] |

### 8.7 Account Deletion

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 8.7.1 | View delete account warning | Settings > Delete Account | Warning about permanent deletion | [ ] |
| 8.7.2 | Cancel deletion | Tap Cancel on warning | Returns to settings | [ ] |
| 8.7.3 | Delete without password | Tap Delete without entering password | Error: "Password required" | [ ] |
| 8.7.4 | Delete with wrong password | Enter wrong password | Error: "Incorrect password" | [ ] |

---

## 9. Push Notifications (Priority: HIGH) - 32 test cases

### 9.1 Notification Permission

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 9.1.1 | Permission prompt on first launch | Install and open app | Notification permission prompt appears | [ ] |
| 9.1.2 | Allow notifications | Tap Allow on prompt | Notifications enabled | [ ] |
| 9.1.3 | Deny notifications | Tap Deny on prompt | App works without notifications | [ ] |
| 9.1.4 | Enable later from settings | After denial, Settings > Notifications | Option to enable in device settings | [ ] |

### 9.2 Booking Notifications

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 9.2.1 | Booking confirmation notification | Complete a booking | "Booking Confirmed" notification received | [ ] |
| 9.2.2 | 24-hour reminder | Have booking 24 hours away | Reminder notification received | [ ] |
| 9.2.3 | 1-hour reminder | Have booking 1 hour away | Reminder notification received | [ ] |
| 9.2.4 | 15-minute reminder | Have booking 15 minutes away | Reminder notification received | [ ] |
| 9.2.5 | Booking cancelled notification | Barber cancels appointment | Cancellation notification received | [ ] |
| 9.2.6 | Booking rescheduled notification | Barber reschedules | Reschedule notification with new time | [ ] |

### 9.3 Chat Notifications

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 9.3.1 | New message - app foreground | Receive message while in app | In-app notification banner | [ ] |
| 9.3.2 | New message - app background | Receive message with app in background | Push notification received | [ ] |
| 9.3.3 | New message - app closed | Receive message with app closed | Push notification received | [ ] |
| 9.3.4 | Message preview | Receive message | Notification shows message content | [ ] |
| 9.3.5 | Hidden preview | Set "Hide all" preview | Notification shows "New message" only | [ ] |
| 9.3.6 | Muted conversation | Mute chat, receive message | No notification received | [ ] |

### 9.4 Order & Payment Notifications

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 9.4.1 | Order confirmed | Place product order | "Order Confirmed" notification | [ ] |
| 9.4.2 | Order shipped | Order ships | "Order Shipped" with tracking | [ ] |
| 9.4.3 | Order delivered | Order delivered | "Order Delivered" notification | [ ] |
| 9.4.4 | Payment received | Complete payment | "Payment Successful" notification | [ ] |
| 9.4.5 | Refund processed | Refund completes | "Refund Processed" notification | [ ] |

### 9.5 Loyalty Notifications

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 9.5.1 | Points earned | Complete booking | "Points Earned" notification | [ ] |
| 9.5.2 | Tier upgrade | Reach new tier threshold | "Congratulations! New Tier" notification | [ ] |
| 9.5.3 | Points expiring warning | Points expiring in 30 days | "Points Expiring" warning notification | [ ] |
| 9.5.4 | New reward available | New reward in catalog | "New Reward Available" notification | [ ] |

### 9.6 Promotional Notifications

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 9.6.1 | Promotional offer | Admin sends promo | Promotional notification received | [ ] |
| 9.6.2 | Disabled promotional | Disable promos in settings | No promotional notifications | [ ] |

### 9.7 Deep Linking from Notifications

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 9.7.1 | Tap booking notification | Tap booking reminder | Opens appointment details | [ ] |
| 9.7.2 | Tap chat notification | Tap message notification | Opens chat conversation | [ ] |
| 9.7.3 | Tap order notification | Tap order update notification | Opens order details | [ ] |
| 9.7.4 | Tap promo notification | Tap promotional notification | Opens promotion/offer screen | [ ] |
| 9.7.5 | Invalid deep link | Tap notification with bad link | Graceful error, opens home | [ ] |

---

## 10. Offline & Performance (Priority: MEDIUM) - 24 test cases

### 10.1 Offline Indicator

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 10.1.1 | Show offline banner | Turn off network | Offline banner appears at top | [ ] |
| 10.1.2 | Hide offline banner | Restore network | Banner disappears | [ ] |
| 10.1.3 | Offline icon | In offline mode | Offline icon in header | [ ] |

### 10.2 Cached Content

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 10.2.1 | View cached barbers | Go offline, view barber list | Previously loaded barbers visible | [ ] |
| 10.2.2 | View cached appointments | Go offline, view appointments | Previously loaded appointments visible | [ ] |
| 10.2.3 | View cached profile | Go offline, view profile | Profile data visible | [ ] |
| 10.2.4 | View cached chat history | Go offline, open chat | Previous messages visible | [ ] |
| 10.2.5 | View cached products | Go offline, open shop | Previously loaded products visible | [ ] |
| 10.2.6 | Cached images | Go offline, scroll content | Previously loaded images display | [ ] |

### 10.3 Offline Actions

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 10.3.1 | Queue booking offline | Try to book while offline | Action queued, pending indicator | [ ] |
| 10.3.2 | Queue message offline | Send message while offline | Message queued with pending icon | [ ] |
| 10.3.3 | Queue profile update | Edit profile while offline | Changes queued | [ ] |
| 10.3.4 | Offline action feedback | Perform action offline | "Will sync when online" message | [ ] |

### 10.4 Reconnection Sync

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 10.4.1 | Sync queued booking | Restore network after queueing | Booking syncs, confirmation shown | [ ] |
| 10.4.2 | Sync queued messages | Restore network | Messages sent, delivered indicators | [ ] |
| 10.4.3 | Sync conflict resolution | Conflicting changes while offline | Conflict handled gracefully | [ ] |
| 10.4.4 | Auto-retry failed requests | Network restored | Failed requests automatically retry | [ ] |

### 10.5 Performance Metrics

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 10.5.1 | Cold start time | Force quit, launch app | App usable in <3 seconds | [ ] |
| 10.5.2 | Hot start time | Background, resume app | App ready in <1 second | [ ] |
| 10.5.3 | Smooth scrolling | Scroll barber list quickly | 60fps, no dropped frames | [ ] |
| 10.5.4 | Large list performance | Scroll 100+ items | Smooth, no lag | [ ] |
| 10.5.5 | Image loading speed | View barber gallery | Images load progressively | [ ] |
| 10.5.6 | Memory stability | Use app for 15+ minutes | No crashes, stable memory | [ ] |
| 10.5.7 | Background memory | App in background 10+ minutes | No excessive memory growth | [ ] |

---

## 11. Barber App Features (Priority: HIGH) - 67 test cases

### 11.1 Barber Authentication

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 11.1.1 | Login as barber | Enter barber credentials, login | Barber dashboard shown | [ ] |
| 11.1.2 | Invalid barber login | Enter wrong credentials | Error: "Invalid credentials" | [ ] |
| 11.1.3 | Barber dashboard elements | After login | Today's Appointments, Earnings, Quick Actions visible | [ ] |
| 11.1.4 | Barber navigation | View bottom tabs | Dashboard, Appointments, Earnings, Reviews, Profile | [ ] |

### 11.2 View Appointments

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 11.2.1 | View today's appointments | Tap Today tab | Today's schedule listed | [ ] |
| 11.2.2 | View upcoming appointments | Tap Upcoming tab | Future appointments listed | [ ] |
| 11.2.3 | View past appointments | Tap Past tab | Completed appointments listed | [ ] |
| 11.2.4 | Appointment details | Tap an appointment | Client, service, date, time shown | [ ] |
| 11.2.5 | Empty today state | No appointments today | "No appointments today" message | [ ] |
| 11.2.6 | Pull to refresh | Pull down on list | Appointments refreshed | [ ] |

### 11.3 Accept/Decline Appointments

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 11.3.1 | View pending appointment | On pending appointment | Accept and Decline buttons visible | [ ] |
| 11.3.2 | Accept appointment | Tap Accept | Status changes to Confirmed | [ ] |
| 11.3.3 | Accept confirmation | After accepting | "Appointment confirmed" message | [ ] |
| 11.3.4 | Client notification on accept | Accept appointment | Client receives confirmation notification | [ ] |
| 11.3.5 | Decline appointment | Tap Decline | Decline reason dialog opens | [ ] |
| 11.3.6 | Decline with reason | Enter reason, confirm | Appointment declined | [ ] |
| 11.3.7 | Client notification on decline | Decline appointment | Client receives decline notification with reason | [ ] |

### 11.4 Complete Appointments

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 11.4.1 | Mark as complete | Tap "Mark Complete" | Completion dialog opens | [ ] |
| 11.4.2 | Add completion notes | Enter notes, complete | Notes saved with appointment | [ ] |
| 11.4.3 | Complete confirmation | After completing | "Appointment completed" message | [ ] |
| 11.4.4 | Review request sent | After completing | Client receives review request | [ ] |
| 11.4.5 | Loyalty points awarded | After completing | Client receives loyalty points | [ ] |
| 11.4.6 | Mark as no-show | Tap "No Show" | No-show dialog opens | [ ] |
| 11.4.7 | Confirm no-show | Confirm no-show | Recorded in history | [ ] |

### 11.5 View Earnings

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 11.5.1 | View earnings dashboard | Tap Earnings | Earnings stats displayed | [ ] |
| 11.5.2 | Today's earnings | Tap Today | Today's earnings shown | [ ] |
| 11.5.3 | Weekly earnings | Tap This Week | Weekly earnings shown | [ ] |
| 11.5.4 | Monthly earnings | Tap This Month | Monthly earnings shown | [ ] |
| 11.5.5 | All-time earnings | Tap All Time | Total earnings shown | [ ] |
| 11.5.6 | Earnings breakdown | View breakdown | Gross, Platform Fee, Net visible | [ ] |
| 11.5.7 | View payout history | Scroll to Payout History | Past payouts listed | [ ] |
| 11.5.8 | Payout details | Tap on payout | Amount, Date, Bank Account shown | [ ] |
| 11.5.9 | Request payout | Tap Request Payout | Payout request form opens | [ ] |
| 11.5.10 | Submit payout request | Enter amount, submit | Payout requested, pending status | [ ] |
| 11.5.11 | Insufficient balance | Request more than balance | Error: "Insufficient balance" | [ ] |
| 11.5.12 | Export earnings report | Tap Export > PDF/CSV | Report downloaded | [ ] |

### 11.6 Manage Availability

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 11.6.1 | View weekly schedule | Tap Availability | Weekly calendar shown | [ ] |
| 11.6.2 | Set working hours | Tap day, set hours | Hours saved | [ ] |
| 11.6.3 | Set start time | Edit start time | Start time updated | [ ] |
| 11.6.4 | Set end time | Edit end time | End time updated | [ ] |
| 11.6.5 | Set day off | Toggle Day Off | Day marked as off | [ ] |
| 11.6.6 | Add break time | Tap Add Break, set times | Break added to schedule | [ ] |
| 11.6.7 | Remove break | Tap remove on break | Break removed | [ ] |
| 11.6.8 | Block specific time | Tap Block Time, select date/time | Time blocked | [ ] |
| 11.6.9 | Block with reason | Add reason for blocked time | Reason saved | [ ] |
| 11.6.10 | Set vacation | Tap Set Vacation, select dates | Vacation period blocked | [ ] |
| 11.6.11 | Vacation conflict warning | Set vacation with existing bookings | Warning about affected bookings | [ ] |

### 11.7 Manage Services

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 11.7.1 | View services list | Tap Manage Services | All services listed | [ ] |
| 11.7.2 | Add new service | Tap Add Service | Service form opens | [ ] |
| 11.7.3 | Fill service details | Enter name, description, duration, price | All fields filled | [ ] |
| 11.7.4 | Select service category | Choose category | Category selected | [ ] |
| 11.7.5 | Save new service | Tap Save Service | Service added to list | [ ] |
| 11.7.6 | Service validation | Leave required fields empty | Validation errors shown | [ ] |
| 11.7.7 | Edit existing service | Tap service, edit | Edit form opens with data | [ ] |
| 11.7.8 | Update service price | Change price, save | Price updated | [ ] |
| 11.7.9 | Disable service | Toggle service off | Service hidden from clients | [ ] |
| 11.7.10 | Re-enable service | Toggle service on | Service visible to clients | [ ] |
| 11.7.11 | Delete service | Swipe, tap Delete | Service removed | [ ] |
| 11.7.12 | Delete confirmation | On delete | "Are you sure?" prompt | [ ] |

### 11.8 View Reviews

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 11.8.1 | View reviews | Tap Reviews | Reviews screen with stats | [ ] |
| 11.8.2 | Average rating display | On reviews screen | Average rating prominently shown | [ ] |
| 11.8.3 | Rating breakdown | On reviews screen | 5-star to 1-star breakdown | [ ] |
| 11.8.4 | Total reviews count | On reviews screen | Total review count shown | [ ] |
| 11.8.5 | Individual review | Scroll reviews | Rating, comment, date, client visible | [ ] |
| 11.8.6 | Filter by rating | Tap Filter > 5 stars | Only 5-star reviews shown | [ ] |
| 11.8.7 | Filter needs reply | Tap Filter > Needs Reply | Only unreplied reviews shown | [ ] |
| 11.8.8 | Sort by rating | Tap Sort > Lowest Rated | Sorted by rating ascending | [ ] |
| 11.8.9 | Sort by date | Tap Sort > Most Recent | Sorted by date descending | [ ] |

### 11.9 Reply to Reviews

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 11.9.1 | Reply to review | Tap Reply on review | Reply form opens | [ ] |
| 11.9.2 | Enter reply | Type response | Text entered | [ ] |
| 11.9.3 | Post reply | Tap Post Reply | Reply saved, visible on review | [ ] |
| 11.9.4 | Empty reply validation | Submit empty reply | Error: "Reply cannot be empty" | [ ] |
| 11.9.5 | Edit existing reply | Tap Edit Reply | Edit form opens | [ ] |
| 11.9.6 | Update reply | Change text, save | Reply updated | [ ] |
| 11.9.7 | Delete reply | Tap Delete Reply | Reply removed | [ ] |
| 11.9.8 | Reply notification | Post reply | Client receives notification | [ ] |

---

## 12. Deep Linking (Priority: LOW)

### 12.1 Link Handling

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 12.1.1 | Barber profile link | Open cloudclips://barber/123 | Opens barber profile | [ ] |
| 12.1.2 | Booking link | Open cloudclips://booking/456 | Opens booking details | [ ] |
| 12.1.3 | Order link | Open cloudclips://order/789 | Opens order details | [ ] |
| 12.1.4 | Invalid link | Open invalid deep link | Graceful error/fallback | [ ] |

---

## Testing Environments

### Required Devices/Simulators

- [ ] iOS Simulator (iPhone 15 Pro)
- [ ] iOS Physical Device (iPhone 12 or newer)
- [ ] Android Emulator (Pixel 7, API 33+)
- [ ] Android Physical Device (various manufacturers)

### Environment Checklist

| Environment | API URL | Status |
|-------------|---------|--------|
| Development | http://localhost:8080 | [ ] |
| Staging | https://staging-api.cloudclips.com | [ ] |
| Production | https://api.cloudclips.com | [ ] |

---

## Test Data

### Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Client | client@test.com | Test123!@# | Standard client user |
| Barber | barber@test.com | Test123!@# | Verified barber |
| Admin | admin@test.com | Admin123!@# | Admin access |

### Test Cards (Stripe)

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 3220 | 3D Secure required |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 0002 | Generic decline |

### Test Coupon Codes

| Code | Discount | Conditions |
|------|----------|------------|
| FIRST10 | 10% off | First booking only |
| SUMMER20 | 20% off | Min $50 purchase |
| FREESHIP | Free shipping | Product orders only |

---

## Bug Reporting

When a test fails, create a bug report with:

1. **Test Case ID**: e.g., 1.2.3
2. **Environment**: Device, OS version, app version
3. **Steps to Reproduce**: Exact steps taken
4. **Expected Result**: What should happen
5. **Actual Result**: What actually happened
6. **Screenshots/Videos**: Attach if applicable
7. **Logs**: Any relevant console logs

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Dec 3, 2025 | Cloud Clips Team | Initial checklist |
| 1.1.0 | Dec 3, 2025 | Cloud Clips Team | Phase 32.4 - Expanded Payment (31 cases), Chat (33 cases), Products (61 cases), Loyalty (57 cases) |
| 1.2.0 | Dec 3, 2025 | Cloud Clips Team | Phase 32.5 - Expanded Profile & Settings (52 cases), Push Notifications (32 cases), Offline & Performance (24 cases), Barber App Features (67 cases) |
