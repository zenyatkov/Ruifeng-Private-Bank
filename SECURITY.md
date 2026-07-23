# 瑞峯 RuiFeng Private Bank - Security Policy

## Security Overview

This application handles sensitive financial data and implements multiple security layers:

### Authentication & Authorization
- **Session Management**: HTTP-only cookies with JWT tokens
- **Password Security**: Bcrypt hashing with 10 rounds
- **2FA Support**: TOTP implementation for enhanced security
- **Role-Based Access**: Client, Admin, and Relationship Manager roles

### Data Protection
- **Encryption**: All sensitive data encrypted in transit (HTTPS)
- **Database**: PostgreSQL with connection pooling
- **Validation**: Input validation with Zod schemas
- **Audit Logging**: All sensitive actions logged with request IDs

### API Security
- **Rate Limiting**: Prevents brute force attacks
- **CORS Headers**: Configured in Next.js
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Request Validation**: Strict schema validation on all inputs

## Reporting Security Issues

**Do NOT** create public GitHub issues for security vulnerabilities.

Instead:
1. Email security details to [security contact]
2. Include affected versions and reproduction steps
3. Allow 72 hours for response before public disclosure
4. Do not share the vulnerability with third parties

## Security Best Practices

### For Developers

1. **Environment Variables**
   - Never commit `.env.local` files
   - Use `.env.example` for documentation
   - Rotate secrets regularly

2. **Dependencies**
   - Keep dependencies updated: `npm audit`
   - Review security advisories regularly
   - Avoid deprecated packages

3. **Code Review**
   - All code requires review before merge
   - Security considerations on every PR
   - Test input validation thoroughly

4. **Logging**
   - Never log passwords or sensitive tokens
   - Include request IDs for tracing
   - Rotate logs regularly

### For Deployment

1. **Environment**
   - Use strong `AUTH_SECRET` (32+ characters)
   - Enable HTTPS in production
   - Set `NODE_ENV=production`

2. **Database**
   - Use strong passwords
   - Enable connection encryption
   - Regular automated backups
   - Restrict network access

3. **Monitoring**
   - Enable request logging
   - Monitor for suspicious patterns
   - Set up alerting for errors
   - Track rate limit breaches

## Vulnerability Scanning

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

## Compliance

- PSD2 compliant authentication flow
- GDPR ready data handling
- MAS Singapore regulatory alignment

## Security Checklist

- [ ] AUTH_SECRET is 32+ characters
- [ ] HTTPS enabled in production
- [ ] Database encrypted and backed up
- [ ] Rate limiting enabled
- [ ] Request logging enabled
- [ ] Error details hidden in production
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] 2FA available for users
- [ ] Audit logs maintained

## Incident Response

1. **Detection**: Monitoring alerts and user reports
2. **Assessment**: Determine scope and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Fix the vulnerability
5. **Recovery**: Restore normal operations
6. **Post-Incident**: Review and improve

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/nodejs-security/)
- [Next.js Security](https://nextjs.org/docs/basic-features/data-fetching)
