# AdTip AWS Deployment Guide - Complete EC2 Setup

## 🎯 **Overview**

This guide covers deploying the AdTip React Native backend and supporting services on AWS EC2, with focus on scalability, security, and cost optimization for a social media platform.

---

## 🏗️ **AWS Architecture Overview**

### **Recommended Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   CloudFront    │    │      Route 53   │                │
│  │   (CDN/Cache)   │    │   (DNS/Domain)  │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                         │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Application     │    │   Load Balancer │                │
│  │ Load Balancer   │    │   (ALB/NLB)     │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                         │
│  ┌─────────────────────────────────────────┐                │
│  │            EC2 Instances                │                │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │                │
│  │  │ Web/API │  │ Socket  │  │ Media   │ │                │
│  │  │ Server  │  │ Server  │  │ Process │ │                │
│  │  └─────────┘  └─────────┘  └─────────┘ │                │
│  └─────────────────────────────────────────┘                │
│           │                                                  │
│  ┌─────────────────────────────────────────┐                │
│  │              Databases                  │                │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │                │
│  │  │   RDS   │  │ ElastiC │  │ S3/R2   │ │                │
│  │  │ (MySQL) │  │ (Redis) │  │ (Files) │ │                │
│  │  └─────────┘  └─────────┘  └─────────┘ │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖥️ **EC2 Instance Configuration**

### **Instance Types by Use Case**

#### **1. Web/API Server (Primary Application)**
- **Recommended**: `t3.medium` (2 vCPU, 4GB RAM) - Development
- **Production**: `c5.large` (2 vCPU, 4GB RAM) - Better CPU performance
- **High Traffic**: `c5.xlarge` (4 vCPU, 8GB RAM) - Scale up as needed

#### **2. Socket.IO Server (Real-time Features)**
- **Recommended**: `t3.small` (2 vCPU, 2GB RAM) - Development
- **Production**: `c5.large` (2 vCPU, 4GB RAM) - Better network performance

#### **3. Media Processing Server (Video/Image)**
- **Recommended**: `c5.large` (2 vCPU, 4GB RAM) - Development
- **Production**: `c5.2xlarge` (8 vCPU, 16GB RAM) - CPU intensive tasks

### **Storage Configuration**
```bash
# Root Volume: 20GB gp3 SSD (OS and applications)
# Data Volume: 100GB gp3 SSD (logs, temp files, cache)
# Backup Volume: 50GB gp3 SSD (database backups)
```

---

## 🚀 **Step-by-Step EC2 Setup**

### **Step 1: Launch EC2 Instance**

#### **1.1 Choose AMI**
```bash
# Recommended: Ubuntu Server 22.04 LTS
# AMI ID: ami-0c02fb55956c7d316 (us-east-1)
# Reason: Better Node.js support, frequent security updates
```

#### **1.2 Configure Instance**
```bash
# Instance Type: t3.medium (for development)
# Key Pair: Create new or use existing
# Security Group: Create custom (see security section)
# Storage: 
#   - Root: 20GB gp3
#   - Additional: 100GB gp3 (for data)
```

#### **1.3 Security Group Configuration**
```bash
# Inbound Rules:
# SSH (22) - Your IP only
# HTTP (80) - 0.0.0.0/0
# HTTPS (443) - 0.0.0.0/0
# Custom TCP (3000) - Load Balancer only
# Custom TCP (8080) - Load Balancer only (Socket.IO)
# Custom TCP (5432) - Database subnet only

# Outbound Rules:
# All traffic - 0.0.0.0/0 (for package downloads, API calls)
```

### **Step 2: Initial Server Setup**

#### **2.1 Connect and Update**
```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git htop nginx certbot python3-certbot-nginx
```

#### **2.2 Install Node.js and PM2**
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
pm2 --version   # Should show 5.x.x
```

#### **2.3 Setup Application Directory**
```bash
# Create application directory
sudo mkdir -p /var/www/adtip
sudo chown ubuntu:ubuntu /var/www/adtip

# Create logs directory
sudo mkdir -p /var/log/adtip
sudo chown ubuntu:ubuntu /var/log/adtip
```

---

## 📦 **Application Deployment**

### **Step 3: Deploy Backend Code**

#### **3.1 Clone Repository**
```bash
cd /var/www/adtip

# Clone your backend repository
git clone https://github.com/your-org/adtip-backend.git .

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env
nano .env  # Configure your environment variables
```

#### **3.2 Environment Configuration**
```bash
# /var/www/adtip/.env
NODE_ENV=production
PORT=3000
SOCKET_PORT=8080

