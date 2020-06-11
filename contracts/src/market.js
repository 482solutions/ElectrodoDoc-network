'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class Market extends Contract {

  constructor() {
    super('org.fabric.marketcontract');
  }

  async instantiate(ctx) {
    await ctx.stub.putState('woden', 'Welcome to chaincode');
  }

  async saveFolder(ctx, name, hash, parentHash) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;

    let folder = {
      folderName: name,
      folderHash: hash,
      parentFolderHash: parentHash,
      files: [],
      folders: [],
      readUsers: [],
      writeUsers: [],
      ownerId: userId
    };

    if (parentHash !== null) {
      const parentFolderAsBytes = await ctx.stub.getState(parentHash);
      let parentFolder = JSON.parse(parentFolderAsBytes.toString());
      if (parentFolder.ownerId !== userId) {
        let havePermission = false
        for (let i = 0; i < parentFolder.writeUsers.length; i++) {
          if (parentFolder.writeUsers[i] === userId) {
            havePermission = true
            break
          }
        }
        if (!havePermission) {
          return { message: 'You does not have permission: ' };
        }
      }
      parentFolder.folders.push({ name, hash })
      console.log(parentFolder)
      await ctx.stub.putState(parentHash, Buffer.from(JSON.stringify(parentFolder)));
      await ctx.stub.putState(hash, Buffer.from(JSON.stringify(folder)));
      return JSON.stringify(parentFolder)
    }

    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(folder)));
    return JSON.stringify(folder)
  }

  async getFolder(ctx, hash) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;

    let folderAsBytes = await ctx.stub.getState(hash);
    if (!folderAsBytes || folderAsBytes.toString().length <= 0) {
      throw new Error('Folder with this hash does not exist: ');
    }
    const folder = JSON.parse(folderAsBytes.toString())
    if (folder.ownerId !== userId) {
      let havePermission = false
      for (let i = 0; i < folder.readUsers.length; i++) {
        if (folder.readUsers[i] === userId) {
          havePermission = true
          break
        }
      }
      if (!havePermission) {
        return { message: 'You does not have permission: ' };
      }
    }
    return folder;
  }

  async saveFile(ctx, name, hash, cid, parentHash, type) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    const parentFolderAsBytes = await ctx.stub.getState(parentHash);
    let parentFolder = JSON.parse(parentFolderAsBytes.toString());
    if (parentFolder.ownerId !== userId) {
      let havePermission = false
      for (let i = 0; i < parentFolder.writeUsers.length; i++) {
        if (parentFolder.writeUsers[i] === userId) {
          havePermission = true
          break
        }
      }
      if (!havePermission) {
        return { message: 'You does not have permission: ' };
      }
    }
    let file = {
      fileName: name,
      fileHash: hash,
      fileType: type,
      parentFolderHash: parentHash,
      versions: [],
      readUsers: [],
      writeUsers: [],
      ownerId: userId
    };
    const version = {
      cid, time: Math.floor(new Date() / 1000), user: userId
    };
    file.versions.push(version);
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(file)));
    parentFolder.files.push({ name, hash })
    console.log(parentFolder)
    await ctx.stub.putState(parentHash, Buffer.from(JSON.stringify(parentFolder)));
    return JSON.stringify(parentFolder)
  }

  async updateFile(ctx, hash, cid) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    let fileAsBytes = await ctx.stub.getState(hash);
    if (!fileAsBytes || fileAsBytes.toString().length <= 0) {
      throw new Error('File with this hash does not exist: ');
    }
    let file = JSON.parse(fileAsBytes.toString());
    if (file.ownerId !== userId) {
      let havePermission = false
      for (let i = 0; i < file.writeUsers.length; i++) {
        if (file.writeUsers[i] === userId) {
          havePermission = true
          break
        }
      }
      if (!havePermission) {
        return { message: 'You does not have permission: ' };
      }
    }
    const version = {
      cid, time: Math.floor(new Date() / 1000), user: userId
    };
    file.versions.push(version)
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(file)));
    return JSON.stringify(file)
  }

  async getFile(ctx, hash) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    let fileAsBytes = await ctx.stub.getState(hash);
    if (!fileAsBytes || fileAsBytes.toString().length <= 0) {
      throw new Error('Folder with this hash does not exist: ');
    }
    const file = JSON.parse(fileAsBytes.toString());
    if (file.ownerId !== userId) {
      let havePermission = false
      for (let i = 0; i < file.readUsers.length; i++) {
        if (file.readUsers[i] === userId) {
          havePermission = true
          break
        }
      }
      if (!havePermission) {
        return { message: 'You does not have permission: ' };
      }
    }
    return file;
  }


  async changeOwnership(ctx, hash, newOwner) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    let objectAsBytes = await ctx.stub.getState(hash);
    if (!objectAsBytes || objectAsBytes.toString().length <= 0) {
      throw new Error('File with this hash does not exist: ');
    }
    let object = JSON.parse(objectAsBytes.toString());
    if (object.ownerId !== userId) {
      throw new Error('You does not have permission: ');
    }
    object.ownerId = newOwner
    object.readUsers.push(userId)
    object.writeUsers.push(userId)
    if (object.files || object.folders) {
      for (let i = 0; i < object.files.length; i++) {
        let response = await this.changeOwnership(ctx, object.files[i].hash, newOwner)
        console.log(response)
      }
      for (let j = 0; j < object.folders.length; j++) {
        let response = await this.changeOwnership(ctx, object.folders[j].hash, newOwner)
        console.log(response)
      }
    }
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(object)));
    return JSON.stringify(object)
  }

  async changePermissions(ctx, hash, login, action, permissions) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    let objectAsBytes = await ctx.stub.getState(hash);
    if (!objectAsBytes || objectAsBytes.toString().length <= 0) {
      throw new Error('File with this hash does not exist: ');
    }
    let object = JSON.parse(objectAsBytes.toString());
    if (object.ownerId !== userId) {
      let havePermission = false
      for (let i = 0; i < object.writeUsers.length; i++) {
        if (object.writeUsers[i] === userId) {
          havePermission = true
          break
        }
      }
      if (!havePermission) {
        return { message: 'You does not have permission: ' };
      }
    }
    if (action === 'allow') {
      if (permissions === 'read') {
        object.readUsers.push(login)
      }
      if (permissions === 'write') {
        object.readUsers.push(login)
        object.writeUsers.push(login)
      }
    }
    if (action === 'disallow') {
      if (permissions === 'read') {
        const indexRead = object.readUsers.indexOf(login);
        if (indexRead > -1) {
          object.readUsers.splice(indexRead, 1);
        }
        const indexWrite = object.writeUsers.indexOf(login);
        if (indexWrite > -1) {
          object.writeUsers.splice(indexWrite, 1);
        }
      }
      if (permissions === 'write') {
        const indexWrite = object.writeUsers.indexOf(login);
        if (indexWrite > -1) {
          object.writeUsers.splice(indexWrite, 1);
        }
      }
    }

    if (object.files || object.folders) {
      for (let i = 0; i < object.files.length; i++) {
        let response = await this.changePermissions(ctx, object.files[i].hash, login,action,  permissions)
        console.log(response)
      }
      for (let j = 0; j < object.folders.length; j++) {
        let response = await this.changePermissions(ctx, object.folders[j].hash, login, action, permissions)
        console.log(response)
      }
    }
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(object)));
    return JSON.stringify(object)
  }
}

module.exports = Market;