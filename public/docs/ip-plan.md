# IP Plan for "Fiks ferdig" Todo App

## Network Overview

This IP plan outlines the network architecture for the "Fiks ferdig" Todo application, providing a structured approach to network segmentation, security, and scalability.

## Network Segmentation

The network is divided into three key segments to enhance security through isolation:

| Network | CIDR Range | Purpose |
|---------|------------|---------|
| DMZ Network | 192.168.1.0/24 | External-facing services (Nginx, load balancers) |
| Application Network | 192.168.2.0/24 | Application servers (Node.js) |
| Database Network | 192.168.3.0/24 | Database servers (MongoDB) |

## IP Address Allocation

### DMZ Network (192.168.1.0/24)

| IP Address | Hostname | Description |
|------------|----------|-------------|
| 192.168.1.1 | gateway.dmz.local | Network gateway |
| 192.168.1.10 | nginx.dmz.local | Nginx reverse proxy server |
| 192.168.1.11 | backup-nginx.dmz.local | Backup Nginx server (failover) |
| 192.168.1.254 | - | Reserved for network equipment |

### Application Network (192.168.2.0/24)

| IP Address | Hostname | Description |
|------------|----------|-------------|
| 192.168.2.1 | gateway.app.local | Network gateway |
| 192.168.2.10 | app1.app.local | Primary Node.js application server |
| 192.168.2.11 | app2.app.local | Secondary Node.js application server (scaling) |
| 192.168.2.254 | - | Reserved for network equipment |

### Database Network (192.168.3.0/24)

| IP Address | Hostname | Description |
|------------|----------|-------------|
| 192.168.3.1 | gateway.db.local | Network gateway |
| 192.168.3.10 | mongo1.db.local | Primary MongoDB server |
| 192.168.3.11 | mongo2.db.local | Secondary MongoDB server (replication) |
| 192.168.3.254 | - | Reserved for network equipment |

## Domain Name Configuration

| Domain | Target | Description |
|--------|--------|-------------|
| eksamen.[yourname].ikt-fag.no | 192.168.1.10 | Main application domain |
| todo.[yourname].ikt-fag.no | 192.168.1.10 | Alternate application domain |

## Firewall Rules Overview

### External Firewall (Internet → DMZ)

| Source | Destination | Port | Protocol | Action | Description |
|--------|-------------|------|----------|--------|-------------|
| Any | 192.168.1.10 | 80 | TCP | Allow | HTTP (redirected to HTTPS) |
| Any | 192.168.1.10 | 443 | TCP | Allow | HTTPS |
| Any | 192.168.1.10 | 22 | TCP | Allow | SSH (restricted to specific IPs) |
| Any | Any | Any | Any | Deny | Default deny rule |

### DMZ → Application Network

| Source | Destination | Port | Protocol | Action | Description |
|--------|-------------|------|----------|--------|-------------|
| 192.168.1.10 | 192.168.2.10-11 | 3000 | TCP | Allow | Node.js application traffic |
| Any | Any | Any | Any | Deny | Default deny rule |

### Application Network → Database Network

| Source | Destination | Port | Protocol | Action | Description |
|--------|-------------|------|----------|--------|-------------|
| 192.168.2.10-11 | 192.168.3.10-11 | 27017 | TCP | Allow | MongoDB traffic |
| Any | Any | Any | Any | Deny | Default deny rule |

## Network Expansion Plan

This IP plan allows for future expansion:

- The DMZ network can support up to 254 devices
- The Application network can be expanded to include additional app servers
- The Database network supports the addition of more database servers for sharding

## Backup and Disaster Recovery

Network configuration backups are stored in the following locations:
- Local backup server (192.168.1.20)
- Offsite backup via secure VPN tunnel

## Maintenance and Updates

- Scheduled maintenance window: Sundays 02:00-04:00 AM
- Emergency updates: Require change management approval
- Network monitoring: Zabbix server at 192.168.1.15
