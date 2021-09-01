# Channel for testing chaincodes

This configuration defines a channel named `testchannel` with the write access
for all members of `482solutions` organization.

## Creating a channel

To create a channel:

- Create the genesis transaction:
  `configtxgen -asOrg 482solutions -channelID testchannel -configPath <path to this directory> -outputCreateChannelTx ./testchannel_create.pb -profile TestChannel`
- Submit this transaction with:
  `peer channel create -c testchannel --file ./testchannel_create.pb --orderer <orderer address>:7050`.
  This command will download the genesis block of this channel.
- Add a node to a newly created channel: `peer channel join --orderer <orderer address>:7050 --blockpath ./testchannel.block`
