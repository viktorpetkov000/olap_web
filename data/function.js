var shouldCancel = false;
var names = [];
var dataset = [];
var datasetL = [];
var divID = "";
var loadcounter = 0;

function create(view, colId, datasetF, namesF, filtersF, comboData) {
  names = [];
  dataset = [];
  fields = {};
  if ($("#dashboard .ui-widget-content:last").position()) {
    var topPos = $("#dashboard .ui-widget-content:last").position().top;
    var leftPos = $("#dashboard .ui-widget-content:last").position().left;
    var width = $("#dashboard .ui-widget-content:last").width();
    var height = $("#dashboard .ui-widget-content:last").height();
  }
  // Pivot tables
  if (view == 'pivot') {
    if (server) {
      var name = {};
      for (i = 0; i < namesF.length; i++) {
      	name.id = namesF[i];
      	name.label = namesF[i];
      //  name.template = function (text, obj) { return '<span class="headersCustomClass">' + text + '</span>' };
      	names.push(name);
      	name = {};
      }
    }
    if (!server) {
      datasetL = encodeURIComponent(JSON.stringify(datasetF));
      namesF = encodeURIComponent(namesF);
    }
    var tableID = table.length;
    var newTable = "table" + (table.length+1);
    if (comboData)
      var name = comboData.title;
    else
      var name = $('#chartTitleInput').val();
    table.push({});
    var idx = table.length-1;
    table[idx].dataset = datasetF;
    table[idx].names = names;
    table[idx].columns = colId;
    table[idx].filters = filtersF;
    table[idx].id = tableID
    table[idx].div = newTable;
    table[idx].name = name;
    table[idx].view = view;
    table[idx].pivot = {};
    if (comboData)
      table[idx].fields = comboData.fields;
    else
      table[idx].fields = null;
    $("#dashboard").append('\
    <div id="'+ newTable + '" class="ui-widget-content table">\
      <div id="drag-' + newTable + '" class="drag"></div>\
      <iframe name="pivot-' + newTable + '" class="ui-widget-content" src="data/pivot.html?server=' + server + '&dataset=' + datasetL + '&id=' + namesF +
      '&idx=' + tableID + '&fields=' + encodeURIComponent(table[idx].fields) + '" frameborder="no"></iframe>\
    </div>');
    $("#" + newTable).insertBefore("#add");
    $("#" + newTable).draggable({
      containment: $(".dhx_cell_cont_tabbar"),
      handle:'#drag-' + newTable,
      start: function(event, ui) {
        $('.dhx_chart, .table').not(this).css('z-index', '100');
        $(this).css('z-index', '1000');
        $('.dhx_chart, .table').css('pointer-events','none');
      },
      stop: function(event, ui) {
        $('.dhx_chart, .table').css('pointer-events','auto');
      },
      revert: function(){
        if (shouldCancel) {
          shouldCancel = false;
          return true;
        } else {
          return false;
        }
      }
    });
    $('.dhx_chart, .table').droppable({
      over: function(){
        shouldCancel = true;
      },
      out: function(){
        shouldCancel = false;
      }
    });
    $("#" + newTable).resizable({
      start: function(event, ui) {
        $('.dhx_chart, .table').css('pointer-events','none');
      },
      stop: function(event, ui) {
        $('.dhx_chart, .table').css('pointer-events','auto');
      }
    });
    $("#drag-" + newTable).append('<span class="delete">Delete</span><span class="edit">Edit</span><span class="prop">Properties</span><span class="exp">Export to Excel</span>');
    $("#drag-" + newTable).append('<span class="tableTitle">' + name + '</span>');
    $('#drag-' + newTable).on('click', '.exp', function() {
      table[idx].pivot.export({
        url: "//export.dhtmlx.com/excel"
      });
    });
	$('#drag-' + newTable).on('click', '.prop', function() {
		// init windows
		w1 = win.createWindow("w1", 10, 10, 410, 240);
		w1.setText("Properties");
		w1.denyResize();
		w1.denyPark();
		w1.button("park").hide();
		w1.button("help").hide();
		w1.setModal(true);
		w1.center();

		fontForm = w1.attachForm(formData);

		// change select size
		for (var a in {sel_font:1,sel_type:1,sel_size:1}) fontForm.getSelect(a).size = 7;

		// select stored style
		fontForm.setItemValue("sel_font", table[idx].pivot.custFontFam);
		fontForm.setItemValue("sel_type", table[idx].pivot.custFontStyle);
		fontForm.setItemValue("sel_size", table[idx].pivot.custFontSize);

		// Attach events to buttons
		fontForm.attachEvent("onButtonClick", function(name){
			if(name == "btnCanc")
				w1.close();
			else if(name == "btnConf"){
				table[idx].pivot.custFontFam = this.getItemValue("sel_font");
				table[idx].pivot.custFontStyle = this.getItemValue("sel_type");
				table[idx].pivot.custFontSize = this.getItemValue("sel_size");
        if (server)
				  table[idx].pivot.setFont();
				w1.close();
			}
		});
    });
    $('#drag-' + newTable).on('click', '.edit', function() {
      editTable(tableID);
    });
    $('#drag-' + newTable).on('click', '.delete', function() {
      removeTable(tableID);
    });
    var iwindow = frames['pivot-' + newTable];
    if (comboData) {
      table[idx].pivot.custFontFam = comboData.custFontFam;
      table[idx].pivot.custFontStyle = comboData.custFontStyle;
      table[idx].pivot.custFontSize = comboData.custFontSize;
      updateFonts(comboData.custFontFam, comboData.custFontStyle, comboData.custFontSize, iwindow);
    } else {
      table[idx].pivot.custFontFam = '"Roboto", sans-serif';
      table[idx].pivot.custFontStyle = 'normal';
      table[idx].pivot.custFontSize = '14';
      updateFonts(table[idx].pivot.custFontFam, table[idx].pivot.custFontStyle, table[idx].pivot.custFontSize, iwindow);
    }
    noOverlap();
    createWin.close();
    $('#chartTitleInput').val("");
    if (comboData) {
      $("#" + newTable).css("top",parseFloat(comboData.pos[0]));
      $("#" + newTable).css("left",parseFloat(comboData.pos[1]));
      $("#" + newTable).height(parseFloat(comboData.size[0]));
      $("#" + newTable).width(parseFloat(comboData.size[1]));
    }
    if (!comboData) {
      if (topPos) {
        if (leftPos+10 + width + $("#dashboard .ui-widget-content:last").width() > $("#dashboard").width())
          $("#dashboard .ui-widget-content:last").css("top", topPos+10 + height);
        else {
          $("#dashboard .ui-widget-content:last").css("top", topPos);
          $("#dashboard .ui-widget-content:last").css("left", leftPos+10 + width);
        }
      }
    }
    if (comboData) {
      if (loadcounter == comboData.len) {
        loading(false);
        loadcounter = 0;
      }
      else
        loadcounter++;
    } else
      loading(false);
    return;
  }

  if (view == "grid") {
    var tableID = table.length;
    var newTable = "table" + (table.length+1);
    if (comboData)
      var name = comboData.title;
    else
      var name = $('#chartTitleInput').val();
    table.push({});
    var idx = table.length-1;
    var colNames = [];
    var colTypes = [];
    var dataObj = [];
    var gridData = [];
    var getCols = [];
    var colResize = [];
    table[idx].columns = colId;
    table[idx].filters = filtersF;
    table[idx].id = tableID
    table[idx].div = newTable;
    table[idx].name = name;
    table[idx].view = view;
    for (i = 0; i < colId.length; i++) {
      colNames.push(createTree2.getAttribute(colId[i], "text"));
      getCols.push(createTree2.getAttribute(colId[i], "value"));
	  var type = createTree2.getAttribute(colId[i], "type");
	  if (type.indexOf('number') >= 0)
		 colTypes.push("ron");
	  else
		colTypes.push("ro");
      colResize.push("false");
    }
    for (i = 0; i < datasetF.length; i++) {
      for (j = 0; j < colId.length; j++) {
        gridData.push(datasetF[i][getCols[j]]);
      }
      dataObj.push(gridData);
      gridData = [];
    }
    $("#dashboard").append('\
    <div id="'+ newTable + '" class="ui-widget-content table">\
      <div id="drag-' + newTable + '" class="drag"></div>\
      <div id="grid-' + newTable + '"></div>\
    </div>');
    table[idx].grid = new dhtmlXGridObject('grid-' + newTable);
    table[idx].grid.setHeader(colNames.join(","));
    table[idx].grid.setColTypes(colTypes.join(","));
    table[idx].grid.enableResizing(colResize.join(","));
	for (var i = 0; i<colId.length; i++) {
	  table[idx].grid.setNumberFormat("0.00",i);
	}
    $("#" + newTable).draggable({
      containment: $(".dhx_cell_cont_tabbar"),
      handle:'#drag-' + newTable,
      start: function(event, ui) {
        $('.dhx_chart, .table').not(this).css('z-index', '100');
        $(this).css('z-index', '1000');
        $('.dhx_chart, .table').css('pointer-events','none');
      },
      stop: function(event, ui) {
        $('.dhx_chart, .table').css('pointer-events','auto');
      },
      revert: function(){
        if (shouldCancel) {
          shouldCancel = false;
          return true;
        } else {
          return false;
        }
      }
    });
    $('.dhx_chart, .table').droppable({
      over: function(){
        shouldCancel = true;
      },
      out: function(){
        shouldCancel = false;
      }
    });
    $("#" + newTable).resizable({
      start: function(event, ui) {
        $('.dhx_chart, .table').css('pointer-events','none');
        $("#" + newTable + " .gridbox").css('height', 0);
        $("#" + newTable + " .gridbox").css('width', 0);
        $("#" + newTable + " .objbox").css('height', 0);
        $("#" + newTable + " .objbox").css('width', 0);
      },
      stop: function(event, ui) {
        $('.dhx_chart, .table').css('pointer-events','auto');
        $("#" + newTable + " .gridbox").css('height', $("#" + newTable).height()-21);
        $("#" + newTable + " .gridbox").css('width', $("#" + newTable).width());
        $("#" + newTable + " .objbox").css('height', $("#" + newTable).height()-68);
        $("#" + newTable + " .objbox").css('width', $("#" + newTable).width());
      }
    });
    $("#drag-" + newTable).append('<span class="delete">Delete</span><span class="edit">Edit</span><span class="prop">Properties</span><span class="exp">Export to Excel</span>');
    $("#drag-" + newTable).append('<span class="tableTitle">' + name + '</span>');
  	$('#drag-' + newTable).on('click', '.exp', function() {
      table[tableID].grid.toExcel('http://dhtmlxgrid.appspot.com/export/excel');
    });
	$('#drag-' + newTable).on('click', '.prop', function() {
		// init windows
		w1 = win.createWindow("w1", 10, 10, 410, 240);
		w1.setText("Properties");
		w1.denyResize();
		w1.denyPark();
		w1.button("park").hide();
		w1.button("help").hide();
		w1.setModal(true);
		w1.center();

		fontForm = w1.attachForm(formData);

		// change select size
		for (var a in {sel_font:1,sel_type:1,sel_size:1}) fontForm.getSelect(a).size = 7;

		// select stored style
		fontForm.setItemValue("sel_font", table[idx].grid.custFontFam);
		fontForm.setItemValue("sel_type", table[idx].grid.custFontStyle);
		fontForm.setItemValue("sel_size", table[idx].grid.custFontSize);

		// Attach events to buttons
		fontForm.attachEvent("onButtonClick", function(name){
			if(name == "btnCanc")
				w1.close();
			else if(name == "btnConf"){
				table[idx].grid.custFontFam = this.getItemValue("sel_font");
				table[idx].grid.custFontStyle = this.getItemValue("sel_type");
				table[idx].grid.custFontSize = this.getItemValue("sel_size");
				var gridTableIdx = (parseInt(idx)+1).toString();
				$('#grid-table' + gridTableIdx).find('td').css("font-family", table[idx].grid.custFontFam);
				$('#grid-table' + gridTableIdx).find('td').css("font-weight", "normal");
				$('#grid-table' + gridTableIdx).find('td').css("font-style", "normal");
				$('#grid-table' + gridTableIdx).find('td').css("font-size", table[idx].grid.custFontSize + "px");
				if(table[idx].grid.custFontStyle == "bold" || table[idx].grid.custFontStyle=="bold-italic")
					$('#grid-table' + gridTableIdx).find('td').css("font-weight", "bold");
				if(table[idx].grid.custFontStyle == "italic" || table[idx].grid.custFontStyle == "bold-italic")
					$('#grid-table' + gridTableIdx).find('td').css("font-style", "italic");
				w1.close();
			}
		});
    });
    $('#drag-' + newTable).on('click', '.edit', function() {
      editTable(tableID);
    });
    $('#drag-' + newTable).on('click', '.delete', function() {
      removeTable(tableID);
    });
    table[idx].grid.init();
    table[idx].grid.clearAll();
    table[idx].grid.parse(dataObj,"jsarray");
	if (comboData) {
      table[idx].grid.custFontFam = comboData.custFontFam;
	  table[idx].grid.custFontStyle = comboData.custFontStyle;
      table[idx].grid.custFontSize = comboData.custFontSize;
      var gridTableIdx = (parseInt(idx)+1).toString();
      $('#grid-table' + gridTableIdx).find('td').css("font-family", table[idx].grid.custFontFam);
      $('#grid-table' + gridTableIdx).find('td').css("font-weight", "normal");
      $('#grid-table' + gridTableIdx).find('td').css("font-style", "normal");
      $('#grid-table' + gridTableIdx).find('td').css("font-size", table[idx].grid.custFontSize + "px");
      if(table[idx].grid.custFontStyle == "bold" || table[idx].grid.custFontStyle=="bold-italic")
        $('#grid-table' + gridTableIdx).find('td').css("font-weight", "bold");
      if(table[idx].grid.custFontStyle == "italic" || table[idx].grid.custFontStyle == "bold-italic")
        $('#grid-table' + gridTableIdx).find('td').css("font-style", "italic");
    } else {
    	table[idx].grid.custFontFam = '"Roboto", sans-serif';
    	table[idx].grid.custFontStyle = 'normal';
    	table[idx].grid.custFontSize = '12';
    }
    if (comboData) {
      $("#" + newTable).css("top",parseFloat(comboData.pos[0]));
      $("#" + newTable).css("left",parseFloat(comboData.pos[1]));
      $("#" + newTable).height(parseFloat(comboData.size[0]));
      $("#" + newTable).width(parseFloat(comboData.size[1]));
    }
    table[idx].grid.setSizes();
    for (var i = 0; i<table[idx].grid.getColumnsNum(); i++) {
      table[idx].grid.adjustColumnSize(i);
    }
	  $("#" + newTable + " .gridbox").css('height', $("#" + newTable).height()-21);
    $("#" + newTable + " .gridbox").css('width', $("#" + newTable).width());
    $("#" + newTable + " .objbox").css('height', $("#" + newTable).height()-68);
    $("#" + newTable + " .objbox").css('width', $("#" + newTable).width());
    noOverlap();
    createWin.close();
    $('#chartTitleInput').val("");
    if (!comboData) {
      if (topPos) {
        if (leftPos+10 + width + $("#dashboard .ui-widget-content:last").width() > $("#dashboard").width())
          $("#dashboard .ui-widget-content:last").css("top", topPos+10 + height)
        else {
          $("#dashboard .ui-widget-content:last").css("top", topPos);
          $("#dashboard .ui-widget-content:last").css("left", leftPos+10 + width);
        }
      }
    }
    if (comboData) {
      if (loadcounter == comboData.len) {
        loading(false);
        loadcounter = 0;
      }
      else
        loadcounter++;
    } else
      loading(false);
    return;
  }

  // Charts
  // Append a new chart element to the dashboard
  divID = chart.length;
  if (comboData)
    var name = comboData.title;
  else
    var name = $('#chartTitleInput').val();
  $("#dashboard").append('<div id="chart' + divID + '" class="ui-widget-content"></div>');
  // Insert the chart before add element
  $("#chart" + divID).insertBefore("#add");
  // Chart title
  // Add edit button and functionality
  $("#chart" + divID).append('\
  <div class="drag" style="font-family:initial!important;font-size: initial!important;">\
  <span class="delete">Delete</span><span class="copy">Copy</span><span class="edit">Edit</span><span class="prop">Properties</span><span class="tableTitle">' + name + '</span></div>');
  $('#chart' + divID).on('click', '.prop', function() {
	propWin = win.createWindow("propWin", 0, 0, 410, 405);
	propWin.button("minmax").disable();
	propWin.button("park").disable();
	propWin.setText("Properties");
	propWin.setModal(true);
	propWin.center();
	$("#dashboard").append('<div id="colors"></div>')
	propTab = propWin.attachTabbar();
	propTab.addTab("a", "Colours", "100px");
	propTab.addTab("b", "Fonts", "100px");
	propTab.tabs("a").appendObject("colors");
	fontForm = propTab.tabs("b").attachForm(formDataChart);
	propTab.tabs("a").setActive();
	var strDivID = this.parentElement.parentElement.id;
	strDivID = strDivID.replace("chart", '');
	propWin.attachEvent("onShow", function(win){
		var chartToChangeColors = chart[strDivID];
		myCP = new dhtmlXColorPicker({
			parent: "colors",
			input: "b1",
			target_color: "cv1",
			target_value: "v1",
			color: "#0000ff",
			custom_colors: chartToChangeColors.chartColors
		});
		myCP.attachEvent("onSaveColor", function(color){
			chartToChangeColors.chartColors = this.getCustomColors();
		});
	});
	propTab.tabs("a").appendObject("colors");
	propWin.attachEvent("onClose", function(win){
		chart[strDivID].chartColorsCounter = 0;
		chart[strDivID].refresh();
		return true;
	});

	// change select size
	for (var a in {sel_font:1,sel_type:1,sel_size:1}) fontForm.getSelect(a).size = 7;

	// select stored style
	fontForm.setItemValue("sel_font", chart[strDivID].custFontFam);
	fontForm.setItemValue("sel_type", chart[strDivID].custFontStyle);
	fontForm.setItemValue("sel_size", chart[strDivID].custFontSize);

	// Attach events to buttons
	fontForm.attachEvent("onButtonClick", function(name){
		if(name == "btnCanc")
			propWin.close();
		else if(name == "btnConf"){
			chart[strDivID].custFontFam = this.getItemValue("sel_font");
			chart[strDivID].custFontStyle = this.getItemValue("sel_type");
			chart[strDivID].custFontSize = this.getItemValue("sel_size");
			$('#chart' + strDivID).css("font-family", chart[strDivID].custFontFam);
			$('#chart' + strDivID).css("font-weight", "normal");
			$('#chart' + strDivID).css("font-style", "normal");
			$('#chart' + strDivID).css("font-size", chart[strDivID].custFontSize + "px");
			if(chart[strDivID].custFontStyle == "bold" || chart[strDivID].custFontStyle=="bold-italic")
				$('#chart' + strDivID).css("font-weight", "bold");
			if(chart[strDivID].custFontStyle == "italic" || chart[strDivID].custFontStyle == "bold-italic")
				$('#chart' + strDivID).css("font-style", "italic");
			propWin.close();
		}
	});

	propWin.hide();
	propWin.show();
  });
  $('#chart' + divID).on('click', '.edit', function() {
    edit(chartID);
  });
  $('#chart' + divID).on('click', '.delete', function() {
    remove(chartID);
  });
  $('#chart' + divID).on('click', '.copy', function() {
    $("#loading-text").text("Copying element")
    loading(true)
    setTimeout(function(){
      copy(chartID);
    }, 100)
  });
  $('canvas').on('click', function() {
    window.location = $('#edit' + chartID).attr('href');
    window.location = $('#copy' + chartID).attr('href');
    window.location = $('#delete' + chartID).attr('href');
  });
  // Create the chart
  var chartData = datasetF;
  if (comboData) {
    var val = comboData.data;
    var label = comboData.label;
    var group = comboData.group;
    var groupFunc = comboData.func;
    var temp = comboData.label;
    var check = comboData.check
  }
  else {
    var val = chartDataCombo.getActualValue();
    var label = chartLabelCombo.getActualValue();
    var group = chartGroupCombo.getActualValue();
    var groupFunc = chartGroupFuncCombo.getActualValue();
    var temp = chartLabelCombo.getActualValue();
    var check = $('#groupCheck').is(":checked");
  }
  if (view == "pie" || view == "pie3D" || view == "donut") {
  	for(var k = 0; k<chartData.length; k++){
  		if(chartData[k][val] == "0" || chartData[k][val] == 0){
  			chartData.splice(k, 1);
  			k--;
  		}
    }
  }
  if (check && (group && groupFunc)) {
    temp = "id";
  }
  if (view == "bar" || view == "area" || view == "line") {
    chart[divID] = new dhtmlXChart({
      view:view,
      value:"#" + val + "#",
      label:"#" + val + "#",
	  tooltip:{
		template:"#" + val + "#"
	  },
      container:"chart"+divID,
      xAxis:{
        template: "#" + temp + "#"
      },
      yAxis:{}
    });
  } else if (view == "barH") {
    chart[divID] = new dhtmlXChart({
      view:view,
      value:"#" + val + "#",
      label:"#" + val + "#",
	  tooltip:{
		template:"#" + val + "#"
	  },
      container:"chart"+divID,
      xAxis:{},
      yAxis:{
        template: "#" + temp + "#"
      }
    });
  } else if (view == "pie" || view == "pie3D" || view == "donut") {
    chart[divID] = new dhtmlXChart({
      view:view,
      value:"#" + val + "#",
      label:"#" + val + "#",
	  tooltip:{
		template:"#" + val + "#"
	  },
      container:"chart"+divID,
      legend:{
        width: 125,
        align: "right",
        valign: "middle",
        marker:{
          type: "round",
          width: 15
        },
        template: "#" + temp + "#"
      }
    });
  }
  // ChartID counting starts from 0
  // Chart name counting start from 1
  let chartID = chart.length-1;
  // Add colors for charts
  chart[chartID].chartColorsCounter = 0;
  chart[chartID].chartColors = defaultColors;
  if (comboData) {
    chart[chartID].custFontFam = comboData.custFontFam;
    chart[chartID].custFontStyle = comboData.custFontStyle;
    chart[chartID].custFontSize = comboData.custFontSize;
    $('#chart' + chartID).css("font-family", chart[chartID].custFontFam);
    $('#chart' + chartID).css("font-weight", "normal");
    $('#chart' + chartID).css("font-style", "normal");
    $('#chart' + chartID).css("font-size", chart[chartID].custFontSize + "px");
    if(chart[chartID].custFontStyle == "bold" || chart[chartID].custFontStyle=="bold-italic")
      $('#chart' + chartID).css("font-weight", "bold");
    if(chart[chartID].custFontStyle == "italic" || chart[chartID].custFontStyle == "bold-italic")
      $('#chart' + chartID).css("font-style", "italic");
  } else {
    chart[chartID].custFontFam = '"Roboto", sans-serif';
    chart[chartID].custFontStyle = 'normal';
    chart[chartID].custFontSize = '12';
  }
  // Parse the chart data
  //var random = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  chart[chartID].parse(chartData,"json");
  chart[chartID].define("color", function(obj) {
	if(chart[chartID].chartColorsCounter == chart[chartID].chartColors.length)
		chart[chartID].chartColorsCounter = 0;
	if (view == "pie" || view == "pie3D" || view == "donut")
		if(chart[chartID].chartColorsCounter > chart[chartID].indexById(chart[chartID].last()))
			chart[chartID].chartColorsCounter = 0;
    return chart[chartID].chartColors[chart[chartID].chartColorsCounter++];
  });
  chart[chartID].config.divID = divID;
  chart[chartID].config.columns = colId;
  if (comboData) {
	// Get colors for chart
	chart[chartID].chartColors = comboData.colors;
	// Reload Combo data for every chart
	chartDataCombo.clearAll();
    chartLabelCombo.clearAll();
    chartGroupCombo.clearAll();
    for (var i = 0; i < chart[chartID].config.columns.length; i++) {
      var idC = chart[chartID].config.columns[i];
      createTree2.setCheck(idC,true);
      var type2 = createTree2.getAttribute(idC, "type");
      var name2 = createTree2.getAttribute(idC, "text");
      var val2 = createTree2.getAttribute(idC, "value");
      if (type2.indexOf('number') >= 0) {
        chartDataCombo.addOption([
          [val2,name2]
        ])
      } else if (type2.indexOf('varchar') || type2.indexOf('date')) {
        chartLabelCombo.addOption([
          [val2,name2]
        ])
	    chartGroupCombo.addOption([
          [val2,name2]
	    ])
      }
    }
    chart[chartID].config.dataCombo = chartDataCombo.getIndexByValue(comboData.data);
	chart[chartID].config.dataComboExt = comboData.dataExt;
    chart[chartID].config.labelCombo = chartLabelCombo.getIndexByValue(comboData.label);
    chart[chartID].config.groupCombo = chartGroupCombo.getIndexByValue(comboData.group);
    chart[chartID].config.groupFuncCombo = chartGroupFuncCombo.getIndexByValue(comboData.func);

	for(var k = 0; k<chart[chartID].config.dataComboExt.length; k++){
	  chartDataCombo.setChecked(chartDataCombo.getIndexByValue(chart[chartID].config.dataComboExt[k]), true);
    }
	chartDataCombo.selectOption(chart[chartID].config.dataCombo);
    chartLabelCombo.selectOption(chart[chartID].config.labelCombo);
    chartGroupCombo.selectOption(chart[chartID].config.groupCombo);
    chartGroupFuncCombo.selectOption(chart[chartID].config.groupFuncCombo);
  } else {
    chart[chartID].config.dataCombo = chartDataCombo.getSelectedIndex();
	chart[chartID].config.dataComboExt = chartDataCombo.getChecked();
    chart[chartID].config.labelCombo = chartLabelCombo.getSelectedIndex();
    chart[chartID].config.groupCombo = chartGroupCombo.getSelectedIndex();
    chart[chartID].config.groupFuncCombo = chartGroupFuncCombo.getSelectedIndex();
  }
  chart[chartID].config.check = check;
  chart[chartID].config.filters = filtersF;
  chart[chartID].config.name = name;
  chart[chartID].config.dataset = chartData;
  //Area chart transparency
  if (view == "area")
	chart[chartID].define("alpha", "0.6");
  // Add series
  if (!(view == "pie" || view == "pie3D" || view == "donut")){
	var selectedOptions = chartDataCombo.getChecked();
	var columnName = selectedOptions[0];
	for (var i = 0; i<treeForm2.item.length; i++)
		if (treeForm2.item[i].value == selectedOptions[0])
			columnName = treeForm2.item[i].text;
	var valuesForLegend = [{text: columnName,color:"#a9a9a9"}];
	for(var k = 1; k<selectedOptions.length; k++){
		chart[chartID].addSeries({
			value:"#" + selectedOptions[k] + "#",
			label:"#" + selectedOptions[k] + "#",
			tooltip:{
				template:"#" + val + "#"
			},
		});
		chart[chartID]._series[k].color = function(obj) {
			return chart[chartID].chartColors[this.indexById(obj.id)%8];
		};
		columnName = selectedOptions[k];
		for (var i = 0; i<treeForm2.item.length; i++)
			if (treeForm2.item[i].value == selectedOptions[k])
				columnName = treeForm2.item[i].text;
		valuesForLegend.push({text: columnName,color:"#a9a9a9"});
	}
	chart[chartID].define("legend", {
		layout:"x",
		width: 75,
		align:"center",
		valign:"bottom",
		values:valuesForLegend,
		margin: 10
    });
  }
  // Group
  if (check && (group && groupFunc)) {
    if (groupFunc == "avg") {
	  var tempMap = {[val]:["#" + val + "#",avg]};
	  if (!(view == "pie" || view == "pie3D" || view == "donut")){
		for(var k = 1; k<selectedOptions.length; k++){
			tempMap[selectedOptions[k]] = ["#" + selectedOptions[k] + "#",avg];
		}
	  }
      chart[chartID].group({
        by:"#" + group + "#",
        map:tempMap
      });
    } else {
	  var tempMap = {[val]:["#" + val + "#",groupFunc]};
	  if (!(view == "pie" || view == "pie3D" || view == "donut")){
		for(var k = 1; k<selectedOptions.length; k++){
			tempMap[selectedOptions[k]] = ["#" + selectedOptions[k] + "#",groupFunc];
		}
	  }
      chart[chartID].group({
        by:"#" + group + "#",
        map: tempMap
      });
    }
  }
  if (comboData) {
    $("#chart" + chartID).css("top",parseFloat(comboData.pos[0]));
    $("#chart" + chartID).css("left",parseFloat(comboData.pos[1]));
    var heightC = parseFloat(comboData.size[0]);
    var widthC = parseFloat(comboData.size[1]);
    $("#chart" + chartID).height(heightC);
    $("#chart" + chartID).width(widthC);
    var canvas = chart[chartID].$view.getElementsByTagName("canvas");
    for (var i = 0; i < canvas.length; i++) {
      canvas[i].height = heightC;
      canvas[i].width = widthC;
      canvas[i].style.height = heightC + "px";
      canvas[i].style.width = widthC + "px";
    }
  }

  $('#chartTitleInput').val("");
  if (!comboData) {
    if (topPos) {
      if (leftPos+10 + width + $("#dashboard .ui-widget-content:last").width() > $("#dashboard").width())
        $("#dashboard .ui-widget-content:last").css("top", topPos+10 + height);
      else {
        $("#dashboard .ui-widget-content:last").css("top", topPos);
        $("#dashboard .ui-widget-content:last").css("left", leftPos+10 + width);
      }
    }
  }
  if (comboData) {
    if (loadcounter == comboData.len) {
      loading(false);
      loadcounter = 0;
    }
    else
      loadcounter++;
  } else
    loading(false);
  noOverlap();
  createWin.close();
  resizeCharts();
}