# Database Configuration
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=3306
DB_NAME=adtip_production
DB_USER=adtip_user
DB_PASSWORD=your-secure-password

# Redis Configuration (ElastiCache)
REDIS_HOST=your-elasticache-endpoint.amazonaws.com
REDIS_PORT=6379

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_BUCKET_NAME=adtip-media
CLOUDFLARE_REGION=auto

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# API Keys
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
GOOGLE_ADS_CLIENT_ID=your-google-ads-client-id
```

#### **3.3 PM2 Configuration**
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'adtip-api',
      script: './server.js',
      instances: 2,  // Use 2 instances for load balancing
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/adtip/api-error.log',
      out_file: '/var/log/adtip/api-out.log',
      log_file: '/var/log/adtip/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'adtip-socket',
      script: './socket-server.js',
      instances: 1,  // Socket.IO should run single instance with sticky sessions
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: '/var/log/adtip/socket-error.log',
      out_file: '/var/log/adtip/socket-out.log',
      log_file: '/var/log/adtip/socket-combined.log',
      time: true,
      max_memory_restart: '512M'
    }
  ]
};
```

#### **3.4 Start Application**
```bash
# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions to run the generated command with sudo

# Check status
pm2 status
pm2 logs  # View logs
```

---

## 🌐 **Nginx Configuration**

### **Step 4: Setup Reverse Proxy**

