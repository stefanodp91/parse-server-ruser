// JavaScript Document
/**
 * Sample Mailgun Cloud Module
 * @name Mailgun
 * @namespace
 *
 * Sample Cloud Module for using <a href="http://www.mailgun.com">Mailgun</a>.
 *
 * <ul><li>Module Version: 1.0.0</li>
 * <li>Mailgun API Version: 'v2'</li></ul>
 *
 * Copyright 2013 Parse, Inc.
 * This module is freely distributable under the MIT license.
 */
 
(function() {
  
 // Dario
 var url = 'api.mailgun.net/v2';
 //var url = 'api.mailgun.net/v3';
 
 
 //production
//var domain = 'mg.rukku.it';
 //var domain = 'mg.rukku.it';
// var domain = 'app475b8a1f8e19459d83683850f08f1643.mailgun.org';
//var key = 'key-7e6356374a29aa0f541ca9c13e7b83bd';
 //'key-7e6356374a29aa0f541ca9c13e7b83bd';
 
 var domain;
 var key;


//sandbox 
//  var domain = 'sandboxd4c1fff0eef345918700b3f7763ea660.Mailgun.Org';
//  var key = 'key-eb5c861840c9606f6e8cdb6905e7d66b';
  /*
  // Giuseppe
  var url = 'api.mailgun.net/v2';
  var domain = 'sandbox8c477f501ccc4e99be6ff3cca124fb64.mailgun.org';
  var key = 'key-4e1873276afa983e071fcb4dee618a2c';
 */
  module.exports = {
    /**
     * Get the version of the module.
     * @return {String}
     */
    version: '1.0.0',
 
    /**
     * Initialize the Mailgun module with the proper credentials.
     * @param {String} domainName Your Mailgun domain name
     * @param {String} apiKey Your Mailgun api key
     */
    initialize: function(domainName, apiKey) {
      domain = domainName;
      key = apiKey;
      return this;
    },
 
    /**
     * Send an email using Mailgun.
     * @param {Object} params A hash of the paramaters to be passed to
     *      the Mailgun API. They are passed as-is, so you should
     *      consult Mailgun's documentation to ensure they are valid.
     * @param {Object} options A hash with the success and error callback
     *      functions under the keys 'success' and 'error' respectively.
     * @return {Parse.Promise}
     */
    sendEmail: function(params, options) {
     
     console.log("url sendEmail: "+"https://api:" + key + "@" + url + "/" + domain + "/messages");
      return Parse.Cloud.httpRequest({
        method: "POST",
        url: "https://api:" + key + "@" + url + "/" + domain + "/messages",
        body: params,
      }).then(function(httpResponse) {
       console.log("httpResponse "+httpResponse);
        if (options && options.success) {
          options.success(httpResponse);
        }
      }, function(httpResponse) {
        if (options && options.error) {
          options.error(httpResponse);
        }
      });
    }
 
  }
}());
