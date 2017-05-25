


//require('cloud/jobs');
// Use Parse.Cloud.define to define as many cloud functions as you want.
var client = require(__dirname + '/myMailModule-1.0.0.js');
// client.initialize('sandboxd4c1fff0eef345918700b3f7763ea660.Mailgun.Org', 'key-eb5c861840c9606f6e8cdb6905e7d66b');

//production domain
client.initialize('mg.rukku.it', 'key-7e6356374a29aa0f541ca9c13e7b83bd');


//ATTENTION CHANGE FILE myMailModule-1.0.0.js AND HERE??????
//sandbox domain
//client.initialize('app475b8a1f8e19459d83683850f08f1643.mailgun.org', 'key-7e6356374a29aa0f541ca9c13e7b83bd');


//Then inside of your Cloud Code function, you can use the sendEmail function to fire off some emails:


/* SEND EMAIL
//----------------------------------------------//
// ELENCO TIPOLOGIE EMAIL
//----------------------------------------------//
 10 - nuova richiesta - client
 20 - nuova richiesta - professional
 30 - nuova richiesta - admin
 40 - richiesta annullata - client
 50 - richiesta annullata - professional
 60 - richiesta annullata - admin
 70 - offerta accettata - client
 80 - offerta accettata - professional
 85 - offerta accettata - professional
 90 - offerta accettata - admin
 100 - nuova offerta - client
 110 - nuova offerta - professional
 120 - offerta superata - professional
 130 - nuova offerta - admin
//----------------------------------------------//
*/
var TYPE_NEW_REQUEST = "TYPE_NEW_REQUEST";
var TYPE_CANCELED_REQUEST = "TYPE_CANCELED_REQUEST";
var TYPE_NEW_OFFER = "TYPE_NEW_OFFER";
var TYPE_ACCEPTED_OFFER = "TYPE_ACCEPTED_OFFER";
var TYPE_WELLCOME = "TYPE_WELLCOME";
var TYPE_RECOVERY_PASSWORD = "TYPE_RECOVERY_PASSWORD";
var TYPE_CANCELED_OFFER = "TYPE_CANCELED_OFFER";

var DEFAULT_LANG = 'it-IT';
var DEFAULT_ADMIN_EMAIL = 'admin@rukku.com';

var NAME_APP;
var ID_REQUEST;
var CREATEDAT_REQUEST;
var NAME_USER_CLIENT;
var BEST_PRICE;
var ID_OFFER;
var CREATEDAT_OFFER;
var NAME_USER_PROFESSIONAL;
var PRICE_OFFER;

var arrayFindString = new Array;
var arrayNwString = new Array;

//----------------------------------------------//
//START LIST FUNCTIONS 
//----------------------------------------------//

function getEmailTemplates(lang,type){
	var query = new Parse.Query("EmailConfig");
	query.equalTo("lang", lang);
	query.equalTo("type", type);
	return query.find();
}


function getRequestDetail(idListForms){
	"use strict";
//	console.log("\n +++++++++ STEP 2\n "+idListForms + "\n");
	var query = new Parse.Query("ListForms");
	query.equalTo("objectId", idListForms);
	query.include('idUserRequest');
	var myres = query.first();
	/*var myres = query.first({
	  success: function(results) {
	  	console.log("getRequestDetail.success");
    		console.log(results);
	    },
	    error: function(error) {
	    console.log("getRequestDetail.error");
	      console.log(error);
	    }
	    });
	    */
    
//	console.log("getRequestDetail: " + myres);
	return myres;
}

function getOfferDetail(idListOffers){
	"use strict";
//	console.log("\n +++++++++ STEP 3\n "+idListOffers + "\n");
	if(idListOffers){
		var query = new Parse.Query("ListOffers");
		query.equalTo("objectId", idListOffers);
		query.include('idUserResponder');
		query.include('idUserResponder.idProfessional');
		var myres = query.first();
//		console.log("getOfferDetail: " + myres);
		return myres;
	}
	return;
}

function getListAllEmailProfessional(){
	"use strict";
//	console.log("\n +++++++++ STEP 4 getListAllEmailProfessional\n ");
	
	var query = new Parse.Query("Professional");
	query.include('idUser');
	/*
	var query = new Parse.Query("_User");		
	query.exists('idProfessional');
	query.include('idProfessional');
	*/
	var myres = query.find();
//	console.log("getListAllEmailProfessional : "+ myres);
	return myres;
}

// decodifica la lista degli username dei professionisti (strutture) del formato:
// var subscribersList = subscriber_0,subscriber_1,...,subscriber_i,...,subscriber_n;  
// e restituisce la lista di sottoscrittori 
function decodeSubscriberList(encodedSubscribersList) {
	console.log("decodeSubscriberList");
	"use strict";
	// recupera la lista di professionisti (strutture) effettuando lo spit sul carattere ","
	var decodedSubscribersList = encodedSubscribersList.split(',');
	console.log("decodedSubscribersList == " + JSON.stringify(decodedSubscribersList));

	var userQuery = new Parse.Query("_User");
	userQuery.containedIn("username", decodedSubscribersList);
	
	var query = new Parse.Query("Professional");
	query.matchesQuery('idUser', userQuery);
 
	// query.find({
 //    	success: function(results) {
 //    		res.success("decodeSubscriberList - success: " + JSON.stringify(results));
 //    	},
 //    	error: function(error) {
 //      		res.success("decodeSubscriberList - error: " + JSON.stringify(error));
 //    	}
 //  	});

 	return query.find();
}

function getListEmailProfessionalSentOffer(idListForms){
	"use strict";
//	console.log("\n +++++++++ STEP 4 getListEmailProfessionalSentOffer ++++++++++++\n"+idListForms);
	var Form = Parse.Object.extend("ListForms");
	var form = new Form();
	form.id = idListForms;
	var query = new Parse.Query("ListOffers");
	query.equalTo("idListForms", form);
	query.include('idUserResponder');
	query.include('idUserResponder.idProfessional'); 
	//query.include('idUserResponder.idProfessional.email'); 
	query.ascending("price"); //il primo della lista è il miglior Offerente
	return query.find();
}

function getLEmailLastBestOffer(idListForms){
	"use strict";
//	console.log("\n +++++++++ STEP 4 getLEmailLastBestOffer ++++++++++++\n"+idListForms);
	var query = new Parse.Query("ListForms");
	query.equalTo("objectId", idListForms);
	query.include('idUserResponder');
	return query.first();
}

function replaceString(string){
	"use strict";
	console.log("*********** replaceString START ************");
	//[NAME_APP]
	//[ID_REQUEST]
	//[CREATEDAT_REQUEST]
	//[NAME_USER_CLIENT]
	//[BEST_PRICE]
	//[ID_OFFER]
	//[CREATEDAT_OFFER]
	//[NAME_USER_PROFESSIONAL]
	//[PRICE_OFFER]
	var newString = string;
  	for (var i = 0; i < arrayFindString.length; i++) {
		if(arrayNwString[i]){
			newString = newString.split(arrayFindString[i]).join(arrayNwString[i]); //Replace all instances of a substring
    		//newString = newString.replace(arrayFindString[i], arrayNwString[i]);
			//console.log("\n newString: "+newString+"  arrayFind:"+arrayFindString[i] + " arrayNwString: "+arrayNwString[i]);
		}
  	}
	console.log("*********** replaceString END ************* ");
	return newString;
}

function checkNotification(idListForms, emailTo, result){
	console.log("\n\n");
	console.log("* checkNotification * ");
	console.log("idListForms: " + idListForms);
	console.log("emailTo: " + emailTo);

	var query = new Parse.Query("ListForms");
	query.equalTo("objectId", idListForms);
	query.include('idUserResponder.idProfessional');
	query.include('idUserRequest');
	query.first().then(function(request){
		var idOfferAccepted = request.get("idOfferAccepted").id;
		var Offers = Parse.Object.extend("ListOffers");
		offer = new Offers();
		offer.id = idOfferAccepted;


		console.log("idOfferAccepted: " + idOfferAccepted);
		var userRequest = request.get("idUserRequest");
		var userRequestEmail = userRequest.get("email");
		console.log("userRequestEmail: " + userRequestEmail);
		var userResponder = request.get("idUserResponder");
		//var userResponderEmail = userResponder.get("email");
		var userResponderEmail = userResponder.get("idProfessional").get('email');
		console.log("userResponderEmail: " + userResponderEmail);

		

		var payment = new Parse.Query("Payments");
		payment.equalTo("idOffer", offer);
		payment.first().then(function(pay){
			
			
			console.log(" ======== select notify");
			switch(emailTo) {
			    case userRequestEmail:

			        pay.set("userRequestNotified", result);
			        console.log(" ======== IS UserRequest: "+ result);
			        pay.save({
						success: function(){
							console.log("notification Payment Saved");
						},
						error: function(){
							console.log("ERROR to save Payment notification");
						}
					})
			        break;
			    case userResponderEmail:

			    	pay.set("userResponderNotified", result);
			    	console.log(" ======== IS UserResponder: "+ result);
			    	pay.save({
						success: function(){
							console.log("notification Payment Saved");
						},
						error: function(){
							console.log("ERROR to save Payment notification");
						}
					})
			        
			        break;
			    case DEFAULT_ADMIN_EMAIL:
			    	pay.set("adminNotified", result);
			    	console.log(" ======== IS Admin: " + result);
			    	pay.save({
						success: function(){
							console.log("notification Payment Saved");
						},
						error: function(){
							console.log("ERROR to save Payment notification");
						}
					})
			        
			        break;
			    default:
        			console.log(" ======== Nessuno" + result);
			}

			
			
		})

	})
		
}

