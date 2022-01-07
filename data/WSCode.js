function soapCall(handler, soapFunction, soapBody) {
	try {
		var xmlhttp = new XMLHttpRequest();
		var endpoint = "http://www.eurorisksystems.com:8080/PMSWS/PMSWS11?wsdl"
		xmlhttp.open("POST", endpoint, true);
		xmlhttp.onreadystatechange = function () {
			if (this.readyState == 4) {
				var xml = xmlhttp.responseXML;
				if (this.status != 200) {
					 alert("Parse error: " + xml.parseError.reason);
				} else{
					if (xml.getElementsByTagName("responseCode").length > 0){
						var responseCode = xml.getElementsByTagName("responseCode")[0].textContent;
						if (responseCode == "OK") {
							handler(xml);
						} else if (responseCode == 'INVALID_TOKEN' || responseCode == 'EXECUTION_NODE_IS_NOT_AVAILABLE'|| responseCode == 'EXPIRED_TOKEN'){
							token = "";
							alert("Expired session!");
							pause = true;
							loading(false);
						} else if (responseCode == 'INVALID_LOGIN') {
							alert("Invalid Login");
							loading(false);
							loginForm.enableItem("login");
							loginWin.setModal(true);
						} else {
							alert("Bussiness exception: " + responseCode);
							console.log(xml);
							toolbar.enableItem("logout");
							loginForm.enableItem("login");
							pause = true;
							loading(false);
						}
					} else {
						alert("Proxy Exception: responseCode not found");
						pause = true;
						loading(false);
					}
				}
			}
		}
		xmlhttp.setRequestHeader("Content-Type", "text/xml");
		xmlhttp.setRequestHeader("SOAPAction", endpoint + "/" + soapFunction);
		var header = "<soapenv:Header/>";
		var body = "<soapenv:Body>" + soapBody + "</soapenv:Body></soapenv:Envelope>";
		xmlhttp.send("<?xml version='1.0' encoding='UTF-8'?><soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:ers='http://ers.bg'>" + header + body);
	} catch (e) {
		console.log("EVERYTHING IS BROKEN");
		console.log(e.message)
		loading(false);
		pause = false;
		return;
	}
}

function getAvailableDomains() {
	soapCall(
		function(xml) {
			try {
				domains = xml.getElementsByTagName("domains");
				for (var i=0; i < domains.length; i++) {
					loginForm.getCombo("domain").addOption([
						[domains[i].textContent,domains[i].textContent]
					]);
				}
				loginForm.getCombo("domain").selectOption(4);
		    } catch (e) {
				alert("An error has occured.\nPlease refresh your page.")
			}
		},
		"getAvailableDomains",
		"<ers:getAvailableDomains/>",
	);
}

function getUsersForDomain() {
	soapCall(
		function(xml) {
			loginForm.getCombo("user").clearAll();
			var usersXML = xml.getElementsByTagName("users");
			var usersTemp = [];
			var users = [];
			for (i = 0; i < usersXML.length; i++) {
				for (j = 0; j < usersXML[i].childNodes.length; j++) {
					usersTemp.push(usersXML[i].childNodes[j].textContent)
				}
				users.push(usersTemp);
				usersTemp = [];
			}
			var names = [];
			for (i = 0; i < users.length; i++) {
				if (users[i].length == 4) {
					users[i].shift();
				} else if (users[i].length == 5) {
					users[i].shift();
					users[i].shift();
				}
				loginForm.getCombo("user").addOption([
					[users[i][0],users[i][1] + ", " + users[i][2]]
				]);
			}
			loginForm.getCombo("user").selectOption(0);
		},
		"getUsersForDomain",
		"<ers:getUsersForDomain>" +
			"<domain>" + loginForm.getCombo("domain").getActualValue() + "</domain>" +
		"</ers:getUsersForDomain>",
	);
}

