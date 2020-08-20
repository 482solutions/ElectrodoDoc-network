#!/bin/bash
docker network rm front_default
docker network create --driver=bridge  --subnet=172.28.0.0/16  --ip-range=172.28.0.0/24   --gateway=172.28.0.254  front_default
echo -----Run Fabric CA Server
cd ./network/ca
docker-compose up -d
cd ../../
echo -----Enroll admin msp
docker run --rm --network front_default --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-v $(pwd)/data:/etc/hyperledger/fabric-ca-server hyperledger/fabric-ca:1.4 \
sh -c 'sleep 5 && fabric-ca-client enroll --url http://admin:password@172.28.0.3:7054'
echo -----Backup admin msp
mkdir -p ./admin/msp
cp -r ./data/msp ./admin/
echo -----Create node account
docker run --rm --network front_default --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-v $(pwd)/data:/etc/hyperledger/fabric-ca-server hyperledger/fabric-ca:1.4 \
sh -c 'sleep 5 && fabric-ca-client register --id.name peer1 --id.affiliation 482solutions.prj-fabric --id.secret passwd --id.type peer'
echo -----Enroll node account
docker run --rm --network front_default --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-v $(pwd)/data:/etc/hyperledger/fabric-ca-server hyperledger/fabric-ca:1.4 \
sh -c 'sleep 5 && fabric-ca-client enroll -u http://peer1:passwd@172.28.0.3:7054'
echo -----Build node MSP
cp -r ./data/msp ./network/peer/data/
mkdir -p ./network/peer/data/msp/admincerts
cp ./admin/msp/signcerts/cert.pem ./network/peer/data/msp/admincerts/
cp ./network/msp/config.yaml ./network/peer/data/msp/
# Change values in all Certificate fields of ./data/msp/config.yaml to the actual name of the certificate in ./data/msp/cacerts
# Change peer settings
# In ./data/core.yaml change the following settings:
# peer.address to the actual IP address of your node server
# If --id.name in "Create node account" was different from the provided in the tutorial, change peer.id to the actual peer name.
echo -----Run Fabric Peer Node
cd ./network/peer
docker-compose up -d
cd ../../
echo ----Update admin msp
rm -rf ./data/msp
cp -r ./admin/msp ./data/
echo -----Create node account
docker run --rm --network front_default --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-v $(pwd)/data:/etc/hyperledger/fabric-ca-server hyperledger/fabric-ca:1.4 \
sh -c 'sleep 5 && fabric-ca-client register --id.name orderer --id.affiliation 482solutions.prj-fabric --id.secret passwd --id.type peer'
echo -----Enroll node account
docker run --rm --network front_default --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-v $(pwd)/data:/etc/hyperledger/fabric-ca-server hyperledger/fabric-ca:1.4 \
sh -c 'sleep 5 && fabric-ca-client enroll -u http://orderer:passwd@172.28.0.3:7054'
echo -----Build orderer MSP
cp -r ./data/msp ./network/orderer/data/
mkdir -p ./network/orderer/data/msp/admincerts
cp ./admin/msp/signcerts/cert.pem ./network/orderer/data/msp/admincerts/
cp ./network/msp/config.yaml ./network/orderer/data/msp/
# Change values in all Certificate fields of ./data/msp/config.yaml to the actual name of the certificate in ./data/msp/cacerts
# Change orderer settings
# In ./data/configtx.yaml change the following:
# In Organizations[482solutions].AnchorPeers list the IP address of the previously created peer.
# In Profiles.SampleSingleMSPSolo.Orderer.Addresses fill in the IP address of the orderer service.
echo -----Run Fabric Peer Node
cd ./network/orderer
docker-compose up -d
cd ../../
echo ----Update admin msp
rm -rf ./data/msp
cp -r ./admin/msp ./data/
echo ----Change admin MSP
mkdir -p ./data/msp/admincerts
cp ./admin/msp/signcerts/cert.pem ./data/msp/admincerts
docker run --rm --network front_default --name cli \
-e "GOPATH=/opt/gopath" \
-e "CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock" \
-e "FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/network/peer/data" \
-e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/msp" \
-v $(pwd)/network/peer/data:/opt/gopath/src/github.com/hyperledger/fabric/network/peer/data \
-v $(pwd)/network/testchannel:/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/ \
-v $(pwd)/data/msp:/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/msp \
-v $(pwd)/contracts:/opt/gopath/src/github.com/hyperledger/fabric/contracts \
-w="/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/" \
hyperledger/fabric-tools:1.4 sh -c 'sleep 5 &&
echo ----Build the channel creation transaction &&
configtxgen -asOrg 482solutions -channelID testchannel -configPath $(pwd) -outputCreateChannelTx ./testchannel_create.pb -profile TestChannel &&
sleep 2 && echo ----Create the channel &&
peer channel create -c testchannel --file ./testchannel_create.pb --orderer 172.28.0.5:7050 &&
sleep 2 && echo ----Join the existing nodes to the channel &&
peer channel join --orderer 172.28.0.5:7050 --blockpath ./testchannel.block &&
sleep 2 && echo ----Install chaincode on the node &&
peer chaincode install -l node -n wodencc -v 0.1 -p /opt/gopath/src/github.com/hyperledger/fabric/contracts &&
sleep 2 && echo ----Instantiate chaincode on the channel &&
peer chaincode instantiate -C testchannel -l node -n wodencc -v 0.1 -P "AND(\"482solutions.peer\")" -c "{\"Args\": [\"org.fabric.wodencontract:instantiate\"]}"'
# docker stop $(docker ps -a -q) && docker rm $(docker ps -a -q) && docker volume rm ca_postgres_data
# docker-compose -f cli.yaml up -d
# docker exec -it cli bash
# docker stop cli

#sudo docker run --rm --networkfront_default --name cli -e "GOPATH=/opt/gopath" -e "CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock" -e "FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/network/peer/data" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/msp" -v $(pwd)/network/peer/data:/opt/gopath/src/github.com/hyperledger/fabric/network/peer/data -v $(pwd)/network/testchannel:/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/ -v $(pwd)/data/msp:/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/msp -v $(pwd)/contracts:/opt/gopath/src/github.com/hyperledger/fabric/contracts -w="/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/" hyperledger/fabric-tools:1.4 sh -c 'peer chaincode install -l node -n wodencc -v 0.1 -p /opt/gopath/src/github.com/hyperledger/fabric/contracts && sleep 2 && echo ----Instantiate chaincode on the channel && peer chaincode instantiate -C testchannel -l node -n wodencc -v 0.1 -P "AND(\"482solutions.peer\")" -c "{\"Args\": [\"org.fabric.wodencontract:instantiate\"]}"'