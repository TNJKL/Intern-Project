-- Enable remote connections for all users
-- This script is automatically executed on container startup
-- Append to pg_hba.conf to allow connections from any host

RUN echo 'host all all 0.0.0.0/0 scram-sha-256' >> /var/lib/postgresql/data/pg_hba.conf && \
    echo 'host all all ::0/0 scram-sha-256' >> /var/lib/postgresql/data/pg_hba.conf && \
    pg_ctl reload -D /var/lib/postgresql/data || true
