# Fabric Peer

## Prerequisites

You will need Docker and Docker Compose.

## Starting up

*Note that you may need to change some configurations*. Look through
`data/fabric-peer` to examine the configuration prior to going any further.

- You will need to register an identity of type `peer` with the CA.
  `fabric-ca-client register --id.name peername --id.affiliation 482solutions.prj-fabric --id.secret passwd --id.type peer` (this should be done from the machine with an
  enrolled administrative account).
- Build MSP:
  - Then enroll this identity from the host where you are going to deploy the
    peer `fabric-ca-client enroll --csr.cn peername -u http://peername:passwd@ca-address:7054`
  - Copy `~/.fabric-ca-client/msp` to `./data`.
  - Create `./data/msp/admincerts` and copy the contents of
    `./data/msp/admincerts` here.
  - Copy the configuration from `<repository root>/network/msp/config.yaml`.
- Run `docker-compose up -d`.
