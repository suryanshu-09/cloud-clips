package services

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/account"
	"github.com/stripe/stripe-go/v76/accountlink"
	"github.com/stripe/stripe-go/v76/balancetransaction"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/loginlink"
	"github.com/stripe/stripe-go/v76/paymentintent"
	"github.com/stripe/stripe-go/v76/paymentmethod"
	"github.com/stripe/stripe-go/v76/payout"
	"github.com/stripe/stripe-go/v76/refund"
	"github.com/stripe/stripe-go/v76/transfer"
	"github.com/stripe/stripe-go/v76/transferreversal"
)

// StripeService handles all Stripe payment operations
type StripeService struct {
	secretKey       string
	webhookSecret   string
	connectClientID string
	platformFee     float64 // Platform commission percentage (e.g., 0.15 for 15%)
}

// NewStripeService creates a new Stripe service instance
func NewStripeService(secretKey, webhookSecret string) *StripeService {
	stripe.Key = secretKey

	// Get platform fee from environment, default to 15%
	platformFee := 0.15
	if feeStr := os.Getenv("PLATFORM_FEE_PERCENT"); feeStr != "" {
		if _, err := fmt.Sscanf(feeStr, "%f", &platformFee); err == nil {
			platformFee = platformFee / 100 // Convert from percentage to decimal
		}
	}

	return &StripeService{
		secretKey:       secretKey,
		webhookSecret:   webhookSecret,
		connectClientID: os.Getenv("STRIPE_CONNECT_CLIENT_ID"),
		platformFee:     platformFee,
	}
}

// IsConfigured returns true if Stripe is properly configured
func (s *StripeService) IsConfigured() bool {
	return s.secretKey != ""
}

// GetWebhookSecret returns the webhook signing secret
func (s *StripeService) GetWebhookSecret() string {
	return s.webhookSecret
}

// CreateCustomer creates a new Stripe customer
func (s *StripeService) CreateCustomer(ctx context.Context, email, name string, metadata map[string]string) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		Email: stripe.String(email),
		Name:  stripe.String(name),
	}

	if metadata != nil {
		for key, value := range metadata {
			params.AddMetadata(key, value)
		}
	}

	return customer.New(params)
}

// GetCustomer retrieves a customer by ID
func (s *StripeService) GetCustomer(ctx context.Context, customerID string) (*stripe.Customer, error) {
	return customer.Get(customerID, nil)
}

// UpdateCustomer updates a customer's information
func (s *StripeService) UpdateCustomer(ctx context.Context, customerID, email, name string) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{}
	if email != "" {
		params.Email = stripe.String(email)
	}
	if name != "" {
		params.Name = stripe.String(name)
	}
	return customer.Update(customerID, params)
}

// CreatePaymentIntentParams holds parameters for creating a payment intent
type CreatePaymentIntentParams struct {
	Amount        int64
	Currency      string
	CustomerID    string
	PaymentMethod string
	Description   string
	Metadata      map[string]string
}

// CreatePaymentIntent creates a new payment intent
func (s *StripeService) CreatePaymentIntent(ctx context.Context, params CreatePaymentIntentParams) (*stripe.PaymentIntent, error) {
	piParams := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(params.Amount),
		Currency: stripe.String(params.Currency),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
	}

	if params.CustomerID != "" {
		piParams.Customer = stripe.String(params.CustomerID)
	}

	if params.PaymentMethod != "" {
		piParams.PaymentMethod = stripe.String(params.PaymentMethod)
	}

	if params.Description != "" {
		piParams.Description = stripe.String(params.Description)
	}

	if params.Metadata != nil {
		for key, value := range params.Metadata {
			piParams.AddMetadata(key, value)
		}
	}

	return paymentintent.New(piParams)
}

// GetPaymentIntent retrieves a payment intent by ID
func (s *StripeService) GetPaymentIntent(ctx context.Context, intentID string) (*stripe.PaymentIntent, error) {
	return paymentintent.Get(intentID, nil)
}

