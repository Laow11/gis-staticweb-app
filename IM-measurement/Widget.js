var jqueryUrl
if (window.jQuery) {
    jqueryUrl = "./libs/blank"
} else {
    jqueryUrl = './libs/jquery.min'
}
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/aspect',
    'dojo/Deferred',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/portalUtils',
    'jimu/dijit/Message',
    "esri/SpatialReference",
    'esri/tasks/GeometryService',
    'esri/tasks/ProjectParameters',
    'esri/tasks/IdentifyParameters',
    'esri/tasks/IdentifyTask',
    'esri/units',
    'esri/dijit/Measurement',
    "esri/symbols/jsonUtils",
    jqueryUrl
],
    function (
        declare,
        lang,
        aspect,
        Deferred,
        _WidgetsInTemplateMixin,
        BaseWidget,
        PortalUtils,
        Message,
        SpatialReference,
        GeometryService,
        ProjectParameters,
        IdentifyParameters,
        IdentifyTask,
        esriUnits,
        Measurement,
        jsonUtils) {
        var widgObj
        var widgClass = declare([BaseWidget, _WidgetsInTemplateMixin], {
            name: 'Measurement',
            gsvc: null,
            isLocationToolActivated: false,
            //GGO - 27/04/2018 - Establecemos los Event Handlers adicionales
            onToolChangeEventHandler: null,
            onMeasureEndEventHandler: null,
            onMapMouseMoveEndEventHandler: null,
            aditionalCoordinatesHtml: null,
            //RJS - Variables de uso interno para consumir transformaciones desde webservices
            getSystemsEndpoint: "/GetSystems",
            getTransformationsEndpoint: "/GetTransformations",
            conversionEndpoint: "/MassiveConvert",
            defaultWGS84Id: 1,
            defaultUserName: "IM",
            defaultApplicationName: "IM Calc Geo",
            systemsObject: null,
            transformationsObject: null,
            currentOutSystemID: null,
            currentOuputCoordinates: null,
            oldResultLabelText: "",
            mPanel: null,
            measurement: null,
            _pcDef: null,

            startup: function () {
                widgObj = this
                this.mPanel = $("#" + this.id + "_panel");
                widgObj._GetSystemsInfo(widgObj.populateSystemsCombo)
                var gsvcURL = this.config.geometryServiceURL
                //RJS - Fix geometry server
                esriConfig.defaults.geometryService = new GeometryService(gsvcURL)
                gsvc = new GeometryService(gsvcURL)
                this.aditionalCoordinatesHtml = $("#aditionalCoordinates").clone()
                $("#aditionalCoordinates").hide()
                $("#decimalCoordinates").hide()
                $(".widgetFooter").hide()
                if (this.measurement || this._pcDef) {
                    return
                }
                this.inherited(arguments)
                var json = this.config.measurement
                json.map = this.map
                json.advancedLocationUnits = true
                if (json.lineSymbol) {
                    json.lineSymbol = jsonUtils.fromJson(json.lineSymbol)
                }
                if (json.pointSymbol) {
                    json.pointSymbol = jsonUtils.fromJson(json.pointSymbol)
                }
                this._processConfig(json).then(lang.hitch(this, function (measurementJson) {
                    this.measurement = new Measurement(measurementJson, this.measurementDiv);
                    //RJS -- Detección automática del color del tema y repintado del widget.
                    var main_background = $(".jimu-on-screen-widget-panel>.jimu-panel-title").css('backgroundColor')
                    $(".esriMeasurement .esriMeasurementResultLabel").css({ "background-color": main_background })
                    $(".im-measurement-autocolor").css({ "background-color": main_background })
                    $(".measurement-out-systemLabel").css({ "color": main_background })
                    $(".measurement-out-coordinateSystem").css({ "border-bottom": "solid 1px " + main_background })
                    //GGO - 27/04/2018 - Evento de cambio de herramienta para agregar la tabla de resultados de coordenadas planares
                    this.onToolChangeEventHandler = this.measurement.on("tool-change", lang.hitch(this, function (pEvent) {
                        if (pEvent["toolName"] === "location") {
                            this.mPanel.height(340)
                            //RJS - Sustituye la imagen por defecto por un ícono SVG fontawesome
                            $($(".esriMeasurementTableRow>td:eq(3)")).empty()
                            $($(".esriMeasurementTableRow>td:eq(3)")).append('<i style="font-size: 18px;" class="fas fa-map-pin"></i>')
                            // GGO - Mostramos tablero de coordenadas planares
                            $("#aditionalCoordinates").show()
                            // GGO - Mostramos tablero de coordenadas grados-minutos-segundos
                            $("#decimalCoordinates").show()
                            // RJS - Mostrar el footer del widget
                            $(".widgetFooter").show()
                            // GGO - Ocultamos el botón para cambiar de unidad, siempre usa el tablero default con Decimales
                            $($("span[widgetid='dijit_form_DropDownButton_0']")).hide()
                            // GGO - Y cambiamos el texto del primer tablero para que sea el correcto
                            this.oldResultLabelText = $($("div[dojoattachpoint='resultLabel']")[0]).text()
                            $($("div[dojoattachpoint='resultLabel']")[0]).text("Proyección WGS84")
                            this.isLocationToolActivated = true
                        } else {
                            this.mPanel.height(150)
                            // GGO - Ocultamos tablero de coordenadas planares
                            $("#aditionalCoordinates").hide()
                            // GGO - Ocultamos tablero de coordenadas grados-minutos-segundos
                            $("#decimalCoordinates").hide()
                            // RJS - Ocultar el footer del widget
                            $(".widgetFooter").hide()
                            // GGO - Mostramos el botón para cambiar de unidad, siempre usa el tablero default con Decimales
                            $($("span[widgetid='dijit_form_DropDownButton_0']")).show()
                            // GGO - Y cambiamos el texto del primer tablero para que sea el correcto
                            if (widgObj.oldResultLabelText) {
                                $($("div[dojoattachpoint='resultLabel']")[0]).text(this.oldResultLabelText)
                            }
                            this.clearAditionalLocations()
                            this.isLocationToolActivated = false
                        }
                    }))
                    //GGO - 27/04/2018 - Event para proyectar un punto hecho con un click
                    this.onMeasureEndEventHandler = this.measurement.on("measure-end", lang.hitch(this, function (pEvent) {
                        if (pEvent["toolName"] === "location") {
                            this.projectPoint(pEvent.geometry)
                            this.projectPointDMS(pEvent.geometry)
                        }
                    }))
                    //GGO - 27/04/2018 - Event para proyectar un punto obtenido a partir de movimiento
                    this.onMapMouseMoveEndEventHandler = this.map.on("mouse-move", lang.hitch(this, function (pMouseEvent) {
                        if (this.isLocationToolActivated) {
                            this.projectHoveredPoint(pMouseEvent.mapPoint)
                        }
                    }))
                    this.own(aspect.after(this.measurement, 'setTool', lang.hitch(this, function () {
                        if (this.measurement.activeTool) {
                            this.disableWebMapPopup()
                        } else {
                            this.enableWebMapPopup()
                        }
                    })))
                    this.measurement.startup()
                    this._hideToolsByConfig()
                }), lang.hitch(this, function (err) {
                    new Message({
                        message: err.message || err
                    })
                }))
                this.mPanel.width(350)
                this.mPanel.height(150)
                this._listenMapCapabilities()
            },
            _GetSystemsInfo: function (callback_success) {
                //RJS - Obtiene la información de los sistemas y transformaciones disponibles en el webservice
                widgObj.callService("POST", widgObj.config.transformationsServiceURL + widgObj.getSystemsEndpoint, {}, function (success_systems) {
                    widgObj.systemsObject = success_systems.GetSystemsResult
                    widgObj.callService("POST", widgObj.config.transformationsServiceURL + widgObj.getTransformationsEndpoint, {}, function (success_transformations) {
                        widgObj.transformationsObject = success_transformations.GetTransformationsResult
                        callback_success()
                    }, function (error_transformations) {
                        console.warn(error_transformations)
                    })
                }, function (error_systems) {
                    console.warn(error_systems)
                })
            },
            populateSystemsCombo: function () {
                //RJS - Popula combos
                var comboHTML = widgObj.getOutSystemsCombo(widgObj.config.UG)
                $("#measurement-out-coordinateSystem").empty()
                $("#measurement-out-coordinateSystem").append(comboHTML)
                $("#measurement-out-coordinateSystem").unbind().change(function (e) {
                    e.preventDefault()
                    var outSys = $(this).val()
                    widgObj.currentOutSystemID = parseInt(outSys)
                    if (widgObj.measurement.markerLatitude.innerText != "---" && widgObj.measurement.markerLongitude.innerText != "---") {
                        var lat = parseFloat(widgObj.measurement.markerLatitude.innerText.replace(",", "."))
                        var lon = parseFloat(widgObj.measurement.markerLongitude.innerText.replace(",", "."))
                        widgObj.projectPointWithWebServices({ x: lon, y: lat, type: "point", spatialReference: { wkid: 4326 } })
                    }
                })
            },
            getOutSystemsCombo: function (system_cuenca) {
                //RJS - Arma el combo de sistemas de salida por cuenca
                if (widgObj.systemsObject) {
                    var auxHTML = ""
                    var isFirst = true
                    //Deja por defecto el sistema del mapa en primera posición.
                    for (var i = 0; i < widgObj.systemsObject.length; i++) {
                        for (var j = 0; j < widgObj.systemsObject[i].Basins.length; j++) {
                            if (widgObj.systemsObject[i].Basins[j].Id === system_cuenca && widgObj.config.mapSys == widgObj.systemsObject[i].Id) {
                                var currentSystem = widgObj.systemsObject[i]
                                auxHTML += "<option value='" + parseInt(currentSystem.Id) + "'>" + currentSystem.Name + "</option>"
                                if (isFirst) {
                                    isFirst = false
                                    widgObj.currentOutSystemID = currentSystem.Id
                                }
                            }
                        }
                    }
                    for (var i = 0; i < widgObj.systemsObject.length; i++) {
                        for (var j = 0; j < widgObj.systemsObject[i].Basins.length; j++) {
                            if (widgObj.systemsObject[i].Basins[j].Id === system_cuenca && widgObj.defaultWGS84Id != widgObj.systemsObject[i].Id && widgObj.config.mapSys != widgObj.systemsObject[i].Id) {
                                var currentSystem = widgObj.systemsObject[i]
                                auxHTML += "<option value='" + parseInt(currentSystem.Id) + "'>" + currentSystem.Name + "</option>"
                                if (isFirst) {
                                    isFirst = false
                                    widgObj.currentOutSystemID = currentSystem.Id
                                }
                            }
                        }
                    }
                    return auxHTML
                } else {
                    return null
                }
            },
            transformationProcedure: function (evt, callback_success, callback_error) {
                //RJS - Procedimiento de transformación, espera 5 segundos a que estén cargados los sistemas disponibles para la cuenca actual.
                var tryMax = 8
                var tryIni = 0
                setTimeout(function () {
                    if (tryIni < tryMax) {
                        tryIni++
                        if (parseInt(widgObj.currentOutSystemID) != parseInt(widgObj.config.mapSys)) {
                            widgObj.callService("POST", widgObj.config.transformationsServiceURL + widgObj.conversionEndpoint, evt, callback_success, callback_error)
                        } else {
							var isCommaSeparated = $(".coordinate-info").text().split("  ")[0].split(",").length
                            if(isCommaSeparated>1){
								var ouputTransform = { Y: parseFloat($(".coordinate-info").text().split("  ")[0].replace(".", "").replace(".", "").replace(".", "").replace(".", "").replace(",", ".")), X: parseFloat($(".coordinate-info").text().split("  ")[1].replace(".", "").replace(".", "").replace(".", "").replace(".", "").replace(",", ".")) }
							}else{
								var ouputTransform = { Y: parseFloat($(".coordinate-info").text().split("  ")[0].replace(".", "").replace(".", "").replace(".", "").replace(".", "")), X: parseFloat($(".coordinate-info").text().split("  ")[1].replace(".", "").replace(".", "").replace(".", "").replace(".", "")) }
						    }
                            
                            var transformation_success = {
                                "MassiveConvertResult": [
                                    {
                                        "Output": ouputTransform,
                                        "Message": "Ok"
                                    }
                                ]
                            }
                            callback_success(transformation_success)
                        }
                    } else {
                        console.warn("No System Detected")
                    }
                }, 500)
            },
            //GGO - 27/04/2018 - Función para proyectar punto clickeado
            projectPoint: function (pPoint) {
                widgObj.projectPointWithWebServices(pPoint)
                var mOutSpatialReference = new SpatialReference(22182)
                var params = new ProjectParameters()
                params.geometries = [pPoint]
                params.outSR = mOutSpatialReference
                // RJS - Obtener altura
                gsvc.project(params, function (projectedPoints) {
                    var mPointProjected = projectedPoints[0];
                    if (widgObj.config.demServiceURL && widgObj.config.altitudeField) {
                        widgObj.getAltitude(mPointProjected)
                    }
                })
            },
            projectPointWithWebServices: function (pPoint) {
                //RJS - Proyecta un punto en WGS84 al sistema seleccionado 
                if (widgObj.config.invertAxis || widgObj.config.invertAxis == undefined) {
                    var evt = {
                        "request": {
                            "Coordinates": [{
                                "X": pPoint.y,
                                "Y": pPoint.x,
                                "Z": 0
                            }],
                            "InputSystemId": widgObj.defaultWGS84Id,
                            "OutputSystemId": widgObj.currentOutSystemID,
                            "userName": widgObj.defaultUserName,
                            "ApplicationName": widgObj.defaultApplicationName
                        }
                    }
                    $("#im-measurement-transformation-result").hide()
                    $("#im-measurement-transformation-loading").show()
                    widgObj.transformationProcedure(evt, function (transformation_success) {
                        if (transformation_success.MassiveConvertResult[0].Message == "Ok") {
                            widgObj.currentOuputCoordinates = transformation_success.MassiveConvertResult[0].Output
                            $("#markerLatitudePlanar").text(widgObj.currentOuputCoordinates.Y.toFixed(2).toString().replace(".", ","))
                            $("#markerLongitudePlanar").text(widgObj.currentOuputCoordinates.X.toFixed(2).toString().replace(".", ","))
                            $("#im-measurement-transformation-result").show()
                            $("#im-measurement-transformation-loading").hide()
                        }
                    }, function (transformation_error) {
                        console.warn(transformation_error)
                    })
                } else {
                    var evt = {
                        "request": {
                            "Coordinates": [{
                                "X": pPoint.x,
                                "Y": pPoint.y,
                                "Z": 0
                            }],
                            "InputSystemId": widgObj.defaultWGS84Id,
                            "OutputSystemId": widgObj.currentOutSystemID,
                            "userName": widgObj.defaultUserName,
                            "ApplicationName": widgObj.defaultApplicationName
                        }
                    }
                    $("#im-measurement-transformation-result").hide()
                    $("#im-measurement-transformation-loading").show()
                    widgObj.transformationProcedure(evt, function (transformation_success) {
                        if (transformation_success.MassiveConvertResult[0].Message == "Ok") {
                            widgObj.currentOuputCoordinates = transformation_success.MassiveConvertResult[0].Output
                            $("#markerLatitudePlanar").text(widgObj.currentOuputCoordinates.X.toFixed(2).toString().replace(".", ","))
                            $("#markerLongitudePlanar").text(widgObj.currentOuputCoordinates.Y.toFixed(2).toString().replace(".", ","))
                            $("#im-measurement-transformation-result").show()
                            $("#im-measurement-transformation-loading").hide()

                        }
                    }, function (transformation_error) {
                        console.warn(transformation_error)
                    })
                }
            },
            //Proyecta los puntos de grados decimales a DMS
            projectPointDMS: function (pPoint) {
                if (pPoint && pPoint.spatialReference.wkid === 4326) {
                    $("#markerLatitudeDecimal").text(this.toDegreesMinutesAndSeconds(pPoint.y))
                    $("#markerLongitudeDecimal").text(this.toDegreesMinutesAndSeconds(pPoint.x))
                } else {
                    var mOutSpatialReference = new SpatialReference(4326);
                    var params = new ProjectParameters();
                    params.geometries = [pPoint];
                    params.outSR = mOutSpatialReference;
                    gsvc.project(params, function (projectedPoints) {
                        var mPointProjected = projectedPoints[0]
                        $("#markerLatitudeDecimal").text(this.toDegreesMinutesAndSeconds(mPointProjected.y))
                        $("#markerLongitudeDecimal").text(this.toDegreesMinutesAndSeconds(mPointProjected.x))
                    })
                }
            },
            //RJS - 18/07/2018 - Cálculo de altitud
            getAltitude: function (mapPoint) {
                var identifyTask_ = new IdentifyTask(widgObj.config.demServiceURL)
                var identifyParams_ = new IdentifyParameters()
                identifyParams_.geometry = mapPoint
                identifyParams_.mapExtent = widgObj.map.extent
                identifyParams_.height = 400
                identifyParams_.width = 400
                identifyParams_.returnGeometry = true
                identifyParams_.tolerance = 3
                identifyTask_.execute(identifyParams_)
                identifyTask_.on("complete", function (resObj) {
                    if (resObj.results.length > 0) {
                        if (isNaN(resObj.results["0"].feature.attributes[widgObj.config.altitudeField])) {
                            $("#markerAltitudePlanar").text("--")
                            $("#mouseAltitudePlanar").text("--")
                        } else {
                            var cota = parseFloat(resObj.results["0"].feature.attributes[widgObj.config.altitudeField]).toFixed(2).toString().replace(".", ",")
                            $("#markerAltitudePlanar").text(cota)
                            $("#mouseAltitudePlanar").text(cota)
                        }
                    } else {
                        $("#markerAltitudePlanar").text("--")
                        $("#mouseAltitudePlanar").text("--")
                    }
                })
                identifyTask_.on("error", function (err) {
                    $("#markerAltitudePlanar").text("--")
                    $("#mouseAltitudePlanar").text("--")
                })
            },
            //GGO - 27/04/2018 - Función para proyectar punto de arrastre
            projectHoveredPoint: function (pPoint) {
                //RJS - Proyecta el mismo punto de la herramienta coordinate para evitar discrepancias.
                var textPoint = { x: $(".coordinate-info").text().split("  ")[0], y: $(".coordinate-info").text().split("  ")[1] }
                $("#mouseLatitudePlanar").text(textPoint.x)
                $("#mouseLongitudePlanar").text(textPoint.y)
                $("#mouseAltitudePlanar").text("--")
            },
            //GGO - 27/04/2018 - Función para limpiar resultados adicionales
            clearAditionalLocations: function () {
                $("#markerLatitudeDecimal").text("---")
                $("#markerLongitudeDecimal").text("---")
                $("#markerLatitudePlanar").text("---")
                $("#markerLongitudePlanar").text("---")
                $("#markerAltitudePlanar").text("--")
            },
            toDegreesMinutesAndSeconds: function (coordinate) {
                var absolute = Math.abs(coordinate)
                var degrees = Math.floor(absolute)
                var minutesNotTruncated = (absolute - degrees) * 60
                var minutes = Math.floor(minutesNotTruncated)
                var seconds = parseFloat((minutesNotTruncated - minutes) * 60).toFixed(3)
                return degrees + "\u00b0 " + minutes + "' " + seconds.toString().replace(".",",")
            },
            _listenMapCapabilities: function () {
                var self = this
                self.map.on("mouse-drag-start", function () {

                })
                self.map.on("mouse-drag-end", function () {

                })
            },
            _processConfig: function (configJson) {
                this._pcDef = new Deferred()
                if (configJson.defaultLengthUnit && configJson.defaultAreaUnit) {
                    this._pcDef.resolve(configJson)
                } else {
                    PortalUtils.getUnits(this.appConfig.portalUrl).then(lang.hitch(this, function (units) {
                        configJson.defaultAreaUnit = units === 'english' ?
                            esriUnits.SQUARE_MILES : esriUnits.SQUARE_KILOMETERS
                        configJson.defaultLengthUnit = units === 'english' ?
                            esriUnits.MILES : esriUnits.KILOMETERS
                        this._pcDef.resolve(configJson)
                    }), lang.hitch(this, function (err) {
                        console.error(err)
                        configJson.defaultAreaUnit = esriUnits.SQUARE_MILES
                        configJson.defaultLengthUnit = esriUnits.MILES
                        this._pcDef.resolve(configJson)
                    }))
                }
                return this._pcDef.promise
            },
            _hideToolsByConfig: function () {
                if (false === this.config.showArea) {
                    this.measurement.hideTool("area")
                }
                if (false === this.config.showDistance) {
                    this.measurement.hideTool("distance")
                }
                if (false === this.config.showLocation) {
                    this.measurement.hideTool("location")
                }
            },
            disableWebMapPopup: function () {
                this.map.setInfoWindowOnClick(false)
            },
            enableWebMapPopup: function () {
                //RRS
                this.map.setInfoWindowOnClick(true)
            },
            onDeActive: function () {
            },
            callService: function (method, url, data, callback_success, callback_error) {
                //RJS - Método genérico para llamada a webservices
                $.ajax({
                    type: method,
                    url: url,
                    data: JSON.stringify(data),
                    dataType: "json",
                    contentType: 'application/json; charset=utf-8',
                    success: function (response) {
                        callback_success(response)
                    },
                    error: function (error) {
                        callback_error(error)
                    }
                })
            },
            onClose: function () {
                if (this.measurement && this.measurement.activeTool) {
                    this.measurement.clearResult();
                    this.measurement.setTool(this.measurement.activeTool, false);
                }
                this.clearAditionalLocations();
            },
            destroy: function () {
                if (this.measurement) {
                    this.measurement.destroy()
                    //GGO - 27/04/2018 - Removemos los Event Handlers adicionales
                    this.onToolChangeEventHandler.remove()
                    this.onMeasureEndEventHandler.remove()
                    this.onMapMouseMoveEndEventHandler.remove()
                }
                this.inherited(arguments)
            }
        })
        return widgClass
    });