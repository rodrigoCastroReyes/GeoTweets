var express = require('express');
var Oauth = require('oauth');
var Promise = require('promise');
var jsonfile = require('jsonfile');
jsonfile.spaces = 4;
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
			oauth.get(url,
				access_token,
				access_token_secret,function(error,data,res){
					if(error){
						reject(error)
					}
					console.log(url)
					resolve(data,res);
				});
		});
	return request;
}

function formUrl(params){
	var urlBase =  'https://api.twitter.com/1.1/search/tweets.json?q=&geocode=7.149330,-65.699332,850km&until=2015-11-30';
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
	var file = './dataset/venezuela.json';
	try{
		var content = jsonfile.readFileSync(file);//old tweets in data.json
		var newTweets = [];
		newTweets = newTweets.concat(content.tweets).concat(response.tweets);
		console.log(newTweets[newTweets.length-1].created_at);
		console.log(newTweets.length);
		jsonfile.writeFileSync(file,{ tweets : newTweets });
	}catch(error){
		jsonfile.writeFileSync(file,{ tweets : response.tweets });
	}
	//return getTweets(response.params);//get more tweets
}

function compareStrings(tweetA,tweetB){
	var a = tweetA.id_str;
	var b = tweetB.id_str;
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
			tweet = array[i];
			tweets.push(tweet);
		}
	}
	return tweets;
}

function downloadData(params,req,res){
	/*var params = {'count' : 100}*/// parameters to url
	getTweets(params).then(function(response){
		console.log("done");
		writeTweets(response);
		params = response.params;
		res.json(params);
	}, function(error){
		console.log(error);
	});
}

app.use(express.static('./public'));

app.get('/', function (req, res) {
	res.sendfile('index.html');
});

app.get('/getTweets', function (req, res) {
	var params = req.query;
	downloadData(params,req,res);
});

var server = app.listen(4000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});

