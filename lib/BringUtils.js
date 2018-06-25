/**
 * BringgController.js
 *
 * Brinng service specific calls.
 */

//var util = require('util');
var config = require('../private/config');
var requestify = require('requestify');
var sync_request = require('sync-request');
var CryptoJS = require("crypto-js");
const CUSTOMER_CREATE_API_URL = 'https://developer-api.bringg.com/partner_api/customers';
const ORDER_CREATE_API_URL = 'https://developer-api.bringg.com/partner_api/tasks';
const ORDER_RECREATE_LOCAL = 'http://localhost:3000/order/create'; // ok, so I hard coded this :-)

function prepareParams(inputParams) {
    var query_params = '';

    // add required params
    inputParams.timestamp = Date.now();
    inputParams.access_token = config.ACCESS_TOKEN;

    // build the query string
    for (var key in inputParams) {
        var value = inputParams[key];
        if (query_params.length > 0) {
        query_params += '&';
        }
        query_params += key + '=' + encodeURIComponent(value);
    }
    
    // sign the query string
    inputParams.signature = CryptoJS.HmacSHA1(query_params, config.SECRET_KEY).toString();

    return query_params;
}
module.exports = {
    
    // create a new customer in Bringg's cloud
    // params: 
    //  name
    //  address
    //  phone
    //  email
    createCustomer : async (params) => {
        // prepare the parameters for this call
        var query_params = prepareParams(params);

        // make the call
        try {
            var response = await requestify.request(CUSTOMER_CREATE_API_URL, {
                method: 'POST',
                body: params,
                headers: {
                    'Content-type': 'application/json'
                },
                dataType: 'json'        
            });
            return response;
        }
        catch (err) {
            return err;
        }
    },

    // create a new roder in Bringg's cloud
    // params: 
    //  customer_id
    //  external_id
    createOrder : async (params) => {
        // prepare the parameters for this call
        var query_params = prepareParams(params);

        // make the call
        try {
            var response = await requestify.request(ORDER_CREATE_API_URL, {
                method: 'POST',
                body: params,
                headers: {
                    'Content-type': 'application/json'
                },
                dataType: 'json'        
            });
            return response;
        }
        catch (err) {
            return err;
        }
    },

    // get a list of orders from Bringg's cloud. this is a synced request
    // params: 
    //  page
    getOrders : (params) => {
        // prepare the parameters for this call
        var query_params = prepareParams(params);

        // make the call
        try {
           var response = sync_request('GET', ORDER_CREATE_API_URL, {
                                    headers: {
                                        'Content-type': 'application/json'
                                    },
                                    qs: params
                        });
            return response;
        }
        catch (err) {
            return err;
        }
    },

    // calls the localhost to recreate an order. this is a synced request
    recreateOrder : (params) => {
        // make the call
        try {
           var response = sync_request('GET', ORDER_RECREATE_LOCAL, {
                                    headers: {
                                        'Content-type': 'application/json'
                                    },
                                    qs: params
                        });
            return response;
        }
        catch (err) {
            return err;
        }
    },

    recreateOrder2 : (params) => {
        // make the call
        try {
            var response = requestify.request(ORDER_RECREATE_LOCAL, {
                method: 'GET',
                params: params,
                headers: {
                    'Content-type': 'application/json'
                },
            });
            return response;
        }
        catch (err) {
            return err;
        }
    },

}

