const xmlParser = require('xml2json');

const FundamentalAccountingConcepts = require('./FundamentalAccountingConcepts.js').FundamentalAccountingConcepts;

'use strict';
exports.xmlbrParser = class xmlbrParser {
	
	constructor(xml = null) {
		this.isLoaded = false;
		this.fields = {};
		this.values = {};
		if (xml) {
			this.fromString(xml);
		}
		this.isLoaded = true;
	}

	static async parseStr(data) {
		let parser = new xmlbrParser(data);
		let parsed = JSON.parse(JSON.stringify(parser.fields));
		return parsed;
	}

	static async parse(filePath) {
		// Load xml and parse to json
		try {
			let data = await fs.readFileAsync(filePath, 'utf8');
			data = await xmlbrParser.parseStr(data);
			return data;
		}
		catch (err) {
			throw new Error('Problem with reading file', err);
		}
	}

	fromString(data) {
		let jsonObj = xmlParser.toJson(data);
		jsonObj = JSON.parse(jsonObj);
		this.documentJson = jsonObj[Object.keys(jsonObj)[0]];

		// Calculate and load basic facts from json doc
		this.loadField('EntityRegistrantName');
		this.loadField('CurrentFiscalYearEndDate');
		this.loadField('EntityCentralIndexKey');
		this.loadField('EntityFilerCategory');
		this.loadField('TradingSymbol');
		this.loadField('DocumentPeriodEndDate');
		this.loadField('DocumentFiscalYearFocus');
		this.loadField('DocumentFiscalPeriodFocus');
		this.loadField('DocumentFiscalYearFocus', 'DocumentFiscalYearFocusContext', 'contextRef');
		this.loadField('DocumentFiscalPeriodFocus', 'DocumentFiscalPeriodFocusContext', 'contextRef');
		this.loadField('DocumentType');

		let currentYearEnd = this.loadYear();
		if (!currentYearEnd) {
			//throw new Error('No year end found.');
			console.error('No year end found.');
			return false;
		}
		else {
			let durations = this.getContextForDurations(currentYearEnd);
			let instants = this.getContextForInstants(currentYearEnd);

			this.fields.ContextForInstants = instants.default;
			this.fields.ContextForDurations = durations.contextForDurations;
			this.fields.IncomeStatementPeriodYTD = durations.incomeStatementPeriodYTD;
			this.fields.BalanceSheetDate = currentYearEnd;

			this.values.IncomeStatementPeriodYTD = durations.incomeStatementPeriodYTD;
			this.values.BalanceSheetDate = currentYearEnd;
			this.values.durations = durations.durations;
			this.values.instants = instants.instants;

			// Load the rest of the facts
			FundamentalAccountingConcepts.load(this);
		}
		return this.values;
	}

	// Utility functions
	loadField(conceptToFind, fieldName, key) {
		key = key || '$t';
		fieldName = fieldName || conceptToFind;

		let concept = this.documentJson['dei:' + conceptToFind];
		// console.debug(fieldName + "=> " + JSON.stringify(concept, null, 3));
		if (Array.isArray(concept)) {
			// warn about multliple concepts...
			console.warn('Found ' + concept.length + ' context references')
			concept.forEach( (conceptInstance, idx)=>{
				console.warn('=> ' + conceptInstance.contextRef + (idx === 0 ? ' (selected)' : ''));
			});
			// ... then default to the first available contextRef
			concept = concept.shift();
		}
		if (concept) {
			concept = concept[key];
		}
		else {
			concept = null;
		}
		this.fields[fieldName] = concept;
		this.values[fieldName] = concept;

		console.debug(`loaded ${fieldName}: ${this.fields[fieldName]}`);
	}


	getFactValue(concept, context) {
		// If the user selected one of the default/placeholder 
		// values, look up the value we set aside.
		let placeholders = {
			"Instant": this.fields.ContextForInstants,
			"Duration": this.fields.ContextForDurations
		};
		if(context in placeholders){
			context = placeholders[context];
		}
		// Check the value to see it was a duration that has been
		// included in our document.
		if(!(context in this.values.durations) && !(context in this.values.instants)){
			console.error('Context Error: ' + contextReference);
			return null;
		}

		let factNode = null;
		let nodes = this.documentJson[concept] || [];
		if(!Array.isArray(nodes)){
			nodes = [nodes];
		}
		nodes.forEach(node => {
			if (node.contextRef === context) {
				factNode = node;
			}
		});

		let factValue = null;
		if (factNode) {
			factValue = factNode['$t'];
			for (var key in factNode) {
				if (key.indexOf('nil') >= 0) {
					factValue = 0;
				}
			}
			factValue = Number(factValue);
		}
		return factValue;
	}


	getNodeList(nodeNamesArr, root) {
		root = root || this.documentJson;

		let allNodes = nodeNamesArr
			.map((key) => {
				key = root[key];
				return key;
			})
			.reduce((a, d) => {
				if (d) {
					a = a.concat(d);
				}
				return a;
			}, [])
			;
		return allNodes;
	}


	loadYear() {
		var currentEnd = this.fields.DocumentPeriodEndDate;
		if (/(\d{4})-(\d{1,2})-(\d{1,2})/.test(currentEnd)) {
			return currentEnd;
		}
		else {
			console.warn(currentEnd + ' is not a date');
			return false;
		}
	}


	getContextForInstants(endDate) {
		var contextForInstants = null;
		var contextId;
		var contextPeriods;
		let instants = {};

		// Uses the concept ASSETS to find the correct instance context
		var instanceNodesArr = this.getNodeList([
			'us-gaap:Assets',
			'us-gaap:AssetsCurrent',
			'us-gaap:LiabilitiesAndStockholdersEquity'
		]);

		for (var i = 0; i < instanceNodesArr.length; i++) {

			contextId = instanceNodesArr[i].contextRef;
			contextPeriods = this.documentJson['xbrli:context'] || this.documentJson['context'];

			contextPeriods.forEach((period) => {
				period = JSON.stringify(period);
				period = period.replace(/xbrli:/g, '');
				period = JSON.parse(period);
				if (period.id === contextId) {
					let contextPeriod = period.period.instant;
					instants[period.id] = period.period;

					if (contextPeriod && contextPeriod === endDate) {
						let instanceHasExplicitMember = null;
						try {
							instanceHasExplicitMember = period.entity.segment.explicitMember;
						} catch(e){ }
						if (instanceHasExplicitMember) {
							// console.debug('Instance has explicit member.');
						} else {
							contextForInstants = contextId;
							// console.debug('Use Context:', contextForInstants);
						}
					}
				}
			});
		}

		if (contextForInstants === null) {
			contextForInstants = this.lookForAlternativeInstanceContext();
		}

		return {
			default: contextForInstants,
			instants: instants
		};
	}


	getContextForDurations(endDate) {
		let contextForDurations = null;
		let startDateYTD = '2099-01-01';
		let startDate;
		let durations = {};

		let durationNodesArr = this.getNodeList([
			'us-gaap:CashAndCashEquivalentsPeriodIncreaseDecrease',
			'us-gaap:CashPeriodIncreaseDecrease',
			'us-gaap:NetIncomeLoss',
			'dei:DocumentPeriodEndDate'
		]);

		for (let contextId in durationNodesArr) {
			contextId = durationNodesArr[contextId].contextRef;
			let context = this.documentJson['xbrli:context'] || this.documentJson['context'];
			for (let period in context) {
				period = context[period];
				if (period.id !== contextId) {
					continue;
				}
				period = JSON.stringify(period);
				period = period.replace(/xbrli:/g, '');
				period = JSON.parse(period);
				durations[period.id] = period.period;

				if (period.period.endDate === endDate) {
					let durationHasExplicitMember = null;
					try {
						durationHasExplicitMember = period.entity.segment.explicitMember;
					}
					catch (e) {
						durationHasExplicitMember = null;
					}
					if (durationHasExplicitMember) {
						console.debug('Duration has explicit member.');
					}
					else {
						startDate = period.period.startDate;

						// console.debug('Context start date:', startDate);
						// console.debug('YTD start date:', startDateYTD);

						if (startDate <= startDateYTD) {
							// console.debug('Context start date is less than current year to date, replace');
							// console.debug('Context start date: ', startDate);
							// console.debug('Current min: ', startDateYTD);

							startDateYTD = startDate;
							contextForDurations = period.id;
						}
						else {
							// console.debug('Context start date is greater than YTD, keep current YTD');
							// console.debug('Context start date: ', startDate);
						}

						// console.debug('Use context ID: ', contextForDurations);
						// console.debug('Current min: ', startDateYTD);
						// console.debug('');
						// console.debug('Use context: ', contextForDurations);
					}
				}
			}
		}

		return {
			contextForDurations: contextForDurations,
			incomeStatementPeriodYTD: startDateYTD,
			durations: durations
		}
	}


	lookForAlternativeInstanceContext() {
		let altContextId = null;
		let altNodesArr = JSON.stringify(this.documentJson);
		altNodesArr = altNodesArr.replace(/xbrli:/g, '');
		altNodesArr = JSON.parse(altNodesArr);
		altNodesArr = altNodesArr.context.period.instant
			.filter((node) => {
				let ismatch = (node === this.fields['BalanceSheetDate']);
				return ismatch;
			})
			.forEach(alt => {
				this.documentJson['us-gaap:Assets'].forEach((node) => {
					if (node.contextRef === alt.id) {
						altContextId = alt.id;
					}
				});
			})
			;
		return altContextId;
	}

}

