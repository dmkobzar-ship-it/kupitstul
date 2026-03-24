FROM php:8.2-fpm

# System dependencies
RUN apt-get update && apt-get install -y \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    intl \
    zip \
    opcache

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# PHP config
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "date.timezone=Europe/Moscow" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "upload_max_filesize=10M" >> /usr/local/etc/php/conf.d/custom.ini \
    && echo "post_max_size=12M" >> /usr/local/etc/php/conf.d/custom.ini

WORKDIR /var/www/backend

# Install dependencies
COPY backend/composer.json ./
RUN composer install --no-dev --optimize-autoloader 2>/dev/null || true

# Copy backend code
COPY backend/ ./
RUN composer install --no-dev --optimize-autoloader

# Permissions
RUN chown -R www-data:www-data /var/www/backend

EXPOSE 9000
CMD ["php-fpm"]