// ConfirmPaymentIntent confirms a payment intent
func (s *StripeService) ConfirmPaymentIntent(ctx context.Context, intentID string, paymentMethodID string) (*stripe.PaymentIntent, error) {
	params := &stripe.PaymentIntentConfirmParams{}
	if paymentMethodID != "" {
		params.PaymentMethod = stripe.String(paymentMethodID)
	}
	return paymentintent.Confirm(intentID, params)
}

// CancelPaymentIntent cancels a payment intent
func (s *StripeService) CancelPaymentIntent(ctx context.Context, intentID string) (*stripe.PaymentIntent, error) {
	return paymentintent.Cancel(intentID, nil)
}

// AttachPaymentMethod attaches a payment method to a customer
func (s *StripeService) AttachPaymentMethod(ctx context.Context, paymentMethodID, customerID string) (*stripe.PaymentMethod, error) {
	params := &stripe.PaymentMethodAttachParams{
		Customer: stripe.String(customerID),
	}
	return paymentmethod.Attach(paymentMethodID, params)
}

// DetachPaymentMethod detaches a payment method from a customer
func (s *StripeService) DetachPaymentMethod(ctx context.Context, paymentMethodID string) (*stripe.PaymentMethod, error) {
	return paymentmethod.Detach(paymentMethodID, nil)
}

// GetPaymentMethod retrieves a payment method by ID
func (s *StripeService) GetPaymentMethod(ctx context.Context, paymentMethodID string) (*stripe.PaymentMethod, error) {
	return paymentmethod.Get(paymentMethodID, nil)
}

// ListPaymentMethods lists all payment methods for a customer
func (s *StripeService) ListPaymentMethods(ctx context.Context, customerID string, methodType string) ([]*stripe.PaymentMethod, error) {
	if methodType == "" {
		methodType = "card"
	}

	params := &stripe.PaymentMethodListParams{
		Customer: stripe.String(customerID),
		Type:     stripe.String(methodType),
	}

	var methods []*stripe.PaymentMethod
	iter := paymentmethod.List(params)
	for iter.Next() {
		methods = append(methods, iter.PaymentMethod())
	}

	if err := iter.Err(); err != nil {
		return nil, err
	}

	return methods, nil
}

// SetDefaultPaymentMethod sets the default payment method for a customer
func (s *StripeService) SetDefaultPaymentMethod(ctx context.Context, customerID, paymentMethodID string) (*stripe.Customer, error) {
	params := &stripe.CustomerParams{
		InvoiceSettings: &stripe.CustomerInvoiceSettingsParams{
			DefaultPaymentMethod: stripe.String(paymentMethodID),
		},
	}
	return customer.Update(customerID, params)
}

// CreateRefundParams holds parameters for creating a refund
type CreateRefundParams struct {
	PaymentIntentID string
	Amount          int64 // 0 for full refund
	Reason          string
	Metadata        map[string]string
}

// CreateRefund creates a refund for a payment
func (s *StripeService) CreateRefund(ctx context.Context, params CreateRefundParams) (*stripe.Refund, error) {
	refundParams := &stripe.RefundParams{
		PaymentIntent: stripe.String(params.PaymentIntentID),
	}

	if params.Amount > 0 {
		refundParams.Amount = stripe.Int64(params.Amount)
	}

	if params.Reason != "" {
		// Stripe only accepts: duplicate, fraudulent, requested_by_customer
		switch params.Reason {
		case "duplicate", "fraudulent", "requested_by_customer":
			refundParams.Reason = stripe.String(params.Reason)
		default:
			refundParams.Reason = stripe.String("requested_by_customer")
		}
	}

	if params.Metadata != nil {
		for key, value := range params.Metadata {
			refundParams.AddMetadata(key, value)
		}
	}

	return refund.New(refundParams)
}

