'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class Market extends Contract {

    constructor() {
        super('org.fabric.marketcontract');
    }

    async instantiate(ctx) {
        const initialPrice = 1;
        await ctx.stub.putState('woden',  'Welcome to chaincode');
    }

    async saveFolder(ctx, name, hash) {
        const identity = new ClientIdentity(ctx.stub);
        const userId = identity.getID();
        let folder = {
            folderName: name,
            folderHash: hash,
            reedUsers: [],
            writeUsers: [],
            ownerId: userId
        };
        await ctx.stub.putState(hash, Buffer.from(JSON.stringify(folder)));
        return JSON.stringify(folder)
    }

    async getFolder(ctx, hash) {
        let folderAsBytes = await ctx.stub.getState(hash);
        if (!folderAsBytes || folderAsBytes.toString().length <= 0) {
            throw new Error('Folder with this hash does not exist: ');
        }
        return JSON.parse(folderAsBytes.toString());
    }

    async saveFile(ctx, name, hash, cid) {
        const identity = new ClientIdentity(ctx.stub);
        const userId = identity.getID();
        let file = {
            fileName: name,
            fileHash: hash,
            versions: [],
            reedUsers: [],
            writeUsers: [],
            ownerId: userId
        };
        file.versions.push(cid);
        await ctx.stub.putState(hash, Buffer.from(JSON.stringify(file)));
        return JSON.stringify(file)
    }

    async updateFile(ctx, hash, cid) {
        let fileAsBytes = await ctx.stub.getState(hash);
        if (!fileAsBytes || fileAsBytes.toString().length <= 0) {
            throw new Error('File with this hash does not exist: ');
        }
        let file = JSON.parse(fileAsBytes.toString());
        file.versions.push(cid)
        await ctx.stub.putState(hash, Buffer.from(JSON.stringify(file)));
        return JSON.stringify(file)
    }

    async getFile(ctx, hash) {
        let fileAsBytes = await ctx.stub.getState(hash);
        if (!fileAsBytes || fileAsBytes.toString().length <= 0) {
            throw new Error('Folder with this hash does not exist: ');
        }
        return JSON.parse(fileAsBytes.toString());
    }
}


module.exports = Market;