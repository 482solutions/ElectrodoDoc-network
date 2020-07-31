const { ChaincodeMockStub, Transform } = require('@theledger/fabric-mock-stub');
const { Chaincode } = require('./chaincode');
const { expect, assert } = require('chai');

const chaincode = new Chaincode();
const stub = new ChaincodeMockStub('mock', chaincode);

describe('Test chaincode\n', () => {

  let folder, file;

  it('Should be able to init', async () => {
    const args = ['arg1', 'arg2'];
    const response = await stub.mockInit('uudif', args);
    expect(
      Transform.bufferToObject(response.payload)['args']
    )
      .to.deep.equal(args);
  });

  it('Should be able to add folder', async () => {
    const response = await stub.mockInvoke(
      'txsaveFolder1',
      ['saveFolder', 'folderTest1', 'folderhash12345', 'root']
    );
    expect(response.status).to.eq(200);
    folder = JSON.parse(response.payload);
    console.log('test.addFolder: folder:', folder);
    assert(
      folder.folderName === 'folderTest1',
      "folder name does not match"
    );
    assert(
      folder.folderHash === 'folderhash12345',
      "folder hash does not match"
    );
  });

  it('Should be able to add folder in folder', async () => {
    const response = await stub.mockInvoke(
      'txsaveFolder2',
      ['saveFolder', 'folderTest2', 'folderhash1234567', 'folderhash12345']
    );
    expect(response.status).to.eq(200);
    folder = JSON.parse(response.payload);
    console.log('test.addFolder: folder:', folder);
    assert(
      folder.parentFolder.folderName === 'folderTest1',
      "folder name does not match"
    );
    assert(
      folder.parentFolder.folderHash === 'folderhash12345',
      "folder hash does not match"
    );
  });

  it('Should be no able to add folder in folder with the same name', async () => {
    const response = await stub.mockInvoke(
      'txsaveFolder2',
      ['saveFolder', 'folderTest2', 'folderhash1234567', 'folderhash12345']
    );
    console.log(response)
    expect(response.status).to.eq(200);
    assert(
      response.payload.message === 'Folder already exist',
      "folder name  match"
    );
  });

  it('Should be able to find folder by it hash', async () => {
    const folderToSearch = folder.parentFolder.folderHash;
    console.log('test.getFolder: folderHash=', folderToSearch);
    let response = await stub.mockInvoke('txgetFolder', ['getFolder', 'folderhash12345']);
    console.log(response.payload)
    expect(response.payload.folder.folderName).to.equal(folder.parentFolder.folderName);
  });

  it('Should be able to add file', async () => {
    const response = await stub.mockInvoke(
      'txsaveFile1',
      ['saveFile', 'fileTest1', 'filehash12345', 'fileCID11112345', 'folderhash12345', 'TEXT']
    );
    expect(response.status).to.eq(200);
    folder = JSON.parse(response.payload);
    console.log('test.saveFile: file:', folder);
    assert(
      folder.parentFolder.files[0].name === 'fileTest1',
      "file name does not match"
    );
    assert(
      folder.parentFolder.files[0].hash === 'filehash12345',
      "file hash does not match"
    );
  });

  it('Should be able to update file', async () => {
    const response = await stub.mockInvoke(
      'txupdateFile1',
      ['updateFile', 'filehash12345', 'fileCID22222345', ]
    );
    expect(response.status).to.eq(200);
    file = JSON.parse(response.payload);
    console.log('test.saveFile: file:', file);
    assert(
      file.fileName === 'fileTest1',
      "file name does not match"
    );
    assert(
      file.fileHash === 'filehash12345',
      "file hash does not match"
    );
  });

  it('Should be able to find file by it hash', async () => {
    const fileToSearch = file.fileHash;
    console.log('test.getFile: fileHash=', fileToSearch);
    let response = await stub.mockInvoke('txgetFolder', ['getFile', 'filehash12345']);
    console.log(response.payload)
    expect(response.payload).to.deep.equal(file);
  });

  // it('Should be able to change owner of file', async () => {
  //   const response = await stub.mockInvoke(
  //     'txchangeOwnership1',
  //     ['changeOwnership', 'folderhash12345', 'newTestOwner' ]
  //   );
  //   expect(response.status).to.eq(200);
  //   file = JSON.parse(response.payload);
  //   console.log('test.changeOwnership: file:', file);
  //   assert(
  //     file.ownerId === 'newTestOwner',
  //     "file name does not match"
  //   );
  // });

  it('Should be able to add permissions of folder', async () => {
    const response = await stub.mockInvoke(
      'txchangePermissions1',
      ['changePermissions', 'folderhash12345', 'votingHash', 'newSharedUser', 'allow', 'write']
    );
    expect(response.status).to.eq(200);
    file = response.payload;
    console.log('test.changePermissions: folder:', file);
    assert(
      file === 'newSharedUser',
      "file name does not match"
    );
  });

  it('Should be able to add permissions of folder', async () => {
    const response = await stub.mockInvoke(
      'txchangePermissions1',
      ['changePermissions', 'folderhash12345', 'MyTestUserWithAttrs', 'disallow', 'read']
    );
    expect(response.status).to.eq(200);
    file = JSON.parse(response.payload);
    console.log('test.changePermissions: folder:', file);
    assert(
      file.readUsers.length < 2,
      "file name does not match"
    );
  });

  it('Should be able to add permissions of folder', async () => {
    const response = await stub.mockInvoke(
      'txchangePermissions1',
      ['changePermissions', 'folderhash12345', 'newSharedUser', 'disallow', 'read']
    );
    console.log(response)
    expect(response.status).to.eq(200);
    assert(
      response.payload.message === 'User does not have permission: ',
      "file name does not match"
    );
  });

  // it('Should be not able create voting', async () => {
  //   console.log('test.getFolder: folderHash=');
  //   let response = await stub.mockInvoke('txgetFolder', ['getFolder', 'folderhash12345']);
  //   console.log(response.payload)
  //   expect(response.status).to.eq(200);
  //   assert(
  //     response.payload.message === 'User does not have permission: ',
  //     "file name does not match"
  //   );
  // });
  it('Should be able to add voting', async () => {
    const response = await stub.mockInvoke(
      'txcreateVoting',
      ['createVoting', 'filehash12345', '4323134538333','timeisnow', "Yes,No,Derby", "user3,user4", 'gfhfdfgdhfjgfdfghjhgfdsgdghgf', 'folderhash1234567' ]
    );
    folder = response.payload;
    console.log('voting create results:', folder);
  });

  it('Should be able to get voting', async () => {
    const response = await stub.mockInvoke(
      'txgetVoting',
      ['getVoting', 'folderhash12345' ]
    );
   let voting = response.payload;
    console.log('voting get results:', voting);
  });
});
