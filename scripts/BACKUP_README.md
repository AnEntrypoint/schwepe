# Coolify Database Backup System

Automated backup solution for PostgreSQL and MySQL databases hosted on Coolify, featuring retry logic, automatic cleanup, and comprehensive reporting.

## 🚀 Features

- **Automated Discovery**: Automatically finds all applications with databases
- **Multi-Database Support**: Works with PostgreSQL and MySQL databases
- **Retry Logic**: Built-in retry mechanism for network failures
- **Progress Tracking**: Real-time progress updates and status monitoring
- **Automatic Cleanup**: Removes old backups based on retention policy
- **Comprehensive Reports**: Detailed JSON reports for audit trails
- **Error Handling**: Robust error handling with detailed logging
- **Secure Downloads**: Stream-based downloads with verification

## 📋 Prerequisites

- Node.js 14 or higher
- Access to Coolify API with read permissions
- Local storage space for backup files

## 🔧 Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (see Configuration section)

3. Make the backup script executable:
```bash
chmod +x scripts/coolify-backup.js
```

## ⚙️ Configuration

Create a `.env` file based on `.env.example`:

```bash
# Coolify API Configuration
COOLIFY_API_URL=https://coolify.247420.xyz
COOLIFY_API_TOKEN=your_api_token_here

# Backup Storage
BACKUP_STORAGE_PATH=./backups
BACKUP_RETENTION_DAYS=7

# Retry Configuration
BACKUP_RETRY_ATTEMPTS=3
BACKUP_RETRY_DELAY=5000
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COOLIFY_API_URL` | Yes | - | Coolify instance URL |
| `COOLIFY_API_TOKEN` | Yes | - | API token with application read permissions |
| `BACKUP_STORAGE_PATH` | No | `./backups` | Local directory for backup files |
| `BACKUP_RETENTION_DAYS` | No | `7` | Days to keep backups |
| `BACKUP_RETRY_ATTEMPTS` | No | `3` | Number of retry attempts for failed operations |
| `BACKUP_RETRY_DELAY` | No | `5000` | Delay between retries (milliseconds) |

### Getting API Token

1. Log into your Coolify instance
2. Go to Settings → API Tokens
3. Create a new token with "Read Applications" permission
4. Copy the token and add it to your `.env` file

## 🎯 Usage

### Basic Usage

Run the backup script:
```bash
npm run backup
```

Or run directly:
```bash
node scripts/coolify-backup.js
```

### Debug Mode

Enable debug logging:
```bash
npm run backup:debug
```

### Automated Scheduling

Add to crontab for daily backups:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/schwepe && npm run backup >> /var/log/coolify-backup.log 2>&1
```

Example crontab for multiple schedules:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/schwepe && npm run backup

# Weekly cleanup on Sundays at 3 AM
0 3 * * 0 cd /path/to/schwepe && npm run backup

# Monthly backup on 1st at 1 AM
0 1 1 * * cd /path/to/schwepe && npm run backup
```

## 📁 File Structure

After running, you'll have:

```
backups/
├── app-name-postgresql-2024-01-15T10-30-00-000Z.sql.gz
├── app-name-mysql-2024-01-15T10-30-00-000Z.sql.gz
├── backup-report-2024-01-15T10-30-00-000Z.json
└── ...
```

### Backup Naming Convention

```
{application-name}-{database-type}-{timestamp}.sql.gz
```

### Report Format

Each backup run generates a JSON report:

```json
{
  "summary": {
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": "2024-01-15T10:35:00.000Z",
    "duration": "300s",
    "totalApplications": 5,
    "successfulBackups": 3,
    "failedBackups": 1,
    "skippedBackups": 1
  },
  "errors": [
    "app-name (postgresql): Connection timeout"
  ],
  "details": [
    {
      "applicationId": "123",
      "applicationName": "app-name",
      "results": [
        {
          "databaseType": "postgresql",
          "status": "success",
          "backupId": "backup-123",
          "filename": "app-name-postgresql-2024-01-15T10-30-00-000Z.sql.gz",
          "size": 1048576
        }
      ]
    }
  ]
}
```

