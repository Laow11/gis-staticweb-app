var jqueryURLSPI = "./libs/blank";
var dxWebSPI = "./libs/blank";

if (!window.jQuery) {
    jqueryURLSPI = "./libs/jquery.min";
}

if (!window.DevExpress) {
    dxWebSPI = "../libs/devExpress/js/dx.web";     
}
var jszipURLSPI = "";
if (window.JSZip) {
    jszipURLSPI = "./libs/blank";
} else {
    jszipURLSPI = "../libs/devExpress/js/jszip";
}

define([
  'dojo/_base/declare',
  'jimu/BaseWidget',
  'jimu/utils',
  'dijit/form/Button',
  'esri/symbols/SimpleMarkerSymbol',
  "esri/renderers/SimpleRenderer",
  'esri/geometry/Point',
  'esri/graphic',
  'esri/layers/GraphicsLayer',
  'esri/Color',
  'dojo/on',
  'dojo/_base/lang',
  'esri/request',
  './pruebaUrl',
  'dojo/promise/all',
  'dojo/_base/html',
  'dojo/query',
  'dojo/dom-style',
  "dojo/dom",
  'dojo/Deferred',
  'jimu/dijit/LoadingShelter',
  'dijit/_WidgetsInTemplateMixin',  
  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol",
  'esri/symbols/TextSymbol',
  "esri/symbols/Font",
  "esri/InfoTemplate",
  'esri/symbols/jsonUtils',
  'esri/dijit/PopupTemplate',
  "jimu/portalUtils",
  "esri/layers/FeatureLayer", "dijit/form/FilteringSelect", "dojo/store/Memory",
  "dojox/grid/DataGrid",
  "dojo/data/ItemFileReadStore",
  "dojox/grid/enhanced/plugins/Filter",
  "dojo/data/ItemFileWriteStore",
  "esri/geometry/Polyline",
  "esri/graphicsUtils",
  "esri/tasks/FeatureSet",
  "./libs/sheetjs/exceljs.min",
  jqueryURLSPI,
  jszipURLSPI,
  dxWebSPI, 
  "dojo/domReady!", 
  ],
function(
  declare,
  BaseWidget,
  utils,
  Button,
  SimpleMarkerSymbol, SimpleRenderer,
  Point,
  Graphic,
  GraphicsLayer,
  Color,
  on,
  lang, esriRequest, archivoURL, all, html, dojoQuery, domStyle, dom, Deferred, LoadingShelter, _WidgetsInTemplateMixin, SimpleFillSymbol, SimpleLineSymbol, 
  TextSymbol, Font, InfoTemplate, jsonUtils, PopupTemplate, portalUtils, FeatureLayer, FilteringSelect, Memory, DataGrid, ItemFileReadStore, Filter, ItemFileWriteStore,
  Polyline, graphicsUtils, FeatureSet, ExcelJS
  ) {
 
  return declare([BaseWidget, _WidgetsInTemplateMixin], {

    name: 'TableVRP',
    baseClass: 'jimu-widget-TableVRP',
    gsvc: null,
    systemList: [],
    isGeogra: null,
    outputSys: null,
    coordXT: null,
    coordYT: null,
    forceScale: true,
    zoomScale: 3,
    infoT: "",
    tagCuenca: "",
    checkbox: null,
    position: null,
    layerGroups: null,
    selectedRows: null,
    LayerOrdenes: null,
    countFeaturesO: 0,
    countFeaturesOA: 0,
    countFeaturesONA: 0,

    postCreate: function() {
      _thisTableVRP = this;
      _thisTableVRP.inherited(arguments);    
      _thisTableVRP.gsvc = _thisTableVRP.config.URLS.demUrl;
      _thisTableVRP.outputSys = this.config.sysRef.outputSys;
      _thisTableVRP.outputSys = Number(_thisTableVRP.outputSys);
      document.addEventListener("wheel", function(event){
          if(document.activeElement.type === "number"){
              document.activeElement.blur();
          }
      });

      _thisTableVRP.item_select = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
              new Color([255, 255, 0]), 3), new Color([255, 255, 255, 0.01])
      )

      _thisTableVRP.position = _thisTableVRP.getPanel();
      _thisTableVRP.getPanel().resize(_thisTableVRP.position); 
      
    },

    startup: async function() {	
        _thisTableVRP = this;     
        _thisTableVRP.createTabs();
        
       var elementosDragHandle = document.querySelectorAll('.lm_vertical');

        elementosDragHandle.forEach(function (elemento) {
            elemento.addEventListener('mouseup', function (evt) {
               setTimeout(function() {
                _thisTableVRP.actualizarAlturaTablas();
            }, 100);
            });
            elemento.addEventListener('mousedown', function (evt) {
                setTimeout(function() {
                _thisTableVRP.actualizarAlturaTablas();
            }, 100);
            });
        });

        document.querySelectorAll('.lm_header').forEach(function(element) {
            element.style.pointerEvents = 'none';
        });

        var elementosConClase = document.querySelectorAll('.lm_maximise');      
    
        elementosConClase[2].addEventListener('click', function(evt) {
            var nuevoAncho = _thisTableVRP.position.containerNode.clientHeight - 60;

            var gridElement1 = $("#gridOrdenes");
            if (gridElement1[0].innerHTML != "") {
                var gridInstance1 = $("#gridOrdenes").dxDataGrid("instance");

                if (gridInstance1) {
                    gridInstance1.option("height", nuevoAncho);
                }
            }

            var gridElement2 = $("#gridRutas");
            if (gridElement2[0].innerHTML != "") {
                var gridInstance2 = $("#gridRutas").dxDataGrid("instance");

                if (gridInstance2) {
                    gridInstance2.option("height", nuevoAncho);
                }
            }

            var gridElement3 = $("#gridOrdenesA");
            if (gridElement3[0].innerHTML != "") {
                var gridInstance3 = $("#gridOrdenesA").dxDataGrid("instance");

                if (gridInstance3) {
                    gridInstance3.option("height", nuevoAncho);
                }
            }
            
            var gridElement4 = $("#gridOrdenesA");
            if (gridElement4[0].innerHTML != "") {
                var gridInstance4 = $("#gridOrdenesNoA").dxDataGrid("instance");

                if (gridInstance4) {
                   gridInstance4.option("height", nuevoAncho);
                }
            }
        });
    }, 
    actualizarAlturaTablas: function () {            
        var nuevoAncho = _thisTableVRP.position.containerNode.clientHeight - 60;
        
        var gridElement1 = $("#gridOrdenes");
        if (gridElement1[0].innerHTML != "") {
            var gridInstance1 = $("#gridOrdenes").dxDataGrid("instance");

            if (gridInstance1) {
                gridInstance1.option("height", nuevoAncho);
            }
        }

        var gridElement2 = $("#gridRutas");
        if (gridElement2[0].innerHTML != "") {
            var gridInstance2 = $("#gridRutas").dxDataGrid("instance");

            if (gridInstance2) {
                gridInstance2.option("height", nuevoAncho);
            }
        }

        var gridElement3 = $("#gridOrdenesA");
        if (gridElement3[0].innerHTML != "") {
            var gridInstance3 = $("#gridOrdenesA").dxDataGrid("instance");

            if (gridInstance3) {
                gridInstance3.option("height", nuevoAncho);
            }
        }

        var gridElement4 = $("#gridOrdenesNoA");
        if (gridElement4[0].innerHTML != "") {
            var gridInstance4 = $("#gridOrdenesNoA").dxDataGrid("instance");

            if (gridInstance4) {
                gridInstance4.option("height", nuevoAncho);
            }
        }
    },
    createTabs: function () {  
        const tab1 = $('#withText').dxTabs({
            width: 'auto',
            rtlEnabled: false,
            selectedIndex: 0,
            showNavButtons: false,
            dataSource: ["Órdenes", "Rutas", "Órdenes Asignadas", "Órdenes No Asignadas"],
            orientation: "horizontal",
            stylingMode: "secondary",
            iconPosition: "start",
            onOptionChanged: function(args) {
                if (args.name === "selectedIndex") {
                    var selectedTabIndex = args.value;
                    if (selectedTabIndex === 0) {
                        $("#gridOrdenes").show(); // Muestra el grid en la pestaña "Ordenes"
                        $("#gridRutas").hide(); // Oculta el grid en la pestaña "Rutas"
                        $("#gridOrdenesA").hide(); // Oculta el grid en la pestaña "Ordenes Asignadas"
                        $("#gridOrdenesNoA").hide(); // Oculta el grid en la pestaña "Ordenes No Asignadas"
                    } else if (selectedTabIndex === 1) {
                        $("#gridOrdenes").hide(); // Oculta el grid en la pestaña "Ordenes"
                        $("#gridRutas").show(); // Muestra el grid en la pestaña "Rutas"
                        $("#gridOrdenesA").hide(); // Oculta el grid en la pestaña "Ordenes Asignadas"
                        $("#gridOrdenesNoA").hide(); // Oculta el grid en la pestaña "Ordenes No Asignadas"
                    }
                    else if (selectedTabIndex === 2) {
                        $("#gridOrdenes").hide(); // Oculta el grid en la pestaña "Ordenes"
                        $("#gridRutas").hide(); // Oculta el grid en la pestaña "Rutas"
                        $("#gridOrdenesA").show(); // Muestra el grid en la pestaña "Ordenes Asignadas"
                        $("#gridOrdenesNoA").hide(); // Oculta el grid en la pestaña "Ordenes No Asignadas"
                    }
                    else if (selectedTabIndex === 3) {
                        $("#gridOrdenes").hide(); // Oculta el grid en la pestaña "Ordenes"
                        $("#gridRutas").hide(); // Oculta el grid en la pestaña "Rutas"
                        $("#gridOrdenesA").hide(); // Oculta el grid en la pestaña "Ordenes Asignadas"
                        $("#gridOrdenesNoA").show(); // Muestra el grid en la pestaña "Ordenes No Asignadas"
                    }
                }
            }
        }).dxTabs('instance');

        // Deshabilitar tabs
        var $tabs = $("#withText").find(".dx-tab");
        $tabs.eq(1).addClass("disabled-tab");
        $tabs.eq(2).addClass("disabled-tab");
        $tabs.eq(3).addClass("disabled-tab");

        var containerBtn = document.getElementById("widgetContainerBtn");

        if (containerBtn) {
            // Crear el nuevo div para el botón de borrar filtros
            var newDiv = document.createElement("div");
            newDiv.className = "dx-item dx-toolbar-item dx-toolbar-button dx-toolbar-item-auto-hide dx-toolbar-text-auto-hide";
            newDiv.id = "borrarFiltrosBtn"; // Añadir ID al nuevo div
            
            // Crear el contenido del nuevo div
            var divContent = '<div class="dx-item-content dx-toolbar-item-content">' +
                '<div class="dx-widget dx-button dx-button-mode-text dx-button-normal dx-button-has-text dx-button-has-icon dx-datagrid-toolbar-button dx-edit-button dx-datagrid-cancel-button" role="button" aria-label="Discard changes" title="Quitar filtros" tabindex="-1">' +
                '<div class="dx-button-content">' +
                '<i class="dx-icon dx-icon-clearformat"></i>' +
                '<span class="dx-button-text">Quitar filtros</span>' +
                '</div>' +
                '</div>' +
                '</div>';

            // Asignar el contenido al nuevo div
            newDiv.innerHTML = divContent;

            // Agregar el nuevo div al contenedor
            containerBtn.appendChild(newDiv);

            // Crear el nuevo div para el botón de Exportar Excel
            var newDiv2 = document.createElement("div");
            newDiv2.className = "dx-item dx-toolbar-item dx-toolbar-button dx-toolbar-item-auto-hide dx-toolbar-text-auto-hide";
            newDiv2.id = "exportExcelBtn"; // ID del contenedor

            // Crear el botón deshabilitado
            var divContent2 = `
                <div class="dx-item-content dx-toolbar-item-content">
                    <button id="btnExportExcel" class="dx-widget dx-button dx-button-mode-text dx-button-normal dx-button-has-text dx-button-has-icon dx-datagrid-toolbar-button dx-edit-button dx-datagrid-cancel-button" 
                    aria-label="Exportar Excel" title="Exportar Excel" tabindex="-1" disabled>
                        <div class="dx-button-content">
                            <i class="dx-icon dx-icon-xlsfile"></i>
                            <span class="dx-button-text">Exportar Excel</span>
                        </div>
                    </button>
                </div>`;

            // Asignar el contenido al nuevo div
            newDiv2.innerHTML = divContent2;

            // Agregar el nuevo div al contenedor
            containerBtn.appendChild(newDiv2);

            // **Agregar evento de clic directamente al botón, no al div**
            document.getElementById("btnExportExcel").addEventListener("click", async function () {
                if (this.disabled) return; // Si está deshabilitado, no hace nada
                await exportarExcel();
            });

            async function exportarExcel() {
                var dataGridOrdenes = $("#gridOrdenesA").dxDataGrid("instance");
                var dataGridRutas = $("#gridRutas").dxDataGrid("instance"); // Segundo grid

                var workbook = new ExcelJS.Workbook();
                var worksheetOrdenes = workbook.addWorksheet("Ordenes");
                var worksheetRutas = workbook.addWorksheet("Rutas");

                var StopType = [
                    { value: 0, name: "Order" },
                    { value: 1, name: "Depot" },
                    { value: 2, name: "Break" }
                ];

                function exportGridToWorksheet(dataGrid, worksheet) {
                    var columns = dataGrid.getVisibleColumns().filter(col => col.caption && col.caption !== "#");

                    // Obtener datos de la grilla
                    var data = dataGrid.getDataSource().items();

                    // Agregar encabezados
                    let headerRow = worksheet.addRow(columns.map(col => col.caption || col.dataField || " "));

                    // Inicializar ancho de columnas con la longitud del encabezado
                    let columnWidths = columns.map(col => String(col.caption || col.dataField || " ").length);

                    // Construir los datos y calcular el ancho máximo de cada columna
                    let dataRows = data.map(row => {
                        return columns.map((col, colIndex) => {
                            let value = row[col.dataField];

                            // Formatear fechas correctamente a GMT-3
                            if (col.dataType === "date" && value) {
                                let date = new Date(value);
                                date.setUTCHours(date.getUTCHours() - 3); // Ajustar a GMT-3
                                let year = date.getUTCFullYear();
                                let month = String(date.getUTCMonth() + 1).padStart(2, "0");
                                let day = String(date.getUTCDate()).padStart(2, "0");
                                let hours = String(date.getUTCHours()).padStart(2, "0");
                                let minutes = String(date.getUTCMinutes()).padStart(2, "0");
                                value = `${day}/${month}/${year} ${hours}:${minutes}`;
                            }

                            // Traducir StopType y OrderCount
                            if (col.dataField === "StopType" || col.dataField === "OrderCount" ) {
                                let stop = StopType.find(s => s.value === value);
                                value = stop ? stop.name : value;
                            }
                            else if (col.dataField === "Name") {
                                value = value.toString();  // Apóstrofe inicial para que Excel lo trate como texto
                            }
                            else if ((col.dataType === "number" && typeof value === "number") && col.dataField != "Sequence") {
                               if (col.dataField === "TotalDistance") {
                                    value = Number(value.toFixed(2)); // Mantiene el tipo numérico
                                } else {
                                    value = Number(value.toFixed(2)); // Mantiene el número con dos decimales
                                }
                            }

                            // Convertir a string para medir su longitud
                            let valueStr = String(value || " ");
                            columnWidths[colIndex] = Math.max(columnWidths[colIndex], valueStr.length);

                            return value;
                        });
                    });

                    // Agregar las filas al worksheet asegurando que los números sean numéricos
                    dataRows.forEach(rowData => {
                        let formattedRow = rowData.map((val, index) => {
                            let col = columns[index];

                            // Si la columna es "Name", asegurarse de que se agregue como string con apóstrofe
                            if (col.dataField === "Name") {
                                return String(val);  // Ya viene con el apóstrofe agregado
                            }

                            return (col.dataType === "number" && typeof val === "number") ? Number(val) : val;
                        });
                        worksheet.addRow(formattedRow);
                    });

                    // Ajustar el ancho de las columnas basado en el valor más ancho
                    worksheet.columns = columns.map((col, index) => ({
                        header: col.caption || col.dataField || " ",
                        key: col.dataField,
                        width: columnWidths[index] + 1 // Se agrega un pequeño margen extra
                    }));
                }

                // Exportar ambos DataGrids a hojas separadas
                exportGridToWorksheet(dataGridOrdenes, worksheetOrdenes);
                exportGridToWorksheet(dataGridRutas, worksheetRutas);

                // Guardar archivo
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "OutRutas_Semanal.xlsx";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } else {
            console.error("No se encontró el contenedor con el id 'widgetContainerBtn'.");
        }

        $('#borrarFiltrosBtn').on('click', function() {
            var gridElement1 = $("#gridOrdenes");
            if (gridElement1[0].innerHTML != "") {
                var gridInstance1 = $("#gridOrdenes").dxDataGrid("instance");

                if (gridInstance1) {
                     gridInstance1.clearFilter();
                }
            }

            var gridElement2 = $("#gridRutas");
            if (gridElement2[0].innerHTML != "") {
                var gridInstance2 = $("#gridRutas").dxDataGrid("instance");

                if (gridInstance2) {
                    gridInstance2.clearFilter();
                }
            }

            var gridElement3 = $("#gridOrdenesA");
            if (gridElement3[0].innerHTML != "") {
                var gridInstance3 = $("#gridOrdenesA").dxDataGrid("instance");

                if (gridInstance3) {
                    gridInstance3.clearFilter();
                }
            }
            
            var gridElement4 = $("#gridOrdenesA");
            if (gridElement4[0].innerHTML != "") {
                var gridInstance4 = $("#gridOrdenesNoA").dxDataGrid("instance");

                if (gridInstance4) {
                    gridInstance4.clearFilter();
                }
            }
        });

    },
    // Función para habilitar el botón dinámicamente
    enableExportButton: function (enable) {
         var btn = document.getElementById("btnExportExcel");
        if (btn) {
            btn.disabled = !enable; // Bloquea físicamente el botón
            btn.style.opacity = enable ? "1" : "0.5"; // Cambia la opacidad
            btn.style.cursor = enable ? "pointer" : "not-allowed"; // Cambia el cursor
        }
    },
    emptyGridOrdenes: function () {
        columns = [{
            dataField: "column1",
            caption: "Columna 1"
        }, {
            dataField: "column2",
            caption: "Columna 2"
        }, {
            dataField: "column3",
            caption: "Columna 3"
        }];
        var hTable = _thisTableVRP.position.containerNode.clientHeight - 60;        
        // Crea el dxDataGrid vacío en el contenedor especificado
        $("#gridOrdenes").dxDataGrid({
            dataSource: [],
            columns: columns,
            showBorders: true,
            width: "100%", // Ancho fijo
            height: hTable, // Altura fija (ajusta según necesidades)
            headerFilter: {
                visible: true
            },
            selection: {
                mode: "none"
            }
        });
    },
    emptyGridOrdenesNoA: function () {
        columns = [{
            dataField: "column1",
            caption: "Columna 1"
        }, {
            dataField: "column2",
            caption: "Columna 2"
        }, {
            dataField: "column3",
            caption: "Columna 3"
        }];
        var hTable = _thisTableVRP.position.containerNode.clientHeight - 60;        
        // Crea el dxDataGrid vacío en el contenedor especificado
        $("#gridOrdenesNoA").dxDataGrid({
            dataSource: [],
            columns: columns,
            showBorders: true,
            width: "100%", // Ancho fijo
            height: hTable, // Altura fija (ajusta según necesidades)
            headerFilter: {
                visible: true
            },
            selection: {
                mode: "none"
            }
        });
    },
    emptyGridRutas: function () {
        columns = [{
            dataField: "column1",
            caption: "Columna 1"
        }, {
            dataField: "column2",
            caption: "Columna 2"
        }, {
            dataField: "column3",
            caption: "Columna 3"
        }];
        var hTable = _thisTableVRP.position.containerNode.clientHeight - 60;        
        // Crea el dxDataGrid vacío en el contenedor especificado
        $("#gridRutas").dxDataGrid({
            dataSource: [],
            columns: columns,
            showBorders: true,
            width: "100%", // Ancho fijo
            height: hTable, // Altura fija (ajusta según necesidades)
            headerFilter: {
                visible: true
            },
            selection: {
                mode: "none"
            }
        });
    },    
    findIndexByObjectID: function(features, objectID) {
        for (var i = 0; i < features.length; i++) {
            if (features[i].attributes.objectid === objectID) {
                return i;
            }
        }
        return -1; // Si no se encuentra el OBJECTID en ningún objeto
    },
    changeTab: function (tabIndex) {
        const tabInstance = $('#withText').dxTabs('instance');
        tabInstance.option("selectedIndex", tabIndex);
    },
    _generateFeatureLayerOrders: function(jdOrders) {
        var symbolParams = {
            style: esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE,
            size: 6,
            color: new dojo.Color([255, 0, 0, 0.5]),
            outline: {
                color: new dojo.Color([255, 255, 115, 0.5]),
                width: 1,
                style: esri.symbol.SimpleLineSymbol.STYLE_SOLID
            }
        };

        var jsonFS = {
            geometryType: 'esriGeometryPoint',
            features: jdOrders.features,
            spatialReference: new esri.SpatialReference({ wkid: 4326, latestWkid: 4326 })
        }

        var featureSet = new FeatureSet(jsonFS);

        var layerDefinition = {
            displayFieldName: 'Name',
            geometryType: 'esriGeometryPoint',
            spatialReference: new esri.SpatialReference({ wkid: 4326, latestWkid: 4326 }),
            fields: jdOrders.fields
        }

        var featureCollection = {
            layerDefinition: layerDefinition,
            featureSet: featureSet
        }

        var infoTemplate = new InfoTemplate();
        infoTemplate.setTitle("Órdenes");
        // Crear una función para generar el contenido HTML dinámicamente
        infoTemplate.setContent(function(graphic) {
            // `graphic.attributes` contiene los atributos del feature
            var content = '<div class="mainSection"><div class="headerPopUp" dojoattachpoint="_title">' + graphic.attributes['Name'] + '</div>' +
              '<div class="hzLinePopUp"></div><div dojoattachpoint="_description"><table class="attrTablePopUp" cellpadding="0px" cellspacing="0px">';
            
            // Iterar sobre los atributos y agregarlos al contenido
            for (var attributeName in graphic.attributes) {
                if (graphic.attributes.hasOwnProperty(attributeName)) {
                    content += '<tr valign="top"><td class="attrNamePopUp">' + attributeName + '</td><td class="attrValuePopUp">' + graphic.attributes[attributeName] + '</td></tr>';
                }
            }

            content += '</table></div><div class="break"></div></div>';
            return content;
        });

        _thisTableVRP.LayerOrdenes = new FeatureLayer(featureCollection, {
            id: "ORDENES_VRP",
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"],
            infoTemplate: infoTemplate
        });


        _thisTableVRP.LayerOrdenes.setRenderer(new SimpleRenderer(new SimpleMarkerSymbol(symbolParams)));

        // Agregar el FeatureLayer al mapa
        _thisTableVRP.map.addLayer(_thisTableVRP.LayerOrdenes);        
    },
    LoadTableOrders: async function (jsonData, arrayRN, arraySpe) {  
        const jdOrders = JSON.parse(JSON.stringify(jsonData));
        await _thisTableVRP._generateFeatureLayerOrders(jdOrders);
        
        var columns = [];

        // Agregar columna para la geometría en jsonData
        jsonData.fields.push({ name: "Geometry", alias: "Geometry" }); 
            
        var assignmentRule = [
            {value: 0, name: "Exclude"},
            {value: 1, name: "Preserve route and relative sequence"},
            {value: 2, name: "Preserve route"},
            {value: 3, name: "Override"},
            {value: 4, name: "Anchor first"},
            {value: 5, name: "Anchor last"},
        ];

        var routeNames = [
        ];

        for (var i = 0; i < arrayRN.length; i++) {
            var arrayInterno = arrayRN[i];
            
            // Recorrer el array interno
            for (var j = 0; j < arrayInterno.diasMarcados.length; j++) {
                var elemento = {}
                elemento.value = arrayInterno.diasMarcados[j];
                elemento.name = arrayInterno.diasMarcados[j];
                routeNames.push(elemento);
            }
        }

        jsonData.fields.forEach(function (field) {

            var isVisible = true; // Por defecto, la columna está visible            
            if (field.alias.toUpperCase() === "OBJECTID" || field.alias == "Geometry" 
                || field.alias === "GlobalID"
                || field.alias === "created_user"
                || field.alias === "created_date"
                || field.alias === "last_edited_user"
                || field.alias === "last_edited_date"
                || field.alias === "DirectionItemID"
                || field.alias === "Shape.STLength()"
                || field.alias === "Shape.STLength()"
                || field.alias === "StartTimeUTC"
                || field.alias === "EndTimeUTC"
                || field.alias === "TimeWindowStart1"
                || field.alias === "TimeWindowEnd1"
                || field.alias === "MaxViolationTime1"
                || field.alias === "MaxViolationTime2"
                || field.alias === "ViolatedConstraints"
                || field.alias === "SourceID"
                || field.alias === "Status"
                || field.alias === "SideOfEdge"
                || field.alias === "PosAlong"
                || field.alias === "SourceOID"
                || field.alias === "CumulViolationTime"
                || field.alias === "ViolationTime"
                || field.alias === "WaitTime"
                || field.alias === "DepartTime"
                || field.alias === "ArriveTime"
                || field.alias === "CumulWaitTime"
                || field.alias === "CurbApproach"
                | field.alias === "UseCaseID") {
                isVisible = false; // Si es la columna que deseas ocultar, establece isVisible en false
            }

            var column = {
                dataField: field.name,
                caption: field.alias || field.name,
                allowEditing: false, // Habilita la edición de la columna
                visible: isVisible
            };

            // Agregar formato de fecha si es necesario
            if (field.type === "esriFieldTypeDate") {
                column.dataType = "date";
                column.format = "dd/MM/yyyy HH:mm"; // Formato de fecha y hora
            }

            // Agregar formato de número si es necesario
            if (field.type === "esriFieldTypeDouble") {
                column.dataType = "number";
                column.format = { type: "fixedPoint", precision: 2 }; // Dos decimales
            }

            

            if (field.type === "esriFieldTypeInteger") {
                column.dataType = "number";
                column.format = { type: "fixedPoint", precision: 0 }; // Formato entero sin decimales
            }
            // Agregar formato de número si es necesario
            if (field.type === "esriFieldTypeInteger" && field.name === "Sequence") {
                column.dataType = "number";
                column.format = { type: "fixedPoint", precision: 0 }; // Formato entero sin decimales
                column.validationRules = [{ type: "range", min: 1, message: "El valor mínimo permitido es 1" }];
                column.editorOptions = { // Opciones del editor para restringir a números enteros
                    step: 1, // Paso del editor (1 para números enteros)
                    useTouchSpinButtons: true // Habilitar botones de aumento y disminución
                };
            }

             // Verificar si el campo es de tipo fecha y agregar el formato de fecha
            if (field.type === "esriFieldTypeDate") {
                column.dataType = "date";
                column.format = "dd/MM/yyyy HH:mm"; // Puedes cambiar el formato según tus preferencias
            }
            if (field.alias === "ServiceTime") {
                 column.allowEditing = true // Permitir edición en esta columna
            }
            if (field.alias === "SpecialtyNames") {
                 column.allowEditing = true // Permitir edición en esta columna
            }
            if (field.alias === "Revenue") {
                 column.allowEditing = true // Permitir edición en esta columna
            }
            if (field.alias === "AssignmentRule") {
                 column.allowEditing = true // Permitir edición en esta columna
                 column.lookup = {
                    dataSource: assignmentRule,
                    valueExpr: 'value',
                    displayExpr: 'name',
                    cellTemplate: function (container, options) {
                        container.text(options.text).attr("title", options.text);
                    },
                }
            }
            if (field.alias === "RouteName") {
                column.allowEditing = true; // Permitir edición en esta columna
                column.lookup = {
                    dataSource: routeNames,
                    valueExpr: 'value',
                    displayExpr: 'name',
                    cellTemplate: function (container, options) {
                        container.text(options.text).attr("title", options.text);
                    },
                }
            }
            if (field.alias === "Sequence") {
                 column.allowEditing = true // Permitir edición en esta columna
            }

            columns.push(column);
        });

        columns.unshift({
            caption: "#", // Título de la columna
            cellTemplate: function(container, options) {
                // Crear un ID único para el contenedor del ícono
                var iconContainerId = "icon-container-" + options.rowIndex;
                
                // Agregar el contenedor de los íconos
                var iconContainer = $("<div>")
                    .addClass("icon-container") // Agregar una clase contenedora para facilitar la selección
                    .attr("id", iconContainerId) // Agregar el ID al contenedor de los íconos
                    .appendTo(container);
                
                // Agregar el ícono de la flecha de ubicación al contenedor
                $("<div>")
                    .addClass("location-icon")
                    .append(
                        $("<i>")
                            .attr("id", "zoomIcon")
                            .addClass("fa fa-location-arrow")
                            .attr("title", "Zoom") // Título inicial del ícono de la flecha de ubicación
                    )
                    .appendTo(iconContainer);
            },
            width: 30 // Ajustar el ancho para ambos iconos
        });

        $("#gridOrdenes").on("click", ".location-icon", function(event) {
            var selectedRow = _thisTableVRP.selectedRows;
            _thisTableVRP._zoomSelectOrdenesJO();
        });

        var hTable = _thisTableVRP.position.containerNode.clientHeight - 60;
        //var hTable = "80vh";
        // Crear el DataGrid editable
        $("#gridOrdenes").dxDataGrid({
            dataSource: jsonData.features.map(function(feature) {
               return {
                ...feature.attributes,
                Geometry: JSON.stringify(feature.geometry) // Agregar geometría como cadena JSON
                };
            }),
            columns: columns,
            onSelectionChanged: _thisTableVRP._selectionChange,
            hoverStateEnabled: true,
            allowColumnResizing: true,
            columnResizingMode: "widget",
            columnAutoWidth: true,
            showColumnLines: true,            
            autoExpandAll: true, // Expande automáticamente las columnas para ajustarse al contenido
            showBorders: true,
            scrolling: {
              mode: "standard"
            },
            width: '100%', // Ancho del grid
            height: hTable, // Altura fija del grid (ajústala según tus necesidades)
            headerFilter: {
                visible: true
            },
            filterRow: { 
                visible: true,  // Habilita la fila de filtro
                applyFilter: "auto" // Aplica el filtro automáticamente al escribir
            },
            paging: {
                pageSize: 100 // Establecer el número máximo de filas por página
            },
            selection: {
                mode: "single"
            },
            editing: {
                mode: 'batch',
                allowUpdating: true,
                selectTextOnEditStart: true,
                startEditAction: 'dblClick', //dblClick
                allowUpdating: true,
                texts: {
                    saveRowChanges: "Guardar Cambios" // Texto para el botón de guardar
                }
            },
            onEditorPreparing: function(e) {
                if (e.parentType == 'dataRow' && e.dataField == 'RouteName') {  
                   e.editorOptions.itemTemplate = function(itemData, itemIndex, itemElement) {  
                       $('<div>')  
                       .appendTo(itemElement)  
                       .text(itemData['name'])  
                       .attr('title', itemData['name']);  
                   }  
                }   
                if (e.parentType == 'dataRow' && e.dataField == 'AssignmentRule') {  
                   e.editorOptions.itemTemplate = function(itemData, itemIndex, itemElement) {  
                       $('<div>')  
                       .appendTo(itemElement)  
                       .text(itemData['name'])  
                       .attr('title', itemData['name']);  
                   }  
                }  
            },
            onRowUpdating: function(e) {
                // Verificar si la condición se cumple
                var assignmentRuleID = e.newData.AssignmentRule;
                // Verificar si la condición se cumple
                if ((assignmentRuleID === 2 || assignmentRuleID === 4 || assignmentRuleID === 5) && !e.newData.RouteName) {
                    // Mostrar un mensaje de error o realizar alguna acción para indicar que RouteName es requerido                    
                    var assignmentRuleName = "";
                    switch (assignmentRuleID) {
                      case 2: 
                        assignmentRuleName = "Preserve route"; 
                        break;
                      case 4: 
                        assignmentRuleName = "Anchor first"; 
                        break;
                      case 5: 
                        assignmentRuleName = "Anchor last"; 
                        break;
                    }
                    DevExpress.ui.notify({
                        message: "La columna 'RouteName' es requerida cuando 'AssignmentRule' tiene el valor " + assignmentRuleName + ".",
                        position: {
                            my: "center center",
                            at: "center center"
                        },
                        width: "500px",
                        shading: true,
                        type: "error",
                        displayTime: 3000
                    });
                    
                    // Cancelar la actualización para evitar que se guarden los cambios
                    e.cancel = true;
                }

                var routeNameID = e.newData.RouteName;
                if (e.newData.RouteName && !e.newData.Sequence) {
                    DevExpress.ui.notify({
                        message: "La columna 'Sequence' es requerida cuando 'RouteName' tiene valor.",
                        position: {
                            my: "center center",
                            at: "center center"
                        },
                        width: "500px",
                        shading: true,
                        type: "error",
                        displayTime: 3000
                    });
                }
            },
            onRowUpdated: function(e) {
                var newData = e.data;
                var objectID = e.key.objectid;
                // Encontrar el índice del objeto en el JSON original por el OBJECTID
                var index = _thisTableVRP.findIndexByObjectID(jsonData.features, objectID);

                // Si se encuentra el objeto, actualizar solo los campos modificados
                if (index !== -1) {
                    // Obtener el objeto original
                    var originalData = jsonData.features[index];

                    // Actualizar solo los campos modificados en el objeto original
                    for (var prop in newData) {
                        if (newData.hasOwnProperty(prop)) {
                            originalData.attributes[prop] = newData[prop];
                        }
                    }

                    // Actualizar el objeto en el JSON original
                    jsonData.features[index] = originalData;

                    // Publicar los datos actualizados
                    _thisTableVRP.publishData({
                        'target': "VRP",
                        'data': {
                            json: jsonData,
                            function: "updateJsonOrders"
                        }
                    });
                }
            }            
        });

        _thisTableVRP.countFeaturesO = 0;
        _thisTableVRP.countFeaturesO = jsonData.features.length;
        var $tabs = $("#withText").find(".dx-tab");
        // Iterar sobre cada pestaña y actualizar el texto
        $tabs.each(function(index, tab) {            
            if (index == 0) {                
                var $span = $(tab).find(".dx-tab-text-span");
                var originalText = $span[0].parentNode.innerText;
                $span.text("Órdenes ("+_thisTableVRP.countFeaturesO+")"); // Cambiar el texto agregando el número entre paréntesis
            }
        });

        document.getElementById("widgetContainerBtn").style.display = "block";
    },
    getColumnIndexByDataField: function (dataField) {
        var columns = $("#gridOrdenes").dxDataGrid("instance").option("columns");
        for (var i = 0; i < columns.length; i++) {
            if (columns[i].dataField === dataField) {
                return i;
            }
        }
            return -1; // Si no se encuentra la columna, se devuelve -1
    },
    ReLoadTableOrders: async function (arrayRN) {           
        var gridElement1 = $("#gridOrdenes");
        if (gridElement1[0].innerHTML != "") {

            var routeNames = [
            ];

            for (var i = 0; i < arrayRN.length; i++) {
                var arrayInterno = arrayRN[i];
                
                // Recorrer el array interno
                for (var j = 0; j < arrayInterno.diasMarcados.length; j++) {
                    var elemento = {}
                    elemento.value = arrayInterno.diasMarcados[j];
                    elemento.name = arrayInterno.diasMarcados[j];
                    routeNames.push(elemento);
                }
            }

            var gridInstance1 = $("#gridOrdenes").dxDataGrid("instance");

            gridInstance1.columnOption("RouteName", "lookup.dataSource", routeNames);
  
            // Refrescar el grid
            gridInstance1.refresh();
        }
    },
    LoadTableRoutes: async function(params) {
        var dataRoutes = [];          
        var dataStops = [];  
        
        var query= {
            where: "RunID = " + params.data.json.runID // Aquí defines tu filtro
        };

        var fLayerRoutes = new FeatureLayer(params.data.json.urlRoutes, {
            id: "out_routes",  
            title: "out_routes",      
            outFields: ["*"],
            mode: FeatureLayer.MODE_ONDEMAND
        });

        // Consultar las entidades (features) del FeatureLayer con el filtro
        await fLayerRoutes.queryFeatures(query).then(async function(result) {
            dataRoutes.push(result);
        }).catch(function(error) {
            // Manejar cualquier error que pueda ocurrir durante la consulta
            console.error("Error al consultar las entidades del FeatureLayer out_routes:", error);
        });


        //add specialties in Json Routes
        var specialtyField = {
            "name": "SpecialtyNames",
            "type": "esriFieldTypeString",
            "alias": "SpecialtyNames"
        };
        dataRoutes[0].fields.splice(2, 0, specialtyField);

        params.data.tableRoutes.forEach(function(feature) {
            var routeName = feature.attributes.Name;
            var specialtyNames = feature.attributes.SpecialtyNames;
            
            dataRoutes[0].features.forEach(function(outFeature) {
                if (outFeature.attributes.Name.includes(routeName)) {
                    outFeature.attributes.SpecialtyNames = specialtyNames;
                }
            });
        });


        var fLayerStops = new FeatureLayer(params.data.json.urlStops, {
            id: "out_assigned_stops",  
            title: "out_assigned_stops",      
            outFields: ["*"],
            mode: FeatureLayer.MODE_ONDEMAND
        });
        // Consultar las entidades (features) del FeatureLayer con el filtro
        await fLayerStops.queryFeatures(query).then(async function(result) {
            dataStops.push(result);
        }).catch(function(error) {
            // Manejar cualquier error que pueda ocurrir durante la consulta
            console.error("Error al consultar las entidades del FeatureLayer out_routes:", error);
        });
        
        var revenueField = {
          "name" : "revenue",
          "type" : "esriFieldTypeDouble",
          "alias" : "Revenue"
        };
        dataStops[0].fields.splice(3, 0, revenueField);
        dataStops[0].fields.splice(10, 0, specialtyField);
        
        params.data.dataOrders.features.forEach(function(feature) {
            var name = feature.attributes.Name;
            var specialtyNames = feature.attributes.SpecialtyNames;
            var revenue = feature.attributes.Revenue;

            dataStops[0].features.forEach(function(outFeature) {
                if (outFeature.attributes.Name == name) {
                    outFeature.attributes.SpecialtyNames = specialtyNames;
                    outFeature.attributes.Revenue = revenue;
                }
            });
        });

        var tabs = $("#withText").find(".dx-tab");
        tabs.eq(1).removeClass("disabled-tab");

        //DATOS DE VRP
        var jsonDatos = dataRoutes[0]; //params.data.json[0].value; 
        var jsonDatos2 = dataStops[0]; //params.data.json[1].value;
        
        // Agregar columna para la geometría en jsonDatos
        jsonDatos.fields.push({ name: "Geometry", alias: "Geometry" });

        // Agregar columna para la geometría en jsonDatos2
        jsonDatos2.fields.push({ name: "Geometry", alias: "Geometry" }); 

        jsonDatos2.fields.forEach(function(field) {
            if (field.name === "ObjectID") {
                field.name = "ObjectID_Detail";
            }
            else if (field.name === "Name") {
                field.name = "Name_Detail";
            }
        });

        // Renombrar las propiedades "ObjectID" y "Name" en features de jsonDatos2
        jsonDatos2.features.forEach(function(feature) {
            if (feature.attributes.hasOwnProperty("ObjectID")) {
                feature.attributes["ObjectID_Detail"] = feature.attributes["ObjectID"];
                delete feature.attributes["ObjectID"];
            }
            if (feature.attributes.hasOwnProperty("Name")) {
                feature.attributes["Name_Detail"] = feature.attributes["Name"];
                delete feature.attributes["Name"];
            }
        });

        // Configurar columnas del DataGrid
        var columns = [];
        jsonDatos.fields.forEach(function(field) {
             // Determinar si quieres ocultar esta columna
            var isVisible = true; // Por defecto, la columna está visible
            if (field.alias.toUpperCase() === "OBJECTID" || field.alias == "Geometry" 
                || field.alias === "GlobalID"
                || field.alias === "created_user"
                || field.alias === "created_date"
                || field.alias === "last_edited_user"
                || field.alias === "last_edited_date"
                || field.alias === "DirectionItemID"
                || field.alias === "Shape.STLength()"
                || field.alias === "Shape.STLength()"
                || field.alias === "StartTimeUTC"
                || field.alias === "EndTimeUTC"
                || field.alias === "ViolatedConstraints"
                || field.alias === "ViolatedConstraint_1"
                || field.alias === "ViolatedConstraint_2"
                || field.alias === "ViolatedConstraint_3"
                || field.alias === "ViolatedConstraint_4"
                || field.alias === "RunID"
                || field.alias === "UseCase_ID"
                || field.alias === "TotalCost"
                || field.alias === "OvertimeCost"
                || field.alias === "DistanceCost"
                || field.alias === "TotalBreakServiceTime"
                || field.alias === "TotalTravelTime"
                || field.alias === "TotalRenewalServiceTime"
                || field.alias === "RenewalCount") {
                isVisible = false; // Si es la columna que deseas ocultar, establece isVisible en false
            }

            var column = {
                dataField: field.name,
                caption: field.alias || field.name,
                visible: isVisible
            };

            // Verificar si el campo es de tipo fecha y agregar el formato de fecha
            if (field.type === "esriFieldTypeDate") {
                column.dataType = "date";
                column.format = "dd/MM/yyyy HH:mm"; // Puedes cambiar el formato según tus preferencias
            }

            if (field.type === "esriFieldTypeDouble") {
                column.dataType = "number";
                column.format = { type: "fixedPoint", precision: 2 }; // Configurar dos decimales
            }        
            if (field.name === "OrderCount") {
                column.visibleIndex = 3;
            }  
            if (field.name === "StartTime") {
                column.visibleIndex = 4;
            }
            if (field.name === "EndTime") {
                column.visibleIndex = 5;
            }
            columns.push(column);
        });

        columns.unshift({
            caption: "#", // Título de la columna
            cellTemplate: function(container, options) {
                // Crear un ID único para el contenedor del ícono
                var iconContainerId = "icon-container-" + options.rowIndex;
                
                // Agregar el contenedor de los íconos
                var iconContainer = $("<div>")
                    .addClass("icon-container") // Agregar una clase contenedora para facilitar la selección
                    .attr("id", iconContainerId) // Agregar el ID al contenedor de los íconos
                    .appendTo(container);
                
                // Agregar el ícono de la flecha de ubicación al contenedor
                $("<div>")
                    .addClass("location-icon")
                    .append(
                        $("<i>")
                            .attr("id", "zoomIcon")
                            .addClass("fa fa-location-arrow")
                            .attr("title", "Zoom") // Título inicial del ícono de la flecha de ubicación
                    )
                    .appendTo(iconContainer);
            },
            width: 30 // Ajustar el ancho para ambos iconos
        });

        $("#gridRutas").on("click", ".location-icon", function(event) {
            var selectedRow = _thisTableVRP.selectedRows;
            _thisTableVRP._zoomSelectRoute();
        });

        var StopType = [
            {value: "0", name: "Order"},
            {value: "1", name: "Depot"},
            {value: "2", name: "Break"},
        ];

        var columns2 = [];        
        jsonDatos2.fields.forEach(function(field) {
            // Determinar si quieres ocultar esta columna
            var isVisible = false; // Por defecto, la columna está visible
            var iswidth = 120;

            if (field.alias === "Name"
                || field.alias === "Sequence"
                || field.alias === "ArriveTime"
                || field.alias === "DepartTime"
                || field.alias === "Revenue"
                || field.alias === "StopType"
                || field.alias === "SpecialtyNames") {
                isVisible = true; // Si es la columna que deseas ocultar, establece isVisible en false
            }
            if (field.alias === "Name") {
                iswidth = 200;
            }
            if (field.alias === "Sequence") {
                iswidth = 80;
            }
            var column = {
                dataField: field.name,
                caption: field.alias || field.name,
                visible: isVisible,
                width: iswidth
            };

            if (field.name === "StopType") {
                 column.lookup = {
                    dataSource: StopType,
                    valueExpr: 'value',
                    displayExpr: 'name',
                    cellTemplate: function (container, options) {
                        container.text(options.text).attr("title", options.text);
                    },
                }
            }

            // Verificar si el campo es de tipo fecha y agregar el formato de fecha
            if (field.type === "esriFieldTypeDate") {
                column.dataType = "date";
                column.format = "dd/MM/yyyy HH:mm"; // Puedes cambiar el formato según tus preferencias
            }

            if (field.type === "esriFieldTypeDouble") {
                column.dataType = "number";
                column.format = { type: "fixedPoint", precision: 2 }; // Configurar dos decimales
            }
            columns2.push(column);
        });

        var detailData = jsonDatos2.features.map(function(feature) {
            return {
                ...feature.attributes,
                Geometry: JSON.stringify(feature.geometry) // Agregar geometría como cadena JSON
            };
        }).sort((a, b) => a.Sequence - b.Sequence);

        var detailContentCache = {};
        // Configuración del DataGrid
        var hTable = _thisTableVRP.position.containerNode.clientHeight - 60;
        var scrollHandled = false; // Bandera para controlar si se ha manejado el evento de scroll
        var filterHandled = false; // Bandera para controlar si se ha manejado el evento de filtro
        $("#gridRutas").dxDataGrid({
          dataSource: jsonDatos.features.map(function(feature) {
               return {
                ...feature.attributes,
                Geometry: JSON.stringify(feature.geometry) // Agregar geometría como cadena JSON
            };
          }),
          columns: columns,          
          onSelectionChanged: _thisTableVRP._selectionChange,
          hoverStateEnabled: true,
          allowColumnResizing: true,
          columnResizingMode: "widget",
          columnAutoWidth: true,
          showColumnLines: true,            
          autoExpandAll: true, // Expande automáticamente las columnas para ajustarse al contenido
          showBorders: true,
          scrolling: {
              mode: "standard"
          },
          width: '100%', // Ancho del grid
          height: hTable, // Altura fija del grid (ajústala según tus necesidades)
          headerFilter: {
              visible: true
          }, 
          filterRow: { 
                visible: true,  // Habilita la fila de filtro
                applyFilter: "auto" // Aplica el filtro automáticamente al escribir
            },
            paging: {
                pageSize: 100 // Establecer el número máximo de filas por página
            },
          selection: {
              mode: "single"
          },
          masterDetail: {
            enabled: true,
            template: function(container, options) {
                var selectedRowData = options.data;

                var filteredData = detailData.filter(function(item) {
                    if (item.RouteName === selectedRowData.Name) {                            
                        return {
                            ...item,
                            Geometry: JSON.stringify(item.geometry) // Agregar geometría como cadena JSON
                        }; 
                    }
                });

                // Crear el grid del detalle
                var detailGrid = $("<div>").dxDataGrid({
                    dataSource: filteredData,
                    columns: columns2,
                    showBorders: true,
                    selection: {
                        mode: "single" // Habilitar selección de filas
                    },
                    onRowClick: function(e) {
                        _thisTableVRP._selectionChangeStop(e.data);
                    }
                });
                
                container.append(detailGrid);
            }
        },
        onOptionChanged: function(e) {
            var fullNameString = String(e.fullName); // Convertir fullName a cadena
            if (fullNameString.includes("filterValue") || fullNameString.includes("dataSource")) {
                filterHandled = true; // Marcar que se ha manejado el evento de filtro
                scrollHandled = false; // Restablecer la bandera de scroll
            }
        },
        onScroll: function(e) {
            scrollHandled = true; // Marcar que se ha manejado el evento de scroll
        },
        onContentReady: function(e) {            
            if (!scrollHandled && filterHandled) {                
                var gridInstance = $("#gridRutas").dxDataGrid("instance");

                // Obtener todas las filas
                var allRows = gridInstance.getVisibleRows();
                var visibleRows = gridInstance.getVisibleRows();

                // Obtener el nombre de cada fila visible
                var visibleRowNames = visibleRows.map(function(row) {
                    return row.data.Name; // Suponiendo que el nombre se encuentra en la propiedad 'Name'
                });

                // Hacer lo que necesites con las filas visibles y ocultas
                //console.log("Filas visibles:", visibleRows);
                //console.log("Nombres de filas visibles:", visibleRowNames);

                _thisTableVRP._ocultarLayersFilters(visibleRowNames);
                // Restablecer las banderas después de completar las acciones necesarias
                filterHandled = false;
            }
        }
        });
        
        
        countFeaturesR = jsonDatos.features.length;
        var $tabs = $("#withText").find(".dx-tab");
        // Iterar sobre cada pestaña y actualizar el texto
        $tabs.each(function(index, tab) {            
            if (index == 1) {                
                var $span = $(tab).find(".dx-tab-text-span");
                var originalText = $span[0].parentNode.innerText;
                $span.text("Rutas ("+countFeaturesR+")"); // Cambiar el texto agregando el número entre paréntesis
            }
        });

        await _thisTableVRP.changeTab(1)
    },
    _limpiarCountTabs: async function(){
        var $tabs = $("#withText").find(".dx-tab");
        // Iterar sobre cada pestaña y actualizar el texto
        $tabs.each(function(index, tab) {            
            if (index == 1) {                
                var $span = $(tab).find(".dx-tab-text-span");
                var originalText = $span[0].parentNode.innerText;
                $span.text("Rutas ()"); // Cambiar el texto agregando el número entre paréntesis
            }
            if (index == 2) {                
                var $span = $(tab).find(".dx-tab-text-span");
                var originalText = $span[0].parentNode.innerText;
                $span.text("Órdenes Asignadas ()"); // Cambiar el texto agregando el número entre paréntesis
            }
            if (index == 3) {                
                var $span = $(tab).find(".dx-tab-text-span");
                var originalText = $span[0].parentNode.innerText;
                $span.text("Órdenes No Asignadas ()"); // Cambiar el texto agregando el número entre paréntesis
            }
        });

        await _thisTableVRP.changeTab(0)
    },
    LoadTableOrdenesA: async function(params) {        
        var dataStops = [];  
        
        var query= {
            where: "RunID = " + params.data.json.runID // Aquí defines tu filtro
        };

        var fLayerStops = new FeatureLayer(params.data.json.urlStops, {
            id: "out_assigned_stops",  
            title: "out_assigned_stops",      
            outFields: ["*"],
            mode: FeatureLayer.MODE_ONDEMAND
        });
        // Consultar las entidades (features) del FeatureLayer con el filtro
        await fLayerStops.queryFeatures(query).then(async function(result) {
            dataStops.push(result);
        }).catch(function(error) {
            // Manejar cualquier error que pueda ocurrir durante la consulta
            console.error("Error al consultar las entidades del FeatureLayer out_assigned_stops:", error);
        });

        //DATOS DE VRP
        var jsonDatos = dataStops[0]; //params.data.json[1].value; 

        var StopType = [
            {value: 0, name: "Order"},
            {value: 1, name: "Depot"},
            {value: 2, name: "Break"},
        ];

        var $tabs = $("#withText").find(".dx-tab");
        $tabs.eq(2).removeClass("disabled-tab"); 
        
        // Agregar columna para la geometría en jsonDatos
        jsonDatos.fields.push({ name: "Geometry", alias: "Geometry" });      

        // Configurar columnas del DataGrid
        var columns = [];
        jsonDatos.fields.forEach(function(field) {
             // Determinar si quieres ocultar esta columna
            var isVisible = true; // Por defecto, la columna está visible
            if (field.alias.toUpperCase() === "OBJECTID" || field.alias == "Geometry" 
                || field.alias === "GlobalID"
                || field.alias === "created_user"
                || field.alias === "created_date"
                || field.alias === "last_edited_user"
                || field.alias === "last_edited_date"
                || field.alias === "DirectionItemID"
                || field.alias === "Shape.STLength()"
                || field.alias === "Shape.STLength()"
                || field.alias === "StartTimeUTC"
                || field.alias === "EndTimeUTC"
                || field.alias === "SnapX"
                || field.alias === "SnapY"
                || field.alias === "SnapZ"
                || field.alias === "RunID"
                || field.alias === "UseCase_ID"
                || field.alias === "ArriveTimeUTC"
                || field.alias === "DepartTimeUTC"
                || field.alias === "PickupQuantities"
                || field.alias === "DeliveryQuantities"
                || field.alias === "ORIG_FID"
                || field.alias === "ArriveCurbApproach"
                || field.alias === "DepartCurbApproach") {
                isVisible = false; // Si es la columna que deseas ocultar, establece isVisible en false
            }

            var column = {
                dataField: field.name,
                caption: field.alias || field.name,
                visible: isVisible
            };

            // Verificar si el campo es de tipo fecha y agregar el formato de fecha
            if (field.type === "esriFieldTypeDate") {
                column.dataType = "date";
                column.format = "dd/MM/yyyy HH:mm"; // Puedes cambiar el formato según tus preferencias
            }

            if (field.type === "esriFieldTypeDouble") {
                column.dataType = "number";
                column.format = { type: "fixedPoint", precision: 2 }; // Configurar dos decimales
            }


            if (field.name === "StopType") {
                 column.lookup = {
                    dataSource: StopType,
                    valueExpr: 'value',
                    displayExpr: 'name',
                    cellTemplate: function (container, options) {
                        container.text(options.text).attr("title", options.text);
                    },
                }
            }


            columns.push(column);
        });

        columns.unshift({
            caption: "#", // Título de la columna
            cellTemplate: function(container, options) {
                // Crear un ID único para el contenedor del ícono
                var iconContainerId = "icon-container-" + options.rowIndex;
                
                // Agregar el contenedor de los íconos
                var iconContainer = $("<div>")
                    .addClass("icon-container") // Agregar una clase contenedora para facilitar la selección
                    .attr("id", iconContainerId) // Agregar el ID al contenedor de los íconos
                    .appendTo(container);
                
                // Agregar el ícono de la flecha de ubicación al contenedor
                $("<div>")
                    .addClass("location-icon")
                    .append(
                        $("<i>")
                            .attr("id", "zoomIcon")
                            .addClass("fa fa-location-arrow")
                            .attr("title", "Zoom") // Título inicial del ícono de la flecha de ubicación
                    )
                    .appendTo(iconContainer);
            },
            width: 30 // Ajustar el ancho para ambos iconos
        });

        $("#gridOrdenesA").on("click", ".location-icon", function(event) {
            var selectedRow = _thisTableVRP.selectedRows;
            //_thisTableVRP._zoomSelectRoute();
            _thisTableVRP._zoomSelectOrdenes();
        });

        // Configuración del DataGrid
        var hTable = _thisTableVRP.position.containerNode.clientHeight - 60;
        var scrollHandled = false; // Bandera para controlar si se ha manejado el evento de scroll
        var filterHandled = false; // Bandera para controlar si se ha manejado el evento de filtro

        $("#gridOrdenesA").dxDataGrid({
            dataSource: jsonDatos.features.map(function(feature) {
               return {
                ...feature.attributes,
                Geometry: JSON.stringify(feature.geometry) // Agregar geometría como cadena JSON
                };
            }),
            columns: columns,
            onSelectionChanged: _thisTableVRP._selectionChange,
            hoverStateEnabled: true,
            allowColumnResizing: true,
            columnResizingMode: "nextColumn",
            columnAutoWidth: true,
            showColumnLines: true,            
            autoExpandAll: true, // Expande automáticamente las columnas para ajustarse al contenido
            showBorders: true,
            scrolling: {
              mode: "standard"
            },
            height: hTable, // Altura fija del grid (ajústala según tus necesidades)
            headerFilter: {
              visible: true
            },
            filterRow: { 
                visible: true,  // Habilita la fila de filtro
                applyFilter: "auto" // Aplica el filtro automáticamente al escribir
            },
            paging: {
                pageSize: 100 // Establecer el número máximo de filas por página
            },
            selection: {
              mode: "single"
            },
            onOptionChanged: function(e) {
                var fullNameString = String(e.fullName); // Convertir fullName a cadena
                if (fullNameString.includes("filterValue") || fullNameString.includes("dataSource")) {
                    filterHandled = true; // Marcar que se ha manejado el evento de filtro
                    scrollHandled = false; // Restablecer la bandera de scroll
                }
            },
            onScroll: function(e) {
                scrollHandled = true; // Marcar que se ha manejado el evento de scroll
            }
        });

        await _thisTableVRP.changeTab(2)
    },
    LoadTableOrdenesNoA: async function(params) { 
        var dataUnStops = [];  
        
        var ViolatedConstraints = [
            {value: 1, name: "MaxOrderCount exceeded"},
            {value: 2, name: "Capacities exceeded"},
            {value: 4, name: "MaxTotalTime exceeded"},
            {value: 8, name: "MaxTotalTravelTime exceeded"},
            {value: 16, name: "MaxTotalDistance exceeded"},
            {value: 32, name: "Hard time window"},
            {value: 64, name: "Unmatched specialty"},
            {value: 128, name: "Hard route zone"},
            {value: 256, name: "Order pair MaxTransitTime exceeded"},
            {value: 512, name: "Order pair violation"},
            {value: 1024, name: "Unreachable"},
            {value: 1088, name: "Unreachable"},
            {value: 2048, name: "Cannot insert required break"},
            {value: 4096, name: "Cannot insert required renewal"},
            {value: 8192, name: "MaxTravelTimeBetweenBreaks exceeded"},
            {value: 16384, name: "Break MaxCumulWorkTime exceeded"},
            {value: 32768, name: "InboundArriveTime or OutboundDepartTime order violation"},
            {value: 65536, name: "Cannot anchor first/last"},
        ];
        var ViolatedConstraints_1 = [
            {value: 0, name: "MaxOrderCount exceeded"},
            {value: 1, name: "Capacities exceeded"},
            {value: 2, name: "MaxTotalTime exceeded"},
            {value: 3, name: "MaxTotalTravelTime exceeded"},
            {value: 4, name: "MaxTotalDistance exceeded"},
            {value: 5, name: "Hard time window"},
            {value: 6, name: "Unmatched specialty"},
            {value: 7, name: "Hard route zone"},
            {value: 8, name: "Order pair MaxTransitTime exceeded"},
            {value: 9, name: "Order pair violation"},
            {value: 10, name: "Unreachable"},
            {value: 11, name: "Cannot insert required break"},
            {value: 12, name: "Cannot insert required renewal"},
            {value: 13, name: "MaxTravelTimeBetweenBreaks exceeded"},
            {value: 14, name: "Break MaxCumulWorkTime exceeded"},
            {value: 15, name: "InboundArriveTime or OutboundDepartTime order violation"},
            {value: 16, name: "Cannot anchor first/last"},
        ];

        var Status = [
            {value: 0, name: "OK"},
            {value: 1, name: "Not located"},
            {value: 2, name: "Network element not located"},
            {value: 3, name: "Element not traversable"},
            {value: 4, name: "Invalid field values"},
            {value: 5, name: "Not reached"},
            {value: 6, name: "Time window violation"},
            {value: 7, name: "Not located on closest"},
        ];

        var StopType = [
            {value: "0", name: "Order"},
            {value: "1", name: "Depot"},
            {value: "2", name: "Break"},
        ];

        var query= {
            where: "RunID = " + params.data.json.runID // Aquí defines tu filtro
        };

        var fLayerUnStops = new FeatureLayer(params.data.json.urlUnStops, {
            id: "out_unassigned_stops",  
            title: "out_unassigned_stops",      
            outFields: ["*"],
            mode: FeatureLayer.MODE_ONDEMAND
        });
        // Consultar las entidades (features) del FeatureLayer con el filtro
        await fLayerUnStops.queryFeatures(query).then(async function(result) {
            dataUnStops.push(result);
        }).catch(function(error) {
            // Manejar cualquier error que pueda ocurrir durante la consulta
            console.error("Error al consultar las entidades del FeatureLayer out_unassigned_stops:", error);
        });

        //DATOS DE VRP
        var jsonDatos = dataUnStops[0]; //params.data.json[2].value; 

        var $tabs = $("#withText").find(".dx-tab");
        $tabs.eq(3).removeClass("disabled-tab"); 

        var columns = [];

        if (jsonDatos.features.length > 0) {
            // Agregar columna para la geometría en jsonDatos
            jsonDatos.fields.push({ name: "Geometry", alias: "Geometry" });      

            // Configurar columnas del DataGrid
            


            jsonDatos.fields.forEach(function(field) {
                 // Determinar si quieres ocultar esta columna
                var isVisible = true; // Por defecto, la columna está visible
                if (field.alias.toUpperCase() === "OBJECTID" || field.alias == "Geometry" 
                    || field.alias === "GlobalID"
                    || field.alias === "created_user"
                    || field.alias === "created_date"
                    || field.alias === "last_edited_user"
                    || field.alias === "last_edited_date"
                    || field.alias === "DirectionItemID"
                    || field.alias === "Shape.STLength()"
                    || field.alias === "Shape.STLength()"
                    || field.alias === "StartTimeUTC"
                    || field.alias === "EndTimeUTC"
                    || field.alias === "RundID"
                    || field.alias === "UseCase_ID"
                    || field.alias === "ORIG_FID"
                    || field.alias === "ViolatedConstraint_3"
                    || field.alias === "ViolatedConstraint_4") {
                    isVisible = false; // Si es la columna que deseas ocultar, establece isVisible en false
                }

                var column = {
                    dataField: field.name,
                    caption: field.alias || field.name,
                    visible: isVisible
                };
                if (field.name === "ViolatedConstraints") {
                     column.lookup = {
                        dataSource: ViolatedConstraints,
                        valueExpr: 'value',
                        displayExpr: 'name',
                        cellTemplate: function (container, options) {
                            container.text(options.text).attr("title", options.text);
                        },
                    }
                }
                if (field.name === "ViolatedConstraint_1") {
                     column.lookup = {
                        dataSource: ViolatedConstraints_1,
                        valueExpr: 'value',
                        displayExpr: 'name',
                        cellTemplate: function (container, options) {
                            container.text(options.text).attr("title", options.text);
                        },
                    }
                }
                if (field.name === "ViolatedConstraint_2") {
                     column.lookup = {
                        dataSource: ViolatedConstraints_1,
                        valueExpr: 'value',
                        displayExpr: 'name',
                        cellTemplate: function (container, options) {
                            container.text(options.text).attr("title", options.text);
                        },
                    }
                }
                if (field.name === "StopType") {
                     column.lookup = {
                        dataSource: StopType,
                        valueExpr: 'value',
                        displayExpr: 'name',
                        cellTemplate: function (container, options) {
                            container.text(options.text).attr("title", options.text);
                        },
                    }
                }
                if (field.name === "Status") {
                     column.lookup = {
                        dataSource: Status,
                        valueExpr: 'value',
                        displayExpr: 'name',
                        cellTemplate: function (container, options) {
                            container.text(options.text).attr("title", options.text);
                        },
                    }
                }
                // Verificar si el campo es de tipo fecha y agregar el formato de fecha
                if (field.type === "esriFieldTypeDate") {
                    column.dataType = "date";
                    column.format = "dd/MM/yyyy HH:mm"; // Puedes cambiar el formato según tus preferencias
                }

                if (field.type === "esriFieldTypeDouble") {
                    column.dataType = "number";
                    column.format = { type: "fixedPoint", precision: 2 }; // Configurar dos decimales
                }

                columns.push(column);
            });

            columns.unshift({
                caption: "#", // Título de la columna
                cellTemplate: function(container, options) {
                    // Crear un ID único para el contenedor del ícono
                    var iconContainerId = "icon-container-" + options.rowIndex;
                    
                    // Agregar el contenedor de los íconos
                    var iconContainer = $("<div>")
                        .addClass("icon-container") // Agregar una clase contenedora para facilitar la selección
                        .attr("id", iconContainerId) // Agregar el ID al contenedor de los íconos
                        .appendTo(container);
                    
                    // Agregar el ícono de la flecha de ubicación al contenedor
                    $("<div>")
                        .addClass("location-icon")
                        .append(
                            $("<i>")
                                .attr("id", "zoomIcon")
                                .addClass("fa fa-location-arrow")
                                .attr("title", "Zoom") // Título inicial del ícono de la flecha de ubicación
                        )
                        .appendTo(iconContainer);
                },
                width: 30 // Ajustar el ancho para ambos iconos
            });
        }
        

        $("#gridOrdenesNoA").on("click", ".location-icon", function(event) {
            var selectedRow = _thisTableVRP.selectedRows;
            //_thisTableVRP._zoomSelectRoute();
            _thisTableVRP._zoomSelectOrdenes();
        });

        var detailContentCache = {};
        // Configuración del DataGrid
        var hTable = _thisTableVRP.position.containerNode.clientHeight - 60;
        var scrollHandled = false; // Bandera para controlar si se ha manejado el evento de scroll
        var filterHandled = false; // Bandera para controlar si se ha manejado el evento de filtro

        $("#gridOrdenesNoA").dxDataGrid({
            dataSource: jsonDatos.features.map(function(feature) {
               return {
                ...feature.attributes,
                Geometry: JSON.stringify(feature.geometry) // Agregar geometría como cadena JSON
                };
            }),
            columns: columns,
            onSelectionChanged: _thisTableVRP._selectionChange,    
            hoverStateEnabled: true,
            allowColumnResizing: true,
            columnResizingMode: "nextColumn",
            columnAutoWidth: true,
            showColumnLines: true,            
            autoExpandAll: true, // Expande automáticamente las columnas para ajustarse al contenido
            showBorders: true,                    
            scrolling: {
                mode: "standard"
            },
            height: hTable, // Altura fija del grid (ajústala según tus necesidades)
            headerFilter: {
              visible: true
            },
            filterRow: { 
                visible: true,  // Habilita la fila de filtro
                applyFilter: "auto" // Aplica el filtro automáticamente al escribir
            },
            paging: {
                pageSize: 100 // Establecer el número máximo de filas por página
            },
            selection: {
              mode: "single"
            },
            onOptionChanged: function(e) {
                var fullNameString = String(e.fullName); // Convertir fullName a cadena
                if (fullNameString.includes("filterValue") || fullNameString.includes("dataSource")) {
                    filterHandled = true; // Marcar que se ha manejado el evento de filtro
                    scrollHandled = false; // Restablecer la bandera de scroll
                }
            },
            onScroll: function(e) {
                scrollHandled = true; // Marcar que se ha manejado el evento de scroll
            }
        });
        
        var countFeaturesONA = jsonDatos.features.length;
        var $tabs = $("#withText").find(".dx-tab");
        // Iterar sobre cada pestaña y actualizar el texto
        $tabs.each(function(index, tab) {            
            if (index == 3) {                
                var $span = $(tab).find(".dx-tab-text-span");
                var originalText = $span[0].parentNode.innerText;
                $span.text("Órdenes No Asignadas ("+countFeaturesONA+")"); // Cambiar el texto agregando el número entre paréntesis
            }
        });
        
        var countFeaturesOA = _thisTableVRP.countFeaturesO - countFeaturesONA;  

        var $tabs = $("#withText").find(".dx-tab");
        // Iterar sobre cada pestaña y actualizar el texto
        $tabs.each(function(index, tab) {            
            if (index == 2) {                
                var $span = $(tab).find(".dx-tab-text-span");
                var originalText = $span[0].parentNode.innerText;
                $span.text("Órdenes Asignadas ("+countFeaturesOA+")"); // Cambiar el texto agregando el número entre paréntesis
            }
        });

        await _thisTableVRP.changeTab(3)
    },
    _ocultarLayersFilters: function(arrayNames) {
        var layerIds = _thisTableVRP.map.graphicsLayerIds;

        // Array para almacenar referencias a todos los layers
        var filteredLayers = [];

        // Iterar sobre los IDs de los layers y obtener una referencia a cada uno
        layerIds.forEach(function(layerId) {
            var layer = _thisTableVRP.map.getLayer(layerId);
            // Verificar si el nombre del layer contiene las palabras "Route" o "Stops"
            if (layerId.includes("Route") || layerId.includes("Stops")) {
                filteredLayers.push(layer);
            }
        });

        // Obtener una lista de todos los nombres de los layers que se deben mantener visibles
        var layersToKeepVisible = arrayNames.map(function(name) {
            return "Route " + name;
        }).concat(arrayNames.map(function(name) {
            return "Stops " + name;
        }));

        // Ocultar todos los layers excepto los especificados en 'layersToKeepVisible'
        filteredLayers.forEach(function(layer) {
            if (!layersToKeepVisible.includes(layer.id)) {                
                layer.hide();
            }
            else{
                if (!layer.visible) {
                    layer.show();
                }
            }
        });

        var columnName = 'RouteName';
        var filterValues = arrayNames; // Array de valores a filtrar en la columna 'Nombre'
        var filterConditions = _thisTableVRP.generateFilterConditions(columnName, filterValues);

        // Aplicar el filtro al dxDataGrid
        _thisTableVRP.filterGridData(filterConditions);
    },  

    generateFilterConditions: function (columnName, filterValues) {
        // Array para almacenar las condiciones de filtro
        var filterConditions = [];

        // Iterar sobre los valores de filtro
        filterValues.forEach(function(value, index) {
            // Agregar una condición de filtro para cada valor
            filterConditions.push([columnName, '=', value]);
            
            // Agregar 'or' entre las condiciones, excepto para la última condición
            if (index < filterValues.length - 1) {
                filterConditions.push('or');
            }
        });

        return filterConditions;
    },
    filterGridData: function (filterConditions) {
        var gridElement = $("#gridOrdenesA");
        if (gridElement.length > 0) {
            var gridInstance = gridElement.dxDataGrid("instance");

            if (gridInstance) {
                // Aplicar el filtro a la columna especificada con múltiples condiciones
                gridInstance.filter(filterConditions);
            } else {
                console.error('El dxDataGrid no está inicializado.');
            }
        } else {
            console.error("El dxDataGrid no existe en la página.");
        }
    },
    _zoomSelect: function(init) {
        var selectedRows = item.selectedRowKeys      
        if (selectedRows) {
            var geometry = JSON.parse(selectedRows[0].Geometry) ? JSON.parse(selectedRows[0].Geometry) : null
            if (geometry) {
              // Crear una nueva polilínea utilizando las coordenadas paths
              var polyline = new Polyline({
                  paths: geometry.paths,
                  spatialReference: _thisTableVRP.map.spatialReference
              });              
              _thisTableVRP.map.setExtent(polyline.getExtent().expand(1.5))
            }
        }
    },
    _selectionChange: function(items) {
        _thisTableVRP.selectedRows = items.selectedRowKeys
    },
    _selectionChangeRoute: function(item) {   
        _thisTableVRP._zoomSelectRoute(item)
    },
    _zoomSelectRoute: function() {
      var selectedRows = _thisTableVRP.selectedRows 
        if (selectedRows) {
            var geometry = JSON.parse(selectedRows[0].Geometry) ? JSON.parse(selectedRows[0].Geometry) : null
            if (geometry) {
              // Crear una nueva polilínea utilizando las coordenadas paths
              var polyline = new Polyline({
                  paths: geometry.paths,
                  spatialReference: _thisTableVRP.map.spatialReference
              });              
              _thisTableVRP.map.setExtent(polyline.getExtent().expand(1.5))
            }
        }
    },
    _selectionChangeStop: function(item) {
        _thisTableVRP._zoomSelectStop(item)
    },
    _zoomSelectStop: function(item) {
        if (item) {
            var geometry = JSON.parse(item.Geometry) ? JSON.parse(item.Geometry) : null
            if (geometry) {
                var point = new esri.geometry.Point(geometry.x, geometry.y, _thisTableVRP.map.spatialReference);
                // Definir el nivel de zoom deseado
                var zoomLevel = 15; // Modifica este valor según sea necesario
                // Centrar el mapa en el punto y aplicar el nivel de zoom
                _thisTableVRP.map.centerAndZoom(point, zoomLevel);
            }
        }
    },
    _zoomSelectOrdenes: function() { 
        var selectedRows = _thisTableVRP.selectedRows 
        if (selectedRows) {
            var geometry = JSON.parse(selectedRows[0].Geometry) ? JSON.parse(selectedRows[0].Geometry) : null
            if (geometry) {
                var point = new esri.geometry.Point(geometry.x, geometry.y, _thisTableVRP.map.spatialReference);
                // Definir el nivel de zoom deseado
                var zoomLevel = 15; // Modifica este valor según sea necesario
                // Centrar el mapa en el punto y aplicar el nivel de zoom
                _thisTableVRP.map.centerAndZoom(point, zoomLevel);
            }
        }
    },
    _zoomSelectOrdenesJO: function() { 
        var selectedRows = _thisTableVRP.selectedRows 
        if (selectedRows) {
            var geometry = JSON.parse(selectedRows[0].Geometry) ? JSON.parse(selectedRows[0].Geometry) : null
            if (geometry) {
                var point = new esri.geometry.Point(geometry.x, geometry.y, new esri.SpatialReference({ wkid: 4326, latestWkid: 4326 }));
                // Definir el nivel de zoom deseado
                var zoomLevel = 15; // Modifica este valor según sea necesario
                // Centrar el mapa en el punto y aplicar el nivel de zoom
                _thisTableVRP.map.centerAndZoom(point, zoomLevel);
            }
        }
    },
    CleanGrids: async function(){  
        // Limpiar el contenido del gridRutas
        var gridElement1 = $("#gridOrdenes");
        if (gridElement1[0].innerHTML != "") {
            var gridInstance1 = $("#gridOrdenes").dxDataGrid("instance");

            if (gridInstance1) {
                gridInstance1.option("dataSource", []); // Establecer una matriz vacía como origen de datos
                document.getElementById("widgetContainerBtn").style.display = "none";

                _thisTableVRP.map.removeLayer(_thisTableVRP.LayerOrdenes);

                 var $tabs = $("#withText").find(".dx-tab");
                // Iterar sobre cada pestaña y actualizar el texto
                $tabs.each(function(index, tab) {
                    if (index == 0) {                
                        var $span = $(tab).find(".dx-tab-text-span");
                        var originalText = $span[0].parentNode.innerText;
                        $span.text("Órdenes"); // Cambiar el texto agregando el número entre paréntesis
                    }
                });
            }
        }

        var gridElement2 = $("#gridRutas");
        if (gridElement2[0].innerHTML != "") {
            var gridInstance2 = $("#gridRutas").dxDataGrid("instance");

            if (gridInstance2) {
                gridInstance2.option("dataSource", []); // Establecer una matriz vacía como origen de datos
                 var $tabs = $("#withText").find(".dx-tab");
                // Iterar sobre cada pestaña y actualizar el texto
                $tabs.each(function(index, tab) {
                    if (index == 1) {                
                        var $span = $(tab).find(".dx-tab-text-span");
                        var originalText = $span[0].parentNode.innerText;
                        $span.text("Rutas"); // Cambiar el texto agregando el número entre paréntesis
                    }
                });
            }
        }

        var gridElement3 = $("#gridOrdenesA");
        if (gridElement3[0].innerHTML != "") {
            var gridInstance3 = $("#gridOrdenesA").dxDataGrid("instance");

            if (gridInstance3) {
                gridInstance3.option("dataSource", []); // Establecer una matriz vacía como origen de datos
                 var $tabs = $("#withText").find(".dx-tab");
                // Iterar sobre cada pestaña y actualizar el texto
                $tabs.each(function(index, tab) {
                    if (index == 2) {                
                        var $span = $(tab).find(".dx-tab-text-span");
                        var originalText = $span[0].parentNode.innerText;
                        $span.text("Órdenes Asignadas"); // Cambiar el texto agregando el número entre paréntesis
                    }
                });
            }
        }
        
        var gridElement4 = $("#gridOrdenesA");
        if (gridElement4[0].innerHTML != "") {
            var gridInstance4 = $("#gridOrdenesNoA").dxDataGrid("instance");

            if (gridInstance4) {
               gridInstance4.option("dataSource", []); // Establecer una matriz vacía como origen de datos
                var $tabs = $("#withText").find(".dx-tab");
                // Iterar sobre cada pestaña y actualizar el texto
                $tabs.each(function(index, tab) {
                    if (index == 3) {                
                        var $span = $(tab).find(".dx-tab-text-span");
                        var originalText = $span[0].parentNode.innerText;
                        $span.text("Órdenes No Asignadas"); // Cambiar el texto agregando el número entre paréntesis
                    }
                });
            }
        }
    },
    CleanGrids2: async function(){ 
        var gridElement2 = $("#gridRutas");
        if (gridElement2[0].innerHTML != "") {
            var gridInstance2 = $("#gridRutas").dxDataGrid("instance");

            if (gridInstance2) {
                gridInstance2.option("dataSource", []); // Establecer una matriz vacía como origen de datos
                 var $tabs = $("#withText").find(".dx-tab");
                // Iterar sobre cada pestaña y actualizar el texto
                $tabs.each(function(index, tab) {
                    if (index == 1) {                
                        var $span = $(tab).find(".dx-tab-text-span");
                        var originalText = $span[0].parentNode.innerText;
                        $span.text("Rutas"); // Cambiar el texto agregando el número entre paréntesis
                    }
                });
            }
        }

        var gridElement3 = $("#gridOrdenesA");
        if (gridElement3[0].innerHTML != "") {
            var gridInstance3 = $("#gridOrdenesA").dxDataGrid("instance");

            if (gridInstance3) {
                gridInstance3.option("dataSource", []); // Establecer una matriz vacía como origen de datos
                 var $tabs = $("#withText").find(".dx-tab");
                // Iterar sobre cada pestaña y actualizar el texto
                $tabs.each(function(index, tab) {
                    if (index == 2) {                
                        var $span = $(tab).find(".dx-tab-text-span");
                        var originalText = $span[0].parentNode.innerText;
                        $span.text("Órdenes Asignadas"); // Cambiar el texto agregando el número entre paréntesis
                    }
                });
            }
        }
        
        var gridElement4 = $("#gridOrdenesA");
        if (gridElement4[0].innerHTML != "") {
            var gridInstance4 = $("#gridOrdenesNoA").dxDataGrid("instance");

            if (gridInstance4) {
               gridInstance4.option("dataSource", []); // Establecer una matriz vacía como origen de datos
                var $tabs = $("#withText").find(".dx-tab");
                // Iterar sobre cada pestaña y actualizar el texto
                $tabs.each(function(index, tab) {
                    if (index == 3) {                
                        var $span = $(tab).find(".dx-tab-text-span");
                        var originalText = $span[0].parentNode.innerText;
                        $span.text("Órdenes No Asignadas"); // Cambiar el texto agregando el número entre paréntesis
                    }
                });
            }
        }
    },
    onOpen: function () {        
      var mPosition = {
        l: null,
        t: null
      };
      mPosition.h = 275;
      mPosition.w = 402;

      _thisTableVRP.getPanel().resize(mPosition);
    },

    onReceiveData: async function(name, source, params) {
      if (name === "VRP" && params.data.function === "_limpiarCountTabs") {
        await this._limpiarCountTabs();
        await this.CleanGrids2();
      }  
      if (name === "VRP" && params.data.function === "LoadTableOrders") {
        await this.LoadTableOrders(params.data.json, params.data.array, params.data.specialty);
      }      
      if (name === "VRP" && params.data.function === "ReLoadTableOrders") {
        await this.ReLoadTableOrders(params.data.array);
      }
      if (name === "VRP" && params.data.function === "LoadTableRoutes") {
        await this.LoadTableRoutes(params);
        await this.LoadTableOrdenesA(params);
        await this.LoadTableOrdenesNoA(params);
        await this.enableExportButton(true);
      } 
      if (name === "VRP" && params.data.function === "CleanGrids") {
        await this.CleanGrids();
        await this.enableExportButton(false);
      }   
    },

    onClose: function () {  
    }, 
    
  });
});
