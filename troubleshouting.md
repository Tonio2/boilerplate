# Docker Issues

## Error: Port 5432 Already in Use

### Error Message
```
Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint boilerplate-postgres (...): failed to bind host port for 0.0.0.0:5432:172.18.0.2:5432/tcp: address already in use
```

### Problem Description
This error occurs when Docker tries to start a PostgreSQL container that wants to use port 5432, but that port is already being used by another process on your host machine. Port 5432 is the default PostgreSQL port.

---

### Solutions

#### Solution 1: Stop the Conflicting Process (Recommended if you have PostgreSQL installed locally)

##### Check what's using port 5432
```bash
sudo lsof -i :5432
```

or

```bash
sudo netstat -tulpn | grep :5432
```

##### If it's a local PostgreSQL service
```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Optionally, disable it from starting on boot
sudo systemctl disable postgresql
```

##### If it's another Docker container
```bash
# List running containers
docker ps

# Stop the conflicting container
docker stop <container_id_or_name>
```

---

#### Solution 2: Change the Port Mapping in docker-compose.yml

If you need both PostgreSQL instances running (local and Docker), modify your `docker-compose.yml` file:

```yaml
services:
  postgres:
    image: postgres:latest
    ports:
      - "5433:5432"  # Changed from 5432:5432
    # ... other configuration
```

Then update your application's database connection string to use port `5433` instead of `5432`.

---

## Prevention

- If you're developing with Docker PostgreSQL, consider disabling your local PostgreSQL service permanently
- Use non-standard ports (like 5433) in docker-compose.yml to avoid conflicts
- Document port usage in your project README to help team members avoid conflicts
