# Fabric CA

## Prerequisites

You will need Docker and Docker Compose.

## Bootstrapping Fabric CA server

1. Change values in `./data/fabric-ca-server-config.yaml` to the ones you are
   going to use.
2. Run `docker-compose up -d`. This will bootstrap Fabric CA.

## Data location

- All of the Fabric CA data is located under `./data`. Fabric CA configuration
  file is created here and will be used from this location in the future.

## Firewall setup

- You need to open port 7054: `sudo ufw allow 7054/tcp`.

## Default passwords

- The default password for the `admin` identity account is `password`.
