#!/usr/bin/env node

/**
 * Working Coolify Deployment Log Tool
 * 
 * Fixes the hanging issue with npx setdomain-coolify command
 * by implementing multiple fallback methods and proper timeout handling.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const https = require('https');

class WorkingCoolifyDeployLog {
    constructor() {
        this.config = {
            coolifyUrl: 'https://coolify.247420.xyz',
            mainUrl: 'https://schwepe.247420.xyz',
            actualUrl: 'https://c0s8g4k00oss8kkcoccs88g0.247420.xyz',
            timeout: 10000, // 10 second timeout for hanging commands
            projectName: 'schwepe'
        };
    }

    // Execute command with timeout to prevent hanging
    async executeWithTimeout(command, args, timeoutMs = this.config.timeout) {
        return new Promise((resolve) => {
            console.log(`🔧 Executing: ${command} ${args.join(' ')}`);
            
            const child = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: timeoutMs
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
                        error: `Command timed out after ${timeoutMs}ms`,
                        stdout: stdout || 'No output',
                        stderr: stderr || 'No stderr'
                    });
                }
            }, timeoutMs);
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
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

    async checkUrlStatus(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const req = https.get(url, { 
                timeout: 5000,
                rejectUnauthorized: false
            }, (res) => {
                resolve({
                    url,
                    status: res.statusCode,
                    responseTime: Date.now() - startTime,
                    success: res.statusCode < 400
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    url,
                    status: 'ERROR',
                    responseTime: Date.now() - startTime,
                    success: false,
                    error: error.message
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    url,
                    status: 'TIMEOUT',
                    responseTime: 5000,
                    success: false,
                    error: 'Request timeout'
                });
            });
        });
    }

    async getDeploymentInfo() {
        console.log('🚀 Working Coolify Deployment Log Tool');
        console.log('====================================');
        console.log(`Project: ${this.config.projectName}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('');

        const results = [];

        // Method 1: Try the original setdomain-coolify command (with timeout)
        console.log('📋 Method 1: Testing original setdomain-coolify command...');
        const originalResult = await this.executeWithTimeout(
            'npx', ['-y', 'setdomain-coolify@latest', 'coolify.247420.xyz', 'schwepe.247420.xyz']
        );
        
        if (originalResult.success) {
            console.log('✅ Original command succeeded');
            results.push({
                method: 'Original setdomain-coolify command',
                success: true,
                output: originalResult.stdout
            });
        } else {
            console.log('❌ Original command failed or timed out');
            results.push({
                method: 'Original setdomain-coolify command',
                success: false,
                error: originalResult.error || 'Exit code: ' + originalResult.code,
                stderr: originalResult.stderr
            });
        }

        // Method 2: Try setdomain-logs binary
        console.log('\n📋 Method 2: Testing setdomain-logs binary...');
        const logsResult = await this.executeWithTimeout(
            'npx', ['-y', 'setdomain-coolify@latest', 'setdomain-logs', '--latest']
        );
        
        if (logsResult.success) {
            console.log('✅ setdomain-logs succeeded');
            results.push({
                method: 'setdomain-logs binary',
                success: true,
                output: logsResult.stdout
            });
        } else {
            console.log('❌ setdomain-logs failed or timed out');
            results.push({
                method: 'setdomain-logs binary',
                success: false,
                error: logsResult.error || 'Exit code: ' + logsResult.code,
                stderr: logsResult.stderr
            });
        }

        // Method 3: Check local deployment files
        console.log('\n📋 Method 3: Checking local deployment files...');
        const localFiles = ['.deployment-issue.json', 'deployment-status.json', 'build.log', '.deploy-timestamp'];
        const localResults = [];
        
        for (const file of localFiles) {
            try {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    const stats = fs.statSync(file);
                    localResults.push({
                        file,
                        exists: true,
                        modified: stats.mtime.toISOString(),
                        content: content.substring(0, 500) + (content.length > 500 ? '...' : '')
                    });
                } else {
                    localResults.push({ file, exists: false });
                }
            } catch (error) {
                localResults.push({ file, exists: false, error: error.message });
            }
        }
        
        results.push({
            method: 'Local deployment files',
            success: localResults.some(r => r.exists),
            files: localResults
        });

        // Method 4: Check deployment URLs
        console.log('\n📋 Method 4: Checking deployment URLs...');
        const urls = [
            { name: 'Main URL', url: this.config.mainUrl },
            { name: 'Actual URL', url: this.config.actualUrl },
            { name: 'Coolify Admin', url: this.config.coolifyUrl }
        ];
        
        const urlResults = [];
        for (const urlInfo of urls) {
            const status = await this.checkUrlStatus(urlInfo.url);
            urlResults.push({
                name: urlInfo.name,
                ...status
            });
        }
        
        results.push({
            method: 'URL status checks',
            success: urlResults.some(r => r.success),
            urls: urlResults
        });

        return results;
    }

    formatResults(results) {
        let output = [];
        
        for (const result of results) {
            output.push(`\n🔍 ${result.method}:`);
            output.push('='.repeat(50));
            
            if (result.success) {
                output.push('✅ SUCCESS');
                
                if (result.output) {
                    output.push('\n📄 Output:');
                    output.push(result.output);
                }
                
                if (result.files) {
                    output.push('\n📁 Files found:');
                    for (const file of result.files) {
                        if (file.exists) {
                            output.push(`  📄 ${file.file} (modified: ${file.modified})`);
                            if (file.content) {
                                output.push(`     ${file.content}`);
                            }
                        }
                    }
                }
                
                if (result.urls) {
                    output.push('\n🌐 URL Status:');
                    for (const url of result.urls) {
                        const icon = url.success ? '✅' : '❌';
                        output.push(`  ${icon} ${url.name}: ${url.status} (${url.responseTime}ms)`);
                    }
                }
            } else {
                output.push('❌ FAILED');
                if (result.error) {
                    output.push(`Error: ${result.error}`);
                }
                if (result.stderr) {
                    output.push(`STDERR: ${result.stderr}`);
                }
            }
        }
        
        return output.join('\n');
    }

    async run() {
        try {
            const results = await this.getDeploymentInfo();
            const formattedOutput = this.formatResults(results);
            
            console.log('\n📊 DEPLOYMENT LOG RESULTS');
            console.log('========================');
            console.log(formattedOutput);
            
            // Save results to file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logFile = `deployment-log-${timestamp}.log`;
            fs.writeFileSync(logFile, formattedOutput);
            console.log(`\n💾 Results saved to: ${logFile}`);
            
            // Check if any method succeeded
            const anySuccess = results.some(r => r.success);
            return anySuccess;
            
        } catch (error) {
            console.error('❌ Tool execution failed:', error.message);
            return false;
        }
    }
}

// Run the tool if this file is executed directly
if (require.main === module) {
    const tool = new WorkingCoolifyDeployLog();
    tool.run().then(success => {
        console.log(`\n${success ? '✅' : '❌'} Tool completed ${success ? 'successfully' : 'with issues'}`);
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = WorkingCoolifyDeployLog;
