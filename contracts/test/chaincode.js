'use strict';

const shim = require('fabric-shim');
const contracts = require('../src');


const fileSystem = new contracts.contracts[0]();

class Chaincode {
    /**
     * manual initialization and inheritance - temporarily.
     * It will be further refactored
     */
    constructor() {
        this.saveFolder = fileSystem.saveFolder.bind(this);
        this.getFolder = fileSystem.getFolder;
        this.saveFile = fileSystem.saveFile.bind(this);
        this.updateFile = fileSystem.updateFile.bind(this);
        this.getFile = fileSystem.getFile;
        this.changeOwnership = fileSystem.changeOwnership.bind(this)
        this.changePermissions = fileSystem.changePermissions.bind(this)
        this.revokePermissions = fileSystem.revokePermissions.bind(this)
        this.getFolderTree = fileSystem.getFolderTree.bind(this)
        this.createVoting = fileSystem.createVoting.bind(this)
        this.getVoting = fileSystem.getVoting.bind(this)
        this.updateVoting = fileSystem.updateVoting.bind(this)

    }

    async Init(stub) {
        console.info('=========== Instantiating chaincode ===========');
        const args = stub.getArgs();
        await this.initLedger(stub, args);
        return shim.success(Buffer.from(JSON.stringify({ args })));
    }

    async Invoke(stub) {
        let ret = stub.getFunctionAndParameters();
        console.info(
            `\n========== Invoke chaincode function ${ret.fcn} ============`
        );
        console.info(`           with params: ${ret.params}`);
        let method = this[ret.fcn];
        if (!method) {
            console.error('no function of name:' + ret.fcn + ' found');
            throw new Error('Received unknown function ' + ret.fcn + ' invocation');
        }
        try {
            let payload = await method({ stub }, ...ret.params);
            console.info(
                `========== Function ${ret.fcn} invokation completed ============\n`
            )
            return shim.success(payload);
        } catch (err) {
            console.log(err);
            return shim.error(err);
        }
    }

    async initLedger(stub, args) {
        console.info('============= START : Initialize Ledger ===========');
        let folder = {
            folderName: 'testname',
            folderHash: 'testhash',
            reedUsers: ['testarrayreed'],
            writeUsers: ['testarraywrite'],
            ownerId: 'admin'
        };
        await stub.putState(
            'fileSystem',
            Buffer.from(JSON.stringify(folder))
        );
        console.info('============= END : Initialize Ledger ===========');
    }
}

exports.Chaincode = Chaincode;