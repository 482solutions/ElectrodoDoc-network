#!/bin/bash

red=`tput setaf 1`
green=`tput setaf 2`
yellow=`tput setaf 3`
blue=`tput setaf 4`
magenta=`tput setaf 5`
cyan=`tput setaf 6`
reset=`tput sgr0`
#echo "${red}red text ${green}green text${reset}"

docker network rm hlf2
docker network create --driver=bridge  --subnet=172.28.0.0/16  --ip-range=172.28.0.0/24   --gateway=172.28.0.254  hlf2



echo "${yellow} -----1.Run Fabric CA Server----- ${reset}"

docker-compose -f ./network/ca/ca_docker-compose.yaml up -d



echo "${yellow} -----2.Enroll admin msp----- ${reset}"

while [ ! -f $(pwd)/network/ca/ca_data/tls-cert.pem ] 
do
    sleep 1
    echo "awaiting file tls-cert.pem"
done

docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/tls-cert.pem" \
-v $(pwd)/tmp_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/tls-cert.pem:/etc/hyperledger/fabric-ca-server/tls-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client enroll --url https://admin:password@ca.482.solutions:7054'



echo "${yellow} -----3.Backup admin msp----- ${reset}"

mkdir -p ./admin/msp
cp -r ./tmp_data/msp ./admin/ 
cp ./tmp_data/tls-cert.pem ./admin/tls-cert.pem



echo "${yellow} -----4.Register peer account----- ${reset}"

docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
-v $(pwd)/tmp_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/ca-cert.pem:/etc/hyperledger/fabric-ca-server/ca-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client register --id.name peer1 --id.affiliation 482solutions.prj-fabric --id.secret passwd --id.type peer'

echo "${yellow} -----5.Enroll peer account----- ${reset}"

docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
-v $(pwd)/tmp_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/ca-cert.pem:/etc/hyperledger/fabric-ca-server/ca-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client enroll -u https://peer1:passwd@ca.482.solutions:7054'

echo "${yellow} -----6.Build node MSP----- ${reset}"

cp -r ./tmp_data/msp ./network/peer/peer_data/
mkdir -p ./network/peer/peer_data/msp/admincerts
cp ./admin/msp/signcerts/cert.pem ./network/peer/peer_data/msp/admincerts/
cp ./network/msp/config.yaml ./network/peer/peer_data/msp/

#####END Refactored section#####

# Change values in all Certificate fields of ./data/msp/config.yaml to the actual name of the certificate in ./data/msp/cacerts
# Change peer settings
# In ./data/core.yaml change the following settings:
# peer.address to the actual IP address of your node server
# If --id.name in "Create node account" was different from the provided in the tutorial, change peer.id to the actual peer name.

echo "${yellow} -----7.Run Fabric Peer Node----- ${reset}"

### cd ./network/peer
### docker-compose up -d
### cd ../../
docker-compose -f ./network/peer/peer1_docker-compose.yaml up -d



### echo "${yellow} -----Update admin msp----- ${reset}"
### 
### rm -rf ./data/msp
### cp -r ./admin/msp ./data/



echo "${yellow} -----8.Register orderer account----- ${reset}"

docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/tls-cert.pem" \
-v $(pwd)/tmp_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/tls-cert.pem:/etc/hyperledger/fabric-ca-server/tls-cert.pem hyperledger/fabric-ca:1.4 \
sh -c 'sleep 5 && fabric-ca-client enroll --url https://admin:password@ca.482.solutions:7054'

docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
-v $(pwd)/tmp_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/ca-cert.pem:/etc/hyperledger/fabric-ca-server/ca-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client register --id.name orderer --id.affiliation 482solutions.prj-fabric --id.secret passwd --id.type orderer'


echo "${yellow} -----9.Enroll orderer account----- ${reset}"

docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
-v $(pwd)/tmp_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/ca-cert.pem:/etc/hyperledger/fabric-ca-server/ca-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client enroll -u https://orderer:passwd@ca.482.solutions:7054'


echo "${yellow} -----10.Build orderer MSP----- ${reset}"

cp -r ./tmp_data/msp ./network/orderer/orderer_data/
mkdir -p ./network/orderer/orderer_data/msp/admincerts
cp ./admin/msp/signcerts/cert.pem ./network/orderer/orderer_data/msp/admincerts/
cp ./network/msp/config.yaml ./network/orderer/orderer_data/msp/
# Change values in all Certificate fields of ./data/msp/config.yaml to the actual name of the certificate in ./data/msp/cacerts
# Change orderer settings
# In ./data/configtx.yaml change the following:
# In Organizations[482solutions].AnchorPeers list the IP address of the previously created peer.
# In Profiles.SampleSingleMSPSolo.Orderer.Addresses fill in the IP address of the orderer service.



echo "${yellow} -----11.Run Fabric Orderer Node----- ${reset}"

docker-compose -f ./network/orderer/orderer_docker-compose.yaml up -d
### 
### cd ./network/orderer
### docker-compose up -d
### cd ../../
echo "${yellow} ----Update admin msp----- ${reset}"

exit (0)


rm -rf ./data/msp
cp -r ./admin/msp ./data/
echo ----Change admin MSP
mkdir -p ./data/msp/admincerts
cp ./admin/msp/signcerts/cert.pem ./data/msp/admincerts
docker run --rm --network hlf2 --name cli \
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

#sudo docker run --rm --networkhlf2 --name cli -e "GOPATH=/opt/gopath" -e "CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock" -e "FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/network/peer/data" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/msp" -v $(pwd)/network/peer/data:/opt/gopath/src/github.com/hyperledger/fabric/network/peer/data -v $(pwd)/network/testchannel:/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/ -v $(pwd)/data/msp:/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/msp -v $(pwd)/contracts:/opt/gopath/src/github.com/hyperledger/fabric/contracts -w="/opt/gopath/src/github.com/hyperledger/fabric/network/testchannel/" hyperledger/fabric-tools:1.4 sh -c 'peer chaincode install -l node -n wodencc -v 0.1 -p /opt/gopath/src/github.com/hyperledger/fabric/contracts && sleep 2 && echo ----Instantiate chaincode on the channel && peer chaincode instantiate -C testchannel -l node -n wodencc -v 0.1 -P "AND(\"482solutions.peer\")" -c "{\"Args\": [\"org.fabric.wodencontract:instantiate\"]}"'