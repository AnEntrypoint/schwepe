#!/usr/bin/env node

/**
 * Coolify Database Backup Script
 * 
 * Automated backup solution for PostgreSQL and MySQL databases
 * hosted on Coolify. Features retry logic, cleanup, and reporting.
 * 
 * Environment Variables Required:
 * - COOLIFY_API_URL: Coolify instance URL (e.g., https://coolify.example.com)
 * - COOLIFY_API_TOKEN: API token with read permissions
 * - BACKUP_STORAGE_PATH: Local directory for backup files
 * - BACKUP_RETENTION_DAYS: Days to keep backups (default: 7)
 * - BACKUP_RETRY_ATTEMPTS: Number of retry attempts (default: 3)
 * - BACKUP_RETRY_DELAY: Delay between retries in ms (default: 5000)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { pipeline } = require('stream');
const streamPipeline = promisify(pipeline);

class CoolifyBackup {
  constructor() {
    this.config = {
      apiUrl: process.env.COOLIFY_API_URL || 'https://coolify.247420.xyz',
      apiToken: process.env.COOLIFY_API_TOKEN,
      storagePath: process.env.BACKUP_STORAGE_PATH || './backups',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 7,
      retryAttempts: parseInt(process.env.BACKUP_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.BACKUP_RETRY_DELAY) || 5000,
    };

    this.report = {
      startTime: new Date(),
      endTime: null,
      totalApplications: 0,
      successfulBackups: 0,
      failedBackups: 0,
      skippedBackups: 0,
      errors: [],
      details: []
    };

    this.validateConfig();
  }

  validateConfig() {
    if (!this.config.apiToken) {
      throw new Error('COOLIFY_API_TOKEN environment variable is required');
    }
    if (!this.config.apiUrl) {
      throw new Error('COOLIFY_API_URL environment variable is required');
    }
    
    // Ensure storage directory exists
    if (!fs.existsSync(this.config.storagePath)) {
      fs.mkdirSync(this.config.storagePath, { recursive: true });
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    };

    const finalOptions = { ...defaultOptions, ...options };

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        this.log(`API Request: ${options.method || 'GET'} ${url} (attempt ${attempt}/${this.config.retryAttempts})`);
        const response = await axios(url, finalOptions);
        return response;
      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        
        this.log(`Request failed, retrying in ${this.config.retryDelay}ms: ${error.message}`, 'warn');
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  async getApplications() {
    try {
      this.log('Fetching applications from Coolify...');
      const response = await this.makeRequest(`${this.config.apiUrl}/api/v1/applications`);
      this.log(`Found ${response.data.length} applications`);
      return response.data;
    } catch (error) {
      this.log(`Failed to fetch applications: ${error.message}`, 'error');
      throw error;
    }
  }

  async initiateBackup(applicationId, databaseType) {
    try {
      this.log(`Initiating ${databaseType} backup for application ${applicationId}...`);
      
      const response = await this.makeRequest(
        `${this.config.apiUrl}/api/v1/applications/${applicationId}/backups`,
        {
          method: 'POST',
          data: {
            type: databaseType.toLowerCase(),
          }
        }
      );

      this.log(`Backup initiated successfully for application ${applicationId}`);
      return response.data;
    } catch (error) {
      this.log(`Failed to initiate backup for application ${applicationId}: ${error.message}`, 'error');
      throw error;
    }
  }

  async getBackupStatus(backupId) {
    try {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/v1/backups/${backupId}`);
      return response.data;
    } catch (error) {
      this.log(`Failed to get backup status for ${backupId}: ${error.message}`, 'error');
      throw error;
    }
  }

  async waitForBackup(backupId, maxWaitTime = 300000) { // 5 minutes max
    const startTime = Date.now();
    const checkInterval = 10000; // Check every 10 seconds

    this.log(`Waiting for backup ${backupId} to complete...`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getBackupStatus(backupId);
        
        switch (status.status) {
          case 'completed':
            this.log(`Backup ${backupId} completed successfully`);
            return status;
          case 'failed':
            throw new Error(`Backup ${backupId} failed: ${status.error}`);
          case 'in_progress':
            this.log(`Backup ${backupId} in progress... (${status.progress || 0}%)`);
            break;
          default:
            this.log(`Backup ${backupId} status: ${status.status}`);
        }
      } catch (error) {
        this.log(`Error checking backup status: ${error.message}`, 'warn');
      }

      await this.sleep(checkInterval);
    }

    throw new Error(`Backup ${backupId} did not complete within ${maxWaitTime / 1000} seconds`);
  }

  async downloadBackup(backupData, applicationName, databaseType) {
    try {
      if (!backupData.download_url) {
        throw new Error('No download URL available for backup');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${applicationName}-${databaseType}-${timestamp}.sql.gz`;
      const filepath = path.join(this.config.storagePath, filename);

      this.log(`Downloading backup to: ${filepath}`);

      const response = await axios({
        method: 'GET',
        url: backupData.download_url,
        responseType: 'stream',
        timeout: 600000, // 10 minutes for download
      });

      const writer = fs.createWriteStream(filepath);
      await streamPipeline(response.data, writer);

      // Verify file was created and has content
      const stats = fs.statSync(filepath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      this.log(`Backup downloaded successfully: ${filename} (${stats.size} bytes)`);
      return { filepath, filename, size: stats.size };
    } catch (error) {
      this.log(`Failed to download backup: ${error.message}`, 'error');
      throw error;
    }
  }

  async backupApplication(application) {
    const appName = application.name || `app-${application.id}`;
    let hasBackups = false;
    const appResults = [];

    // Check if application has databases
    if (application.databases && application.databases.length > 0) {
      for (const database of application.databases) {
        const dbType = database.type; // PostgreSQL or MySQL
        
        if (['postgresql', 'mysql'].includes(dbType.toLowerCase())) {
          hasBackups = true;
          
          try {
            this.log(`Processing ${dbType} database for application ${appName}`);
            
            // Initiate backup
            const backupInit = await this.initiateBackup(application.id, dbType);
            
            // Wait for backup completion
            const backupData = await this.waitForBackup(backupInit.id);
            
            // Download backup
            const downloadResult = await this.downloadBackup(backupData, appName, dbType);
            
            appResults.push({
              databaseType: dbType,
              status: 'success',
              backupId: backupInit.id,
              filename: downloadResult.filename,
              size: downloadResult.size,
            });
            
            this.report.successfulBackups++;
            this.log(`✅ Successfully backed up ${dbType} database for ${appName}`);
            
          } catch (error) {
            appResults.push({
              databaseType: dbType,
              status: 'failed',
              error: error.message,
            });
            
            this.report.failedBackups++;
            this.report.errors.push(`${appName} (${dbType}): ${error.message}`);
            this.log(`❌ Failed to backup ${dbType} database for ${appName}: ${error.message}`, 'error');
          }
        }
      }
    }

    if (!hasBackups) {
      this.log(`No databases found for application ${appName}, skipping`);
      this.report.skippedBackups++;
    }

    return appResults;
  }

  async cleanupOldBackups() {
    try {
      this.log(`Cleaning up backups older than ${this.config.retentionDays} days...`);
      
      const files = fs.readdirSync(this.config.storagePath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      
      let deletedCount = 0;
      let deletedSize = 0;

      for (const file of files) {
        const filepath = path.join(this.config.storagePath, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime < cutoffDate) {
          deletedSize += stats.size;
          fs.unlinkSync(filepath);
          deletedCount++;
          this.log(`Deleted old backup: ${file}`);
        }
      }

      this.log(`Cleanup completed: deleted ${deletedCount} files, freed ${deletedSize} bytes`);
    } catch (error) {
      this.log(`Error during cleanup: ${error.message}`, 'error');
      this.report.errors.push(`Cleanup: ${error.message}`);
    }
  }

  generateReport() {
    this.report.endTime = new Date();
    const duration = this.report.endTime - this.report.startTime;

    const report = {
      summary: {
        startTime: this.report.startTime.toISOString(),
        endTime: this.report.endTime.toISOString(),
        duration: `${Math.round(duration / 1000)}s`,
        totalApplications: this.report.totalApplications,
        successfulBackups: this.report.successfulBackups,
        failedBackups: this.report.failedBackups,
        skippedBackups: this.report.skippedBackups,
      },
      errors: this.report.errors,
      details: this.report.details,
    };

    // Save report to file
    const reportFile = path.join(
      this.config.storagePath,
      `backup-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    this.log(`Backup report saved to: ${reportFile}`);

    return report;
  }

  async run() {
    try {
      this.log('🚀 Starting Coolify backup process...');
      
      // Get all applications
      const applications = await this.getApplications();
      this.report.totalApplications = applications.length;

      // Process each application
      for (const app of applications) {
        const results = await this.backupApplication(app);
        if (results.length > 0) {
          this.report.details.push({
            applicationId: app.id,
            applicationName: app.name,
            results: results,
          });
        }
      }

      // Clean up old backups
      await this.cleanupOldBackups();

      // Generate and display report
      const report = this.generateReport();
      
      console.log('\n📊 Backup Summary:');
      console.log(`  Total Applications: ${report.summary.totalApplications}`);
      console.log(`  Successful Backups: ${report.summary.successfulBackups}`);
      console.log(`  Failed Backups: ${report.summary.failedBackups}`);
      console.log(`  Skipped Applications: ${report.summary.skippedBackups}`);
      console.log(`  Duration: ${report.summary.duration}`);
      
      if (report.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        report.errors.forEach(error => console.log(`  - ${error}`));
      }

      this.log('✅ Backup process completed');
      
      return report;
      
    } catch (error) {
      this.log(`❌ Backup process failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the backup if this file is executed directly
if (require.main === module) {
  const backup = new CoolifyBackup();
  backup.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = CoolifyBackup;