//Edit a dashboard element
function edit(id, hide) {
  createTree1.lockTree(false);
  createTree2.lockTree(false);
  // Check the element's view type in the tree
  createTree1.setCheck(chart[id].config.view,true);
  // Get currently checked columns in tree and uncheck them
  var checked = createTree2.getAllChecked().split(",")
  for (var i = 0; i < checked.length; i++) {
    createTree2.setCheck(checked[i],false);
  }
	editing = true;
	createTree1.disableCheckbox('grid', true);
	createTree1.disableCheckbox('pivot', true);
  // Clear the filters
  for (i = 1; i < filter.length; i++) {
    for (j = 0; j < filter[i].getOptionsCount(); j++) {
      filter[i].setChecked(j, false);
    }
    filter[i].disable();
    filter[i].unSelectOption();
  }
  // Load the saved filters
  var filters = chart[id].config.filters;
  for (i = 0; i < filters.length; i++) {
    for (j = 0; j < filters[i].values.length; j++) {
      filter[filters[i].id].setChecked(filters[i].values[j], true);
    }
  }
  chartDataCombo.clearAll();
  chartLabelCombo.clearAll();
  chartGroupCombo.clearAll();
  for (var i = 0; i < chart[id].config.columns.length; i++) {
    var idC = chart[id].config.columns[i];
    createTree2.setCheck(idC,true);
    var type = createTree2.getAttribute(idC, "type");
    var name = createTree2.getAttribute(idC, "text");
    var val = createTree2.getAttribute(idC, "value");
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
    filter[idC].enable();
  }
  $('#chartTitleInput').val(chart[id].config.name);
  for(var k = 0; k<chart[id].config.dataComboExt.length; k++){
	  chartDataCombo.setChecked(chartDataCombo.getIndexByValue(chart[id].config.dataComboExt[k]), true);
  }
  chartDataCombo.selectOption(chart[id].config.dataCombo);
  chartLabelCombo.selectOption(chart[id].config.labelCombo);
  chartGroupCombo.selectOption(chart[id].config.groupCombo);
  chartGroupFuncCombo.selectOption(chart[id].config.groupFuncCombo);
  if (chart[id].config.check){
    $('#groupCheck').prop('checked', true);
    $("#chartGroupComboDiv").css("display", "block");
    $("#chartGroupFuncComboDiv").css("display", "block");
  } else {
    $('#groupCheck').prop('checked', false);
    $("#chartGroupComboDiv").css("display", "none");
    $("#chartGroupFuncComboDiv").css("display", "none");
  }
  if (!hide) {
    createWin.show();
    createWin.setModal(true);
  }
  createWin.setText("Editing");
  $("#selectAll").off('click');
  $('#selectAll').on('click', function() {
    var checked = createTree2.getAllUnchecked().split(",")
	for (var i = 0; i < checked.length; i++) {
		if(checked[i]!=0){
			createTree2.setCheck(checked[i], true);
			check(checked[i]);
		}
	}
  });
  $("#unselectAll").off('click');
  $('#unselectAll').on('click', function() {
    var checked = createTree2.getAllChecked().split(",")
	for (var i = 0; i < checked.length; i++) {
		if(checked[i]!=0){
			createTree2.setCheck(checked[i], false);
			uncheck(checked[i]);
		}
	}
  });
  $("#done").off('click');
  $('#done').on('click', function() {
    $("#loading-text").text("Saving changes")
    loading(true)
    getColumnData(id);
  });
}

