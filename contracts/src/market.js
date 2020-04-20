'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class Market extends Contract {

    constructor() {
        super('org.fabric.marketcontract');
    }

    async instantiate(ctx) {
        const initialPrice = 1;
        await ctx.stub.putState('energyPrice', initialPrice.toFixed(2).toString());
        const market = {
            coins: 1000000,
            energy: 0
        }
        await ctx.stub.putState(
            'market',
            Buffer.from(JSON.stringify(market))
        );
    }

    async registerUser(ctx) {
        console.log(`\n===== Invoke Market.registerUser()`);
        const newuser = new ClientIdentity(ctx.stub);
        const userId = newuser.getID();
        const user = {
            userId: userId,
            energy: 0,
            coins: 0,
        };
        console.log('market.registerUser: userId:', userId);
        await ctx.stub.putState(
            userId,
            Buffer.from(JSON.stringify(user))
        );
        console.log(`===== Invokation Market.registerUser() completed with return:`);
        console.log('      user: ', user);
        return JSON.stringify(user);
    }

    /** 
     * Network participant puts up for sale his energy
     */
    async sell(ctx, energy) {
        console.log(`\n===== Invoke Market.sell() with params`);
        console.log('      energy:', energy);
        energy = parseInt(energy);
        const userId = (new ClientIdentity(ctx.stub)).getID();
        const user = await this.getUser(ctx, userId);
        if (user.energy < energy) {
            throw new Error("Not enough energy");
        }
        const txMarket = await ctx.stub.getState('market');
        const market = JSON.parse(txMarket);
        const price = await this.getPrice(ctx);
        market.energy += energy;
        market.coins = (parseFloat(market.coins) - price * energy).toFixed(2);
        user.energy -= energy;
        user.coins = (parseFloat(user.coins) + price * energy).toFixed(2);
        await ctx.stub.putState(userId, Buffer.from(JSON.stringify(user)));
        await ctx.stub.putState('market', Buffer.from(JSON.stringify(market)));
        console.log(`===== Invokation Market.sell() completed`);

    }

    async buy(ctx, energy) {
        console.log(`\n===== Invoke Market.buy() with params`);
        console.log('      energy:', energy);
        energy = parseInt(energy);
        const price = await this.getPrice(ctx);
        const buyerId = (new ClientIdentity(ctx.stub)).getID();
        const buyer = await this.getUser(ctx, buyerId);
        const txMarket = await ctx.stub.getState('market');
        const market = JSON.parse(txMarket);
        if (market.energy < energy) {
            throw new Error("Not enough energy on the market");
        }
        if (parseFloat(buyer.coins) < price * energy) {
            throw new Error("Buyer doesn't have enough coins");
        }
        market.energy -= energy;
        market.coins = (parseFloat(market.coins) + price * energy).toFixed(2);
        buyer.energy += energy;
        buyer.coins = (parseFloat(buyer.coins) - price * energy).toFixed(2);
        await ctx.stub.putState(buyerId, Buffer.from(JSON.stringify(buyer)));
        await ctx.stub.putState('market', Buffer.from(JSON.stringify(market)));
        console.log(`===== Invokation Market.buy() completed`);
    }

    /**
     * user buys coins for UAH cache
     */
    async buyCoins(ctx, coins) {
        const userId = (new ClientIdentity(ctx.stub)).getID();
        const user = await this.getUser(ctx, userId);
        user.coins = (parseFloat(user.coins) + parseFloat(coins)).toFixed(2);
        await ctx.stub.putState(
            userId,
            Buffer.from(JSON.stringify(user))
        );
        console.log(`===== Invokation Market.buyCoins() completed`);
    }

    async getUser(ctx, userId) {
        console.log(`\n===== Invoke Market.getUser() with params:`);
        console.log('      userId:', userId);
        let user;
        try {
            user = await ctx.stub.getState(userId);
        } catch (err) {
            throw new Error("user with such id doesn't exist");
        }
        console.log(`===== Invokation Market.getUser() completed with return:`);
        console.log('      user: ', JSON.parse(user));
        return JSON.parse(user);
    }

    async setPrice(ctx, newPrice) {
        const price = parseFloat(newPrice).toFixed(2);
        await ctx.stub.putState('energyPrice', price);
        console.log(`===== Invokation Market.setPrice() completed`);
    }

    async getPrice(ctx) {
        const energyPrice = await ctx.stub.getState('energyPrice')
        return parseFloat(energyPrice);
    }

    async getMarket(ctx) {
        const market = await ctx.stub.getState('market');
        return JSON.parse(market);
    }
}

module.exports = Market;