//----------------------------------------------//
//END LIST FUNCTIONS 
//----------------------------------------------//


//----------------------------------------------//
//START SEND EMAIL 
//----------------------------------------------//




function configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail){
	"use strict";
	console.log("* configSendEmail: "+toEmail+" -> "+subjectEmail+" *");
	/*
	console.log("***********configSendEmail*************");
	console.log("idListForms: " + idListForms);
	console.log("fromEmail: " + fromEmail);
	console.log("toEmail: " + toEmail);
	console.log("subjectEmail: " + subjectEmail);
	console.log("type: " + type);
	console.log("typeCode: " + typeCode);
	console.log("bodyEmail: " + bodyEmail);
	*/
	var arrayReplaceString = [];
	
	//var nwSubjectEmail = replaceString(subjectEmail);
	//var nwBodyEmail = replaceString(bodyEmail);

	arrayReplaceString.push(replaceString(subjectEmail));	
	arrayReplaceString.push(replaceString(bodyEmail));
	
	Parse.Promise.when(arrayReplaceString).then(function(results){
		//console.log(results[0]);
		var nwSubjectEmail = results[0];
		//console.log(results[1]);
		var nwBodyEmail = results[1];
		Parse.Cloud.run('sendEmail', {
				"idListForms" : idListForms, 
				"fromEmail" : fromEmail,
				"toEmail" : toEmail,
				"subjectEmail" : nwSubjectEmail,
				"type" : type,
				"typeCode" : typeCode,
				"bodyEmail" : nwBodyEmail
		}).then(function(resp) {
			console.log(resp);
			//return(resp);
		}, function(error) {
			console.log(error);
			return(error);
		});
		
	});
	
			
			
			
	/* // non entra nel Promise.when
	arrayReplaceString.push(replaceString(subjectEmail));	
	arrayReplaceString.push(replaceString(bodyEmail));
	console.log("Pre-Promise");
	Parse.Promise.when(arrayReplaceString).then(
	function(results) {
		config.log("results");
		config.log(results);
		
		var nwSubjectEmail = results[0];
		console.log("nwSubjectEmail :");
		console.log(nwSubjectEmail);
		
		var nwBodyEmail = results[1];
		console.log("nwBodyEmail : ");
		console.log(nwBodyEmail);
		console.log("Parse.Promise.when -> "+toEmail);
		Parse.Cloud.run('sendEmail', {
				"idListForms" : idListForms, 
				"fromEmail" : fromEmail,
				"toEmail" : toEmail,
				"subjectEmail" : nwSubjectEmail,
				"type" : type,
				"typeCode" : typeCode,
				"bodyEmail" : nwBodyEmail
			}).then(function(resp) {
				console.log(resp);
				return(resp);
			}, function(error) {
				console.log(error);
				return(error);
			});
	},function(error) {
	  // error
	  console.log(error);
	  return(error);
	});
	*/
}


Parse.Cloud.define("sendEmail", function(request, response) {
	"use strict";
	
	console.log("+++++++++ sendEmail: "+request.params.toEmail+" ++++++++++++");

	var fromEmail = request.params.fromEmail;
	var toEmail = request.params.toEmail;
  	var bodyEmail = request.params.bodyEmail;
  	var subjectEmail = request.params.subjectEmail;
  //	var idListForms = request.params.idListForms;
  	var typeSendEmail = request.params.type;
  	var htmlBody = bodyEmail;
  	
  	
	/*
	console.log(" +++++++++ fromEmail ++++++++++++"+fromEmail);
	console.log(" +++++++++ toEmail ++++++++++++"+toEmail);
	console.log(" +++++++++ bodyEmail ++++++++++++"+bodyEmail);
	console.log(" +++++++++ subjectEmail ++++++++++++"+subjectEmail);
	console.log(" +++++++++ idListForms ++++++++++++"+idListForms);
	console.log(" +++++++++ typeSendEmail ++++++++++++"+typeSendEmail);	
	*/
	
	client.sendEmail({
		//useMasterKey: true,
		to: toEmail,
		//bcc: arrayToEmail,
		from: fromEmail,
		subject: subjectEmail,
		text: bodyEmail,
		html: htmlBody
	}).then(function(httpResponse) {
		console.log("SAND EMAIL-Success: "+toEmail);
		//console.log("idListForms: " + idListForms);
		if(typeSendEmail == TYPE_ACCEPTED_OFFER){
			console.log("send email: " + typeSendEmail);
			if(request.params.idListForms){
				console.log("idForms: " + request.params.idListForms);
				//da idListForms ricavo l'idOfferAccepted che mi servirà per identificare l'id del Paganmento in Payment
				checkNotification(request.params.idListForms, toEmail, true);
			}


		}
		//response.success("Email sent! "+toEmail);
	}, function(httpResponse) {
		console.log("\n ERROR SAND EMAIL\n arrayToEmail:"+toEmail+"\n" );
		checkNotification(request.params.idListForms, toEmail, false);
		//console.error(httpResponse);
		//response.error("Uh oh, something went wrong");
	});
	response.success("Email sent! "+toEmail);
	
});
//----------------------------------------------//
//END SEND EMAIL 
//----------------------------------------------//


//----------------------------------------------//
//START PUSH NOTIFICATION 
//----------------------------------------------//
function configNotification(idListForms,idTo,subjectEmail,badge,type,idUserRequest){
	"use strict";
	//console.log(" * configNotification * ");
	//console.log("\n +++++++++ configNotification ++++++++++++\n idListForms:"+idListForms+"\n idTo:"+idTo+"\n subjectEmail:"+subjectEmail+"\n badge:"+badge);
	var arrayReplaceString = [];
	arrayReplaceString.push(replaceString(subjectEmail));	
	Parse.Promise.when(arrayReplaceString).then(
	function(results) {
		var nwSubjectEmail = results[0];
		/*
		console.log("idListForms: " +idListForms);
		console.log("idTo: " +idTo);
		console.log("subjectEmail: " +nwSubjectEmail);
		console.log("badge: " +badge);
		*/
		Parse.Cloud.run('sendNotification', {
			"idListForms" : idListForms,
			"idTo" : idTo,
			"alertMessage" : nwSubjectEmail,
			"badge" : badge,
			"type" : type,
			"idUserRequest" : idUserRequest
		}).then(function(resp) {
			return(resp);
		});
	},function(error) {
	  console.log("+++++++++ sendNotification error ++++++++++++"+error);
	  return(error);
	});
}

Parse.Cloud.define("sendNotification", function(request, response) {
    "use strict";
	console.log("+++++++++ sendNotification ++++++++++++");
	//response.success('notification sent TEST');
	
    var idTo = request.params.idTo;
    var alertMessage = request.params.alertMessage;
    var idListForms = request.params.idListForms;
    var badge = parseInt(request.params.badge);
    var type = request.params.type;
    var idUserRequest = request.params.idUserRequest;
    //Set push query
	var pushQuery = new Parse.Query(Parse.Installation);
	//var targetUser = new Parse.User();
	//targetUser.id = idTo;
	var userQuery = new Parse.Query(Parse.User);
	userQuery.equalTo("objectId", idTo);
	
	pushQuery.matchesQuery("user", userQuery);
	
	console.log("Test PreSendPush");
	Parse.Push.send(
	{
	
		where: pushQuery,
		data: {
			to: idTo,
			//t: "chat", // type
			idListForms: idListForms,
			badge: badge,
			alert: alertMessage,
			sound: "chime",
			title: alertMessage, // android only
			type: type,
			idUserRequest: idUserRequest
		}
	},
	
	{
		success: function(){
			console.log("NOTIFICATION-SEND success!!! -> "+ idTo);
			userQuery.first({
				success: function(user){
					console.log("USER TO notofication: ");
					console.log(user);
				},
				error: function(error){
					console.log("Error userQuery for notification: ");
					console.log(error);
				}
			})
			
		},
		error: function (error) {
			response.error(error);
		},	useMasterKey: true
	});
	response.success('notification sent');
	
});

Parse.Cloud.define("sendNotificationTest", function(request, response) {
    "use strict";
	console.log("+++++++++ sendNotification TEST ++++++++++++");
	//response.success('notification sent TEST');
	
    var idTo = "S2HF2Gqwsr";//request.params.idTo;
    var alertMessage = "test";//request.params.alertMessage;
    var idListForms = "";//request.params.idListForms;
    var badge = parseInt(2);
    var type = "";//request.params.type;
    var idUserRequest = "";//request.params.idUserRequest;
    //Set push query
	var pushQuery = new Parse.Query(Parse.Installation);
	//var targetUser = new Parse.User();
	//targetUser.id = idTo;
	var userQuery = new Parse.Query(Parse.User);
	userQuery.equalTo("objectId", idTo);
	pushQuery.matchesQuery("user", userQuery);
	
	console.log("Test PreSendPush");
	Parse.Push.send(
	{
	
		where: pushQuery,
		data: {
			to: idTo,
			//t: "chat", // type
			idListForms: idListForms,
			badge: badge,
			alert: alertMessage,
			sound: "chime",
			title: alertMessage, // android only
			type: type,
			idUserRequest: idUserRequest
		}
	},
	
	{
		success: function(){
			console.log("NOTIFICATION-SEND success!!! -> "+ idTo);
			userQuery.first({
				success: function(user){
					console.log("USER TO notofication: ");
					console.log(user);
				},
				error: function(error){
					console.log("Error userQuery for notification: ");
					console.log(error);
				}
			});
			
		},
		error: function (error) {
			response.error(error);
		},	useMasterKey: true
	});
	response.success('notification sent');
	
});
//----------------------------------------------//
// SAVE PAYMENT

