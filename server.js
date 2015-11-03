var express = require('express');
var Oauth = require('oauth');
var Promise = require('promise');
var jsonfile = require('jsonfile');
var app = express();

var consumer_key = 'MtHsM6e0jpbeRNTNOwKOjcBUF';
var consumer_secret = 'kvhhRaI0b1DpjMm6HPxJCFpdL0ihwCCfLMKas4UQA6qvm13K5K';
var access_token = '115246381-w1E4EqjndQ0LAnCotvldnRGiXWZdk0GbN5QftQQB';
var access_token_secret = 'dc1vaGAVAxnwL8UcZJR9A05Y232DGZXw16SioE7l3yDYK';

var index = 1;

var oauth = new Oauth.OAuth(
	'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
	consumer_key,
	consumer_secret,
	'1.0A',
	null,
	'HMAC-SHA1'
);

var server = app.listen(5000,function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port)
});


function doSearch(params){
	var request = new Promise(
		function (resolve,reject){
			console.log("do search");
			var url = formUrl(params);	
			console.log(url);
			oauth.get(url,
				access_token,
				access_token_secret,function(error,data,res){
					if(error){
						reject(error)
					}
					resolve(data,res);
				});
		});
	return request;
}

function formUrl(params){
	var urlBase =  'https://api.twitter.com/1.1/search/tweets.json?q=&geocode=-23.575846,-46.628986,50km'
	for(var i in params){
		var field = i;
		var value = params[i];
		urlBase = urlBase + '&' + field + "=" + value;
	}
	return urlBase;
}


function getTweets(params){
	return new Promise(function(resolve,reject){
		doSearch(params).then(function(data,res){
			var tweets = processData(data);
			resolve(tweets);
		},function(error){
			reject(error);
		});
	});
}


function getDataSet(par){
	var request = new Promise(
		function(resolve,reject){
			getTweets(par).then(function(tweets){
				var sortedTweets = tweets.sort(compareStrings);
				var max_id = sortedTweets[sortedTweets.length-1].id;//the lowest ID received.
				var since_id = sortedTweets[0].id;// greatest ID of all the Tweets your application has already processed
				var params = {
					'max_id': max_id,
					'count': 100
				};
				var response = {};
				response.tweets = sortedTweets;
				response.params = params;
				resolve(response);
			},function(error){
				console.log(error);
				reject(error);
			})
		}
	);
	return request;
}

function resolveTweets(response){
	console.log(response.tweets.length);
	var file = './dataset/data'+ index +'.json';
	index = index + 1;
	jsonfile.writeFileSync(file,response.tweets);
	return getDataSet(response.params);
}

function init(){
	var params = {
		'count' : 100
	}
	getDataSet(params)
	.then(resolveTweets)
	.then(resolveTweets)
	.then(resolveTweets)
	.then(resolveTweets)
	.then(resolveTweets)
	.then(resolveTweets)
	.then(resolveTweets)
	.then(resolveTweets)
	.then(resolveTweets)
	.then(resolveTweets)
	.then(function(){
		console.log("Data set ready");
		return;
	},
	function(error){
		console.log(error);
	});
}

function compareStrings(tweetA,tweetB){
	var a = tweetA.id;
	var b = tweetB.id;
	a = a.toLowerCase();
    b = b.toLowerCase();
    if (a < b) return 1;
    if (a > b) return -1;
    return 0;
}

function processData(data){
	var parsedData = JSON.parse(data);
	var array = parsedData.statuses;
	var tweets = new Array();
	for(var i in array){
		var tweet = {};
		tweet.id = array[i].id_str;
		tweet.date = array[i].created_at;
		tweet.text = array[i].text;
		var geoData = array[i].geo;
		if(geoData && geoData.coordinates){
			tweet.lat = geoData.coordinates[1];
			tweet.lng = geoData.coordinates[0];
			tweets.push(tweet);
		}
	}
	return tweets;
}

init();