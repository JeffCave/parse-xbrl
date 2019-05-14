
exports.FundamentalAccountingConcepts = class FundamentalAccountingConcepts{
	static load(xbrl, debug = false) {
		let origDebugger = console.debug;
		if(!debug){
			console.debug = ()=>{};
		}

		console.debug('');
		console.debug('FUNDAMENTAL ACCOUNTING CONCEPTS:');
		console.debug(xbrl.values.EntityRegistrantName + '\tEntity registrant name: ');
		console.debug(xbrl.values.EntityCentralIndexKey + '\tCIK');
		console.debug('Entity filer category: ' + xbrl.values['EntityFilerCategory']);
		console.debug('Trading symbol: ' + xbrl.values['TradingSymbol']);
		console.debug('Fiscal year: ' + xbrl.values['DocumentFiscalYearFocus']);
		console.debug('Fiscal period: ' + xbrl.values['DocumentFiscalPeriodFocus']);
		console.debug('Document type: ' + xbrl.values['DocumentType']);
		console.debug('Balance Sheet Date (document period end date): ' + xbrl.values['DocumentPeriodEndDate']);
		console.debug('Income Statement Period (YTD, current period, period start date): ' + xbrl.values['IncomeStatementPeriodYTD'] + ' to ' + xbrl.values['BalanceSheetDate']);
		console.debug('Context ID for document period focus (instants): ' + xbrl.values['ContextForInstants']);
		console.debug('Context ID for YTD period (durations): ' + xbrl.values['ContextForDurations']);

		FundamentalAccountingConcepts._loadInstanceValues(xbrl);
		FundamentalAccountingConcepts._loadDurations(xbrl);

		// Key ratios
		xbrl.values.ROA = xbrl.values.NetIncomeLoss / xbrl.values.Assets;
		xbrl.values.ROE = xbrl.values.NetIncomeLoss / xbrl.values.Equity;
		xbrl.values.ROS = xbrl.values.NetIncomeLoss / xbrl.values.Revenues;
		let sgr = 
			xbrl.values.ROS * 
			(1 + (xbrl.values.Assets - xbrl.values.Equity) / xbrl.values.Equity)
			;
		xbrl.values.SGR = sgr / ((1 / (xbrl.values.Revenues / xbrl.values.Assets)) - sgr) || null;

		// create our flattened table persepective
		for(let fld in xbrl.values){
			xbrl.fields[fld] = xbrl.values[fld];
		}
		delete xbrl.fields.durations;
		delete xbrl.fields.instants;

		xbrl.values = JSON.parse(JSON.stringify(xbrl.values));
		xbrl.fields = JSON.parse(JSON.stringify(xbrl.fields));
		console.debug = origDebugger;
	}


	/**
	 * Load the Point in time values
	 * 
	 * Assets are point-in-time values. 
	 */
	static _loadInstanceValues(xbrl){
		// Assets
		xbrl.fields['Assets'] = 
			xbrl.getFactValue('us-gaap:Assets', 'Instant') || 
			0;

		// Current Assets
		xbrl.fields['CurrentAssets'] = 
			xbrl.getFactValue('us-gaap:AssetsCurrent', 'Instant') || 
			0;

		// Noncurrent Assets
		xbrl.fields.NoncurrentAssets = xbrl.getFactValue('us-gaap:AssetsNoncurrent', 'Instant');
		if (xbrl.fields.NoncurrentAssets === null) {
			if (xbrl.fields.Assets && xbrl.fields.CurrentAssets) {
				xbrl.fields.NoncurrentAssets = xbrl.fields.Assets - xbrl.fields.CurrentAssets;
			} 
			else {
				xbrl.fields.NoncurrentAssets = 0;
			}
		}

		// LiabilitiesAndEquity
		xbrl.fields['LiabilitiesAndEquity'] = xbrl.getFactValue('us-gaap:LiabilitiesAndStockholdersEquity', 'Instant');
		if (xbrl.fields['LiabilitiesAndEquity'] === null) {
			xbrl.fields['LiabilitiesAndEquity'] = xbrl.getFactValue('us-gaap:LiabilitiesAndPartnersCapital', 'Instant');
			if (xbrl.fields['LiabilitiesAndEquity']) {
				xbrl.fields['LiabilitiesAndEquity'] = 0;
			}
		}

		// Liabilities
		xbrl.fields['Liabilities'] = 
			xbrl.getFactValue('us-gaap:Liabilities', 'Instant') || 
			0;

		// CurrentLiabilities
		xbrl.fields['CurrentLiabilities'] = 
			xbrl.getFactValue('us-gaap:LiabilitiesCurrent', 'Instant') || 
			0;

		// Noncurrent Liabilities
		xbrl.fields['NoncurrentLiabilities'] = xbrl.getFactValue('us-gaap:LiabilitiesNoncurrent', 'Instant');
		if (xbrl.fields['NoncurrentLiabilities'] === null) {
			if (xbrl.fields['Liabilities'] && xbrl.fields['CurrentLiabilities']) {
				xbrl.fields['NoncurrentLiabilities'] = xbrl.fields['Liabilities'] - xbrl.fields['CurrentLiabilities']
			} else {
				xbrl.fields['NoncurrentLiabilities'] = 0;
			}
		}

		// CommitmentsAndContingencies
		xbrl.fields['CommitmentsAndContingencies'] = 
			xbrl.getFactValue('us-gaap:CommitmentsAndContingencies', 'Instant') || 
			0;

		// TemporaryEquity
		xbrl.fields['TemporaryEquity'] = 
			xbrl.getFactValue('us-gaap:TemporaryEquityRedemptionValue', 'Instant') ||
			xbrl.getFactValue('us-gaap:RedeemablePreferredStockCarryingAmount', 'Instant') ||
			xbrl.getFactValue('us-gaap:TemporaryEquityCarryingAmount', 'Instant') ||
			xbrl.getFactValue('us-gaap:TemporaryEquityValueExcludingAdditionalPaidInCapital', 'Instant') ||
			xbrl.getFactValue('us-gaap:TemporaryEquityCarryingAmountAttributableToParent', 'Instant') ||
			xbrl.getFactValue('us-gaap:RedeemableNoncontrollingInterestEquityFairValue', 'Instant') || 
			0;
		// RedeemableNoncontrollingInterest (added to temporary equity)
		var redeemableNoncontrollingInterest = 
			xbrl.getFactValue('us-gaap:RedeemableNoncontrollingInterestEquityCarryingAmount', 'Instant') ||
			xbrl.getFactValue('us-gaap:RedeemableNoncontrollingInterestEquityCommonCarryingAmount', 'Instant') || 
			0;
		// This adds redeemable noncontrolling interest and temporary equity which are rare, but can be reported seperately
		if (xbrl.fields['TemporaryEquity']) {
			xbrl.fields['TemporaryEquity'] = Number(xbrl.fields['TemporaryEquity']) + Number(redeemableNoncontrollingInterest);
		}


		// Equity
		xbrl.fields['Equity'] = 
			xbrl.getFactValue('us-gaap:StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', 'Instant') ||
			xbrl.getFactValue('us-gaap:StockholdersEquity', 'Instant') ||
			xbrl.getFactValue('us-gaap:PartnersCapitalIncludingPortionAttributableToNoncontrollingInterest', 'Instant') ||
			xbrl.getFactValue('us-gaap:PartnersCapital', 'Instant') ||
			xbrl.getFactValue('us-gaap:CommonStockholdersEquity', 'Instant') ||
			xbrl.getFactValue('us-gaap:MemberEquity', 'Instant') ||
			xbrl.getFactValue('us-gaap:AssetsNet', 'Instant') || 
			0;


		// EquityAttributableToNoncontrollingInterest
		xbrl.fields['EquityAttributableToNoncontrollingInterest'] = 
			xbrl.getFactValue('us-gaap:MinorityInterest', 'Instant') ||
			xbrl.getFactValue('us-gaap:PartnersCapitalAttributableToNoncontrollingInterest', 'Instant') || 
			0;

		// EquityAttributableToParent
		xbrl.fields['EquityAttributableToParent'] = 
			xbrl.getFactValue('us-gaap:StockholdersEquity', 'Instant') ||
			xbrl.getFactValue('us-gaap:LiabilitiesAndPartnersCapital', 'Instant') || 
			0;

		// BS Adjustments
		// If total assets is missing, try using current assets
		let logic = 
			xbrl.fields['Assets'] === 0 &&
			xbrl.fields['Assets'] === xbrl.fields['LiabilitiesAndEquity'] &&
			xbrl.fields['CurrentAssets'] === xbrl.fields['LiabilitiesAndEquity']
			;
		if(logic){
			xbrl.fields['Assets'] = xbrl.fields['CurrentAssets'];
		}

		// Added to fix Assets
		logic = 
			xbrl.fields['Assets'] === 0 &&
			xbrl.fields['LiabilitiesAndEquity'] !== 0 &&
			xbrl.fields['CurrentAssets'] === xbrl.fields['LiabilitiesAndEquity']
			;
		if(logic) {
			xbrl.fields['Assets'] = xbrl.fields['CurrentAssets'];
		}

		// Added to fix Assets even more
		logic = 
			xbrl.fields['Assets'] === 0 &&
			xbrl.fields['NoncurrentAssets'] === 0 &&
			xbrl.fields['LiabilitiesAndEquity'] !== 0 &&
			(xbrl.fields['LiabilitiesAndEquity'] === xbrl.fields['Liabilities'] + xbrl.fields['Equity'])
			;
		if(logic) {
			xbrl.fields['Assets'] = xbrl.fields['CurrentAssets'];
		}

		if (xbrl.fields['Assets'] !== 0 && xbrl.fields['CurrentAssets'] !== 0) {
			xbrl.fields['NoncurrentAssets'] = xbrl.fields['Assets'] - xbrl.fields['CurrentAssets'];
		}

		if (xbrl.fields['LiabilitiesAndEquity'] === 0 && xbrl.fields['Assets'] !== 0) {
			xbrl.fields['LiabilitiesAndEquity'] = xbrl.fields['Assets'];
		}

		// Impute: Equity based no parent and noncontrolling interest being present
		if (xbrl.fields['EquityAttributableToNoncontrollingInterest'] !== 0 && xbrl.fields['EquityAttributableToParent'] !== 0) {
			xbrl.fields['Equity'] = xbrl.fields['EquityAttributableToParent'] + xbrl.fields['EquityAttributableToNoncontrollingInterest'];
		}

		if (xbrl.fields['Equity'] === 0 && xbrl.fields['EquityAttributableToNoncontrollingInterest'] === 0 && xbrl.fields['EquityAttributableToParent'] !== 0) {
			xbrl.fields['Equity'] = xbrl.fields['EquityAttributableToParent'];
		}

		if (xbrl.fields['Equity'] === 0) {
			xbrl.fields['Equity'] = xbrl.fields['EquityAttributableToParent'] + xbrl.fields['EquityAttributableToNoncontrollingInterest'];
		}

		// Added: Impute Equity attributable to parent based on existence of equity and noncontrolling interest.
		if (xbrl.fields['Equity'] !== 0 &&
			xbrl.fields['EquityAttributableToNoncontrollingInterest'] !== 0 &&
			xbrl.fields['EquityAttributableToParent'] === 0) {
			xbrl.fields['EquityAttributableToParent'] = xbrl.fields['Equity'] - xbrl.fields['EquityAttributableToNoncontrollingInterest'];
		}

		// Added: Impute Equity attributable to parent based on existence of equity and noncontrolling interest.
		if (xbrl.fields['Equity'] !== 0 &&
			xbrl.fields['EquityAttributableToNoncontrollingInterest'] === 0 &&
			xbrl.fields['EquityAttributableToParent'] === 0) {
			xbrl.fields['EquityAttributableToParent'] = xbrl.fields['Equity'];
		}

		// if total liabilities is missing, figure it out based on liabilities and equity
		if (xbrl.fields['Liabilities'] === 0 && xbrl.fields['Equity'] !== 0) {
			xbrl.fields['Liabilities'] = xbrl.fields['LiabilitiesAndEquity'] - (xbrl.fields['CommitmentsAndContingencies'] + xbrl.fields['TemporaryEquity'] + xbrl.fields['Equity']);
		}

		// This seems incorrect because liabilities might not be reported
		if (xbrl.fields['Liabilities'] !== 0 &&
			xbrl.fields['CurrentLiabilities'] !== 0) {
			xbrl.fields['NoncurrentLiabilities'] = xbrl.fields['Liabilities'] - xbrl.fields['CurrentLiabilities'];
		}

		// Added to fix liabilities based on current liabilities
		if (xbrl.fields['Liabilities'] === 0 &&
			xbrl.fields['CurrentLiabilities'] !== 0 &&
			xbrl.fields['NoncurrentLiabilities'] === 0) {
			xbrl.fields['Liabilities'] = xbrl.fields['CurrentLiabilities'];
		}

		var lngBSCheck1 = xbrl.fields['Equity'] - (xbrl.fields['EquityAttributableToParent'] + xbrl.fields['EquityAttributableToNoncontrollingInterest']);
		var lngBSCheck2 = xbrl.fields['Assets'] - xbrl.fields['LiabilitiesAndEquity'];
		var lngBSCheck3;
		var lngBSCheck4;
		var lngBSCheck5;

		if (xbrl.fields['CurrentAssets'] === 0 &&
			xbrl.fields['NoncurrentAssets'] === 0 &&
			xbrl.fields['CurrentLiabilities'] === 0 &&
			xbrl.fields['NoncurrentLiabilities'] === 0) {

			// If current assets/liabilities are zero and noncurrent assets/liabilities;: don't do this test because the balance sheet is not classified
			lngBSCheck3 = 0;
			lngBSCheck4 = 0;
		} else {
			// Balance sheet IS classified
			lngBSCheck3 = xbrl.fields['Assets'] - (xbrl.fields['CurrentAssets'] + xbrl.fields['NoncurrentAssets']);
			lngBSCheck4 = xbrl.fields['Liabilities'] - (xbrl.fields['CurrentLiabilities'] + xbrl.fields['NoncurrentLiabilities']);
		}
		lngBSCheck5 = xbrl.fields['LiabilitiesAndEquity'] - (xbrl.fields['Liabilities'] + xbrl.fields['CommitmentsAndContingencies'] + xbrl.fields['TemporaryEquity'] + xbrl.fields['Equity']);

		if (lngBSCheck1) {
			console.debug('BS1: Equity(' +
				xbrl.fields['Equity'] +
				') = EquityAttributableToParent(' +
				xbrl.fields['EquityAttributableToParent'] +
				') , EquityAttributableToNoncontrollingInterest(' +
				xbrl.fields['EquityAttributableToNoncontrollingInterest'] +
				'): ' +
				lngBSCheck1);
		}
		if (lngBSCheck2) {
			console.debug('BS2: Assets(' +
				xbrl.fields['Assets'] +
				') = LiabilitiesAndEquity(' +
				xbrl.fields['LiabilitiesAndEquity'] +
				'): ' +
				lngBSCheck2);
		}
		if (lngBSCheck3) {
			console.debug([
				'BS3: Assets(',
				xbrl.fields['Assets'],
				') = CurrentAssets(',
				xbrl.fields['CurrentAssets'],
				') + NoncurrentAssets(',
				xbrl.fields['NoncurrentAssets'],
				'): ',
				lngBSCheck3,
			].join(''));
		}
		if (lngBSCheck4) {
			console.debug('BS4: Liabilities(' +
				xbrl.fields['Liabilities'] +
				')= CurrentLiabilities(' +
				xbrl.fields['CurrentLiabilities'] +
				') + NoncurrentLiabilities(' +
				xbrl.fields['NoncurrentLiabilities'] +
				'): ' +
				lngBSCheck4);
		}
		if (lngBSCheck5) {
			console.debug('BS5: Liabilities and Equity(' +
				xbrl.fields['LiabilitiesAndEquity'] +
				')= Liabilities(' +
				xbrl.fields['Liabilities'] +
				') + CommitmentsAndContingencies(' +
				xbrl.fields['CommitmentsAndContingencies'] +
				')+ TemporaryEquity(' +
				xbrl.fields['TemporaryEquity'] +
				')+ Equity(' +
				xbrl.fields['Equity'] +
				'): ' +
				lngBSCheck5);
		}

		// fill in the values
		xbrl.values.Assets = xbrl.fields['Assets'];
		xbrl.values.CurrentAssets = xbrl.fields['CurrentAssets'];
		xbrl.values.NoncurrentAssets = xbrl.fields['NoncurrentAssets'];
		xbrl.values.LiabilitiesAndEquity = xbrl.fields['LiabilitiesAndEquity'];
		xbrl.values.Liabilities = xbrl.fields['Liabilities'];
		xbrl.values.CurrentLiabilities = xbrl.fields['CurrentLiabilities'];
		xbrl.values.NoncurrentLiabilities = xbrl.fields['NoncurrentLiabilities'];
		xbrl.values.CommitmentsAndContingencies = xbrl.fields['CommitmentsAndContingencies'];
		xbrl.values.TemporaryEquity = xbrl.fields['TemporaryEquity'];
		xbrl.values.Equity = xbrl.fields['Equity'];
		xbrl.values.EquityAttributableToNoncontrollingInterest = xbrl.fields['EquityAttributableToNoncontrollingInterest'];
		xbrl.values.EquityAttributableToParent = xbrl.fields['EquityAttributableToParent'];

	}


	/**
	 * Range values
	 * 
	 * Ranges are interesting because several of them are reported. 
	 * Unfortunatley, we don't know which on the user is going to be 
	 * interested in.
	 * 
	 * Take for example "Profit". I may be interested in the amount 
	 * of profit we have earned over the course of a year.
	 * 
	 * This can be expressed in one of two ways:
	 * 
	 * As cumulative profits accrued YTD
	 * 
	 *         J F M A M J J A S O N D
	 *        +------------------------+
	 *     Q1 |======                  |
	 *     Q2 |============            |
	 *     Q3 |==================      |
	 *     Q4 |========================|
	 *     FY |========================|
	 *        +------------------------+
	 * 
	 * or as the individual segments of time that will accumulate to 
	 * the grand total.
	 * 
	 *         J F M A M J J A S O N D
	 *        +------------------------+
	 *     Q1 |======                  |
	 *     Q2 |      ======            |
	 *     Q3 |            ======      |
	 *     Q4 |                  ======|
	 *     FY |========================|
	 *        +------------------------+
	 * 
	 * Both of these persepctives are acurate, and meaningful, and 
	 * therefore both should be made available.
	 */
	static _loadDurations(xbrl){
		// load every duration into the data set
		for(let duration in xbrl.values.durations){
			FundamentalAccountingConcepts._loadDuration(xbrl,duration);
		}

		// create our flattened table persepective
		let defContext = xbrl.values.durations[xbrl.values.ContextForDurations];
		for(let fld in defContext){
			xbrl.fields[fld] = defContext[fld];
			xbrl.values[fld] = defContext[fld];
		}
	}


	static _loadDuration(xbrl, duration = xbrl.ContextForDurations){
		let context = xbrl.values.durations[duration];

		// Revenues
		context.Revenues = 
			xbrl.getFactValue("us-gaap:Revenues", duration) ||
			xbrl.getFactValue("us-gaap:SalesRevenueNet", duration) ||
			xbrl.getFactValue("us-gaap:SalesRevenueServicesNet", duration) ||
			xbrl.getFactValue("us-gaap:RevenuesNetOfInterestExpense", duration) ||
			xbrl.getFactValue("us-gaap:RegulatedAndUnregulatedOperatingRevenue", duration) ||
			xbrl.getFactValue("us-gaap:HealthCareOrganizationRevenue", duration) ||
			xbrl.getFactValue("us-gaap:InterestAndDividendIncomeOperating", duration) ||
			xbrl.getFactValue("us-gaap:RealEstateRevenueNet", duration) ||
			xbrl.getFactValue("us-gaap:RevenueMineralSales", duration) ||
			xbrl.getFactValue("us-gaap:OilAndGasRevenue", duration) ||
			xbrl.getFactValue("us-gaap:FinancialServicesRevenue", duration) ||
			xbrl.getFactValue("us-gaap:RegulatedAndUnregulatedOperatingRevenue", duration) || 
			0;

		// CostOfRevenue
		context.CostOfRevenue = 
			xbrl.getFactValue("us-gaap:CostOfRevenue", duration) ||
			xbrl.getFactValue("us-gaap:CostOfServices", duration) ||
			xbrl.getFactValue("us-gaap:CostOfGoodsSold", duration) ||
			xbrl.getFactValue("us-gaap:CostOfGoodsAndServicesSold", duration) || 
			0;

		// GrossProfit
		context.GrossProfit = 
			xbrl.getFactValue("us-gaap:GrossProfit", duration) || 
			0;

		// OperatingExpenses
		context.OperatingExpenses = 
			xbrl.getFactValue("us-gaap:OperatingExpenses", duration) ||
			xbrl.getFactValue("us-gaap:OperatingCostsAndExpenses", duration) || 
			0;

		// CostsAndExpenses
		context.CostsAndExpenses = 
			xbrl.getFactValue("us-gaap:CostsAndExpenses", duration) || 
			0;

		// OtherOperatingIncome
		context.OtherOperatingIncome = 
			xbrl.getFactValue("us-gaap:OtherOperatingIncome", duration) || 
			0;

		// OperatingIncomeLoss
		context.OperatingIncomeLoss = 
			xbrl.getFactValue("us-gaap:OperatingIncomeLoss", duration) || 
			0;

		// NonoperatingIncomeLoss
		context.NonoperatingIncomeLoss = 
			xbrl.getFactValue("us-gaap:NonoperatingIncomeExpense", duration) || 
			0;

		// InterestAndDebtExpense
		context.InterestAndDebtExpense =
			xbrl.getFactValue("us-gaap:InterestAndDebtExpense", duration) || 
			0;

		// IncomeBeforeEquityMethodInvestments
		context.IncomeBeforeEquityMethodInvestments = 
			xbrl.getFactValue("us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", duration) || 
			0;

		// IncomeFromEquityMethodInvestments
		context.IncomeFromEquityMethodInvestments = 
			xbrl.getFactValue("us-gaap:IncomeLossFromEquityMethodInvestments", duration) || 
			0;

		// IncomeFromContinuingOperationsBeforeTax
		context.IncomeFromContinuingOperationsBeforeTax = 
			xbrl.getFactValue("us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", duration) ||
			xbrl.getFactValue("us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", duration) || 
			0;

		// IncomeTaxExpenseBenefit
		context.IncomeTaxExpenseBenefit = 
			xbrl.getFactValue("us-gaap:IncomeTaxExpenseBenefit", duration) ||
			xbrl.getFactValue("us-gaap:IncomeTaxExpenseBenefitContinuingOperations", duration) || 
			0;

		// IncomeFromContinuingOperationsAfterTax
		context.IncomeFromContinuingOperationsAfterTax = 
			xbrl.getFactValue("us-gaap:IncomeLossBeforeExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple", duration) || 
			0;

		// IncomeFromDiscontinuedOperations
		context.IncomeFromDiscontinuedOperations = 
			xbrl.getFactValue("us-gaap:IncomeLossFromDiscontinuedOperationsNetOfTax", duration) ||
			xbrl.getFactValue("us-gaap:DiscontinuedOperationGainLossOnDisposalOfDiscontinuedOperationNetOfTax", duration) ||
			xbrl.getFactValue("us-gaap:IncomeLossFromDiscontinuedOperationsNetOfTaxAttributableToReportingEntity", duration) || 
			0;

		// ExtraordaryItemsGainLoss
		context.ExtraordaryItemsGainLoss = 
			xbrl.getFactValue("us-gaap:ExtraordinaryItemNetOfTax", duration) || 
			0;

		// NetIncomeLoss
		context.NetIncomeLoss = 
			xbrl.getFactValue("us-gaap:ProfitLoss", duration) ||
			xbrl.getFactValue("us-gaap:NetIncomeLoss", duration) ||
			xbrl.getFactValue("us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic", duration) ||
			xbrl.getFactValue("us-gaap:IncomeLossFromContinuingOperations", duration) ||
			xbrl.getFactValue("us-gaap:IncomeLossAttributableToParent", duration) ||
			xbrl.getFactValue("us-gaap:IncomeLossFromContinuingOperationsIncludingPortionAttributableToNoncontrollingInterest", duration) || 
			0;

		// NetIncomeAvailableToCommonStockholdersBasic
		context.NetIncomeAvailableToCommonStockholdersBasic = 
			xbrl.getFactValue("us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic", duration) || 
			0;

		// #PreferredStockDividendsAndOtherAdjustments
		context.PreferredStockDividendsAndOtherAdjustments = 
			xbrl.getFactValue("us-gaap:PreferredStockDividendsAndOtherAdjustments", duration) || 
			0;

		// #NetIncomeAttributableToNoncontrollingInterest
		context['NetIncomeAttributableToNoncontrollingInterest'] = 
			xbrl.getFactValue("us-gaap:NetIncomeLossAttributableToNoncontrollingInterest", duration) || 
			0;

		// #NetIncomeAttributableToParent
		context['NetIncomeAttributableToParent'] = 
			xbrl.getFactValue("us-gaap:NetIncomeLoss", duration) || 
			0;

		// OtherComprehensiveIncome
		context['OtherComprehensiveIncome'] = 
			xbrl.getFactValue("us-gaap:OtherComprehensiveIncomeLossNetOfTax", duration) || 
			0;

		// ComprehensiveIncome
		context['ComprehensiveIncome'] = 
			xbrl.getFactValue("us-gaap:ComprehensiveIncomeNetOfTaxIncludingPortionAttributableToNoncontrollingInterest", duration) ||
			xbrl.getFactValue("us-gaap:ComprehensiveIncomeNetOfTax", duration) || 
			0;

		// ComprehensiveIncomeAttributableToParent
		context['ComprehensiveIncomeAttributableToParent'] = 
			xbrl.getFactValue("us-gaap:ComprehensiveIncomeNetOfTax", duration) ||
			0;

		// ComprehensiveIncomeAttributableToNoncontrollingInterest
		context['ComprehensiveIncomeAttributableToNoncontrollingInterest'] = 
			xbrl.getFactValue("us-gaap:ComprehensiveIncomeNetOfTaxAttributableToNoncontrollingInterest", duration) || 
			0;

		// Dividends
		context.CommonStockDividendsPerShareCashPaid = 
			xbrl.getFactValue('CommonStockDividendsPerShareCashPaid',duration) || 
			0;
		context.CommonStockDividendsPerShareDeclared =
			xbrl.getFactValue('CommonStockDividendsPerShareDeclared',duration) || 
			0;
		context.DividendsCommonStockCash = 
			xbrl.getFactValue('DividendsCommonStockCash',duration) || 
			0;
		context.EarningsPerShareBasic = 
			xbrl.getFactValue('EarningsPerShareBasic',duration) || 
			0;
		context.EarningsPerShareDiluted = 
			xbrl.getFactValue('EarningsPerShareDiluted',duration) || 
			0;
		context.PaymentsOfDividendsCommonStock = 
			xbrl.getFactValue('PaymentsOfDividendsCommonStock',duration) || 
			0;

		
		// 'Adjustments to income statement information
		// Impute: NonoperatingIncomeLossPlusInterestAndDebtExpense
		context['NonoperatingIncomeLossPlusInterestAndDebtExpense'] = context['NonoperatingIncomeLoss'] + context['InterestAndDebtExpense'];


		// Impute: Net income available to common stockholders  (if it does not exist)
		let logic = 
			context['NetIncomeAvailableToCommonStockholdersBasic'] === 0 && 
			context['PreferredStockDividendsAndOtherAdjustments'] === 0 &&
			context['NetIncomeAttributableToParent'] !== 0
			;
		if (logic) {
			context['NetIncomeAvailableToCommonStockholdersBasic'] = context['NetIncomeAttributableToParent'];
		}

		// Impute NetIncomeLoss
		logic = 
			context['NetIncomeLoss'] !== 0 &&
			context['IncomeFromContinuingOperationsAfterTax'] === 0
			;
		if (logic) {
			context['IncomeFromContinuingOperationsAfterTax'] = context['NetIncomeLoss'] - context['IncomeFromDiscontinuedOperations'] - context['ExtraordaryItemsGainLoss'];
		}

		// Impute: Net income attributable to parent if it does not exist
		logic = 
			context['NetIncomeAttributableToParent'] === 0 &&
			context['NetIncomeAttributableToNoncontrollingInterest'] === 0 &&
			context['NetIncomeLoss'] !== 0
			;
		if (logic) {
			context['NetIncomeAttributableToParent'] = context['NetIncomeLoss'];
		}

		// Impute: PreferredStockDividendsAndOtherAdjustments
		logic = 
			context['PreferredStockDividendsAndOtherAdjustments'] === 0 &&
			context['NetIncomeAttributableToParent'] !== 0 &&
			context['NetIncomeAvailableToCommonStockholdersBasic'] !== 0
			;
		if(logic) {
			context['PreferredStockDividendsAndOtherAdjustments'] = context['NetIncomeAttributableToParent'] - context['NetIncomeAvailableToCommonStockholdersBasic'];
		}

		// Impute: comprehensive income
		if (context['ComprehensiveIncomeAttributableToParent'] === 0 &&
			context['ComprehensiveIncomeAttributableToNoncontrollingInterest'] === 0 &&
			context['ComprehensiveIncome'] === 0 && context['OtherComprehensiveIncome'] === 0) {
			context['ComprehensiveIncome'] = context['NetIncomeLoss'];
		}

		// Impute: other comprehensive income
		if (context['ComprehensiveIncome'] !== 0 &&
			context['OtherComprehensiveIncome'] === 0) {
			context['OtherComprehensiveIncome'] = context['ComprehensiveIncome'] - context['NetIncomeLoss'];
		}

		// Impute: comprehensive income attributable to parent if it does not exist
		if (context['ComprehensiveIncomeAttributableToParent'] === 0 &&
			context['ComprehensiveIncomeAttributableToNoncontrollingInterest'] === 0 &&
			context['ComprehensiveIncome'] !== 0) {
			context['ComprehensiveIncomeAttributableToParent'] = context['ComprehensiveIncome'];
		}

		// Impute: IncomeFromContinuingOperations*Before*Tax
		if (context['IncomeBeforeEquityMethodInvestments'] !== 0 &&
			context['IncomeFromEquityMethodInvestments'] !== 0 &&
			context['IncomeFromContinuingOperationsBeforeTax'] === 0) {
			context['IncomeFromContinuingOperationsBeforeTax'] = context['IncomeBeforeEquityMethodInvestments'] + context['IncomeFromEquityMethodInvestments'];
		}

		// Impute: IncomeFromContinuingOperations*Before*Tax2 (if income before tax is missing)
		if (context['IncomeFromContinuingOperationsBeforeTax'] === 0 &&
			context['IncomeFromContinuingOperationsAfterTax'] !== 0) {
			context['IncomeFromContinuingOperationsBeforeTax'] = context['IncomeFromContinuingOperationsAfterTax'] + context['IncomeTaxExpenseBenefit'];
		}

		// Impute: IncomeFromContinuingOperations*After*Tax
		if (context['IncomeFromContinuingOperationsAfterTax'] === 0 &&
			(context['IncomeTaxExpenseBenefit'] !== 0 || context['IncomeTaxExpenseBenefit'] === 0) &&
			context['IncomeFromContinuingOperationsBeforeTax'] !== 0) {
			context['IncomeFromContinuingOperationsAfterTax'] = context['IncomeFromContinuingOperationsBeforeTax'] - context['IncomeTaxExpenseBenefit'];
		}

		// Impute: GrossProfit
		logic = 
			context['GrossProfit'] === 0 &&
			context['Revenues'] !== 0 &&
			context['CostOfRevenue'] !== 0
			;
		if (logic) {
			context['GrossProfit'] = context['Revenues'] - context['CostOfRevenue'];
		}

		// Impute: Revenues
		logic = 
			context['GrossProfit'] !== 0 &&
			context['Revenues'] === 0 &&
			context['CostOfRevenue'] !== 0
			;
		if(logic) {
			context['Revenues'] = context['GrossProfit'] + context['CostOfRevenue'];
		}

		// Impute: CostOfRevenue
		logic = 
			context['GrossProfit'] !== 0 &&
			context['Revenues'] !== 0 &&
			context['CostOfRevenue'] === 0
			;
		if(logic) {
			context['CostOfRevenue'] = context['Revenues'] - context['GrossProfit'];
		}

		// Impute: CostsAndExpenses (would NEVER have costs and expenses if has gross profit, gross profit is multi-step and costs and expenses is single-step)
		logic = 
			context['GrossProfit'] === 0 &&
			context['CostsAndExpenses'] === 0 &&
			context['CostOfRevenue'] !== 0 &&
			context['OperatingExpenses'] !== 0
			;
		if(logic){
			context['CostsAndExpenses'] = context['CostOfRevenue'] + context['OperatingExpenses'];
		}

		// Impute: CostsAndExpenses based on existance of both costs of revenues and operating expenses
		logic = 
			context['CostsAndExpenses'] === 0 &&
			context['OperatingExpenses'] !== 0 &&
			context['CostOfRevenue'] !== 0
			;
		if(logic){
			context['CostsAndExpenses'] = context['CostOfRevenue'] + context['OperatingExpenses'];
		}

		// Impute: CostsAndExpenses
		logic = 
			context['GrossProfit'] === 0 &&
			context['CostsAndExpenses'] === 0 &&
			context['Revenues'] !== 0 &&
			context['OperatingIncomeLoss'] !== 0 &&
			context['OtherOperatingIncome'] !== 0
			;
		if(logic){
			context['CostsAndExpenses'] = context['Revenues'] - context['OperatingIncomeLoss'] - context['OtherOperatingIncome'];
		}

		// Impute: OperatingExpenses based on existance of costs and expenses and cost of revenues
		logic = 
			context['CostOfRevenue'] !== 0 &&
			context['CostsAndExpenses'] !== 0 &&
			context['OperatingExpenses'] === 0
			;
		if(logic) {
			context['OperatingExpenses'] = context['CostsAndExpenses'] - context['CostOfRevenue'];
		}

		// Impute: CostOfRevenues single-step method
		logic = 
			context['Revenues'] !== 0 &&
			context['GrossProfit'] === 0 &&
			context['OperatingIncomeLoss'] == (context['Revenues'] - context['CostsAndExpenses'])  &&
			context['OperatingExpenses'] === 0 &&
			context['OtherOperatingIncome'] === 0
			;
		if(logic) {
			context['CostOfRevenue'] = context['CostsAndExpenses'] - context['OperatingExpenses'];
		}

		// Impute: IncomeBeforeEquityMethodInvestments
		if (context['IncomeBeforeEquityMethodInvestments'] === 0 &&
			context['IncomeFromContinuingOperationsBeforeTax'] !== 0) {
			context['IncomeBeforeEquityMethodInvestments'] = context['IncomeFromContinuingOperationsBeforeTax'] - context['IncomeFromEquityMethodInvestments'];
		}

		// Impute: IncomeBeforeEquityMethodInvestments
		if (context['OperatingIncomeLoss'] !== 0 &&
			context['NonoperatingIncomeLoss'] !== 0 &&
			context['InterestAndDebtExpense'] == 0 &&
			context['IncomeBeforeEquityMethodInvestments'] !== 0) {
			context['InterestAndDebtExpense'] = context['IncomeBeforeEquityMethodInvestments'] - (context['OperatingIncomeLoss'] + context['NonoperatingIncomeLoss']);
		}

		// Impute: OtherOperatingIncome
		if (context['GrossProfit'] !== 0 &&
			context['OperatingExpenses'] !== 0 &&
			context['OperatingIncomeLoss'] !== 0) {
			context['OtherOperatingIncome'] = context['OperatingIncomeLoss'] - (context['GrossProfit'] - context['OperatingExpenses']);
		}

		// Move IncomeFromEquityMethodInvestments
		if (context['IncomeFromEquityMethodInvestments'] !== 0 &&
			context['IncomeBeforeEquityMethodInvestments'] !== 0 &&
			context['IncomeBeforeEquityMethodInvestments'] !== context['IncomeFromContinuingOperationsBeforeTax']) {
			context['IncomeBeforeEquityMethodInvestments'] = context['IncomeFromContinuingOperationsBeforeTax'] - context['IncomeFromEquityMethodInvestments'];
			context['OperatingIncomeLoss'] = context['OperatingIncomeLoss'] - context['IncomeFromEquityMethodInvestments'];
		}

		// DANGEROUS!!  May need to turn off. IS3 had 2085 PASSES WITHOUT this imputing. if it is higher,: keep the test
		// Impute: OperatingIncomeLoss
		if (context['OperatingIncomeLoss'] === 0 && context['IncomeBeforeEquityMethodInvestments'] !== 0) {
			context['OperatingIncomeLoss'] = context['IncomeBeforeEquityMethodInvestments'] + context['NonoperatingIncomeLoss'] - context['InterestAndDebtExpense'];
		}

		context['NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'] = context['IncomeFromContinuingOperationsBeforeTax'] - context['OperatingIncomeLoss'];

		// NonoperatingIncomeLossPlusInterestAndDebtExpense
		if (context['NonoperatingIncomeLossPlusInterestAndDebtExpense'] === 0 && context['NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'] !== 0) {
			context['NonoperatingIncomeLossPlusInterestAndDebtExpense'] = context['NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'] - context['IncomeFromEquityMethodInvestments'];
		}

		var lngIS1 = (context['Revenues'] - context['CostOfRevenue']) - context['GrossProfit'];
		var lngIS2 = (context['GrossProfit'] - context['OperatingExpenses'] + context['OtherOperatingIncome']) - context['OperatingIncomeLoss'];
		var lngIS3 = (context['OperatingIncomeLoss'] + context['NonoperatingIncomeLossPlusInterestAndDebtExpense']) - context['IncomeBeforeEquityMethodInvestments'];
		var lngIS4 = (context['IncomeBeforeEquityMethodInvestments'] + context['IncomeFromEquityMethodInvestments']) - context['IncomeFromContinuingOperationsBeforeTax'];
		var lngIS5 = (context['IncomeFromContinuingOperationsBeforeTax'] - context['IncomeTaxExpenseBenefit']) - context['IncomeFromContinuingOperationsAfterTax'];
		var lngIS6 = (context['IncomeFromContinuingOperationsAfterTax'] + context['IncomeFromDiscontinuedOperations'] + context['ExtraordaryItemsGainLoss']) - context['NetIncomeLoss'];
		var lngIS7 = (context['NetIncomeAttributableToParent'] + context['NetIncomeAttributableToNoncontrollingInterest']) - context['NetIncomeLoss'];
		var lngIS8 = (context['NetIncomeAttributableToParent'] - context['PreferredStockDividendsAndOtherAdjustments']) - context['NetIncomeAvailableToCommonStockholdersBasic'];
		var lngIS9 = (context['ComprehensiveIncomeAttributableToParent'] + context['ComprehensiveIncomeAttributableToNoncontrollingInterest']) - context['ComprehensiveIncome'];
		var lngIS10 = (context['NetIncomeLoss'] + context['OtherComprehensiveIncome']) - context['ComprehensiveIncome'];
		var lngIS11 = context['OperatingIncomeLoss'] - (context['Revenues'] - context['CostsAndExpenses'] + context['OtherOperatingIncome']);

		if (lngIS1) {
			console.debug("IS1: GrossProfit(" + context['GrossProfit'] + ") = Revenues(" + context['Revenues'] + ") - CostOfRevenue(" + context['CostOfRevenue'] + "): " + lngIS1);
		}
		if (lngIS2) {
			console.debug("IS2: OperatingIncomeLoss(" + context['OperatingIncomeLoss'] + ") = GrossProfit(" + context['GrossProfit'] + ") - OperatingExpenses(" + context['OperatingExpenses'] + ") + OtherOperatingIncome(" + context['OtherOperatingIncome'] + "): " + lngIS2);
		}
		if (lngIS3) {
			console.debug("IS3: IncomeBeforeEquityMethodInvestments(" + context['IncomeBeforeEquityMethodInvestments'] + ") = OperatingIncomeLoss(" + context['OperatingIncomeLoss'] + ") - NonoperatingIncomeLoss(" + context['NonoperatingIncomeLoss'] + ")+ InterestAndDebtExpense(" + context['InterestAndDebtExpense'] + "): " + lngIS3);
		}
		if (lngIS4) {
			console.debug("IS4: IncomeFromContinuingOperationsBeforeTax(" + context['IncomeFromContinuingOperationsBeforeTax'] + ") = IncomeBeforeEquityMethodInvestments(" + context['IncomeBeforeEquityMethodInvestments'] + ") + IncomeFromEquityMethodInvestments(" + context['IncomeFromEquityMethodInvestments'] + "): " + lngIS4);
		}
		if (lngIS5) {
			console.debug("IS5: IncomeFromContinuingOperationsAfterTax(" + context['IncomeFromContinuingOperationsAfterTax'] + ") = IncomeFromContinuingOperationsBeforeTax(" + context['IncomeFromContinuingOperationsBeforeTax'] + ") - IncomeTaxExpenseBenefit(" + context['IncomeTaxExpenseBenefit'] + "): " + lngIS5);
		}
		if (lngIS6) {
			console.debug("IS6: NetIncomeLoss(" + context['NetIncomeLoss'] + ") = IncomeFromContinuingOperationsAfterTax(" + context['IncomeFromContinuingOperationsAfterTax'] + ") + IncomeFromDiscontinuedOperations(" + context['IncomeFromDiscontinuedOperations'] + ") + ExtraordaryItemsGainLoss(" + context['ExtraordaryItemsGainLoss'] + "): " + lngIS6);
		}
		if (lngIS7) {
			console.debug("IS7: NetIncomeLoss(" + context['NetIncomeLoss'] + ") = NetIncomeAttributableToParent(" + context['NetIncomeAttributableToParent'] + ") + NetIncomeAttributableToNoncontrollingInterest(" + context['NetIncomeAttributableToNoncontrollingInterest'] + "): " + lngIS7);
		}
		if (lngIS8) {
			console.debug("IS8: NetIncomeAvailableToCommonStockholdersBasic(" + context['NetIncomeAvailableToCommonStockholdersBasic'] + ") = NetIncomeAttributableToParent(" + context['NetIncomeAttributableToParent'] + ") - PreferredStockDividendsAndOtherAdjustments(" + context['PreferredStockDividendsAndOtherAdjustments'] + "): " + lngIS8);
		}
		if (lngIS9) {
			console.debug("IS9: ComprehensiveIncome(" + context['ComprehensiveIncome'] + ") = ComprehensiveIncomeAttributableToParent(" + context['ComprehensiveIncomeAttributableToParent'] + ") + ComprehensiveIncomeAttributableToNoncontrollingInterest(" + context['ComprehensiveIncomeAttributableToNoncontrollingInterest'] + "): " + lngIS9);
		}
		if (lngIS10) {
			console.debug("IS10: ComprehensiveIncome(" + context['ComprehensiveIncome'] + ") = NetIncomeLoss(" + context['NetIncomeLoss'] + ") + OtherComprehensiveIncome(" + context['OtherComprehensiveIncome'] + "): " + lngIS10);
		}
		if (lngIS11) {
			console.debug("IS11: OperatingIncomeLoss(" + context['OperatingIncomeLoss'] + ") = Revenues(" + context['Revenues'] + ") - CostsAndExpenses(" + context['CostsAndExpenses'] + ") + OtherOperatingIncome(" + context['OtherOperatingIncome'] + "): " + lngIS11);
		}

		// Cash flow statement

		// NetCashFlow
		context['NetCashFlow'] = 
			xbrl.getFactValue("us-gaap:CashAndCashEquivalentsPeriodIncreaseDecrease", duration) ||
			xbrl.getFactValue("us-gaap:CashPeriodIncreaseDecrease", duration) ||
			xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInContinuingOperations", duration) || 
			0;
	

		// NetCashFlowsOperating
		context['NetCashFlowsOperating'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInOperatingActivities", duration) || 0;

		// NetCashFlowsInvesting
		context['NetCashFlowsInvesting'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInInvestingActivities", duration) || 0;

		// NetCashFlowsFinancing
		context['NetCashFlowsFinancing'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInFinancingActivities", duration) || 0;

		// NetCashFlowsOperatingContinuing
		context['NetCashFlowsOperatingContinuing'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInOperatingActivitiesContinuingOperations", duration) || 0;

		// NetCashFlowsInvestingContinuing
		context['NetCashFlowsInvestingContinuing'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInInvestingActivitiesContinuingOperations", duration) || 0;
		// NetCashFlowsFinancingContinuing
		context['NetCashFlowsFinancingContinuing'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInFinancingActivitiesContinuingOperations", duration) || 0;

		// NetCashFlowsOperatingDiscontinued
		context['NetCashFlowsOperatingDiscontinued'] = xbrl.getFactValue("us-gaap:CashProvidedByUsedInOperatingActivitiesDiscontinuedOperations", duration) || 0;

		// NetCashFlowsInvestingDiscontinued
		context['NetCashFlowsInvestingDiscontinued'] = xbrl.getFactValue("us-gaap:CashProvidedByUsedInInvestingActivitiesDiscontinuedOperations", duration) || 0;

		// NetCashFlowsFinancingDiscontinued
		context['NetCashFlowsFinancingDiscontinued'] = xbrl.getFactValue("us-gaap:CashProvidedByUsedInFinancingActivitiesDiscontinuedOperations", duration) || 0;

		// NetCashFlowsDiscontinued
		context['NetCashFlowsDiscontinued'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInDiscontinuedOperations", duration) || 0;

		// ExchangeGainsLosses
		context['ExchangeGainsLosses'] = 
			xbrl.getFactValue("us-gaap:EffectOfExchangeRateOnCashAndCashEquivalents", duration) ||
			xbrl.getFactValue("us-gaap:EffectOfExchangeRateOnCashAndCashEquivalentsContinuingOperations", duration) ||
			xbrl.getFactValue("us-gaap:CashProvidedByUsedInFinancingActivitiesDiscontinuedOperations", duration) || 
			0;

		// Adjustments
		// Impute: total net cash flows discontinued if not reported
		if (context['NetCashFlowsDiscontinued'] === 0) {
			context['NetCashFlowsDiscontinued'] = context['NetCashFlowsOperatingDiscontinued'] + context['NetCashFlowsInvestingDiscontinued'] + context['NetCashFlowsFinancingDiscontinued'];
		}

		// Impute: cash flows from continuing
		if (context['NetCashFlowsOperating'] !== 0 && context['NetCashFlowsOperatingContinuing'] === 0) {
			context['NetCashFlowsOperatingContinuing'] = context['NetCashFlowsOperating'] - context['NetCashFlowsOperatingDiscontinued'];
		}

		if (context['NetCashFlowsInvesting'] !== 0 && context['NetCashFlowsInvestingContinuing'] === 0) {
			context['NetCashFlowsInvestingContinuing'] = context['NetCashFlowsInvesting'] - context['NetCashFlowsInvestingDiscontinued'];
		}

		if (context['NetCashFlowsFinancing'] !== 0 && context['NetCashFlowsFinancingContinuing'] === 0) {
			context['NetCashFlowsFinancingContinuing'] = context['NetCashFlowsFinancing'] - context['NetCashFlowsFinancingDiscontinued'];
		}

		if (context['NetCashFlowsOperating'] === 0 && context['NetCashFlowsOperatingContinuing'] !== 0 && context['NetCashFlowsOperatingDiscontinued'] === 0) {
			context['NetCashFlowsOperating'] = context['NetCashFlowsOperatingContinuing'];
		}

		if (context['NetCashFlowsInvesting'] === 0 && context['NetCashFlowsInvestingContinuing'] !== 0 && context['NetCashFlowsInvestingDiscontinued'] === 0) {
			context['NetCashFlowsInvesting'] = context['NetCashFlowsInvestingContinuing'];
		}

		if (context['NetCashFlowsFinancing'] === 0 && context['NetCashFlowsFinancingContinuing'] !== 0 && context['NetCashFlowsFinancingDiscontinued'] === 0) {
			context['NetCashFlowsFinancing'] = context['NetCashFlowsFinancingContinuing'];
		}

		context['NetCashFlowsContinuing'] = context['NetCashFlowsOperatingContinuing'] + context['NetCashFlowsInvestingContinuing'] + context['NetCashFlowsFinancingContinuing'];

		// Impute: if net cash flow is missing,: this tries to figure out the value by adding up the detail
		if (context['NetCashFlow'] === 0 && (context['NetCashFlowsOperating'] !== 0 || context['NetCashFlowsInvesting'] !== 0 || context['NetCashFlowsFinancing'] !== 0)) {
			context['NetCashFlow'] = context['NetCashFlowsOperating'] + context['NetCashFlowsInvesting'] + context['NetCashFlowsFinancing'];
		}

		var lngCF1 = context['NetCashFlow'] - (context['NetCashFlowsOperating'] + context['NetCashFlowsInvesting'] + context['NetCashFlowsFinancing'] + context['ExchangeGainsLosses']);

		if (lngCF1 !== 0 && (context['NetCashFlow'] - (context['NetCashFlowsOperating'] + context['NetCashFlowsInvesting'] + context['NetCashFlowsFinancing'] + context['ExchangeGainsLosses']) === (context['ExchangeGainsLosses'] * -1))) {
			lngCF1 = 888888;
		}

		// What is going on here is that 171 filers compute net cash flow differently than everyone else.
		// What I am doing is marking these by setting the value of the test to a number 888888 which would never occur naturally, so that I can differentiate this from errors.
		var lngCF2 = context['NetCashFlowsContinuing'] - (context['NetCashFlowsOperatingContinuing'] + context['NetCashFlowsInvestingContinuing'] + context['NetCashFlowsFinancingContinuing']);
		var lngCF3 = context['NetCashFlowsDiscontinued'] - (context['NetCashFlowsOperatingDiscontinued'] + context['NetCashFlowsInvestingDiscontinued'] + context['NetCashFlowsFinancingDiscontinued']);
		var lngCF4 = context['NetCashFlowsOperating'] - (context['NetCashFlowsOperatingContinuing'] + context['NetCashFlowsOperatingDiscontinued']);
		var lngCF5 = context['NetCashFlowsInvesting'] - (context['NetCashFlowsInvestingContinuing'] + context['NetCashFlowsInvestingDiscontinued']);
		var lngCF6 = context['NetCashFlowsFinancing'] - (context['NetCashFlowsFinancingContinuing'] + context['NetCashFlowsFinancingDiscontinued']);


		if (lngCF1) {
			console.debug("CF1: NetCashFlow(" + context['NetCashFlow'] + ") = (NetCashFlowsOperating(" + context['NetCashFlowsOperating'] + ") + (NetCashFlowsInvesting(" + context['NetCashFlowsInvesting'] + ") + (NetCashFlowsFinancing(" + context['NetCashFlowsFinancing'] + ") + ExchangeGainsLosses(" + context['ExchangeGainsLosses'] + "): " + lngCF1);
		}
		if (lngCF2) {
			console.debug("CF2: NetCashFlowsContinuing(" + context['NetCashFlowsContinuing'] + ") = NetCashFlowsOperatingContinuing(" + context['NetCashFlowsOperatingContinuing'] + ") + NetCashFlowsInvestingContinuing(" + context['NetCashFlowsInvestingContinuing'] + ") + NetCashFlowsFinancingContinuing(" + context['NetCashFlowsFinancingContinuing'] + "): " + lngCF2);
		}
		if (lngCF3) {
			console.debug("CF3: NetCashFlowsDiscontinued(" + context['NetCashFlowsDiscontinued'] + ") = NetCashFlowsOperatingDiscontinued(" + context['NetCashFlowsOperatingDiscontinued'] + ") + NetCashFlowsInvestingDiscontinued(" + context['NetCashFlowsInvestingDiscontinued'] + ") + NetCashFlowsFinancingDiscontinued(" + context['NetCashFlowsFinancingDiscontinued'] + "): " + lngCF3);
		}
		if (lngCF4) {
			console.debug("CF4: NetCashFlowsOperating(" + context['NetCashFlowsOperating'] + ") = NetCashFlowsOperatingContinuing(" + context['NetCashFlowsOperatingContinuing'] + ") + NetCashFlowsOperatingDiscontinued(" + context['NetCashFlowsOperatingDiscontinued'] + "): " + lngCF4);
		}
		if (lngCF5) {
			console.debug("CF5: NetCashFlowsInvesting(" + context['NetCashFlowsInvesting'] + ") = NetCashFlowsInvestingContinuing(" + context['NetCashFlowsInvestingContinuing'] + ") + NetCashFlowsInvestingDiscontinued(" + context['NetCashFlowsInvestingDiscontinued'] + "): " + lngCF5);
		}
		if (lngCF6) {
			console.debug("CF6: NetCashFlowsFinancing(" + context['NetCashFlowsFinancing'] + ") = NetCashFlowsFinancingContinuing(" + context['NetCashFlowsFinancingContinuing'] + ") + NetCashFlowsFinancingDiscontinued(" + context['NetCashFlowsFinancingDiscontinued'] + "): " + lngCF6);
		}

	}

}