//-----------------------------------------------//

function sendNotificationOffer(request){
	console.log("\n\n");
	console.log("* sendNotificationOffer *");
	console.log("idPayment: " + request.params.idPayment);
	var idOffer = request.params.idOffer; 
	console.log("idOffer: " + idOffer);
	var query = new Parse.Query("ListOffers");
	query.equalTo("objectId", idOffer);
	query.first().then(function(offer){
		console.log("idForms: " + offer.get("idListForms").id);
		var idListForms = offer.get("idListForms").id;
		console.log("TYPE_ACCEPTED_OFFER: " + TYPE_ACCEPTED_OFFER);
		Parse.Cloud.run('sendMessages', {
			"lang" : request.params.lang,
			"typeSendEmail" : TYPE_ACCEPTED_OFFER,
			"emailAdmin" : request.params.emailAdmin,
			"appName": request.params.appName,
			"idListForms" : idListForms,
			"idListOffers" : idOffer,
			//"idPayment": request.params.idPayment
		
		});
		
	})
	/*
	query.first({
		success: function(offer){
			console.log("idForms: " + offer.get("idListForms").id);
			var idListForms = offer.get("idListForms").id;
			console.log("TYPE_ACCEPTED_OFFER: " + TYPE_ACCEPTED_OFFER);
			Parse.Cloud.run('sendMessages', {
				"lang" : request.params.lang,
				"typeSendEmail" : TYPE_ACCEPTED_OFFER,
				"emailAdmin" : request.params.emailAdmin,
				"appName": request.params.appName,
				"idListForms" : idListForms,
				"idListOffers" : idOffer,
				//"idPayment": request.params.idPayment
			
			});
			
			//}).then(function(resp) {
			//	return(resp);
			//});
			
		},
		error: function(error){
			console.log("Error prapare offer notofocation: " + error);
			response.error('Error prapare offer notofocation:' + JSON.stringify(error));
		}
		
	});
	*/
}


Parse.Cloud.define("savePayment", function(request, response) {
    console.log("\n\n");
	console.log("* savePayment *");
	var idPayment = request.params.idPayment;
	var datePayment = request.params.datePayment;
	var idOffer = request.params.idOffer;
	var amount = request.params.amount;
	var lang = request.params.lang;
	var emailAdmin = request.params.emailAdmin;
	var appName = request.params.appName;

	console.log("idPayment: " + idPayment);
	console.log("datePayment: " + datePayment);
	console.log("idOffer: " + idOffer);
	console.log("amount: " + amount);
	console.log("lang: " + lang);
	console.log("emailAdmin: " + emailAdmin);
	console.log("appName: " + appName);


	var Offers = Parse.Object.extend("ListOffers");
	offer = new Offers();
	offer.id = idOffer;
	//console.log("1 ------------------------------------------------------------------------------------------------");


	var Payments = Parse.Object.extend("Payments");
	payment = new Payments();

	
	payment.set("idPayment" , idPayment);
	payment.set("idOffer" , offer);
	payment.set("amount" , Number(amount));

	//console.log("2 ------------------------------------------------------------------------------------------------");

	var dateP = new Date(datePayment);
	payment.set("datePayment" , dateP);
	
	
	payment.save().then(function(payment){
		console.log("SUCCESS save Payment"),
		//console.log("request Admin: " + request.params.emailAdmin);
		console.log("idPayment: " + payment.id);
		//request.params.idPayment = payment.id;
		sendNotificationOffer(request);
		response.success("Payment saved");
	}, function(error){
		console.log("error save Payment: " + error);
		response.error('error save Payment:' + JSON.stringify(error));
	});
	
	/*
	// invio multiplo di mail senza la response
	payment.save(null, {
		success: function(payment) {
			console.log("SUCCESS save Payment"),
			console.log("request Admin: " + request.params.emailAdmin);
			console.log("idPayment: " + payment.id);
			//request.params.idPayment = payment.id;
			sendNotificationOffer(request);

			//response.success("Payment saved");

		},
		error: function(error) {
			console.log("error save Payment: " + error);
			response.error('error save Payment:' + JSON.stringify(error));
		}
	});
	*/



});



//----------------------------------------------//
//START Send Messages 
//----------------------------------------------//