function copy(id) {
  var div = chart[id].config.divID;
  comboData = {};
  comboData.size = [];
  comboData.pos = [];
  edit(id, true)
  comboData.data = chartDataCombo.getActualValue();
  comboData.dataExt = chartDataCombo.getChecked();
  comboData.label = chartLabelCombo.getActualValue();
  comboData.group = chartGroupCombo.getActualValue();
  comboData.func = chartGroupFuncCombo.getActualValue();
  comboData.check = chart[id].config.check;
  comboData.title = chart[id].config.name
  comboData.size[0] = chart[id].$view.clientHeight;
  comboData.size[1] = chart[id].$view.clientWidth;
  comboData.pos[0] = $("#chart" + div).position().top;
  comboData.pos[1] = $("#chart" + div).position().left;
  comboData.colors = chart[id].chartColors;
  comboData.len = 0;
  comboData.custFontFam = chart[id].custFontFam;
  comboData.custFontStyle = chart[id].custFontStyle;
  comboData.custFontSize = chart[id].custFontSize;
  create(chart[id].config.view, chart[id].config.columns, chart[id].config.dataset, null, chart[id].config.filters, comboData);
}

//Save a dashboard element
function save(view, colId, datasetF, id, filtersF) {
  // Charts
  // Append a new chart element to the dashboard
  divID = id
  var name = $('#chartTitleInput').val();
  var oldHeight = $("#chart" + divID).height();
  var oldWidth = $("#chart" + divID).width();
  var oldTop = $("#chart" + divID).position().top;
  var oldLeft = $("#chart" + divID).position().left;
  var fontfamily = chart[divID].custFontFam;
  var fontstyle = chart[divID].custFontStyle;
  var fontsize = chart[divID].custFontSize;
  $("#chart" + divID).remove();
  $("#dashboard").append('<div id="chart' + divID + '" class="ui-widget-content"></div>');
  $("#chart" + divID).height(oldHeight);
  $("#chart" + divID).width(oldWidth);
  $("#chart" + divID).css("top", oldTop);
  $("#chart" + divID).css("left", oldLeft);
  $("#chart" + divID).append('\
  <div class="drag" style="font-family:initial!important;font-size: initial!important;">\
  <span class="delete">Delete</span><span class="copy">Copy</span><span class="edit">Edit</span><span class="prop">Properties</span><span class="tableTitle">' + name + '</span></div>');
  $('#chart' + divID).on('click', '.prop', function() {
	propWin = win.createWindow("propWin", 0, 0, 410, 405);
	propWin.button("minmax").disable();
	propWin.button("park").disable();
	propWin.setText("Properties");
	propWin.setModal(true);
	propWin.center();
	$("#dashboard").append('<div id="colors"></div>')
	propTab = propWin.attachTabbar();
	propTab.addTab("a", "Colours", "100px");
	propTab.addTab("b", "Fonts", "100px");
	propTab.tabs("a").appendObject("colors");
	fontForm = propTab.tabs("b").attachForm(formDataChart);
	propTab.tabs("a").setActive();
	var strDivID = this.parentElement.parentElement.id;
	strDivID = strDivID.replace("chart", '');
	propWin.attachEvent("onShow", function(win){
		var chartToChangeColors = chart[strDivID];
		myCP = new dhtmlXColorPicker({
			parent: "colors",
			input: "b1",
			target_color: "cv1",
			target_value: "v1",
			color: "#0000ff",
			custom_colors: chartToChangeColors.chartColors
		});
		myCP.attachEvent("onSaveColor", function(color){
			chartToChangeColors.chartColors = this.getCustomColors();
		});
	});
	propTab.tabs("a").appendObject("colors");
	propWin.attachEvent("onClose", function(win){
		chart[strDivID].chartColorsCounter = 0;
		chart[strDivID].refresh();
		return true;
	});

	// change select size
	for (var a in {sel_font:1,sel_type:1,sel_size:1}) fontForm.getSelect(a).size = 7;

	// select stored style
	fontForm.setItemValue("sel_font", chart[strDivID].custFontFam);
	fontForm.setItemValue("sel_type", chart[strDivID].custFontStyle);
	fontForm.setItemValue("sel_size", chart[strDivID].custFontSize);

	// Attach events to buttons
	fontForm.attachEvent("onButtonClick", function(name){
		if(name == "btnCanc")
			propWin.close();
		else if(name == "btnConf"){
			chart[strDivID].custFontFam = this.getItemValue("sel_font");
			chart[strDivID].custFontStyle = this.getItemValue("sel_type");
			chart[strDivID].custFontSize = this.getItemValue("sel_size");
			$('#chart' + strDivID).css("font-family", chart[strDivID].custFontFam);
			$('#chart' + strDivID).css("font-weight", "normal");
			$('#chart' + strDivID).css("font-style", "normal");
			$('#chart' + strDivID).css("font-size", chart[strDivID].custFontSize + "px");
			if(chart[strDivID].custFontStyle == "bold" || chart[strDivID].custFontStyle=="bold-italic")
				$('#chart' + strDivID).css("font-weight", "bold");
			if(chart[strDivID].custFontStyle == "italic" || chart[strDivID].custFontStyle == "bold-italic")
				('#chart' + strDivID).css("font-style", "italic");
			propWin.close();
		}
	});

	propWin.hide();
	propWin.show();
  });
  $('#chart' + divID).on('click', '.edit', function() {
    edit(chartID);
  });
  $('#chart' + divID).on('click', '.delete', function() {
    remove(chartID);
  });
  $('#chart' + divID).on('click', '.copy', function() {
    $("#loading-text").text("Copying element")
    loading(true)
    setTimeout(function(){
      copy(chartID);
    }, 100)
  });
  $('canvas').on('click', function() {
    window.location = $('#edit' + chartID).attr('href');
    window.location = $('#copy' + chartID).attr('href');
    window.location = $('#delete' + chartID).attr('href');
  });
  // Create the chart
  var chartData = datasetF;
  var val = chartDataCombo.getActualValue();
  var label = chartLabelCombo.getActualValue();
  var group = chartGroupCombo.getActualValue();
  var groupFunc = chartGroupFuncCombo.getActualValue();
  var temp = chartLabelCombo.getActualValue();
  var check = $('#groupCheck').is(":checked");
  if (view == "pie" || view == "pie3D" || view == "donut") {
    for(var k = 0; k<chartData.length; k++){
      if(chartData[k][val] == "0" || chartData[k][val] == 0){
        chartData.splice(k, 1);
        k--;
      }
    }
  }
  if (check && (group && groupFunc)) {
    temp = "id";
  }
  if (view == "bar" || view == "area" || view == "line") {
    chart[divID] = new dhtmlXChart({
      view:view,
      value:"#" + val + "#",
      label:"#" + val + "#",
    tooltip:{
    template:"#" + val + "#"
    },
      container:"chart"+divID,
      xAxis:{
        template: "#" + temp + "#"
      },
      yAxis:{}
    });
  } else if (view == "barH") {
    chart[divID] = new dhtmlXChart({
      view:view,
      value:"#" + val + "#",
      label:"#" + val + "#",
    tooltip:{
    template:"#" + val + "#"
    },
      container:"chart"+divID,
      xAxis:{},
      yAxis:{
        template: "#" + temp + "#"
      }
    });
  } else if (view == "pie" || view == "pie3D" || view == "donut") {
    chart[divID] = new dhtmlXChart({
      view:view,
      value:"#" + val + "#",
      label:"#" + val + "#",
    tooltip:{
    template:"#" + val + "#"
    },
      container:"chart"+divID,
      legend:{
        width: 125,
        align: "right",
        valign: "middle",
        marker:{
          type: "round",
          width: 15
        },
        template: "#" + temp + "#"
      }
    });
  }
  // ChartID counting starts from 0
  // Chart name counting start from 1
  let chartID = id
  // Add colors for charts
  chart[chartID].chartColorsCounter = 0;
  chart[chartID].chartColors = defaultColors;
  chart[chartID].custFontFam = fontfamily;
  chart[chartID].custFontStyle = fontstyle;
  chart[chartID].custFontSize = fontsize;
  $('#chart' + chartID).css("font-family", chart[chartID].custFontFam);
  $('#chart' + chartID).css("font-weight", "normal");
  $('#chart' + chartID).css("font-style", "normal");
  $('#chart' + chartID).css("font-size", chart[chartID].custFontSize + "px");
  if(chart[chartID].custFontStyle == "bold" || chart[chartID].custFontStyle=="bold-italic")
    $('#chart' + chartID).css("font-weight", "bold");
  if(chart[chartID].custFontStyle == "italic" || chart[chartID].custFontStyle == "bold-italic")
    $('#chart' + chartID).css("font-style", "italic");
  // Parse the chart data
  //var random = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  chart[chartID].parse(chartData,"json");
  chart[chartID].define("color", function(obj) {
  if(chart[chartID].chartColorsCounter == chart[chartID].chartColors.length)
    chart[chartID].chartColorsCounter = 0;
  if (view == "pie" || view == "pie3D" || view == "donut")
    if(chart[chartID].chartColorsCounter > chart[chartID].indexById(chart[chartID].last()))
      chart[chartID].chartColorsCounter = 0;
    return chart[chartID].chartColors[chart[chartID].chartColorsCounter++];
  });
  chart[chartID].config.divID = divID;
  chart[chartID].config.columns = colId;
  chart[chartID].config.dataCombo = chartDataCombo.getSelectedIndex();
  chart[chartID].config.dataComboExt = chartDataCombo.getChecked();
  chart[chartID].config.labelCombo = chartLabelCombo.getSelectedIndex();
  chart[chartID].config.groupCombo = chartGroupCombo.getSelectedIndex();
  chart[chartID].config.groupFuncCombo = chartGroupFuncCombo.getSelectedIndex();
  chart[chartID].config.check = check;
  chart[chartID].config.filters = filtersF;
  chart[chartID].config.name = name;
  chart[chartID].config.dataset = chartData;
  //Area chart transparency
  if (view == "area")
  chart[chartID].define("alpha", "0.6");
  // Add series
  if (!(view == "pie" || view == "pie3D" || view == "donut")){
  var selectedOptions = chartDataCombo.getChecked();
  var columnName = selectedOptions[0];
  for (var i = 0; i<treeForm2.item.length; i++)
    if (treeForm2.item[i].value == selectedOptions[0])
      columnName = treeForm2.item[i].text;
  var valuesForLegend = [{text: columnName,color:"#a9a9a9"}];
  for(var k = 1; k<selectedOptions.length; k++){
    chart[chartID].addSeries({
      value:"#" + selectedOptions[k] + "#",
      label:"#" + selectedOptions[k] + "#",
      tooltip:{
        template:"#" + val + "#"
      },
    });
    chart[chartID]._series[k].color = function(obj) {
      return chart[chartID].chartColors[this.indexById(obj.id)%8];
    };
    columnName = selectedOptions[k];
    for (var i = 0; i<treeForm2.item.length; i++)
      if (treeForm2.item[i].value == selectedOptions[k])
        columnName = treeForm2.item[i].text;
    valuesForLegend.push({text: columnName,color:"#a9a9a9"});
  }
  chart[chartID].define("legend", {
    layout:"x",
    width: 75,
    align:"center",
    valign:"bottom",
    values:valuesForLegend,
    margin: 10
    });
  }
  // Group
  if (check && (group && groupFunc)) {
    if (groupFunc == "avg") {
    var tempMap = {[val]:["#" + val + "#",avg]};
    if (!(view == "pie" || view == "pie3D" || view == "donut")){
    for(var k = 1; k<selectedOptions.length; k++){
      tempMap[selectedOptions[k]] = ["#" + selectedOptions[k] + "#",avg];
    }
    }
      chart[chartID].group({
        by:"#" + group + "#",
        map:tempMap
      });
    } else {
    var tempMap = {[val]:["#" + val + "#",groupFunc]};
    if (!(view == "pie" || view == "pie3D" || view == "donut")){
    for(var k = 1; k<selectedOptions.length; k++){
      tempMap[selectedOptions[k]] = ["#" + selectedOptions[k] + "#",groupFunc];
    }
    }
      chart[chartID].group({
        by:"#" + group + "#",
        map: tempMap
      });
    }
    resizeCharts();
    $('#chartTitleInput').val("");
  }
  noOverlap();
  createWin.close();
  loading(false);
}

