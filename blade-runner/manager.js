fs = require('fs');
const SMA = require('technicalindicators').SMA; // simple moving average
const parisArray = ['DSHBTC', 'ETHBTC', 'XMRBTC'];

var pairs = {};

const maPeriods = 20;

function Manager(){
	for(pair of parisArray){
		pairs[pair] ={
			ma: new SMA({period : maPeriods, values: []}),
			maValue: 0
		}
	}
}

/**
	Start bot
**/
Manager.prototype.runBot = function(){
	var marketData = {};
	for(pair of parisArray){
		marketData[pair] = JSON.parse(fs.readFileSync(__dirname+'/datasets/BFX_'+pair+'_1m.json', 'utf8')); // __dirname is the pwd.
		// console.log(pair, marketData[pair].length);
	}

	for(pair in marketData){
		for(candle of marketData[pair]){
			// console.log(pair, candle);
			calculateMA(pair, candle[2]) // candle[2] is the close price
		}
	}

}

function calculateMA(pair, close){
	pairs[pair]['maValue'] = pairs[pair]['ma'].nextValue(close);
	console.log(pair, pairs[pair]['maValue']);
}

module.exports = Manager;


/*

References:
- https://www.npmjs.com/package/technicalindicators

*/