// GetRefund retrieves a refund by ID
func (s *StripeService) GetRefund(ctx context.Context, refundID string) (*stripe.Refund, error) {
	return refund.Get(refundID, nil)
}

// CalculateApplicationFee calculates the platform fee for a payment
func (s *StripeService) CalculateApplicationFee(amount int64, feePercent float64) int64 {
	return int64(float64(amount) * feePercent / 100)
}

// FormatAmount formats an amount in cents to a human-readable string
func (s *StripeService) FormatAmount(amount int64, currency string) string {
	dollars := float64(amount) / 100
	return fmt.Sprintf("%.2f %s", dollars, currency)
}

// ValidateCardDetails performs basic validation on card details
func ValidateCardDetails(cardNumber, expMonth, expYear, cvc string) error {
	if len(cardNumber) < 13 || len(cardNumber) > 19 {
		return fmt.Errorf("invalid card number length")
	}
	if len(cvc) < 3 || len(cvc) > 4 {
		return fmt.Errorf("invalid CVC length")
	}
	// Additional validation would be handled by Stripe
	return nil
}

// ============================================
// STRIPE CONNECT - Barber Payout Methods
// ============================================

// GetPlatformFee returns the configured platform fee percentage
func (s *StripeService) GetPlatformFee() float64 {
	return s.platformFee
}

// ConnectAccountStatus represents the status of a Stripe Connect account
type ConnectAccountStatus struct {
	AccountID        string    `json:"accountId"`
	DetailsSubmitted bool      `json:"detailsSubmitted"`
	ChargesEnabled   bool      `json:"chargesEnabled"`
	PayoutsEnabled   bool      `json:"payoutsEnabled"`
	Requirements     []string  `json:"requirements"`
	CreatedAt        time.Time `json:"createdAt"`
}

// CreateConnectAccountParams holds parameters for creating a Connect account
type CreateConnectAccountParams struct {
	Email        string
	BusinessName string
	FirstName    string
	LastName     string
	Country      string
	Metadata     map[string]string
}

// CreateConnectAccount creates a Stripe Connect Express account for a barber
func (s *StripeService) CreateConnectAccount(ctx context.Context, params CreateConnectAccountParams) (*stripe.Account, error) {
	country := params.Country
	if country == "" {
		country = "US"
	}

	accountParams := &stripe.AccountParams{
		Type:    stripe.String(string(stripe.AccountTypeExpress)),
		Country: stripe.String(country),
		Email:   stripe.String(params.Email),
		Capabilities: &stripe.AccountCapabilitiesParams{
			CardPayments: &stripe.AccountCapabilitiesCardPaymentsParams{
				Requested: stripe.Bool(true),
			},
			Transfers: &stripe.AccountCapabilitiesTransfersParams{
				Requested: stripe.Bool(true),
			},
		},
		BusinessType: stripe.String("individual"),
		BusinessProfile: &stripe.AccountBusinessProfileParams{
			Name: stripe.String(params.BusinessName),
			MCC:  stripe.String("7230"), // Barber and beauty shops
		},
	}

	// Add individual info if provided
	if params.FirstName != "" || params.LastName != "" {
		accountParams.Individual = &stripe.PersonParams{
			FirstName: stripe.String(params.FirstName),
			LastName:  stripe.String(params.LastName),
			Email:     stripe.String(params.Email),
		}
	}

	// Add metadata
	if params.Metadata != nil {
		for key, value := range params.Metadata {
			accountParams.AddMetadata(key, value)
		}
	}

	return account.New(accountParams)
}

// GetConnectAccount retrieves a Connect account by ID
func (s *StripeService) GetConnectAccount(ctx context.Context, accountID string) (*stripe.Account, error) {
	return account.GetByID(accountID, nil)
}