function login() {
	soapCall(
		function(xml) {
			token = xml.getElementsByTagName("token")[0].textContent;
			userName = loginForm.getCombo("user").getActualValue();
			document.getElementById("usertext").innerHTML = "User: " + userName;
			loginWin.hide();
			loginForm.enableItem("login");
			getPortfolios();
			getCubes();
			getDashboards();
			$("#loading-image").css("z-index", 1001);
			$("#loading-text").css("z-index", 1002);
		},
		"login",
		"<ers:login>" +
			"<userName>" + loginForm.getCombo("user").getActualValue() + "</userName>" +
			"<password>" + loginForm.getItemValue("pass") + "</password>" +
			"<domain>" + loginForm.getItemValue("domain") + "</domain>" +
		"</ers:login>"
	);
}

function logout() {
	if (actionMode) {
		soapCall(
			function(xml) {
				actionMode = false;
				logoutA();
			},
			"endActionMode",
			"<ers:endActionMode><token>" + token + "</token></ers:endActionMode>",
		)
	} else logoutA();
	function logoutA() {
		if (!actionMode) {
			soapCall(
				function(xml) {
					loginWin.show();
					document.getElementById("usertext").innerHTML = "Not logged in"
					loginForm.setItemValue("user", "");
					loginForm.setItemValue("pass", "");
					loading(false);
					token = "";
					username = "";
					loginWin.setModal(true);
					actionMode = false;
					loadCombo.clearAll();
					$("#loading-image").css("z-index", 1);
					$("#loading-text").css("z-index", 2);
				},
				"shutDown",
				"<ers:shutDown><token>" + token + "</token></ers:shutDown>",
			)
		}
	}
}

function getPortfolios() {
	soapCall(
		function(xml) {
			analyses = xml.getElementsByTagName("nomValues")[0].textContent;
			analyses += ";Export";
		},
		"getListItemsWithNom",
		"<ers:getListItemsWithNom><token>" + token + "</token><listName>AnalysisList</listName></ers:getListItemsWithNom>",
	);
	soapCall(
		function(xml) {
			var portTemp = xml.getElementsByTagName("nomValues")[0].textContent;
			portfolios = portTemp.split(";");
			for (var i = 0; i < portfolios.length; i++) {
				configForm.getCombo("portfolio").addOption([
					[portfolios[i],portfolios[i]]
				])
      }
			loading(false);
		},
		"getListItemsWithNom",
		"<ers:getListItemsWithNom><token>" + token + "</token><listName>Portfolios</listName></ers:getListItemsWithNom>",
	);
	soapCall(
		function(xml) {
			scenarios = xml.getElementsByTagName("nomValues")[0].textContent;
		},
		"getListItemsWithNom",
		"<ers:getListItemsWithNom><token>" + token + "</token><listName>Scenarios</listName></ers:getListItemsWithNom>",
	);
}

function beginPortfolio(load) {
	if (actionMode) {
		soapCall(
			function(xml) {
				$("#loading-text").text("Loading portfolio: " + configForm.getItemValue("portfolio"));
				actionMode = false;
				startPortfolio();
			},
			"endActionMode",
			"<ers:endActionMode><token>" + token + "</token></ers:endActionMode>",
		)
	} else startPortfolio();
	function startPortfolio() {
		var port = "";
		if (load)
			port = loadCombo.getSelectedValue()[2];
		else
			port = configForm.getItemValue("portfolio");
		if (!actionMode) {
			soapCall(
				function(xml) {
					soapCall(
						function(xml) {
							actionMode = true;
							loading(true);
							$("#loading-text").text("Loading portfolio: " + port);
							checkStatus(load);
							configForm.getCombo("portfolio").selectOption(configForm.getCombo("portfolio").getIndexByValue(port));
							portfolio = port;
							configForm.enableItem("cube");
						},
						'startActionAsync',
						'<ers:startActionAsync>\
							<token>' + token + '</token>\
							<scenarioID>Standard</scenarioID>\
							<outputType>Standard</outputType>\
							<analysisDate>' + dateISO() + '</analysisDate>\
							<analyses>\
								<name>Recalc</name>\
							</analyses>\
						</ers:startActionAsync>',
					)
				},
				"beginActionMode",
				"<ers:beginActionMode>" +
					"<token>" + token + "</token>" +
					"<positionSelectorType>" + "Portfolio" + "</positionSelectorType>" +
					"<selectorID>" + port + "</selectorID>" +
				"</ers:beginActionMode>",
			)
		}
	}
}

