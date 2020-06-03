# Fabric woden (chain codes and network configuration)

## Prerequisites

- Docker and Docker Compose
- Fabric binaries ([downloaded by `./byfn.sh` to the `./fabric-samples/bin`](https://hyperledger-fabric.readthedocs.io/en/release-1.4/build_network.html))

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
