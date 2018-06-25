/**
 * Default REST contoller for your db.
 *
 * Usage:
 *	(1) Change the modelLocation variable to the location where your corresponding model
 *		is stored.
 *
 *	(2 - optional) Add custom routing for your API. NOTE: If you don't know what this means,
 *				   you don't need it.
 */

var modelLocation = '../models/Order'
const GLOBAL_TITLE = 'Coffee Delivery - Ofer Bar';
const MAX_PAGES_FOR_ME = 10;

 /****************************************************************
 *				   DO NOT TOUCH BELOW THIS LINE 				 *
 ****************************************************************/

var util = require('util');
var express = require('express');
var bringg = require('../lib/BringUtils');
var dates = require('../lib/dates');

//var bodyParser = require('body-parser');
//var authController = require('./AuthController');

/**  Model and route setup **/

var model = require(modelLocation).model;
var userModel = require('../models/User').model;

const route = require(modelLocation).route;
const routeIdentifier = util.format('/%s', route);

/** Express setup **/

var router = express.Router();

/** Express routing **/


/*
 * GET /list
 *
 */

 router.get(routeIdentifier+'/list', function(req, res, next) {
 	model.find({'owner':req.user._id}, function (err, objects) {
 		if (err) return res.send(err);
 		return res.json(objects);
 	});
 });

/*
 * GET /create
 *
 */

 router.get(routeIdentifier+'/create', function(req, res, next) {

 	model.create(req.query, function (err, order) {
        if (err) return next(err);
        
        // find the local customer using the username (phone #)
        userModel.findOne({'username':req.query.username}, function (err, customer) {
            if (err) return res.send(err);
   
            // create the Bringg Order
            var params = {
                title: GLOBAL_TITLE,
                external_id: order._id,             // the local order id
                customer_id: customer.bringg_id,    // Bringg customer id
                scheduled_at: req.query.deliver_at, // delivery time
                addess: 'TBD',                      // fill in the customer's address?
                //way_points: [
                //    {
                //        customer_id: order._id,
                //        scheduled_at: req.query.deliver_at
                //    }
                //]
            };
            
            bringg.createOrder(params).then(resBringg => {

                var resBody = resBringg.getBody();
                var resCode = resBringg.getCode();

                if (resCode != 200 || (resBody && !resBody.success)) {
                    // TBD - remove the new order from the local db
                    
                    //return an error
                    return res.json({
                        status: 'Error',
                        message: 'Failed to create remote order. Error code=' + resCode
                    })
                }

                // we have a new remote Bringg order
                return res.json({
                    status: 'Success',
                    message: 'Order created!'
                });
            });
        });

 	});
 });


 function getPageOrders(customer, page) {

    return qOrders;
 }


 router.get(routeIdentifier+'/recreate', function(req, res, next) {

    // find the local customer using the username (phone #)
    userModel.findOne({'username':req.query.username}, function (err, customer) {
        if (err) return res.send(err);

        var page = 0;
        var nOrders = 0;
        var newOrders = [];
        var ordersToCreate = [];

        do {
            // get the order list of this customer for the past week
            // page through the orders until no more orders are available
    
            // create the next Bringg Order list page
            var params = {
                page: page,
            };

            // make a sync GET request to Bringg for the current page
            var resBringg = bringg.getOrders(params);

            var resBody = JSON.parse(resBringg.getBody().toString());
            var resCode = resBringg.statusCode;

            if (resCode != 200) {
                //return an error
                return res.json({
                    status: 'Error',
                    message: 'Failed to get remote orders. Error code=' + resCode
                })
            }

            nOrders = resBody.length;

            console.log(' >>> page=' + page + ', # orders=' + nOrders);

            for (var i = 0; i < nOrders; i++) {
                // there are still order to process
                var o = resBody[i];
                if (o.customer.id == customer.bringg_id) {
                    // that's our customer, since we share the test space with everyone!
                    console.log(' >>> i=' + i + ', bringg id=' + o.customer.id + ', local id=' + customer.bringg_id);

                    var endWeek = dates.addDays(Date.now(), 7);
                    var newDateCreated = dates.addDays(new Date(o.created_at), 7);

                    if (dates.inRange(newDateCreated, new Date(Date.now()), endWeek)) {
                        // new creation date is within the current week
                        // so we add this order id to the list to be recreated

                        var paramsOrder = {
                            external_id: o.external_id,
                        };

                        ordersToCreate.push(paramsOrder);
                    }
                }
            }

            // next page
            page++;
    
        } while (nOrders != 0 && page < MAX_PAGES_FOR_ME);
    
        for (i = 0; i < ordersToCreate.length; i++) {
            var o = ordersToCreate[i];
            // find the previous order using the external_id we stored in the Bringg order 
            model.findOne({'_id': o.external_id}, function (err, prevOrder) {
                if (err) return res.send(err);

                // in case we get a nul order for some reason
                if (prevOrder) {
                    console.log(' >>> prevOrder=' + JSON.stringify(prevOrder));

                    // calculate the new delivery time
                    var newDateScheduled = dates.addDays(new Date(prevOrder.deliver_at), 7).toISOString();

                    var localParams = {
                        username: req.query.username,
                        coffee_size: prevOrder.coffee_size,
                        coffee_type: prevOrder.coffee_type,
                        deliver_at: newDateScheduled
                    }
                    
                    // call the lcoalhost to recreate the order, it is synced
                    bringg.recreateOrder2(localParams).then(resBringg => {

                        //var resBody = JSON.parse(resBringg.getBody().toString());
                        //var resCode = resBringg.statusCode;
                        var resBody = resBringg.getBody();
                        var resCode = resBringg.getCode();
        
                        // since the output is async we need to write the results to the db or file
                        // and at the end we can give the user indication of the results of this recreate operation
                        // currently this is not implemented
                        if (resCode != 200 || (resBody && resBody.status && resBody.status != 'Success')) {
                            // error 
                            //newOrders.push('Error: New order failed to create, scheduled to: ' + newDateScheduled + ', code=' + resCode);
                        } else {
                            // success remotely, now create the local order 
                            //newOrders.push('New order created successfully, scheduled to: ' + newDateScheduled);
                        }
                    });
                }
            });                                                        
        }

        // finally we return all the created/failed orders
        //return res.json(newOrders);
    });
});

/*
 * GET /get/:id
 *
 */

 router.get(routeIdentifier+'/get/:id', function (req, res, next) {
 	model.findOne({
        '_id':req.params.id,
        'owner':req.user._id
    }, function (err, entry){
 		if(err) return res.send(err);
 		return res.json(entry);
 	});
 });

/*
 * GET /update/:id
 *
 */

 router.get(routeIdentifier+'/update/:id', function(req, res, next) {
 	model.findOneAndUpdate({
        '_id':req.params.id,
        'owner':req.user._id
    },
    req.query,
    function (err, entry) {
 		if (err) return res.send(err);
 		return res.json({status: 'Success', message: 'Updated item'});
 	});
 });

/*
 * GET /delete/:id
 *
 */

router.get(routeIdentifier+'/delete/:id', function (req, res, next) {
  model.findOneAndRemove({
        '_id':req.params.id,
        'owner':req.user._id
    },
    req.body,
    function (err, entry) {
        if (err) return res.send(err);
        return res.json({status: 'Success', message: 'Deleted item'});
    });
});

 module.exports = router;