function checkStatus(load) {
	soapCall(
		function(xml) {
			var statusCode = "NOK";
			try {
  			statusCode = xml.getElementsByTagName("return")[0].getElementsByTagName("statusCode")[0].textContent;
				if (statusCode == "IDLE") {
					return;
				} if (statusCode == "ANOTHER_ACTION_IN_PROCESS") {
					alert("Another action is in process.");
				} if (statusCode == "IDLE_IN_ACTION_MODE") {
					if (load)
						getColumns(load);
					loading(false);
				} else {
					checkStatus(load);
				}
			} catch(e) {
				endActionMode();
			}
		},
  	"getCurrentStatus",
  	"<ers:getCurrentStatus><token>" + token + "</token></ers:getCurrentStatus>",
 	);
}

function getCubes() {
	soapCall(
		function(xml) {
			var namesTemp = xml.getElementsByTagName("names")
			var names = [];
			for (i = 0; i < namesTemp.length; i++) {
				names.push(namesTemp[i].textContent);
				configForm.getCombo("cube").addOption([
					[names[i],names[i]]
				])
			}
		},
		"getOLAPCubes",
		'<ers:getOLAPCubes><token>' + token + '</token></ers:getOLAPCubes>'
	)
}

function getColumns(load) {
	var cube = "";
	if (load)
		cube = loadCombo.getSelectedValue()[3]
	else
		cube = configForm.getItemValue("cube");
	configForm.getCombo("cube").selectOption(configForm.getCombo("cube").getIndexByValue(cube));
	soapCall(
		function(xml) {
			treeForm2.item = [];
			var columnsTemp = xml.getElementsByTagName("columnNames");
			var columnsValTemp = xml.getElementsByTagName("columnDBnames");
			var columnsTypesTemp = xml.getElementsByTagName("columnTypes");
			var columns = [];
			var columnsVal = [];
			var columnsTypes = [];
			for (var i = 0; i < columnsTemp.length; i++) {
				columns.push(columnsTemp[i].textContent);
				columnsVal.push(columnsValTemp[i].textContent);
				columnsTypes.push(columnsTypesTemp[i].textContent);
				treeForm2.item.push({id:i+1,text:columns[i],value:columnsVal[i], type:columnsTypes[i]});
			}
			$("#filters").empty();
			createTree2.deleteChildItems(0);
			createTree2.parse(treeForm2,"json");
			cube = configForm.getItemValue("cube");
			var tree = createTree2.getAllLeafs().split(",");
			var combo = [];
			for (var i = 1; i <= tree.length; i++) {
				$("#filters").append('<div id="filter' + i + '" class="filter"></div>');
				combo[i] = new dhtmlXCombo("filter" + i,"filter" + i,"200px","checkbox");
				//combo[i].selectOption(0);
				combo[i].allowFreeText(false);
				combo[i].setPlaceholder("Filters for: " + columnsVal[i-1]);
				combo[i].disable();
				addFilterData(i, columnsVal[i-1]);
				combo[i].attachEvent("onCheck", function(value, state){
					if (value == "Select all"){
						var currCombo = this;
						this.forEachOption(function(optId){
							if (optId.value == "Select all" || optId.value == "Unselect all"){
								currCombo.setChecked(optId.index, false);
							}
							else{
								currCombo.setChecked(optId.index, true);
							}
						});
					} else if (value == "Unselect all"){
						var currCombo = this;
						this.forEachOption(function(optId){
							currCombo.setChecked(optId.index, false);
						});
					}
				});
				combo[i].attachEvent("onSelectionChange", function(){
					this.unSelectOption();
					this.openSelect();
				});
			}
			filter = combo;
			if (load) {
				setTimeout(function() {
					doCharts(load);
				}, 1000);
			}
		},
		'getCubeMetaData',
		'<ers:getCubeMetaData>' +
			 '<token>' + token + '</token>' +
			 '<cubeName>' + cube + '</cubeName>' +
		'</ers:getCubeMetaData>'
	)
}