function remove(id) {
  if (confirm("Are you sure you want to delete this chart?")) {
    $("#chart" + id).remove();
    chart[id] = null
  }
}

function editTable(id) {
	createTree1.disableCheckbox('grid', false);
	createTree1.disableCheckbox('pivot', false);
  var name = table[id].name
  // Check the element's view type in the tree
  createTree1.setCheck(table[id].view, true);
  // Get currently checked columns in tree and uncheck them
  var checked = createTree2.getAllChecked().split(",")
  for (var i = 0; i < checked.length; i++) {
    createTree2.setCheck(checked[i],false);
  }
  // Clear the filters
  for (i = 1; i < filter.length; i++) {
    for (j = 0; j < filter[i].getOptionsCount(); j++) {
      filter[i].setChecked(j, false);
    }
    filter[i].disable();
    filter[i].unSelectOption();
  }
  // Load the saved filters
  var filters = table[id].filters;
  for (i = 0; i < filters.length; i++) {
    for (j = 0; j < filters[i].values.length; j++) {
      filter[filters[i].id].setChecked(filters[i].values[j], true);
    }
    filter[filters[i].id].enable();
  }
  for (var i = 0; i < table[id].columns.length; i++) {
    createTree2.setCheck(table[id].columns[i],true);
  }
  chartDataCombo.clearAll();
  chartLabelCombo.clearAll();
  chartGroupCombo.clearAll();
  $('#chartTitleInput').val(name);
  createWin.setText("Editing");
  $("#done").off('click');
  chartDataCombo.unSelectOption();
  chartDataCombo.disable();
  chartLabelCombo.unSelectOption();
  chartLabelCombo.disable();
  $('#groupCheck').prop('checked', false);
  $('#groupCheck').attr('disabled', true);
  $("#chartGroupComboDiv").css("display", "none");
  $("#chartGroupFuncComboDiv").css("display", "none");
  chartGroupCombo.unSelectOption();
  chartGroupFuncCombo.unSelectOption();
  createWin.show();
  createWin.bringToTop();
  createWin.setModal(true);
  createTree1.lockTree(true);
  $("#selectAll").off('click');
  $('#selectAll').on('click', function() {
  var checked = createTree2.getAllUnchecked().split(",")
  for (var i = 0; i < checked.length; i++) {
    if(checked[i]!=0){
      createTree2.setCheck(checked[i], true);
      check(checked[i]);
    }
  }
  });
  $("#unselectAll").off('click');
  $('#unselectAll').on('click', function() {
    var checked = createTree2.getAllChecked().split(",")
    for (var i = 0; i < checked.length; i++) {
      if(checked[i]!=0){
        createTree2.setCheck(checked[i], false);
        uncheck(checked[i]);
      }
    }
  });
  $('#done').on('click', function() {
    createTree1.lockTree(false);
    getColumnData(id);
  });
}