function sendAllMessage(request){
	console.log("\n\n");
	console.log("================================================");
	console.log("---------SEND MESSAGE: "+request.params.idListForms+"--------------");
	var lang = request.params.lang;
	var type = request.params.typeSendEmail;
	var emailAdmin = request.params.emailAdmin;
	var appName = request.params.appName;
	var idListForms = request.params.idListForms;
	var idListOffers = request.params.idListOffers;
	// strutture (intese come username del professionista) sottoscritte alla ricezione delle notifiche push.
	// la lista di sottoscrizioni viene ricevuta come stringa nel formato:
	// var subscribersList = subscriber_0,subscriber_1,...,subscriber_i,...,subscriber_n;  
	var subscribersList = request.params.subscribersList; 
	var arrayEmailTemplate = new Array;
	
	
	console.log("lang: " + lang);
	console.log("type: " +type);
	console.log("emailAdmin: " +emailAdmin);
	console.log("appName: " + appName);
	console.log("idListForms: " +idListForms);
	console.log("idListOffers: " +idListOffers);
	console.log("subscribersList: " + subscribersList);




	/*
	//IdUserRequests
	var ObjectRequest = Parse.Object.extend("ListForms");
	var query = new Parse.Query(ObjectRequest);
	query.equalTo("objectId",idListForms);
	query.first().get("idUserRequest").id;
	*/

	//var ObjectOffer = Parse.Object.extend("ListOffers");
	

	var UserSender = Parse.Object.extend("_User");
	var userSenderClient = new UserSender();
	var userSenderProfessional = new UserSender();
	var arrayAllEmailTo = new Array;
	var functionGetAddressesEmail;
	
   // Parse.Cloud.useMasterKey();
	var listFunctionsToCall = [];
	//results1
	var functionGetEmailTemplates = getEmailTemplates(lang,type);
	listFunctionsToCall.push(functionGetEmailTemplates);	
	//results2
	console.log("before functionGetRequestDetail");
	var functionGetRequestDetail = getRequestDetail(idListForms);
	console.log("after functionGetRequestDetail");
	/*
	Parse.Promise.when(functionGetRequestDetail).then(function(result) {
		console.log("result of functionGetRequestDetail : ");
		console.log(result);
	});
	*/
	listFunctionsToCall.push(functionGetRequestDetail);
	//results3
	var functionGetOfferDetail = getOfferDetail(idListOffers);
	listFunctionsToCall.push( functionGetOfferDetail);
	//results4
	if(type === TYPE_NEW_REQUEST ){
		console.log("TYPE_NEW_REQUEST");
		// functionGetAddressesEmail = getListAllEmailProfessional();
		functionGetAddressesEmail = decodeSubscriberList(subscribersList);
		listFunctionsToCall.push(functionGetAddressesEmail);
	}
	else if(type === TYPE_CANCELED_REQUEST ){
		functionGetAddressesEmail = getListEmailProfessionalSentOffer(idListForms);
		listFunctionsToCall.push(functionGetAddressesEmail);
	}
	else if(type === TYPE_NEW_OFFER ){
		//functionGetAddressesEmail = getLEmailLastBestOffer(idListForms);
		functionGetAddressesEmail = getListEmailProfessionalSentOffer(idListForms);
		listFunctionsToCall.push(functionGetAddressesEmail);
	}
	else if(type === TYPE_ACCEPTED_OFFER ){
		functionGetAddressesEmail = getListEmailProfessionalSentOffer(idListForms);
		listFunctionsToCall.push(functionGetAddressesEmail);
	}
    Parse.Promise.when(listFunctionsToCall).then(
		function(results){
			"use strict";
			//console.log("listFunctionsToCall");
			//console.log("results: " );
			//console.log(results );
			
			var results1 = results[0];
			//console.log("results1: ");
			//console.log(results1);
			// console.log('results1 == ' + JSON.stringify(results1));

			var objectRequest = results[1];
			//console.log("objectRequest: ");
			//console.log(objectRequest);
			// console.log('objectRequest == ' + JSON.stringify(objectRequest));
			
			var objectOffer = results[2];
			//console.log("objectOffer: ");
			//console.log(objectOffer );  
			// console.log('objectOffer == ' + JSON.stringify(objectOffer));
			
			var results4 = results[3];
			// console.log('results4 == ' + JSON.stringify(results4));
			//console.log("results4: ");
			//console.log(results4 );  
			//------------------------------------------------------//
			// START SET VARIABLES
			//------------------------------------------------------//
			// result1: 	  	list email template 
			// objectRequest: 	request+UserRequest
			// objectOffer:   	offer+UserResponder
			// result4: 	  	(TYPE_NEW_REQUEST)  		list Professional + IdUser  
			//		  			(TYPE_CANCELED_REQUEST) 	list Offers + IdUserResponder
			//		  			(TYPE_NEW_OFFER) 		Request + idUserResponder (bestPrice) -> (TYPE_CANCELED_REQUEST)
			//		  			(TYPE_ACCEPTED_OFFER)  = 	(TYPE_CANCELED_REQUEST)
			var i;
			for (i = 0; i < results1.length; i++) {
				arrayEmailTemplate.push(results1[i]);
			}
		
				
			for (i = 0; i < results4.length; i++) {
				arrayAllEmailTo.push(results4[i]);
				//console.log(i + ") result4");
				//console.log(results4[i]);
			}
			arrayFindString.length = 0;
			arrayNwString.length = 0;
			//console.log("\n objectRequest: "+objectRequest);  
			userSenderClient = objectRequest.get("idUserRequest");
			//var idUserRequest = userSenderClient.id;
			console.log("START-SET-VARIABLES");
			NAME_APP = appName;
			if(NAME_APP){
				arrayFindString.push("[NAME_APP]");
				arrayNwString.push(NAME_APP);
				console.log("NAME_APP: " + NAME_APP);
			}
			ID_REQUEST = idListForms;
			if(ID_REQUEST){
				arrayFindString.push("[ID_REQUEST]");
				arrayNwString.push(ID_REQUEST);
				console.log("ID_REQUEST: " + ID_REQUEST);
			}
			CREATEDAT_REQUEST = objectRequest.createdAt;
			if(CREATEDAT_REQUEST){
				arrayFindString.push("[CREATEDAT_REQUEST]");
				arrayNwString.push(CREATEDAT_REQUEST);
				console.log("CREATEDAT_REQUEST: " + CREATEDAT_REQUEST);
			}
			NAME_USER_CLIENT = userSenderClient.get("fullName");
			if(NAME_USER_CLIENT){
				arrayFindString.push("[NAME_USER_CLIENT]");
				arrayNwString.push(NAME_USER_CLIENT);
				console.log("NAME_USER_CLIENT: " + NAME_USER_CLIENT);
			}
			BEST_PRICE = objectRequest.get("price");
			if(BEST_PRICE){
				arrayFindString.push("[BEST_PRICE]");
				arrayNwString.push(BEST_PRICE);
				console.log("BEST_PRICE: " + BEST_PRICE);
			}
			ID_OFFER = idListOffers;
			if(ID_OFFER){
				arrayFindString.push("[ID_OFFER]");
				arrayNwString.push(ID_OFFER);
				console.log("ID_OFFER: " + ID_OFFER);
			}
			if(objectOffer){
				userSenderProfessional = objectOffer.get("idUserResponder");
				CREATEDAT_OFFER = objectOffer.createdAt;
				if(CREATEDAT_OFFER){
					arrayFindString.push("[CREATEDAT_OFFER]");
					arrayNwString.push(CREATEDAT_OFFER);
					console.log("CREATEDAT_OFFER: " + CREATEDAT_OFFER);
				}
				NAME_USER_PROFESSIONAL = userSenderProfessional.get("fullName");
				if(NAME_USER_PROFESSIONAL){
					arrayFindString.push("[NAME_USER_PROFESSIONAL]");
					arrayNwString.push(NAME_USER_PROFESSIONAL);
					console.log("NAME_USER_PROFESSIONAL: " + NAME_USER_PROFESSIONAL);
				}
				PRICE_OFFER = objectOffer.get("price");
				if(PRICE_OFFER){
					arrayFindString.push("[PRICE_OFFER]");
					arrayNwString.push(PRICE_OFFER);
					console.log("PRICE_OFFER: " + PRICE_OFFER);
				}
			}
			console.log("END-SET-VARIABLES");
			
			//console.log("arrayEmailTemplate");  
			//console.log("\n job1: "+arrayEmailTemplate);  
			//console.log("\n job2: "+userSenderClient); 
			//------------------------------------------------------//
			// END SET VARIABLES
			//------------------------------------------------------//
			var promises = [];
			for (i = 0; i < arrayEmailTemplate.length; i++) 
			{
				var fromEmail = arrayEmailTemplate[i].get("fromEmail");
				if(!emailAdmin){
					emailAdmin = arrayEmailTemplate[i].get("toEmail");
				}
				var subjectEmail = arrayEmailTemplate[i].get("subjectEmail");
				var type = arrayEmailTemplate[i].get("type");
				var typeCode = arrayEmailTemplate[i].get("typeCode");
				var bodyEmail = arrayEmailTemplate[i].get("bodyEmail");
				
				var functionSendEmailtoAdmin;
				var functionSendEmailtoClient;
				var functionSendEmailtoProf;
				var functionSendNotification;

				var user = new UserSender();
				var ii;
				var toEmail;
				var idTo;
				var badge = 1;
				
				if(type === TYPE_NEW_REQUEST ){
					console.log("TYPE_NEW_REQUEST");
					if(typeCode === 10){
						// - invio email di conferma nuova richiesta al cliente e all'amministratore
						toEmail = userSenderClient.get("email");
						//console.log("\nTYPE_NEW_REQUEST(10) - EmailTo: " + toEmail);
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);	
					}
					else if(typeCode === 20){
						// - invio email di nuova richiesta a tutti i professionisti e all'amministratore
						//console.log("\n ------arrayAllEmailProfessional : "+arrayAllEmailTo.length);
						var arrayToEmail = new Array;
						//"arrayToEmail" contiene gli username degli utenti a cui è già stata inviata la mail
						arrayToEmail.push(userSenderClient.get("username"));
						for (ii = 0; ii < arrayAllEmailTo.length; ii++) 
						{

							var professional = arrayAllEmailTo[ii];

							user = professional.get("idUser");
							// console.log("user ==== " + JSON.stringify(user));

							console.log("***********************************************");
							console.log("professional == " + JSON.stringify(professional));
							console.log("user == " + JSON.stringify(user));
							// console.log(professional.get("email"));
							//console.log("SendTo: "+user.get("email"));
							//console.log("\n ------ user : "+arrayAllEmailTo[ii]+ " ---- user :"+arrayAllEmailTo[ii].get("idUser"));
							if(arrayToEmail.indexOf(user.get("username")) === -1){
								arrayToEmail.push(user.get("username"));
								// toEmail = professional.get("email");
								// idTo = user.id;
								// //console.log("\n ------prepare for send email : "+toEmail); 
								// functionSendEmailtoProf = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
								// promises.push(functionSendEmailtoProf);
								// //send notification
								// functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
								// promises.push(functionSendNotification);
							}

							toEmail = professional.get("email");
							idTo = user.id;
							//console.log("\n ------prepare for send email : "+toEmail); 
							functionSendEmailtoProf = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
							promises.push(functionSendEmailtoProf);
							//send notification
							// manda la notifica push di nuova richiesta a tutti i professioni elegibili ad esclusione di se stesso
							if(idTo !== userSenderClient.id) { 
								functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
								promises.push(functionSendNotification);
							}
						}
						if(arrayToEmail.length>0){
							functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
							promises.push(functionSendEmailtoAdmin);	
						}
					}
				} // end type === TYPE_NEW_REQUEST
				else if(type === TYPE_CANCELED_REQUEST){
					console.log("TYPE_CANCELED_REQUEST");
					if(typeCode === 10){
						// - invio email di conferma eliminazione al cliente e all'amministratore
						//console.log("\n ------TYPE_CANCELED_REQUEST : "+userSenderClient.get("email"));
						toEmail = userSenderClient.get("email");
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);	
					}
					else if(typeCode === 20){
						// - invio email di conferma eliminazione a tutti i professionisti partecipanti all'asta e all'amministratore
						//console.log("\n ------arrayEmailProfessionalSentOffer : "+arrayAllEmailTo.length);
						var arrayToEmail = new Array;
						//"arrayToEmail" contiene gli username degli utenti a cui è già stata inviata la mail
						for (ii = 0; ii < arrayAllEmailTo.length; ii++) 
						{
							user = arrayAllEmailTo[ii].get("idUserResponder");
							if(arrayToEmail.indexOf(user.get("username")) === -1){
								arrayToEmail.push(user.get("username"));
								idTo = user.id;
								//toEmail = user.get("email");
								toEmail = user.get("idProfessional").get('email');
								//console.log("\n ------prepare for send idTo : "+idTo); 
								functionSendEmailtoProf = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
								promises.push(functionSendEmailtoProf);
								//send notification
								console.log("userSenderClient.id: "+userSenderClient.id);
								functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
								promises.push(functionSendNotification);
							}
						}
						if(arrayToEmail.length>0){
							functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
							promises.push(functionSendEmailtoAdmin);
						}
					}
				} // end if(type === TYPE_CANCELED_REQUEST)
				else if(type === TYPE_NEW_OFFER){
					console.log("TYPE_NEW_OFFER");
					if(typeCode === 10){
						// - invio email di una nuova offerta al cliente e all'amministratore
						toEmail = userSenderClient.get("email");
						idTo = userSenderClient.id;
						//console.log("\n ------ 10 : "+toEmail);
						//fromEmail = userSenderProfessional.get("email");
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);	
						
						//send notification
						functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
						promises.push(functionSendNotification);
					}
					else if(typeCode === 20){
						// - invio email di conferma nuova offerta al professionista e all'amministratore
						//toEmail = userSenderProfessional.get("email");
						console.log(userSenderProfessional);
						console.log(JSON.stringify(userSenderProfessional));
						console.log(userSenderProfessional.get("idProfessional"));
						console.log(JSON.stringify(userSenderProfessional.get("idProfessional")))
						console.log(userSenderProfessional.get("idProfessional").attributes.email);
						
						toEmail = userSenderProfessional.get("idProfessional").get("email");
						//console.log("\n ------ 20 : "+toEmail);
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);		
					}
					else if(typeCode === 30){
						// - invio email di avviso superamento offerta al professionista e all'amministratore
						//console.log("\n ------ 30 : "+arrayAllEmailTo.length);
						
						var arrayToEmail = new Array;
						//"arrayToEmail" contiene gli username degli utenti a cui è già stata inviata la mail
						//arrayAllEmailTo: contiene la lista delle offerte (per la richiesta) in ordine di prezzo
						console.log("arrayAllEmailTo: " + arrayAllEmailTo.length);
						console.log("best Price: " + arrayAllEmailTo[0].get("price"));
						console.log("best Offer Id: " + arrayAllEmailTo[0].id);
						console.log("current Offer Id: " + objectOffer.id);
						var bestUser = arrayAllEmailTo[0].get("idUserResponder");
						console.log("best User: " + bestUser.get("username"));
						console.log("LISTA OFFERENTI:");
						//se l'offerta eseguita è la migliore notifica a tutti "offerta superata"
						if(arrayAllEmailTo[0].id == objectOffer.id){
							arrayToEmail.push(userSenderClient.get("username"));
							arrayToEmail.push(userSenderProfessional.get("username"));
							
							for (ii = 0; ii < arrayAllEmailTo.length; ii++) 
							{
								user = arrayAllEmailTo[ii].get("idUserResponder");
								console.log(user.get("username") +":  " +arrayAllEmailTo[ii].get("price"));
								//arrayToEmail contiene le mail già inviate
								if(arrayToEmail.indexOf(user.get("username")) === -1){
									arrayToEmail.push(user.get("username"));
									idTo = user.id;
									toEmail = user.get("idProfessional").get('email');
									//console.log("\n ------prepare for send email : "+toEmail); 
									functionSendEmailtoProf = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
									promises.push(functionSendEmailtoProf);
									
									//send notification
									console.log("userSenderClient.id: "+userSenderClient.id);
									functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
									promises.push(functionSendNotification);
								}
								
								
							}
							if(arrayToEmail.length>0){
								functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
								promises.push(functionSendEmailtoAdmin);	
							}
						}
						/* ( Dario )
						if(arrayToEmail.indexOf(user.get("email")) === -1 && user.get("email") !== userSenderProfessional.get("email")){
							arrayToEmail.push(user.get("email"));
							idTo = user.id;
							toEmail = user.get("email");
							//console.log("\n ------prepare for send email : "+toEmail); 
							functionSendEmailtoProf = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
							promises.push(functionSendEmailtoProf);
							
							//send notification
							console.log("userSenderClient.id: "+userSenderClient.id);
							functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
							promises.push(functionSendNotification);
						}
						*/
						
					}
				} // end if(type === TYPE_NEW_OFFER)
				else if(type === TYPE_ACCEPTED_OFFER){
					console.log("TYPE_ACCEPTED_OFFER");
					if(typeCode === 10){
						// - invio email di una nuova offerta al cliente e all'amministratore
						toEmail = userSenderClient.get("email");
						//console.log("\n ------ 10 : "+toEmail);
						//fromEmail = userSenderProfessional.get("email");
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);	
					}
					else if(typeCode === 20){
						// - invio email di conferma offerta accettata al professionista e all'amministratore
						//toEmail = userSenderProfessional.get("email");
						toEmail = userSenderProfessional.get("idProfessional").get("email");
						idTo = userSenderProfessional.id;
						
						//console.log("\n ------ 20 : "+toEmail);
						functionSendEmailtoClient = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
						functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
						promises.push(functionSendEmailtoClient);
						promises.push(functionSendEmailtoAdmin);
						
						//send notification
						functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
						promises.push(functionSendNotification);
					}
					else if(typeCode === 30){
						// - invio email di avviso chiusura richiesta ai professionista partecipanti all'asta e all'amministratore
						//console.log("\n ------ 30 : "+arrayAllEmailTo.length);
						var arrayToEmail = new Array;
						arrayToEmail.push(userSenderProfessional.get("username"));
						for (ii = 0; ii < arrayAllEmailTo.length; ii++) 
						{
							user = arrayAllEmailTo[ii].get("idUserResponder");
							
							if(arrayToEmail.indexOf(user.get("username")) === -1){
								arrayToEmail.push(user.get("username"));
								idTo = user.id;
								//toEmail = user.get("email");
								toEmail = user.get("idProfessional").get('email');
								//console.log("\n ------prepare for send email : "+toEmail); 
								functionSendEmailtoProf = configSendEmail(idListForms,fromEmail,toEmail,subjectEmail,type,typeCode,bodyEmail);
								promises.push(functionSendEmailtoProf);
								
								//send notification
								functionSendNotification = configNotification(idListForms,idTo,subjectEmail,badge,type,userSenderClient.id);
								promises.push(functionSendNotification);
							}
						}
						if(arrayToEmail.length>0){
							functionSendEmailtoAdmin = configSendEmail(idListForms,fromEmail,emailAdmin,subjectEmail,type,typeCode,bodyEmail);
							promises.push(functionSendEmailtoAdmin);	
						}
					}
				} //end if(type === TYPE_ACCEPTED_OFFER)
				//console.log("\n ii: "+i);
			} // end cicle
		
			

			// Invio notifiche in serie 
			var promise = Parse.Promise.as();
            		promises.forEach(function(p){
                		promise = promise.then(p);
                 
            		});
            
            return promise;
 
            //response.success("OK MESSAGE SAND");
			


			/* invio notifiche in serie (invia solo le prime 5)
			var promise = Parse.Promise.as();
			Parse.Promise.as().then(function(){ 

				promises.forEach(function(p){
					promise = promise.then(p);
					
				});
				return promise;
			}).then(function(result){
				response.success("OK MESSAGE SAND");
			},function(error) {
				console.log("Error Send Message: "+error);
	  			return(error);
			});
			*/
			
			/* invio notifiche in parallelo (invia solo le prime 5)
			Parse.Promise.when(promises).then(function() {
			  // all done
			  console.log("OK MESSAGE SAND");
			  response.success("OK MESSAGE SAND");
			}, function(error) {
			  // error
			  console.log("\n ***********ERROR*************");
			  response.error(error);
			});	
			*/
			
	}, 
	function(error) {
		console.error("error on promise: ");
		console.error(error);
		response.error(error);
	}
	);
	
}	






Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});


