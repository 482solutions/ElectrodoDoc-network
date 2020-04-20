'use strict';

const shim = require('fabric-shim');
const contracts = require('../src');

const energy = new contracts.contracts[0]();
const market = new contracts.contracts[1]();

class Chaincode {
    /**
     * manual initialization and inheritance - temporarily.
     * It will be further refactored
     */
    constructor() {
        this.energyProposals = new Map();
        this.balances = new Map();
        this.registerUser = market.registerUser;
        this.getUser = market.getUser;
        this.buyCoins = market.buyCoins.bind(this);
        this.generate = energy.generate.bind(this);
        this.consume = energy.consume.bind(this);
        this.sell = market.sell.bind(this);
        this.getTotalProposal = market.getTotalProposal;
        this.buy = market.buy.bind(this);
        this.getPrice = market.getPrice;
        this.getMarket = market.getMarket;
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
        const market = {
            coins: 1000000,
            energy: 0
        }
        await stub.putState(
            'market',
            Buffer.from(JSON.stringify(market))
        );
        const initialPrice = 1;
        await stub.putState('energyPrice', initialPrice);
        console.info('============= END : Initialize Ledger ===========');
    }
}

exports.Chaincode = Chaincode;