function saveGrid(columnsID, dataset, id, filtersSave) {
  table[id].columns = columnsID;
  table[id].filters = filtersSave;
  table[id].name = $('#chartTitleInput').val();
  var newTable = "table" + (id+1);
  var colNames = [];
  var colTypes = [];
  var dataObj = [];
  var gridData = [];
  var getCols = [];
  var colResize = [];
	var name = $('#chartTitleInput').val();
  for (i = 0; i < columnsID.length; i++) {
    colNames.push(createTree2.getAttribute(columnsID[i], "text"));
    getCols.push(createTree2.getAttribute(columnsID[i], "value"));
    var type = createTree2.getAttribute(columnsID[i], "type");
    if (type.indexOf('number') >= 0)
      colTypes.push("ron");
    else
      colTypes.push("ro");
      colResize.push("false");
  }
  for (i = 0; i < dataset.length; i++) {
    for (j = 0; j < columnsID.length; j++) {
      gridData.push(dataset[i][getCols[j]]);
    }
    dataObj.push(gridData);
    gridData = [];
  }
  table[id].grid = new dhtmlXGridObject('grid-' + newTable);
  table[id].grid.clearAll();
  table[id].grid.setHeader(colNames.join(","));
  table[id].grid.setColTypes(colTypes.join(","));
  table[id].grid.enableResizing(colResize.join(","));
  table[id].grid.init();
  table[id].grid.custFontFam = '"Roboto", sans-serif';
  table[id].grid.custFontStyle = 'normal';
  table[id].grid.custFontSize = '12';
  table[id].grid.parse(dataObj,"jsarray");
  table[id].grid.setSizes();
  for (var i = 0; i<table[id].grid.getColumnsNum(); i++) {
    table[id].grid.adjustColumnSize(i);
  }
  $("#drag-" + newTable + " .tableTitle").text(name);
  createWin.close();
  $("#" + newTable + " .gridbox").css('height', $("#" + newTable).height()-21);
  $("#" + newTable + " .gridbox").css('width', $("#" + newTable).width());
  $("#" + newTable + " .objbox").css('height', $("#" + newTable).height()-68);
  $("#" + newTable + " .objbox").css('width', $("#" + newTable).width());
}

