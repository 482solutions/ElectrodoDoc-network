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
-v $(pwd)/admin_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/tls-cert.pem:/etc/hyperledger/fabric-ca-server/tls-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client enroll --url https://admin:password@ca.482.solutions:7054'



echo "${yellow} -----4.Register orderer account----- ${reset}"


docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
-v $(pwd)/admin_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/ca-cert.pem:/etc/hyperledger/fabric-ca-server/ca-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client register --id.name orderer --id.affiliation 482solutions.prj-fabric --id.secret passwd --id.type orderer'


echo "${yellow} -----5.Enroll orderer account----- ${reset}"

docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
-v $(pwd)/network/orderer/orderer_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/ca-cert.pem:/etc/hyperledger/fabric-ca-server/ca-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client enroll -u https://orderer:passwd@ca.482.solutions:7054'

echo "${yellow} -----6.1.Generating the orderer-tls certificates----- ${reset}"
docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
-v $(pwd)/network/orderer/orderer_data/tls:/etc/hyperledger/fabric-ca-server/tls \
-v $(pwd)/network/ca/ca_data/ca-cert.pem:/etc/hyperledger/fabric-ca-server/ca-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client enroll -u https://orderer:passwd@ca.482.solutions:7054 -M /etc/hyperledger/fabric-ca-server/tls --enrollment.profile tls --csr.hosts orderer.482.solutions'

