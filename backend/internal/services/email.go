package services

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"html/template"
	"net/smtp"
	"os"
	"strings"
)

// EmailService handles sending emails (verification, password reset, etc.)
type EmailService struct {
	smtpHost     string
	smtpPort     string
	smtpUser     string
	smtpPassword string
	fromEmail    string
	fromName     string
	appURL       string
	enabled      bool
}

// EmailConfig holds email configuration
type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	FromEmail    string
	FromName     string
	AppURL       string
}

// NewEmailService creates a new email service
func NewEmailService(config *EmailConfig) *EmailService {
	if config == nil {
		config = &EmailConfig{
			SMTPHost:     os.Getenv("SMTP_HOST"),
			SMTPPort:     os.Getenv("SMTP_PORT"),
			SMTPUser:     os.Getenv("SMTP_USER"),
			SMTPPassword: os.Getenv("SMTP_PASSWORD"),
			FromEmail:    os.Getenv("FROM_EMAIL"),
			FromName:     os.Getenv("FROM_NAME"),
			AppURL:       os.Getenv("APP_URL"),
		}
	}

	if config.SMTPPort == "" {
		config.SMTPPort = "587"
	}
	if config.FromName == "" {
		config.FromName = "Cloud Clips"
	}
	if config.FromEmail == "" {
		config.FromEmail = "noreply@cloudclips.com"
	}
	if config.AppURL == "" {
		config.AppURL = "https://cloudclips.com"
	}

	enabled := config.SMTPHost != "" && config.SMTPUser != "" && config.SMTPPassword != ""

	return &EmailService{
		smtpHost:     config.SMTPHost,
		smtpPort:     config.SMTPPort,
		smtpUser:     config.SMTPUser,
		smtpPassword: config.SMTPPassword,
		fromEmail:    config.FromEmail,
		fromName:     config.FromName,
		appURL:       config.AppURL,
		enabled:      enabled,
	}
}

// IsEnabled returns whether email service is configured
func (s *EmailService) IsEnabled() bool {
	return s.enabled
}

