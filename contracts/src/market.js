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
      sharedFiles: [],
      sharedFolders: [],
      readUsers: [],
      writeUsers: [],
      ownerId: userId
    };

    if (parentHash !== 'root') {
      folder = {
        folderName: name,
        folderHash: hash,
        parentFolderHash: parentHash,
        files: [],
        folders: [],
        readUsers: [],
        writeUsers: [],
        ownerId: userId
      };
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
      for (let i = 0; i < parentFolder.folders.length; i++) {
        if (parentFolder.folders[i].hash === hash) {
          return { message: 'Folder already exist' };
        }
      }
      parentFolder.folders.push({ name, hash })
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
    let files = []
    let folders = []
    for (let i = 0; i < folder.folders.length; i++) {
      let folderAsBytes = await ctx.stub.getState(folder.folders[i].hash);
      folders.push(JSON.parse(folderAsBytes.toString()))
    }
    for (let j = 0; j < folder.files.length; j++) {
      let fileAsBytes = await ctx.stub.getState(folder.files[j].hash);
      files.push(JSON.parse(fileAsBytes.toString()))
    }

    return { folder, folders, files };
  }

  async saveFile(ctx, name, hash, cid, parentHash, type) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    const parentFolderAsBytes = await ctx.stub.getState(parentHash);
    if (!parentFolderAsBytes || parentFolderAsBytes.toString().length <= 0) {
      return { message: 'Parent folder with this hash does not exist' };
    }
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
    for (let i = 0; i < parentFolder.files.length; i++) {
      if (parentFolder.files[i].hash === hash) {
        return { message: 'File already exist' };
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
      return { message: 'File with this hash does not exist' };
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
      return { message: 'File with this hash does not exist' };
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


  async changeOwnership(ctx, hash, newOwner, hashThatShared, hashForShare) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    let objectAsBytes = await ctx.stub.getState(hash);
    if (!objectAsBytes || objectAsBytes.toString().length <= 0) {
      return { message: 'File with this hash does not exist' };
    }
    let object = JSON.parse(objectAsBytes.toString());
    if (object.ownerId !== userId) {
      return { message: 'You does not have permission' };
    }
    object.ownerId = newOwner
    object.readUsers.push(userId)
    object.writeUsers.push(userId)

    if (hashThatShared && hashForShare) {
      let folderForShareAsBytes = await ctx.stub.getState(hashForShare);
      if (!folderForShareAsBytes || folderForShareAsBytes.toString().length <= 0) {
        return { message: 'Folder for share does not exist' };
      }
      let folderThatSharedAsBytes = await ctx.stub.getState(hashThatShared);
      if (!folderThatSharedAsBytes || folderThatSharedAsBytes.toString().length <= 0) {
        return { message: 'Folder that shared does not exist' };
      }
      let folderThatShared = JSON.parse(folderThatSharedAsBytes.toString());
      let folderForShare = JSON.parse(folderForShareAsBytes.toString());


      if (object.files || object.folders) {
        for (let i = 0; i < folderForShare.folders.length; i++) {
          if (folderForShare.folders[i].hash === hash) {
            return { message: 'Folder for share already include this file' };
          }
        }
        folderForShare.folders.push({ name: object.folderName, hash: object.folderHash })
        folderThatShared.folders.splice(folderThatShared.folders.findIndex(v => v.hash === object.folderHash && v.name === object.folderName),
          1)
        folderThatShared.sharedFolders.push({ name: object.folderName, hash: object.folderHash })
      } else if (object.versions) {
        for (let i = 0; i < folderForShare.files.length; i++) {
          if (folderForShare.files[i].hash === hash) {
            return { message: 'Folder for share already include this file' };
          }
        }
        folderForShare.files.push({ name: object.fileName, hash: object.fileHash })
        folderThatShared.files.splice(folderThatShared.files.findIndex(v => v.hash === object.fileHash && v.name === object.fileName),
          1);
        folderThatShared.sharedFiles.push({ name: object.fileName, hash: object.fileHash })
      }
      await ctx.stub.putState(hashThatShared, Buffer.from(JSON.stringify(folderThatShared)));
      await ctx.stub.putState(hashForShare, Buffer.from(JSON.stringify(folderForShare)));
    }
    if (object.files || object.folders) {
      for (let i = 0; i < object.files.length; i++) {
        let response = await this.changeOwnership(ctx, object.files[i].hash, newOwner, null, null)
        console.log(response)
      }
      for (let j = 0; j < object.folders.length; j++) {
        let response = await this.changeOwnership(ctx, object.folders[j].hash, newOwner, null, null)
        console.log(response)
      }
    }
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(object)));
    return JSON.stringify(object)
  }

  async changePermissions(ctx, hash, login, action, permissions, hashForShare) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    let objectAsBytes = await ctx.stub.getState(hash);
    if (!objectAsBytes || objectAsBytes.toString().length <= 0) {
      return { message: 'File with this hash does not exist' };
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
        return { message: 'You does not have permission' };
      }
    }
    if (hashForShare) {
      let folderForShareAsBytes = await ctx.stub.getState(hashForShare);
      if (!folderForShareAsBytes || folderForShareAsBytes.toString().length <= 0) {
        return { message: 'Folder for share does not exist' };
      }
      let folderForShare = JSON.parse(folderForShareAsBytes.toString());
      if (object.files || object.folders) {
        for (let i = 0; i < folderForShare.folders.length; i++) {
          if (folderForShare.folders[i].hash === hash) {
            return { message: 'Folder for share already include this file' };
          }
        }
        folderForShare.sharedFolders.push({ name: object.folderName, hash: object.folderHash })
      } else if (object.versions) {

        folderForShare.sharedFiles.push({ name: object.fileName, hash: object.fileHash })
      }
      await ctx.stub.putState(hashForShare, Buffer.from(JSON.stringify(folderForShare)));
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
        let response = await this.changePermissions(ctx,
          object.files[i].hash,
          login,
          action,
          permissions,
          null)
        console.log(response)
      }
      for (let j = 0; j < object.folders.length; j++) {
        let response = await this.changePermissions(ctx,
          object.folders[j].hash,
          login,
          action,
          permissions,
          null)
        console.log(response)
      }
    }
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(object)));
    return JSON.stringify(object)
  }
}

module.exports = Market;