Parse.Cloud.define('testquery', function(req, res) {
 	var query = new Parse.Query("EmailConfig");
 	query.limit(1); 
	query.find({
    success: function(results) {
    	res.success("Payment saved");
    },
    error: function() {
      res.error("movie lookup failed");
    }
  });
});



Parse.Cloud.define('testquery2', function(req, res) {
 	var query = new Parse.Query("ListForms");
	query.equalTo("objectId", "WNSbHDmE7u");
	query.include('idUserRequest');
	
	query.find({
    success: function(results) {
    	res.success(results);
    },
    error: function() {
      res.error("movie lookup failed2");
    }
  });
});




Parse.Cloud.define('testquery3', function(req, res) {
 	console.log("testquery3");
	var myfunc = [];
	myfunc.push(function(){console.log("test1")});
	myfunc.push(console.log("test2"));
	Parse.Promise.when(myfunc).then(function() {
		console.log("test3");
	});
	
	console.log("testquery3 end");
  });


Parse.Cloud.define('testnotify', function(req, res) {
	console.log("testnotify");
	var userQuery = new Parse.Query(Parse.User);
	userQuery.equalTo("username", "Peppe");

	// Find devices associated with these users
	var pushQuery = new Parse.Query(Parse.Installation);
	pushQuery.matchesQuery('user', userQuery);
	console.log("TEST prePush");
	//var query = new Parse.Query(Parse.Installation);
	//query.equalTo("objectId","0YMM3lzkr5");
/*	pushQuery.find({ useMasterKey: true ,
    success: function(results) {
    	res.success(results);
    },
    error: function(error) {
      res.error(error);
    }
    });*/
   
    Parse.Push.send(
	{
		where: pushQuery,
		data: {
			to: "H2xdLVO48D",
			//t: "chat", // type
			idListForms: "WNSbHDmE7u",
			//badge: badge,
			alert: "ciao",
			sound: "chime",
			title: "alertMessage", // android only
			type: "TYPE_NEW_OFFER",
			idUserRequest: "H2xdLVO48D"
		}
	},
	{
		success: function(){
			console.log("NOTIFICATION SENT");
			console.log(pushQuery);
			res.success('notification sent');
		},
		error: function (error) {
			res.error(error);
			console.log("ERROR NOTIFICATION SENT");
			console.log(error);
		},	useMasterKey: true
	}
	
	);

	console.log("testnotify end");
});

Parse.Cloud.define('testEmail', function(req, res) {
	console.log("* Test Email *");
	client.sendEmail({
		//useMasterKey: true,
		to: "giuseppe.trazza@gmail.com",
		//bcc: arrayToEmail,
		from: "info@rukku.it",
		subject: "Test Email",
		//text: "body text",
		html: "html Body"
	}).then(function(httpResponse) {
		console.log("SAND EMAIL-Success: ");
		console.log(httpResponse);
		response.success('email sent TEST');
	}, function(httpResponse) {
		console.log("\n ERROR SAND EMAIL\n arrayToEmail:");
	
		//console.error(httpResponse);
		response.error("Uh oh, something went wrong");
	});
 	
});

