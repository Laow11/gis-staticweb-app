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
define(['dojo/_base/declare', 'jimu/BaseWidget', 'jimu/utils', 'dijit/form/Button', 'esri/symbols/SimpleMarkerSymbol', 'esri/geometry/Point', 'esri/graphic', 
    'esri/layers/GraphicsLayer', 'esri/Color', 'dojo/on', 'dojo/_base/lang', 'esri/request', 'dojo/promise/all', 'dojo/_base/html', 'dojo/query', 'dojo/dom-style', 
    'dojo/Deferred', 'jimu/dijit/LoadingShelter', 'dijit/_WidgetsInTemplateMixin', 'esri/symbols/TextSymbol', "esri/symbols/Font", "esri/InfoTemplate", 
    'esri/symbols/jsonUtils', 'esri/dijit/PopupTemplate', "jimu/portalUtils", "dojo/_base/json", 
    "esri/layers/FeatureLayer", "dijit/_WidgetBase", "esri/tasks/Geoprocessor", "esri/IdentityManager", "dojo/Stateful", "dojo/_base/kernel", 
    "dojo/_base/array", "dojo/string", "jimu/portalUrlUtils", "esri/tasks/FeatureSet", "esri/geometry/Polyline", "esri/tasks/query", "esri/arcgis/Portal", 
    "dojo/_base/url", "./agp", "dojo/store/Memory", "dijit/form/FilteringSelect", "dijit/Dialog", "dojo/dom-construct", "esri/dijit/Popup", "dojo/dom", "esri/geometry/Polygon", 
    "esri/graphicsUtils", 'jimu/utils', "esri/renderers/UniqueValueRenderer", "esri/layers/LabelClass", "esri/renderers/SimpleRenderer", 'jimu/LayerInfos/LayerInfos',
    "./libs/sheetjs/exceljs.min"], 
function(declare, BaseWidget, utils, Button, SimpleMarkerSymbol, Point, Graphic, GraphicsLayer, Color, on, lang, esriRequest, all, html, dojoQuery, domStyle, 
    Deferred, LoadingShelter, _WidgetsInTemplateMixin, TextSymbol, Font, InfoTemplate, jsonUtils, PopupTemplate, portalUtils, json, FeatureLayer,
     _WidgetBase, Geoprocessor, IdentityManager, stateful, kernel, array, string, portalUrlUtils, FeatureSet, Polyline, Query, arcgisPortal, BaseUrl, agp, 
     Memory, FilteringSelect, Dialog, domConstruct, Popup, dom, Polygon, graphicsUtils, jimuUtils, UniqueValueRenderer, LabelClass, SimpleRenderer, LayerInfos,
     ExcelJS) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        name: 'VRP',
        baseClass: 'jimu-widget-VRP',
        urlServiceVRP: null,
        urlDataModel: null,
        outSpatialReference: null,
        JOrders: null,
        JDepots: null,
        JRoutes: null,
        JBreaks: null,
        JBarriersPoint: null,
        valTimeUnits: null,
        valDistanceUnits: null,
        valPopulateDirections: null,
        valDirectionsLanguage: null,
        valSaveOutputLayer: null,
        valSaveRouteData: null,
        valPopulateStopShapes: null,
        colorsResult: {},
        jobParams: null,
        outputName: "OutputName",
        itemParams: {},
        portalUrl: null,
        isOutputLayerItemUpdated: !1,
        gp: null,
        ActualJob: null,
        layerStopsResult: null,
        token: null,
        FeatureUrl: null,
        jsonStopData: null,
        jsonUnStopData: null,
        jsonRoutesData: null,
        jsonDirectionsData: null,
        featureLayer0: null,
        featureLayer1: null,
        featureLayer2: null,
        portalUser: null,
        serviceItemId: null,
        ID_INPUT_Orders: null,
        ID_INPUT_Params: null,
        ID_INPUT_Routes: null,
        ID_TB_Runs: null,
        ID_TB_Routes: null,
        ID_TB_Specialties: null,
        ID_out_unassigned_stops: null,
        ID_out_assigned_stops: null,
        ID_out_routes: null,
        ID_out_directions: null,
        ID_out_barriers_point: null,
        ID_TB_Use_Cases: null,
        ID_FC_Depots: null,
        runID: 0,
        caseID: 0,
        urlDashboardPortal: null,
        urlServiceMax: null,
        lastFetchedRunID: 0,
        dictionaryMsj: {},
        geometryCase: [],
        gExtentActual: null,
        erroresAddLayers: [],
        _outputName: "",
        _outputDesc: "",
        _DatosRoutes: null,
        _DatosDepots: null,
        depotsLayer: null,
        routesLayer: null,
        almuerzoChecked: false,
        _DatosDepotsAlmuerzo: null,
        valoresCheck: [],
        finishRun: false,
        arrayLayersRoutes: [],
        arrayLayersStops: [],
        arrayCases: [],
        dropdownCases: null,
        dropdownDStart: null,
        dropdownDEnd: null,
        depotsValues: [],
        arraySemana: [],
        dropdownSemanal: null,
        ExcelVRP: null,

        postCreate: function() {
            _thisVRP = this;
            _thisVRP.inherited(arguments);
            _thisVRP.urlDataModel = _thisVRP.config.URLS.urlDataModel;
            _thisVRP.urlDashboardPortal = _thisVRP.config.URLS.urlDashboardPortal;
            _thisVRP.urlServiceMax = _thisVRP.config.URLS.urlServiceMax;
            document.addEventListener("wheel", function(event) {
                if (document.activeElement.type === "number") {
                    document.activeElement.blur();
                }
            });
            var mPosition = {
                l: null,
                t: null
            };
            mPosition.h = 475;
            mPosition.w = 402;
            _thisVRP.getPanel().resize(mPosition);        
        },
        onOpen: function() {
            var selectElement = dijit.byId("stateSelect");
            if (selectElement) {
                selectElement.set('value', '');
            }
            var mPosition = {
                l: null,
                t: null
            };
            mPosition.h = 475;
            mPosition.w = 402;
            this.getPanel().resize(mPosition);            
        },
        startup: async function() {
            var ctx = _thisVRP;

            // Ajusta la posición del LoadingShelter
            dojo.style(ctx.shelterVRP.domNode, {
              top: "-100px",
            });

            ctx.shelterVRP.show(); 
            await ctx._getDatosInit();  
            await ctx._LoadCases();

            var mondays = await ctx.getUpcomingMondays();
            // Generar opciones para el dropdown
            var dropdownOptions = mondays.map(function(monday, index) {
                return { label: ctx.formatDate(monday), value: monday.toISOString() };
            });
                     
            ctx.arraySemana = [];
            dropdownOptions.forEach(opcion => {
                var jd = {
                        value: opcion.value,
                        name: opcion.label
                    }
                ctx.arraySemana.push(jd);
            });

            await ctx._loadFront();

            //this.portalUser = await this._signIn();
            this.lastFetchedRunID = 0;
            this.gExtentActual = null;
            this._DatosRoutes = null;
            this._DatosDepots = null;
        
           /* this.own(on(this.JsonBreaks, "change", lang.hitch(this, function(evt) {
                if (evt.srcElement.files.length > 0) {
                    var file = evt.srcElement.files[0];
                    
                    // Verificar si el archivo tiene una extensión .json
                    if (file.name.toLowerCase().endsWith(".json")) {
                        new Response(file).json().then(json => {
                            this.JBreaks = json;
                            this.statusBreaks.innerHTML = "";
                        }, err => {
                            this.JBreaks = null;
                            this.statusBreaks.style = "color: red;";
                            this.statusBreaks.innerHTML = "Error en el formato JSON con Breaks";
                            this.JsonBreaks.focus();
                        });
                    } else {
                        this.JBreaks = null;
                        this.statusBreaks.style = "color: red;";
                        this.statusBreaks.innerHTML = "Selecciona un archivo JSON válido";
                        this.JsonBreaks.value = ""; // Limpiar el valor del input
                    }
                } else {
                    this.JBreaks = null;
                    this.statusBreaks.innerHTML = "";
                }
            })));

            this.own(on(this.JsonBarriersPoint, "change", lang.hitch(this, function(evt) {                
                 if (evt.srcElement.files.length > 0) {
                    var file = evt.srcElement.files[0];
                    
                    // Verificar si el archivo tiene una extensión .json
                    if (file.name.toLowerCase().endsWith(".json")) {
                        new Response(file).json().then(json => {
                            this.JBarriersPoint = json;
                            this.statusBarriersPoint.innerHTML = "";
                        }, err => {
                            this.JBarriersPoint = null;
                            this.statusBarriersPoint.style = "color: red;";
                            this.statusBarriersPoint.innerHTML = "Error en el formato JSON con Barriers Point";
                            this.JsonBarriersPoint.focus();
                        });
                    } else {
                        this.JBarriersPoint = null;
                        this.statusBarriersPoint.style = "color: red;";
                        this.statusBarriersPoint.innerHTML = "Selecciona un archivo JSON válido";
                        this.JsonBarriersPoint.value = ""; // Limpiar el valor del input
                    }
                } else {
                    this.JBarriersPoint = null;
                    this.statusBarriersPoint.innerHTML = "";
                }
            })));
            */
            /*this.own(on(this.dropdownSemanal, "change", lang.hitch(this, async function(evt) {   
                this._generateCheckboxTable(this._DatosRoutes);
            })));*/

            this.own(on(this.map, 'update-end', lang.hitch(this, function() {
                if (true) {
                    LayerInfos.getInstance(ctx.map, ctx.map.itemInfo)
                    .then(lang.hitch(this, function(operLayerInfos) { 
                        ctx.operLayerInfos = operLayerInfos;
                    })); 
                    
                    var layerInfoArray = ctx.operLayerInfos.getLayerInfoArray();
                    array.forEach(layerInfoArray, function(layerInfo) {            
                        //var scaleRange = layerInfo.getScaleRange();                    
                        layerInfo.showLabels();
                    }, ctx);
                }
            })));
        }, 

        _btnExecuteJobs: async function(){
            var ctx = _thisVRP;
            var resultJOrders = this.JOrders;                         
            this.JDepots = null;                
            this.JRoutes = null;                
            this.dictionaryMsj = {};

            await this.removeAllLayers();              

            // FALTA VALIDACION PARA EL DROPDOWN DE CASES AL HACERCLICK EN BUTTON EJECUTAR
            var selectedValue = ctx.dropdownCases.dxSelectBox("instance").option("value");
            var dropdownCasesElement = $("#dropdownCases");
            if (selectedValue == null) {                    
                dropdownCasesElement.css("border-color", "red");
                dropdownCasesElement.focus();
                return;
            }
            else{
                dropdownCasesElement.css("border-color", "");
            }
            
            var selectedItem = ctx.arrayCases.find(function(item) {
                return item.value === selectedValue;
            });

            await this.getNameAndDesc(selectedItem.name);
            this.statusNombre.style = "color: black;"
            this.statusNombre.innerHTML = "<b>Nombre: </b>" + this._outputName + "  <b> &nbsp Descripción: </b>" + this._outputDesc;

            domStyle.set(this.MsjEjec1, "display", "none")    
            domStyle.set(this.msjSecctionFin, "display", "none")                                       
            domStyle.set(this.msjFeature, "display", "none")  
            domStyle.set(this.msjSecctionFinFeature, "display", "none")    
            domStyle.set(this.MsjSalidas, "display", "none")
            //domStyle.set(this.MsjSalidasURL1, "display", "none")
            domStyle.set(this.MsjSalidasURL2, "display", "none")    
            
            if (resultJOrders == null) {
                this.statusJsonOrders.style = "color: red;"
                this.statusJsonOrders.innerHTML = "Debe cargar el .json con Orders";
                this.JsonOrders.focus();
                return
            } else {
                await this._eliminarFeaturesAlmuerzo();
                //this.statusJsonOrders.innerHTML = "";
            }

            var resultJDepots = await this.createLayersDepots();                
            this.JDepots = resultJDepots;                

            // Obtener todos los checkboxes en el cuerpo de la tabla
            var checkboxes = document.querySelectorAll('#checkboxGrid input[type="checkbox"]');

            // Verificar si al menos uno está seleccionado
            var alMenosUnoSeleccionado = Array.from(checkboxes).some(function(checkbox) {
                return checkbox.checked;
            });

            // Mostrar un mensaje si no hay ninguno seleccionado
            if (!alMenosUnoSeleccionado) {
                this.statusRoutes.style = "color: red;"
                this.statusRoutes.innerHTML = "Debe seleccionar al menos una día";
                // Agregar enfoque (focus) a la tabla  
                var tabla = document.querySelector('.custom-table');                  
                var primerCheckbox = tabla.querySelector('input[type="checkbox"]');
                if (primerCheckbox) {
                    primerCheckbox.focus();
                } else {
                    // Si no hay un checkbox, intenta enfocar la tabla directamente
                    tabla.focus();
                }

                return
            }
            else{
                this.statusRoutes.innerHTML = "";
            }

            var resultJRoutes = await this.createLayersRoutes();
            var pp2 = JSON.stringify(resultJRoutes);

            this.JRoutes = resultJRoutes;  
            
                         
            this._DatosDepotsAlmuerzo = null;
            var valorSeleccionado = ctx.dropdownDAlm.dxSelectBox("instance").option("value");
            var loadDA = await this._LoadDepotsAlmuerzo(valorSeleccionado); 

            var checkBoxInstance = $("#myCheckBoxAlm").dxCheckBox("instance");
            var isChecked = checkBoxInstance.option("value");
            if (isChecked) {
                var loadOrder = await this._cargarNewOrder(this.valoresCheck);
            }                        
            
            var valTimeUnits = $("#TimeUnitsInput").dxTextBox("instance").option("value");
            this.valTimeUnits = valTimeUnits;

            var valDistanceUnits = $("#DistanceUnitsInput").dxTextBox("instance").option("value");
            this.valDistanceUnits = valDistanceUnits;

            var valPopulateDirections = $("#PopulateDirectionsInput").dxTextBox("instance").option("value");
            this.valPopulateDirections = valPopulateDirections;

            var valDirectionsLanguage = $("#DirectionsLanguageInput").dxTextBox("instance").option("value");
            this.valDirectionsLanguage = valDirectionsLanguage;

            var valSaveRouteData = $("#SaveRouteDataInput").dxTextBox("instance").option("value");
            this.valSaveRouteData = valSaveRouteData;
            
            //VALIDAR TODO ACA ANTES DE ENVIAR
            this.MsjEjec1.innerHTML = "";
            /*
            domStyle.set(this.divPlanar1, "display", "none")
            domStyle.set(this.divPlanar3, "display", "none")
            domStyle.set(this.divPlanar5, "display", "none")
            domStyle.set(this.divPlanar6, "display", "none")
            domStyle.set(this.divPlanar0, "display", "none")
            domStyle.set(this.divPlanar2, "display", "none")
            domStyle.set(this.divPlanar4, "display", "none")
            */
            domStyle.set(this.divMsj, "display", "block")
            domStyle.set(this.MsjEjec, "display", "block")
            domStyle.set(this.MsjEjec1, "display", "block")
            domStyle.set(this.VRPLoad, "display", "block")

            domStyle.set(this.MsjSalidas, "display", "none")
            //domStyle.set(this._nameFolderRow, "display", "none")
            //domStyle.set(this.MsjSalidasURL1, "display", "none")
            domStyle.set(this.MsjSalidasURL2, "display", "none")

            //Ejecutar VRP  
            await this.getDatosCases(selectedItem.value);   

            var dxButtonEJ = $("#btnEjecutar").dxButton("instance");
            dxButtonEJ.option("disabled", true);

            var dxEnviarNov = $("#btnEnviarNov").dxButton("instance");
            dxEnviarNov.option("disabled", true);

            this.executeJob(resultJOrders, resultJDepots, resultJRoutes);
        },
        _GenerateJson: async function(){
            var ctx = _thisVRP;
            if (ctx.ExcelVRP) {

                let worksheet = ctx.ExcelVRP;
                let features = [];
                let headerMap = {}; // Mapeo de nombres de columna a índices

                const requiredColumns = [
                    "SpecialtyNames", "Aviso (OID)", "Orden (WO ID)", "Clase de orden", 
                    "Texto breve", "Ubicac-técnica", 
                    "Latitud", "Longitud", "Revenue", "ServiceTime"
                ];

                // Cargar la cabecera desde la primera fila del worksheet
                worksheet.getRow(1).eachCell((cell, colNumber) => {
                    const columnName = cell.value?.toString().trim(); // Convertir el nombre de la columna a string y eliminar espacios extra
                    if (columnName) {
                        headerMap[columnName] = colNumber; // Asignar índice de columna en headerMap
                    }
                });

                // Validar que todas las columnas requeridas estén presentes en headerMap
                const missingColumns = requiredColumns.filter(col => !(col in headerMap));
                
                if (missingColumns.length > 0) {
                    domStyle.set(ctx.VRPLoad3, "display", "none")
                    _thisVRP.statusJsonOrders.style = "color: red;"
                    _thisVRP.statusJsonOrders.innerHTML = "El archivo Excel no tiene las siguientes columnas requeridas: " +  missingColumns.join(", ");
                    return
                }
                
                // Procesar las filas a partir de la segunda
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Omitir la cabecera

                    let feature = {
                        "attributes": {
                            "arrivetime": null,
                            "violationtime": 0E-8,
                            "cumulwaittime": 0E-8,
                            "curbapproach": 0,
                            "violatedconstraints": null,
                            "departtime": null,
                            "revenue": row.getCell(headerMap["Revenue"])?.value || 0,
                            "timewindowstart1": null,
                            "timewindowend1": null,
                            "posalong": 1,
                            "maxviolationtime1": null,
                            "specialtynames": row.getCell(headerMap["SpecialtyNames"])?.value || null,
                            "cumulviolationtime": 0E-8,
                            "routename": null,
                            "servicetime": row.getCell(headerMap["ServiceTime"])?.value || 0,
                            "maxviolationtime2": null,
                            "sourceid": 0,
                            "waittime": 0E-8,
                            "usecaseid": 0,
                            "sequence": null,
                            "name": row.getCell(headerMap["Orden (WO ID)"])?.value.toString() || "",
                            "objectid": row.getCell(headerMap["Aviso (OID)"])?.value || 0,
                            "assignmentrule": 3,
                            "status": 0
                        },
                        "geometry": {
                            "x": row.getCell(headerMap["Longitud"])?.value || 0,
                            "y": row.getCell(headerMap["Latitud"])?.value || 0
                        }
                    };

                    // Agregar cada feature al array
                    features.push(feature);
                });
                
                let jsonOutput = {
                    "hasZ": false,
                    "features": features,
                    "exceededTransferLimit": false,
                    "hasM": false,
                    "objectIdFieldName": "objectid",
                    "fields": [
                        { "defaultValue": null, "type": "esriFieldTypeOID", "modelName": "objectid", "name": "objectid", "alias": "OBJECTID" },
                        { "modelName": "name", "defaultValue": null, "name": "name", "length": 500, "alias": "Name", "type": "esriFieldTypeString" },
                        { "modelName": "servicetime", "defaultValue": null, "name": "servicetime", "alias": "ServiceTime", "type": "esriFieldTypeDouble" },
                        { "modelName": "timewindowstart1", "defaultValue": null, "name": "timewindowstart1", "length": 29, "alias": "TimeWindowStart1", "type": "esriFieldTypeDate" },
                        { "modelName": "timewindowend1", "defaultValue": null, "name": "timewindowend1", "length": 29, "alias": "TimeWindowEnd1", "type": "esriFieldTypeDate" },
                        { "modelName": "maxviolationtime1", "defaultValue": null, "name": "maxviolationtime1", "alias": "MaxViolationTime1", "type": "esriFieldTypeDouble" },
                        { "modelName": "maxviolationtime2", "defaultValue": null, "name": "maxviolationtime2", "alias": "MaxViolationTime2", "type": "esriFieldTypeDouble" },
                        { "modelName": "revenue", "defaultValue": null, "name": "revenue", "alias": "Revenue", "type": "esriFieldTypeDouble" },
                        { "modelName": "specialtynames", "defaultValue": null, "name": "specialtynames", "length": 1024, "alias": "SpecialtyNames", "type": "esriFieldTypeString" },
                        { "modelName": "assignmentrule", "defaultValue": null, "name": "assignmentrule", "alias": "AssignmentRule", "type": "esriFieldTypeInteger" },
                        { "modelName": "routename", "defaultValue": null, "name": "routename", "length": 1024, "alias": "RouteName", "type": "esriFieldTypeString" },
                        { "modelName": "sequence", "defaultValue": null, "name": "sequence", "alias": "Sequence", "type": "esriFieldTypeInteger" },
                        { "modelName": "arrivetime", "defaultValue": null, "name": "arrivetime", "length": 29, "alias": "ArriveTime", "type": "esriFieldTypeDate" },
                        { "modelName": "departtime", "defaultValue": null, "name": "departtime", "length": 29, "alias": "DepartTime", "type": "esriFieldTypeDate" },
                        { "modelName": "violationtime", "defaultValue": null, "name": "violationtime", "alias": "ViolationTime", "type": "esriFieldTypeDouble" },
                        { "modelName": "status", "defaultValue": null, "name": "status", "alias": "Status", "type": "esriFieldTypeInteger" },
                        { "modelName": "usecaseid", "defaultValue": null, "name": "usecaseid", "alias": "UseCaseID", "type": "esriFieldTypeSmallInteger" }
                    ],
                    "spatialReference": {
                        "latestWkid": 4326,
                        "wkid": 4326
                    },
                    "geometryType": "esriGeometryPoint"
                };

                ctx.JOrders = jsonOutput;
            } else {
                console.error("La hoja ExcelVRP no se ha cargado correctamente.");
            }
            
        },
        _loadFront: async function() {
            var ctx = _thisVRP;

            var btnCargarOrdenes = $("#btnOrdenes").dxButton({
                elementAttr: {
                    id: "btnCargarOrdenes" // Agregar el ID al checkbox
                },
                text: "Cargar Órdenes",
                stylingMode: "outlined",
                buttonOptions: {
                    stylingMode: "outlined", // Establecer el modo de estilo del botón interno como "outlined" para asegurar que se muestre el borde
                    border: {
                        color: "#0078D4" // Color del borde del botón
                    }
                },
                disabled: true,
                onClick: async function(args) {
                    var vr = args.validationGroup.validate();
                    if (vr.brokenRules.length > 0) {
                        return;
                    }
                    domStyle.set(ctx.VRPLoad3, "display", "block")

                    await ctx._callToServiceMax();
                    await ctx._cargarTableOrdenes();
                }
            }).dxButton("instance");

            var btnUploadButton = $("#uploadButton").dxButton({
                elementAttr: {
                    id: "btnUploadButton" // Agregar el ID al checkbox
                },
                text: "Cargar Excel",
                stylingMode: "outlined",
                buttonOptions: {
                    stylingMode: "outlined", // Establecer el modo de estilo del botón interno como "outlined" para asegurar que se muestre el borde
                    border: {
                        color: "#0078D4" // Color del borde del botón
                    }
                },
                //disabled: true,
                onClick: async function(args) {
                    var vr = args.validationGroup.validate();
                    if (vr.brokenRules.length > 0) {
                        return;
                    }
                    

                    document.getElementById('excelInput').click();
                }
            }).dxButton("instance");

            /*document.getElementById('uploadButton').addEventListener('click', function() {
                document.getElementById('excelInput').click();
            });*/
            document.getElementById('excelInput').addEventListener('change', async function (event) {
                var file = event.target.files[0];
                if (file) {
                    _thisVRP.statusJsonOrders.innerHTML = "";
                    domStyle.set(ctx.VRPLoad3, "display", "block")
                    var reader = new FileReader();
                    reader.onload = async function (event) {
                        var arrayBuffer = event.target.result;
                        var workbook = new ExcelJS.Workbook();

                        try {
                            // Cargar el archivo Excel
                            await workbook.xlsx.load(arrayBuffer).then(workbook => {
                                // Procesar las hojas de trabajo
                                ctx.ExcelVRP = workbook.getWorksheet("Hoja1");
                            });
                        } catch (error) {
                            domStyle.set(ctx.VRPLoad3, "display", "none")
                            _thisVRP.statusJsonOrders.style = "color: red;";
                            _thisVRP.statusJsonOrders.innerHTML = "ERROR, no se encontró la hoja 'Hoja1' en el archivo Excel";
                            console.error('Error al cargar el workbook:', error);
                        } finally {
                            _thisVRP.statusJsonOrders.style = "color: black;";
                            _thisVRP.statusJsonOrders.innerHTML = "";
                            //clearInterval(progressInterval); // Detener el intervalo de progreso una vez que se complete la carga

                            // Verificar si las hojas existen
                            if (!ctx.ExcelVRP) {
                                domStyle.set(ctx.VRPLoad3, "display", "none")
                                _thisVRP.statusJsonOrders.style = "color: red;";
                                _thisVRP.statusJsonOrders.innerHTML = "ERROR, no se encontró la hoja 'Hoja1' en el archivo Excel";
                                console.error('No se encontró la hoja "Hoja1" en el archivo Excel.');
                            }
                            else{
                                _thisVRP.statusJsonOrders.style = "color: black;";
                                _thisVRP.statusJsonOrders.innerHTML = "";
                                await ctx._GenerateJson();

                                if (_thisVRP.statusJsonOrders.innerHTML != "") {
                                    return
                                }
                                else{
                                    await ctx._cargarTableOrdenes();
                                }
                            }
                            // Restablecer el input para permitir volver a seleccionar el mismo archivo
                            document.getElementById('excelInput').value = "";
                        }
                    };

                    reader.readAsArrayBuffer(file);  // Leer el archivo como ArrayBuffer
                }

                /*var file = event.target.files[0];
                if (file) {
                    domStyle.set(ctx.VRPLoad3, "display", "block")
                    await ctx._callToServiceMax();
                    await ctx._cargarTableOrdenes();
                }*/
            });
            // Cambiar el color del texto y el fondo del botón
            /*$("#btnCargarOrdenes").css({
                "color": "white", // Color del texto
                "background-color": "#03a9f4", // Color del fondo
            });*/
             // Crear el checkbox para Almuerzo
            var myDivAl = $("#myDivAlmuerzo");
            var checkBoxInstance = $("<div>").addClass("rightAl").dxCheckBox({
                elementAttr: {
                    id: "myCheckBoxAlm" // Agregar el ID al checkbox
                },
                value: false, // Valor inicial del checkbox
                onValueChanged: function(data) {
                    // Manejar el evento de cambio del checkbox
                    var newValue = data.value;
                    ctx._DatosDepotsAlmuerzo = null;                    
                    if (newValue) {
                        domStyle.set(ctx.divAlmuerzoDropDown, "display", "block");
                    } else {
                        domStyle.set(ctx.divAlmuerzoDropDown, "display", "none")
                    }
                }
            }).dxCheckBox("instance");
            myDivAl.addClass("rowAl").append(checkBoxInstance.element());

            // Generar el input number ServiceTime
            var serviceTimeInput = $("<div>").addClass("rightAl").dxNumberBox({
                elementAttr: {
                    id: "serviceTimeInput" // Asignar un ID al input
                },
                value: 45, // Valor por defecto
                min: 0, // Valor mínimo permitido
                step: 1 // Incremento/decremento
            });
            $("#myDivST").addClass("rowAl").append(serviceTimeInput);

            // Generar el input number StartDepotServiceTime
            var StartDepotServiceTimeInput = $("<div>").addClass("rightAl").dxNumberBox({
                elementAttr: {
                    id: "StartDepotServiceTimeInput" // Asignar un ID al input
                },
                value: 15, // Valor por defecto
                min: 0, // Valor mínimo permitido
                step: 1 // Incremento/decremento
            });
            $("#myDivStartDepot").addClass("rowAl").append(StartDepotServiceTimeInput);

            // Generar el input number EndDepotServiceTime
            var EndDepotServiceTimeInput = $("<div>").addClass("rightAl").dxNumberBox({
                elementAttr: {
                    id: "EndDepotServiceTimeInput" // Asignar un ID al input
                },
                value: 15, // Valor por defecto
                min: 0, // Valor mínimo permitido
                step: 1 // Incremento/decremento
            });
            $("#myDivEndDepot").addClass("rowAl").append(EndDepotServiceTimeInput);

            // Generar el input number MaxTotalTime
            var MaxTotalTimeInput = $("<div>").addClass("rightAl").dxNumberBox({
                elementAttr: {
                    id: "MaxTotalTimeInput" // Asignar un ID al input
                },
                value: 540, // Valor por defecto
                min: 0, // Valor mínimo permitido
                step: 1 // Incremento/decremento
            });
            $("#myDivMaxTotal").addClass("rowAl").append(MaxTotalTimeInput);

            // Generar el input number MaxTotalTime
           /* var OverTimeStarTime = $("<div>").addClass("rightAl").dxNumberBox({
                elementAttr: {
                    id: "OverTimeStarTime" // Asignar un ID al input
                },
                value: 480, // Valor por defecto
                min: 0, // Valor mínimo permitido
                step: 1 // Incremento/decremento
            });
            $("#myDivOverTime").addClass("rowAl").append(OverTimeStarTime);*/

            // Crear el primer dxDateBox para StartTime
            var defaultStartTime = new Date();
            defaultStartTime.setHours(12);
            defaultStartTime.setMinutes(0);

            // Valor por defecto para EndTime (por ejemplo, 17:00)
            var defaultEndTime = new Date();
            defaultEndTime.setHours(13);
            defaultEndTime.setMinutes(15);

            var startTimeDateBox = $("<div>").addClass("rightAl").dxDateBox({
                elementAttr: {
                    id: "timeStart" // Agregar el ID al checkbox
                },
                type: "time",
                displayFormat: "HH:mm",
                value: defaultStartTime,
                pickerType: "rollers", // Tipo de selector
            });

            // Crear el segundo dxDateBox para EndTime
            var endTimeDateBox = $("<div>").addClass("rightAl").dxDateBox({
                elementAttr: {
                    id: "timeEnd" // Agregar el ID al checkbox
                },
                type: "time",
                displayFormat: "HH:mm",
                value: defaultEndTime,
                pickerType: "rollers", // Tipo de selector
            });

            // Agregar los contenedores al div principal
            $("#myDivTimeS").addClass("rowAl").append(startTimeDateBox);
            $("#myDivTimeE").addClass("rowAl").append(endTimeDateBox);

            //DrodDown Cases
            ctx.dropdownCases = $("<div>").attr("id", "dropdownCases").dxSelectBox({
                dataSource: ctx.arrayCases,
                displayExpr: "name", // Propiedad a mostrar como nombre
                valueExpr: "value", // Propiedad a utilizar como valor
                placeholder: "Seleccionar...",
                onValueChanged: async function(data) {
                    if (data.value != null) {
                        await ctx._changeComboDepotCases(data);
                    }
                    
                }
            }).dxValidator({  
                validationRules: [{ type: 'required' }]  
            });
            $("#dropdownContainer").append(ctx.dropdownCases);

            //DropDown Depot Almuerzo   
            ctx.dropdownDAlm = $("<div>").attr("id", "dropdownDAlm").dxSelectBox({
                dataSource: [],
                displayExpr: "name", // Propiedad a mostrar como nombre
                valueExpr: "value", // Propiedad a utilizar como valor
                placeholder: "Seleccionar...",
            }).dxValidator({  
                validaDropDownCases: [{ type: 'required' }]  
            });
            var ddDAlmContainer = $("<div>").appendTo("#ddDAlmContainer");
            ctx.dropdownDAlm.appendTo(ddDAlmContainer);

            //DropDown Depot Start   
            ctx.dropdownDStart = $("<div>").attr("id", "dropdownDStart").dxSelectBox({
                dataSource: [],
                displayExpr: "name", // Propiedad a mostrar como nombre
                valueExpr: "value", // Propiedad a utilizar como valor
                placeholder: "Seleccionar...",
            }).dxValidator({  
                validaDropDownCases: [{ type: 'required' }]  
            });
            var ddDStartContainer = $("<div>").appendTo("#ddDStartContainer");
            ctx.dropdownDStart.appendTo(ddDStartContainer);

            //DropDown Depot End   
            ctx.dropdownDEnd = $("<div>").attr("id", "dropdownDEnd").dxSelectBox({
                dataSource: [],
                displayExpr: "name", // Propiedad a mostrar como nombre
                valueExpr: "value", // Propiedad a utilizar como valor
                placeholder: "Seleccionar...",
            }).dxValidator({  
                validaDropDownCases: [{ type: 'required' }]  
            });
            var ddDEndContainer = $("<div>").appendTo("#ddDEndContainer");
            ctx.dropdownDEnd.appendTo(ddDEndContainer);   

            //DrodDown Semanal
            ctx.dropdownSemanal = $("<div>").attr("id", "dropdownSemanal").dxSelectBox({
                dataSource: ctx.arraySemana,
                displayExpr: "name", // Propiedad a mostrar como nombre
                valueExpr: "value", // Propiedad a utilizar como valor
                placeholder: "Seleccionar...",
                value: ctx.arraySemana[0].value,
                onValueChanged: async function(data) {
                    if (data.value != null && ctx._DatosRoutes != null) {
                       await ctx._generateCheckboxTable(ctx._DatosRoutes);
                    }
                    
                    var arrayValues = await ctx.loadValuesTableRoutes();
                    ctx.publishData({
                    'target':"TableVRP",
                    'data': {json: this.JOrders, function: "ReLoadTableOrders", array: arrayValues}
                    }); 

                }
            }).dxValidator({  
                validationRules: [{ type: 'required' }]  
            });
            $("#ddSemanaContainer").append(ctx.dropdownSemanal);

            //Colapsable Opcionales
            var collOp = document.getElementsByClassName("collapsibleOp");
            var icons = document.getElementsByClassName("iconOp");

            // Iterar sobre los botones colapsables
            for (var i = 0; i < collOp.length; i++) {
                collOp[i].addEventListener("click", function() {
                    // Alternar la visibilidad del contenido cuando se hace clic en el botón
                    this.classList.toggle("active");
                    var content = this.nextElementSibling;
                    if (content.style.display === "block") {
                      content.style.display = "none";
                      // Cambiar el icono a '+' cuando se cierra el colapsable
                      this.querySelector(".iconOp").textContent = "+";
                    } else {
                      content.style.display = "block";
                      // Cambiar el icono a '-' cuando se abre el colapsable
                      this.querySelector(".iconOp").textContent = "-";
                    }
                });
            }   

            //Colapsable Valores
            var collVal = document.getElementsByClassName("collapsibleVal");
            var iconsVal = document.getElementsByClassName("iconVal");

            // Iterar sobre los botones colapsables
            for (var i = 0; i < collVal.length; i++) {
                collVal[i].addEventListener("click", function() {
                    // Alternar la visibilidad del contenido cuando se hace clic en el botón
                    this.classList.toggle("active");
                    var content = this.nextElementSibling;
                    if (content.style.display === "block") {
                      content.style.display = "none";
                      // Cambiar el icono a '+' cuando se cierra el colapsable
                      this.querySelector(".iconVal").textContent = "+";
                    } else {
                      content.style.display = "block";
                      // Cambiar el icono a '-' cuando se abre el colapsable
                      this.querySelector(".iconVal").textContent = "-";
                    }
                });
            }  

            // Generar el input number TimeUnits
           var TimeUnitsInput = $("<div>").addClass("rightAl").dxTextBox({
                elementAttr: {
                    id: "TimeUnitsInput" // Asignar un ID al input
                },
                value: "Minutes", // Valor por defecto
            }).dxValidator({  
                validationRules: [{ type: 'required' }]  
            });
            $("#myDivTimeUnits").addClass("rowAl").append(TimeUnitsInput);

            // Generar el input number DistanceUnits
           var DistanceUnitsInput = $("<div>").addClass("rightAl").dxTextBox({
                elementAttr: {
                    id: "DistanceUnitsInput" // Asignar un ID al input
                },
                value: "Meters", // Valor por defecto
            }).dxValidator({  
                validationRules: [{ type: 'required' }]  
            });
            $("#myDivDistanceUnits").addClass("rowAl").append(DistanceUnitsInput);

            // Generar el input number PopulateDirections
           var PopulateDirectionsInput = $("<div>").addClass("rightAl").dxTextBox({
                elementAttr: {
                    id: "PopulateDirectionsInput" // Asignar un ID al input
                },
                value: "false" // Valor por defecto
            }).dxValidator({  
                validationRules: [{ type: 'required' }]  
            });
            $("#myDivPopulateDirections").addClass("rowAl").append(PopulateDirectionsInput);

            // Generar el input number PopulateStopShapes
           var PopulateStopShapesInput = $("<div>").addClass("rightAl").dxTextBox({
                elementAttr: {
                    id: "PopulateStopShapesInput" // Asignar un ID al input
                },
                value: "true" // Valor por defecto
            }).dxValidator({  
                validationRules: [{ type: 'required' }]  
            });
            $("#myDivPopulateStopShapes").addClass("rowAl").append(PopulateStopShapesInput);

            // Generar el input number DirectionsLanguage
           var DirectionsLanguageInput = $("<div>").addClass("rightAl").dxTextBox({
                elementAttr: {
                    id: "DirectionsLanguageInput" // Asignar un ID al input
                },
                value: "es" // Valor por defecto
            }).dxValidator({  
                validationRules: [{ type: 'required' }]  
            });
            $("#myDivDirectionsLanguage").addClass("rowAl").append(DirectionsLanguageInput);

            // Generar el input number SaveOutputLayer
           var SaveOutputLayerInput = $("<div>").addClass("rightAl").dxTextBox({
                elementAttr: {
                    id: "SaveOutputLayerInput" // Asignar un ID al input
                },
                value: "false" // Valor por defecto
            }).dxValidator({  
                validationRules: [{ type: 'required' }]  
            });
            $("#myDivSaveOutputLayer").addClass("rowAl").append(SaveOutputLayerInput);

            // Generar el input number SaveRouteData
           var SaveRouteDataInput = $("<div>").addClass("rightAl").dxTextBox({
                elementAttr: {
                    id: "SaveRouteDataInput" // Asignar un ID al input
                },
                value: "false" // Valor por defecto
            }).dxValidator({  
                validationRules: [{ type: 'required' }]  
            });
            $("#myDivSaveRouteData").addClass("rowAl").append(SaveRouteDataInput);

            //BOTON EJECUTAR VRP
            var btnEjecutar = $("#ddbtnEjecutar").dxButton({
                elementAttr: {
                    id: "btnEjecutar" // Agregar el ID al checkbox
                },
                text: "Ejecutar VRP",
                stylingMode: "outlined",
                buttonOptions: {
                    stylingMode: "outlined", // Establecer el modo de estilo del botón interno como "outlined" para asegurar que se muestre el borde
                    border: {
                        color: "#0078D4" // Color del borde del botón
                    }
                },
                disabled: true,
                onClick: async function(args) {
                    var vr = args.validationGroup.validate();
                    if (vr.brokenRules.length > 0) {
                        return;
                    }

                    var fieldNameToRemove = "Geometry";
                    // Buscamos el índice del campo a eliminar
                    var indexToRemove = -1;
                    for (var i = 0; i < ctx.JOrders.fields.length; i++) {
                        if (ctx.JOrders.fields[i].name === fieldNameToRemove) {
                            indexToRemove = i;
                            break;
                        }
                    }
                    // Si se encontró el campo, lo eliminamos
                    if (indexToRemove !== -1) {
                        ctx.JOrders.fields.splice(indexToRemove, 1);
                    }
                    ctx.publishData({
                    'target':"TableVRP",
                    'data': {function: "_limpiarCountTabs"}
                    }); 
                    await ctx._btnExecuteJobs();
                }
            }).dxButton("instance");

            // Cambiar el color del texto y el fondo del botón
            /*$("#btnEjecutar").css({
                "color": "white", // Color del texto
                "background-color": "#03a9f4", // Color del fondo
                "transition": "background-color 0.3s, color 0.3s" // Agregar transición suave
            });*/

            //BOTON ENVIAR novedades
            var btnEnviarNov = $("#ddbtnEnviar").dxButton({
                elementAttr: {
                    id: "btnEnviarNov" // Agregar el ID al checkbox
                },
                text: "Actualizar Órdenes",
                stylingMode: "outlined", // Establecer el modo de estilo a "outlined" para tener un borde visible
                buttonOptions: {
                    stylingMode: "outlined", // Establecer el modo de estilo del botón interno como "outlined" para asegurar que se muestre el borde
                    border: {
                        color: "#0078D4" // Color del borde del botón
                    }
                },
                disabled: true,
                onClick: async function(args) {
                }
            }).dxButton("instance");
        }, 
        _callToServiceMax: async function(){
            var ctx = _thisVRP;
            var selectedValueS = ctx.dropdownCases.dxSelectBox("instance").option("value");
            var itemCase = null;
            var query = "";
            switch (selectedValueS) {
                case 1: //Recorredores_ET
                    query = "usecaseid = 1";
                    break;
                case 2: //Recorredores_FdP
                    query = "usecaseid = 2";
                    break;
                case 3: //Mecanico_ET
                    query = "usecaseid = 3";
                    break;
                case 4: //Mecanico_FdP
                    query = "usecaseid = 4";
                    break;
                case 5: //Mecanico_FdP
                    query = "usecaseid = 5";
                    break;
                case 6: //Mecanico_FdP
                    query = "usecaseid = 6";
                    break;
            }
            
            ctx.token = IdentityManager.credentials[0].token;
            var serviceUrl = _thisVRP.urlServiceMax + "/0/query";
            var params = {
                where: query, // Siempre devuelve todos los registros
                outFields: "*", // Campo del que deseas obtener el último valor
                f: "json"
            };
            
            await esriRequest({
                url: serviceUrl,
                token: ctx.token,
                content: params,
                handleAs: "json"
            }, {
                usePost: !0
            }).then(function(response) { 
                ctx.JOrders = response;  
            }).otherwise(function(error) {                 
                return;
            });;   
        },

        _cargarTableOrdenes: async function(){
            var ctx = _thisVRP;
            this.statusJsonOrders.innerHTML = "";

            var infoOrders = await this._getInfoJsonOrders(this.JOrders);

            this.statusJsonOrders.style = "color: black;";
            this.statusJsonOrders.innerHTML = "Cantidad de órdenes: " + infoOrders.CantidadOrders + "<br>" + "Tiempo de Servicio: " + infoOrders.TotalServiceTime.horas + " Horas " + infoOrders.TotalServiceTime.minutos + " Minutos";
            
            var arrayValues = ctx.loadValuesTableRoutes();
            ctx.publishData({
            'target':"TableVRP",
            'data': {json: this.JOrders, function: "LoadTableOrders", array: arrayValues, specialty: ctx.arraySpecialties}
            }); 

            ctx.dropdownCases.dxSelectBox("option", "disabled", true);

            var containerBtn = document.getElementById("contBtnReload");

            // Verificar si ya existe un botón dentro del contenedor
            var existingBtn = document.getElementById("btnReload");

            if (!existingBtn && containerBtn) {
                // Crear el nuevo div para el botón de recargar
                var newDiv = document.createElement("div");
                newDiv.className = "dx-item dx-toolbar-item dx-toolbar-button dx-toolbar-item-auto-hide dx-toolbar-text-auto-hide";
                newDiv.id = "btnReload"; // Añadir ID al nuevo div

                // Crear el contenido del nuevo div
                var divContent = '<div class="dx-item-content dx-toolbar-item-content">' +
                    '<div class="dx-widget dx-button dx-button-mode-text dx-button-normal dx-button-has-text dx-button-has-icon dx-datagrid-toolbar-button dx-edit-button dx-datagrid-cancel-button" role="button" aria-label="Discard changes" title="Cancelar" tabindex="-1">' +
                    '<div class="dx-button-content">' +
                    '<i class="dx-icon dx-icon-undo"></i>' +
                    '<span class="dx-button-text">Cancelar</span>' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                // Asignar el contenido al nuevo div
                newDiv.innerHTML = divContent;

                // Agregar el nuevo div al contenedor
                containerBtn.appendChild(newDiv);

                document.getElementById("contBtnReload").style.display = "block";
            } else {
                 document.getElementById("contBtnReload").style.display = "block";
            }

            $('#btnReload').off('click').on('click', async function() { 

                ctx.publishData({
                'target':"TableVRP",
                'data': {json: {}, function: "CleanGrids"}
                }); 
                localStorage.clear();
                await ctx.removeAllLayers();

                ctx._DatosRoutes = null;
                ctx._DatosDepots = null;

                //var dxButtonCO = $("#btnCargarOrdenes").dxButton("instance");
                //dxButtonCO.option("disabled", false);

                var dxEnviarNov = $("#btnEnviarNov").dxButton("instance");
                dxEnviarNov.option("disabled", true);

                ctx.dropdownCases.dxSelectBox("option", "disabled", false);
                ctx.dropdownCases.dxSelectBox("instance").option("value", null);

                ctx.dropdownDStart.dxSelectBox("instance").option("value", null);
                ctx.dropdownDEnd.dxSelectBox("instance").option("value", null);
                ctx.dropdownDAlm.dxSelectBox("instance").option("value", null);   

                ctx.statusJsonOrders.innerHTML = "";
                ctx.JOrders = null;
                ctx.JDepots = null;
                ctx.JRoutes = null;
                //var inputJsonBreaks = document.getElementById("JsonBreaks");
                //inputJsonBreaks.value = "";
                ctx.JBreaks = null;
                //ctx.statusBreaks.innerHTML = "";
                //var inputJsonBarriersPoint = document.getElementById("JsonBarriersPoint");
                //inputJsonBarriersPoint.value = "";
                ctx.JBarriersPoint = null;
                ctx.statusBarriersPoint.innerHTML = "";

                ctx._outputName = "";
                ctx._outputDesc = "";
                ctx.statusNombre.innerHTML = "";
                var cuerpoTabla = ctx.domNode.querySelector("#checkboxGrid");
                cuerpoTabla.innerHTML = ""; 

                ctx._DatosDepotsAlmuerzo = null;
                var checkboxInstance = $("#myCheckBoxAlm").dxCheckBox("instance");
                checkboxInstance.option("value", false);

                domStyle.set(ctx.divAlmuerzoDropDown, "display", "none")

                document.getElementById("contBtnReload").style.display = "none";

                domStyle.set(ctx.MsjEjec, "display", "none")
                domStyle.set(ctx.MsjEjec1, "display", "none")
                domStyle.set(ctx.VRPLoad, "display", "none")
                domStyle.set(ctx.VRPLoad2, "display", "none")
                domStyle.set(ctx.msjSecctionFin, "display", "none")
                domStyle.set(ctx.divMsj, "display", "none")
                domStyle.set(ctx.msjFeature, "display", "none")
                domStyle.set(ctx.msjSecctionFinFeature, "display", "none")
                domStyle.set(ctx.divPlanar1, "display", "block")
                domStyle.set(ctx.divPlanar3, "display", "block")
                domStyle.set(ctx.divPlanar5, "display", "block")
                domStyle.set(ctx.divPlanar6, "display", "block")
                domStyle.set(ctx.divPlanar4, "display", "block")
                domStyle.set(ctx.MsjSalidas, "display", "none")
                //domStyle.set(ctx.MsjSalidasURL1, "display", "none")
                domStyle.set(ctx.MsjSalidasURL2, "display", "none")

                ctx.statusRoutes.innerHTML = "";
            }); 

            domStyle.set(ctx.VRPLoad3, "display", "none")

            //var dxButtonCO = $("#btnCargarOrdenes").dxButton("instance");
            //dxButtonCO.option("disabled", true);

            var dxButtonEJ = $("#btnEjecutar").dxButton("instance");
            dxButtonEJ.option("disabled", false);
        },
        _changeComboDepotCases: async function(data){
            var ctx = _thisVRP;
            ctx.publishData({
                'target':"TableVRP",
                'data': {json: {}, function: "CleanGrids"}
            }); 
                
            ctx._DatosRoutes = null;
            ctx._DatosDepots = null;
            
            ctx.JOrders = null;
            ctx.JDepots = null;
            ctx.JRoutes = null;
            ctx.statusJsonOrders.innerHTML = "";
            //var inputJsonBreaks = document.getElementById("JsonBreaks");
           // inputJsonBreaks.value = "";
            ctx.JBreaks = null;
           //ctx.statusBreaks.innerHTML = "";
           //var inputJsonBarriersPoint = document.getElementById("JsonBarriersPoint");
            //inputJsonBarriersPoint.value = "";
            //ctx.JBarriersPoint = null;
            //ctx.statusBarriersPoint.innerHTML = "";

            var selectedItem = ctx.arrayCases.find(function(item) {
                return item.value === data.value;
            });            
                            
            if (selectedItem.name != "Seleccionar...") {
                
                await ctx.getNameAndDesc(selectedItem.name);

                ctx.statusNombre.style = "color: black;"
                ctx.statusNombre.innerHTML = "<b>Nombre: </b>" + ctx._outputName + "  <b> &nbsp Descripción: </b>" + ctx._outputDesc;

                await ctx._LoadDepots(selectedItem.value);
                await ctx._LoadRoutes(selectedItem.value);
                await ctx._LoadSpecialties(selectedItem.value);

                //var dxButtonCO = $("#btnCargarOrdenes").dxButton("instance");
                //dxButtonCO.option("disabled", false);
            }   
            else{
                ctx._outputName = "";
                ctx._outputDesc = "";
                ctx.statusNombre.innerHTML = "";
                var cuerpoTabla = ctx.domNode.querySelector("#checkboxGrid");
                cuerpoTabla.innerHTML = "";
            }
            

            var geoActual = ctx.geometryCase.find(function(objeto) {
              return objeto.id === parseInt(selectedItem.value)
            });
            
            if (geoActual === undefined) {return}
               
           var polygon = new Polygon({
            rings: geoActual.rings,
            spatialReference: geoActual.spatialReference
           });
           // Crear un gráfico con la geometría
            var graphic = new Graphic({
                geometry: polygon,
                 symbol: {
                    style: "esriSFSSolid",
                    color: [130, 130, 130, 0],
                    outline: {
                        style: "esriSFSSolid",
                        color: [0, 0, 0, 255],
                        width: 1
                    }
                }   
            });

            var graphicsLayer = new GraphicsLayer();
            graphicsLayer.add(graphic);
            ctx.map.addLayer(graphicsLayer);
            
            var gExtent = jimuUtils.graphicsExtent(graphicsLayer.graphics);       
            ctx.gExtentActual = gExtent;
            ctx.map.setExtent(gExtent);
        },
        _eliminarFeaturesAlmuerzo: function() {
            var ctx = _thisVRP;
            // Filtrar los features que contienen "(Almuerzo)" en el nombre y eliminarlos
            ctx.JOrders.features = ctx.JOrders.features.filter(function(feature) {
                return !feature.attributes.name.includes("(Almuerzo)");
            });
        },
        getUpcomingMondays: function () {
            var today = new Date();
            var currentDayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
            var daysUntilNextMonday = 1 - currentDayOfWeek; // Días hasta el próximo lunes
            if (daysUntilNextMonday > 0) daysUntilNextMonday += 7; // Ajuste si hoy es lunes
            var upcomingMondays = [];
            for (var i = 0; i < 5; i++) {
                var nextMonday = new Date(today);
                nextMonday.setDate(today.getDate() + daysUntilNextMonday + (i * 7));
                upcomingMondays.push(nextMonday);
            }
            return upcomingMondays;
        },

        formatDate: function (date) {
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('es-ES', options);
        },
       
        _convertToEpoch: function(horaString){   
            // Obtener la fecha actual
            /*var fechaActual = new Date();

            // Construir la fecha completa (utilizando la fecha actual y la hora de la cadena)
            var fechaCompleta = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate(), horaString.split(":")[0], horaString.split(":")[1]);

            // Convertir la fecha completa a formato ISO 8601
            var horaISO8601 = fechaCompleta.toISOString();

            var horaDate = new Date(horaISO8601);*/

            // Obtener el valor de época (en milisegundos)
            var epochValue = horaString.getTime();

            return epochValue
        },
        _cargarNewOrder: async function (valores){
                var ctx = _thisVRP;                
                const nameDepot = ctx._DatosDepotsAlmuerzo[0].attributes.Name;
                const depotOriginal = ctx._DatosDepotsAlmuerzo[0];     

                //var intOID = ctx.JOrders.features.length - 1;
                //var oid = ctx.JOrders.features[intOID].attributes.objectid;

                var featuresJO = ctx.JOrders.features;
                var oid = -1;

                // Recorrer todos los features y obtener el mayor objectid
                for (var i = 0; i < featuresJO.length; i++) {
                    var currentObjectid = featuresJO[i].attributes.objectid;
                    if (currentObjectid > oid) {
                        oid = currentObjectid;
                    }
                }
                
                var startTimeValue = $("#timeStart").dxDateBox("option", "value");
                var endTimeValue = $("#timeEnd").dxDateBox("option", "value");

                var arrayValues = ctx.loadValuesTableRoutes();

                var valoresEncontrados = [];
                ctx.valoresCheck = [];

                var pruebaDiasHora = await ctx._DatosRoutes.forEach(function (objeto) {
                      // Verifica si el objeto tiene un atributo llamado "attributes"
                      if (objeto.attributes) {
                        // Recorre cada valor buscado
                        arrayValues.forEach(function (valorBuscado) {
                          // Verifica si el valor buscado está presente en los atributos
                          if (Object.values(objeto.attributes).includes(valorBuscado.ruta)) {
                            valorBuscado.diasMarcados.forEach(async function(name){
                                var nameOriginal = objeto.attributes.Name;
                                var copiaObjeto = JSON.parse(JSON.stringify(objeto));

                                var EarliestStartTimeOriginal = objeto.attributes.EarliestStartTime;
                                var EarliestStartTimeCopia = JSON.parse(JSON.stringify(objeto));

                                var LatestStartTimeOriginal = objeto.attributes.EarliestStartTime;
                                var LatestStartTimeCopia = JSON.parse(JSON.stringify(objeto));

                                var partes = name.split("-");
                                var diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
                                var posicion = -1;

                                for (var i = 0; i < partes.length; i++) {
                                    for (var j = 0; j < diasSemana.length; j++) {
                                        if (partes[i].includes(diasSemana[j])) {
                                            posicion = i;
                                            break;
                                        }
                                    }
                                    if (posicion !== -1) {
                                        break;
                                    }
                                }
                                var valorDia = partes[posicion];

                                var hourStart = startTimeValue.getHours();
                                var minStart = startTimeValue.getMinutes();
                                var hourEnd = endTimeValue.getHours();
                                var minEnd = endTimeValue.getMinutes();    
                                                            
                                var diaRouteEarlies = ctx.cargarDiaRoutes(valorDia,hourStart,minStart);
                                var diaRouteLatest = ctx.cargarDiaRoutes(valorDia,hourEnd,minEnd);                                 
                                var epochRouteEarlies = new Date(diaRouteEarlies).getTime();
                                var epochRouteLatest = new Date(diaRouteLatest).getTime();
                                
                                copiaObjeto.attributes.Name = name;
                                copiaObjeto.attributes.EarliestStartTime = epochRouteEarlies;
                                copiaObjeto.attributes.LatestStartTime = epochRouteLatest;

                                valoresEncontrados.push(copiaObjeto); 
                                ctx.valoresCheck.push(copiaObjeto);                                
                                objeto.attributes.Name = nameOriginal;
                            });                    
                          }
                        });
                      }
                      return true;
                    });

                var loadF = await valores.forEach(async function (routes) {  
                    oid++                    
                    var depotPushEX = JSON.parse(JSON.stringify(depotOriginal));
                    var depotPush = _thisVRP.copyObjectWithLowerCaseKeys(depotOriginal);
                    
                    var pp = ctx._DatosDepotsAlmuerzo;

                    var _serviceTime = $("#serviceTimeInput").dxNumberBox("option", "value");

                    var _timeWindowStart1 = "";
                    var _timeWindowEnd1 = "";

                    valoresEncontrados.forEach(function(outFeature) {
                        if (outFeature.attributes.Name == routes.attributes.Name) {
                            _timeWindowStart1 = outFeature.attributes.EarliestStartTime;
                            _timeWindowEnd1 = outFeature.attributes.LatestStartTime;
                        }
                    });
                    
                    depotPush.attributes.objectid = oid;
                    depotPush.attributes.name = routes.attributes.Name + " (Almuerzo)"
                    depotPush.attributes.servicetime = parseInt(_serviceTime);
                    depotPush.attributes.timewindowstart1 = _timeWindowStart1
                    depotPush.attributes.timewindowend1 = _timeWindowEnd1                    
                    depotPush.attributes.routename = routes.attributes.Name;
                    depotPush.attributes.assignmentrule = 2;                 
                    depotPush.attributes.sequence = 2;        
                    depotPush.attributes.curbapproach = 0;

                    delete depotPush.attributes.bearing;
                    delete depotPush.attributes.bearingtol;
                    delete depotPush.attributes.navlatency;
                    delete depotPush.attributes.usecase_id;
                    delete depotPush.attributes.globalid;
                    delete depotPush.attributes.created_user;
                    delete depotPush.attributes.created_date;
                    delete depotPush.attributes.last_edited_user;
                    delete depotPush.attributes.last_edited_date;
                    delete depotPush.attributes.last_edited_date;

                    ctx.JOrders.features.push(depotPush);

                    return true;
                });
                return loadF
        },
        copyObjectWithLowerCaseKeys: function (obj) {
            // Si el objeto es un array, iteramos sobre sus elementos
            if (Array.isArray(obj)) {
                return obj.map(item => _thisVRP.copyObjectWithLowerCaseKeys(item));
            } else if (obj !== null && typeof obj === 'object') {
                // Si el objeto es un objeto, iteramos sobre sus claves
                return Object.keys(obj).reduce((acc, key) => {
                    const lowerCaseKey = key.toLowerCase();
                    acc[lowerCaseKey] = _thisVRP.copyObjectWithLowerCaseKeys(obj[key]);
                    return acc;
                }, {});
            }
            // Si no es ni un objeto ni un array, devolvemos el valor tal cual
            return obj;
        },
        convertirMinutosAHoras: function (minutos) {
            const horas = Math.floor(minutos / 60);
            const minutosRestantes = minutos % 60;
            return { horas: horas, minutos: minutosRestantes };
        },     
        _getInfoJsonOrders: async function(orders){            
            infoOrders = {}
            infoOrders.CantidadOrders = orders.features.length;

            let totalMinutos = 0;
            orders.features.forEach(function(elemento) {
                totalMinutos += elemento.attributes["servicetime"];
            });
            var tiempoConvertido = this.convertirMinutosAHoras(totalMinutos);
            infoOrders.TotalServiceTime = tiempoConvertido

            return infoOrders

        },
        getNameAndDesc: function(selectedValue){
            var ctx = _thisVRP;
            var fecha = new Date();
            var dia = fecha.getDate();
            var mes = fecha.getMonth() + 1; // Meses son indexados desde 0
            var anio = fecha.getFullYear();
            var horas = fecha.getHours();
            var minutos = fecha.getMinutes();
            var segundos = fecha.getSeconds();

            // Formatear los componentes para que tengan dos dígitos (por ejemplo, 01, 02, ..., 09)
            dia = dia < 10 ? '0' + dia : dia;
            mes = mes < 10 ? '0' + mes : mes;
            horas = horas < 10 ? '0' + horas : horas;
            minutos = minutos < 10 ? '0' + minutos : minutos;
            segundos = segundos < 10 ? '0' + segundos : segundos;


            ctx._outputName = selectedValue + "_" + horas + minutos + segundos;
            ctx._outputDesc = dia + "/" + mes + "/" + anio + " " + horas + ":" + minutos;
        },
        limpiarCheckboxes: function() {
            // Obtén todos los checkboxes de la tabla
            var checkboxes = document.querySelectorAll('#checkboxGrid input[type="checkbox"]');

            // Desmarca cada checkbox
            checkboxes.forEach(function (checkbox) {
                checkbox.checked = false;
            });
        },
        createLayersDepots: async function(){
            var ctx = _thisVRP;
            ctx.depotsLayer = null;
            ctx.depotsLayer = 
            {
                "displayFieldName": "",
                "fieldAliases": {
                    "Name": "Name",
                    "Description": "Description",
                    "TimeWindowStart1": "TimeWindowStart1",
                    "TimeWindowEnd1": "TimeWindowEnd1",
                    "TimeWindowStart2": "TimeWindowStart2",
                    "TimeWindowEnd2": "TimeWindowEnd2",
                    "SourceID": "SourceID",
                    "SourceOID": "SourceOID",
                    "PosAlong": "PosAlong",
                    "SideOfEdge": "SideOfEdge",
                    "CurbApproach": "CurbApproach",
                    "Status": "Status"
                },
                "geometryType": "esriGeometryPoint",
                "spatialReference": {
                },
                "fields": [
                    {
                    "name": "ObjectID",
                    "type": "esriFieldTypeOID",
                    "alias": "ObjectID"
                }, {
                    "name": "Name",
                    "type": "esriFieldTypeString",
                    "alias": "Name",
                    "length": 128
                }, {
                    "name": "Description",
                    "type": "esriFieldTypeString",
                    "alias": "Description",
                    "length": 128
                }, {
                    "name": "TimeWindowStart1",
                    "type": "esriFieldTypeDate",
                    "alias": "TimeWindowStart1",
                    "length": 16
                }, {
                    "name": "TimeWindowEnd1",
                    "type": "esriFieldTypeDate",
                    "alias": "TimeWindowEnd1",
                    "length": 16
                }, {
                    "name": "TimeWindowStart2",
                    "type": "esriFieldTypeDate",
                    "alias": "TimeWindowStart2",
                    "length": 16
                }, {
                    "name": "TimeWindowEnd2",
                    "type": "esriFieldTypeDate",
                    "alias": "TimeWindowEnd2",
                    "length": 16
                }, {
                    "name": "SourceID",
                    "type": "esriFieldTypeInteger",
                    "alias": "SourceID"
                }, {
                    "name": "SourceOID",
                    "type": "esriFieldTypeInteger",
                    "alias": "SourceOID"
                }, {
                    "name": "PosAlong",
                    "type": "esriFieldTypeDouble",
                    "alias": "PosAlong"
                }, {
                    "name": "SideOfEdge",
                    "type": "esriFieldTypeInteger",
                    "alias": "SideOfEdge"
                }, {
                    "name": "CurbApproach",
                    "type": "esriFieldTypeInteger",
                    "alias": "CurbApproach"
                }, {
                    "name": "Status",
                    "type": "esriFieldTypeInteger",
                    "alias": "Status"
                }],
                "features": []
            }

            var selectedValueS = ctx.dropdownDStart.dxSelectBox("instance").option("value");    
            var selectedValueE = ctx.dropdownDEnd.dxSelectBox("instance").option("value");  

            var selectedItemS = ctx.depotsValues.find(function(item) {
                return item.value === selectedValueS;
            });

            var selectedItemE = ctx.depotsValues.find(function(item) {
                return item.value === selectedValueE;
            });

            var depotStart = selectedItemS.name;
            var depotEnd = selectedItemE.name;
            
            var newAttributes = {};
            var newGeom = {};
            ctx.depotsLayer.spatialReference = ctx._DatosDepots.spatialReference
            var loadF = await ctx._DatosDepots.features.forEach(function(feature) {

                if (depotStart == feature.attributes["Name"] && depotEnd == feature.attributes["Name"]) {               

                    // Iterar sobre cada campo del layer de depots
                    ctx.depotsLayer.fields.forEach(function (campo) {
                        // Verificar si el atributo está presente en la feature
                        if (feature.attributes.hasOwnProperty(campo.name)) {
                            // Agregar el atributo al objeto newAttributes
                                newAttributes[campo.name] = feature.attributes[campo.name];
                                newGeom = feature.geometry;
                            
                        }
                    });
                }
            });
            ctx.depotsLayer.features.push({
                attributes: newAttributes,
                geometry: newGeom
            });
            //var jDepots = JSON.stringify(ctx.depotsLayer);
            return ctx.depotsLayer
        },
        createLayersRoutes: async function(){
            var ctx = _thisVRP;
            ctx.routesLayer = null;
            ctx.routesLayer = 
            {
              "displayFieldName": "",
              "fieldAliases": {
                "Name": "Name",
                "Description": "Description",
                "StartDepotName": "StartDepotName",
                "EndDepotName": "EndDepotName",
                "StartDepotServiceTime": "StartDepotServiceTime",
                "EndDepotServiceTime": "EndDepotServiceTime",
                "EarliestStartTime": "EarliestStartTime",
                "LatestStartTime": "LatestStartTime",
                "ArriveDepartDelay": "ArriveDepartDelay",
                "Capacities": "Capacities",
                "FixedCost": "FixedCost",
                "CostPerUnitTime": "CostPerUnitTime",
                "CostPerUnitDistance": "CostPerUnitDistance",
                "OvertimeStartTime": "OvertimeStartTime",
                "CostPerUnitOvertime": "CostPerUnitOvertime",
                "MaxOrderCount": "MaxOrderCount",
                "MaxTotalTime": "MaxTotalTime",
                "MaxTotalTravelTime": "MaxTotalTravelTime",
                "MaxTotalDistance": "MaxTotalDistance",
                "SpecialtyNames": "SpecialtyNames",
                "AssignmentRule": "AssignmentRule",
              },
              "geometryType": "esriGeometryPolyline",
              "spatialReference": {
                    "wkid": 102100,
                    "latestWkid": 3857
                },
              "fields": [
                {
                  "name": "Name",
                  "type": "esriFieldTypeString",
                  "alias": "Name",
                  "length": 128
                },
                {
                  "name": "Description",
                  "type": "esriFieldTypeString",
                  "alias": "Description",
                  "length": 128
                },
                {
                  "name": "StartDepotName",
                  "type": "esriFieldTypeString",
                  "alias": "StartDepotName",
                  "length": 128
                },
                {
                  "name": "EndDepotName",
                  "type": "esriFieldTypeString",
                  "alias": "EndDepotName",
                  "length": 128
                },
                {
                  "name": "StartDepotServiceTime",
                  "type": "esriFieldTypeDouble",
                  "alias": "StartDepotServiceTime"
                },
                {
                  "name": "EndDepotServiceTime",
                  "type": "esriFieldTypeDouble",
                  "alias": "EndDepotServiceTime"
                },
                {
                  "name": "EarliestStartTime",
                  "type": "esriFieldTypeDate",
                  "alias": "EarliestStartTime",
                  "length": 16
                },
                {
                  "name": "LatestStartTime",
                  "type": "esriFieldTypeDate",
                  "alias": "LatestStartTime",
                  "length": 16
                },
                {
                  "name": "ArriveDepartDelay",
                  "type": "esriFieldTypeDouble",
                  "alias": "ArriveDepartDelay"
                },
                {
                  "name": "Capacities",
                  "type": "esriFieldTypeString",
                  "alias": "Capacities",
                  "length": 128
                },
                {
                  "name": "FixedCost",
                  "type": "esriFieldTypeDouble",
                  "alias": "FixedCost"
                },
                {
                  "name": "CostPerUnitTime",
                  "type": "esriFieldTypeDouble",
                  "alias": "CostPerUnitTime"
                },
                {
                  "name": "CostPerUnitDistance",
                  "type": "esriFieldTypeDouble",
                  "alias": "CostPerUnitDistance"
                },
                {
                  "name": "OvertimeStartTime",
                  "type": "esriFieldTypeDouble",
                  "alias": "OvertimeStartTime"
                },
                {
                  "name": "CostPerUnitOvertime",
                  "type": "esriFieldTypeDouble",
                  "alias": "CostPerUnitOvertime"
                },
                {
                  "name": "MaxOrderCount",
                  "type": "esriFieldTypeInteger",
                  "alias": "MaxOrderCount"
                },
                {
                  "name": "MaxTotalTime",
                  "type": "esriFieldTypeDouble",
                  "alias": "MaxTotalTime"
                },
                {
                  "name": "MaxTotalTravelTime",
                  "type": "esriFieldTypeDouble",
                  "alias": "MaxTotalTravelTime"
                },
                {
                  "name": "MaxTotalDistance",
                  "type": "esriFieldTypeDouble",
                  "alias": "MaxTotalDistance"
                },
                {
                  "name": "SpecialtyNames",
                  "type": "esriFieldTypeString",
                  "alias": "SpecialtyNames",
                  "length": 128
                },
                {
                  "name": "AssignmentRule",
                  "type": "esriFieldTypeInteger",
                  "alias": "AssignmentRule"
                }
              ],
              "features": []
            }

            var newAttributes = {};
            
            var arrayValues = ctx.loadValuesTableRoutes();

            var valoresEncontrados = [];
            ctx.valoresCheck = [];

            await ctx._DatosRoutes.forEach(function (objeto) {
              // Verifica si el objeto tiene un atributo llamado "attributes"
              if (objeto.attributes) {
                // Recorre cada valor buscado
                arrayValues.forEach(function (valorBuscado) {
                    
                  // Verifica si el valor buscado está presente en los atributos
                  if (Object.values(objeto.attributes).includes(valorBuscado.ruta)) {
                    valorBuscado.diasMarcados.forEach(async function(name){
                        var nameOriginal = objeto.attributes.Name;
                        var copiaObjeto = JSON.parse(JSON.stringify(objeto));

                        var EarliestStartTimeOriginal = objeto.attributes.EarliestStartTime;
                        var EarliestStartTimeCopia = JSON.parse(JSON.stringify(objeto));

                        var LatestStartTimeOriginal = objeto.attributes.EarliestStartTime;
                        var LatestStartTimeCopia = JSON.parse(JSON.stringify(objeto));

                        var partes = name.split("-");
                        var diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
                        var posicion = -1;

                        for (var i = 0; i < partes.length; i++) {
                            for (var j = 0; j < diasSemana.length; j++) {
                                if (partes[i].includes(diasSemana[j])) {
                                    posicion = i;
                                    break;
                                }
                            }
                            if (posicion !== -1) {
                                break;
                            }
                        }
                        var valorDia = partes[posicion];
                        
                        var diaRouteEarlies = ctx.cargarDiaRoutes(valorDia,8,0); //CARGO DIA 8AM
                        var diaRouteLatest = ctx.cargarDiaRoutes(valorDia,8,15); //CARGO DIA 8.15AM

                        var epochRouteEarlies = new Date(diaRouteEarlies).getTime();
                        var epochRouteLatest = new Date(diaRouteLatest).getTime();
                        
                        copiaObjeto.attributes.Name = name;
                        copiaObjeto.attributes.EarliestStartTime = epochRouteEarlies;
                        copiaObjeto.attributes.LatestStartTime = epochRouteLatest;

                        valoresEncontrados.push(copiaObjeto); 
                        ctx.valoresCheck.push(copiaObjeto);                                
                        objeto.attributes.Name = nameOriginal;
                    });                    
                  }
                });
              }
            });
            
            var loadF = await valoresEncontrados.forEach(async function (routes) {   
                var newAttributes = {};
                ctx.routesLayer.fields.forEach(function(campo){
                    if (routes.attributes.hasOwnProperty(campo.name)) {                    
                        newAttributes[campo.name] = routes.attributes[campo.name]; 
                    }
                });   
                
                var valorStartDepot = $("#StartDepotServiceTimeInput").dxNumberBox("instance").option("value");
                var valorEndDepot = $("#EndDepotServiceTimeInput").dxNumberBox("instance").option("value");
                var valorMaxTotal = $("#MaxTotalTimeInput").dxNumberBox("instance").option("value");
                var valorOverTime = valorMaxTotal - 60;
                
                newAttributes["StartDepotServiceTime"] = valorStartDepot;
                newAttributes["EndDepotServiceTime"] = valorEndDepot;
                newAttributes["MaxTotalTime"] = valorMaxTotal;
                newAttributes["OverTimeStarTime"] = valorOverTime;

                ctx.routesLayer.features.push({
                    attributes: newAttributes
                }); 
            });

            return ctx.routesLayer
        },
        cargarDiaRoutes: function(dia,hora,minuto){
            var ctx = _thisVRP;
            var fechaLunes = ctx.dropdownSemanal.dxSelectBox("instance").option("value");
            var fecha = new Date(fechaLunes);

            var diaSolicitado;
            
            switch (dia.toLowerCase()) {
                case "lunes":
                    diaSolicitado = 1;
                    break;
                case "martes":
                    diaSolicitado = 2;
                    break;
                case "miércoles":
                    diaSolicitado = 3;
                    break;
                case "jueves":
                    diaSolicitado = 4;
                    break;
                case "viernes":
                    diaSolicitado = 5;
                    break;
                default:
                    diaSolicitado = -1; // Retorna -1 si el día no es válido
            }
            // Obtener el día de la semana (0 para Domingo, 1 para Lunes, ..., 6 para Sábado)
            var diaSemana = fecha.getDay();

            // Calcular la cantidad de días que hay que agregar para llegar al día solicitado
            var diasHastaDiaSolicitado = diaSolicitado - diaSemana;
            
            // Sumar la cantidad de días necesarios para llegar al día solicitado
            fecha.setDate(fecha.getDate() + diasHastaDiaSolicitado);

            // Establecer la hora a las 8:00 am
            fecha.setHours(hora, minuto, 0, 0);
            return fecha;
        },
        loadValuesTableRoutes: function(){

            var cuerpoTabla = document.getElementById("checkboxGrid");            
            // Inicializa un array para almacenar los valores de los checkboxes marcados
            var valoresChequeados = [];

            // Recorre las filas de la tabla
            for (var i = 0; i < cuerpoTabla.rows.length; i++) {
                var fila = cuerpoTabla.rows[i];

                // Obtén el nombre de la ruta de la primera celda de la fila
                var nombreRuta = fila.cells[0].innerHTML;

                // Inicializa un objeto para almacenar los valores de los checkboxes de esta fila
                var valoresFila = {
                    ruta: nombreRuta,
                    diasMarcados: []
                };

                // Recorre las celdas de la fila (comenzando desde la segunda columna)
                for (var j = 1; j < fila.cells.length; j++) {
                    var celda = fila.cells[j];

                    // Obtén el checkbox dentro de la celda
                    var checkbox = celda.querySelector("input[type=checkbox]");
                    
                    // Verifica si el checkbox está marcado y agrega el día correspondiente al array
                    if (checkbox.checked) {

                         switch (j) {
                            case 1:
                              valoresFila.diasMarcados.push(nombreRuta + "-Lunes");
                              break;
                            case 2:
                              valoresFila.diasMarcados.push(nombreRuta + "-Martes");
                              break;
                            case 3:
                              valoresFila.diasMarcados.push(nombreRuta + "-Miércoles");
                              break;
                            case 4:
                              valoresFila.diasMarcados.push(nombreRuta + "-Jueves");
                              break;
                             case 5:
                              valoresFila.diasMarcados.push(nombreRuta + "-Viernes");
                              break;
                          }

                        //valoresFila.diasMarcados.push("Día " + j);
                        // Agrega el objeto con los valores de la fila al array principal

                    }
                }
                valoresChequeados.push(valoresFila);
            }
            return valoresChequeados;
        },
        _generateCheckboxTable: function (datosRest) {
            var ctx = _thisVRP;                        
            datosRest = ctx._DatosRoutes
            var paramSemana = ctx.dropdownSemanal.dxSelectBox("instance").option("value");       
            var currentDate = new Date();
            var currentDay = currentDate.getDay(); // 0 para Domingo, 1 para Lunes, ..., 6 para Sábado
            var diasHabilitados = [1, 2, 3, 4, 5]; // Índices de los días habilitados: lunes, martes, miércoles, jueves, viernes

            var cuerpoTabla = this.domNode.querySelector("#checkboxGrid");
            cuerpoTabla.innerHTML = "";

            // Obtener el día de la semana del parámetro de semana
            var fechaSemana = new Date(paramSemana);
            var diaSemanaParam = fechaSemana.getDay();

            datosRest.forEach(function (route) {
                var nuevaFila = domConstruct.create("tr", {}, cuerpoTabla);

                // Celda para la columna "Routes"
                var celdaRoutes = domConstruct.create("td", {
                    innerHTML: route.attributes.Name,
                    title: route.attributes.SpecialtyNames != null ? route.attributes.SpecialtyNames : "",
                    className: "hover-highlight"
                }, nuevaFila);

                // Iterar sobre los días y agregar celdas con checkboxes
                for (var i = 0; i < diasHabilitados.length; i++) {
                    var dia = diasHabilitados[i];

                    var celdaCheckbox = domConstruct.create("td", {}, nuevaFila);

                    // Crear checkbox
                    var checkbox = domConstruct.create("input", {
                        type: "checkbox",
                        id: "checkbox_" + route.attributes.Name + "_dia_" + dia,
                    }, celdaCheckbox);

                    // Comparar solo los días de las fechas para determinar si corresponden a la misma semana
                    var fechaComparacion = new Date(fechaSemana);
                    fechaComparacion.setDate(fechaComparacion.getDate() + dia - 1); // Ajustar al día de la semana

                    if (fechaComparacion <= currentDate) {
                        checkbox.disabled = true;
                    }
                    else{
                        checkbox.checked = true;
                    }
                }
            });
        },
        _generateDropDown: function (datosRest) {                    
            var ctx = _thisVRP;
            ctx.depotsValues = [];        
            //SETEAMOS SOLO DEPOTS y NO COMEDOR    
            datosRest.forEach(opcion => {
                if (opcion.attributes.Name.toUpperCase() != "COMEDOR") {                         
                    var jd = {
                        value: opcion.attributes.OBJECTID,
                        name: opcion.attributes.Name
                    }

                    ctx.depotsValues.push(jd);
                }
            });
            
            var dropdownDStartInstance = $("#dropdownDStart").dxSelectBox("instance");
            dropdownDStartInstance.option("dataSource", ctx.depotsValues);
            dropdownDStartInstance.option("value", ctx.depotsValues[0].value);

            var dropdownDEndInstance = $("#dropdownDEnd").dxSelectBox("instance");
            dropdownDEndInstance.option("dataSource", ctx.depotsValues);
            dropdownDEndInstance.option("value", ctx.depotsValues[0].value);

            ctx.depotsValues = [];   
            datosRest.forEach(opcion => {
                var jd = {
                        value: opcion.attributes.OBJECTID,
                        name: opcion.attributes.Name
                    }

                ctx.depotsValues.push(jd);
            });

            var dropdownDAlmInstance = $("#dropdownDAlm").dxSelectBox("instance");
            dropdownDAlmInstance.option("dataSource", ctx.depotsValues);
            dropdownDAlmInstance.option("value", ctx.depotsValues[1].value);
        },
        _LoadSpecialties: async function(caseID){            
            var ctx = _thisVRP;
            ctx.arraySpecialties = [];
            ctx.token = IdentityManager.credentials[0].token;
            var serviceUrl = ctx.urlDataModel + "/"+ ctx.ID_TB_Specialties +"/query";
            var params = {
                where: "UseCase_ID = " + caseID, // Siempre devuelve todos los registros
                outFields: "*", // Campo del que deseas obtener el último valor
                f: "json"
            };
            
            await esriRequest({
                url: serviceUrl,
                token: ctx.token,
                content: params,
                handleAs: "json"
            }, {
                usePost: !0
            }).then(function(response) {    
                response.features.map(function(feature) {  
                    var jd = {
                        value: feature.attributes["Name"],
                        name: feature.attributes["Description"]
                    }

                    ctx.arraySpecialties.push(jd);
                });
            }).otherwise(function(error) {                      
                return;
            });;
        },
        _LoadCases: async function(){            
            var ctx = _thisVRP;
            ctx.arrayCases = [];
            ctx.token = IdentityManager.credentials[0].token;
            var dropdown = dom.byId("dropdown");
            var serviceUrl = ctx.urlDataModel + "/"+ ctx.ID_TB_Use_Cases +"/query";
            var params = {
                where: "1=1", // Siempre devuelve todos los registros
                outFields: "*", // Campo del que deseas obtener el último valor
                f: "json"
            };
            
            await esriRequest({
                url: serviceUrl,
                token: ctx.token,
                content: params,
                handleAs: "json"
            }, {
                usePost: !0
            }).then(function(response) {    
                var sp = response.spatialReference;
                response.features.map(function(feature) {  
                    var objeto1 = {
                      id: feature.attributes.OBJECTID,
                      rings: feature.geometry.rings,
                      spatialReference: sp
                    };

                    ctx.geometryCase.push(objeto1);

                    var jd = {
                        value: feature.attributes["UseCase_ID"],
                        name: feature.attributes["UseCase_Name"]
                    }

                    ctx.arrayCases.push(jd);
                });
                ctx.shelterVRP.hide(); 
            }).otherwise(function(error) {                      
                return;
            });;
        },
         _LoadDepotsAlmuerzo: async function(value){                        
            var ctx = _thisVRP;
            ctx.token = IdentityManager.credentials[0].token;            

            var serviceUrl = ctx.urlDataModel + "/"+ ctx.ID_FC_Depots +"/query";
            var params = {
                where: "OBJECTID = " + value, 
                outFields: "*", // Campo del que deseas obtener el último valor
                outSR: 4326,
                f: "json"
            };
            
            await esriRequest({
                url: serviceUrl,
                token: ctx.token,
                content: params,
                handleAs: "json"
            }, {
                usePost: !0
            }).then(function(response) {                                                                      
                ctx._DatosDepotsAlmuerzo = response.features;
            }).otherwise(function(error) {                      
                return;
            });;
        },
        _LoadDepots: async function(selectedValue){            
            var ctx = _thisVRP;
            ctx.token = IdentityManager.credentials[0].token;
            var serviceUrl = ctx.urlDataModel + "/"+ ctx.ID_FC_Depots +"/query";
            var params = {
                where: "UseCase_ID = " + selectedValue, 
                outFields: "*", // Campo del que deseas obtener el último valor
                f: "json"
            };
            
            await esriRequest({
                url: serviceUrl,
                token: ctx.token,
                content: params,
                handleAs: "json"
            }, {
                usePost: !0
            }).then(function(response) {        
                ctx._DatosDepots = response;
                ctx._generateDropDown(response.features);
            }).otherwise(function(error) {                      
                return;
            });;
        },
         _LoadRoutes: async function(selectedValue){            
            var ctx = _thisVRP;
            ctx.token = IdentityManager.credentials[0].token;
            var serviceUrl = ctx.urlDataModel + "/"+ ctx.ID_TB_Routes +"/query";
            var params = {
                where: "UseCaseID = " + selectedValue, 
                outFields: "*", // Campo del que deseas obtener el último valor
                f: "json"
            };
            
            await esriRequest({
                url: serviceUrl,
                token: ctx.token,
                content: params,
                handleAs: "json"
            }, {
                usePost: !0
            }).then(function(response) { 
                ctx._DatosRoutes = response.features;
                ctx._generateCheckboxTable(response.features);
            }).otherwise(function(error) {                      
                return;
            });;
        },
        getDatosCases: async function(selectedValue){
            var ctx = _thisVRP;
            ctx.token = IdentityManager.credentials[0].token;
            
            var serviceUrl = ctx.urlDataModel + "/"+ ctx.ID_TB_Use_Cases +"/query";
            var params = {
                returnGeometry: true, 
                where: "OBJECTID = " + selectedValue, 
                outFields: "*",
                f: "json"
            };

            await esriRequest({
                url: serviceUrl,
                token: ctx.token,
                content: params,
                handleAs: "json"
            }, {
                usePost: !0
            }).then(function(response) {
                //ctx.geometryCase.rings = response.features[0].geometry.rings;
               // ctx.geometryCase.spatialReference = response.spatialReference;
                var idCase = response.features[0].attributes.UseCase_ID;
                ctx.caseID = idCase;
                var urlRouting = response.features[0].attributes.RoutingURL;                
                ctx.urlServiceVRP = urlRouting;
            }).otherwise(function(error) {  
                return;
            });;
        },
        _signIn: async function(appConfig, useCurrentUser) {
            this.token = IdentityManager.credentials[0].token;
            var sec = {};
            if (this.appConfig.portalUrl) {
                sec._portalUrl = this.appConfig.portalUrl;
                var _objUrl = new BaseUrl(sec._portalUrl);
                agp.setup({
                    host: _objUrl.host
                });
                sec._portal = new arcgisPortal.Portal(this.appConfig.portalUrl);
                sec.__portalUser = sec._portal.getPortalUser();
                if (sec.__portalUser) {
                    if (useCurrentUser) sec.__currentToken = sec.__portalUser.credential;
                    return sec.__portalUser;
                } else {
                    try {
                        sec.__portalUser = await sec._portal.signIn();
                        return sec.__portalUser;
                    } catch (err) {
                        throw err;
                    }
                }
            } else {
                throw new Error('Missing appConfig or Url portal');
            }
        },
        _getDatosInit: async function(appConfig, useCurrentUser) {            
             var ctx = _thisVRP;
             var requestHandle = await esriRequest({
                url: ctx.urlDataModel,
                content: {
                  f: "json"
                },
                callbackParamName: "callback"
              }).then(function(response) {     
                response.layers.forEach(function(layer) {
                    switch (layer.name) {
                    case "INPUT_Orders":
                      ctx.ID_INPUT_Orders = layer.id
                      break;
                    case "out_unassigned_stops":
                      ctx.ID_out_unassigned_stops = layer.id
                      break;
                    case "out_assigned_stops":
                      ctx.ID_out_assigned_stops = layer.id
                      break;
                    case "out_routes":
                      ctx.ID_out_routes = layer.id
                    break;
                    case "out_directions":
                      ctx.ID_out_directions = layer.id
                    break;
                    case "FC_Uses_Cases":
                      ctx.ID_TB_Use_Cases = layer.id
                    break;
                    case "out_barriers_point":
                      ctx.ID_out_barriers_point = layer.id
                    break;                    
                    case "FC_Depots":
                        ctx.ID_FC_Depots = layer.id
                    break;
                  }
                });

                response.tables.forEach(function(table) {
                    switch (table.name) {
                    case "INPUT_Params":
                      ctx.ID_INPUT_Params = table.id
                      break;
                    case "INPUT_Routes":
                      ctx.ID_INPUT_Routes = table.id
                      break;
                    case "TB_Runs":
                      ctx.ID_TB_Runs = table.id
                      break;
                    case "TB_Routes":
                        ctx.ID_TB_Routes = table.id
                    break;                    
                    case "TB_Specialties":
                        ctx.ID_TB_Specialties = table.id
                    break;
                  }
                });
                
                ctx.outSpatialReference = response.spatialReference.latestWkid;
              }, function(error) {
                console.error("Error al obtener la referencia espacial:", error);
              });
        },
        removeAllLayers: function () { 
            var ctx = _thisVRP;

            ctx.arrayLayersRoutes.forEach(function(layer) {
                ctx.map.removeLayer(layer);
            }); 

            ctx.arrayLayersStops.forEach(function(layer) {
                ctx.map.removeLayer(layer);
            }); 

            if (ctx.featureLayer2) {
                ctx.map.removeLayer(ctx.featureLayer2);
            }
            
        },
        /*_volver: async function(a) {

            this.publishData({
            'target':"TableVRP",
            'data': {json: {}, function: "CleanGrids"}
            }); 

            await this.removeAllLayers();
            await this.getNameAndDesc(selectedValue);
            await this.limpiarCheckboxes();
            this.statusNombre.style = "color: black;"
            this.statusNombre.innerHTML = "<b>Nombre: </b>" + this._outputName + "  <b> &nbsp Descripción: </b>" + this._outputDesc;

            domStyle.set(this.MsjEjec, "display", "none")
            domStyle.set(this.MsjEjec1, "display", "none")
            domStyle.set(this.VRPLoad, "display", "none")
            domStyle.set(this.VRPLoad2, "display", "none")
            domStyle.set(this.msjSecctionFin, "display", "none")
            domStyle.set(this.divMsj, "display", "none")
            domStyle.set(this.msjFeature, "display", "none")
            domStyle.set(this.msjSecctionFinFeature, "display", "none")
            domStyle.set(this.divPlanar1, "display", "block")
            domStyle.set(this.divPlanar3, "display", "block")
            domStyle.set(this.divPlanar5, "display", "block")
            domStyle.set(this.divPlanar6, "display", "block")
            domStyle.set(this.divPlanar0, "display", "block")
            domStyle.set(this.divPlanar2, "display", "block")
            domStyle.set(this.divPlanar4, "display", "block")
            //domStyle.set(this.btnVolver, "display", "none")
            domStyle.set(this.MsjSalidas, "display", "none")
            domStyle.set(this.MsjSalidasURL1, "display", "none")
            domStyle.set(this.MsjSalidasURL2, "display", "none")
            //domStyle.set(this._nameFolderRow, "display", "block")

            this.statusRoutes.innerHTML = "";

            var inputJsonOrders = document.getElementById("JsonOrders");
            inputJsonOrders.value = "";

            this.JOrders = null;
            this.JDepots = null;
            this.JRoutes = null;                    
            this.itemParams = {};            
            this.ActualJob = null;
            this.jobParams = null;
            this.jsonStopData = null;
            this.jsonUnStopData = null;
            this.jsonRoutesData = null;
            this.jsonDirectionsData = null;            
            this.valTimeUnits = null;
            this.valDistanceUnits = null;
            this.valPopulateDirections = null;
            this.valDirectionsLanguage = null;
            this.valSaveOutputLayer = null;
            this.valSaveRouteData = null;
            this.valPopulateStopShapes = null;
            this.runID = 0;
            this.caseID = 0;
            this.urlDataModelPortal = null;
            this.lastFetchedRunID = 0;
            this._DatosDepotsAlmuerzo = null;
            domStyle.set(this.divAlmuerzoDropDown, "display", "none")

            this.finishRun = false;

            /*this.serviceTimeInput = "";
            
            var serviceTime = document.getElementById("serviceTimeInput");
            serviceTime.value = "";

            var inputTimeStart = document.getElementById("start1TimeInput");
            inputTimeStart.value = "";

            var inputTimeEnd = document.getElementById("end1TimeInput");
            inputTimeEnd.value = "";
        },*/

        showMessageSucceeded(jobID) {
            domStyle.set(this.VRPLoad, "display", "none")
            domStyle.set(this.msjFeature, "display", "block")
            domStyle.set(this.VRPLoad2, "display", "block")
            this.msjSecctionFin.style = "color: #00B050;"
            this.msjSecctionFin.innerHTML = "Ejecución correcta";
            domStyle.set(this.msjSecctionFin, "display", "block")
            domStyle.set(this.MsjSalidas, "display", "block")
            //this.MsjSalidasURL1.href = this.urlServiceVRP + '/jobs/' + jobID + "";
            //domStyle.set(this.MsjSalidasURL1, "display", "block")

            var ultimoElemento = document.querySelector('.botoneraactions[data-dojo-attach-point="divPlanar4"] > :last-child');
            ultimoElemento.scrollIntoView();
        },
        showMessageFailed() {
            domStyle.set(this.MsjEjec, "display", "none")
            domStyle.set(this.VRPLoad, "display", "none")
            domStyle.set(this.MsjSalidas, "display", "none")
            //domStyle.set(this.MsjSalidasURL1, "display", "none")
            this.msjSecctionFin.style = "color: red;"
            this.msjSecctionFin.innerHTML = "Ejecución incorrecta";
            domStyle.set(this.msjSecctionFin, "display", "block")
            //domStyle.set(this.btnVolver, "display", "block")

            var ultimoElemento = document.querySelector('.botoneraactions[data-dojo-attach-point="divPlanar4"] > :last-child');
            ultimoElemento.scrollIntoView();
        },
        showMessageSucceededFeature(msj) {
            domStyle.set(this.VRPLoad2, "display", "none")
            this.msjSecctionFinFeature.style = "color: #00B050;"

            var mensajeFinal = '<p>' + msj.join('</p><p>') + '</p>';

            this.msjSecctionFinFeature.innerHTML = "Ejecución correcta <br>" + mensajeFinal;
            domStyle.set(this.msjSecctionFinFeature, "display", "block")         
            this.MsjSalidasURL2.href = this.urlDashboardPortal
            domStyle.set(this.MsjSalidasURL2, "display", "block")
            //domStyle.set(this.btnVolver, "display", "block")

            var ultimoElemento = document.querySelector('.botoneraactions[data-dojo-attach-point="divPlanar4"] > :last-child');
            ultimoElemento.scrollIntoView();

            var dxButtonEJ = $("#btnEjecutar").dxButton("instance");
            dxButtonEJ.option("disabled", false);

            var dxEnviarNov = $("#btnEnviarNov").dxButton("instance");
            dxEnviarNov.option("disabled", false);
        },
        showMessageFailedFeature(errores) {
            domStyle.set(this.msjFeature, "display", "none")
            domStyle.set(this.VRPLoad2, "display", "none")
            domStyle.set(this.MsjSalidasURL2, "display", "none")
            this.msjSecctionFinFeature.style = "color: red;"
            

            var mensajeError = '<p>' + errores.join('</p><p>') + '</p>';
            this.msjSecctionFinFeature.innerHTML = "Ejecución incorrecta: <br>" + mensajeError;

            domStyle.set(this.msjSecctionFin, "display", "block")
            //domStyle.set(this.btnVolver, "display", "block")

            var ultimoElemento = document.querySelector('.botoneraactions[data-dojo-attach-point="divPlanar4"] > :last-child');
            ultimoElemento.scrollIntoView();

            var dxButtonEJ = $("#btnEjecutar").dxButton("instance");
            dxButtonEJ.option("disabled", false);
   
        },
        executeJob(Orders, Depots, Routes) {
            var ctx = _thisVRP;            
            /*if (ctx.featureLayer0) {
                ctx.map.removeLayer(ctx.featureLayer0);
            }
            if (ctx.featureLayer1) {
                ctx.map.removeLayer(ctx.featureLayer1);
            }
            if (ctx.featureLayer2) {
                ctx.map.removeLayer(ctx.featureLayer2);
            }*/
            
            if (ctx.arrayLayersRoutes.length > 0) {
                ctx.arrayLayersRoutes.forEach(function(lay){
                    ctx.map.removeLayer(lay);
                });     
            }
            if (ctx.arrayLayersStops.length > 0) {
                ctx.arrayLayersStops.forEach(function(lay){
                    ctx.map.removeLayer(lay);
                }); 
            }
            var ctx = _thisVRP;
            ctx.token = IdentityManager.credentials[0].token;

            var Breaks = this.JBreaks != null ? this.JBreaks : null;
            var Barriers_Point = this.JBarriersPoint != null ? this.JBarriersPoint : null;            

            $.ajax({
                type: 'POST',
                url: ctx.urlServiceVRP + '/submitJob?f=json&env%3AoutSR=' + ctx.outSpatialReference,
                crossDomain: true,
                data: {
                    token: ctx.token,
                    orders: json.toJson(Orders),
                    depots: json.toJson(Depots),
                    routes: json.toJson(Routes),
                    breaks: json.toJson(Breaks),
                    point_barriers: json.toJson(Barriers_Point),
                    time_units: ctx.valTimeUnits,
                    distance_units: ctx.valDistanceUnits,
                    populate_directions: ctx.valPopulateDirections,
                    directions_language: ctx.valDirectionsLanguage,
                    save_route_data: ctx.valSaveRouteData,
                    populate_stop_shapes: true,
                    outSR: ctx.outSpatialReference,
                    f: "json",
                },
                dataType: 'json',
                success: function(responseData, textStatus, jqXHR) {
                    var jobStatus = responseData.jobStatus;
                    ctx.processingResponseJob(responseData);
                },
                error: function(responseData, textStatus, errorThrown) {
                    ctx.showMessageFailed();
                }
            });
        },
        showMessageProcessing(msg){
            var ctx = _thisVRP;
            htmlResponse = "<p>"+msg+"</p>";
            var actual = ctx.MsjEjec1.innerHTML;            
            ctx.MsjEjec1.innerHTML = actual + htmlResponse;
            
            var ultimoElemento = document.querySelector('.botoneraactions[data-dojo-attach-point="divPlanar4"] > :last-child');
            ultimoElemento.scrollIntoView();
        },
        processingResponseJob(response) {
            var ctx = _thisVRP;
            var jobId = response.jobId;
            ctx.ActualJob = jobId;
            $.ajax({
                type: 'POST',
                url: ctx.urlServiceVRP + '/jobs/' + jobId,
                crossDomain: true,
                data: {
                    token: this.token,
                    f: "json"
                },
                success: function(responseData, textStatus, jqXHR) {
                    var htmlResponse = "";
                    var msjs = [];  
                    responseData.messages.forEach(function(msj){
                        var existeClave = msj.description in ctx.dictionaryMsj;
                        if (!existeClave) {
                             ctx.dictionaryMsj[msj.description] = msj.description;
                             ctx.showMessageProcessing(msj.description);
                        }
                    });

                    if (responseData.jobStatus == "esriJobExecuting" || responseData.jobStatus == "esriJobWaiting" || responseData.jobStatus == "esriJobSubmitted") {
                        setTimeout(function() {
                            ctx.processingResponseJob(response)
                        }, 3000);
                    } else if (responseData.jobStatus == "esriJobSucceeded") {
                        ctx.showMessageSucceeded(responseData.jobId);                       
                        ctx._LoadResultVRP();     
                    } else if (responseData.jobStatus == "esriJobFailed") {
                        ctx.showMessageFailed();
                    }
                },
                error: function(responseData, textStatus, errorThrown) {
                    ctx.showMessageFailed();
                }
            });
        },
        _LoadResultVRP: async function(){
            var ctx = _thisVRP;
            try {
                ctx.jsonRoutesData = await ctx.loadLayersRoutesResultJobId2();                
            } catch (error) {
                console.error('Error:', error);
                ctx.showMessageFailed();
            }

            try {
                ctx.jsonStopData = await ctx.loadLayersStopsResultJobId2();                
            } catch (error) {
                console.error('Error:', error);
                ctx.showMessageFailed();
            }

            try {
                ctx.jsonUnStopData = await ctx.loadLayersUnStopsResultJobId2();                
            } catch (error) {
                console.error('Error:', error);
                ctx.showMessageFailed();
            }

            if (ctx.valPopulateDirections == "true") {
                try {
                    ctx.jsonDirectionsData = await ctx.loadLayersDirectionsResultJobId2();                    
                } catch (error) {
                    console.error('Error:', error);
                    ctx.showMessageFailed();
                }  
            }
            
            if (ctx.jsonRoutesData != null && ctx.jsonStopData != null && ctx.jsonUnStopData != null && (ctx.jsonDirectionsData != null || ctx.valPopulateDirections == "false")) {                        
                ctx._handleDatosService();
            }
        },

        loadLayersRoutesResultJobId2() {
          return new Promise(function(resolve, reject) {
            var ctx = _thisVRP;

            var requestOptions = {
              url: ctx.urlServiceVRP + '/jobs/' + ctx.ActualJob + "/results/out_routes",
              content: {
                token: ctx.token,
                f: "json"
              },
              handleAs: "json",
              callbackParamName: "callback"
            };

            esriRequest(requestOptions, {
              usePost: true
            }).then(function(response) {
              resolve(response);
            }).otherwise(function(error) {
              reject(error);
            });
          });
        },

        loadLayersStopsResultJobId2() {
          return new Promise(function(resolve, reject) {
            var ctx = _thisVRP;

            var requestOptions = {
              url: ctx.urlServiceVRP + '/jobs/' + ctx.ActualJob + "/results/out_stops",
              content: {
                token: ctx.token,
                f: "json"
              },
              handleAs: "json",
              callbackParamName: "callback"
            };

            esriRequest(requestOptions, {
              usePost: true
            }).then(function(response) {
              resolve(response);
            }).otherwise(function(error) {
              reject(error);
            });
          });
        },

        loadLayersUnStopsResultJobId2() {
          return new Promise(function(resolve, reject) {
            var ctx = _thisVRP;

            var requestOptions = {
              url: ctx.urlServiceVRP + '/jobs/' + ctx.ActualJob + "/results/out_unassigned_stops",
              content: {
                token: ctx.token,
                f: "json"
              },
              handleAs: "json",
              callbackParamName: "callback"
            };

            esriRequest(requestOptions, {
              usePost: true
            }).then(function(response) {
              resolve(response);
            }).otherwise(function(error) {
              reject(error);
            });
          });
        },

        loadLayersDirectionsResultJobId2() {
          return new Promise(function(resolve, reject) {
           var ctx = _thisVRP;

            var requestOptions = {
              url: ctx.urlServiceVRP + '/jobs/' + ctx.ActualJob + "/results/out_directions",
              content: {
                token: ctx.token,
                f: "json"
              },
              handleAs: "json",
              callbackParamName: "callback"
            };

            esriRequest(requestOptions, {
              usePost: true
            }).then(function(response) {
              resolve(response);
            }).otherwise(function(error) {
              reject(error);
            });
          });
        },
        _handleDatosService: function() {
            this.outputLayerName = this._outputName;
            a = {};
            var b = {};
            (a.OutputName = json.toJson({
                serviceProperties: {
                    name: this.get("outputLayerName")
                }
            }));
            (a.context = json.toJson({
                extent: this.map.extent._normalize(!0)
            }));
            (d = {
                outSR: this.map.spatialReference
            }, (d.extent = this.map.extent._normalize(!0)), a.context = json.toJson(d));
            (d.folder = this.get("folderId"));
            b.itemParams = d;
            b.jobParams = a;
            this.jobParams = b.jobParams;
            this._GetDatosServices();
        },
        _GetDatosServices: function() {
            var ctx = _thisVRP;
            var errores = [];
            var serviceUrl = ctx.urlDataModel + "/"+ ctx.ID_TB_Runs +"/query";
            var params = {
                where: "1=1", // Siempre devuelve todos los registros
                outFields: "RunID", // Campo del que deseas obtener el último valor
                orderByFields: "RunID DESC", // Campo de fecha para ordenar de manera descendente (reemplaza DATE_FIELD por el nombre de tu campo de fecha)
                resultRecordCount: 1, // Obtén solo un registro
                f: "json"
            };

             esriRequest({
                url: serviceUrl,
                content: params,
                handleAs: "json"
            }, {
                usePost: true
            }).then(
                lang.hitch(this, ctx._submitDatos)
            ).otherwise(function(error) {
                console.error("Error fetching RunID:", error);
                errores.push("Error al agregar runs.")
                ctx.showMessageFailedFeature(errores);
                return
            });
        },
        _submitDatos: async function(a) {  
            var ctx = _thisVRP;
            if (a.features && a.features.length > 0) {
                // Comprobar si el RunID obtenido es realmente el último                
                var lastRunID = a.features[0].attributes.RunID;
                
                // Comprobar si el último RunID obtenido es mayor que el almacenado
                if (lastRunID > ctx.lastFetchedRunID) {
                    // El último RunID obtenido es mayor, por lo tanto, es el más reciente
                    ctx.runID = lastRunID + 1; // Incrementar el siguiente RunID
                } else {
                    // El último RunID obtenido no es mayor, por lo tanto, no es el más reciente
                    ctx.runID = ctx.lastFetchedRunID + 1; // Incrementar basado en el almacenado
                }
            } else {
                ctx.runID = 1; // Si no hay RunIDs, comenzar desde 1
            }
            
            var errores = [];
            try {
                var runs = await ctx._addRuns();
                if (runs) {
                    var params = await ctx._addInputParams();
                    var orders = await ctx._addInputOrders();
                    var routes = await ctx._addInputRoutes();
                    ctx.addLayersToFeature(ctx.jsonRoutesData, ctx.jsonStopData, ctx.jsonUnStopData, ctx.jsonDirectionsData);
                } else {
                    console.error('Error al agregar runs'); // Manejo de errores específicos
                    errores.push("Error al agregar runs.")
                    ctx.showMessageFailedFeature(errores);
                }
            } catch (error) {
                console.error('Error:', error); // Manejo de errores específicos
                errores.push(error)
                ctx.showMessageFailedFeature(errores);
            }
        },

        _addInputParams: async function() {
            var ctx = _thisVRP;
            var serviceUrlParams = ctx.urlDataModel + "/"+ ctx.ID_INPUT_Params +"";
            
            //SE CORTA EL BREAK JSON PARA QUE INSERTE 50 caracteres (limitante datamodel length 50)
            var stringBreaks = this.JBreaks != null ? JSON.stringify(this.JBreaks) : "";
            var valBreaks = stringBreaks.substring(0, 50);
            
            var valuesArray = [
                { name: 'time_units', value: ctx.valTimeUnits },
                { name: 'distance_units', value: ctx.valDistanceUnits },
                { name: 'populate_directions', value: ctx.valPopulateDirections },
                { name: 'directions_language', value: ctx.valDirectionsLanguage },
                { name: 'save_route_data', value: ctx.valSaveRouteData },
                { name: 'populate_stop_shapes', value: true },
                { name: 'outSR', value: ctx.outSpatialReference },
                { name: 'breaks', value: valBreaks }
            ];
            
            ctx.lastFetchedRunID = ctx.runID;
            var editRequestParams = {
                adds: valuesArray.map(function(feature) {
                    const newData = {};
                    newData.Param_Name = feature.name
                    newData.Param_Value = feature.value
                    newData.RunID = ctx.runID
                    var attr = newData
                    return {
                        attributes: attr
                    };
                })
            };          

            var ParamsAgregados = false;
            
            await $.ajax({
                type: 'POST',
                url: serviceUrlParams + '/applyEdits',
                crossDomain: true,
                data: {
                    token: ctx.token,
                    adds: json.toJson(editRequestParams.adds),
                    f: "json",
                },
                dataType: 'json',
                success: function(responseData, textStatus, jqXHR) {                    
                    if (responseData.addResults) {
                        ParamsAgregados = true                        
                    }
                    else{
                        ParamsAgregados = false
                    }
                    
                },
                error: function(responseData, textStatus, errorThrown) {                    
                    ParamsAgregados = false
                }
            });
        
            
            return ParamsAgregados;
        },

        onReceiveData: function(name, source, params) {
          if (name == "TableVRP" && params.data.function == "updateJsonOrders") {
            this.updateJsonOrders(params.data.json);
          }    
        },

        updateJsonOrders: function(jsonUpdate) {
            var ctx = _thisVRP;            
            ctx.JsonOrders = jsonUpdate;
        },

        _addRuns: async function() {
            var ctx = _thisVRP;
            var serviceUrlRuns = ctx.urlDataModel + "/"+ ctx.ID_TB_Runs +"";
            const jobParamsContext = JSON.parse(ctx.jobParams.context);
            var d = IdentityManager.credentials[0];

            var fechaLocal = new Date();
            // Obtener el desplazamiento de la zona horaria local en milisegundos
            var offsetLocal = fechaLocal.getTimezoneOffset() * 60 * 1000;
            // Calcular el tiempo UNIX en la zona horaria de Argentina
            var fechaArgentinaEpoch = fechaLocal.getTime() - offsetLocal + (3 * 60 * 60 * 1000); // UTC+3 para Argentina

            var name = this._outputName;
            var description = this._outputDesc;

            params = [
                        {
                        "attributes" : {
                            "NAME": name,
                            "DESCRIPTION": description,
                            "JOBID": ctx.ActualJob,
                            "URL": ctx.urlServiceVRP + '/jobs/' + ctx.ActualJob,
                            "RUNID": ctx.runID,
                            "USECASE_ID": ctx.caseID,
                            "USERNAME": d.userId,
                            "RUNDATE": fechaArgentinaEpoch,
                            "OUTSPATIALREFERENCE": ctx.outSpatialReference
                        }
                      }
                    ]        

            var RunsAgregados = false;
            
            await $.ajax({
                type: 'POST',
                url: serviceUrlRuns + '/applyEdits',
                crossDomain: true,
                data: {
                    token: ctx.token,
                    adds: json.toJson(params),
                    f: "json",
                },
                dataType: 'json',
                success: function(responseData, textStatus, jqXHR) {    
                                
                    if (responseData.addResults) {
                        RunsAgregados = true
                    }
                    else{
                        RunsAgregados = false
                    }
                    
                },
                error: function(responseData, textStatus, errorThrown) {                    
                    RunsAgregados = false
                }
            });
            
            return RunsAgregados;
        },
        _addInputOrders: async function() {
            var ctx = _thisVRP;
            var serviceUrlOrders = ctx.urlDataModel + "/"+ ctx.ID_INPUT_Orders +"";
            const jobParamsContext = JSON.parse(ctx.jobParams.context);
            
            // Crear una solicitud para agregar los features Orders
            var featuresToAddOrders = this.JOrders.features;
            var editRequestOrders = {
                adds: featuresToAddOrders.map(function(feature) {
                    var geometry = feature.geometry
                    const newData = {};
                    for (let key in feature.attributes) {
                        if (Object.prototype.hasOwnProperty.call(feature.attributes, key)) {
                            newData[key.toLowerCase()] = feature.attributes[key];
                        }
                    }
                    //CARGAR RUN ID integer
                    newData.RunID = ctx.runID
                    var attr = newData
                    return {
                        attributes: attr,
                        geometry: geometry
                    };
                })
            };
            ctx.token = IdentityManager.credentials[0].token;
            const OrdersAgregados = await esriRequest({
                url: serviceUrlOrders + "/applyEdits",
                content: {
                    token: ctx.token,
                    f: "json",
                    adds: JSON.stringify(editRequestOrders.adds)
                },
                handleAs: "json",
                callbackParamName: "callback"
            }).then(function(response) {               
                return true                
            }).otherwise(function(error) {               
                return false
            });;

            return OrdersAgregados;
        },
        _addInputRoutes: async function() {
            var ctx = _thisVRP;
            var serviceUrlRoutes = ctx.urlDataModel + "/"+ ctx.ID_INPUT_Routes +"";
            const jobParamsContext = JSON.parse(ctx.jobParams.context);
            
            // Crear una solicitud para agregar los features Routes
            var featuresToAddRoutes = this.JRoutes.features;
            var editRequestRoutes = {
                adds: featuresToAddRoutes.map(function(feature) {
                    const newData = {};
                    for (let key in feature.attributes) {
                        if (Object.prototype.hasOwnProperty.call(feature.attributes, key)) {
                            newData[key.toLowerCase()] = feature.attributes[key];
                        }
                    }
                    //CARGAR RUN ID integer
                    newData.RunID = ctx.runID
                    var attr = newData
                    return {
                        attributes: attr
                    };
                })
            };
            ctx.token = IdentityManager.credentials[0].token;
            const InputsRoutesAgregados = await esriRequest({
                url: serviceUrlRoutes + "/applyEdits",
                content: {
                    token: ctx.token,
                    f: "json",
                    adds: JSON.stringify(editRequestRoutes.adds)
                },
                handleAs: "json",
                callbackParamName: "callback"
            }).then(function(response) {                           
                return true
            }).otherwise(function(error) {                           
                return false
            });;

            return InputsRoutesAgregados;
        },

        applyEditsVRP: function (url, adds, updates, deletes) {
            var ctx = _thisVRP;
            ctx.token = IdentityManager.credentials[0].token;
            return new Promise((resolve, reject) => {
                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        token: ctx.token,
                        f: 'json',
                        adds: JSON.stringify(adds),
                        updates: JSON.stringify(updates),
                        deletes: JSON.stringify(deletes),
                    }),
                };

                fetch(url + '/applyEdits', requestOptions)
                    .then(response => response.json())
                    .then(data => {
                        if (data.addResults && data.updateResults && data.deleteResults) {
                            resolve(data);
                        } else {
                            reject('Error en el resultado del applyEdits.');
                        }
                    })
                    .catch(error => {
                        reject(error);
                    });
            });
        },

        addLayersToFeature: async function(routesData, stopsData, unStopsData, directionsData) {            
            var ctx = _thisVRP;

            // URL del servicio de entidades creado previamente
            var serviceUrlRoutes = ctx.urlDataModel + "/"+ ctx.ID_out_routes +"";
            var serviceUrlStops = ctx.urlDataModel + "/"+ ctx.ID_out_assigned_stops +"";
            var serviceUrlUnStops = ctx.urlDataModel + "/"+ ctx.ID_out_unassigned_stops +"";
            var serviceUrlDirections = ctx.urlDataModel + "/"+ ctx.ID_out_directions +"";
            var serviceUrlBarriersPoint = ctx.urlDataModel + "/"+ ctx.ID_out_barriers_point +"";
            const jobParamsContext = JSON.parse(ctx.jobParams.context);

            // Crear una solicitud para agregar los features Routes usando applyEdits 
            var featuresToAddRoutes = routesData.value.features;
            var editRequestRoutes = {
                adds: featuresToAddRoutes.map(function(feature) {
                    var geometry = feature.geometry
                    const newData = {};
                    for (let key in feature.attributes) {
                        if (Object.prototype.hasOwnProperty.call(feature.attributes, key)) {
                            newData[key.toLowerCase()] = feature.attributes[key];
                        }
                    }
                    //CARGAR RUN ID integer
                    newData.UseCase_ID = ctx.caseID
                    newData.RunID = ctx.runID
                    var attr = newData
                    return {
                        attributes: attr,
                        geometry: geometry
                    };
                })
            };

            // Crear una solicitud para agregar los features Stops usando applyEdits 
            var featuresToAddStops = stopsData.value.features;
            var editRequestStops = {
                adds: featuresToAddStops.map(function(feature) {
                    var geometry = feature.geometry
                    const newData = {};
                    for (let key in feature.attributes) {
                        if (Object.prototype.hasOwnProperty.call(feature.attributes, key)) {
                            newData[key.toLowerCase()] = feature.attributes[key];
                        }
                    }
                    //CARGAR RUN ID integer
                    newData.UseCase_ID = ctx.caseID
                    newData.RunID = ctx.runID
                    var attr = newData
                    return {
                        attributes: attr,
                        geometry: geometry
                    };
                })
            };

            // Crear una solicitud para agregar los features Unnasigned Stops usando applyEdits 
            var featuresToAddUnStops = unStopsData.value.features;
            var editRequestUnStops = {
                adds: featuresToAddUnStops.map(function(feature) {
                    var geometry = feature.geometry
                    const newData = {};
                    for (let key in feature.attributes) {
                        if (Object.prototype.hasOwnProperty.call(feature.attributes, key)) {
                            newData[key.toLowerCase()] = feature.attributes[key];
                        }
                    }
                    //CARGAR RUN ID integer
                    newData.UseCase_ID = ctx.caseID
                    newData.RunID = ctx.runID
                    var attr = newData
                    return {
                        attributes: attr,
                        geometry: geometry
                    };
                })
            };
              
            ctx.erroresAddLayers = [];
            const updates = [];
            const deletes = [];

            await ctx.applyEditsVRP(serviceUrlUnStops, editRequestUnStops.adds, updates, deletes)
            .then(result => {
            })
            .catch(error => {
                ctx.erroresAddLayers.push("Error al agregar Unassigned Stops")            
                ctx.showMessageFailedFeature(ctx.erroresAddLayers);
                return
            });

            await ctx.applyEditsVRP(serviceUrlRoutes, editRequestRoutes.adds, updates, deletes)
            .then(result => {
            })
            .catch(error => {
                ctx.erroresAddLayers.push("Error al agregar Routes")            
                ctx.showMessageFailedFeature(ctx.erroresAddLayers);
                return
            });

            await ctx.applyEditsVRP(serviceUrlStops, editRequestStops.adds, updates, deletes)
            .then(result => {
            })
            .catch(error => {
                console.error('Error en applyEdits Stops:', error);
                ctx.erroresAddLayers.push("Error al agregar Stops")            
                ctx.showMessageFailedFeature(ctx.erroresAddLayers);
                return
            });    

            if (ctx.valPopulateDirections == "true") {
                // Crear una solicitud para agregar los features Directions usando applyEdits 
                var featuresToAddDirections = directionsData.value.features; 
                const editRequestDirections = {
                    adds: featuresToAddDirections.map(function(feature) {
                        var geometry = feature.geometry
                        const newData = {};
                        for (let key in feature.attributes) {
                            if (Object.prototype.hasOwnProperty.call(feature.attributes, key)) {
                                newData[key.toLowerCase()] = feature.attributes[key];
                            }
                        }
                        //CARGAR RUN ID integer
                        newData.UseCase_ID = ctx.caseID
                        newData.RunID = ctx.runID
                        var attr = newData
                        return {
                            attributes: attr,
                            geometry: geometry
                        };
                    })
                }

                await ctx.applyEditsVRP(serviceUrlDirections, editRequestDirections.adds, updates, deletes)
                .then(result => {
                })
                .catch(error => {
                    ctx.erroresAddLayers.push("Error al agregar Directions")            
                    ctx.showMessageFailedFeature(ctx.erroresAddLayers);
                    return
                });
            }
            
            if (ctx.JBarriersPoint != null ) {                
                // Crear una solicitud para agregar los features BarriersPoint usando applyEdits 
                var featuresToAddBarriersPoint = ctx.JBarriersPoint.features; 
                const editRequestBarriersPoint = {
                    adds: featuresToAddBarriersPoint.map(function(feature) {
                        var geometry = feature.geometry
                        const newData = {};
                        for (let key in feature.attributes) {
                            if (Object.prototype.hasOwnProperty.call(feature.attributes, key)) {
                                newData[key.toLowerCase()] = feature.attributes[key];
                            }
                        }
                        //CARGAR RUN ID integer
                        newData.UseCase_ID = ctx.caseID
                        newData.RunID = ctx.runID
                        var attr = newData
                        return {
                            attributes: attr,
                            geometry: geometry
                        };
                    })
                }

                await ctx.applyEditsVRP(serviceUrlBarriersPoint, editRequestBarriersPoint.adds, updates, deletes)
                .then(result => {
                })
                .catch(error => {
                    ctx.erroresAddLayers.push("Error al agregar Barriers Point")            
                    ctx.showMessageFailedFeature(ctx.erroresAddLayers);
                    return
                });
            }
            
            if (ctx.erroresAddLayers.length <= 0) {
                ctx.addResultToMap(ctx.urlDataModel);
            }
            
            
        },
        generatePastelColor: function () {
               // Generar valores de canal de color en un rango más amplio (100-255)
                var red = Math.floor(Math.random() * 156) + 100; // Rango: 100-255
                var green = Math.floor(Math.random() * 156) + 100; // Rango: 100-255
                var blue = Math.floor(Math.random() * 156) + 100; // Rango: 100-255

                // Devolver el color en formato [R, G, B, A] (con opacidad completa)
                return [red, green, blue, 190];
        },
        _generateCheckboxTableLayers: function (layerGroups) {
             var ctx = _thisVRP;
            var tbody = document.getElementById('checkboxGridLayers');

            // Limpiar el contenido existente de la tabla
            tbody.innerHTML = '';

            // Crear una fila para cada ruta
            ctx._DatosRoutes.forEach(function(route) {
                var row = document.createElement('tr');

                // Crear una celda para el nombre de la ruta
                var routeCell = document.createElement('td');
                routeCell.textContent = route.attributes.Name; // Nombre de la ruta
                row.appendChild(routeCell);

                // Crear celdas para los checkboxes de cada día de la semana
                var daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
                daysOfWeek.forEach(function(day) {
                    var dayCell = document.createElement('td');

                    // Verificar si alguna capa en algún grupo corresponde a este día
                    var hasLayerForDay = layerGroups.some(function(group) {
                        // Verificar si el nombre del grupo corresponde al día y a la ruta
                        return group.name.toLowerCase().includes(day.toLowerCase()) &&
                               group.name.toLowerCase().startsWith(route.attributes.Name.toLowerCase());
                    });

                    if (hasLayerForDay) {
                        var groupCheckbox = document.createElement('input');
                        groupCheckbox.type = 'checkbox';
                        groupCheckbox.value = day;
                        groupCheckbox.checked = true; // Por defecto, todos los grupos están visibles
                        groupCheckbox.addEventListener('change', function() {
                            var isChecked = this.checked;

                            // Iterar sobre los grupos de capas
                            layerGroups.forEach(function(group) {
                                // Verificar si el nombre del grupo incluye el día de la semana
                                if (group.name.toLowerCase().includes(day.toLowerCase()) &&
                                    group.name.toLowerCase().startsWith(route.attributes.Name.toLowerCase())) {
                                    // Iterar sobre las capas del grupo
                                    group.layers.forEach(function(layer) {
                                        if (isChecked) {
                                            // Mostrar la capa si el checkbox está marcado
                                            layer.show();
                                        } else {
                                            // Ocultar la capa si el checkbox está desmarcado
                                            layer.hide();
                                        }
                                    });
                                }
                            });
                        });
                        dayCell.appendChild(groupCheckbox);
                    }

                    // Agregar la celda al final de la fila
                    row.appendChild(dayCell);
                });

                // Agregar la fila a la tabla
                tbody.appendChild(row);
            });
        },
        addResultToMap: async function(urlFeatureServer) {  
            var ctx = _thisVRP;      
            ctx.map.showLabels = true;
            ctx.featureLayer0 = null;
            ctx.featureLayer1 = null;
            ctx.featureLayer2 = null;

            var infoTemplate = new InfoTemplate();
            infoTemplate.setTitle("Información detallada");
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

            //ROUTES        
            // Agregar información de dibujo (drawingInfo) a layerData Routes
            var uniqueValuesRoutes = [...new Set(ctx.jsonRoutesData.value.features.map(feature => feature.attributes.Name))];
            // Define los símbolos para cada categoría única
            
            var symbolsRoutes = uniqueValuesRoutes.map((value, index) => ({
                value: value.toString(), // El valor único como string
                label: value.toString(),
                symbol: { // Define aquí tu símbolo para cada categoría
                    type: "esriSLS", // Tipo de símbolo (línea en este caso)
                    style: "esriSLSSolid",
                    color: ctx.generatePastelColor(), // Color aleatorio para demostración
                    width: 3 // Ancho de la línea
                }
            }));

            var drawingInfoRoutes = {
                renderer: {
                    type: "uniqueValue", // Tipo de renderer
                    field1: "Name", // Campo para clasificar
                    uniqueValueInfos: symbolsRoutes // Información de valores únicos y sus símbolos
                },
                Transparency: 25
            };

            ctx.arrayLayersRoutes = [];

            var layerGroups = [];

            await uniqueValuesRoutes.forEach(opcion => {
                var fLayer = new FeatureLayer(urlFeatureServer + "/"+ ctx.ID_out_routes +"", {
                    id: "Route " + opcion,  
                    title: "Route " + opcion,      
                    outFields: ["*"],
                    infoTemplate: infoTemplate,
                    mode: FeatureLayer.MODE_ONDEMAND,
                    minScale: 1500000
                });

                var queryDefinition = "RunID = " + ctx.runID + " AND Name = '" + opcion + "'";
                fLayer.setDefinitionExpression(queryDefinition);

                var propRendRoutes = new UniqueValueRenderer(drawingInfoRoutes.renderer);
                fLayer.setRenderer(propRendRoutes);

                var jsonLayer = { name: opcion, layers: []};
                jsonLayer.layers.push(fLayer);
                layerGroups.push(jsonLayer);
                ctx.arrayLayersRoutes.push(fLayer);
            });  
            

            //STOPS 
            //var uniqueValuesStops = [...new Set(ctx.jsonStopData.value.features.map(feature => feature.attributes.RouteName))];
            
            // Define los símbolos para cada categoría única
            var symbolsStops = uniqueValuesRoutes.map((value, index) => ({
              value: value.toString(), // El valor único como string,
              label: value.toString(),
              symbol: {
                        type: "esriSMS",
                        style: "esriSMSCircle",
                        color: drawingInfoRoutes.renderer.uniqueValueInfos[index].symbol.color,
                        size: 10.0,
                        angle: 0.0,
                        xoffset: 0,
                        yoffset: 0,
                        outline: {
                            color: [255, 255, 115, 190],
                            width: 2
                        }
                    }
            }));

            var drawingInfoStops = {
              renderer: {
                type: "uniqueValue", // Tipo de renderer
                field1: "RouteName", // Campo para clasificar
                uniqueValueInfos: symbolsStops // Información de valores únicos y sus símbolos
              },        
              transparency: 0
            };

            var labelingInfo = {
              "labelExpressionInfo": {"value": "{Sequence}"},
              "fieldInfos": [
                {
                  "fieldName": "Sequence"
                }
              ],
              "symbol": {
                 "backgroundColor": null,
                 "kerning": true,
                 "color": [255,255,255,255],
                 "yoffset": 0,
                 "xoffset": 0,
                 "rotated": false,
                 "type": "esriTS",
                 "borderLineColor": null,
                 "horizontalAlignment": "center",
                 "angle": 0,
                 "rightToLeft": false,
                 "text": "",
                 "font": {
                  "size": 6.75,
                  "weight": "bold",
                  "style": "normal",
                  "family": "Arial",
                  "decoration": "none"
                 }
                },
              "useCodedValues":  false,
              "labelPlacement": "esriServerPointLabelPlacementCenterCenter",
              "minScale": 0.0,
              "maxScale": 0.0,
            };

            ctx.arrayLayersStops = [];

            await uniqueValuesRoutes.forEach(opcion => {     
                var fLayer = new FeatureLayer(urlFeatureServer + "/"+ ctx.ID_out_assigned_stops +"", {
                    id: "Stops " + opcion,
                    title: "Stops " + opcion,
                    outFields: ["*"],
                    infoTemplate: infoTemplate,
                    showLabels: true,
                    mode: FeatureLayer.MODE_ONDEMAND,
                    minScale: 1500000
                });
                
                var lc = new LabelClass(labelingInfo);
                fLayer.setLabelingInfo([ lc ]);

                var queryDefinition = "RunID = " + ctx.runID + " AND RouteName = '" + opcion + "'";
                fLayer.setDefinitionExpression(queryDefinition);

                var propRendStop = new UniqueValueRenderer(drawingInfoStops.renderer);
                fLayer.setRenderer(propRendStop); //MODIFICO EL RENDER DEL FL      

                for (var i = 0; i < layerGroups.length; i++) {
                    // Verificar si el nombre del grupo coincide con el nombre buscado
                    if (layerGroups[i].name === opcion) {
                        // Agregar un nuevo layer al array de layers del grupo encontrado
                        layerGroups[i].layers.push(fLayer);
                        // Salir del bucle ya que se ha encontrado el grupo
                        break;
                    }
                }

                ctx.arrayLayersStops.push(fLayer);
            }); 

            //UNASSIGNED STOPS

            var simpleJson = {
                "type": "simple",
                "label": "",
                "description": "",
                "symbol": {
                  "color": [255, 0, 0, 255, 0],
                  "size": 6,
                  "angle": 0,
                  "xoffset": 0,
                  "yoffset": 0,
                  "type": "esriSMS",
                  "style": "esriSMSCircle",
                  "outline": {
                    "color": [255, 255, 115, 0],
                    "width": 1,
                    "type": "esriSLS",
                    "style": "esriSLSSolid"
                  }
                }
            }
            var rend = new SimpleRenderer(simpleJson);

            ctx.featureLayer2 = new FeatureLayer(urlFeatureServer + "/"+ ctx.ID_out_unassigned_stops +"", {
                id: "out_unassigned_stops",  
                outFields: ["*"],
                infoTemplate: infoTemplate,
                mode: FeatureLayer.MODE_ONDEMAND,
                minScale: 1500000
            });
            var minScale = ctx.featureLayer2.minScale;
            var maxScale = ctx.featureLayer2.maxScale;
            
            //var propRendUnStop = new UniqueValueRenderer(drawingInfoUnStops.renderer);
            ctx.featureLayer2.setRenderer(rend); //MODIFICO EL RENDER DEL FL

            var queryDefinition = "RunID = " + ctx.runID;
            ctx.featureLayer2.setDefinitionExpression(queryDefinition);
            
            //LOAD LAYERS IN MAP            
            await ctx.map.addLayer(ctx.featureLayer2);
            //await ctx.map.addLayer(ctx.featureLayer0);
            await ctx.map.addLayers(ctx.arrayLayersRoutes);
            //await ctx.map.addLayer(ctx.featureLayer1);
            await ctx.map.addLayers(ctx.arrayLayersStops);
            
            ctx.finishRun = true;

            //BUSCAR COMO ACTIVAR SHOW LABELS
            ctx.map.setExtent(ctx.gExtentActual);

            var msjFinal = [];
            msjFinal.push("Nombre: " + ctx._outputName);
            msjFinal.push("Run ID: " + ctx.runID)
            ctx.showMessageSucceededFeature(msjFinal);
            //await ctx._generateCheckboxTableLayers(layerGroups);
            
            //ENVIAR DATOS A OTRO WIDGET                
            var jsonTableVRP = [];

            var jsonRun = {
                runID: ctx.runID,
                urlRoutes: urlFeatureServer + "/"+ ctx.ID_out_routes,
                urlStops: urlFeatureServer + "/"+ ctx.ID_out_assigned_stops,
                urlUnStops: urlFeatureServer + "/"+ ctx.ID_out_unassigned_stops,
            }

            jsonTableVRP.push(ctx.jsonRoutesData);
            jsonTableVRP.push(ctx.jsonStopData);
            jsonTableVRP.push(ctx.jsonUnStopData);
            
            ctx.publishData({
            'target':"TableVRP",
            'data': {json: jsonRun, function: "LoadTableRoutes", tableRoutes: ctx._DatosRoutes, dataOrders: ctx.JOrders}
            }); 
        },
    });
});