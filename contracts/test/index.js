const { ChaincodeMockStub, Transform } = require('@theledger/fabric-mock-stub');
const { Chaincode } = require('./chaincode');
const { expect, assert } = require('chai');

const chaincode = new Chaincode();
const stub = new ChaincodeMockStub('mock', chaincode);

describe('Test chaincode', () => {
  it('Should be able to init chaincode', async () => {
    const args = ['arg1', 'arg2'];
    const response = await stub.mockInit('uudif', args);
    expect(Transform.bufferToObject(response.payload)['args']).to.deep.equal(args);
  });
})

describe('Create folder', async () => {
  it('Should be able to add folder', async () => {
    const response = await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    );
    expect(response.status).to.eq(200);
    let folder = JSON.parse(response.payload);
    assert(folder.folderName === 'folderTest', "folder name does not match");
    assert(folder.folderHash === '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1',
      "folder hash does not match");
  });
});

describe('Create folder in folder', async () => {
  let parentFolderResp
  before('Create folder', async () => {
    parentFolderResp = await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
  });
  it('Should be able to add folder in folder', async () => {
    const response = await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest2', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']
    );
    expect(response.status).to.eq(200);
    const folder = JSON.parse(response.payload);
    const parentFolder = JSON.parse(parentFolderResp.payload);
    assert(folder.parentFolder.folderName === parentFolder.folderName,
      "folder name does not match");
    assert(folder.parentFolder.folderHash === parentFolder.folderHash,
      "folder hash does not match");
  });
});

describe('Create folder with the same name', async () => {
  before('Create folders', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']
    )
  });
  it('Should not be able to add folder with the same name', async () => {

    const response = await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']
    );
    expect(response.status).to.eq(200);
    assert(response.payload.message === 'Folder already exist', "Folder name match but created");
  });
});

describe('Get folder', async () => {
  before('Create folders', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTestGet', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']
    )
  });
  it('Should be able to find folder by it hash', async () => {
    const folderToSearch = '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410';
    let response = await stub.mockInvoke('txgetFolder', ['getFolder', folderToSearch]);
    expect(response.status).to.eq(200);
    expect(response.payload.folder.folderName).to.equal('folderTestGet');
  });
});

describe('Upload file', async () => {
  before('Create folders', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTestGet', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']
    )
  });
  it('Should be able to add file', async () => {
    const response = await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );
    expect(response.status).to.eq(200);
    let folder = JSON.parse(response.payload);
    assert(folder.parentFolder.files[0].name === 'fileTest', "file name does not match");
    assert(folder.parentFolder.files[0].hash === '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
      "file hash does not match");
  });
});

describe('Update file', async () => {
  before('Create folders and upload file', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTestGet', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']
    )
    await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );
  });
  it('Should be able to update file', async () => {
    const response = await stub.mockInvoke(
      'updateFile',
      ['updateFile', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089', 'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq585203',]
    );
    expect(response.status).to.eq(200);
    let file = JSON.parse(response.payload);
    assert(file.fileName === 'fileTest', "file name does not match");
    assert(file.versions.length === 2, "versions is not update");
  });
});

describe('Get file', async () => {
  let fileResp
  before('Create folders and upload file', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTestGet', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']
    )
    fileResp = await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );
  });

  it('Should be able to find file by it hash', async () => {
    let file = (JSON.parse(fileResp.payload)).files[0];
    const fileToSearch = '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089';
    let response = await stub.mockInvoke('getFile', ['getFile', fileToSearch]);
    expect(response.status).to.eq(200);
    expect(response.payload).to.deep.equal(file);
  });

});

describe('Change file ownership', async () => {
  before('Create folders and upload file', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTestGet', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']
    )
    await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );
  });
  it('Should be able to change owner of file', async () => {
    const response = await stub.mockInvoke(
      'changeOwnership',
      ['changeOwnership', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089', 'newTestOwner']);
    let file = JSON.parse(response.payload);
    expect(response.status).to.eq(200);
    assert(file.fileName === 'fileTest', "file name does not match");
    assert(file.ownerId === 'newTestOwner', "owner name does not match");
  });
});


describe('Change folder ownership with file inside', async () => {
  before('Create folders and upload file', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTestGet', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']
    )
    await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );
  });
  it('Should be able to change owner of folder', async () => {
    const response = await stub.mockInvoke(
      'changeOwnership',
      ['changeOwnership', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'newTestOwner']);
    let folder = JSON.parse(response.payload);
    expect(response.status).to.eq(200);
    assert(folder.folderName === 'folderTestGet', "folder name does not match");
    assert(folder.ownerId === 'newTestOwner', "owner name does not match");
  });
});


