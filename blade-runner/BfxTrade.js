function BfxTrade(){
	this.initAmount = 100; // our balance for backtesting purposes (100 BTC)
	this.reserve = {};
}

BfxTrade.prototype.testTrade = function(pair, price, amount, type, action, callback){
	switch(type){

		case 'buy':

			if(action == 'long'){
				this.initAmount -= 1.002 * price * amount; // amount represents other cryptocurr
			} else {
				this.initAmount += 0.998 * (2 * this.reserve[pair] - price * amount);
			}

			return callback();

		case 'sell':

			if(action =='long'){
				this.initAmount += 0.998 * price * amount; // 0.998 repr fee for using bitfinex
			} else {
				this.reserve[pair] = price * amount; // reserve some amount of BTC
				this.initAmount -= 1.002 * this.reserve[pair];
			}

			return callback();

	}
}

module.exports = BfxTrade;