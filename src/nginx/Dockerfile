FROM nginx:alpine

# Self-signed TLS certificate for local/dev HTTPS termination at the gateway.
# Generated at build time since this stack has no real domain name.
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/selfsigned.key \
        -out /etc/nginx/ssl/selfsigned.crt \
        -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=transcendence/CN=localhost"