fs = require('fs');
const SMA = require('technicalindicators').SMA; // simple moving average
const pairsArray = ['DSHBTC', 'ETHBTC', 'XMRBTC'];
const BFXTrade = require('./BfxTrade');

var bfx = new BFXTrade();

var pairs = {};

const maPeriods = 20;

var openedPositions = 0;
var success = 0;
var loss = 0;

function Manager(){
	for(pair of pairsArray){
		pairs[pair] ={
			ma: new SMA({period : maPeriods, values: []}),
			maValue: 0,
			prevMaValue: 0,
			prevClose: 0,
			long: false,
			short: false,
			stopLossPrice: 0,
			entryAmount: 0,
			entryPrice: 0
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
		if(close < maVal && close > pairs[pair]['entryPrice'] * 1.004){
			closeLongPosition(pair, close);
			success++;
		} else if(close < pairs[pair]['stopLossPrice']){
			closeLongPosition(pair, pairs[pair]['stopLossPrice']); // close at stopLossPrice
			loss++;
		}
	} else if(shortVal){
		if(close > maVal && close < pairs[pair]['entryPrice'] * 0.996){
			success++;
			closeLongPosition(pair, close);
		} else if(close > pairs[pair]['stopLossPrice']){
			loss++;
			closeShortPosition(pair, pairs[pair]['stopLossPrice']); // close at stopLossPrice
		}
	}
}

function openLongPosition(pair, close){
	pairs[pair]['stopLossPrice'] = close * 0.98;
	pairs[pair]['entryAmount'] = getPositionSize(close);
	bfx.testTrade(pair, close, pairs[pair]['entryAmount'], 'buy', 'long', function(){
		pairs[pair]['long'] = true; // flag to open long position
		pairs[pair]['entryPrice'] =  close;
		openedPositions++;
		console.log(pair, ' Opened long position at ', close, ' amount ', pairs[pair]['entryAmount']);
		console.log(pair, ' Stop loss price ', pairs[pair]['stopLossPrice']);
		console.log(pair, ' Opened positions ', openedPositions);
		console.log('--------------------------------------------------------');
	});
}

function openShortPosition(pair, close){
	pairs[pair]['stopLossPrice'] = close * 1.02;
	pairs[pair]['entryAmount'] = getPositionSize(close);
	bfx.testTrade(pair, close, pairs[pair]['entryAmount'], 'sell', 'short', function(){
		pairs[pair]['short'] = true; // flag to open short position
		pairs[pair]['entryPrice'] =  close;
		openedPositions++;
		console.log(pair, ' Opened short position at ', close, ' amount ', pairs[pair]['entryAmount']);
		console.log(pair, ' Stop loss price ', pairs[pair]['stopLossPrice']);
		console.log(pair, ' Opened positions ', openedPositions);
		console.log('--------------------------------------------------------');
	});

}

function closeLongPosition(pair, close){
	bfx.testTrade(pair, close, pairs[pair]['entryAmount'], 'sell', 'long', function(){
		console.log(pair, ' Closed long position at ', close, ' amount ', pairs[pair]['entryAmount']);
		console.log(pair, ' Result amount ', bfx.initAmount);
		console.log(pair, ' Successful trades: ', success, ' Loss trades: ', loss);
		console.log('--------------------------------------------------------');
		pairs[pair]['stopLossPrice'] = 0;
		pairs[pair]['entryAmount'] = 0; // reset entryAmount
		pairs[pair]['entryPrice'] =  0; // reset entryPrice
		pairs[pair]['long'] = false; // flag to close long position
		openedPositions--;
	});
}

function closeShortPosition(pair, close){
	bfx.testTrade(pair, close, pairs[pair]['entryAmount'], 'buy', 'short', function(){
		console.log(pair, ' Closed short position at ', close, ' amount ', pairs[pair]['entryAmount']);
		console.log(pair, ' Result amount ', bfx.initAmount);
		console.log(pair, ' Successful trades: ', success, ' Loss trades: ', loss);
		console.log('--------------------------------------------------------');
		pairs[pair]['stopLossPrice'] = 0;
		pairs[pair]['entryAmount'] = 0; // reset entryAmount
		pairs[pair]['entryPrice'] =  0; // reset entryPrice
		pairs[pair]['short'] = false; // flag to close short position
		openedPositions--;
	});
}

function getPositionSize(close){
	// 1/3rd of our initial amount is dedicated to each pair
	return bfx.initAmount / (pairsArray.length - openedPositions) / close;
}


module.exports = Manager;


/*

References:
- https://www.npmjs.com/package/technicalindicators

*/