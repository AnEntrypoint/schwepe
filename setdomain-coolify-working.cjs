#!/usr/bin/env node

/**
 * Working SetDomain Coolify Tool
 * 
 * Fixes the hanging issue with: npx -y setdomain-coolify@latest coolify.247420.xyz schwepe.247420.xyz
 */

const { spawn } = require('child_process');
const fs = require('fs');

class SetDomainCoolify {
    constructor() {
        this.sourceDomain = 'coolify.247420.xyz';
        this.targetDomain = 'schwepe.247420.xyz';
        this.timeout = 15000;
    }

    async executeCommandWithTimeout(command, args) {
        return new Promise((resolve) => {
            console.log(`🔧 Executing: ${command} ${args.join(' ')}`);
            
            const child = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            let completed = false;
            
            const timeout = setTimeout(() => {
                if (!completed) {
                    completed = true;
                    child.kill('SIGKILL');
                    resolve({ 
                        success: false, 
                        error: `Command timed out after ${this.timeout}ms`,
                        stdout: stdout || 'No output',
                        stderr: stderr || 'No stderr'
                    });
                }
            }, this.timeout);
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
                process.stdout.write(data);
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
                process.stderr.write(data);
            });
            
            child.on('close', (code) => {
                if (!completed) {
                    completed = true;
                    clearTimeout(timeout);
                    resolve({ 
                        success: code === 0, 
                        code, 
                        stdout, 
                        stderr 
                    });
                }
            });
            
            child.on('error', (error) => {
                if (!completed) {
                    completed = true;
                    clearTimeout(timeout);
                    resolve({ 
                        success: false, 
                        error: error.message,
                        stdout,
                        stderr
                    });
                }
            });
        });
    }

    async performDomainOperation() {
        console.log('🚀 SetDomain Coolify Tool - Working Version');
        console.log('==========================================');
        console.log(`Source Domain: ${this.sourceDomain}`);
        console.log(`Target Domain: ${this.targetDomain}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('');

        // Try the original command with timeout
        console.log('📋 Testing original setdomain-coolify command...');
        const result = await this.executeCommandWithTimeout(
            'npx', ['-y', 'setdomain-coolify@latest', this.sourceDomain, this.targetDomain]
        );
        
        if (result.success) {
            console.log('\n✅ SUCCESS: Domain operation completed successfully');
            return this.saveResult(true, 'Original command succeeded', result.stdout);
        }

        // Fallback to local configuration
        console.log('\n📋 Original command failed, creating local configuration...');
        return this.createLocalConfiguration(result);
    }

    createLocalConfiguration(originalResult) {
        console.log('Creating local domain configuration...');
        
        const config = {
            timestamp: new Date().toISOString(),
            sourceDomain: this.sourceDomain,
            targetDomain: this.targetDomain,
            status: 'locally_configured',
            operation: 'domain_routing',
            originalError: originalResult.error || 'Exit code: ' + originalResult.code,
            instructions: [
                '1. Log into Coolify admin panel',
                `2. Navigate to application settings for ${this.targetDomain}`,
                '3. Update domain configuration to route from source to target',
                '4. Save and deploy the configuration'
            ]
        };
        
        fs.writeFileSync('domain-config.json', JSON.stringify(config, null, 2));
        console.log('✅ Local domain configuration saved to domain-config.json');
        
        console.log('\n🔧 MANUAL CONFIGURATION REQUIRED:');
        console.log('1. Access Coolify Admin: https://' + this.sourceDomain);
        console.log('2. Find application for: ' + this.targetDomain);
        console.log('3. Update domain routing settings');
        console.log('4. Save and deploy configuration');
        
        return this.saveResult(false, 'Manual configuration required', JSON.stringify(config, null, 2));
    }

    saveResult(success, message, details) {
        const result = {
            timestamp: new Date().toISOString(),
            sourceDomain: this.sourceDomain,
            targetDomain: this.targetDomain,
            success: success,
            message: message,
            details: details
        };
        
        const filename = `setdomain-result-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(result, null, 2));
        console.log(`\n💾 Result saved to: ${filename}`);
        
        return result;
    }

    async run() {
        try {
            const result = await this.performDomainOperation();
            process.exit(result.success ? 0 : 1);
        } catch (error) {
            console.error('❌ Fatal error:', error.message);
            process.exit(1);
        }
    }
}

if (require.main === module) {
    const tool = new SetDomainCoolify();
    tool.run();
}

module.exports = SetDomainCoolify;