#### **4.1 Nginx Configuration**
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/adtip
```

```nginx
# /etc/nginx/sites-available/adtip
upstream api_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream socket_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name api.theadtip.in theadtip.in;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API routes
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Socket.IO routes
    location /socket.io/ {
        proxy_pass http://socket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Socket.IO specific settings
        proxy_buffering off;
        proxy_redirect off;
    }
    
    # Health check
    location /health {
        proxy_pass http://api_backend/health;
        access_log off;
    }
    
    # Static files (if any)
    location /static/ {
        alias /var/www/adtip/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # File upload size
    client_max_body_size 100M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

#### **4.2 Enable Site and SSL**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/adtip /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d api.theadtip.in -d theadtip.in

# Test SSL renewal
sudo certbot renew --dry-run
```

---

## 🗄️ **Database Setup**

### **Step 5: RDS MySQL Configuration**

#### **5.1 Create RDS Instance**
```bash
# Via AWS CLI (or use AWS Console)
aws rds create-db-instance \
    --db-instance-identifier adtip-production \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --engine-version 8.0.35 \
    --master-username adtip_admin \
    --master-user-password YourSecurePassword123! \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids sg-your-security-group \
    --db-subnet-group-name your-db-subnet-group \
    --backup-retention-period 7 \
    --multi-az \
    --storage-encrypted \
    --deletion-protection
```

#### **5.2 Database Security Group**
```bash
# Inbound Rules for RDS Security Group:
# MySQL/Aurora (3306) - EC2 Security Group only
# No outbound rules needed
```

#### **5.3 Database Migration**
```bash
# On EC2 instance, run database migrations
cd /var/www/adtip

# Install MySQL client
sudo apt install -y mysql-client

# Test connection
mysql -h your-rds-endpoint.amazonaws.com -u adtip_admin -p

# Run migrations (adjust based on your migration system)
npm run migrate:production
```

### **Step 6: ElastiCache Redis Setup**

#### **6.1 Create ElastiCache Cluster**
```bash
# Via AWS CLI
aws elasticache create-cache-cluster \
    --cache-cluster-id adtip-redis \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --num-cache-nodes 1 \
    --security-group-ids sg-your-redis-security-group \
    --cache-subnet-group-name your-cache-subnet-group
```

#### **6.2 Redis Security Group**
```bash
# Inbound Rules for Redis Security Group:
# Custom TCP (6379) - EC2 Security Group only
```

---

## 📊 **Monitoring & Logging**

### **Step 7: CloudWatch Setup**

#### **7.1 Install CloudWatch Agent**
```bash
# Download and install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Create CloudWatch configuration
sudo nano /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

```json
{
  "metrics": {
    "namespace": "AdTip/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/adtip/*.log",
            "log_group_name": "/aws/ec2/adtip",
            "log_stream_name": "{instance_id}/application"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/adtip",
            "log_stream_name": "{instance_id}/nginx-access"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/ec2/adtip",
            "log_stream_name": "{instance_id}/nginx-error"
          }
        ]
      }
    }
  }
}
```

#### **7.2 Start CloudWatch Agent**
```bash
# Start the agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Enable on boot
sudo systemctl enable amazon-cloudwatch-agent
```

---

## 🔒 **Security Best Practices**

### **Step 8: Security Hardening**

#### **8.1 Firewall Configuration**
```bash
# Install and configure UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow specific ports
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow from 10.0.0.0/8 to any port 3000  # Internal ALB access
sudo ufw allow from 10.0.0.0/8 to any port 8080  # Internal ALB access

# Check status
sudo ufw status verbose
```

#### **8.2 SSH Hardening**
```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
# Port 22 (or change to non-standard port)
# MaxAuthTries 3
# ClientAliveInterval 300
# ClientAliveCountMax 2

# Restart SSH
sudo systemctl restart ssh
```

#### **8.3 Automatic Security Updates**
```bash
# Install unattended upgrades
sudo apt install -y unattended-upgrades

# Configure automatic updates
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Enable automatic updates
sudo systemctl enable unattended-upgrades
sudo systemctl start unattended-upgrades
```

---

## 📈 **Scaling & Performance**

### **Step 9: Auto Scaling Setup**

#### **9.1 Create AMI from Configured Instance**
```bash
# Via AWS CLI
aws ec2 create-image \
    --instance-id i-your-instance-id \
    --name "adtip-production-v1.0" \
    --description "AdTip production server with all configurations"
```

#### **9.2 Launch Template**
```bash
# Create launch template for auto scaling
aws ec2 create-launch-template \
    --launch-template-name adtip-production \
    --launch-template-data '{
        "ImageId": "ami-your-created-ami",
        "InstanceType": "t3.medium",
        "KeyName": "your-key-pair",
        "SecurityGroupIds": ["sg-your-security-group"],
        "UserData": "base64-encoded-startup-script",
        "IamInstanceProfile": {
            "Name": "EC2-CloudWatch-Role"
        }
    }'
```

#### **9.3 Auto Scaling Group**
```bash
# Create auto scaling group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name adtip-production-asg \
    --launch-template LaunchTemplateName=adtip-production,Version=1 \
    --min-size 1 \
    --max-size 5 \
    --desired-capacity 2 \
    --vpc-zone-identifier "subnet-12345,subnet-67890" \
    --target-group-arns "arn:aws:elasticloadbalancing:region:account:targetgroup/adtip-api/1234567890123456"
```

---

## 💰 **Cost Optimization**

### **Monthly Cost Estimates (US East)**

#### **Development Environment**
- **EC2 t3.medium**: $30/month
- **RDS db.t3.micro**: $15/month
- **ElastiCache t3.micro**: $15/month
- **ALB**: $20/month
- **Data Transfer**: $10/month
- **Total**: ~$90/month

#### **Production Environment**
- **EC2 c5.large (2 instances)**: $140/month
- **RDS db.t3.small (Multi-AZ)**: $50/month
- **ElastiCache t3.small**: $30/month
- **ALB**: $20/month
- **CloudFront**: $10/month
- **Data Transfer**: $50/month
- **Total**: ~$300/month

### **Cost Optimization Tips**
1. **Reserved Instances**: Save 30-60% on EC2 costs
2. **Spot Instances**: Use for non-critical workloads
3. **S3 Intelligent Tiering**: Automatic cost optimization for media files
4. **CloudWatch Logs Retention**: Set appropriate retention periods
5. **Auto Scaling**: Scale down during low traffic periods

---

## 🎯 **Frontend Developer Focus Areas**

### **What You Need to Know About AWS**

#### **1. API Endpoints**
- Understand how your React Native app connects to AWS-hosted APIs
- Learn about HTTPS/SSL certificates and secure connections
- Know how to handle API errors and timeouts

#### **2. Media Delivery**
- CloudFront CDN for fast image/video delivery
- Presigned URLs for secure media access
- Image optimization and responsive loading

#### **3. Real-time Features**
- WebSocket connections through Load Balancer
- Socket.IO scaling considerations
- Connection handling and reconnection logic

#### **4. Monitoring & Debugging**
- CloudWatch logs for debugging API issues
- Performance monitoring and alerting
- Error tracking and user experience metrics

#### **5. Deployment Pipeline**
- CI/CD integration with AWS CodePipeline
- Automated testing and deployment
- Environment management (dev/staging/production)

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Domain name configured in Route 53
- [ ] SSL certificates obtained and configured
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Security groups properly configured
- [ ] Backup strategy implemented

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Monitoring and alerting configured
- [ ] Log aggregation working
- [ ] Auto scaling policies tested
- [ ] Disaster recovery plan documented
- [ ] Performance benchmarks established

This comprehensive guide provides everything needed to deploy and scale the AdTip application on AWS EC2, with focus on security, performance, and cost optimization.