/**
 * UserController.js
 *
 * Unless you are trying to implement some custom functionality, you shouldn't
 * need to edit this file.
 */

 var modelLocation = '../models/User'

 /****************************************************************
 *				   DO NOT TOUCH BELOW THIS LINE 				 *
 ****************************************************************/

 var util = require('util');
 var express = require('express');
 var bringg = require('../lib/BringUtils');

 /**  Model and route setup **/

 var model = require(modelLocation).model;
 const route = require(modelLocation).route;
 const routeIdentifier = util.format('/%s', route);

 /** Router setup **/

 var router = express.Router();

 /** Express routing **/

/*
 * GET /create
 *
 */

 router.get(routeIdentifier+'/create', function(req, res, next) {
    if (req.query === undefined || 
        req.query.username === undefined || 
        req.query.name === undefined || 
        req.query.email === undefined || 
        req.query.address === undefined) {
        return res.json({
            status: 'Failure',
            message: 'username, name, email and address must *all* be defined in the query string!'
        });
    }

    if (req.query.username === "") {
        return res.json({
            status: 'Failure',
            message: 'username cannot be empty, it is actually the cell phone number!'
        });
    }

 	model.create(req.query, function (err, entry) {
 		if (err) return res.send(err);

        // create the Bringg Customer
        req.query.external_id = req.query.username; // pass in the username
        bringg.createCustomer(req.query).then(resBringg => {

            var resBody = resBringg.getBody();
            var resCode = resBringg.getCode();

            if (resCode != 200 || (resBody && !resBody.success)) {
                // TBD - remove the new customer from the local db
                
                //return an error
                return res.json({
                    status: 'Error',
                    message: 'Failed to create remote customer=' + resCode
                })
            }

            // we have a new remote Bringg customer, so now we update the local customer document with its id
            model.update(
                { 'username': resBody.customer.external_id }, 
                { 'bringg_id': resBody.customer.id }, 
                function(err, obj) {
                    if (err) console.log('Error updating the Bringg id: ' + resBody.customer.id);
            });
            return res.json({
                    status: 'Success',
                    message: 'Customer was created!'
            });
        }); // end of promise
    });


 });


 module.exports = router;
