# Fabric electricity market (chain codes and network configuration)

# Fabric-core contracts



These smart contracts implement the logic of the blockchain. Energy contract

 records the generated and consumed energy, and the Market contract provides the functionality necessary for the exchange of energy between network participants.





## Getting Started



First you need to run the heperledger fabric blockchain, install and 

instantiate chaincode. For details see `[Fabric-shim tutorial](https://fabric-shim.github.io/master/tutorial-using-contractinterface.html). After this

 the chaincode can be invoked with command:`

```

+peer chaincode invoke --orderer oredererHost:port --channelID mychannel -c '{"Args":["contractClassName:contractFunction"]}' -n contractName

```

`contractClassName`'s are: `org.fabric.energycontract` and `org.fabric.marketcontract`;

`contractName`- the name given to the contract during installation.



## Market contract API



#### registerUser()

Registers a new user



*Returns*:

User descriptor stored on blockchain: ```{userId, coins, energy}```



#### sell(energy)

Caller is selling energy on the market



*Parameters*:



| Name  | Type |Description |

| ------------- | ------------- |------------- |

| energy  | Number  |Amount of energy to sell  |



#### buy(energy)

Caller is buying energy on the market



*Parameters*:



| Name  | Type |Description |

| ------------- | ------------- |------------- |

| energy  | Number  |Amount of energy to buy  |



#### buyCoins(coins)

Caller buys virtual money to pay for energy



*Parameters*:



| Name  | Type |Description |

| ------------- | ------------- |------------- |

| coins  | Number  |Amount of money to buy  |



#### getUser(userId)

Provides information about the user with the given id



*Parameters*:



| Name  | Type |Description |

| ------------- | ------------- |------------- |

| userId  | Number  |id of the user  |



*Returns*:

User descriptor in format```{userId,coins,energy}```



#### setPrice(price)

Sets a new  energy price



*Parameters*:



| Name  | Type |Description |

| ------------- | ------------- |------------- |

| price  | Number  |new energy price  |



#### getPrice()

Gets current energy price



*Returns*:

The price of energy in virtual currency



#### getMarket()

Provides information on the supply of energy and virtual currency in the market



*Returns*:

Market descriptor in format ```{coins,energy}```



## Energy contract API



#### generate(energy)

Records caller energy generation



*Returns*:

User descriptor stored on blockchain: ```{userId, coins, energy}```



*Parameters*:



| Name  | Type |Description |

| ------------- | ------------- |------------- |

| energy  | Number  |Energy generation  |



#### consume(energy)

Records caller energy consumption



*Returns*:

User descriptor stored on blockchain: ```{userId, coins, energy}```



*Parameters*:



| Name  | Type |Description |

| ------------- | ------------- |------------- |

| energy  | Number  |Energy consumption  |



#### transfer(energyReceiverId, energy)

The caller transfers energy to another user



*Parameters*:



| Name  | Type |Description |

| ------------- | ------------- |------------- |

| energyReceiverId  | string  |receiver id   |

| energy  | Number  |energy to transfer   |



*Returns*:

Updated states of both participants in the format 

 ```

 {

	sender:{userId, coins, energy},

	receiver:{userId, coins, energy}

} 

```



#### balanceOf(userId)

Returns the amount of energy on the balance of the caller



*Returns*:

Amount of energy



*Parameters*:



| Name  | Type |Description |

| ------------- | ------------- |------------- |

| userId  | string  |id of user  |