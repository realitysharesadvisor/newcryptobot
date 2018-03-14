fs = require('fs');
const SMA = require('technicalindicators').SMA; // simple moving average
const pairsArray = ['DSHBTC', 'ETHBTC', 'XMRBTC'];

var pairs = {};

const maPeriods = 20;

function Manager(){
	for(pair of pairsArray){
		pairs[pair] ={
			ma: new SMA({period : maPeriods, values: []}),
			maValue: 0,
			prevMaValue: 0,
			prevClose: 0,
			long: false,
			short: false,
			stopLossPrice: 0
		}
	}
}

/**
	Start bot
**/
Manager.prototype.runBot = function(){
	var marketData = {};
	for(pair of pairsArray){
		marketData[pair] = JSON.parse(fs.readFileSync(__dirname+'/datasets/BFX_'+pair+'_1m.json', 'utf8')); // __dirname is the pwd.
		// console.log(pair, marketData[pair].length);
	}

	// // calculate moving average for DSH, ETC, XMR individually
	// for(pair in marketData){
	// 	for(candle of marketData[pair]){
	// 		// console.log(pair, candle);
	// 		calculateMA(pair, candle[2]) // candle[2] is the close price
	// 	}
	// }

	// calculate MA for each pair simultaneously
	for(i = 0; i < marketData[pairsArray[0]].length; i++){
		for(pair in marketData){
			calculateMA(pair, marketData[pair][i][2])
		}
	}

}

function calculateMA(pair, close){
	pairs[pair]['maValue'] = pairs[pair]['ma'].nextValue(close);
	// console.log(pair, pairs[pair]['maValue']);
	findTradeOpportunity(pair, close);
	pairs[pair]['prevMaValue'] = pairs[pair]['maValue'];
	pairs[pair]['prevClose'] = close;
}

function findTradeOpportunity(pair, close){
	var longVal = pairs[pair]['long'];
	var shortVal = pairs[pair]['short'];
	var maVal = pairs[pair]['maValue'];
	if(!longVal && !shortVal){
		if(pairs[pair]['prevClose'] < pairs[pair]['prevMaValue'] && close > maVal){
			openLongPosition(pair, close);
		} else if(pairs[pair]['prevClose'] > pairs[pair]['prevMaValue'] && close < maVal){
			openShortPosition(pair, close);
		}
	} else if(longVal){
		if(close < maVal){
			closeLongPosition(pair, close);
		} else if(close < pairs[pair]['stopLossPrice']){
			closeLongPosition(pair, close);
		}
	} else if(shortVal){
		if(close > maVal){
			closeLongPosition(pair, close);
		} else if(close > pairs[pair]['stopLossPrice']){
			closeShortPosition(pair, close);
		}
	}
}

function openLongPosition(pair, close){
	pairs[pair]['stopLossPrice'] = close * 0.98;
	pairs[pair]['long'] = true; // flag to open long position
	console.log(pair, ' Opened long position at ', close);
	console.log(pair, ' Stop loss price ', pairs[pair]['stopLossPrice']);
	console.log('--------------------------------------------------------')
}

function openShortPosition(pair, close){
	pairs[pair]['stopLossPrice'] = close * 1.02;
	pairs[pair]['short'] = true; // flag to open short position
	console.log(pair, ' Opened short position at ', close)
	console.log(pair, ' Stop loss price ', pairs[pair]['stopLossPrice']);
	console.log('--------------------------------------------------------')

}

function closeLongPosition(pair, close){
	pairs[pair]['stopLossPrice'] = 0;
	pairs[pair]['long'] = false; // flag to close long position
	console.log(pair, ' Closed long position at ', close)
	console.log('--------------------------------------------------------')

}

function closeShortPosition(pair, close){
	pairs[pair]['stopLossPrice'] = 0;
	pairs[pair]['short'] = false; // flag to close short position
	console.log(pair, ' Closed short position at ', close)
	console.log('--------------------------------------------------------')

}

module.exports = Manager;


/*

References:
- https://www.npmjs.com/package/technicalindicators

*/