//***************************************************************************
//************************ REFACTORING **************************************
//***************************************************************************

Parse.Cloud.define("sendMessages", function(request, response) {
	//"use strict";
	
	console.log("* prepareMessageParameter *");
	var lang = request.params.lang;
	var type = request.params.typeSendEmail;
	//control default template
	var query = new Parse.Query("EmailConfig");
	query.equalTo("lang", lang);
	query.equalTo("type", type);
	var prepare = query.count().then(function(num){
		//console.log("num: " + num);
		if(num==0){
			console.log("DEFAULT_LANG: " + DEFAULT_LANG);
			request.params.lang = DEFAULT_LANG;
		}
		return request;
		
	});

	//var prepareParameter = prepareMessageParameter(request);

	Parse.Promise.when(prepare).then(function(request) {
			  // all done
		var type = request.params.typeSendEmail;
		console.log("PREPARE MESSAGE: " + type);
		//separare la funzione "sendAllMessage" in più funzioni in base al tipo
		switch(type) {
			case TYPE_WELLCOME:
			        console.log("WELLCOME");
				sendWellcomeMessage(request);
			        break;
			        
			case TYPE_RECOVERY_PASSWORD:
			        console.log("TYPE_RECOVERY_PASSWORD");
				recoveryPassword(request);
			        break;
			        
			default:
        			sendAllMessage(request);
		}
		/*
		if(type == TYPE_WELLCOME){
			console.log("WELLCOME");
			sendWellcomeMessage(request);
		}else{
			sendAllMessage(request);
		}
		*/
	  	console.log("OK MESSAGE SAND");
	  	response.success("Respnse: OK MESSAGE SAND");
	}, 	function(error) {
	  	// error
	  	console.log("***********ERROR SEND MESSAGE *************");
	  	console.log(error);
	  	response.error(error);
	});	
});


function sendEmail(param){
	Parse.Cloud.run('sendEmail', param ).then(function(resp) {
		console.log(resp);
		//return(resp);
	}, function(error) {
		console.log(error);
		return(error);
	});
}

//tutte le possibili variabili da sostituire ai template delle mail 
function getParamTemplate(param){
	var arrayFindString = new Array;
	var arrayNwString = new Array;
	//TODO: separare header, footer e social nei teplate
	//
	
	if(param.NAME_APP){
		arrayFindString.push("[NAME_APP]");
		arrayNwString.push(param.NAME_APP);
		console.log("NAME_APP: " + param.NAME_APP);
	}
	
	if(param.NAME_USER_CLIENT){
		arrayFindString.push("[NAME_USER_CLIENT]");
		arrayNwString.push(param.NAME_USER_CLIENT);
		console.log("NAME_USER_CLIENT: " + param.NAME_USER_CLIENT);
	}
	
	if(param.ID_REQUEST){
		arrayFindString.push("[ID_REQUEST]");
		arrayNwString.push(param.ID_REQUEST);
		console.log("ID_REQUEST: " + param.ID_REQUEST);
	}
	
	if(param.NEW_PASSWORD){
		arrayFindString.push("[NEW_PASSWORD]");
		arrayNwString.push(param.NEW_PASSWORD);
		console.log("NEW_PASSWORD: " + param.NEW_PASSWORD);
	}
	
	var returnArray = {
		"arrayLbl": arrayFindString,
		"arrayValue": arrayNwString
	}
	
	
	return returnArray;
}

function replaceTemplate(template, p){
	"use strict";
	console.log("*********** replaceString START ************");
	var arrayLbl = p.arrayLbl;
	var arrayValue = p.arrayValue;
	
	var string = template;
	var newString = string;
  	for (var i = 0; i < arrayLbl.length; i++) {
		if(arrayValue[i]){
			newString = newString.split(arrayLbl[i]).join(arrayValue[i]); //Replace all instances of a substring

		}
  	}
	console.log("*********** replaceString END ************* newString: ");
	return newString;
}

//Type: TYPE_WELLCOME  (email di benvenuto da inviare alla registrazione) 
//TypeCode: 
//	10 = nuovo utente
//	20 = amministratore
function sendWellcomeMessage(request){
	console.log("* sendWellcomeMessage * ");
	console.log(request);
	var idUser = request.params.idUser;
	var lang = request.params.lang;
	var type = request.params.typeSendEmail;
	var appName = request.params.appName;
	var emailAdmin = request.params.emailAdmin;
	
	var query = new Parse.Query("_User");
	query.equalTo("objectId", idUser);
	query.first().then(function (user){
		var username = user.get("username");
		var toEmail = user.get("email");
		console.log(lang);
		console.log(type);
		console.log(username);
		console.log(toEmail);
		
		//preparo i parametri per il template
		var paramTemplate = {
			"NAME_APP": appName,
			"NAME_USER_CLIENT": username
		}
		
		var parameterArray = getParamTemplate(paramTemplate);
		
		//recuperare il template 
		var functionGetEmailTemplates = getEmailTemplates(lang,type);

		//per ogni template recupero il testo e lo passo a 'replaceTemplate'
		Parse.Promise.when(functionGetEmailTemplates).then(function (emailTemplates){
		
			console.log(emailTemplates);
			emailTemplates.forEach(function (template){
				//console.log(template.get("subjectEmail"));
				//console.log(template.get("bodyEmail"));	
				var subject = replaceTemplate(template.get("subjectEmail"), parameterArray);
				var body = replaceTemplate(template.get("bodyEmail"), parameterArray);
				var fromEmail = template.get("fromEmail");
				console.log(subject);
				console.log(body);
				var typeCode = template.get("typeCode");
				if(typeCode==10){
					var data = {
						"fromEmail" : fromEmail,
						"toEmail" : toEmail,
						"subjectEmail" : subject,
						"type" : type,
						"bodyEmail" : body
					}	
				}
				else if (typeCode == 20){
					var data = {
						"fromEmail" : fromEmail,
						"toEmail" : emailAdmin,
						"subjectEmail" : subject,
						"type" : type,
						"bodyEmail" : body
					}
				}
				sendEmail(data);
				
				
			});
			
			
		});
		//(stamparlo nel log)


	}, function(error) {
	  	// error
	  	console.log("***********ERROR: find User WellCome *************");
	  	console.log(error);
	  	response.error(error);
	});	

}

//Type: TYPE_RECOVERY_PASSWORD 
//Descrizione: Sostituzione password e invio mail con nuova password 
//TypeCode: 
//	10 = nuovo utente
//param:
//	''
// 	userEmail
function recoveryPassword(request){
	"use strict";
	console.log("* recoveryPassword * ");
	var userEmail = request.params.userEmail;
	var lang = request.params.lang;
	var type = request.params.typeSendEmail;
	var appName = request.params.appName;
	var emailAdmin = request.params.emailAdmin;
	
	
	var newPassword = Math.random().toString(36).slice(-8);

	console.log("EMAIL: " + userEmail);
	console.log("PASSWORD TEMPORANEA: " + newPassword);

    	var query = new Parse.Query("_User");
    	query.equalTo("email", userEmail);
    	query.first({
		success: function(user){
			console.log("User: " + user.id);
			console.log(user);
			console.log("user Find success");
			console.log("session Token: " + user._sessionToken);
			user.setPassword(newPassword);
			user.save(null, { useMasterKey: true }).then( function(user){
				console.log("NEW Password Recovered");
				console.log(user);
				var username = user.get("username");
				console.log("USERNAME: " + username);
				//preparo i parametri per il template
				var paramTemplate = {
					"NAME_APP": appName,
					"NAME_USER_CLIENT": username,
					"NEW_PASSWORD": newPassword
				}
				
				var parameterArray = getParamTemplate(paramTemplate);
				
				//recuperare il template 
				var functionGetEmailTemplates = getEmailTemplates(lang,type);
		
				//per ogni template recupero il testo e lo passo a 'replaceTemplate'
				Parse.Promise.when(functionGetEmailTemplates).then(function (emailTemplates){
				
					console.log(emailTemplates);
					emailTemplates.forEach(function (template){
						//console.log(template.get("subjectEmail"));
						//console.log(template.get("bodyEmail"));	
						var subject = replaceTemplate(template.get("subjectEmail"), parameterArray);
						var body = replaceTemplate(template.get("bodyEmail"), parameterArray);
						var fromEmail = template.get("fromEmail");
						console.log(subject);
						console.log(body);
						var typeCode = template.get("typeCode");
						if(typeCode==10){
							var data = {
								"fromEmail" : fromEmail,
								"toEmail" : userEmail,
								"subjectEmail" : subject,
								"type" : type,
								"bodyEmail" : body
							}	
						}
						else if (typeCode == 20){
							var data = {
								"fromEmail" : fromEmail,
								"toEmail" : emailAdmin,
								"subjectEmail" : subject,
								"type" : type,
								"bodyEmail" : body
							}
						}
						sendEmail(data);
						
						
					});
					
					
				});
				
			}, function(error) {
			  	// error
			  	console.log("ERROR: save new Password");
			  	console.log(error);
			  	
			});	
			
			
		},
		error: function (error) {
			console.log("ERROR Find User");
			console.log(error);
			//response.error('ERROR Find User');
		},	useMasterKey: true
	
	});

	
}