function getColumnData(id) {
	var columnsID = createTree2.getAllChecked().split(',');
	var view = createTree1.getAllChecked();
	var columns = [];
	var columnsStr = "";
	var filtersStr = "";
	var dataset = [];
	var values = "(";
	var filtersTemp = {};
	var filtersSave = [];
	var tempValues = [];
	for (i = 0; i < columnsID.length; i++) {
		columns.push(createTree2.getAttribute(columnsID[i], "value"));
		columnsStr += "<columns>" + columns[i] + "</columns>";
		if (filter[columnsID[i]].getChecked().join()) {
			values += filter[columnsID[i]].getChecked().join("|") + ")";
			filtersStr += "<filter><name>" + columns[i] + "</name><value>" + values + "</value></filter>";
			values = "(";
			filtersTemp.values = [];
			filtersTemp.id = columnsID[i];
			tempValues = filter[columnsID[i]].getChecked();
			for (j = 0; j < tempValues.length; j++)
				filtersTemp.values.push(filter[columnsID[i]].getOption(tempValues[j]).index);
			filtersSave.push(filtersTemp);
			filtersTemp = {};
		}
	}
	soapCall(
		function(xml) {
			var rowsTemp = xml.getElementsByTagName("rows");
			var data = {};
			for (i = 0; i < rowsTemp.length; i++) {
				for (j = 0; j < columnsID.length; j++) {
					var name = createTree2.getAttribute(columnsID[j], "value");
					var value = rowsTemp[i].getElementsByTagName("cols")[j].textContent;
					data[name] = value;
				}
				dataset.push(data);
				data = {};
			}
			var equalP = view.localeCompare("pivot");
			var equalG = view.localeCompare("grid");
			if (id >= 0 && equalP == 0)
				savePivot(columnsID, dataset, id, columns, filtersSave);
			else if (id >= 0 && equalG == 0)
				saveGrid(columnsID, dataset, id, filtersSave);
			else if (id >= 0)
				save(view, columnsID, dataset, id, filtersSave);
			else
				create(view, columnsID, dataset, columns, filtersSave);
		},
		'getCubeDataByColumnsAndFilteredr',
		'<ers:getCubeDataByColumnsAndFiltered>' +
			'<token>' + token + '</token>' +
			'<cubeName>' + configForm.getItemValue("cube") + '</cubeName>' +
			columnsStr + filtersStr +
			"<distinct>true</distinct>" +
		'</ers:getCubeDataByColumnsAndFiltered>'
	)
}

function addFilterData(colID, colName) {
	soapCall(
		function(xml) {
			var rows = xml.getElementsByTagName("rows");
			var data = [];
			filter[colID].addOption([
				["Select all", "Select all"],
				["Unselect all", "Unselect all"]
			])
			for (i = 0; i < rows.length; i++) {
				data.push(rows[i].getElementsByTagName("cols")[0].textContent);
				filter[colID].addOption([
					[data[i], data[i]]
				])
			}
		},
		"getCubeDataByColumns",
		"<ers:getCubeDataByColumns>" +
			'<token>' + token + '</token>' +
			'<cubeName>' + configForm.getItemValue("cube") + '</cubeName>' +
			'<columns>' + colName + '</columns>' +
			'<distinct>true</distinct>' +
		'</ers:getCubeDataByColumns>'
	)
}

