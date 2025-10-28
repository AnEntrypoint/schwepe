#!/usr/bin/env node

/**
 * Coolify Deployment Log Retrieval Tool
 * 
 * This tool retrieves the latest deployment log from Coolify
 * and displays it in a readable format.
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');

class CoolifyDeployLog {
    constructor() {
        this.config = {
            coolifyUrl: process.env.COOLIFY_URL || 'https://coolify.247420.xyz',
            coolifyToken: process.env.COOLIFY_API_TOKEN,
            projectName: process.env.PROJECT_NAME || 'schwepe',
            timeout: 30000
        };
        
        if (!this.config.coolifyToken) {
            console.log('⚠️  No COOLIFY_API_TOKEN found, trying alternative methods...');
        }
    }

    async getLatestDeploymentLog() {
        console.log('🔍 Retrieving latest deployment log...');
        console.log('Coolify URL:', this.config.coolifyUrl);
        
        try {
            // Method 1: Try using setdomain-coolify command directly
            console.log('📋 Method 1: Using setdomain-coolify command...');
            try {
                const logOutput = execSync('npx -y setdomain-coolify@latest coolify.247420.xyz schwepe.247420.xyz', {
                    encoding: 'utf8',
                    timeout: 15000,
                    cwd: process.cwd()
                });
                console.log('✅ Successfully retrieved deployment information');
                return this.formatLogOutput(logOutput);
            } catch (error) {
                console.log('❌ setdomain-coolify method failed:', error.message);
                console.log('STDERR:', error.stderr);
            }
            
            // Method 2: Try using setdomain-logs binary
            console.log('📋 Method 2: Using setdomain-logs binary...');
            try {
                const logOutput = execSync('npx -y setdomain-coolify@latest setdomain-logs --latest', {
                    encoding: 'utf8',
                    timeout: 15000,
                    cwd: process.cwd()
                });
                console.log('✅ Successfully retrieved logs using setdomain-logs');
                return this.formatLogOutput(logOutput);
            } catch (error) {
                console.log('❌ setdomain-logs method failed:', error.message);
            }
            
            // Method 3: Check local deployment files
            console.log('📋 Method 3: Checking local deployment files...');
            return this.checkLocalDeploymentFiles();
            
        } catch (error) {
            console.error('❌ All methods failed:', error.message);
            return null;
        }
    }

    formatLogOutput(rawOutput) {
        const lines = rawOutput.split('\n');
        const formatted = lines.map(line => {
            // Add timestamp formatting if needed
            if (line.match(/^\d{4}-\d{2}-\d{2}|\w{3} \d{2}/)) {
                return `📅 ${line}`;
            }
            // Highlight error lines
            if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
                return `❌ ${line}`;
            }
            // Highlight success lines
            if (line.toLowerCase().includes('success') || line.toLowerCase().includes('completed')) {
                return `✅ ${line}`;
            }
            return `  ${line}`;
        });
        
        return formatted.join('\n');
    }

    checkLocalDeploymentFiles() {
        const logFiles = [
            '.deployment-issue.json',
            'deployment-status.json',
            'build.log',
            '.deploy-timestamp'
        ];

        let logs = [];
        
        for (const file of logFiles) {
            try {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    const stats = fs.statSync(file);
                    logs.push(`📄 ${file} (modified: ${stats.mtime.toISOString()})`);
                    logs.push(content);
                    logs.push('---');
                }
            } catch (error) {
                logs.push(`❌ Could not read ${file}: ${error.message}`);
            }
        }

        if (logs.length === 0) {
            logs.push('📭 No local deployment files found');
        }

        return logs.join('\n');
    }

    async run() {
        try {
            console.log('🚀 Coolify Deployment Log Tool');
            console.log('================================');
            console.log(`Project: ${this.config.projectName}`);
            console.log(`Timestamp: ${new Date().toISOString()}`);
            console.log('');

            const logs = await this.getLatestDeploymentLog();
            
            if (logs) {
                console.log('📋 Latest Deployment Information:');
                console.log('===============================');
                console.log(logs);
                
                // Save logs to file
                const logFile = `latest-deployment-${Date.now()}.log`;
                fs.writeFileSync(logFile, logs);
                console.log(`\n💾 Logs saved to: ${logFile}`);
                return true;
            } else {
                console.log('❌ No deployment information found');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Tool execution failed:', error.message);
            return false;
        }
    }
}

// Run the tool if this file is executed directly
if (require.main === module) {
    const tool = new CoolifyDeployLog();
    tool.run().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = CoolifyDeployLog;