function savePivot(columnsID, dataset, id, nameset, filtersSave) {
  var newTable = "table" + (id+1);
  var name = $('#chartTitleInput').val();
  var iwindow = frames['pivot-' + newTable];
  table[id].columns = columnsID;
  table[id].filters = filtersSave;
  table[id].name = name;
  $("#drag-" + newTable + " .tableTitle").text(name);
  if (server) {
    iwindow.savePivotServer(dataset, nameset, table[id].pivot.custFontFam, table[id].pivot.custFontStyle, table[id].pivot.custFontStyle, id);
  } else {
    var sendData = {};
    sendData.dataset = dataset;
    sendData.nameset = nameset;
    iwindow.postMessage(sendData, "*");
  }
  createWin.close();
}

function removeTable(id) {
  if (confirm("Are you sure you want to delete this table?")) {
    $("#table" + (id+1)).remove();
    table[id] = null;
  }
}

// Resize the charts
function resizeCharts() {
  for (var i = 0; i < chart.length; i++) {
    if (chart[i]) {
      var height = chart[i].$view.clientHeight;
      var width = chart[i].$view.clientWidth;
      var canvas = chart[i].$view.getElementsByTagName("canvas");
      for (var j = 0; j < canvas.length; j++) {
        canvas[j].height = height;
        canvas[j].width = width;
        canvas[j].style.height = height + "px";
        canvas[j].style.width = width + "px";
      }
	    chart[i].chartColorsCounter = 0;
      chart[i].refresh();
    }
  }
}