// GetConnectAccountStatus retrieves the status of a Connect account
func (s *StripeService) GetConnectAccountStatus(ctx context.Context, accountID string) (*ConnectAccountStatus, error) {
	acc, err := account.GetByID(accountID, nil)
	if err != nil {
		return nil, err
	}

	// Get pending requirements
	var requirements []string
	if acc.Requirements != nil {
		requirements = append(requirements, acc.Requirements.CurrentlyDue...)
		requirements = append(requirements, acc.Requirements.EventuallyDue...)
	}

	return &ConnectAccountStatus{
		AccountID:        acc.ID,
		DetailsSubmitted: acc.DetailsSubmitted,
		ChargesEnabled:   acc.ChargesEnabled,
		PayoutsEnabled:   acc.PayoutsEnabled,
		Requirements:     requirements,
		CreatedAt:        time.Unix(acc.Created, 0),
	}, nil
}

// CreateAccountLinkParams holds parameters for creating an account link
type CreateAccountLinkParams struct {
	AccountID  string
	RefreshURL string
	ReturnURL  string
	Type       string // "account_onboarding" or "account_update"
}

// CreateAccountLink creates an onboarding link for a Connect account
func (s *StripeService) CreateAccountLink(ctx context.Context, params CreateAccountLinkParams) (*stripe.AccountLink, error) {
	linkType := params.Type
	if linkType == "" {
		linkType = "account_onboarding"
	}

	linkParams := &stripe.AccountLinkParams{
		Account:    stripe.String(params.AccountID),
		RefreshURL: stripe.String(params.RefreshURL),
		ReturnURL:  stripe.String(params.ReturnURL),
		Type:       stripe.String(linkType),
	}

	return accountlink.New(linkParams)
}

// CreateLoginLink creates a login link for a Connect account to access Stripe Express Dashboard
func (s *StripeService) CreateLoginLink(ctx context.Context, accountID string) (*stripe.LoginLink, error) {
	params := &stripe.LoginLinkParams{
		Account: stripe.String(accountID),
	}
	return loginlink.New(params)
}

// DeleteConnectAccount deletes (deauthorizes) a Connect account
func (s *StripeService) DeleteConnectAccount(ctx context.Context, accountID string) error {
	_, err := account.Del(accountID, nil)
	return err
}

// CreatePaymentIntentWithConnectParams holds parameters for payment intent with Connect
type CreatePaymentIntentWithConnectParams struct {
	Amount               int64
	Currency             string
	CustomerID           string
	ConnectedAccountID   string
	ApplicationFeeAmount int64 // Platform fee in cents
	Description          string
	Metadata             map[string]string
}

// CreatePaymentIntentWithConnect creates a payment intent with automatic transfer to connected account
func (s *StripeService) CreatePaymentIntentWithConnect(ctx context.Context, params CreatePaymentIntentWithConnectParams) (*stripe.PaymentIntent, error) {
	// Calculate application fee if not provided
	applicationFee := params.ApplicationFeeAmount
	if applicationFee == 0 {
		applicationFee = int64(float64(params.Amount) * s.platformFee)
	}

	piParams := &stripe.PaymentIntentParams{
		Amount:   stripe.Int64(params.Amount),
		Currency: stripe.String(params.Currency),
		AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
			Enabled: stripe.Bool(true),
		},
		ApplicationFeeAmount: stripe.Int64(applicationFee),
		TransferData: &stripe.PaymentIntentTransferDataParams{
			Destination: stripe.String(params.ConnectedAccountID),
		},
	}

	if params.CustomerID != "" {
		piParams.Customer = stripe.String(params.CustomerID)
	}

	if params.Description != "" {
		piParams.Description = stripe.String(params.Description)
	}

	if params.Metadata != nil {
		for key, value := range params.Metadata {
			piParams.AddMetadata(key, value)
		}
	}

	return paymentintent.New(piParams)
}

