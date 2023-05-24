
`git clone https://github.com/482solutions/ElectrodoDoc-network.git -b HLF_v_2_2_11 --single-branch`


```
cd ELECTRODO

wget https://github.com/hyperledger/fabric/releases/download/v2.2.11/hyperledger-fabric-linux-amd64-2.2.11.tar.gz

tar xf hyperledger-fabric-linux-amd64-2.2.11.tar.gz 

wget https://github.com/hyperledger/fabric-ca/releases/download/v1.5.6/hyperledger-fabric-ca-linux-amd64-1.5.6.tar.gz

tar xf hyperledger-fabric-ca-linux-amd64-1.5.6.tar.gz

```

```bash
cd test-network

# modify 'network.sh' :
nano network.sh

# change 'IMAGETAG' to :
IMAGETAG="2.2.11"
# and 'CA_IMAGETAG' to :
CA_IMAGETAG="1.5.6"


./network.sh up createChannel -ca -c mychannel -s couchdb -verbose

./network.sh deployCC -ccn wodencc -ccp ../contracts/ -ccl node
```


```
cd test-network

./network.sh down
```