// GenerateSecureToken generates a cryptographically secure random token
func GenerateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// SendEmail sends an email with the given subject and body
func (s *EmailService) SendEmail(to, subject, htmlBody, textBody string) error {
	if !s.enabled {
		// Log the email in dev mode instead of sending
		fmt.Printf("[EMAIL] Would send to: %s\n", to)
		fmt.Printf("[EMAIL] Subject: %s\n", subject)
		fmt.Printf("[EMAIL] Body: %s\n", textBody)
		return nil
	}

	// Build email headers
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", s.fromName, s.fromEmail)
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	// Build message
	var message bytes.Buffer
	for k, v := range headers {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	message.WriteString("\r\n")
	message.WriteString(htmlBody)

	// Setup authentication
	auth := smtp.PlainAuth("", s.smtpUser, s.smtpPassword, s.smtpHost)

	// Send email
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	err := smtp.SendMail(addr, auth, s.fromEmail, []string{to}, message.Bytes())
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// SendVerificationEmail sends an email verification link
func (s *EmailService) SendVerificationEmail(to, name, token string) error {
	subject := "Verify your Cloud Clips email"

	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", s.appURL, token)

	htmlBody := s.buildVerificationEmailHTML(name, verifyURL)
	textBody := fmt.Sprintf(
		"Hi %s,\n\nPlease verify your email address by clicking the link below:\n\n%s\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account with Cloud Clips, please ignore this email.\n\n- The Cloud Clips Team",
		name, verifyURL,
	)

	return s.SendEmail(to, subject, htmlBody, textBody)
}

// SendPasswordResetEmail sends a password reset link
func (s *EmailService) SendPasswordResetEmail(to, name, token string) error {
	subject := "Reset your Cloud Clips password"

	resetURL := fmt.Sprintf("%s/reset-password?token=%s", s.appURL, token)

	htmlBody := s.buildPasswordResetEmailHTML(name, resetURL)
	textBody := fmt.Sprintf(
		"Hi %s,\n\nYou requested to reset your password. Click the link below to set a new password:\n\n%s\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email. Your password will remain unchanged.\n\n- The Cloud Clips Team",
		name, resetURL,
	)

	return s.SendEmail(to, subject, htmlBody, textBody)
}

// SendWelcomeEmail sends a welcome email after successful registration
func (s *EmailService) SendWelcomeEmail(to, name string) error {
	subject := "Welcome to Cloud Clips!"

	htmlBody := s.buildWelcomeEmailHTML(name)
	textBody := fmt.Sprintf(
		"Hi %s,\n\nWelcome to Cloud Clips! We're excited to have you on board.\n\nYou can now:\n- Book appointments with top barbers\n- Browse and purchase hair care products\n- Chat with your barber\n- Track your appointment history\n\nGet started by exploring barbers near you!\n\n- The Cloud Clips Team",
		name,
	)

	return s.SendEmail(to, subject, htmlBody, textBody)
}

// Email HTML templates
func (s *EmailService) buildVerificationEmailHTML(name, verifyURL string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb; margin-top: 0;">Cloud Clips</h1>
            <h2 style="color: #1f2937;">Verify your email address</h2>
            <p style="color: #4b5563;">Hi {{.Name}},</p>
            <p style="color: #4b5563;">Thanks for signing up for Cloud Clips! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{.VerifyURL}}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't create an account with Cloud Clips, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">Cloud Clips - Your Barbershop in Your Pocket</p>
        </div>
    </div>
</body>
</html>
`
	t, _ := template.New("verification").Parse(tmpl)
	var buf bytes.Buffer
	t.Execute(&buf, map[string]string{
		"Name":      name,
		"VerifyURL": verifyURL,
	})
	return buf.String()
}

func (s *EmailService) buildPasswordResetEmailHTML(name, resetURL string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb; margin-top: 0;">Cloud Clips</h1>
            <h2 style="color: #1f2937;">Reset your password</h2>
            <p style="color: #4b5563;">Hi {{.Name}},</p>
            <p style="color: #4b5563;">You requested to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{.ResetURL}}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">Cloud Clips - Your Barbershop in Your Pocket</p>
        </div>
    </div>
</body>
</html>
`
	t, _ := template.New("reset").Parse(tmpl)
	var buf bytes.Buffer
	t.Execute(&buf, map[string]string{
		"Name":     name,
		"ResetURL": resetURL,
	})
	return buf.String()
}

func (s *EmailService) buildWelcomeEmailHTML(name string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb; margin-top: 0;">Cloud Clips</h1>
            <h2 style="color: #1f2937;">Welcome to Cloud Clips!</h2>
            <p style="color: #4b5563;">Hi {{.Name}},</p>
            <p style="color: #4b5563;">We're excited to have you on board! With Cloud Clips, you can:</p>
            <ul style="color: #4b5563;">
                <li>Book appointments with top barbers near you</li>
                <li>Browse and purchase hair care products</li>
                <li>Chat directly with your barber</li>
                <li>Track your appointment history</li>
                <li>Save your favorite barbers</li>
            </ul>
            <p style="color: #4b5563;">Get started by exploring barbers in your area!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">Cloud Clips - Your Barbershop in Your Pocket</p>
        </div>
    </div>
</body>
</html>
`
	t, _ := template.New("welcome").Parse(tmpl)
	var buf bytes.Buffer
	t.Execute(&buf, map[string]string{
		"Name": name,
	})
	return buf.String()
}

// ValidateEmail performs basic email validation
func ValidateEmail(email string) bool {
	if email == "" {
		return false
	}
	// Basic validation: contains @ and has content before and after
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}
	if len(parts[0]) == 0 || len(parts[1]) == 0 {
		return false
	}
	// Check for dot in domain
	if !strings.Contains(parts[1], ".") {
		return false
	}
	return true
}
