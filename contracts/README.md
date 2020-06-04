# Fabric woden (chain codes and network configuration)

# Fabric-core contracts



These smart contracts implement the logic of the blockchain. File System contract

 store information about files and folders in blockchain.




## Getting Started



First you need to run the heperledger fabric blockchain, install and 

instantiate chaincode. For details see `[Fabric-shim tutorial](https://fabric-shim.github.io/master/tutorial-using-contractinterface.html). After this

 the chaincode can be invoked with command:`

```

+peer chaincode invoke --orderer oredererHost:port --channelID mychannel -c '{"Args":["contractClassName:contractFunction"]}' -n contractName

```

`contractClassName`'s are: `org.fabric.filesystemcontract`;

`contractName`- the name given to the contract during installation.



## File System contract API



#### saveFolder ( folderName, folderHash)

Save information about folder

*Returns*:

Folder descriptor stored on blockchain: ```{ folderName, folderHash, reedUsers, writeUsers, ownerId}```

#### getFolder(folderHash)

Provides information about the folder with the given hash

*Returns*:

Folder descriptor in format```{ folderName, folderHash, reedUsers, writeUsers, ownerId}```

#### saveFile (fileName, fileHash, fileCID)

Save information about file and it versions(CID) 

*Returns*:

File descriptor stored on blockchain: ```{ fileName, fileHash, versions, reedUsers, writeUsers, ownerId}```

#### updateFile (fileHash, fileCID)

Save information about file versions(CID) 

*Returns*:

File descriptor updated on blockchain: ```{ fileName, fileHash, versions, reedUsers, writeUsers, ownerId}```

#### getFile(fileHash)

Provides information about the file with the given hash

*Returns*:

Folder descriptor in format```{ fileName, fileHash, versions, reedUsers, writeUsers, ownerId}```
