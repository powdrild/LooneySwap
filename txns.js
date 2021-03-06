module.exports = function(){
    const express = require('express');
    const router = express.Router();
    const {Datastore} = require('@google-cloud/datastore');

    const datastore = new Datastore();

    const TXNS = "Txns";

    const fromDatastore = function (item){
        item.id = item[Datastore.KEY].name;
        return item;
    }

    /* ------------- Model Functions ------------- */

    const post_txn = async function (txId, ownerAddress, srcToken, srcTokenDecimals, srcAmount, destToken, destTokenDecimals, destAmount){
        const key = datastore.key([TXNS, txId]);
        const new_txn = {
            "owner": ownerAddress.toLowerCase(),
            "srcToken": srcToken,
            "srcTokenDecimals": srcTokenDecimals,
            "srcAmount": srcAmount.toString(),
            "destToken": destToken,
            "destTokenDecimals": destTokenDecimals,
            "destAmount": destAmount.toString(),
            "timeStamp": new Date()
        }
        await datastore.save({ "key": key, "data": new_txn});
        return key;
    }
    
    /* ------------- Controller Functions ------------- */

    router.post('/', async function(req, res){
        const key = datastore.key([TXNS, req.params.address]);
        datastore.get(key, async (err, entity) => {
            if(!entity) {
                if(req.body.txId &&
                req.body.ownerAddress && 
                req.body.srcToken &&
                req.body.srcTokenDecimals &&
                req.body.srcAmount &&
                req.body.destToken &&
                req.body.destTokenDecimals &&
                req.body.destAmount
                ) {
                    const key = await post_txn(
                        req.body.txId,
                        req.body.ownerAddress.toLowerCase(), 
                        req.body.srcToken,
                        req.body.srcTokenDecimals,
                        req.body.srcAmount,
                        req.body.destToken,
                        req.body.destTokenDecimals,
                        req.body.destAmount
                    );
                    datastore.get(key, async (err, entity) => {
                        if(!entity) {
                            console.log(`Error getting created txn`);
                        } else {
                            entity = fromDatastore(entity);
                            res.status(201).send(entity);
                        }
                    });
                } else {
                    res.status(400).send(JSON.parse('{"Error": "The request object is missing at least one of the required attributes"}'));
                }
            } else {
                res.status(404).send(JSON.parse('{"Error": "A user with this address already exists"}'));
            }
        });   
    });

    return router;
}();