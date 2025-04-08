define([
    "esri/map",
    "esri/toolbars/draw",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/CartographicLineSymbol",
    "esri/layers/GraphicsLayer",
    "esri/graphic",
    "esri/units",
    "esri/geometry/geometryEngine",
    "esri/dijit/ElevationProfile",
    'esri/tasks/ProjectParameters',
    "esri/SpatialReference",
    "esri/geometry/Polyline",
    "esri/geometry/Point",
    "esri/Color",
    'esri/tasks/IdentifyParameters',
    'dojo/_base/Deferred',
    'esri/tasks/IdentifyTask',
    "esri/geometry/Geometry",
    "dojo/promise/all",
    'jimu/dijit/Message',
    'dojo/_base/lang',
    "dojo/dom",
    "dojo/on"
], function (Map, Draw, SimpleLineSymbol, SimpleMarkerSymbol, CartographicLineSymbol,
    GraphicsLayer, Graphic, Units, geometryEngine, ElevationsProfileWidget, ProjectParameters, SpatialReference,
    Polyline, Point,
    Color, IdentifyParameters, Deferred,
    IdentifyTask, Geometry, all, Messsage, lang, dom, on) {

        var mo = {};
        mo.MainWidget = {};

        // VARIABLES   
        mo.continueRecursive = true;
        mo.firstTimeToggle = true;
        mo.mLineSymbol = null;
        mo.mLineEndSymbol = null;
        mo.disableDrawToolbarToolFn = null;
        mo.mDrawToolbar = null;
        mo.mDrawToolbarOnDrawEnd = null;
        mo.ElevationProfileDijit = null;
        mo.mElevationProfileLastMeasureType = null;
        mo.mElevationProfileLastResolution = null;
        mo.mElevationProfileLastGeometry = null;
        mo.mGraphicLayers = [];
        mo.ProfileExecutedWithDraw = false;
        mo.ProfileExecutedWithSelect = false;
        mo.lastDrawEndProcessed = null;
        // GGO - 0808
        mo.lastRecievedDrawEvent = null;
        //SG - 03/10/2019
        mo.isBigger = false;
        mo.isFirst = true;
        // SG - 02/12/2019
        mo.verticeArray
        mo.profileResultsArray = []
        // CONSTANTES

        // FUNCIONES
        /* FUNCIONES ESTÁNDAR */
        mo.startUp = function () {
            // Obtengo la configuración necesaria
            var mConfig = mo.MainWidget.config;

            // Establecimiento de elevación de ElevationProfile
            mo.establishElevationProfileHeight();

            // Creo el símbolo de Linea a ser usado
            mo.mLineSymbol = new SimpleLineSymbol(mConfig.elevationProfileWidget.symbols.simplelinesymbol);
            mo.mLineEndSymbol = new SimpleMarkerSymbol(mConfig.elevationProfileWidget.symbols.lineEndSymbol);

            // Inicio capas, widgets, etc.
            mo.startUpGraphicLayers();
            //mo.initElevationProfileDijit();
        };
        mo.closeUp = function () {
            mo.clearLayers();
            mo.MainWidget.measureTool.clearResult();
            //mo.clearVariables();
            //mo.MainWidget.map.graphics.clear();
            //if (mo.ElevationProfileDijit._profileChart)
            //    mo.ElevationProfileDijit.clearProfile();
            mo.unsetDrawToolbar();

            // Switch de TAB
            mo.MainWidget.tabContainer.selectTab(mo.MainWidget.nls.measurelabel);

            mo.erasePreviousData();


        };
        mo.clearVariables = function () {
            mo.mGraphicLayers = [];
            mo.mDrawToolbar = null;
            mo.mDisableToolbarFunction = null;
            mo.ElevationProfileDijit = null;
            mo.ProfileExecutedWithDraw = false;
            mo.ProfileExecutedWithSelect = false;
            mo.lastDrawEndProcessed = null;
        };



        /* MANEJO DE DIBUJO */
        mo.enableDrawPolylineTool = function () {
            mo.disableDrawToolbarToolFn = mo.MainWidget.FormManagerLc.deactivateDrawPolylineTool;
            mo.setDrawToolbar("Polyline");
        };
        mo.enableDrawFreeHandPolylineTool = function () {
            mo.disableDrawToolbarToolFn = mo.MainWidget.FormManagerLc.deactivateDrawFreeHandPolylineTool;
            mo.setDrawToolbar("FreeHandPolyline");
        };

        // Método principal para establecer y activar la herramienta de dibujo
        mo.setDrawToolbar = function (toolName) {
            // Limpio capas operativas
            mo.clearGraphicLayerList();

            // Limpio variable de Display Locator
            mo.MainWidget.clearDisplayLocator();

            // Si existe un gráfico previo, lo limpio
            //if (mo.ElevationProfileDijit._profileChart)
            //    mo.ElevationProfileDijit.clearProfile(); 
            if (mo.MainWidget.lastMeasure)
                mo.MainWidget.clearProfileChart();

            // Limpio gráficos del mapa
            //mo.MainWidget.map.graphics.clear();

            // Establezco el Draw
            mo.mDrawToolbar = new Draw(mo.MainWidget.map);

            // Su evento

            mo.mDrawToolbarOnDrawEnd = mo.mDrawToolbar.on("draw-end", mo.processDrawEnd);

            // Lo activo con la herramienta pasada
            mo.mDrawToolbar.activate(toolName.toLowerCase());

            // Desactivo la navegación del mapa
            mo.MainWidget.map.disableMapNavigation();
        };

        mo.unsetDrawToolbar = function () {
            if (mo.mDrawToolbar)
                // Desactivamos el toolbar de dibujo
                mo.mDrawToolbar.deactivate();

            if (mo.mDrawToolbarOnDrawEnd)
                // Desconectamos el listener
                mo.mDrawToolbarOnDrawEnd.remove();

            // Se habilita la navegación del mapa
            mo.MainWidget.map.enableMapNavigation();
        };

        /*
         * Obtiene, en formato string, la longitud del perfil
         */
        mo.getLengthStringFromProfile = function (pGeometry) {
            var mGeometryLength = 0;
            var mMeasureUnit = "";
            if (mo.MainWidget.FormManagerLc.mMeasureTypeSelected === "Kilometers") {
                mGeometryLength = geometryEngine.planarLength(pGeometry, 9036);
                mMeasureUnit = mo.MainWidget.nls.units_simple.kilometers;
            } else if (mo.MainWidget.FormManagerLc.mMeasureTypeSelected === "Meters") {
                mGeometryLength = geometryEngine.planarLength(pGeometry, 9001);
                mMeasureUnit = mo.MainWidget.nls.units_simple.meters;
            }
            return mGeometryLength.toFixed(2) + " " + mMeasureUnit;
        };

        // Handler para procesar el comienzo de un dibujo
        mo.processDrawStart = function (pEvent) {
            mo.MainWidget.FormManagerLc.currentTool = "Draw"
            mo.MainWidget.FormManagerLc.isDraw = true
            mo.isFirst = true

            // GGO - 0608 - Impresión de valores Iniciales
            $("#iElevationProfile_spanSegmentLength").text("0.00 [m]");
            $("#iElevationProfile_spanLineLength").text("0.00 [m]");
            $("#iElevationProfile_spanSamplesLength").text("0");
            mo.clearGraphicLayerList();

            // GGO - 1708 -
            mo.MainWidget.LogicManagerLc.clearSavedDrawEndEvent();
            mo.lastRecievedDrawEvent = null;
            mo.MainWidget.FormManagerLc.validateEnablingOfConfirmButton();
            mo.MainWidget.clearProfileChart();
            mo.MainWidget.DataGridManagerLc.clear();
            mo.MainWidget.map.setMapCursor("default");
        };



        // Handler para procesar la terminación de un dibujo
        mo.processDrawEnd = function (pEvent) {

            // GGO - 2108
            //mo.MainWidget.map.setMapCursor("default");
            mo.MainWidget.FormManagerLc.isClicked = false
            mo.MainWidget.FormManagerLc.isDblClicked = false
            // GGO - 0808 - Guardo el último evento, como para hacer refresh ante input-change.
            mo.lastRecievedDrawEvent = pEvent;

            // GGO - 0808 - Y limpio el último evento de selección.
            mo.MainWidget.FormManagerLc.lastRecievedSelection = null;

            // GGO - 0608 - Finalización de impresión de valores
            var mLineLength = pEvent.values.toFixed(2);
            if (pEvent.geometry.paths["0"].length == 2)
                $("#iElevationProfile_spanSegmentLength").text(mLineLength + " [m]");
            $("#iElevationProfile_spanLineLength").text(mLineLength + " [m]");

            mo.processGraphicProfile(pEvent.geometry);
        };

        // Método para guardar un evento de dibujo.
        // Sirve para cuando hay que recalcular en base a superación de máx-step
        mo.saveDrawEndEvent = function (pGeometry) {

            // Guardamos el Evento para ser lanzado post confirmación
            mo.lastDrawEndProcessed = pGeometry;

            // Activamos el botón de confirmación, si pasa
            if (mo.isFirst) {
                mo.MainWidget.FormManagerLc.validateEnablingOfConfirmButton();
            }
            //mo.MainWidget.FormManagerLc.activateConfirmButton();
        };

        // Método para procesar un evento de dibujo guardado.
        mo.processSavedDrawEndEvent = function () {
            //mo.addGraphicLineToGraphicLayer(pGeometry);
            //mo.addGraphi cVertexsToGraphicLayer(pGeometry);

            if (mo.MainWidget.FormManagerLc.isDraw) {
                mo.MainWidget.resizeBig()
                mo.processGeometryForElevationProfile(mo.lastDrawEndProcessed);
                mo.MainWidget.FormManagerLc.lastStep = mo.MainWidget.FormManagerLc.mStepValue
            }
            if (mo.MainWidget.isNew) {
                mo.MainWidget.resizeBig()
                mo.processGeometryForElevationProfile(mo.lastDrawEndProcessed);
                mo.MainWidget.FormManagerLc.lastStep = mo.MainWidget.FormManagerLc.mStepValue
            } else if (mo.MainWidget.FormManagerLc.currentTool == "Draw") {
                mo.MainWidget.resizeBig()
            }
            if (mo.MainWidget.FormManagerLc.isSelection) {
                mo.MainWidget.resizeBig()
                mo.processGeometryForElevationProfile(mo.lastDrawEndProcessed);
                mo.MainWidget.FormManagerLc.lastStep = mo.MainWidget.FormManagerLc.mStepValue
            }
        };

        // Método para limpiar un evento de dibujo guardado
        mo.clearSavedDrawEndEvent = function () {
            mo.lastDrawEndProcessed = null;

        };

        mo.isVertexAmountValid = function () {

            if (mo.lastDrawEndProcessed && mo.lastDrawEndProcessed.paths) {
                var mDensifiedVertexArray = mo.lastDrawEndProcessed.paths["0"].length;
                if (mDensifiedVertexArray > mo.MainWidget.config.vertexLimit || mo.isBigger)
                    return false;
                else
                    return true;
            } else {
                return false;
            }

        };

        // GGO - 1608 - Nuevo metodo para chequear
        mo.willNewLineExceedLimit = function (pGeometry, pStepValue) {
            var mGeometryLength = geometryEngine.planarLength(pGeometry, mo.MainWidget.FormManagerLc.mStepTypeSelected);
            var mVertexAmout = mGeometryLength / pStepValue;
            if (mVertexAmout > mo.MainWidget.config.vertexLimit)
                return true;
            else
                return false;
        };

        // GGO - 1608 - Nuevo metodo para lanzar error manual.
        mo.launchToastErrorVertex = function () {
            mo.MainWidget.FormManagerLc.isClicked = false
            mo.MainWidget.FormManagerLc.isDblClicked = false
            mo.MainWidget.isNew = false
            mo.isBigger = true
            var mMessage = "";
            mMessage = lang.clone(mo.MainWidget.nls.errors.error_vertex_with_steps);
            mMessage = mMessage.replace("{vertex_limit}", mo.MainWidget.config.vertexLimit);
            // GGO - 0908 - No es necesario mostrar el toast.
            mo.MainWidget.FormManagerLc.launchToastError(mMessage, 3000);
        };

        mo.processGraphicProfile = function (pGeometry) {
            // Limpieza de datos previos

            mo.clearGraphicLayerList();
            mo.MainWidget.measureTool.clearResult();
            var mMessage = "";
            // Estableció que quiere usar pasos en el perfil x dibujo/selección?
            if (mo.MainWidget.FormManagerLc.mSwitchUseStepsValue) {
                //INFO - Entonces procedemos a hacer la división x pasos de la línea dibujada.
                //NOTE - planarLength 9001

                var mGeometryLength = geometryEngine.planarLength(pGeometry, mo.MainWidget.FormManagerLc.mStepTypeSelected);
                var mDensifiedGeomtery = mo.calculateNewLine(pGeometry); //geometryEngine.densify(pGeometry, mo.MainWidget.FormManagerLc.getStepValue(), mo.MainWidget.FormManagerLc.mStepTypeSelected);
                mo.isBigger = false
                //Valido vértices dividos
                var mDensifiedVertexArray = mDensifiedGeomtery.paths["0"].length;
                if (mDensifiedVertexArray > mo.MainWidget.config.vertexLimit) {
                    mo.MainWidget.FormManagerLc.isClicked = false
                    mo.MainWidget.FormManagerLc.isDblClicked = false
                    mo.MainWidget.isNew = false
                    mo.isBigger = true
                    mMessage = lang.clone(mo.MainWidget.nls.errors.error_vertex_with_steps);
                    mMessage = mMessage.replace("{vertex_limit}", mo.MainWidget.config.vertexLimit);

                    // GGO - 0908 - No es necesario mostrar el toast.
                    mo.MainWidget.FormManagerLc.launchToastError(mMessage, 5000);

                    // Validamos el botón de confirmación
                    mo.MainWidget.FormManagerLc.validateEnablingOfConfirmButton();



                    //return;
                }
                /* else if (mDensifiedVertexArray < 3) {
                               // GGO - 0908 - Max Step = Max Long de linea
                               mo.MainWidget.FormManagerLc.fixInputStepValue(parseFloat((mGeometryLength - 1 ).toFixed(0)));
                               return;
                           }*/

                // GGO - 0608 - Caso especial que sirve para imprimir datos de selección
                if (!mo.MainWidget.activatedDrawPolylineTool) {
                    if (mo.MainWidget.FormManagerLc.currentTool == "Selection") {
                        mo.isFirst = true
                    }

                    //RRS, interfiere con el flujo
                    // $("#iElevationProfile_spanSegmentLength").text(mGeometryLength.toFixed(2) + " [m]");
                    // $("#iElevationProfile_spanLineLength").text(mGeometryLength.toFixed(2) + " [m]");
                }

                pGeometry = mDensifiedGeomtery;
            } else {
                //Valido vértices normales
                var mVertexArray = pGeometry.paths["0"].length;
                if (mVertexArray > mo.MainWidget.config.vertexLimit) {
                    mMessage = lang.clone(mo.MainWidget.nls.errors.error_vertex_without_steps);
                    mMessage = mMessage.replace("{vertex_limit}", mo.MainWidget.config.vertexLimit);

                    // GGO - 0908 - No es necesario mostrar el toast.
                    mo.MainWidget.FormManagerLc.launchToastError(mMessage, 5000);

                    // Validamos el botón de confirmación
                    mo.MainWidget.FormManagerLc.validateEnablingOfConfirmButton();

                    return;
                }
            }
            // Establecemos el máximo para el step.
            var mFinalLength = geometryEngine.planarLength(pGeometry, mo.MainWidget.FormManagerLc.mStepTypeSelected);
            // GGO - 0908 - Max Step = Max Long de linea
            // GGO - 2108
            //mo.MainWidget.FormManagerLc.setMaxInputStepValue(parseFloat((mFinalLength - 1).toFixed(0)));

            // GGO - 0608 - Informo cantidad de muestras.
            var mSamplesArray = pGeometry.paths["0"].length;
            $("#iElevationProfile_spanSamplesLength").text(mSamplesArray); //2108 - 1

            // GGO - 0908 - No se grafica antes de confirmar
            mo.addGraphicLineToGraphicLayer(pGeometry);
            mo.addGraphicVertexsToGraphicLayer(pGeometry);

            // GGO - 0608 - Dejamos en standBy el evento procesado para ser confirmado
            mo.saveDrawEndEvent(pGeometry);
        };

        /* MANEJO DE ELEVATION PROFILE */
        // Método para establecer el Height del dijit
        mo.establishElevationProfileHeight = function () {
            var mContainerHeight = $($("#_iElevationProfileWidget").parent()[0]).height();
            var mRow0Height = 0; //$("#iElevationProfile_Row0").height();
            var mRow1Height = $("#iElevationProfile_Row1").height();
            var mHeight = mContainerHeight - mRow0Height - mRow1Height - 25;
            $("#iElevationProfile_Row2").height(mHeight);
        };

        // Método para re-dibujar el dijit ante un cambio de resize.
        mo.reDrawProfileElevationWidget = function () {
            //mo.establishElevationProfileHeight();
            //mo.ElevationProfileDijit.resize();
            mo.MainWidget._resizeChart();
        };

        // Método principal para inicializar el Dijit
        mo.initElevationProfileDijit = function () {
            // Arranco StandBy
            mo.MainWidget.StandByManagerLc.StandbyContainer.show();

            //Obtenemos la configuración indicada
            var mConfig = mo.MainWidget.config.elevationProfileWidget;

            var mProfileParams = {};
            mProfileParams.map = mo.MainWidget.map;
            // mProfileParams.profileTaskUrl = mConfig.profileTaskUrl;
            mProfileParams.scalebarUnits = mConfig.scalebarUnits;
            mProfileParams.chartOptions = {};
            mProfileParams.chartOptions.axisFontColor = mConfig.chartRenderingOptions.axisFontColor;
            mProfileParams.chartOptions.axisLabelFontSize = mConfig.chartRenderingOptions.axisLabelFontSize;
            mProfileParams.chartOptions.axisMajorTickColor = mConfig.chartRenderingOptions.axisMajorTickColor;
            mProfileParams.chartOptions.axisTitleFontSize = mConfig.chartRenderingOptions.axisTitleFontSize;
            mProfileParams.chartOptions.busyIndicatorBackgroundColor = mConfig.chartRenderingOptions.busyIndicatorBackgroundColor;
            //mProfileParams.chartOptions.busyIndicatorBackgroundOpacity = mConfig.chartRenderingOptions.;
            //mProfileParams.chartOptions.busyIndicatorFadeDuration = mConfig.chartRenderingOptions.;
            mProfileParams.chartOptions.busyIndicatorImageUrl = mConfig.chartRenderingOptions.busyIndicatorImageUrl;
            mProfileParams.chartOptions.chartTitleFontSize = mConfig.chartRenderingOptions.chartTitleFontSize;
            mProfileParams.chartOptions.elevationBottomColor = mConfig.chartRenderingOptions.elevationBottomColor;
            mProfileParams.chartOptions.elevationLineColor = mConfig.chartRenderingOptions.elevationLineColor;
            mProfileParams.chartOptions.elevationMarkerStrokeColor = mConfig.chartRenderingOptions.elevationMarkerStrokeColor;
            mProfileParams.chartOptions.elevationMarkerSymbol = mConfig.symbols.simplelinesymbol;
            mProfileParams.chartOptions.elevationTopColor = mConfig.chartRenderingOptions.elevationTopColor;
            //mProfileParams.chartOptions.indicatorFillColorSize = mConfig.chartRenderingOptions.;
            mProfileParams.chartOptions.indicatorFontColor = mConfig.chartRenderingOptions.indicatorFontColor;
            mProfileParams.chartOptions.mapIndicatorSymbol = mConfig.symbols.mapIndicatorSymbol;
            mProfileParams.chartOptions.skyBottomColor = mConfig.chartRenderingOptions.skyBottomColor;
            mProfileParams.chartOptions.skyTopColor = mConfig.chartRenderingOptions.skyTopColor;
            mProfileParams.chartOptions.title = mo.MainWidget.nls.profileElevationDijit.title;
            mProfileParams.chartOptions.titleFontColor = mConfig.chartRenderingOptions.titleFontColor;
            mProfileParams.chartOptions.waterBottomColor = mConfig.chartRenderingOptions.waterBottomColor;
            mProfileParams.chartOptions.waterLineColor = mConfig.chartRenderingOptions.waterLineColor;
            mProfileParams.chartOptions.waterTopColor = mConfig.chartRenderingOptions.waterTopColor;
            //console.log("mProfileParams");
            //console.log(mProfileParams);


            mo.ElevationProfileDijit = new ElevationsProfileWidget(mProfileParams, dom.byId(mConfig.divId));
            mo.ElevationProfileDijit.startup();
            // Inicialización del Load, así se puede mostrar toda la UI
            on(mo.ElevationProfileDijit, 'load', function (pEvent) {
                if (mo.firstTimeToggle)
                    $("#iElevationProfile_container").toggleClass("div-hide");
                mo.firstTimeToggle = false;
                mo.MainWidget.StandByManagerLc.StandbyContainer.hide();

                // Una vez que está listo este dijit, cargamos el resto de la UI
                mo.MainWidget.FormManagerLc.startUp();
            });
            // Log de actualización
            on(mo.ElevationProfileDijit, 'update-profile', function (e) {
                //console.log('update profile', e);
            });
        };

        // Método principal para procesar un gráfico
        mo.processGeometryForElevationProfile = function (pGeometry) {
            // Flags de control de flujo

            mo.ProfileExecutedWithDraw = true;
            mo.ProfileExecutedWithSelect = false;
            mo.isFirst = false;
            // Switch de TAB
            mo.MainWidget.tabContainer.selectTab(mo.MainWidget.nls.resultslabel);

            // GGO - 0608 - Proceso de desactivación
            mo.MainWidget.measureTool.setTool("distance", false);
            mo.MainWidget.FormManagerLc.deactivateDrawPolylineTool();

            // Desactivamos el toolbar de dibujo
            // GGO - 0608 - No es necesario este desactivar ahora. 
            //mo.mDrawToolbar.deactivate();

            // Desconectamos el listener
            // GGO - 0608 - No es necesario este desactivar ahora. 
            //mo.mDrawToolbarOnDrawEnd.remove();

            // Ejecutamos la función almacenada para manipular el UI "desactivando la herramienta"
            // GGO - 0608 - No es necesario este desactivar ahora. 
            //mo.disableDrawToolbarToolFn();

            // Se habilita la navegación del mapa
            // GGO - 0608 - No es necesario este desactivar ahora. 
            mo.MainWidget.map.enableMapNavigation();

            // Almacenamos la unidad de medida
            mo.mElevationProfileLastMeasureType = mo.MainWidget.FormManagerLc.mMeasureTypeSelected;

            // Almacenamos la resolución elegida
            mo.mElevationProfileLastResolution = mo.MainWidget.FormManagerLc.mResolutionSelected;

            // EXCEPTION: Caso especial porque aquí hay discrepancia entre los SR del servicio y mapa
            // Projectamos la geometría para hacerla coincidir con la del servicio
            //var mOutSpatialReference = new SpatialReference({ wkid: 2082 });
            var mProjectParameters = new ProjectParameters();
            mProjectParameters.geometries = [pGeometry];
            mProjectParameters.outSR = mo.MainWidget.map.spatialReference;

            //console.log("Geometría antes de proyectar");
            //console.log(pEvent.geometry);

            mo.MainWidget.WidgetGeometryService.project(mProjectParameters, function (pProjectedLines) {
                // Con la geometría projectada, procesamos la elevación
                if (pProjectedLines && pProjectedLines.length > 0) {
                    mo.MainWidget.FormManagerLc.isSelection = false;
                    //console.log("Geometría deps de proyectar");
                    //console.log(pProjectedLines[0]);

                    // Guardamos la última geometría projectada procesada
                    mo.mElevationProfileLastGeometry = pProjectedLines[0];
                    //mo.ElevationProfileDijit.set("profileGeometry", mo.mElevationProfileLastGeometry);
                    //mo.ElevationProfileDijit.set("measureUnits", mo.MainWidget.FormManagerLc.mMeasureTypeSelected);

                    mo.MainWidget.displayProfileChartCont(pProjectedLines[0], mo.mElevationProfileLastMeasureType, mo.mElevationProfileLastResolution, mo.MainWidget.FormManagerLc.getStepValue(), mo.MainWidget.FormManagerLc.mStepTypeSelected);
                }
            });
        };

        // Método para actualizar ElevationProfile con la última unidad de medida y la última geometría almacenada
        mo.updateProfile = function () {
            //if (mo.ElevationProfileDijit && mo.ElevationProfileDijit._profileChart) {

            // Chequeamos por cuál flujo vino.
            if ((mo.ProfileExecutedWithDraw && mo.MainWidget.FormManagerLc.mSwitchUseStepsValue) ||
                (mo.ProfileExecutedWithSelect && mo.MainWidget.FormManagerLc.mSwitchUseStepsValue)) {
                // Generamos la actualización de geometría con pasos para dibujo

                var mGeometryLength = geometryEngine.planarLength(mo.mElevationProfileLastGeometry, mo.MainWidget.FormManagerLc.mStepTypeSelected);
                var mDensifiedGeomtery = mo.calculateNewLine(mo.mElevationProfileLastGeometry); //geometryEngine.densify(, mo.MainWidget.FormManagerLc.getStepValue(), mo.MainWidget.FormManagerLc.mStepTypeSelected);
                mo.isBigger = false
                //Valido vértices dividos
                var mMessage = "";
                var mDensifiedVertexArray = mDensifiedGeomtery.paths["0"].length;
                if (mDensifiedVertexArray > mo.MainWidget.config.vertexLimit) {
                    mo.MainWidget.isNew = false
                    mo.isBigger = true
                    mo.MainWidget.FormManagerLc.isClicked = false
                    mo.MainWidget.FormManagerLc.isDblClicked = false
                    mMessage = lang.clone(mo.MainWidget.nls.errors.error_vertex_with_steps);
                    mMessage = mMessage.replace("{vertex_limit}", mo.MainWidget.config.vertexLimit);

                    // GGO - 0908 - No es necesario mostrar el toast.
                    mo.MainWidget.FormManagerLc.launchToastError(mMessage, 5000);
                    return;
                }

                mo.mElevationProfileLastGeometry = mDensifiedGeomtery;
            }

            // Lanzamos la actualización
            mo.MainWidget.displayProfileTab();
            mo.MainWidget.displayProfileChartCont(mo.mElevationProfileLastGeometry, mo.mElevationProfileLastMeasureType, mo.mElevationProfileLastResolution, mo.MainWidget.FormManagerLc.getStepValue(), mo.MainWidget.FormManagerLc.mStepTypeSelected);
            //}
        };
        // Método para actualizar ElevationProfile con una unidad de medida, y la última geometría almacenada
        mo.updateProfileWithMeasureType = function (pMeasureType) {

            mo.mElevationProfileLastMeasureType = pMeasureType;
            //GGO - Chequeo para no saltar al tab sin haberse ejecutado previamente
            if (mo.MainWidget.firstTimeExecuted)
                mo.updateProfile();
        };
        // Método para actualizar ElevationProfile con una unidad de medida, y la última geometría almacenada
        mo.updateProfileWithResolution = function (pResolution) {

            mo.mElevationProfileLastResolution = pResolution;
            mo.updateProfile();
        };



        /* MANEJO DE GRAPHIC LAYER  */
        // Inicialización de graphic layers
        mo.startUpGraphicLayers = function () {
            // Obtenemos la configuración necesaria.
            var mConfigs = mo.MainWidget.config.graphicLayers;
            for (var i = 0; i < mConfigs.length; i++) {
                var mGraphicLayer = new GraphicsLayer(mConfigs[i]);
                mo.mGraphicLayers[mConfigs[i].id] = mGraphicLayer;
                if (mConfigs[i].handleDragAndDrop) {
                    mGraphicLayer.on("mouse-down", mo.graphicLayerOnMouseDownHandler);
                    mGraphicLayer.on("mouse-drag", mo.graphicLayerOnMouseDragHandler);
                    mGraphicLayer.on("mouse-up", mo.graphicLayerOnMouseUpHandler);
                    //mGraphicLayer.on("mouse-out", mo.graphicLayerOnMouseOutHandler);
                }

                mo.MainWidget.map.addLayer(mo.mGraphicLayers[mConfigs[i].id], mConfigs[i].index);
            }
        };
        // Limpieza de TODAS las capas de gráficos
        mo.clearLayers = function () {
            // Obtenemos la configuración necesaria.
            var mConfigs = mo.MainWidget.config.graphicLayers;
            for (var i = 0; i < mConfigs.length; i++) {
                mo.mGraphicLayers[mConfigs[i].id].clear();
            }

        };
        // Esta función limpia la capa de gráficos operativa
        mo.clearGraphicLayerList = function () {
            // Obtengo la configuración necesaria
            var mConfig = mo.MainWidget.config;

            // Obtengo la GraphicLayer a trabajar.
            var mGraphicLayerLine = mo.mGraphicLayers[mConfig.operations.ElevationProfileDrawing.graphicLayer];
            mGraphicLayerLine.clear();

            // Obtengo la GraphicLayer a trabajar.
            var mGraphicLayerLocator = mo.mGraphicLayers[mConfig.operations.DisplayLocator.graphicLayer];
            mGraphicLayerLocator.clear();
        };
        // Esta función agrega a la capa de gráficos la Polyline o FreeHandPolyline
        mo.addGraphicLineToGraphicLayer = function (pGeometry) {
            // Obtengo la configuración necesaria
            var mConfig = mo.MainWidget.config;

            // Obtengo la GraphicLayer a trabajar.
            var mGraphicLayer = mo.mGraphicLayers[mConfig.operations.ElevationProfileDrawing.graphicLayer];

            mGraphicLayer.add(new Graphic(pGeometry, mo.mLineSymbol));
        };
        // Esta función toma la Polyline o FreeHandPolyline y dibuja todos sus vértices
        mo.addGraphicVertexsToGraphicLayer = function (pGeometry) {
            // Obtengo la configuración necesaria
            var mConfig = mo.MainWidget.config;

            // Obtengo la GraphicLayer a trabajar.
            var mGraphicLayer = mo.mGraphicLayers[mConfig.operations.ElevationProfileDrawing.graphicLayer];

            // Obtengo todos los puntos de la Línea y los ingreso
            for (var i = 0; i < pGeometry.paths[0].length; i++) {
                var mPoint = pGeometry.getPoint(0, i);
                mGraphicLayer.add(new Graphic(mPoint, mo.mLineEndSymbol));
            }


        };
        // Esta función agrega a la capa de display-locator el marcaddor
        mo.addDisplayLocatorToGraphicLayer = function (pGraphic) {
            // Obtengo la configuración necesaria
            var mConfig = mo.MainWidget.config;

            // Obtengo la GraphicLayer a trabajar.
            var mGraphicLayer = mo.mGraphicLayers[mConfig.operations.DisplayLocator.graphicLayer];

            mGraphicLayer.add(pGraphic);
        };

        mo.clearGraphicLayerLocator = function () {
            // Obtengo la configuración necesaria
            var mConfig = mo.MainWidget.config;

            // Obtengo la GraphicLayer a trabajar.
            var mGraphicLayer = mo.mGraphicLayers[mConfig.operations.DisplayLocator.graphicLayer];

            mGraphicLayer.clear();
        };


        /**********************************************/
        /** SECCION DE CALCULOS PAE **/
        mo.getCoefX = function (pPoint1, pPoint2) {
            if (pPoint1[0] > pPoint2[0])
                return 1;
            else
                return -1;
        };
        mo.getCoefY = function (pPoint1, pPoint2) {
            if (pPoint1[1] > pPoint2[1])
                return 1;
            else
                return -1;
        };

        mo.calculateNewLine = function (pGeometryToProcess) {
            // Arranco StandBy
            //mo.MainWidget.StandByManagerLc.StandbyContainer.show();
            // Calculo el tiempo
            console.time('IM_CALCULO_DENSIFY_MANUAL');

            var mPreviousPoint = null;
            var mCurrentPoint = null;
            var mLineLength = 0;
            var mPointLength = 0;
            var mCoefX = 0;
            var mCoefY = 0;
            var m = null;
            var x = null;
            var y = null;
            var mAlpha = 0;
            var mDifX = 0;
            var mDifY = 0;
            var mMapPoint;
            var mLineCount = 0;
            var mCantVertices = 0;
            var mIndex = 0;
            var mDiferential = 0;
            var mDifNewX = 0;
            var mDifNewY = 0;
            var mRestoAcum = 0;
            var mLongAcum = 0;
            var lengthBack = 0;
            var lengthAcumBack = 0;

            var mMapPoints = [];
            mo.verticeArray = mMapPoints
            // Diferencial es valor de paso en metros
            if (mo.MainWidget.FormManagerLc.mStepTypeSelected === "9001")
                mDiferential = mo.MainWidget.FormManagerLc.getStepValue();
            else
                mDiferential = mo.MainWidget.FormManagerLc.getStepValue() * 1000;

            //console.log("Diferencial: " + mDiferential);

            for (var i = 0; i < pGeometryToProcess.paths.length; i++) {
                for (var j = 1; j < pGeometryToProcess.paths[i].length; j++) {


                    mPreviousPoint = pGeometryToProcess.paths[i][j - 1];
                    mCurrentPoint = pGeometryToProcess.paths[i][j];
                    mPointLength = Math.sqrt(Math.pow(mCurrentPoint[0] - mPreviousPoint[0], 2) + Math.pow(mCurrentPoint[1] - mPreviousPoint[1], 2));

                    //console.log("mCurrentPoint");
                    //console.log(mCurrentPoint);
                    //console.log("mPreviousPoint");
                    //console.log(mPreviousPoint);

                    mLineLength = mLineLength + mPointLength;
                    mLineCount = 0;

                    mCoefX = mo.getCoefX(mCurrentPoint, mPreviousPoint);
                    mCoefY = mo.getCoefY(mCurrentPoint, mPreviousPoint);
                    m = (mCurrentPoint[1] - mPreviousPoint[1]) / (mCurrentPoint[0] - mPreviousPoint[0]);
                    x = mPreviousPoint[0];
                    y = mPreviousPoint[1];
                    mAlpha = Math.atan(m);

                    mDifX = Math.abs(Math.cos(mAlpha) * (mDiferential)) * mCoefX;
                    mDifY = Math.abs(Math.sin(mAlpha) * (mDiferential)) * mCoefY;
                    //console.log("Inicial X-Y");
                    //console.log("X:" + x + " Y:" + y);
                    //mMapPoint = new Point(x, y, mo.MainWidget.map.spatialReference); // TODO - Creo no se usa
                    //if (!mo._isPointDuplicate(mMapPoints, mMapPoint))
                    //    mMapPoints.push(mMapPoint);
                    mCantVertices = 0;

                    while (mLineCount < mPointLength) {

                        mMapPoint = new Point(x, y, mo.MainWidget.map.spatialReference);
                        if (!mo._isPointDuplicate(mMapPoints, mMapPoint)) {
                            mMapPoints.push(mMapPoint);
                        }

                        /*if (_ServicesWaiting < _MaxServicesWaiting) {
                            ProcessPoint(mMapPoint, mIndex, mLongAcum)
                        } else {
                            Dim newPoint As PointToProcess = New PointToProcess With {.Id = mIndex, .LineLenght = mLongAcum, .Point = mMapPoint}
                            _PointsToProcess.Add(newPoint)
                        }*/
                        mIndex = mIndex + 1;

                        if (j > 1 && mCantVertices == 0) {
                            //  gda perfil topografico arreglo
                            // resto = lengthBack Mod mDiferential

                            mRestoAcum = lengthAcumBack % mDiferential;
                            //  gda perfil topografico arreglo
                            mDifNewX = Math.abs(Math.cos(mAlpha) * (mDiferential - mRestoAcum)) * mCoefX;
                            mDifNewY = Math.abs(Math.sin(mAlpha) * (mDiferential - mRestoAcum)) * mCoefY;

                            x = x + mDifNewX;
                            y = y + mDifNewY;
                            //console.log("Nuevo X-Y");
                            //console.log("X:"+ x+ " Y:" + y);
                            mLineCount = mLineCount + mDiferential - mRestoAcum;

                            //  gda perfil topografico arreglo
                            mLongAcum = mLongAcum + mDiferential - mRestoAcum;
                        } else {
                            x = x + mDifX;
                            y = y + mDifY;
                            //console.log("Nuevo X-Y");
                            //console.log("X:" + x + " Y:" + y);
                            mLineCount = mLineCount + mDiferential;
                            mLongAcum = mLongAcum + mDiferential;
                        }
                        mCantVertices = mCantVertices + 1;

                    }
                    if (j > 1) {
                        /*
                        if (_ServicesWaiting < _MaxServicesWaiting) {
                            ProcessPoint(mCurrentPoint, mIndex, _LineLength);
                        } else {
                            Dim newPoint As PointToProcess = New PointToProcess With {.Id = mIndex, .LineLenght = _LineLength, .Point = mCurrentPoint}
                            _PointsToProcess.Add(newPoint);
                        }*/
                        mIndex = mIndex + 1;
                        //ProcessPoint(mCurrentPoint, mIndex, _LineLength)
                    }
                    lengthBack = mPointLength;
                    lengthAcumBack = mLineLength;
                    mLongAcum = mLineLength;
                    mPreviousPoint = mCurrentPoint;
                }
            }

            //RRS,  FIX PUNTO FINAL
            //
            var mLengthLine = pGeometryToProcess.paths[0].length;
            mMapPoint = new Point(pGeometryToProcess.paths[0][mLengthLine - 1][0], pGeometryToProcess.paths[0][mLengthLine - 1][1], mo.MainWidget.map.spatialReference);

            if (!mo._isPointDuplicate(mMapPoints, mMapPoint)) {
                mMapPoints.push(mMapPoint);
                // mo.verticeArray.push(mMapPoint)
            }


            var mNewPolyline = new Polyline(mo.MainWidget.map.spatialReference);
            //console.log("map points");
            //console.log(mMapPoints);
            mNewPolyline.addPath(mMapPoints);

            //mo.addGraphicLineToGraphicLayer(mNewPolyline);
            //mo.addGraphicVertexsToGraphicLayer(mNewPolyline);

            // Muestro el tiempo calculado
            console.timeEnd('IM_CALCULO_DENSIFY_MANUAL');

            // Oculto StandBy
            //mo.MainWidget.StandByManagerLc.StandbyContainer.hide();

            // Doy foco al input de paso
            mo.MainWidget.FormManagerLc.setFocusStepInput();

            return mNewPolyline;
        };

        mo._isPointDuplicate = function (pPointArray, pPointToCheck) {

            for (var i = 0; i < pPointArray.length; i++) {
                if (pPointArray[i].x === pPointToCheck.x &&
                    pPointArray[i].y === pPointToCheck.y) {
                    return true;
                }
            }
            return false;
        };

        /////////////////////////////
        mo.erasePreviousData = function () {
            mo.MainWidget.measureTool.setTool("distance", false);
            mo.MainWidget.LogicManagerLc.clearSavedDrawEndEvent();
            mo.MainWidget.LogicManagerLc.clearGraphicLayerList();
            mo.MainWidget.measureTool.clearResult();
            $("#iElevationProfile_spanSegmentLength").text("0.00 [m]");
            $("#iElevationProfile_spanLineLength").text("0.00 [m]");
            $("#iElevationProfile_spanSamplesLength").text("0");
            mo.MainWidget.clearProfileChart();
            mo.MainWidget.DataGridManagerLc.clear();
            mo.lastRecievedDrawEvent = null;
        };

        //SG - Replica el feature devuelto por el servicio de perfil topografico
        var previousM = null
        mo.buildGraphicFeature = function (pointArray, deferred) {

            var paths = []


            var stepValue = mo.MainWidget.FormManagerLc.getStepValue()


            paths.push([])

            for (var i = 0; i < pointArray.length; i++) {
                var coordinates = []
                coordinates.push(pointArray[i].geometry.x)
                coordinates.push(pointArray[i].geometry.y)
                debugger
                if (pointArray[i].attributes["Pixel Value"])
                {                    
                   coordinates.push(parseFloat(pointArray[i].attributes["Pixel Value"]))
                }else{
                   coordinates.push(parseFloat(pointArray[i].attributes["Stretch.Pixel Value"]))
                }

               
                //RRS, calcula M
                if (i == 0) {
                    coordinates.push(0.00)
                    previousM = 0.00
                }
                else {
                    mRowDataPrevious = pointArray[i - 1].geometry
                    var mx2 = Math.pow(mRowDataPrevious.x - pointArray[i].geometry.x, 2)
                    var my2 = Math.pow(mRowDataPrevious.y - pointArray[i].geometry.y, 2)
                    if (i == 1) {
                        var M = Math.sqrt(mx2 + my2)
                        coordinates.push(M)
                        previousM = M
                    }
                    else {
                        var M = previousM + Math.sqrt(mx2 + my2)
                        coordinates.push(M)
                        previousM = M
                    }

                }
                paths[0].push(coordinates)
            }

            var geometry = {
                hazM: true,
                hasZ: true,
                paths: paths,
                spatialReference: pointArray[0].geometry.spatialReference,
            }
            var profileLength = paths[0][paths[0].length - 1][3]
            var attributes = {
                DEMResolution: "1m",
                OBJECTID: 1,
                ProfileLength: profileLength,
                Shape_Length: profileLength
            }
            var profileFeature = {
                attributes: attributes,
                geometry: geometry,
                symbol: null
            }

            //RRS; pone el texto en la caja
            $("#iElevationProfile_spanLineLength").text(profileLength.toFixed(2))
            mo.MainWidget._drawGraphic(profileFeature, deferred)
        }

        //SG - Identify a cada vertice de pozos
        mo.identifyVeritces = function (index, deferred) {
            //RRS, hace dos querys recursivos en paralelo.

            var fullLength = mo.verticeArray.length
            if (fullLength > 1) {
                var mLength = Math.floor(fullLength / 2)
                mo.profileResultsOne = []
                mo.profileResultsTwo = []
                var recursivePromise = new Deferred();
                var recursirvePromiseTwo = new Deferred();
                mo.identifyRecursiveOne(0, mo.verticeArray, mLength, recursivePromise)
                mo.identifyRecursiveTwo(mLength, mo.verticeArray, fullLength, recursirvePromiseTwo)
                all([recursivePromise, recursirvePromiseTwo]).then(function (results) {

                    if (results[0]) {
                        if (results[0].length > 0 && results[1].length > 0) {
                            var arrFull = $.merge(results[0], results[1])
                            mo.profileResultsArray = arrFull
                            mo.buildGraphicFeature(mo.profileResultsArray, deferred)
                        }
                        else {
                            mo.continueRecursive = false
                            mo.MainWidget._drawGraphic(0, deferred, true)
                        }
                    }
                    else {
                        mo.continueRecursive = false
                        mo.MainWidget._drawGraphic(0, deferred, true)
                    }
                });

            }
            else {
                mo.continueRecursive = false
                mo.MainWidget._drawGraphic(0, deferred, true)
            }



            // var identifyTask_ = new IdentifyTask(mo.MainWidget.config.URLS.demURL)
            // var identifyParams_ = new IdentifyParameters()
            // identifyParams_.geometry = mo.verticeArray[index]
            // identifyParams_.mapExtent = mo.MainWidget.map.extent
            // identifyParams_.height = 400
            // identifyParams_.width = 400
            // identifyParams_.returnGeometry = true
            // identifyParams_.tolerance = 1
            // identifyTask_.execute(identifyParams_)
            // identifyTask_.on("complete", function (resObj) {
            //     if (resObj.results.length > 0) {
            //         mo.profileResultsArray.push(resObj.results[0].feature)
            //     } else {
            //         console.log("Sin Datos")
            //     }
            //     if (((index + 1) < (mo.verticeArray.length - 1)) && mo.continueRecursive) {
            //         mo.identifyVeritces(index + 1, deferred)
            //     } else {
            //         mo.buildGraphicFeature(mo.profileResultsArray, deferred)
            //         // mo.MainWidget._drawGraphic(mo.profileResultsArray)
            //     }
            // })
            // identifyTask_.on("error", function (err) {
            //     //alerta que no se puede traer los datos o que fallo
            //     mo.continueRecursive = false
            //     mo.MainWidget._drawGraphic(0, deferred, true)
            // })
        }
        mo.identifyRecursiveOne = function (index, array, mLength, recursivePromise) {
            var identifyTask_ = new IdentifyTask(mo.MainWidget.config.URLS.demUrl)
            var identifyParams_ = new IdentifyParameters()
            identifyParams_.geometry = array[index]
            identifyParams_.mapExtent = mo.MainWidget.map.extent
            identifyParams_.height = 400
            identifyParams_.width = 400
            identifyParams_.returnGeometry = true
            identifyParams_.tolerance = 1
            identifyTask_.execute(identifyParams_)
            identifyTask_.on("complete", function (resObj) {
                if (resObj.results.length > 0) {
                    mo.profileResultsOne.push(resObj.results[0].feature)
                }
                if (((index + 1) < (mLength))) {
                    mo.identifyRecursiveOne(index + 1, array, mLength, recursivePromise)
                } else {
                    recursivePromise.resolve(mo.profileResultsOne)
                }
            })
            identifyTask_.on("error", function (err) {
                //alerta que no se puede traer los datos o que fallo
                mo.continueRecursive = false
                recursivePromise.reject()
            })
        }
        mo.identifyRecursiveTwo = function (mLength, array, fullLength, recursirvePromiseTwo) {
            var identifyTask_ = new IdentifyTask(mo.MainWidget.config.URLS.demUrl)
            var identifyParams_ = new IdentifyParameters()
            identifyParams_.geometry = array[mLength]
            identifyParams_.mapExtent = mo.MainWidget.map.extent
            identifyParams_.height = 400
            identifyParams_.width = 400
            identifyParams_.returnGeometry = true
            identifyParams_.tolerance = 1
            identifyTask_.execute(identifyParams_)
            identifyTask_.on("complete", function (resObj) {
                if (resObj.results.length > 0) {
                    mo.profileResultsTwo.push(resObj.results[0].feature)
                }
                if (((mLength + 1) < (fullLength))) {
                    mo.identifyRecursiveTwo(mLength + 1, array, fullLength, recursirvePromiseTwo)
                } else {
                    recursirvePromiseTwo.resolve(mo.profileResultsTwo)
                }
            })
            identifyTask_.on("error", function (err) {
                //alerta que no se puede traer los datos o que fallo
                mo.continueRecursive = false
                recursirvePromiseTwo.reject()
            })
        }
        return mo;
    });