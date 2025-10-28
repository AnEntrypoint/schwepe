#!/usr/bin/env node

/**
 * Coolify Deployment Log Retrieval Tool
 * 
 * This tool retrieves the latest deployment log from Coolify
 * and displays it in a readable format.
 * 
 * Usage: node coolify-deploy-log.js [options]
 */

const https = require('https');
const { execSync } = require('child_process');

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
            // Method 1: Try using setdomain-logs command
            console.log('📋 Method 1: Using setdomain-logs command...');
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
            
            // Method 2: Try using Coolify API directly
            if (this.config.coolifyToken) {
                console.log('📋 Method 2: Using Coolify API...');
                return await this.getLogsFromAPI();
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

    async getLogsFromAPI() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: new URL(this.config.coolifyUrl).hostname,
                path: '/api/v1/applications',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.coolifyToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.config.timeout
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const apps = JSON.parse(data);
                            const schwepeApp = apps.find(app => 
                                app.name?.toLowerCase().includes('schwepe') ||
                                app.url?.includes('schwepe.247420.xyz')
                            );
                            
                            if (schwepeApp) {
                                this.getApplicationLogs(schwepeApp.id).then(resolve).catch(reject);
                            } else {
                                reject(new Error('Schwepe application not found'));
                            }
                        } catch (e) {
                            reject(new Error('Failed to parse API response'));
                        }
                    } else {
                        reject(new Error(`API error: ${res.statusCode}`));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('API request timeout'));
            });

            req.end();
        });
    }

    async getApplicationLogs(applicationId) {
        // This would need to be implemented based on Coolify's actual API
        // For now, return a placeholder
        return '📋 API log retrieval not yet implemented\nUse setdomain-logs command instead';
    }

    checkLocalDeploymentFiles() {
        const fs = require('fs');
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
                console.log('📋 Latest Deployment Log:');
                console.log('=========================');
                console.log(logs);
                
                // Save logs to file
                const fs = require('fs');
                const logFile = `latest-deployment-${Date.now()}.log`;
                fs.writeFileSync(logFile, logs);
                console.log(`\n💾 Logs saved to: ${logFile}`);
            } else {
                console.log('❌ No deployment logs found');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Tool execution failed:', error.message);
            process.exit(1);
        }
    }
}

// Run the tool if this file is executed directly
if (require.main === module) {
    const tool = new CoolifyDeployLog();
    tool.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = CoolifyDeployLog;