// CreateTransferParams holds parameters for creating a transfer
type CreateTransferParams struct {
	Amount             int64
	Currency           string
	DestinationAccount string
	Description        string
	SourceTransaction  string // Charge ID to transfer from
	Metadata           map[string]string
}

// CreateTransfer creates a manual transfer to a connected account
func (s *StripeService) CreateTransfer(ctx context.Context, params CreateTransferParams) (*stripe.Transfer, error) {
	transferParams := &stripe.TransferParams{
		Amount:      stripe.Int64(params.Amount),
		Currency:    stripe.String(params.Currency),
		Destination: stripe.String(params.DestinationAccount),
	}

	if params.Description != "" {
		transferParams.Description = stripe.String(params.Description)
	}

	if params.SourceTransaction != "" {
		transferParams.SourceTransaction = stripe.String(params.SourceTransaction)
	}

	if params.Metadata != nil {
		for key, value := range params.Metadata {
			transferParams.AddMetadata(key, value)
		}
	}

	return transfer.New(transferParams)
}

// ReverseTransfer reverses (refunds) a transfer to a connected account
func (s *StripeService) ReverseTransfer(ctx context.Context, transferID string, amount int64) (*stripe.TransferReversal, error) {
	params := &stripe.TransferReversalParams{
		ID: stripe.String(transferID),
	}
	if amount > 0 {
		params.Amount = stripe.Int64(amount)
	}
	return transferreversal.New(params)
}

// GetTransfer retrieves a transfer by ID
func (s *StripeService) GetTransfer(ctx context.Context, transferID string) (*stripe.Transfer, error) {
	return transfer.Get(transferID, nil)
}

// BarberEarnings represents earnings summary for a barber
type BarberEarnings struct {
	AccountID        string     `json:"accountId"`
	AvailableBalance int64      `json:"availableBalance"`
	PendingBalance   int64      `json:"pendingBalance"`
	TotalEarnings    int64      `json:"totalEarnings"`
	PlatformFees     int64      `json:"platformFees"`
	NetEarnings      int64      `json:"netEarnings"`
	Currency         string     `json:"currency"`
	PayoutsEnabled   bool       `json:"payoutsEnabled"`
	NextPayoutDate   *time.Time `json:"nextPayoutDate,omitempty"`
}

// GetBarberBalance retrieves the balance for a connected account
func (s *StripeService) GetBarberBalance(ctx context.Context, accountID string) (*BarberEarnings, error) {
	// Get account info for payout status
	acc, err := account.GetByID(accountID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get account: %w", err)
	}

	earnings := &BarberEarnings{
		AccountID:      accountID,
		Currency:       "usd",
		PayoutsEnabled: acc.PayoutsEnabled,
	}

	return earnings, nil
}

// ListBalanceTransactionsParams holds parameters for listing balance transactions
type ListBalanceTransactionsParams struct {
	AccountID string
	Limit     int64
	StartDate time.Time
	EndDate   time.Time
	Type      string // "charge", "transfer", "payout", etc.
}

