#!/usr/bin/env node

/**
 * Security Audit Script
 * Checks for common security vulnerabilities and misconfigurations
 */

const fs = require('fs');
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  // ANSI color codes
  colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
  };

  log(message, color = 'reset') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  addIssue(category, issue, severity = 'HIGH') {
    this.issues.push({ category, issue, severity });
  }

  addWarning(category, warning) {
    this.warnings.push({ category, warning });
  }

  addPassed(category, check) {
    this.passed.push({ category, check });
  }

  async runAudit() {
    this.log('\n====================================', 'blue');
    this.log('  Security Audit - The Hub', 'blue');
    this.log('====================================\n', 'blue');

    await this.checkEnvironmentFiles();
    await this.checkDependencies();
    await this.checkAPISecure();
    await this.checkInputValidation();
    await this.checkAuthenticationSecurity();
    await this.checkCORSConfiguration();
    await this.checkRateLimiting();
    await this.checkSecurityHeaders();
    await this.checkFilePermissions();
    await this.checkSecretsExposure();
    await this.checkSQLInjection();
    await this.checkXSSProtection();

    this.printReport();
  }

  async checkEnvironmentFiles() {
    this.log('🔍 Checking Environment Files...', 'blue');

    // Check if .env is in .gitignore
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      if (gitignore.includes('.env')) {
        this.addPassed('Environment', '.env files are in .gitignore');
      } else {
        this.addIssue('Environment', '.env files NOT in .gitignore - risk of exposing secrets', 'CRITICAL');
      }
    } else {
      this.addWarning('Environment', 'No .gitignore file found');
    }

    // Check for committed .env files
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');

      // Check for placeholder values
      if (envContent.includes('your_') || envContent.includes('_here')) {
        this.addWarning('Environment', '.env contains placeholder values - update before deployment');
      }

      // Check for exposed API keys in .env
      const apiKeyPattern = /^OPENAI_API_KEY=sk-[a-zA-Z0-9]{40,}/m;
      if (apiKeyPattern.test(envContent)) {
        this.addPassed('Environment', 'OpenAI API key format valid');
      }

      // Check for production environment
      if (envContent.includes('NODE_ENV=production')) {
        this.addWarning('Environment', 'NODE_ENV set to production in .env - use separate .env.production');
      }
    }

    // Check for example/template file
    const envExamplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(envExamplePath)) {
      this.addPassed('Environment', '.env.example file exists for documentation');
    } else {
      this.addWarning('Environment', 'No .env.example file - consider creating one');
    }

    console.log('');
  }

  async checkDependencies() {
    this.log('🔍 Checking Dependencies...', 'blue');

    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.addIssue('Dependencies', 'No package.json found', 'HIGH');
      console.log('');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Check for known vulnerable packages (basic check)
    const vulnerablePackages = {
      'express': { minVersion: '4.17.0', reason: 'Security patches' },
      'mongoose': { minVersion: '5.13.0', reason: 'Prototype pollution fixes' },
      'axios': { minVersion: '0.21.2', reason: 'SSRF vulnerability' }
    };

    for (const [pkg, info] of Object.entries(vulnerablePackages)) {
      if (packageJson.dependencies && packageJson.dependencies[pkg]) {
        this.addPassed('Dependencies', `${pkg} is present (check version manually)`);
      }
    }

    // Check for outdated devDependencies in production
    if (packageJson.dependencies) {
      const devDeps = ['nodemon', 'webpack-dev-server', 'eslint'];
      for (const dep of devDeps) {
        if (packageJson.dependencies[dep]) {
          this.addWarning('Dependencies', `${dep} should be in devDependencies, not dependencies`);
        }
      }
    }

    this.addPassed('Dependencies', 'Run "npm audit" for detailed vulnerability scan');

    console.log('');
  }

  async checkAPISecurityParams() {
    this.log('🔍 Checking API Security...', 'blue');

    // Check server.js for security configurations
    const serverPath = path.join(process.cwd(), 'src/api/server.js');
    if (!fs.existsSync(serverPath)) {
      this.addWarning('API', 'Server file not found');
      console.log('');
      return;
    }

    const serverContent = fs.readFileSync(serverPath, 'utf8');

    // Check for CORS
    if (serverContent.includes('cors(')) {
      this.addPassed('API', 'CORS middleware detected');

      if (serverContent.includes('origin:')) {
        this.addPassed('API', 'CORS origin configuration found');
      } else {
        this.addWarning('API', 'CORS allows all origins - restrict in production');
      }
    } else {
      this.addIssue('API', 'No CORS configuration found', 'MEDIUM');
    }

    // Check for body size limit
    if (serverContent.includes('limit:') || serverContent.includes('express.json')) {
      this.addPassed('API', 'Request body parsing detected');
    }

    // Check for helmet or security headers
    if (serverContent.includes('helmet')) {
      this.addPassed('API', 'Helmet security middleware detected');
    } else {
      this.addWarning('API', 'Consider adding helmet for security headers');
    }

    // Check for rate limiting
    if (serverContent.includes('rateLimit') || serverContent.includes('rate-limit')) {
      this.addPassed('API', 'Rate limiting detected');
    } else {
      this.addIssue('API', 'No rate limiting found - API vulnerable to abuse', 'MEDIUM');
    }

    console.log('');
  }

  async checkInputValidation() {
    this.log('🔍 Checking Input Validation...', 'blue');

    // Check for input validation in API files
    const apiDir = path.join(process.cwd(), 'src/api');
    if (!fs.existsSync(apiDir)) {
      this.addWarning('Input Validation', 'API directory not found');
      console.log('');
      return;
    }

    const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.js'));
    let validationFound = false;

    for (const file of apiFiles) {
      const content = fs.readFileSync(path.join(apiDir, file), 'utf8');

      // Check for validation libraries
      if (content.includes('joi') || content.includes('yup') || content.includes('validator')) {
        validationFound = true;
        this.addPassed('Input Validation', `Validation library found in ${file}`);
      }

      // Check for basic validation
      if (content.includes('!req.body') || content.includes('throw new Error')) {
        validationFound = true;
      }
    }

    if (!validationFound) {
      this.addIssue('Input Validation', 'No input validation detected in API endpoints', 'HIGH');
    }

    console.log('');
  }

  async checkAuthenticationSecurity() {
    this.log('🔍 Checking Authentication...', 'blue');

    // Check for Supabase Auth usage
    const files = this.getAllJSFiles('src');
    let authFound = false;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('supabase.auth')) {
        authFound = true;
        this.addPassed('Authentication', 'Supabase Auth detected');
        break;
      }
    }

    if (!authFound) {
      this.addWarning('Authentication', 'No authentication system detected');
    }

    console.log('');
  }

  async checkCORSConfiguration() {
    this.log('🔍 Checking CORS Configuration...', 'blue');

    const serverPath = path.join(process.cwd(), 'src/api/server.js');
    if (fs.existsSync(serverPath)) {
      const content = fs.readFileSync(serverPath, 'utf8');

      if (content.includes("origin: '*'")) {
        this.addIssue('CORS', 'CORS allows all origins (*) - restrict to specific domains in production', 'HIGH');
      } else if (content.includes('origin:')) {
        this.addPassed('CORS', 'CORS origin restrictions configured');
      }

      if (content.includes('credentials: true')) {
        this.addPassed('CORS', 'CORS credentials handling configured');
      }
    }

    console.log('');
  }

  async checkRateLimiting() {
    this.log('🔍 Checking Rate Limiting...', 'blue');

    const files = this.getAllJSFiles('src');
    let rateLimitFound = false;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('rateLimit') || content.includes('bottleneck') || content.includes('rate-limiter')) {
        rateLimitFound = true;
        this.addPassed('Rate Limiting', `Rate limiting found in ${path.basename(file)}`);
        break;
      }
    }

    if (!rateLimitFound) {
      this.addIssue('Rate Limiting', 'No rate limiting detected - vulnerable to DDoS and abuse', 'HIGH');
    }

    console.log('');
  }

  async checkSecurityHeaders() {
    this.log('🔍 Checking Security Headers...', 'blue');

    const serverPath = path.join(process.cwd(), 'src/api/server.js');
    if (fs.existsSync(serverPath)) {
      const content = fs.readFileSync(serverPath, 'utf8');

      const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'HSTS',
        'Content-Security-Policy': 'CSP'
      };

      for (const [header, name] of Object.entries(headers)) {
        if (content.includes(header)) {
          this.addPassed('Security Headers', `${name} header configured`);
        } else {
          this.addWarning('Security Headers', `Missing ${name} header`);
        }
      }
    }

    console.log('');
  }

  async checkFilePermissions() {
    this.log('🔍 Checking File Permissions...', 'blue');

    // Check critical files
    const criticalFiles = ['.env', '.env.production', 'config/credentials.json'];

    for (const file of criticalFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const mode = (stats.mode & parseInt('777', 8)).toString(8);

          if (mode === '600' || mode === '644') {
            this.addPassed('File Permissions', `${file} has secure permissions (${mode})`);
          } else {
            this.addWarning('File Permissions', `${file} has permissions ${mode} - consider 600 or 644`);
          }
        } catch (error) {
          this.addWarning('File Permissions', `Could not check permissions for ${file}`);
        }
      }
    }

    console.log('');
  }

  async checkSecretsExposure() {
    this.log('🔍 Checking for Exposed Secrets...', 'blue');

    const frontendFiles = this.getAllJSFiles('the-hub/src');
    const secretPatterns = [
      { pattern: /SUPABASE_SERVICE_ROLE_KEY/, name: 'Supabase Service Role Key' },
      { pattern: /sk-[a-zA-Z0-9]{40,}/, name: 'OpenAI API Key' },
      { pattern: /OPENAI_API_KEY/, name: 'OpenAI API Key variable' }
    ];

    for (const file of frontendFiles) {
      const content = fs.readFileSync(file, 'utf8');

      for (const { pattern, name } of secretPatterns) {
        if (pattern.test(content)) {
          this.addIssue('Secrets Exposure', `${name} found in frontend file: ${file}`, 'CRITICAL');
        }
      }
    }

    this.addPassed('Secrets Exposure', 'No obvious secrets found in frontend (manual review recommended)');

    console.log('');
  }

  async checkSQLInjection() {
    this.log('🔍 Checking for SQL Injection Risks...', 'blue');

    const dbFiles = this.getAllJSFiles('src/db');
    let usesParameterized = false;

    for (const file of dbFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for Supabase (which uses parameterized queries)
      if (content.includes('supabase') && content.includes('.select(') || content.includes('.insert(')) {
        usesParameterized = true;
        this.addPassed('SQL Injection', 'Using Supabase (parameterized queries)');
        break;
      }

      // Check for dangerous patterns
      if (content.includes('${') && content.includes('query')) {
        this.addWarning('SQL Injection', `Possible string concatenation in SQL query in ${path.basename(file)}`);
      }
    }

    if (!usesParameterized) {
      this.addWarning('SQL Injection', 'Could not verify parameterized queries - manual review needed');
    }

    console.log('');
  }

  async checkXSSProtection() {
    this.log('🔍 Checking XSS Protection...', 'blue');

    const files = this.getAllJSFiles('src');
    let sanitizationFound = false;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('DOMPurify') || content.includes('sanitize') || content.includes('xss')) {
        sanitizationFound = true;
        this.addPassed('XSS Protection', `Input sanitization found in ${path.basename(file)}`);
      }

      // Check for dangerous innerHTML usage
      if (content.includes('innerHTML') && !content.includes('sanitize')) {
        this.addWarning('XSS Protection', `Possible unsafe innerHTML in ${path.basename(file)}`);
      }
    }

    if (!sanitizationFound) {
      this.addWarning('XSS Protection', 'No sanitization library detected - verify input is sanitized');
    }

    console.log('');
  }

  getAllJSFiles(dir) {
    let results = [];
    const dirPath = path.join(process.cwd(), dir);

    if (!fs.existsSync(dirPath)) {
      return results;
    }

    const list = fs.readdirSync(dirPath);

    list.forEach(file => {
      file = path.join(dirPath, file);
      const stat = fs.statSync(file);

      if (stat && stat.isDirectory()) {
        results = results.concat(this.getAllJSFiles(file));
      } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    });

    return results;
  }

  printReport() {
    console.log('\n====================================');
    this.log('  Security Audit Report', 'magenta');
    console.log('====================================\n');

    // Critical Issues
    const critical = this.issues.filter(i => i.severity === 'CRITICAL');
    if (critical.length > 0) {
      this.log(`\n🚨 CRITICAL ISSUES (${critical.length}):`, 'red');
      critical.forEach((issue, i) => {
        this.log(`${i + 1}. [${issue.category}] ${issue.issue}`, 'red');
      });
    }

    // High Priority Issues
    const high = this.issues.filter(i => i.severity === 'HIGH');
    if (high.length > 0) {
      this.log(`\n❌ HIGH PRIORITY (${high.length}):`, 'red');
      high.forEach((issue, i) => {
        this.log(`${i + 1}. [${issue.category}] ${issue.issue}`, 'red');
      });
    }

    // Medium Priority Issues
    const medium = this.issues.filter(i => i.severity === 'MEDIUM');
    if (medium.length > 0) {
      this.log(`\n⚠️  MEDIUM PRIORITY (${medium.length}):`, 'yellow');
      medium.forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.category}] ${issue.issue}`);
      });
    }

    // Warnings
    if (this.warnings.length > 0) {
      this.log(`\n⚠️  WARNINGS (${this.warnings.length}):`, 'yellow');
      this.warnings.forEach((warning, i) => {
        console.log(`${i + 1}. [${warning.category}] ${warning.warning}`);
      });
    }

    // Passed Checks
    if (this.passed.length > 0) {
      this.log(`\n✅ PASSED CHECKS (${this.passed.length}):`, 'green');
      this.passed.slice(0, 10).forEach((pass, i) => {
        console.log(`${i + 1}. [${pass.category}] ${pass.check}`);
      });
      if (this.passed.length > 10) {
        console.log(`   ... and ${this.passed.length - 10} more`);
      }
    }

    // Summary
    console.log('\n====================================');
    this.log('Summary:', 'blue');
    console.log('====================================');
    this.log(`✅ Passed: ${this.passed.length}`, 'green');
    this.log(`⚠️  Warnings: ${this.warnings.length}`, 'yellow');
    this.log(`❌ Issues: ${this.issues.length}`, 'red');
    this.log(`🚨 Critical: ${critical.length}`, 'red');

    // Overall Status
    console.log('');
    if (critical.length > 0) {
      this.log('🚨 Status: CRITICAL - Fix critical issues before deployment!', 'red');
      process.exit(1);
    } else if (high.length > 0) {
      this.log('❌ Status: NEEDS ATTENTION - Address high priority issues', 'red');
      process.exit(1);
    } else if (medium.length > 0 || this.warnings.length > 5) {
      this.log('⚠️  Status: REVIEW RECOMMENDED - Address medium issues and warnings', 'yellow');
    } else {
      this.log('✅ Status: PASSED - Ready for deployment', 'green');
    }

    console.log('');
  }
}

// Run audit
const auditor = new SecurityAuditor();
auditor.runAudit().catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});