## 🔄 Workflow

1. **Application Discovery**: Fetches all applications from Coolify
2. **Database Detection**: Identifies applications with PostgreSQL/MySQL databases
3. **Backup Initiation**: Starts backup process for each database
4. **Status Monitoring**: Waits for backup completion with progress tracking
5. **File Download**: Downloads compressed backup files to local storage
6. **Verification**: Validates downloaded files
7. **Cleanup**: Removes backups older than retention period
8. **Reporting**: Generates comprehensive backup report

## 🛠️ Advanced Configuration

### Custom Backup Directory

Use absolute path for production deployments:
```bash
BACKUP_STORAGE_PATH=/var/backups/coolify
```

### Extended Retention

Keep backups for 30 days:
```bash
BACKUP_RETENTION_DAYS=30
```

### Aggressive Retry

For unreliable networks:
```bash
BACKUP_RETRY_ATTEMPTS=5
BACKUP_RETRY_DELAY=10000
```

## 🔍 Monitoring and Troubleshooting

### Logs

The script provides detailed logging with timestamps:
```
[2024-01-15T10:30:00.000Z] [INFO] 🚀 Starting Coolify backup process...
[2024-01-15T10:30:01.000Z] [INFO] Found 5 applications
[2024-01-15T10:30:02.000Z] [INFO] Processing postgresql database for application my-app
[2024-01-15T10:30:10.000Z] [INFO] ✅ Successfully backed up postgresql database for my-app
```

### Common Issues

1. **API Token Invalid**
   - Ensure token has correct permissions
   - Check token hasn't expired
   - Verify COOLIFY_API_URL is correct

2. **Network Timeouts**
   - Increase BACKUP_RETRY_DELAY
   - Check firewall settings
   - Verify Coolify instance accessibility

3. **Storage Space**
   - Monitor disk space in BACKUP_STORAGE_PATH
   - Adjust BACKUP_RETENTION_DAYS
   - Implement additional cleanup if needed

4. **Permission Errors**
   - Ensure script has write permissions to backup directory
   - Check file system permissions

### Health Check

Test the backup system:
```bash
# Test with dry run (if implemented)
npm run backup:test

# Monitor logs in real-time
tail -f /var/log/coolify-backup.log
```

## 🔒 Security Considerations

- Store API token securely (use environment variables, not code)
- Restrict backup directory permissions
- Consider encrypting sensitive backup files
- Regularly rotate API tokens
- Monitor backup logs for unusual activity

## 📊 Performance

- **Concurrent Backups**: Processes databases sequentially for reliability
- **Memory Usage**: Stream-based downloads minimize memory footprint
- **Network Efficiency**: Implements retry logic with exponential backoff
- **Storage**: Compressed backups reduce storage requirements

## 🤝 Integration

### Docker Integration

Add to Dockerfile:
```dockerfile
# Add backup script
COPY scripts/coolify-backup.js /app/scripts/
RUN chmod +x /app/scripts/coolify-backup.js

# Install backup dependencies
RUN npm install axios

# Create backup directory
RUN mkdir -p /app/backups
```

### CI/CD Integration

Add to CI pipeline:
```yaml
backup:
  stage: backup
  script:
    - npm install
    - npm run backup
  artifacts:
    reports:
      junit: backups/backup-report-*.json
  only:
    - schedules
```

## 📝 License

This backup system is part of the schwepe project. See main project license for details.

## 🆘 Support

For issues with:
- **Backup Script**: Check this README and script logs
- **Coolify API**: Consult Coolify documentation
- **Network Issues**: Contact your network administrator

## 🔄 Version History

- **v1.0.0**: Initial release with PostgreSQL/MySQL support
- **v1.1.0**: Added retry logic and improved error handling
- **v1.2.0**: Enhanced reporting and cleanup features