function avg(prop,data){
  var val = prop.slice(1, -1);
  var count = data.length;
  var summ = 0;
  for(var i = 0; i < count; i++){
    summ += parseFloat(data[i][val]);
  }
  return (summ/count).toFixed(2);
}

// Open create window and load in the function
function openCreate() {
  if (!configForm.getItemValue("cube")) {
    alert("You must first load a cube");
    return;
  }
	createTree1.disableCheckbox('grid', false);
	createTree1.disableCheckbox('pivot', false);
	editing = false;
  createTree1.lockTree(false);
  createTree2.lockTree(false);
  $('#chartTitleInput').val('');
  chartDataCombo.clearAll();
  chartDataCombo.unSelectOption();
  chartLabelCombo.clearAll();
  chartLabelCombo.unSelectOption();
  $('#groupCheck').prop('checked', false);
  chartLabelCombo.enable();
  chartDataCombo.enable();
  $('#groupCheck').attr('disabled', false);
  $("#chartGroupComboDiv").css("display", "none");
  $("#chartGroupFuncComboDiv").css("display", "none");
  chartGroupCombo.clearAll();
  chartGroupCombo.unSelectOption();
  chartGroupFuncCombo.unSelectOption();
  createTree1.setCheck(createTree1.getAllChecked(),false);
  var checked = createTree2.getAllChecked().split(",")
  for (var i = 0; i < checked.length; i++) {
    createTree2.setCheck(checked[i],false);
  }
  createTree1.clearSelection(createTree1.getSelectedItemId());
  createWin.setText("Creating new object");
  createWin.show();
  createWin.setModal(true);
  for (i = 1; i < filter.length; i++) {
    for (j = 0; j < filter[i].getOptionsCount(); j++) {
      filter[i].setChecked(j, false);
    }
    filter[i].disable();
    filter[i].unSelectOption();
	removeFiltersForNumberCols(i);
  }
  $("#selectAll").off('click');
  $('#selectAll').on('click', function() {
    var checked = createTree2.getAllUnchecked().split(",")
	for (var i = 0; i < checked.length; i++) {
		if(checked[i]!=0){
			createTree2.setCheck(checked[i], true);
			check(checked[i]);
		}
	}
  });
  $("#unselectAll").off('click');
  $('#unselectAll').on('click', function() {
    var checked = createTree2.getAllChecked().split(",")
	for (var i = 0; i < checked.length; i++) {
		if(checked[i]!=0){
			createTree2.setCheck(checked[i], false);
			uncheck(checked[i]);
		}
	}
  });
  $("#done").off('click');
  $('#done').on('click', function() {
    $("#loading-text").text("Creating element")
    loading(true)
    getColumnData();
  });
}

