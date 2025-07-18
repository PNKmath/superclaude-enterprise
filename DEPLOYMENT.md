# SuperClaude Enterprise Deployment Guide

## Overview

This guide provides instructions for deploying SuperClaude Enterprise in various environments, ensuring proper Python and SuperClaude detection across different setups.

## Python Detection Strategy

SuperClaude Enterprise uses a sophisticated Python detection system that checks multiple sources in priority order:

### 1. Environment Variable (Highest Priority)
```bash
export SUPERCLAUDE_PYTHON=/path/to/your/python
```

This allows users to explicitly specify which Python interpreter to use. This is the recommended approach for production deployments.

### 2. Configuration File
The system checks for Python path in the configuration file:
- `~/.claude/enterprise/config/config.yaml`
- Project-specific `.claude/settings.json`

### 3. Active Virtual Environment
If you're in an activated virtual environment:
```bash
source venv/bin/activate
# The system will automatically detect $VIRTUAL_ENV/bin/python
```

### 4. Common Virtual Environment Locations
The system automatically checks these directories:
- `./venv/bin/python`
- `./.venv/bin/python`
- `../venv/bin/python`
- `../.venv/bin/python`

### 5. System Python
As a fallback, the system checks common system Python locations:
- `python3`
- `python`
- `/usr/bin/python3`
- `/usr/local/bin/python3`

## Deployment Scenarios

### 1. Local Development
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install SuperClaude
pip install SuperClaude

# Run installer
./install-enterprise.sh
```

### 2. Docker Deployment
```dockerfile
FROM python:3.9

# Install dependencies
RUN pip install SuperClaude

# Set environment variable
ENV SUPERCLAUDE_PYTHON=/usr/local/bin/python

# Copy and install SuperClaude Enterprise
COPY . /app/superclaude-enterprise
WORKDIR /app/superclaude-enterprise
RUN ./install-enterprise.sh
```

### 3. System-wide Installation
```bash
# Install SuperClaude globally
sudo pip install SuperClaude

# Set environment variable system-wide
echo 'export SUPERCLAUDE_PYTHON=/usr/bin/python3' >> /etc/profile.d/superclaude.sh

# Install SuperClaude Enterprise
./install-enterprise.sh
```

### 4. Cloud Deployment (AWS/GCP/Azure)

#### Using User Data Script
```bash
#!/bin/bash
# Install Python and dependencies
apt-get update && apt-get install -y python3 python3-pip nodejs npm

# Install SuperClaude
pip3 install SuperClaude

# Set environment variable
export SUPERCLAUDE_PYTHON=/usr/bin/python3

# Clone and install SuperClaude Enterprise
git clone https://github.com/your-org/superclaude-enterprise.git
cd superclaude-enterprise
./install-enterprise.sh
```

### 5. CI/CD Pipeline Integration

#### GitHub Actions
```yaml
- name: Setup SuperClaude Enterprise
  run: |
    # Create virtual environment
    python -m venv venv
    source venv/bin/activate
    
    # Install SuperClaude
    pip install SuperClaude
    
    # Set Python path
    echo "SUPERCLAUDE_PYTHON=${{ github.workspace }}/venv/bin/python" >> $GITHUB_ENV
    
    # Install SuperClaude Enterprise
    ./install-enterprise.sh
```

## Configuration Management

### Environment-specific Configuration

Create environment-specific configuration files:

```bash
# Development
config/environments/development.yaml

# Staging
config/environments/staging.yaml

# Production
config/environments/production.yaml
```

### Setting Python Path via Configuration

In `~/.claude/enterprise/config/config.yaml`:
```yaml
superclaude:
  pythonPath: /opt/python/bin/python3
  path: /opt/superclaude
```

## Troubleshooting

### SuperClaude Not Found

If you see "SuperClaude not found" errors:

1. **Check Python Installation**
   ```bash
   # Test each Python to find SuperClaude
   python3 -c "import SuperClaude; print('Found')"
   /usr/bin/python3 -c "import SuperClaude; print('Found')"
   ```

2. **Set Environment Variable**
   ```bash
   # Find Python with SuperClaude
   which python3
   
   # Set environment variable
   export SUPERCLAUDE_PYTHON=/path/to/correct/python
   ```

3. **Verify MCP Configuration**
   ```bash
   # Check Claude configuration
   cat ~/.claude.json | jq '.mcpServers["superclaude-enterprise"]'
   ```

### Multiple Python Installations

For systems with multiple Python versions:

```bash
# List all Python installations
ls -la /usr/bin/python*

# Test each one
for py in /usr/bin/python*; do
  echo "Testing $py:"
  $py -c "import SuperClaude" 2>/dev/null && echo "  ✓ Has SuperClaude"
done
```

## Best Practices

1. **Always Use Virtual Environments**
   - Isolates dependencies
   - Easier to manage versions
   - Portable across systems

2. **Set SUPERCLAUDE_PYTHON in Production**
   - Provides explicit control
   - Prevents detection issues
   - Faster startup

3. **Document Your Python Setup**
   - Include Python version
   - List installed packages
   - Note any special configurations

4. **Use Configuration Management**
   - Ansible, Puppet, or Chef
   - Consistent across environments
   - Version controlled

## Security Considerations

1. **Validate Python Path**
   - Ensure Python path is trusted
   - Avoid user-writable directories
   - Check file permissions

2. **Environment Variable Security**
   - Don't expose sensitive paths
   - Use secure configuration management
   - Audit access logs

## Performance Optimization

1. **Cache Python Detection**
   - Detection runs once per session
   - Results are cached in memory
   - Restart required for changes

2. **Pre-set Python Path**
   - Skips detection process
   - Faster initialization
   - Recommended for production

## Monitoring

### Health Checks
```bash
# Check if SuperClaude is accessible
curl http://localhost:PORT/health

# Verify Python detection
superclaude-enterprise status
```

### Logging
- Python detection logs: Check stderr during initialization
- MCP server logs: `~/.claude/logs/mcp-server.log`
- Application logs: Configure in `config.yaml`

## Migration Guide

### From Local to Production

1. **Export Configuration**
   ```bash
   # Export current Python path
   echo $SUPERCLAUDE_PYTHON > python-path.txt
   
   # Copy configuration
   cp ~/.claude/enterprise/config/config.yaml ./config-backup.yaml
   ```

2. **Update Production Settings**
   - Set SUPERCLAUDE_PYTHON
   - Update config files
   - Test thoroughly

### Version Upgrades

1. **Test in Staging First**
2. **Backup Current Setup**
3. **Run Update Script**
4. **Verify Python Detection**

## Support

For deployment issues:
1. Check logs for Python detection errors
2. Verify SuperClaude installation
3. Test with explicit SUPERCLAUDE_PYTHON
4. Open issue with full error logs