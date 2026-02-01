#!/usr/bin/env node

/**
 * GitHub OAuth Configuration Checker
 * Run this script to verify your GitHub OAuth setup
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('\n🔍 GitHub OAuth Configuration Checker\n');
console.log('='.repeat(50));

// Check .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  console.log('✓ .env file found');
} else {
  console.log('✗ .env file NOT found');
  console.log('  Create a .env file from .env.example');
}

console.log('\n📋 Checking required environment variables:\n');

const envVars = {
  'GITHUB_CLIENT_ID': 'GitHub OAuth App Client ID',
  'GITHUB_CLIENT_SECRET': 'GitHub OAuth App Client Secret',
  'MONGODB_URI': 'MongoDB Connection String',
  'JWT_SECRET': 'JWT Secret Key',
};

let allConfigured = true;

for (const [key, description] of Object.entries(envVars)) {
  const value = process.env[key];
  if (value) {
    if (key === 'GITHUB_CLIENT_SECRET' || key === 'JWT_SECRET' || key === 'MONGODB_URI') {
      console.log(`✓ ${key}: Configured (hidden for security)`);
    } else {
      console.log(`✓ ${key}: ${value.substring(0, 20)}...`);
    }
  } else {
    console.log(`✗ ${key}: NOT SET`);
    console.log(`  → ${description}`);
    allConfigured = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allConfigured) {
  console.log('\n✅ All GitHub OAuth configurations are set!\n');
} else {
  console.log('\n❌ Some configurations are missing.\n');
  console.log('To fix:\n');
  console.log('1. Copy .env.example to .env');
  console.log('2. Add your GitHub OAuth credentials:');
  console.log('   - Visit: https://github.com/settings/developers');
  console.log('   - Create a new OAuth App');
  console.log('   - Copy Client ID to GITHUB_CLIENT_ID');
  console.log('   - Copy Client Secret to GITHUB_CLIENT_SECRET');
  console.log('3. Restart the backend server\n');
}

console.log('📚 Setup Guide: docs/GITHUB_OAUTH_SETUP.md\n');