cp ${PWD}/network/orderer/orderer_data/tls/tlscacerts/* ${PWD}/network/orderer/orderer_data/tls/ca.crt
cp ${PWD}/network/orderer/orderer_data/tls/signcerts/*  ${PWD}/network/orderer/orderer_data/tls/server.crt
cp ${PWD}/network/orderer/orderer_data/tls/keystore/*   ${PWD}/network/orderer/orderer_data/tls/server.key


echo "${yellow} -----6.2.Creating orderer chennal genesis block----- ${reset}"

mkdir -p ./network/ordererchannel/peer/msp/cacerts
cp -r ./network/orderer/orderer_data/msp/cacerts ./network/ordererchannel/peer/msp/
mkdir -p ./network/ordererchannel/orderer/msp/cacerts
cp -r ./network/orderer/orderer_data/msp/cacerts ./network/ordererchannel/orderer/msp/

mkdir -p ./network/ordererchannel/orderer/msp/admincerts
cp ./admin_data/msp/signcerts/cert.pem ./network/ordererchannel/orderer/msp/admincerts
mkdir -p ./network/ordererchannel/peer/msp/admincerts
cp ./admin_data/msp/signcerts/cert.pem ./network/ordererchannel/peer/msp/admincerts

docker run --rm --network hlf2 --name cli \
-e "GOPATH=/opt/gopath" \
-e "CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock" \
-e "FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/network/ordererchannel" \
-v $(pwd)/network/ordererchannel:/opt/gopath/src/github.com/hyperledger/fabric/network/ordererchannel/ \
-w="/opt/gopath/src/github.com/hyperledger/fabric/network/ordererchannel/" \
hyperledger/fabric-tools:1.4 sh -c 'sleep 5 && echo ----Build the channel creation transaction && configtxgen -channelID ordererchannel -outputBlock ordererchannel.block -profile OrgOrdererGenesis'


echo "${yellow} -----7.Run Fabric Orderer Node----- ${reset}"

mkdir -p ./network/orderer/orderer_data/msp/admincerts
cp ./admin_data/msp/signcerts/cert.pem ./network/orderer/orderer_data/msp/admincerts/

docker-compose -f ./network/orderer/orderer_docker-compose.yaml up -d

# cp --verbose ./network/ca/ca_data/ca-cert.pem  ./network/ordererchannel/orderer/msp/cacerts
# cp --verbose ./network/ca/ca_data/ca-cert.pem  ./network/ordererchannel/peer/msp/cacerts

# mkdir -p ./network/ordererchannel/peer/msp/admincerts
# cp --verbose ./admin_data/msp/signcerts/cert.pem ./network/ordererchannel/peer/msp/admincerts/

# mkdir -p ./network/ordererchannel/orderer/msp/admincerts
# cp --verbose ./admin_data/msp/signcerts/cert.pem ./network/ordererchannel/orderer/msp/admincerts/


echo "${yellow} -----8.Register peer account----- ${reset}"

docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
-v $(pwd)/admin_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/ca-cert.pem:/etc/hyperledger/fabric-ca-server/ca-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client register --id.name peer1 --id.affiliation 482solutions.prj-fabric --id.secret passwd --id.type peer'

echo "${yellow} -----9.Enroll peer account----- ${reset}"

docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
-v $(pwd)/network/peer/peer_data:/etc/hyperledger/fabric-ca-server \
-v $(pwd)/network/ca/ca_data/ca-cert.pem:/etc/hyperledger/fabric-ca-server/ca-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client enroll -u https://peer1:passwd@ca.482.solutions:7054'


echo "${yellow} -----6.1.Generating the peer-tls certificates----- ${reset}"
docker run --rm --network hlf2 --name fabric_ca_client \
-e "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server" \
-e "FABRIC_CA_CLIENT_TLS_CERTFILES=/etc/hyperledger/fabric-ca-server/ca-cert.pem" \
-v $(pwd)/network/peer/peer_data/tls:/etc/hyperledger/fabric-ca-server/tls \
-v $(pwd)/network/ca/ca_data/ca-cert.pem:/etc/hyperledger/fabric-ca-server/ca-cert.pem hyperledger/fabric-ca:1.4.9 \
sh -c 'sleep 5 && fabric-ca-client enroll -u https://peer1:passwd@ca.482.solutions:7054 -M /etc/hyperledger/fabric-ca-server/tls --enrollment.profile tls --csr.hosts peer1.482.solutions'

cp ${PWD}/network/peer/peer_data/tls/tlscacerts/* ${PWD}/network/peer/peer_data/tls/ca.crt
cp ${PWD}/network/peer/peer_data/tls/signcerts/*  ${PWD}/network/peer/peer_data/tls/server.crt
cp ${PWD}/network/peer/peer_data/tls/keystore/*   ${PWD}/network/peer/peer_data/tls/server.key



echo "${yellow} -----10.Build node MSP----- ${reset}"

mkdir -p ./network/peer/peer_data/msp/admincerts
cp ./admin_data/msp/signcerts/cert.pem ./network/peer/peer_data/msp/admincerts/

# mkdir -p ./network/peer/peer_data/msp/cacerts
# cp ./network/ca/ca_data/ca-cert.pem  ./network/peer/peer_data/msp/cacerts

echo "${yellow} -----11.Run Fabric Peer Node----- ${reset}"

docker-compose -f ./network/peer/peer1_docker-compose.yaml up -d

exit(0)

docker run --rm --network hlf2 --name cli \
-e "GOPATH=/opt/gopath" \
-e "CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock" \
-e "FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/" \
-w="/opt/gopath/src/github.com/hyperledger/testchannel/" \
-v $(pwd)/network/peer/peer_data/:/opt/gopath/src/github.com/hyperledger/fabric/ \
-v $(pwd)/network/testchannel:/opt/gopath/src/github.com/hyperledger/testchannel/ hyperledger/fabric-tools:1.4 \
sh -c 'sleep 5 && configtxgen -asOrg 482solutions -channelID testchannel -configPath $(pwd) -outputCreateChannelTx ./testchannel_create.tx -profile TestChannel'








echo "${yellow} ----Update admin msp----- ${reset}"


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
# echo ----Build the channel creation transaction &&
# configtxgen -asOrg 482solutions -channelID testchannel -configPath $(pwd) -outputCreateChannelTx ./testchannel_create.pb -profile TestChannel &&
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



docker run --rm --network hlf2 --name cli \
-e "GOPATH=/opt/gopath" \
-e "CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock" \
-e "FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/" \
-w="/opt/gopath/src/github.com/hyperledger/testchannel/" \
-v $(pwd)/network/peer/peer_data/:/opt/gopath/src/github.com/hyperledger/fabric/ \
-v $(pwd)/network/testchannel:/opt/gopath/src/github.com/hyperledger/testchannel/ hyperledger/fabric-tools:1.4 \
sh -c 'sleep 5 && peer channel create -c testchannel --file ./testchannel_create.tx --orderer orderer.482.solutions:7050 --outputBlock ./channel1.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/tls/ca.crt'