// BalanceTransactionItem represents a balance transaction
type BalanceTransactionItem struct {
	ID          string    `json:"id"`
	Amount      int64     `json:"amount"`
	Net         int64     `json:"net"`
	Fee         int64     `json:"fee"`
	Currency    string    `json:"currency"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

// ListBalanceTransactions lists balance transactions for a connected account
func (s *StripeService) ListBalanceTransactions(ctx context.Context, params ListBalanceTransactionsParams) ([]*BalanceTransactionItem, error) {
	limit := params.Limit
	if limit == 0 {
		limit = 25
	}

	listParams := &stripe.BalanceTransactionListParams{}
	listParams.Limit = stripe.Int64(limit)
	listParams.SetStripeAccount(params.AccountID)

	// Note: Date filtering would need to be done post-fetch or using different params
	// The Stripe Go SDK v76 uses different patterns for date filtering

	if params.Type != "" {
		listParams.Type = stripe.String(params.Type)
	}

	var transactions []*BalanceTransactionItem
	iter := balancetransaction.List(listParams)
	for iter.Next() {
		bt := iter.BalanceTransaction()

		// Apply date filters locally if needed
		createdAt := time.Unix(bt.Created, 0)
		if !params.StartDate.IsZero() && createdAt.Before(params.StartDate) {
			continue
		}
		if !params.EndDate.IsZero() && createdAt.After(params.EndDate) {
			continue
		}

		transactions = append(transactions, &BalanceTransactionItem{
			ID:          bt.ID,
			Amount:      bt.Amount,
			Net:         bt.Net,
			Fee:         bt.Fee,
			Currency:    string(bt.Currency),
			Type:        string(bt.Type),
			Description: bt.Description,
			Status:      string(bt.Status),
			CreatedAt:   createdAt,
		})
	}

	if err := iter.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

// CreatePayoutParams holds parameters for creating a payout
type CreatePayoutParams struct {
	AccountID   string
	Amount      int64
	Currency    string
	Description string
	Metadata    map[string]string
}

// CreatePayout creates a payout to a connected account's bank
func (s *StripeService) CreatePayout(ctx context.Context, params CreatePayoutParams) (*stripe.Payout, error) {
	payoutParams := &stripe.PayoutParams{
		Amount:   stripe.Int64(params.Amount),
		Currency: stripe.String(params.Currency),
	}
	payoutParams.SetStripeAccount(params.AccountID)

	if params.Description != "" {
		payoutParams.Description = stripe.String(params.Description)
	}

	if params.Metadata != nil {
		for key, value := range params.Metadata {
			payoutParams.AddMetadata(key, value)
		}
	}

	return payout.New(payoutParams)
}

// ListPayoutsParams holds parameters for listing payouts
type ListPayoutsParams struct {
	AccountID string
	Limit     int64
	Status    string // "pending", "paid", "failed", "canceled"
}

// PayoutItem represents a payout
type PayoutItem struct {
	ID          string    `json:"id"`
	Amount      int64     `json:"amount"`
	Currency    string    `json:"currency"`
	Status      string    `json:"status"`
	ArrivalDate time.Time `json:"arrivalDate"`
	CreatedAt   time.Time `json:"createdAt"`
}

// ListPayouts lists payouts for a connected account
func (s *StripeService) ListPayouts(ctx context.Context, params ListPayoutsParams) ([]*PayoutItem, error) {
	limit := params.Limit
	if limit == 0 {
		limit = 25
	}

	listParams := &stripe.PayoutListParams{}
	listParams.Limit = stripe.Int64(limit)
	listParams.SetStripeAccount(params.AccountID)

	if params.Status != "" {
		listParams.Status = stripe.String(params.Status)
	}

	var payouts []*PayoutItem
	iter := payout.List(listParams)
	for iter.Next() {
		p := iter.Payout()
		payouts = append(payouts, &PayoutItem{
			ID:          p.ID,
			Amount:      p.Amount,
			Currency:    string(p.Currency),
			Status:      string(p.Status),
			ArrivalDate: time.Unix(p.ArrivalDate, 0),
			CreatedAt:   time.Unix(p.Created, 0),
		})
	}

	if err := iter.Err(); err != nil {
		return nil, err
	}

	return payouts, nil
}

// RefundWithConnectReversal creates a refund and reverses the associated transfer
func (s *StripeService) RefundWithConnectReversal(ctx context.Context, paymentIntentID string, amount int64, reverseTransfer bool) (*stripe.Refund, error) {
	refundParams := &stripe.RefundParams{
		PaymentIntent: stripe.String(paymentIntentID),
	}

	if amount > 0 {
		refundParams.Amount = stripe.Int64(amount)
	}

	if reverseTransfer {
		refundParams.ReverseTransfer = stripe.Bool(true)
	}

	return refund.New(refundParams)
}