/*
Parameters: 
	userId (id dell'utente da eliminare)
*/	
Parse.Cloud.define("deleteUserWithId", function(request, response) {
    //Parse.Cloud.useMasterKey();
    console.log("DELETE USER");
    console.log(request);
    var userId = request.params.userId;
    var query = new Parse.Query(Parse.User);
    query.equalTo("objectId", userId);
    
    query.first({
		success: function(user){
			console.log("Delete User: " + user.id);
			user.destroy({
				success: function(){
					console.log("user DESTROIED");
					response.success('user DESTROIED');
				},
				error: function(){
					console.log("ERROR user DESTROIED");
					response.error('ERROR user DESTROIED');
					
				}, useMasterKey: true
				
			});
			console.log("user Find success");
			
		},
		error: function (error) {
			console.log("ERROR Find User");
			console.log(error);
			response.error('ERROR Find User');
		},	useMasterKey: true
	
	});
});

/*
- Aggiunge il campo idProfessional all'utente 
Parameters: 
	userId (id dell'utente)
	prfId (id del profilo professionista)
*/	
Parse.Cloud.define("addProfessionalToUser", function(request, response) {
    	console.log("* Users.addProfessional * ");
	var that = this; 
	
	var userId = request.params.userId;
	var profId = request.params.professionalId;
	
	var User = Parse.Object.extend("_User");
	var query = new Parse.Query(User);
	query.equalTo("objectId", userId);
	query.first({
		success: function(user){
			console.log("success get USER:");
			console.log(user);
			var Professional = Parse.Object.extend("Professional");
			var query = new Parse.Query(Professional);
			query.equalTo("objectId", profId);
			query.first({
				success: function(newProf){
					console.log("succes get PROFESSIONAL:");
					console.log(newProf);
					user.set("idProfessional", newProf);
					user.save(null, {
						success: function(p){
							console.log("success Update User:");
							console.log(p);
							response.success('user Updated');
							
						},
						error: function(user, error){
							console.error("Errore  Users.getUser: ");
							console.error(error);
							response.error(error);
						
						}, useMasterKey: true
					});
				},
				error: function(error){
					console.error("Errore  Users.addProfessional to getProfessional");
					console.error(error);
					response.error(error);
				}
			});
		},
		error: function(error){
			console.error("Errore  Professional.newProfessional to getUser ");
			console.error(error);
			response.error(error);

		
		}
	});
		
});

function saveProfileImage(url, callback){
	console.log("Start saveProfileImage");
	var xhr = new XMLHttpRequest(); 
	xhr.open("GET", url); 
	console.log(xhr);
	xhr.responseType = "blob";//force the HTTP response, response-type header to be blob
	xhr.onload = function() 
	{
		console.log("Start xhr.onload");
	    	var blob = xhr.response;//xhr.response is now a blob object
	    	console.log(blob);
	    	var tempFile = new File([blob], "temp_file_image");
	    	console.log("File:");
	    	console.log(image);
	    	var name = "imageProfile.png";
		var parseFile = new Parse.File(name, tempFile); 
		parseFile.save().then(function(res) {
			
			console.log("savedFile: ");
			console.log(res);
			callback(true, res);
		
		}, function(error) {
		  	console.error(error);
		  	callback(false, error);
			  	
		});
	}
	xhr.send();
		
    	
}

function retriveFile(url, callback){
	console.log("Start retriveFile");
	Parse.Cloud.httpRequest({ url: url }).then(function(response) {
	  // The file contents are in response.buffer.
	  console.log("retriveFile SUCCESS");
	  console.log(response);
	  console.log("status: " +  response.status);
	  console.log("headers:");
	  //console.log(response.headers);
	  console.log(response.buffer.data);
	  //console.log(JSON.stringify(response));
	  var name = "imageProfile.png";
	  var file = new Parse.File(name, response.buffer.data, 'image/png');

	  callback(true, file);
	}, function(error) {
	  	console.error(error);
	  	callback(false, error);
			  	
	});

}

function saveUser(user, callback){
	console.log("Start saveUser");
	user.save(null, {
		success: function(p){
			console.log("success Update User:");
			console.log(p);
			callback(true, p);
			
		},
		error: function(user, error){
			console.error("Errore  Users.getUser: ");
			console.error(error);
			callback(false, error);
		
		}, useMasterKey: true
	});
}
//Per L'amministratore: consente di aggiornare i dati del profilo di un'altro utente
Parse.Cloud.define("updateUser", function(request, response) {
    	console.log("* Users.updateUser * ");
    	console.log(request);
    	
    	console.log("objectId: " + request.params.objectId);
    	
    
    	//recupero l'immagine dall'url
    	var User = Parse.Object.extend("_User");
	var query = new Parse.Query(User);
	query.equalTo("objectId", request.params.objectId);
	query.first({
		success: function(user){
			console.log("query success");
			if(request.params.email){
				console.log("email: " + request.params.email);
				user.set("email" , request.params.email);
			}
			
			if(request.params.fullName){
				console.log("fullName: " + request.params.fullName);
				user.set("fullName" , request.params.fullName);
			}
			//TODO finire si completare il salvataggio dell'immagine
			if(false/*request.params.image*/){
				console.log("imageURL: " + request.params.image.url);
				
				var callback = function(result, resp){
					if(result){
						console.log("saveProfileImage SUCCESS");
						user.set("image" , resp);
						
						var callbackUser = function(result, res){
							if(result){
								response.success(true);
							}else{
								response.error(error);
							}
						}
						saveUser(user, callbackUser);
					}else{
						console.error("ERROR: saveProfileImage:");
						console.error(error);
						response.error(error);
					}
				}
				retriveFile(request.params.image.url, callback);
				
			}else{
				var callbackUser = function(result, resp){
					if(result){
						console.log("saveUser SUCCESS");
						response.success(true);
					}else{
						response.error(error);
					}
				}
				saveUser(user, callbackUser);
			}
			console.log(user);
			
			
		},
		error: function(error){
			console.error("Errore  updateUser - get user ");
			console.error(error);
			response.error(error);
		
		}
	});	
});

/*
Parameters: 
	professionalId (id del professionista da eliminare)
*/	
Parse.Cloud.define("deleteProfessionalWithId", function(request, response) {
    //Parse.Cloud.useMasterKey();
    console.log("DELETE PROFESSIONAL");
    console.log(request);
    var professionalId = request.params.professionalId;
	
	var Professional = Parse.Object.extend("Professional");
	var query = new Parse.Query(Professional);
    query.equalTo("objectId", professionalId);
    
    query.first({
		success: function(professional){
			console.log("Delete professional: " + professional.id);

			professional.destroy({
				success: function(){
					console.log("professional destroyed");
					response.success('SUCCESS');
				},
				error: function(){
					console.log("ERROR professional destroyed");
					response.error('ERROR');
					
				}, useMasterKey: true
				
			});
			console.log("professional found with success");
			
		},
		error: function (error) {
			console.log("ERROR professional not found");
			console.log(error);
			response.error('ERROR');
		},	useMasterKey: true
	
	});
});

/*
- Valorizza a null il campo idProfessional dell'utente 
Parameters: 
	userId (id dell'utente)
	prfId (id del profilo professionista)
*/	
Parse.Cloud.define("detachProfessionalFromUser", function(request, response) {
    	console.log("* Users.detachProfessionalFromUser * ");
	var that = this; 
	
	var userId = request.params.userId;
	var profId = request.params.professionalId;
	
	var User = Parse.Object.extend("_User");
	var query = new Parse.Query(User);
	query.equalTo("objectId", userId);
	query.first({
		success: function(user){
			console.log("success get USER:");
			console.log(user);
			var Professional = Parse.Object.extend("Professional");
			var query = new Parse.Query(Professional);
			query.equalTo("objectId", profId);
			query.first({
				success: function(newProf){
					console.log("succes get PROFESSIONAL:");
					console.log(newProf);
					user.set("idProfessional", null);
					user.save(null, {
						success: function(p){
							console.log("success Update User:");
							console.log(p);

							response.success('SUCCESS');
							
						},
						error: function(user, error){
							console.error("Errore  Users.getUser: ");
							console.error(error);
							response.error('ERROR');
						
						}, useMasterKey: true
					});
				},
				error: function(error){
					console.error("Errore  Users.addProfessional to getProfessional");
					console.error(error);
					response.error('ERROR');
				}
			});
		},
		error: function(error){
			console.error("Errore  Professional.newProfessional to getUser ");
			console.error(error);
			response.error('ERROR');
		}
	});	
});


