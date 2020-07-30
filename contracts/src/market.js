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
      ownerId: userId,
      sender: identity.cert.subject
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
        ownerId: userId,
        sender: identity.cert.subject
      };
      const parentFolderAsBytes = await ctx.stub.getState(parentHash);
      const parentFolder = JSON.parse(parentFolderAsBytes.toString());
      if (parentFolder.ownerId !== userId) {
        let havePermission = false
        for (let i = 0; i < parentFolder.writeUsers.length; i++) {
          if (parentFolder.writeUsers[i] === userId) {
            havePermission = true
            break
          }
        }
        if (!havePermission) {
          return { message: 'User does not have permission: ' };
        }
      }
      for (let i = 0; i < parentFolder.folders.length; i++) {
        if (parentFolder.folders[i].hash === hash) {
          return { message: 'Folder already exist' };
        }
      }

      folder.ownerId = parentFolder.ownerId
      folder.readUsers = parentFolder.readUsers
      folder.writeUsers = parentFolder.writeUsers
      parentFolder.folders.push({ name, hash })
      parentFolder.sender = identity.cert.subject
      await ctx.stub.putState(parentHash, Buffer.from(JSON.stringify(parentFolder)));
      await ctx.stub.putState(hash, Buffer.from(JSON.stringify(folder)));
      let files = []
      let folders = []
      for (let i = 0; i < parentFolder.folders.length - 1; i++) {
        let folderAsBytes = await ctx.stub.getState(parentFolder.folders[i].hash);
        folders.push(JSON.parse(folderAsBytes.toString()))
      }
      for (let j = 0; j < parentFolder.files.length; j++) {
        let fileAsBytes = await ctx.stub.getState(parentFolder.files[j].hash);
        files.push(JSON.parse(fileAsBytes.toString()))
      }
      folders.push(folder)
      return JSON.stringify({ parentFolder, folders, files })
    }

    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(folder)));
    return JSON.stringify(folder)
  }

  async getFolder(ctx, hash) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;

    let folderAsBytes = await ctx.stub.getState(hash);
    if (!folderAsBytes || folderAsBytes.toString().length <= 0) {
      throw new Error('Folder with this hash does not exist');
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
        return { message: 'User does not have permission' };
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
    if (folder.sharedFiles || folder.sharedFolders) {
      for (let i = 0; i < folder.sharedFolders.length; i++) {
        let folderAsBytes = await ctx.stub.getState(folder.sharedFolders[i].hash);
        folders.push(JSON.parse(folderAsBytes.toString()))
      }
      for (let j = 0; j < folder.sharedFiles.length; j++) {
        let fileAsBytes = await ctx.stub.getState(folder.sharedFiles[j].hash);
        files.push(JSON.parse(fileAsBytes.toString()))
      }
    }
    folder.sender = identity.cert.subject
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(folder)));
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
        return { message: 'User does not have permission: ' };
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
      voting: [],
      ownerId: userId,
      sender: identity.cert.subject
    };
    const version = {
      cid, time: Math.floor(new Date() / 1000), user: userId
    };
    file.ownerId = parentFolder.ownerId
    file.readUsers = parentFolder.readUsers
    file.writeUsers = parentFolder.writeUsers
    file.versions.push(version);
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(file)));
    parentFolder.files.push({ name, hash })
    parentFolder.sender = identity.cert.subject
    await ctx.stub.putState(parentHash, Buffer.from(JSON.stringify(parentFolder)));
    let files = []
    let folders = []
    for (let i = 0; i < parentFolder.folders.length; i++) {
      let folderAsBytes = await ctx.stub.getState(parentFolder.folders[i].hash);
      folders.push(JSON.parse(folderAsBytes.toString()))
    }
    for (let j = 0; j < parentFolder.files.length - 1; j++) {
      let fileAsBytes = await ctx.stub.getState(parentFolder.files[j].hash);
      files.push(JSON.parse(fileAsBytes.toString()))
    }
    files.push(file)
    return JSON.stringify({ parentFolder, folders, files })
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
        return { message: 'User does not have permission: ' };
      }
    }
    const version = {
      cid, time: Math.floor(new Date() / 1000), user: userId
    };
    file.versions.push(version)
    file.sender = identity.cert.subject
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
        return { message: 'User does not have permission: ' };
      }
    }
    file.sender = identity.cert.subject
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(file)));
    return file;
  }

  async changeOwnership(ctx, hash, newOwner, rootThatShared, hashForShare) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    let objectAsBytes = await ctx.stub.getState(hash);
    if (!objectAsBytes || objectAsBytes.toString().length <= 0) {
      return { message: 'File with this hash does not exist' };
    }
    let object = JSON.parse(objectAsBytes.toString());
    if (object.ownerId !== userId) {
      return { message: 'User does not have permission' };
    }
    if (object.ownerId === newOwner) {
      return { message: 'This user is the owner of this file' };
    }
    object.ownerId = newOwner
    object.readUsers.push(userId)
    object.writeUsers.push(userId)
    const hashThatShared = object.parentFolderHash

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
      let folderRootAsBytes = await ctx.stub.getState(rootThatShared);
      if (!folderRootAsBytes || folderRootAsBytes.toString().length <= 0) {
        return { message: 'Folder that shared does not exist' };
      }
      let folderRootThatShared = JSON.parse(folderRootAsBytes.toString());
      if (object.files || object.folders) {
        for (let i = 0; i < folderForShare.folders.length; i++) {
          if (folderForShare.folders[i].hash === hash) {
            return { message: 'Folder for share already include this file' };
          }
        }
        folderForShare.folders.push({ name: object.folderName, hash: object.folderHash })
        folderThatShared.folders.splice(folderThatShared.folders.findIndex(v => v.hash === object.folderHash && v.name === object.folderName),
          1);

        if (hashThatShared !== rootThatShared) {
          folderRootThatShared.sharedFolders.push({
            name: object.folderName,
            hash: object.folderHash
          })
          folderRootThatShared.sender = identity.cert.subject
          await ctx.stub.putState(rootThatShared,
            Buffer.from(JSON.stringify(folderRootThatShared)));
        } else {
          folderThatShared.sharedFolders.push({ name: object.folderName, hash: object.folderHash })
        }
      } else if (object.versions) {
        for (let i = 0; i < folderForShare.files.length; i++) {
          if (folderForShare.files[i].hash === hash) {
            return { message: 'Folder for share already include this file' };
          }
        }
        folderForShare.files.push({ name: object.fileName, hash: object.fileHash })
        folderThatShared.files.splice(folderThatShared.files.findIndex(v => v.hash === object.fileHash && v.name === object.fileName),
          1);
        if (hashThatShared !== rootThatShared) {

          folderRootThatShared.sender = identity.cert.subject
          await ctx.stub.putState(rootThatShared,
            Buffer.from(JSON.stringify(folderRootThatShared)));
        } else {
          folderThatShared.sharedFiles.push({ name: object.fileName, hash: object.fileHash })
        }

      }
      folderForShare.sender = identity.cert.subject
      folderThatShared.sender = identity.cert.subject
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
    object.sender = identity.cert.subject
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(object)));
    return JSON.stringify(object)
  }

  async changePermissions(ctx, hash, login, permissions, hashForShare) {
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
        return { message: 'User does not have permission' };
      }
    }
    if (object.ownerId === login) {
      return { message: 'This user is the owner of this file' }
    }
    if (permissions === 'write') {
      for (let i = 0; i < object.writeUsers.length; i++) {
        if (object.writeUsers[i] === login) {
          return { message: 'This user is the editor of this file' }
        }
      }
    }
    if (permissions === 'read') {
      for (let i = 0; i < object.readUsers.length; i++) {
        if (object.readUsers[i] === login) {
          return { message: 'This user is the viewer of this file' }
        }
      }
    }
    if (hashForShare) {
      let folderForShareAsBytes = await ctx.stub.getState(hashForShare);
      if (!folderForShareAsBytes || folderForShareAsBytes.toString().length <= 0) {
        return { message: 'Folder for share does not exist' };
      }
      let folderForShare = JSON.parse(folderForShareAsBytes.toString());
      if (object.files || object.folders) {

        if (folderForShare.folders.findIndex(v => v.hash === object.folderHash && v.name === object.folderName) > -1
          && object.writeUsers.indexOf(login) > -1) {
          return { message: 'Folder for share already include this file' };
        }
        if (object.readUsers.indexOf(login) === -1 && object.writeUsers.indexOf(login) === -1) {
          folderForShare.sharedFolders.push({ name: object.folderName, hash: object.folderHash })
        }
      } else if (object.versions) {
        if (object.readUsers.indexOf(login) === -1 && object.writeUsers.indexOf(login) === -1) {
          folderForShare.sharedFiles.push({ name: object.fileName, hash: object.fileHash })
        }
      }
      folderForShare.sender = identity.cert.subject
      await ctx.stub.putState(hashForShare, Buffer.from(JSON.stringify(folderForShare)));
    }
    if (permissions === 'read') {
      object.readUsers.push(login)
    }
    if (permissions === 'write') {
      if (object.readUsers.indexOf(login) === -1) {
        object.readUsers.push(login)
      }
      object.writeUsers.push(login)
    }
    if (object.files || object.folders) {
      for (let i = 0; i < object.files.length; i++) {
        let response = await this.changePermissions(ctx,
          object.files[i].hash,
          login,
          permissions,
          null)
        console.log(response)
      }
      for (let j = 0; j < object.folders.length; j++) {
        let response = await this.changePermissions(ctx,
          object.folders[j].hash,
          login,
          permissions,
          null)
        console.log(response)
      }
    }
    object.sender = identity.cert.subject
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(object)));
    return JSON.stringify(object)
  }

  async revokePermissions(ctx, hash, login, permissions, hashForShare) {
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
        return { message: 'User does not have permission' };
      }
    }

    if (permissions === 'read') {
      const indexRead = object.readUsers.indexOf(login);
      if (indexRead > -1) {
        object.readUsers.splice(indexRead, 1);
      } else {
        return { message: 'User does not have such permissions' };
      }
      const indexWrite = object.writeUsers.indexOf(login);
      if (indexWrite > -1) {
        object.writeUsers.splice(indexWrite, 1);
      }
      if (hashForShare) {
        let folderForShareAsBytes = await ctx.stub.getState(hashForShare);
        if (!folderForShareAsBytes || folderForShareAsBytes.toString().length <= 0) {
          return { message: 'Folder for share does not exist' };
        }
        let folderForShare = JSON.parse(folderForShareAsBytes.toString());
        if (object.files || object.folders) {
          folderForShare.sharedFolders.splice(folderForShare.sharedFolders.findIndex(v => v.hash === object.folderHash && v.name === object.folderName),
            1)
        } else if (object.versions) {
          folderForShare.sharedFiles.splice(folderForShare.sharedFiles.findIndex(v => v.hash === object.fileHash && v.name === object.fileName),
            1)
        }
        folderForShare.sender = identity.cert.subject
        await ctx.stub.putState(hashForShare, Buffer.from(JSON.stringify(folderForShare)));
      }
    }
    if (permissions === 'write') {
      const indexWrite = object.writeUsers.indexOf(login);
      if (indexWrite > -1) {
        object.writeUsers.splice(indexWrite, 1);
      } else {
        return { message: 'User does not have such permissions' };
      }
    }
    if (object.files || object.folders) {
      for (let i = 0; i < object.files.length; i++) {
        let response = await this.revokePermissions(ctx,
          object.files[i].hash,
          login,
          permissions,
          null)
        console.log(response)
      }
      for (let j = 0; j < object.folders.length; j++) {
        let response = await this.revokePermissions(ctx,
          object.folders[j].hash,
          login,
          permissions,
          null)
        console.log(response)
      }
    }
    object.sender = identity.cert.subject
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(object)));
    return JSON.stringify(object)
  }

  async getFolderTree(ctx, hash) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;

    let folderAsBytes = await ctx.stub.getState(hash);
    if (!folderAsBytes || folderAsBytes.toString().length <= 0) {
      throw new Error('Folder with this hash does not exist');
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
        return { message: 'User does not have permission' };
      }
    }
    const name = folder.folderName
    const fHash = folder.folderHash
    let folders = []
    for (let i = 0; i < folder.folders.length; i++) {
      let child = await this.getFolderTree(ctx, folder.folders[i].hash);
      folders.push(child)
    }
    folder.sender = identity.cert.subject
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(folder)));
    return { name, hash: fHash, folders };
  }

  async createVoting(ctx, hash, votingHash, dueDate, variants, excludeUsers, description, rootHash) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    const fileForVotingHash = await ctx.stub.getState(hash);
    if (!fileForVotingHash || fileForVotingHash.toString().length <= 0) {
      return { message: 'File with this hash does not exist' };
    }
    const fileForVoting = JSON.parse(fileForVotingHash.toString());
    if (fileForVoting.ownerId !== userId) {
      return { message: `User does not have permission` };
    }
    let voting = {
      votingName: fileForVoting.fileName,
      votingHash,
      versionTime: fileForVoting.versions[fileForVoting.versions.length - 1].time,
      dueDate,
      variants,
      voters: [],
      description,
      status: true,
      sender: identity.cert.subject
    };
    if (fileForVoting.writeUsers.length === 0 && fileForVoting.readUsers.length === 0) {
      return { message: 'You need to share this file with somebody' };
    }
    for (let i = 0; i < fileForVoting.writeUsers.length; i++) {
      voting.voters.push({ name: fileForVoting.writeUsers[i], vote: null })
    }
    for (let i = 0; i < fileForVoting.readUsers.length; i++) {
      if (voting.voters.findIndex(v => v.name === fileForVoting.readUsers[i]) === -1) {
        voting.voters.push({ name: fileForVoting.readUsers[i], vote: null })
      }
    }
    for (let i = 0; i < excludeUsers.length; i++) {
      voting.voters.splice(voting.voters.findIndex(v => v.name === excludeUsers[i] && v.vote === null),
        1)
    }
    if (voting.voters.length < 1){
      return { message: 'You can`t create voting without voters' };
    }

    fileForVoting.voting.push(voting.votingHash)
    fileForVoting.sender = identity.cert.subject
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(fileForVoting)));
    await ctx.stub.putState(votingHash, Buffer.from(JSON.stringify(voting)));
    const allVoting = JSON.parse(await this.getVoting(ctx, rootHash))
    allVoting.push(voting)
    return allVoting

  }

  async getVoting(ctx, hash) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;

    let folderAsBytes = await ctx.stub.getState(hash);
    if (!folderAsBytes || folderAsBytes.toString().length <= 0) {
      throw new Error('Folder with this hash does not exist');
    }
    const folder = JSON.parse(folderAsBytes.toString())
    if (folder.ownerId !== userId) {
      return { message: 'User does not have permission' };
    }
    let voting = []
    for (let i = 0; i < folder.files.length; i++) {
      let fileAsBytes = await ctx.stub.getState(folder.files[i].hash);
      const file = JSON.parse(fileAsBytes.toString())
      if (file.voting.length > 0) {
        for (let j = 0; i < file.voting.length; j++) {
          let votingAsBytes = await ctx.stub.getState(file.voting[j]);
          let votingIdentity = JSON.parse(votingAsBytes.toString())
          if (votingIdentity.dueDate > Math.floor(new Date() / 1000)) {
            votingIdentity.status = false
          }
          voting.push(votingIdentity)
        }
      }
    }
    for (let i = 0; i < folder.folders.length; i++) {
      let child = await this.getVoting(ctx, folder.folders[i].hash);
      for (let j = 0; i < child.length; j++) {
        voting.push(child[j])
      }
    }
    if (folder.sharedFolders) {
      for (let i = 0; i < folder.sharedFolders.length; i++) {
        let child = await this.getVoting(ctx, folder.sharedFolders[i].hash);
        for (let j = 0; i < child.length; j++) {
          voting.push(child[j])
        }
      }
    }
    folder.sender = identity.cert.subject
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(folder)));
    return JSON.stringify(voting)
  }

  async updateVoting(ctx, hash, variant) {
    const identity = new ClientIdentity(ctx.stub);
    const userId = identity.cert.subject.commonName;
    let votingAsBytes = await ctx.stub.getState(hash);
    if (!votingAsBytes || votingAsBytes.toString().length <= 0) {
      return { message: 'Voting with this hash does not exist' };
    }
    let voting = JSON.parse(votingAsBytes.toString());
    if (voting.voters.has({ name: userId, vote: null })) {
      voting.voters.delete({ name: userId, vote: null })
      voting.voters.add({ name: userId, vote: variant })
    }
    voting.sender = identity.cert.subject
    await ctx.stub.putState(hash, Buffer.from(JSON.stringify(voting)));
    return JSON.stringify(voting)
  }

}

module.exports = Market;
