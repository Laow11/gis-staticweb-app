define([
    "jimu/dijit/Popup",
    'dojo/_base/lang',
    'dojo/_base/array',
    "dojo/promise/all",
    "esri/symbols/SimpleMarkerSymbol",
    'dojo/text!./config.json',
    "dojo/topic",
    "dojo/on",
    'jimu/WidgetManager',
    'esri/tasks/query',
    "esri/layers/FeatureLayer"
], function (Popup, lang, array, all, SimpleMarkerSymbol, configP, topic, dojoOn, WidgetManager, Query, FeatureLayer) {

    var mo = {}
    mo.averiasSelected = []
    mo.OTSelected = null
    mo.MainWidget = {}
    mo.prevStateAveriaRow = null
    mo.firstLoad = false;
    mo.selectionChangedRaised = false;  


    var config = JSON.parse(configP);
    // FUNCIONES
    mo.startUp = function () {

        // Medida de seguridad para que el DxDataGrid ya esté listo
        $('#gridAverias').dxDataGrid({
            "noDataText": "-"
        });
        $('#gridOT').dxDataGrid({
            "noDataText": "-"
        });
        console.log("GridManager Loaded")
        mo.tooltip = $('#tooltipAverias').dxTooltip({ width: 200 }).dxTooltip('instance');
        var mConfigurationAverias = lang.clone(mo.MainWidget.config.averiasGrid);
        var mConfigurationOT = lang.clone(mo.MainWidget.config.OTGrid);
        var dataGridAverias = $('#gridAverias').dxDataGrid('instance');
        var dataGridOT = $('#gridOT').dxDataGrid('instance');
        dataGridAverias = $('#gridAverias').dxDataGrid(mConfigurationAverias)
        dataGridOT = $('#gridOT').dxDataGrid(mConfigurationOT)
    }
    mo.loadDataGrids = function (dataAverias, dataOT) {
        var args = arguments;
        if (mo.firstLoad == false){            
            mo.averiasSelected = [];
            mo.OTSelected = null;
            mo.firstLoad = true;            
        }
        
        /* CONFIGURACIÓN DATA-GRID */
        //INFO - Cargamos en una variable la instancia del DataGrid para cada grilla
        
        var dataGridAverias = $('#gridAverias').dxDataGrid('instance');
        var dataGridOT = $('#gridOT').dxDataGrid('instance');

        //INFO - Config de las grillas
        var mConfigurationAverias = lang.clone(mo.MainWidget.config.averiasGrid);
        var mConfigurationOT = lang.clone(mo.MainWidget.config.OTGrid);
        //SG - Se obtienen todas las OT de las averías para luego filtrar por las que no esten asignadas
        //TO-DO: Verificar en otra capa donde se encuentran las averias ya cerradas 
        //se propone hacer query a esta capa anteriormente y añadir los resultados (OT) a arrayOfExistingOT
        var arrayOfExistingOT = []
        for (var i = 0; i < dataAverias.length; i++) {
            if (dataAverias[i][config.dataAveria.NRO_OT]) {
                var tempArray = []
                tempArray.push("NAME")
                tempArray.push("notcontains")
                tempArray.push(dataAverias[i][config.dataAveria.NRO_OT])
                arrayOfExistingOT.push(tempArray)
            }
        }
        //SG - Aplica o no los filtros, dependiendo del boton 'Ver Todos'
        if (!args[2]) {
            if ($("#cFilterAV").attr("data-todos") === "todos") {
                mConfigurationAverias.dataSource = {
                    store: dataAverias,
                    filter: null
                };
            } else {
                mConfigurationAverias.dataSource = {
                    store: dataAverias,
                    filter: ["NRO_OT", "=", null]
                };
            }
            if ($("#cFilterOT").attr("data-todos") === "todos") {
                mConfigurationOT.dataSource = {
                    store: dataOT,
                    filter: null
                };
            } else {
                mConfigurationOT.dataSource = {
                    store: dataOT,
                    filter: arrayOfExistingOT
                };
            }
        }
        else if (args[2] === "AV") {
            if ($("#cFilterAV").attr("data-todos") === "todos") {
                mConfigurationAverias.dataSource = {
                    store: dataAverias,
                    filter: null
                };
            } else {
                mConfigurationAverias.dataSource = {
                    store: dataAverias,
                    filter: ["NRO_OT", "=", null]
                };
            }
        }
        else if (args[2] === "OT") {
            if ($("#cFilterOT").attr("data-todos") === "todos") {
                mConfigurationOT.dataSource = {
                    store: dataOT,
                    filter: [config.dataOT.DESESTIMAR, "<>", "SI"]
                };
            } else {
                mConfigurationOT.dataSource = {
                    store: dataOT,
                    filter: arrayOfExistingOT
                };
            }
        }
        /* DESESTIMAR OT
        if (args[2] === "DesOT"){
            mConfigurationOT.dataSource = {
                    store: dataOT,
                    filter: [config.dataOT.DESESTIMADA, "!=", "SI"]
                };
        }*/

        //RRS, mete en un array las OT que tienen averias asignadas.
        var arrOTSWithAv = [];
        var arrAvWithOT = [];
        for (var i = 0; i < dataAverias.length; i++) {
            for (var j = 0; j < dataOT.length; j++) {
                if (dataAverias[i][config.dataAveria.NRO_OT]) {
                    if (dataAverias[i][config.dataAveria.NRO_OT] === dataOT[j].NAME) {
                        arrOTSWithAv.push(dataOT[j].NAME);
                    }
                    arrAvWithOT.push(dataAverias[i][config.dataAveria.NRO_OT]);
                }
            }
        }

        //SG - Eventos de seleccion 
        mConfigurationAverias.onSelectionChanged = function (selectedItems) {

            var otGridKeys = $('#gridOT').dxDataGrid('instance').getSelectedRowKeys()
            // $('#gridOT').dxDataGrid('instance').deselectRows([4, 6, 1]);
            //RRS, marca en el mapa las averias cuando se selecciona una
            mo.MainWidget.map.graphics.clear()
            var keysAverias = selectedItems.selectedRowKeys;
            for (var i = 0; i < keysAverias.length; i++) {
                for (var j = 0; j < mo.MainWidget.datosAveriasWithGeo.length; j++) {
                    if (keysAverias[i].OBJECTID == mo.MainWidget.datosAveriasWithGeo[j].attributes[config.dataAveria.OBJECTID]) {

                        var graphic = mo.MainWidget.datosAveriasWithGeo[j]
                        var symbol = new SimpleMarkerSymbol({
                            "color": [255, 255, 255, 64],
                            "size": 12,
                            "xoffset": 0,
                            "yoffset": 0,
                            "type": "esriSMS",
                            "style": "esriSMSCircle",
                            "outline": {
                                "color": [0, 255, 255, 255],
                                "width": 2,
                                "type": "esriSLS",
                                "style": "esriSLSSolid"
                            }
                        });
                        graphic.symbol = symbol
                        mo.MainWidget.map.graphics.add(graphic)
                    }
                }
            }
            // mo.OTSelected = null
            // var data = selectedItems.selectedRowsData[0];
            // if (data) {
            //     mo.OTSelected = data
            // }
            var allUnsigned = true;
            for (var i = 0; i < selectedItems.selectedRowsData.length; i++) {
                if (selectedItems.selectedRowsData[i][config.dataAveria.NRO_OT] !== null) {
                    allUnsigned = false;
                }
            }            


            //Comportamiento button desasignar
            if (selectedItems.selectedRowsData.length == 1 && !allUnsigned) {
                $("#desasignarButton").removeAttr("disabled")
                mo.OTSelected = otGridKeys[0];
                mo.averiasSelected = selectedItems.selectedRowsData;
            } else {
                $("#desasignarButton").attr("disabled", "disabled");
            }
            //Comportamiento button aprobar
            if (selectedItems.selectedRowsData.length == 1) {
                $("#aprobarButton").removeAttr("disabled")
                mo.OTSelected = otGridKeys[0];
                mo.averiasSelected = selectedItems.selectedRowsData;
            } else {
                $("#aprobarButton").attr("disabled", "disabled");
            }
            //Comportamiento button eliminar
            if (selectedItems.selectedRowsData.length == 1 && allUnsigned) {
                $("#eliminarAveriaButton").removeAttr("disabled")
                mo.OTSelected = otGridKeys[0];
                mo.averiasSelected = selectedItems.selectedRowsData;
            } else {
                $("#eliminarAveriaButton").attr("disabled", "disabled");
            }
            
            //Comportamiento button asignar
            if (selectedItems.selectedRowsData.length > 0 && otGridKeys.length > 0 && allUnsigned) {
                if ((otGridKeys[0].ORDEN_STATUS == config.parameters.ClosedOTStateAttribute) ||
                    (otGridKeys[0].ORDEN_STATUS == config.parameters.NotificatedOTStateAttribute)){
                        $("#asignarButton").removeAttr("disabled")
                        mo.OTSelected = otGridKeys[0];
                        mo.averiasSelected = selectedItems.selectedRowsData;
                }
                else
                {
                    $("#asignarButton").attr("disabled", "disabled");
                }                
            } else {
                $("#asignarButton").attr("disabled", "disabled");
            }

            //Comportamiento button desestimarOT
            if (otGridKeys.length > 0) {
                $("#desestimarOTButton").removeAttr("disabled")
                mo.OTSelected = otGridKeys[0];
            } else {
                $("#desestimarOTButton").attr("disabled", "disabled");
            }

              //filtro en tabla de atributos
              var query = new Query();
              query.objectIds = mo.arrayOfAveriasToArrayOfIDS(selectedItems.selectedRowsData);
              mo.MainWidget.map._layers[idOfAveriaDeDuctosLayer].selectFeatures(query, FeatureLayer.SELECTION_NEW);
                    
        }

        mo.arrayOfAveriasToArrayOfIDS = function(averias){        	
        	var result = [];
            for (var i = averias.length - 1; i >= 0; i--) {
                result.push(averias[i].OBJECTID);
            }
            return result;
        }

        mConfigurationOT.onRowClick = function (e){            
            if (!mo.selectionChangedRaised) {  
            var dataGrid = e.component;  
            var keys = dataGrid.getSelectedRowKeys();  
            dataGrid.deselectRows(keys);  
          }  
          mo.selectionChangedRaised = false; 

        }

        mConfigurationOT.onSelectionChanged = function (selectedItems) {
            mo.selectionChangedRaised = true;
            var avGridKeys = $('#gridAverias').dxDataGrid('instance').getSelectedRowKeys()
            var allUnsigned = true;
            for (var i = 0; i < avGridKeys.length; i++) {
                if (avGridKeys[i][config.dataAveria.NRO_OT] !== null) {
                    allUnsigned = false;
                }
            }


            //Comportamiento button desasignar
            if (avGridKeys.length == 1 && !allUnsigned) {
                $("#desasignarButton").removeAttr("disabled")
                mo.OTSelected = selectedItems.selectedRowsData[0];
                mo.averiasSelected = avGridKeys;
            } else {
                $("#desasignarButton").attr("disabled", "disabled");
            }
            //Comportamiento button aprobar
            if (avGridKeys.length == 1) {
                $("#aprobarButton").removeAttr("disabled")
                mo.OTSelected = selectedItems.selectedRowsData[0];
                mo.averiasSelected = avGridKeys;
            } else {
                $("#aprobarButton").attr("disabled", "disabled");
            }
            //Comportamiento button eliminar
            if (avGridKeys.length == 1 && allUnsigned) {
                $("#eliminarAveriaButton").removeAttr("disabled")
                mo.OTSelected = selectedItems.selectedRowsData[0];
                mo.averiasSelected = avGridKeys;
            } else {
                $("#eliminarAveriaButton").attr("disabled", "disabled");
            }
            
            //Comportamiento button asignar
            if (avGridKeys.length > 0 && selectedItems.selectedRowsData.length > 0 && allUnsigned) {
                if ((selectedItems.selectedRowsData[0].ORDEN_STATUS == config.parameters.ClosedOTStateAttribute) ||
                    (selectedItems.selectedRowsData[0].ORDEN_STATUS == config.parameters.NotificatedOTStateAttribute)){
                        $("#asignarButton").removeAttr("disabled")
                        mo.OTSelected = selectedItems.selectedRowsData[0];
                        mo.averiasSelected = avGridKeys;
                } 
                else
                {
                    $("#asignarButton").attr("disabled", "disabled");
                }               
            } else {
                $("#asignarButton").attr("disabled", "disabled");
            }
            //Comportamiento button Desestimar OT
            if (selectedItems.selectedRowsData.length > 0) {
                $("#desestimarOTButton").removeAttr("disabled")
                mo.OTSelected = selectedItems.selectedRowsData[0];
            } else {
                $("#desestimarOTButton").attr("disabled", "disabled");
            }
        }
        //RRS, pone las rows grices si ya están asignadas, blancas si no están
        mConfigurationAverias.onRowPrepared = function (e) {

            if (e.rowType == 'data') {               
                if (e.data[config.dataAveria.NRO_OT]) {
                    $(e.rowElement[0]).attr('style', 'background-color: #f2f2f2 !important');
                    //$(e.rowElement[0]).attr('style', 'vertical-align: middle !important');  
                    //$(e.rowElement[0]).attr('style', 'height: 29px !important');
                }
                else {  
                    $(e.rowElement[0]).attr('style', 'background-color: fff !important');       
                    //$(e.rowElement[0]).attr('style', 'vertical-align: middle !important'); 
                    //$(e.rowElement[0]).attr('style', 'height: 29px !important');              
                }
            }
        }

        //Las fechas se deben mostrar en formato local (dd/MM/yyyy)
        mConfigurationAverias.onCellPrepared = function (e) {              
            if (e.rowType == "data"){
                if (e.column.dataType == "date"){   
                    if ((e.data[e.column.dataField] == null) || (e.value.getFullYear() < 1900)){
                        e.cellElement[0].innerHTML = "";
                    }
                    else{
                        e.cellElement[0].innerHTML = e.value.getDate() + "/" + (e.value.getMonth() + 1) + "/" + e.value.getFullYear() 
                    }
                }
                            
            }
            
        }

		//Las fechas se deben mostrar en formato local (dd/MM/yyyy)
        mConfigurationOT.onCellPrepared = function (e) {  

            if (e.rowType == "data"){
                //$(e.cellElement[0]).attr('style', 'overflow: hidden !important; text-overflow: ellipsis !important;');
                if (e.column.dataType == "date"){
                    if (e.data[e.column.dataField] == null){
                        e.cellElement[0].innerHTML = "";
                    }
                    else{
                        if (e.column.dataField == config.dataOT.FECHA_INICIO || e.column.dataField == config.dataOT.FECHA_FIN){
                            e.cellElement[0].innerHTML = e.value.getDate() + "/" + (e.value.getMonth() + 1) + "/" + e.value.getFullYear()
                        }
                        else{
                            e.cellElement[0].innerHTML = e.value.getDate() + "/" + (e.value.getMonth() + 1) + "/" + e.value.getFullYear() + "<br />" + e.displayValue.toLocaleTimeString();
                        }
                         
                    }
                }
            	         	
            }
            
        }

        mConfigurationOT.onRowPrepared = function (e) {
            if (e.rowType == 'data') {                                
                if (arrOTSWithAv.indexOf(e.data.NAME) > -1) {
                    $(e.rowElement[0]).attr('style', 'background-color: #f2f2f2 !important');   
                    //$(e.rowElement[0]).attr('style', 'vertical-align: middle !important');   
                    //$(e.rowElement[0]).attr('style', 'height: 35px !important');               
                }
                else {
                    $(e.rowElement[0]).attr('style', 'background-color: fff !important');
                    //$(e.rowElement[0]).attr('style', 'vertical-align: middle !important');  
                    //$(e.rowElement[0]).attr('style', 'height: 35px !important');    
                }
            }
        }
        /////////////
        var clickTimer, lastRowCLickedId;
        //SG - Evento de click
        mConfigurationAverias.onRowClick = function (e) {
            
        }

        if (!args[2]) {
            dataGridAverias = $('#gridAverias').dxDataGrid(mConfigurationAverias)
            dataGridOT = $('#gridOT').dxDataGrid(mConfigurationOT)
            // var keysAverias = $('#gridAverias').dxDataGrid('instance').getSelectedRowKeys();
            // $('#gridAverias').dxDataGrid('instance').deselectRows(keysAverias);
            // var keysOT = $('#gridOT').dxDataGrid('instance').getSelectedRowKeys();
            // $('#gridAverias').dxDataGrid('instance').deselectRows(keysOT);
        }
        if (args[2] === "AV") {
            dataGridAverias = $('#gridAverias').dxDataGrid(mConfigurationAverias)
            // var keysAverias = $('#gridAverias').dxDataGrid('instance').getSelectedRowKeys();
            // $('#gridAverias').dxDataGrid('instance').deselectRows(keysAverias);
        }
        else if (args[2] === "OT") {
            dataGridOT = $('#gridOT').dxDataGrid(mConfigurationOT)
            // var keysOT = $('#gridOT').dxDataGrid('instance').getSelectedRowKeys();
            // $('#gridAverias').dxDataGrid('instance').deselectRows(keysOT);
        }


    };
    //SG - Muestra el popup de confirmacion para desasignar la averia 
    mo.confirmarDesasignar = function (averia) {        
        popup = new Popup({
            titleLabel: "Confirmar Desasignación",
            width: 640,
            maxHeight: 600,
            autoHeight: true,
            content: "¿Desea desasignar la avería: " + averia.data.OBJECTID + " de la orden de trabajo: " + averia.data[config.dataAveria.NRO_OT] + "?",
            buttons: [{
                label: "Aceptar",
                onClick: lang.hitch(this, function () {
                    $("#statusInfo").html("<i class='fas fa-circle-notch fa-spin' style='color: deepskyblue'></i> Actualizando...")
                    for (var j = 0; j < mo.MainWidget.datosAverias.length; j++) {
                        //SG - Vacia todos los registros de la averia asociados a la OT
                        if (averia.data.OBJECTID == mo.MainWidget.datosAverias[j].OBJECTID) {
                            mo.MainWidget.datosAverias[j][config.dataAveria.NRO_OT] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_NAME] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_LASTMODIFIEDDATE] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_CLASESDEORDEN] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_FECHA_INICIO] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_FECHA_FIN] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_TIPODETAREA] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_ORDEN_STATUS] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_PROBLEM_SUMMARY] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_SITE] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_SCHEDULED] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_PREVIOUS_SCHEDULED] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_ACKNOWLEDGED_BY_TECHNICIAN] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_ACTUAL_ONSITE_RESPONSE] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_POZO] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_CREATEDDATE] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_ID_AVISO_SAP_C] = null
                            mo.MainWidget.datosAverias[j][config.dataAveria.OT_SMAX_PS_SAP_PM_WO_ID_C] = null
                            averia.data[config.dataAveria.NRO_OT] = null
                            averia.data[config.dataAveria.OT_NAME] = null
                            averia.data[config.dataAveria.OT_LASTMODIFIEDDATE] = null
                            averia.data[config.dataAveria.OT_CLASESDEORDEN] = null
                            averia.data[config.dataAveria.OT_FECHA_INICIO] = null
                            averia.data[config.dataAveria.OT_FECHA_FIN] = null
                            averia.data[config.dataAveria.OT_TIPODETAREA] = null
                            averia.data[config.dataAveria.OT_ORDEN_STATUS] = null
                            averia.data[config.dataAveria.OT_PROBLEM_SUMMARY] = null
                            averia.data[config.dataAveria.OT_SITE] = null
                            averia.data[config.dataAveria.OT_SCHEDULED] = null
                            averia.data[config.dataAveria.OT_PREVIOUS_SCHEDULED] = null
                            averia.data[config.dataAveria.OT_ACKNOWLEDGED_BY_TECHNICIAN] = null
                            averia.data[config.dataAveria.OT_ACTUAL_ONSITE_RESPONSE] = 
                            averia.data[config.dataAveria.OT_POZO] = null 
                            averia.data[config.dataAveria.OT_CREATEDATE] = null
                            averia.data[config.dataAveria.OT_ID_AVISO_SAP_C] = null
                            averia.data[config.dataAveria.OT_SMAX_PS_SAP_PM_WO_ID_C] = null
                        }
                    }
                    //SG - Actualiza la base
                    mo.MainWidget.desasignarAveria(averia.data);  

                    if ($("#cOcultarOTs").attr('name') == "Close"){
                      document.getElementById('cOcultarOTs').click(); 
                    }
                    //mo.loadDataGrids(mo.MainWidget.datosAverias, mo.MainWidget.datosOT)

                    popup.close();
                })
            }, {
                label: "Cancelar",
                onClick: lang.hitch(this, function () {                   
                    popup.close();
                })
            }],
            onClose: function () {
                $("#" + popup.id).css("display", "none");
                popup = null;
            }
        })

    }
    return mo;
});