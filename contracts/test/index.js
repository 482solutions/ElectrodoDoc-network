const { ChaincodeMockStub, Transform } = require('@theledger/fabric-mock-stub');
const { Chaincode } = require('./chaincode');
const { expect, assert } = require('chai');

const chaincode = new Chaincode();
const stub = new ChaincodeMockStub('mock', chaincode);

describe('Test chaincode\n', () => {

    let user;

    it('Should be able to init', async () => {
        const args = ['arg1', 'arg2'];
        const response = await stub.mockInit('uudif', args);
        expect(
            Transform.bufferToObject(response.payload)['args']
        )
            .to.deep.equal(args);
    });

    it('Should be able to add user', async () => {
        const response = await stub.mockInvoke(
            'txregisterUser1',
            ['registerUser']
        );
        expect(response.status).to.eq(200);
        user = JSON.parse(response.payload);
        console.log('test.addUser: user:', user);
        assert(
            user.energy === 0,
            "user does not have the expected amount of energy"
        );
        assert(
            user.coins === 0,
            "user does not have the expected amount of coins"
        );
    });

    it('Should be able to find user by it id', async () => {
        const userId = user.userId;
        console.log('test.getUser: userId=', userId);
        let response = await stub.mockInvoke('txgetUser', ['getUser', userId]);
        expect(response.payload).to.deep.equal(user);
    });

    it("user should be able to buy coins", async () => {
        const coins = parseFloat(100).toFixed(2);
        await stub.mockInvoke('txBuyCoins', ['buyCoins', coins]);
        let response = await stub.mockInvoke(
            'txgetUser',
            ['getUser', user.userId]
        );
        assert(response.payload.coins === coins, "User did not receive coins");
    });

    it("user should be able to generate energy", async () => {
        const energy = 50;
        await stub.mockInvoke('txGenerate', ['generate', energy]);
        let response = await stub.mockInvoke(
            'txgetUser',
            ['getUser', user.userId]
        );
        assert(
            response.payload.energy === energy,
            "Residend did not generated energy"
        );
    });

    it("User should be able to consume energy", async () => {
        const energy = 10;
        let response = await stub.mockInvoke(
            'txgetUser',
            ['getUser', user.userId]
        );
        const startEnergy = response.payload.energy;
        await stub.mockInvoke('txConsume', ['consume', energy]);
        response = await stub.mockInvoke('txgetUser', ['getUser', user.userId]);
        const endEnergy = response.payload.energy;
        assert(
            (startEnergy - endEnergy) === energy,
            "Residend did not consumed energy"
        );
    });

    it("user should be able to sell energy", async () => {
        let response = await stub.mockInvoke(
            'txgetUser',
            ['getUser', user.userId]
        );
        const startEnergy = response.payload.energy;
        const energyToSell = startEnergy / 2;
        await stub.mockInvoke('txSell', ['sell', energyToSell]);
        response = await stub.mockInvoke('txgetUser', ['getUser', user.userId]);
        const endEnergy = response.payload.energy;
        assert(
            (startEnergy - endEnergy) === energyToSell,
            "Seller’s energy supply has not decreased");
    });

    it("User should by able to buy energy", async () => {
        const energyToBuy = 15;
        let response = await stub.mockInvoke(
            'txgetUser',
            ['getUser', user.userId]
        );
        const startBalance = response.payload.coins;
        const startEnergy = response.payload.energy;
        const txPrice = await stub.mockInvoke('txgetPrice', ['getPrice']);
        const price = txPrice.payload;
        await stub.mockInvoke('txBuy', ['buy', energyToBuy]);
        response = await stub.mockInvoke(
            'txgetUser',
            ['getUser', response.payload.userId]
        );
        const endBalance = response.payload.coins;
        const endEnergy = response.payload.energy;
        console.log('test.buy: startEnergy=', startEnergy);
        console.log('test.buy: endEnergy=', endEnergy);
        console.log('test.buy: startBalance=', startBalance);
        console.log('test.buy: endBalance=', endBalance);
        console.log('test.buy: price=', price);
        assert(
            (endEnergy - startEnergy) === energyToBuy,
            "User's energy supply has not increased"
        );
        assert(
            (startBalance - endBalance) === energyToBuy * price,
            "User did not pay for energy supplied"
        );
    });

    it("User should be able to get market balance", async () => {
        let response = await stub.mockInvoke('txgetMarket', ['getMarket']);
        const market = response.payload;
        console.log('test.getMarket: market:', market);
        expect(market).to.have.property('coins');
        expect(market).to.have.property('energy');
    });

    it("User should by able to get energy price", async () => {
        let response = await stub.mockInvoke('txgetPrice', ['getPrice']);
        expect(response.payload).to.be.a('number');
    });
});