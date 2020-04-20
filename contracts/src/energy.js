'use strict';

const { Contract } = require('fabric-contract-api');
const { ClientIdentity } = require('fabric-shim');

class Energy extends Contract {

    constructor() {
        super('org.fabric.energycontract');
    }

    async generate(ctx, energy) {
        console.log(`\n===== Invoke Energy.generate() with params:`);
        console.log(`      energy: ${energy}`);
        const energyGeneratorId = (new ClientIdentity(ctx.stub)).getID();
        energy = parseInt(energy);

        const generator = await this.getUser(ctx, energyGeneratorId);
        generator.energy += energy;
        await ctx.stub.putState(
            energyGeneratorId,
            Buffer.from(JSON.stringify(generator))
        );
        console.log(`===== Invokation Energy.generate() completed with return:`);
        console.log('      generator: ', generator, '\n');
        return generator;
    }

    async consume(ctx, energy) {
        console.log(`\n===== Invoke Energy.consume() with params:`);
        console.log(`      energy: ${energy}`);
        const energyConsumerId = (new ClientIdentity(ctx.stub)).getID();
        energy = parseInt(energy);
        const consumer = await this.getUser(ctx, energyConsumerId);
        if (consumer.energy < energy) {
            throw new Error('Not enough energy');
        }
        consumer.energy -= energy;
        await ctx.stub.putState(
            energyConsumerId,
            Buffer.from(JSON.stringify(consumer))
        );
        console.log(`===== Invokation Energy.consume() completed with return:`);
        console.log('      consumer: ', consumer, '\n');
    }

    async transfer(ctx, energyReceiverId, energy) {
        console.log(`\n===== Invoke Energy.transfer() with params:`);
        console.log('       energyReceiverId:', energyReceiverId);
        console.log('       energy:', energy);
        const energySenderId = (new ClientIdentity(ctx.stub)).getID();
        energy = parseInt(energy);
        const senderData = await ctx.stub.getState(energySenderId);
        if (!senderData) {
            throw new Error('Sender does not exist, create participant first');
        }
        const receiverData = await ctx.stub.getState(energyReceiverId);
        if (!receiverData) {
            throw new Error('Receiver does not exist, create participant first');
        }
        const sender = JSON.parse(senderData);
        const receiver = JSON.parse(senderData);
        if (sender.energy < energy) {
            throw new Error('Sender does not have enough energy in the account');
        }
        sender.energy -= parseInt(energy);
        await ctx.stub.putState(
            energySenderId,
            Buffer.from(JSON.stringify(sender))
        );
        receiver.energy += parseInt(energy);
        await ctx.stub.putState(
            energyReceiverId,
            Buffer.from(JSON.stringify(receiver))
        );
        const returnObj = {
            "sender": sender,
            "receiver": receiver
        };
        console.log(`===== Invokation Energy.transfer() completed with return:`);
        console.log('      ', JSON.stringify(returnObj));
        return JSON.stringify(returnObj);
    }

    async balanceOf(ctx, userId) {
        console.log(`\n===== Invoke Energy.balanceOf() with params:`);
        console.log('       userId:', userId);
        const user = await this.getUser(userId);
        console.log(`===== Invokation Energy.balanceOf() completed with return:`);
        console.log('      user.energy=', user.energy);
        return user.energy;
    }

    async getUser(ctx, userId) {
        console.log(`\n===== Invoke Energy.getUser() with params:`);
        console.log('       userId:', userId);
        let user;
        try {
            user = await ctx.stub.getState(userId);
        } catch (err) {
            throw new Error("Resident with such id doesn't exist");
        }
        console.log(`===== Invokation Energy.getUser() completed with return:`);
        console.log('      user: ', JSON.parse(user));
        return JSON.parse(user);
    }
}

module.exports = Energy;
