# ElectrodoDoc (chain codes and network configuration)

## Prerequisites

- Docker and Docker Compose
- Fabric binaries ([downloaded by `./byfn.sh` to the `./fabric-samples/bin`](https://hyperledger-fabric.readthedocs.io/en/release-1.4/build_network.html))

## How to run:

```
- ./deploy.sh
```

If you need to clear all data please run: 
```
- docker ps -a -q | xargs -n 1 -P 8 -I {} docker stop {}
- docker ps -a -q | xargs -n 1 -P 8 -I {} docker rm {} 
- docker volume prune -f
- docker system prune -a -f
```

## How to test:
```
- cd contracts
- nvm use 8.9.0
- npm i
- npm test
```
## Client configuration

Some operations may be performed only while using the `admin` MSP. The MSP to be
used can be set with the `CORE_PEER_MSPCONFIGPATH` environment variable. To
connect to an appropriate peer (for the `peer` command) you must use the
configuration from `<repository_root>/network/peer/data`. The path must be set
with the `FABRIC_CFG_PATH` environment variable.

## Network configuration

- [Certification authority](./network/ca/README.md)
- [Orderer](./network/orderer/README.md)
- [Peer](./network/peer/README.md)
- [Test channel](./network/testchannel/README.md)
- [Chaincode](./contracts/README.md)
