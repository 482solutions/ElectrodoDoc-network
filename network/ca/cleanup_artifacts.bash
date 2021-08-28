cd network/ca/data/ && sudo rm -rf msp/ ca-cert.pem IssuerPublicKey IssuerRevocationPublicKey  tls-cert.pem  && docker rm $(docker ps -a -q) && docker volume prune -f 
