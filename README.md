### Clone repository specific branch
`git clone https://github.com/482solutions/ElectrodoDoc-network.git -b HLF_v_2_2_11 --single-branch`

### Download binaries
```
cd ElectrodoDoc-network

wget https://github.com/hyperledger/fabric/releases/download/v2.2.11/hyperledger-fabric-linux-amd64-2.2.11.tar.gz

tar xf hyperledger-fabric-linux-amd64-2.2.11.tar.gz 

wget https://github.com/hyperledger/fabric-ca/releases/download/v1.5.6/hyperledger-fabric-ca-linux-amd64-1.5.6.tar.gz

tar xf hyperledger-fabric-ca-linux-amd64-1.5.6.tar.gz

```
### Run Hypereledger Fabric network
```bash
cd test-network

./network.sh up createChannel -ca -c mychannel -s couchdb -verbose

./network.sh deployCC -ccn wodencc -ccp ../contracts/ -ccl node
```

### Stop Hyperledger Fabric network
```
cd test-network

./network.sh down
```
