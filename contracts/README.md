# Woden (chain codes and network configuration)

# Fabric-core contracts



These smart contracts implement the logic of the blockchain. File System contract

 store information about files and folders in blockchain.




## Getting Started

To update chaincode run:
#####You need to change only version (-v)!
```shell script
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
hyperledger/fabric-tools:1.4 sh -c 'sleep 2 && echo ----Install chaincode on the node && peer chaincode install -l node -n wodencc -v 1.5 -p /opt/gopath/src/github.com/hyperledger/fabric/contracts && peer chaincode upgrade -l node -n wodencc -v 1.5 -p /opt/gopath/src/github.com/hyperledger/fabric/contracts -C testchannel -P "AND(\"482solutions.peer\")" -c "{\"Args\": [\"org.fabric.wodencontract:instantiate\"]}"'
```

If you don`t use deploy.sh:
First you need to run the heperledger fabric blockchain, install and 

instantiate chaincode. For details see `[Fabric-shim tutorial](https://fabric-shim.github.io/master/tutorial-using-contractinterface.html). 


After this the chaincode can be invoked with command:`

```

+peer chaincode invoke --orderer orederer <host>:<port> --channelID mychannel -c '{"Args":["contractClassName:contractFunction"]}' -n contractName

```

`contractClassName`'s are: `org.fabric.filesystemcontract`;

`contractName`- the name given to the contract during installation.



## File System contract API



#### saveFolder ( folderName, folderHash, parentFolderHash)

Save information about folder

*Returns*:

Folder descriptor stored on blockchain: ```{ folderName, folderHash, parentFolderHash, files, folders, reedUsers, writeUsers, ownerId }```

#### getFolder(folderHash)

Provides information about the folder with the given hash

*Returns*:

Folder descriptor in format```{ folderName, folderHash, parentFolderHash, files, folders, reedUsers, writeUsers, ownerId }```

#### saveFile (fileName, fileHash, fileCID, parentFolderHash, fileType)

Save information about file and it versions(CID) 

*Returns*:

File descriptor stored on blockchain: ```{ fileName, fileHash, fileType, parentFolderHash, versions, reedUsers, writeUsers, voting, ownerId }```

#### updateFile (fileHash, fileCID)

Save information about file versions(CID) 

*Returns*:

File descriptor updated on blockchain: ```{ ..., versions }```

#### getFile(fileHash)

Provides information about the file with the given hash

*Returns*:

File descriptor in format```{ fileName, fileHash, fileType, parentFolderHash, versions, reedUsers, writeUsers, voting, ownerId }```

#### changeOwnership(hash, newOwner, folderHashThatShare, folderHashForShare)

Change owner of file or folder by it hash

*Returns*:

Object descriptor updated on blockchain```{ ..., ownerId}```

#### changePermissions( hash, userLoginForShare, permissionType, folderHashForShare )

Change permissions of file or folder by it hash

*Returns*:

Object descriptor updated on blockchain```{ ..., reedUsers, writeUsers }```

#### revokePermissions( hash, userLoginForRevoke, permissionType, folderHashForRevoke )

Revoke permissions of file or folder by it hash

*Returns*:

Object descriptor updated on blockchain```{ ..., reedUsers, writeUsers }```

#### getFolderTree(folderHash)

Provides information about all folders that user have

*Returns*:

Folders descriptor in format```{ folderName, folderHash, folders [{foldername, folderHash, folders...}] }```


#### createVoting ( fileHash, votingHash, dueDate, variantsArray, excludeUsersArray, description, parentFolderHash )

Create voting of a file in system

*Returns*:

Voting descriptor stored on blockchain: ```{ votingName, votingHash, fileHash,  fileVersionTime, dueDate, variants, voters, description, status }```

#### updateVoting ( votingHash, variant )

Update voting of a file in system

*Returns*:

Voting descriptor stored on blockchain: ```{ ..., variants }```

#### getVoting ( votingHash, rootFolderHash )

Get all voting that user have in system 

*Returns*:

Voting descriptor in format: ```[{ votingName, votingHash, fileHash,  fileVersionTime, dueDate, variants, voters, description, status }, ...]```