function getDashboards() {
	if (actionMode) {
		soapCall(
			function(xml) {
				actionMode = false;
				getDashboardsA();
			},
			"endActionMode",
			"<ers:endActionMode><token>" + token + "</token></ers:endActionMode>",
		)
	} else getDashboardsA();

function getDashboardsA() {
		if (actionMode)
			return
		soapCall(
			function(xml) {
				checkStatus();
			},
			'startResultsBuildAsync',
			'<ers:startResultsBuildAsync>' +
			'<token>' + token + '</token>' +
			'<tableName>DASHBOARD_DEF</tableName>' +
			'<selectParams>' +
				'<name>DASH_USER</name>' +
				'<value>' + userName + '</value>' +
			'</selectParams>' +
		 '</ers:startResultsBuildAsync>'
	 )
	}

 function checkStatus() {
	 soapCall(
		 function(xml) {
			 var statusCode = 'NOK';
			 statusCode = xml.getElementsByTagName("return")[0].getElementsByTagName("statusCode")[0].textContent;
			 if (statusCode == "IDLE") {
				 importData();
			 } else {
				 checkStatus();
			 }
		 },
		 'getCurrentStatus',
		 '<ers:getCurrentStatus><token>' + token + '</token></ers:getCurrentStatus>',
	 );
 }

 function importData() {
	 soapCall(
 		function(xml) {
			var data = Base64.decode(xml.getElementsByTagName("return")[0].getElementsByTagName("data")[0].textContent).replace(/\n/g, '');
			var dataArray = [];
			var dataArrayTemp = data.split("|");
			var dataArrayTemp2 = [];
			for (i = 0; i < dataArrayTemp.length; i++) {
				if (i % 5 == 0 && i != 0) {
					dataArrayTemp2.push(dataArrayTemp[i-5], dataArrayTemp[i-4], dataArrayTemp[i-3], dataArrayTemp[i-2], dataArrayTemp[i-1]);
					dataArray.push(dataArrayTemp2);
					dataArrayTemp2 = [];
				}
			}
			for (i = 0; i < dataArray.length; i++) {
				loadCombo.addOption([
				    [dataArray[i],dataArray[i][0]],
				]);
			}
 		},
 		'getCurrentResultsWithColDef',
 		'<ers:getCurrentResultsWithColDef><token>' + token + '</token></ers:getCurrentResultsWithColDef>',
 	);
 }
}

function getDashboardConfig() {
	if (actionMode) {
		soapCall(
			function(xml) {
				actionMode = false;
				getData();
			},
			"endActionMode",
			"<ers:endActionMode><token>" + token + "</token></ers:endActionMode>",
		)
	} else getData();

function getData() {
		soapCall(
			function(xml) {
				checkStatus();
			},
			'startResultsBuildAsync',
			'<ers:startResultsBuildAsync>' +
			'<token>' + token + '</token>' +
			'<tableName>DASHBOARD_CHARTS</tableName>' +
			'<selectParams>' +
				'<name>DASH_ID_PAR</name>' +
				'<value>' + loadCombo.getSelected()[0] + '</value>' +
			'</selectParams>' +
		 '</ers:startResultsBuildAsync>'
	 )
	}

	function checkStatus() {
	 soapCall(
		 function(xml) {
			 var statusCode = 'NOK';
			 statusCode = xml.getElementsByTagName("return")[0].getElementsByTagName("statusCode")[0].textContent;
			 if (statusCode == "IDLE") {
				 importData();
			 } else {
				 checkStatus();
			 }
		 },
		 'getCurrentStatus',
		 '<ers:getCurrentStatus><token>' + token + '</token></ers:getCurrentStatus>',
	 );
	}

 function importData() {
	 soapCall(
		function(xml) {
			var data = Base64.decode(xml.getElementsByTagName("return")[0].getElementsByTagName("data")[0].textContent).replace(/\n/g, '');
			var dataArray = [];
			var dataArrayTemp = data.split("|");
			var dataArrayTemp2 = [];
			for (i = 0; i < dataArrayTemp.length; i++) {
				if (i % 18 == 0 && i != 0) {
					dataArrayTemp2.push(dataArrayTemp[i-18], dataArrayTemp[i-17], dataArrayTemp[i-16], dataArrayTemp[i-15], dataArrayTemp[i-14],
					dataArrayTemp[i-13], dataArrayTemp[i-12], dataArrayTemp[i-11], dataArrayTemp[i-10], dataArrayTemp[i-9], dataArrayTemp[i-8],
					dataArrayTemp[i-7],	dataArrayTemp[i-6], dataArrayTemp[i-5], dataArrayTemp[i-4], dataArrayTemp[i-3], dataArrayTemp[i-2], dataArrayTemp[i-1]);
					dataArray.push(dataArrayTemp2);
					dataArrayTemp2 = [];
				}
			}
			dataArray.length
			beginPortfolio(dataArray);
		},
		'getCurrentResultsWithColDef',
		'<ers:getCurrentResultsWithColDef><token>' + token + '</token></ers:getCurrentResultsWithColDef>',
	);
 }
}

