var express = require('express');
var Oauth = require('oauth');
var Promise = require('promise');
var jsonfile = require('jsonfile');
var fs = require('fs');
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

function doSearch(params){
	var request = new Promise(
		function (resolve,reject){
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
			reject(error);
		});
	});
}

function writeTweets(response){
	//console.log(response.tweets.length); //number of new tweets
	var file = './dataset/data.json';
	try{
		var content = jsonfile.readFileSync(file);//old tweets in data.json
		var newTweets = [];
		newTweets = newTweets.concat(content.tweets).concat(response.tweets);	
		jsonfile.writeFileSync(file,{ tweets : newTweets });
		console.log("nuevo tamaño");
		console.log(newTweets.length);
	}catch(error){
		jsonfile.writeFileSync(file,{ tweets : response.tweets });
	}
	
	return getTweets(response.params);//get more tweets
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
		var geoData = array[i].geo;
		if(geoData && geoData.coordinates){

			tweet.lng = geoData.coordinates[0];
			tweet.lat = geoData.coordinates[1];
			tweet.id = array[i].id_str;
			tweet.date = array[i].created_at;
			tweet.text = array[i].text;

			var user = {};
			user.id = array[i].user.id_str;
			user.followers_count = array[i].user.followers_count;
			user.friends_count = array[i].user.friends_count
			tweet.user = user;

			if(array[i].retweet_count>0){
				tweet.retweet_count = array[i].retweet_count;	
			}else{
				tweet.retweet_count = 0;
			}
			
			if(array[i].favorite_count>0){
				tweet.favorite_count = array[i].favorite_count;
			}else{
				tweet.favorite_count = 0;
			}

			if(array[i].entities.hashtags){
				tweet.tags = array[i].entities.hashtags.text;
			}else{
				tweet.tags = ""
			}

			tweets.push(tweet);
		}
	}
	return tweets;
}

function downloadData(){
	var params = {
		'count' : 100
	}// parameters to url
	getTweets(params)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(writeTweets)
	.then(function(response){
		writeTweets(response);
		console.log("Data set ready");
		return;
	},
	function(error){
		console.log(error);
	});
}

	downloadData();