describe('Change file permissions', async () => {
  before('Create folders and upload file', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest2', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'root']
    )
    await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );
  });
  it('Should be able to change permissions of file', async () => {
    const response = await stub.mockInvoke(
      'changePermissions',
      ['changePermissions', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089', 'newTestOwner', 'write',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']);
    let file = JSON.parse(response.payload);
    expect(response.status).to.eq(200);
    assert(file.fileName === 'fileTest', "file name does not match");
    assert(file.writeUsers[0] === 'newTestOwner', "owner name does not match");
  });
});


describe('Revoke file permissions', async () => {
  before('Create folders and upload file', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest2', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'root']
    )
    await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );

    await stub.mockInvoke(
      'changePermissions',
      ['changePermissions', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089', 'newTestOwner', 'write',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']);
  });
  it('Should be able to revoke permissions of file', async () => {
    const response = await stub.mockInvoke(
      'revokePermissions',
      ['revokePermissions', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089', 'newTestOwner', 'write',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']);
    let file = JSON.parse(response.payload);
    expect(response.status).to.eq(200);
    assert(file.fileName === 'fileTest', "file name does not match");
    assert(file.writeUsers.length === 0);
  });
});

describe('Get folders tree', async () => {
  before('Create folders and upload file', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest2', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest3', '74905ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe1392',
        '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410']
    )
    await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );
  });
  it('Should be able to get folders tree', async () => {
    const response = await stub.mockInvoke(
      'getFolderTree',
      ['getFolderTree', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']);
    let tree = response.payload;
    expect(response.status).to.eq(200);
    assert(tree.name === 'folderTest', "folder name does not match");
    assert(tree.folders[0].name === 'folderTest2', "folder2 name does not match");
    assert(tree.folders[0].folders[0].name === 'folderTest3', "folder3 name does not match");
  });
});

describe('Create voting', async () => {
  before('Create folders and upload file', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest2', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'root']
    )
    await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );
    await stub.mockInvoke(
      'changePermissions',
      ['changePermissions', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089', 'newTestOwner', 'write',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']);
  });
  it('Should be able to add voting', async () => {
    const response = await stub.mockInvoke(
      'createVoting',
      ['createVoting', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        '74905ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe1392', '15936304800', "Yes,No",
        "", 'description', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410']
    );
    let voting = response.payload;
    expect(response.status).to.eq(200);
    assert(voting[0].votingName === 'fileTest', "voting name does not match");
    assert(voting[0].voters.length === 2);
    assert(voting[0].status === true);
  });
});

describe('Get voting', async () => {
  before('Create folders and upload file', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest2', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'root']
    )
    await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );
    await stub.mockInvoke(
      'changePermissions',
      ['changePermissions', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089', 'newTestOwner', 'write',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']);
    await stub.mockInvoke(
      'createVoting',
      ['createVoting', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        '74905ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe1392', '15936304800', "Yes,No",
        "", 'description', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410']
    );
  });
  it('Should be able to get voting', async () => {
    const response = await stub.mockInvoke(
      'getVoting',
      ['getVoting', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410']
    );
    let voting =  JSON.parse(response.payload);
    expect(response.status).to.eq(200);
    assert(voting[0].votingName === 'fileTest', "voting name does not match");
    assert(voting[0].voters.length === 2);
    assert(voting[0].status === true);
  });
});

describe('Update voting', async () => {
  before('Create folders and upload file', async () => {
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest', '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1', 'root']
    )
    await stub.mockInvoke(
      'saveFolder',
      ['saveFolder', 'folderTest2', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'root']
    )
    await stub.mockInvoke(
      'saveFile',
      ['saveFile', 'fileTest', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        'QmemN1t3HaK67JaCCU5iiDpq1HJSkHMT37PtY5Hq5ASBzs', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410', 'TEXT']
    );
    await stub.mockInvoke(
      'changePermissions',
      ['changePermissions', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089', 'newTestOwner', 'write',
        '1b4f6ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe51c1']);
    await stub.mockInvoke(
      'createVoting',
      ['createVoting', '93766ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe5089',
        '74905ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe1392', '15936304800', "Yes,No",
        "", 'description', '54326ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe7410']
    );
  });
  it('Should be able to update voting', async () => {
    const response = await stub.mockInvoke(
      'updateVoting',
      ['updateVoting', '74905ee7446c1883038caa8b247a1a192a4a47dd20a82b7bd5c4fd886afe1392', 'Yes']
    );
    let voting =  JSON.parse(response.payload);
    expect(response.status).to.eq(200);
    assert(voting.votingName === 'fileTest', "voting name does not match");
    assert(voting.voters.length === 2);
    assert(voting.voters[1].vote === 'Yes');
  });
});