function doCharts(load) {
	var dataArray = load;
	var id, dashID, cols, dataCombo, labelCombo, groupCombo, groupFuncCombo,
	check, filters, view, pos, size, title, columns, columnsStr, filtersStr,
	filtersTemp, filtersSave, tempValues, values, comboData, fields;
	console.log(dataArray);
	for (i = 0; i < dataArray.length; i++) {
		id = dataArray[i][0];
		dashID = dataArray[i][1];
		cols = dataArray[i][2].split(",");
		if (dataArray[i][5] == 'pivot') {
			fields = dataArray[i][3];
			filters = JSON.parse(dataArray[i][4].replace(/\./g,','));
			view = dataArray[i][5];
			pos = dataArray[i][6];
			size = dataArray[i][7];
			title = dataArray[i][8];
			fontfam = dataArray[i][9];
			fontstyle = dataArray[i][10];
			fontsize = dataArray[i][11];
		} else if (dataArray[i][4] == "grid") {
			filters = JSON.parse(dataArray[i][3].replace(/\./g,','));
			view = dataArray[i][4];
			pos = dataArray[i][5];
			size = dataArray[i][6];
			title = dataArray[i][7];
			fontfam = dataArray[i][8];
			fontstyle = dataArray[i][9];
			fontsize = dataArray[i][10];
		} else {
			dataCombo = dataArray[i][3];
			labelCombo = dataArray[i][4];
			groupCombo = dataArray[i][5];
			groupFuncCombo = dataArray[i][6];
			check = dataArray[i][7];
			filters = JSON.parse(dataArray[i][8]);
			view = dataArray[i][9];
			pos = dataArray[i][10];
			size = dataArray[i][11];
			title = dataArray[i][12];
			colors = dataArray[i][13];
			series = dataArray[i][14];
			fontfam = dataArray[i][15];
			fontstyle = dataArray[i][16];
			fontsize = dataArray[i][17];
		}
		$('#chartTitleInput').val(title);
		columns = [];
		columnsStr = "";
		filtersStr = "";
		filtersTemp = {};
		filtersSave = [];
		tempValues = [];
		values = "";
		comboData = {};
		function toArray(obj) {
			var arr = [];
			for (var x in obj) if (obj.hasOwnProperty(x)) {
				arr.push(obj[x]);
			}
			return arr;
		}
		createTree1.setCheck(view,true);
		var checked = createTree2.getAllChecked().split(",")
		for (var j = 0; j < checked.length; j++) {
			createTree2.setCheck(checked[j],false);
		}
		var filterValues = [];
		/*for (j = 1; j < filter.length; j++) {
	    for (k = 0; k < filter[j].getOptionsCount(); k++) {
	      filter[j].setChecked(k, false);
	    }
	    filter[j].disable();
	    filter[j].unSelectOption();
	  }*/
		for (j = 0; j < filters.length; j++) {
			var Fvalues = toArray(filters[j].values);
			filterValues.push(Fvalues);
			for (k = 0; k < filterValues[j].length; k++) {
				filter[filters[j].id].setChecked(filterValues[j][k], true);
			}
		}
		chartDataCombo.clearAll();
		chartLabelCombo.clearAll();
		chartGroupCombo.clearAll();
		for (j = 0; j < cols.length; j++) {
			createTree2.setCheck(cols[j],true);
			var type = createTree2.getAttribute(cols[j], "type");
			var name = createTree2.getAttribute(cols[j], "text");
			var val = createTree2.getAttribute(cols[j], "value");
			if (type.indexOf('number') >= 0) {
				chartDataCombo.addOption([
					[val,name]
				])
			} else if (type.indexOf('varchar') || type.indexOf('date')) {
				chartLabelCombo.addOption([
					[val,name]
				])
				chartGroupCombo.addOption([
					[val,name]
				])
			}
			filter[cols[j]].enable();
			removeFiltersForNumberCols(cols[j]);
			columns.push(createTree2.getAttribute(cols[j], "value"));
			columnsStr += "<columns>" + columns[j] + "</columns>";
			console.log(filter[cols[j]].getChecked().join())
			if (filter[cols[j]].getChecked().join()) {
				values += "(" + filter[cols[j]].getChecked().join("|") + ")";
				filtersStr += "<filter><name>" + columns[j] + "</name><value>" + values + "</value></filter>";
				values = "";
				filtersTemp.values = [];
				filtersTemp.id = cols[j];
				tempValues = filter[cols[j]].getChecked();
				for (k = 0; k < tempValues.length; k++)
					filtersTemp.values.push(filter[cols[j]].getOption(tempValues[k]).index);
				filtersSave.push(filtersTemp);
				filtersTemp = {};
			}
		}
		comboData.len = dataArray.length-1;
		comboData.custFontFam = fontfam;
		comboData.custFontStyle = fontstyle;
		comboData.custFontSize = fontsize;
		if (view != 'pivot' && view != "grid") {
			comboData.data = chartDataCombo.getOptionByIndex(dataCombo).value;
			comboData.label = chartLabelCombo.getOptionByIndex(labelCombo).value;
			comboData.group = chartGroupCombo.getOptionByIndex(groupCombo).value;
			comboData.func = chartGroupFuncCombo.getOptionByIndex(groupFuncCombo).value;
			comboData.title = title;
			comboData.dataExt = series.split(",");
			comboData.check = check;
			comboData.pos = pos.split(",");
			comboData.size = size.split(",");
			comboData.colors = colors.split(",");
		} else {
			comboData.pos = pos.split(",");
			comboData.size = size.split(",");
			comboData.title = title;
		}
		if (view == 'pivot') {
			comboData.fields = fields;
		}
		loadChart(view, cols, dataset, columns, filtersSave, filtersStr, columnsStr, comboData)
	}
}

