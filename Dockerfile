FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    python3 \
    python3-pip \
    curl \
    gnupg \
    && docker-php-ext-install zip mysqli pdo pdo_mysql

# Install Node.js (Latest LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy application source
COPY . /var/www/html

# Configure Apache DocumentRoot to point to project root (or specific subfolder if needed)
# Default is /var/www/html which matches our XAMPP structure (ap ide root)

# Fix permissions for storage (crucial for file creation)
# We assume server/storage is where workspaces are.
RUN mkdir -p server/storage/workspaces \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/server/storage

# Install PHP dependencies if you had composer (optional, added for completeness)
# COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
# RUN composer install

# Expose port 80
EXPOSE 80

# Environment variables to help terminal
ENV PATH="/var/www/html/node_modules/.bin:${PATH}"