// Resize charts on window resize
if (window.attachEvent)
  window.attachEvent("onresize",resizeCharts);
else
  window.addEventListener("resize",resizeCharts,false);

// Round numbers
function round(value, exp) {
  if (typeof exp === 'undefined' || +exp === 0)
    return Math.round(value);
  value = +value;
  exp = +exp;
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
    return "";
  value = value.toString().split('e');
  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}

// Loading image
function loading(status) {
  if (status) {
    loginWin.setModal(true);
    document.getElementById("loading-image").style.display="block";
    document.getElementById("loading-text").style.fontSize="36px";
  } else {
    loginWin.setModal(false);
    document.getElementById("loading-image").style.display="none";
    document.getElementById("loading-text").style.fontSize="0px";
  }
}

// Make add button draggable and resizable
$(function() {
  $('#loadbutton').on('click', function() {
    if (loadCombo.getSelected()){
      getDashboardConfig();
	  $("#saveDashboard").val(loadCombo.getSelectedText());
	  $('#loadbutton').prop('text', 'Loaded: ' + loadCombo.getSelectedText());
	  $('#loadbutton').prop('textContent', 'Loaded: ' + loadCombo.getSelectedText());
	  $('#loadbutton').prop('disabled', true);
	}
  });
  $('#deletedash').on('click', function() {
    if (loadCombo.getSelected())
		if (confirm("Are you sure you want to delete this dashboard?"))
			if (actionMode){
			isDeletingOnly = true;
			deleteDashboard();
			loadCombo.deleteOption(loadCombo.getSelectedValue());
			loadCombo.unSelectOption();
			} else
				alert("You need to load dashboard or portfolio first!");
  });
  $('#savebutton').on('click', function() {
    if ($("#saveDashboard").val())
      getDashboardData();
  });
  $('#groupCheck').on('click', function() {
    if ($('#groupCheck').is(":checked")) {
      $("#chartGroupComboDiv").css("display", "block");
      $("#chartGroupFuncComboDiv").css("display", "block");
    } else {
      $("#chartGroupComboDiv").css("display", "none");
      $("#chartGroupFuncComboDiv").css("display", "none");
    }
  });
  noOverlap();
});

function resizeIframe(obj) {
  obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
}

function noOverlap() {
  $('.dhx_chart').draggable({
    containment: $(".dhx_cell_cont_tabbar"),
    start: function(){
      $('.dhx_chart, .table').not(this).css('z-index', '100');
      $(this).css('z-index', '1000');
      $('.dhx_chart, .table').css('pointer-events','none');
    },
    stop: function(event, ui) {
      $('.dhx_chart, .table').css('pointer-events','auto');
    },
    revert: function(){
      if (shouldCancel) {
        shouldCancel = false;
        return true;
      } else {
        return false;
      }
    }
  });
  $('.dhx_chart, .table').droppable({
    over: function(){
      shouldCancel = true;
    },
    out: function(){
      shouldCancel = false;
    }
  });
  // Make chart resizeable
  $(".dhx_chart").resizable({
    start: function(){
      $('#dashboard').not(this).css('z-index', '100');
      $(this).css('z-index', '1000');
      $('.dhx_chart, .table').css('pointer-events','none');
    },
    stop: function(event, ui) {
      $('.dhx_chart, .table').css('pointer-events','auto');
    },
   resize: resizeCharts
  });
}

function today() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1;
	var yyyy = today.getFullYear();
	if(dd < 10){
		dd='0'+dd;
	}
	if(mm < 10){
		mm='0'+mm;
	}
	today = yyyy+'-'+mm+'-'+dd;
	return today;
}

function dateISO() {
	var dateISO = new Date();
	var dd = dateISO.getDate();
	var mm = dateISO.getMonth()+1;
	var yyyy = dateISO.getFullYear();
	if(dd < 10){
		dd='0'+dd;
	}
	if (mm < 10){
		mm='0'+mm;
	}
	if (configForm.getCalendar("date").getFormatedDate() == today()) {
		dateISO = yyyy+"-"+mm+"-"+dd + "T00:00:00.000Z";
	} else {
		dateISO = configForm.getCalendar("date").getFormatedDate() + "T00:00:00.000Z";
	}
	return dateISO;
}

function check() {
  var itemsToCheck = createTree2.getAllChecked().split(",");
  var selectedItems = chartDataCombo.getChecked();
  var prevLabelText = chartLabelCombo.getSelectedText();
  var prevGroupText = chartGroupCombo.getSelectedText();
  chartDataCombo.clearAll();
  chartLabelCombo.clearAll();
  chartGroupCombo.clearAll();
  for(var i=0; i<itemsToCheck.length; i++){
  	var id = itemsToCheck[i];
  	var type = createTree2.getAttribute(id, "type");
  	var name = createTree2.getAttribute(id, "text");
  	var val = createTree2.getAttribute(id, "value");
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
    if (prevLabelText) {
      if (chartLabelCombo.getComboText() == prevLabelText)
        chartLabelCombo.selectOption(chartLabelCombo.getIndexByValue(chartLabelCombo.getOptionByLabel(chartLabelCombo.getComboText()).value));
    }
    if (prevGroupText) {
      if (chartGroupCombo.getComboText() == prevGroupText)
        chartGroupCombo.selectOption(chartGroupCombo.getIndexByValue(chartGroupCombo.getOptionByLabel(chartGroupCombo.getComboText()).value));
    }
  	filter[id].enable();
  	removeFiltersForNumberCols(id);
  }
  for(var i=0; i<selectedItems.length; i++){
	  chartDataCombo.setChecked(chartDataCombo.getIndexByValue(selectedItems[i]), true);
  }
}

function uncheck(id) {
  var type = createTree2.getAttribute(id, "type");
  var name = createTree2.getAttribute(id, "text");
  var val = createTree2.getAttribute(id, "value");
  if (type.indexOf('number') >= 0) {
    chartDataCombo.deleteOption(val);
    if (chartDataCombo.getActualValue() == val)
      chartDataCombo.unSelectOption();
  } else if (type.indexOf('varchar') || type.indexOf('date')) {
    chartLabelCombo.deleteOption(val);
    chartGroupCombo.deleteOption(val);
    if (chartLabelCombo.getActualValue() == val)
      chartLabelCombo.unSelectOption();
    if (chartGroupCombo.getActualValue() == val)
      chartGroupCombo.unSelectOption();
  }
  for (i = 0; i < filter[id].getOptionsCount(); i++) {
    filter[id].setChecked(i, false);
  }
  filter[id].disable();
  filter[id].unSelectOption();
}

function removeFiltersForNumberCols(id) {
  var type = createTree2.getAttribute(id, "type");
  if (type.indexOf('number') >= 0) {
	filter[id].disable();
	filter[id].unSelectOption();
	filter[id].setPlaceholder("");
  }
}

window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
  table[event.data.id].fields = event.data;
}

function updateFonts(fam, style, size, iwindow) {
    if (iwindow.updateFonts)
      iwindow.updateFonts(fam, style, size);
    else {
      setTimeout(function() {
        updateFonts(fam, style, size, iwindow);
      }, 2500)
    }
}