function loadChart(view, cols, dataset, columns, filtersSave, filtersStr, columnsStr, comboData) {
	console.log(filtersStr);
	$("#loading-text").text("Loading dashboard")
	loading(true);
	soapCall(
		function(xml) {
			var dataset = [];
			var rowsTemp = xml.getElementsByTagName("rows");
			var data = {};
			for (j = 0; j < rowsTemp.length; j++) {
				for (k = 0; k < cols.length; k++) {
					var name = createTree2.getAttribute(cols[k], "value");
					var value = rowsTemp[j].getElementsByTagName("cols")[k].textContent;
					data[name] = value;
				}
				dataset.push(data);
				data = {};
			}
			create(view, cols, dataset, columns, filtersSave, comboData);
			dataset = [];
		},
		'getCubeDataByColumnsAndFiltered',
		'<ers:getCubeDataByColumnsAndFiltered>' +
			'<token>' + token + '</token>' +
			'<cubeName>' + configForm.getItemValue("cube") + '</cubeName>' +
			columnsStr + filtersStr +
			"<distinct>true</distinct>" +
		'</ers:getCubeDataByColumnsAndFiltered>'
	)
}

function getDashboardData() {
	var options = [];
	loadCombo.forEachOption(function(id) {
		options.push(id.value[0]);
	})
	if (!(options.includes($("#saveDashboard").val())))
		newDashboard();
	else
		if (confirm("Are you sure you want to overwrite this dashboard?"))
			deleteDashboard();
}

function deleteDashboard(){
	soapCall(
		function(xml) {
			deleteDashboardCharts();
		},
		'deleteData',
		'<ers:deleteData>' +
		'<token>' + token + '</token>' +
		'<tableName>DASHBOARD_DEF</tableName>' +
		'<dataId>' + $("#saveDashboard").val() + '</dataId>' +
		'</ers:deleteData>'
	)
}

function deleteDashboardCharts(){
	soapCall(
		function(xml) {
			if(!isDeletingOnly)
				newDashboard();
			else
				isDeletingOnly = false;
		},
		'deleteData',
		'<ers:deleteData>' +
		'<token>' + token + '</token>' +
		'<tableName>DASHBOARD_CHARTS</tableName>' +
		'<dataId>' + $("#saveDashboard").val() + '</dataId>' +
		'</ers:deleteData>'
	)
}