// aggiunge il campo "willDeletedAt" all'offerta passata come parametro.
// questo campo viene utilizzato per impostare l'offerta come scaduta
// in quella specifica data.
Parse.Cloud.define('cancelOffer', function(req, res) {
	console.log("cancelOffer: before");
	var offerId = req.params.offerId;

	// recupera l'offerta da cancellare attraverso il suo id
 	var query = new Parse.Query("ListOffers");
	query.equalTo("objectId", offerId);

	// query.first().then(function(result) {
	// 	console.log("cancelOffer: get offer success");

	// 	// data corrente
	// 	var now = new Date();
	// 	// data corrente +5 minuti
	// 	var dateWithOffset = addMinutes(now, +5); 
	// 	console.log("cancelOffer: addMinutes");

	// 	// aggiunge un nuovo parametro all'offerta
	// 	result.set("willDeletedAt", dateWithOffset); 
	// 	console.log("cancelOffer: result.set");

	// 	// salva l'offerta
	// 	var savedObj = result.save();
	// 	console.log("cancelOffer: savedObj == " + JSON.stringify(savedObj));
	// 	return savedObj;

	// 	}).then(function(offer) {
	// 		console.log("cancelOffer: then save success");
	// 		console.log("cancelOffer: " + JSON.stringify(offer));

	// 		sendCancelOfferPush(offer);

	// 		console.log("cancelOffer: success");
	// 		res.success(offer.get("willDeletedAt"));
	// });


	query.first({
    success: function(result) {
    	console.log("cancelOffer: get offer success");

    	// data corrente
		var now = new Date();
		// data corrente +5 minuti
		var dateWithOffset = addMinutes(now, +5); 

    	// aggiunge un nuovo parametro all'offerta
    	result.set("willDeletedAt", dateWithOffset); 

    	// salva l'offerta
    	result.save(null, {
	  	success: function(offer) {
	  		console.log("cancelOffer: save success");

	  		// sendCancelOfferPush(offer);
	  		var parsedOffer = JSON.parse(JSON.stringify(offer.get("property")));
	  		console.log("cancelOffer: " +  JSON.stringify(parsedOffer));

			console.log("idListForms ==  " + offer.idListForms);
			console.log("idUserRequest ==  " + offer.idUserRequest);

			var offerId = offer.id;
			console.log("offerId ==  " + offerId);

			var idUserRequest = offer.get("idUserRequest").id
			console.log("idUserRequest ==  " + idUserRequest);

			var idListForms = offer.get("idListForms").id
			console.log("idListForms ==  " + idListForms);

			var alertTitle = parsedOffer.title;
			console.log("alertTitle ==  " + alertTitle);

			Parse.Cloud.run('sendCancelOfferPush', {
				"idListForms" : idListForms,
				"idUserRequest" : idUserRequest,
				"offerId" : offerId,
				"title" : alertTitle,
			}).then(function(resp) {
				console.log("cancelOffer: resp == " + JSON.stringify(resp));
				//return(resp);
			}, function(error) {
				console.log(error);
				return(error);
			});

	  		// restituisce la data di annullamento dell'offerta (comprensiva di offeset)
	    	res.success(offer.get("willDeletedAt"));
	  	},
	  	error: function(error) {
	  		console.log("cancelOffer: save error");
		    res.success(JSON.stringify(error));
	  	}
		});
    },
    error: function(error) {
    	console.log("cancelOffer: get offer error");
    	res.error(JSON.stringify(error));
    }
  });
});

// rimuove fisicamente dal database le offerte contrassegnate 
// come annullate. 
// le offerte scadute vengono intese come le offerte che hanno
// willDeletedAt < now (es. 11:11 < 12:08) 
// dove:
// * now è la data corrente;
// * willDeletedAt è la data di annullamento dell'offerta;
Parse.Cloud.define('removeCancelledOffers', function(req, res) {
	console.log("removeCancelledOffers");

	// data corrente
 	var now = new Date();

 	// recupera la lista di offerte da cancellare in base alla data di 
 	// annullamento dell'offerta.
 	// se la data di annullamento dell'offerta è minore della data attuale 
 	// allora verrà cancellata.
 	var query = new Parse.Query("ListOffers");
	query.lessThan("willDeletedAt", now);
	query.include("idListForms");
	query.find({
    success: function(results) {

    	// console.log("results == " + JSON.stringify(results));

    	var numberOfResults = results.length; 
    	// console.log("numberOfResults == " + numberOfResults);

    	for(var i = 0; i < numberOfResults; i++) {

    		var currentOffer = results[i];
    		// console.log("currentOffer== " + JSON.stringify(currentOffer));

    		var currentOfferId = currentOffer.id;
    		// console.log("currentOfferId == " + currentOfferId);

    		// recupera la richiesta corrente
    		var listForm = currentOffer.get("idListForms");
    		// console.log("listForm == " + JSON.stringify(listForm));
    		var listFormId = listForm.id;
    		// console.log("listFormId == " + listFormId);

    		// recupera il numero di offerte per quella richiesta
    		var numberAnswers = listForm.get("numberAnswers");
    		// console.log("numberAnswers == " + numberAnswers);
    		// console.log("numberAnswersType" + typeof(numberAnswers));

    		// decrementa il numero di risposte di una unità
    		listForm.increment("numberAnswers", -1);

    		// salva la richiesta
    		listForm.save({
				success: function(listForm) {
					console.log("savedListForm == " + JSON.stringify(listForm));

					// @TODO
					// if(currentOffer.idUserRequest.equals(listForm.userResponder)){  
    	// 				// "_p_idUserResponder": "_User$RjcfAKyiq4"
    	// 				listForm.set("_p_idUserResponder", null); // azzera user responder
    	// 				listForm.set("price", 0); // azzera user responder
    	// 			}


					// aggiorna lo stato se non ci sono offerte
					if(listForm.get("numberAnswers") == 0) {
						listForm.set("state" , "0");
					}

					listForm.save({
						success: function() {
							console.log("listForm saved with success");
						},
						error: function(error) {
							console.log("cannot save listForm. " + JSON.stringify(error));
						}
					});

					// console.log("listForm saved with success");
				},
				error: function(error) {
					console.log("cannot save listForm. " + JSON.stringify(error));
				}
			});
    	}


    	Parse.Object.destroyAll(results).then(function() {
            res.success("cancelled offers have been deleted successfully");
        });
		// res.success(JSON.stringify(results));
    },
    error: function(error) {
    	res.error(JSON.stringify(error));
    }
  });
});

// aggiunge un offest di X minuti a una data. 
// per sottrarre X minuti basta passare il parametro con il segno meno
// es.
// date = 09:42, minutes = +5  => verrà restituita la data +5 minuti, ovvero 09:47
// date = 09:42, minutes = -5 => verrà restituita la data -5 minuti, ovvero 09:37
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}


// function sendCancelOfferPush(offer) {
Parse.Cloud.define("sendCancelOfferPush", function(request, response) {
	console.log("sendCancelOfferPush");

	var alertTitle = request.params.title;
	console.log("alertTitle == " + alertTitle);

	var idTo = request.params.idUserRequest;
	// var idTo = "YVUPEjzZhz";
	console.log("idTo == " + idTo);

	var idListForms = request.params.idListForms;
	console.log("idListForms == " + idListForms);

	var offerId = request.params.offerId;
	console.log("offerId == " + offerId);

	// var alertMessage = "Il professionista " + userResponderId + " ha annullato l\'offerta per la struttura" + alertTitle + ".\nPrenota entro 5 minuti prima che l\'offerta venga annullata definitivamente!";
	// console.log("alertMessage == " + alertMessage);

	var alertMessage = "L\'offerta per la struttura" + alertTitle + " è stata annullata!.\nHai ancora 5 minuti per prenotare!!";
	console.log("alertMessage == " + alertMessage);

    var badge = parseInt("1");
	console.log("badge == " + badge);

    var type = "TYPE_CANCELED_OFFER";
    console.log("type == " + type);


	var pushQuery = new Parse.Query(Parse.Installation);
	var userQuery = new Parse.Query(Parse.User);
	userQuery.equalTo("objectId", idTo);
	
	pushQuery.matchesQuery("user", userQuery);
	
	// console.log("Test PreSendPush");
	Parse.Push.send(
	{
		where: pushQuery,
		data: {
			to: idTo,
			//t: "chat", // type
			idListForms: idListForms,
			badge: badge,
			alert: alertMessage,
			sound: "chime",
			title: alertTitle, // android only
			type: type,
			idUserRequest: idTo,
			idOffer : offerId
		}
	},
	
	{
		success: function(){
			console.log("notification to "+ idTo + " sent with success");
			userQuery.first({
				success: function(user){
					console.log("USER TO notofication: ");
					console.log(JSON.stringify(user));
				},
				error: function(error){
					console.log("Error userQuery for notification: ");
					console.log(error);
				}
			})
			
		},
		error: function (error) {
			response.error(error);
		},	useMasterKey: true
	});

	response.success('notification sent');
});

Parse.Cloud.define('testParseCloudRun', function(request, response) {
	Parse.Cloud.run('hello').then(function(resp) {
		response.success("resp == " + JSON.stringify(resp));
		//return(resp);
	}, function(error) {
		response.error("error == " + JSON.stringify(error));
	});
});


Parse.Cloud.define("mandaEmail", function(request, response) {

    // var Mailgun = require('mailgun');
    // Mailgun.initialize('DOMAIN_NAME', 'API_KEY');

	var Mailgun = require(__dirname + '/myMailModule-1.0.0.js');
	// console.log(JSON.stringify(Mailgun));

	Mailgun.initialize('postmaster@mg.rukku.it', 'key-7e6356374a29aa0f541ca9c13e7b83bd');

    Mailgun.sendEmail({
      // to: request.params.target,
      // from: request.params.originator,
      // subject: request.params.subject,
      // text: request.params.text


      to: "stefano.depascalis@frontiere21.it",
      from: "mailgun@mg.rukku.it",
      subject: "Hello",
      text: "Testing some Mailgun awesomness!"

    }, {
      success: function(httpResponse) {
        console.log(httpResponse);
        response.success("response == " + JSON.stringify(Mailgun) + "||||| Email sent!");
      },
      error: function(httpResponse) {
        console.error(httpResponse);
        response.error("response == " + JSON.stringify(Mailgun) + "||||| Uh oh, something went wrong");
      }
    });
});