function newDashboard() {
	var dash = $("#saveDashboard").val() + "|" + userName + "|" + configForm.getItemValue("portfolio") + "|" +
	configForm.getItemValue("cube") + "|" + configForm.getCalendar("date").getFormatedDate("%d.%m.%Y");
	soapCall(
		function(xml) {
			saveDashboard();
		},
		'insertData',
		'<ers:insertData>' +
		'<token>' + token + '</token>' +
		'<tableName>DASHBOARD_DEF</tableName>' +
		'<data>' + dash + '</data>' +
		'</ers:insertData>'
	)
}

function saveDashboard() {
	for (i = 0; i < chart.length; i++) {
		if (chart[i]) {
			var name = chart[i].config.name;
			if (!name)
				name = " "
			var data = $("#saveDashboard").val() + "-chart-" + i + "|" + $("#saveDashboard").val() + "|" +
			chart[i].config.columns.join(",") + "|" + chart[i].config.dataCombo + "|" + chart[i].config.labelCombo + "|" +
			chart[i].config.groupCombo + "|" + chart[i].config.groupFuncCombo + "|" + chart[i].config.check + "|" +
			JSON.stringify(chart[i].config.filters) + "|" + chart[i].config.view + "|" + $("#chart" + i).position().top + "," + $("#chart" + i).position().left + "|" +
			chart[i].$view.clientHeight + "," + chart[i].$view.clientWidth + "|" + name + " " + "|" + chart[i].chartColors.toString() + "|" +  chart[i].config.dataComboExt +
			"|" + chart[i].custFontFam + "|" + chart[i].custFontStyle + "|" + chart[i].custFontSize;
			soapCall(
				function(xml) {
				},
				'insertData',
				'<ers:insertData>' +
				'<token>' + token + '</token>' +
				'<tableName>DASHBOARD_CHARTS</tableName>' +
				'<data>' + data + '</data>' +
				'</ers:insertData>'
			)
		}
	}
	for (i = 0; i < table.length; i++) {
		if (table[i]) {
			var name = table[i].name;
			if (!name)
				name = " "
			if (table[i].view == "pivot") {
				var saveFields = "";
				if (typeof table[i].fields == "string") {
					saveFields = table[i].fields
				} else {
					saveFields = JSON.stringify(table[i].fields);
				}
				var data = $("#saveDashboard").val() + "-table-" + i + "|" + $("#saveDashboard").val() + "|" +
				table[i].columns.join(",") + "|" + saveFields + "|" + JSON.stringify(table[i].filters) + "|" +
				table[i].view + "|" + $("#" + table[i].div).position().top + "," + $("#" + table[i].div).position().left + "|" +
				$("#" + table[i].div).height() + "," + $("#" + table[i].div).width() + "|" + name +
				"|" + table[i].pivot.custFontFam + "|" + table[i].pivot.custFontStyle + "|" + table[i].pivot.custFontSize;
			} else {
				var data = $("#saveDashboard").val() + "-table-" + i + "|" + $("#saveDashboard").val() + "|" +
				table[i].columns.join(",") + "|" + JSON.stringify(table[i].filters) + "|" +
				table[i].view + "|" + $("#" + table[i].div).position().top + "," + $("#" + table[i].div).position().left + "|" +
				$("#" + table[i].div).height() + "," + $("#" + table[i].div).width() + "|" + name +
				"|" + table[i].grid.custFontFam + "|" + table[i].grid.custFontStyle + "|" + table[i].grid.custFontSize;
			}
			soapCall(
				function(xml) {
				},
				'insertData',
				'<ers:insertData>' +
				'<token>' + token + '</token>' +
				'<tableName>DASHBOARD_CHARTS</tableName>' +
				'<data>' + data + '</data>' +
				'</ers:insertData>'
			)
		}
	}
}

var Base64 = {
	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	encode: function(input) {
		var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    input = Base64._utf8_encode(input);
    while (i < input.length) {
			chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
      	enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    },
	decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }
}
