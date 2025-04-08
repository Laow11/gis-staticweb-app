var jqueryURL = "./libs/blank";
var dxWeb = "./libs/blank";
if (!window.jQuery) {
  jqueryURL = "./libs/jquery.min";
}
if (!window.DevExpress) {
  dxWeb = "../libs/devExpress1624/js/dx.web";
}




var jszipURL = "";
if (window.JSZip) {
  jszipURL = "./libs/blank";
} else {
  jszipURL = "../libs/devExpress1624/js/jszip";
}



///////////////////////////////////////////////////////////////////////////
// IM WAB Elevation Profile Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console*/
define([
  'dojo/_base/declare',
  'jimu/BaseWidget',
  'dojo/Evented',
  'dijit/_OnDijitClickMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/on',
  'dojo/aspect',
  'dojo/_base/lang',
  'dojo/_base/Deferred',
  'dojo/_base/array',
  'dojo/number',
  'dijit/registry',
  'put-selector/put',
  'dojo/dom-class',
  'dojo/_base/Color',
  'dojo/colors',
  'dojox/charting/Chart',
  'dojox/charting/axis2d/Default',
  'dojox/charting/plot2d/Grid',
  'dojox/charting/plot2d/Areas',
  'dojox/charting/action2d/MouseIndicator',
  'dojox/charting/action2d/TouchIndicator',
  'dojox/charting/themes/ThreeD',
  'esri/sniff',
  'esri/request',
  'esri/tasks/Geoprocessor',
  'esri/geometry/Polyline',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/graphic',
  'esri/tasks/FeatureSet',
  'esri/tasks/LinearUnit',
  'esri/geometry/geodesicUtils',
  'esri/geometry/webMercatorUtils',
  'esri/tasks/GeometryService',
  'esri/units',
  'jimu/utils',
  'esri/dijit/Measurement',
  'dojo/_base/html',
  'dijit/ProgressBar',
  'jimu/dijit/TabContainer',
  'jimu/dijit/Message',
  'dojo/dom-construct',
  'dojox/gfx/utils',
  'esri/config',
  'esri/tasks/ProjectParameters',
  'esri/SpatialReference',
  'jimu/BaseFeatureAction',
  'jimu/dijit/FeatureActionPopupMenu',
  'jimu/CSVUtils',
  'jimu/dijit/Message',
  "dojo/topic",
  "dojo/text!./config.json",
  './DataGridManager',
  './FormManager',
  './LogicManager',
  './StandByManager',
  jqueryURL,
  jszipURL,
  dxWeb,
  "dojo/i18n",
  'jimu/dijit/LoadingShelter'

],
  function (declare, BaseWidget, Evented, _OnDijitClickMixin, _WidgetsInTemplateMixin,
    on, aspect, lang, Deferred, array, number, registry,
    put, domClass, Color, colors,
    Chart, Default, Grid, Areas, MouseIndicator, TouchIndicator, ThreeD, esriSniff,
    esriRequest, Geoprocessor, Polyline, SimpleLineSymbol, SimpleMarkerSymbol,
    Graphic, FeatureSet, LinearUnit, geodesicUtils, webMercatorUtils, GeometryService, Units, jimuUtils,
    Measurement, html, ProgressBar, TabContainer, Message, domConstruct,
    gfxUtils, esriConfig, ProjectParameters, SpatialReference, BaseFeatureAction,
    PopupMenu, CSVUtils, Message,
    topic,
    configElevationProfile,
    DataGridManager,
    FormManager,
    LogicManager,
    StandByManager,
    i18n) {

    ///carga devExtreme
    //$.ajax({ type: "GET", url: jqueryURL, async: false });

    ///carga devExtreme
    //$.ajax({ type: "GET", url: jszipURL, async: false });

    ///carga devExtreme
    //$.ajax({ type: "GET", url: dxWeb, async: false });

    var widgObj;
    var DataGridManagerGl = DataGridManager;
    var FormManagerGl = FormManager;
    var LogicManagerGl = LogicManager;
    var StandByManagerGl = StandByManager;

    return declare([BaseWidget, _OnDijitClickMixin, _WidgetsInTemplateMixin, Evented], {

      baseClass: 'widget-elevation-profile',
      declaredClass: 'ElevationsProfile',
      samplingPointCount: 199,
      profileService: null,
      loaded: false,
      domNode: put('div#profileChartNode'),
      scalebarUnits: null,
      elevLineSymbol: null,
      measureTool: null,
      lastMeasure: null,
      _sourceStr: null,
      _gainLossStr: null,
      _hasCanvasSupport: false,
      isIE: false,
      popupMenu: null,
      currentProfileResults: null,
      profileInfo: null,
      prepareVis: false,
      currentTab: null,
      isNew: false,

      // Declaracion local de managers
      DataGridManagerLc: DataGridManagerGl,
      FormManagerLc: FormManagerGl,
      LogicManagerLc: LogicManagerGl,
      StandByManagerLc: StandByManagerGl,
      WidgetGeometryService: null,

      /**
       *  POSTCREATE - CONNECT UI ELEMENT EVENTS
       */
      postCreate: function () {
        this.inherited(arguments);
        // GGO - Adaptacion portal

        widgObj = this;

        this.popupMenu = PopupMenu.getInstance();
        this.isIE = jimuUtils.has("ie") || jimuUtils.has("edge")
        this._hasCanvasSupport = !!window.CanvasRenderingContext2D;
        this.scalebarUnits = this.config.scalebarUnits;
        this.chartRenderingOptions = lang.mixin({}, this.config.chartRenderingOptions);
        this.own(
          aspect.after(registry.getEnclosingWidget(this.domNode), 'resize', lang.hitch(this, this._resizeChart), true)
        );
        this._initProfileService = lang.hitch(this, this._initProfileService);
        this.displayProfileChart = lang.hitch(this, this.displayProfileChart);
        this.clearProfileChart = lang.hitch(this, this.clearProfileChart);
        this._updateProfileChart = lang.hitch(this, this._updateProfileChart);
        this._createProfileChart = lang.hitch(this, this._createProfileChart);
        this._getDisplayValue = lang.hitch(this, this._getDisplayValue);
        this._initMeasureTool = lang.hitch(this, this._initMeasureTool);
        this._initTabContainer();
        this._initProgressBar();

        if (this.config.symbols && this.config.symbols.simplelinesymbol) {
          this.elevLineSymbol = new SimpleLineSymbol(this.config.symbols.simplelinesymbol);
        } else {
          this.elevLineSymbol = new SimpleLineSymbol();
        }
        this._initMeasureTool();

        //GGO - INFO - Tengo que comentar esto sino cosas de DX no funcionan
        //this.own(on(this.domNode, 'mousedown', lang.hitch(this, function (event) {
        //  event.stopPropagation();
        //  if (event.altKey) {
        //    var msgStr = this.nls.widgetverstr + ': ' + this.manifest.version;
        //    msgStr += '\n' + this.nls.wabversionmsg + ': ' + this.manifest.wabVersion;
        //    msgStr += '\n' + this.manifest.description;
        //    new Message({
        //      titleLabel: this.nls.widgetversion,
        //      message: msgStr
        //    });
        //  }
        //})));
      },

      _onBtnGridSwitchClicked: function (evt) {
        DataGridManagerGl.switchGrid();
      },

      _onBtnMenuClicked: function (evt) {
        var position = html.position(evt.target || evt.srcElement);
        var actions = [];

        var infoAction = new BaseFeatureAction({
          name: "profileInfo",
          iconClass: 'icon-info',
          label: this.nls.profileinfo,
          iconFormat: 'svg',
          map: this.map,
          onExecute: lang.hitch(this, function () {
            new Message({
              titleLabel: this.nls.profileinfo,
              message: this.profileInfo
            });
          })
        });
        infoAction.name = "profileInfo";
        infoAction.data = {};
        actions.push(infoAction);

        if (this._hasCanvasSupport && !this.isIE) {
          if (this.prepareVis) {
            var prepareAction = new BaseFeatureAction({
              name: "eExportToPNG",
              iconClass: 'eExportToPNG',
              label: this.nls.prepare,
              iconFormat: 'svg',
              map: this.map,
              onExecute: lang.hitch(this, this._export)
            });
            prepareAction.name = "prepareDownload";
            prepareAction.data = {};
            actions.push(prepareAction);
          }
        }

        //GGO - Modificaci�n para agarrar
        var exportCSVAction = new BaseFeatureAction({
          name: "eExportToCSV",
          iconClass: 'eExportToCSV',
          label: this.nls._featureAction_exportToCSV,
          iconFormat: 'png',
          map: this.map,
          onExecute: lang.hitch(this, function () {
            var mDate = new Date();
            var mMonth = (mDate.getMonth() + 1) < 10 ? "0" + (mDate.getMonth() + 1) : (mDate.getMonth() + 1);
            var mDateString = mDate.getDate() + "" + (mMonth) + "" + mDate.getFullYear();
            var mHourString = mDate.getHours() + "" + mDate.getMinutes() + "" + mDate.getSeconds();

            //CSVUtils.exportCSV(this.nls.export_profileFileName + mDateString, this.currentProfileResults.data, this.currentProfileResults.columns);
            CSVUtils.exportCSV(this.nls.export_profileFileName + mDateString + "_" + mHourString, DataGridManagerGl.getDataForCSV(), DataGridManagerGl.getColumnsForCSV());
          })
        });
        exportCSVAction.name = "eExportToCSV";
        exportCSVAction.data = {};
        actions.push(exportCSVAction);

        //GGO - Inclusi�n de acci�n: Exportar a excel.
        var exportXLSAction = new BaseFeatureAction({
          name: "eExportToXLS",
          iconClass: 'eExportToXLS',
          label: this.nls._featureAction_exportToXLS,
          iconFormat: 'png',
          map: this.map,
          onExecute: lang.hitch(this, function () {
            DataGridManagerGl.exportToXls();
          })
        });
        exportXLSAction.name = "eExportToXLS";
        exportXLSAction.data = {};
        actions.push(exportXLSAction);


        var flipProfileAction = new BaseFeatureAction({
          name: "flipProfile",
          iconClass: 'icon-show-related-record',
          label: this.nls.flipProfile,
          iconFormat: 'svg',
          map: this.map,
          onExecute: lang.hitch(this, this._flipProfile)
        });
        flipProfileAction.name = "flipProfile";
        flipProfileAction.data = {};

        // GGO - 0908 - Quitado el FlipProfile porque anda raro
        //actions.push(flipProfileAction);

        var removeAction = new BaseFeatureAction({
          name: "ClearProfile",
          iconClass: 'icon-close',
          label: this.nls.clear,
          iconFormat: 'svg',
          map: this.map,
          onExecute: lang.hitch(this, this._clear)
        });
        removeAction.name = "ClearProfile";
        removeAction.data = {};
        //actions.push(removeAction);

        this.popupMenu.setActions(actions);
        this.popupMenu.show(position);
      },

      /**
       *  STARTUP THE DIJIT
       */
      startup: function () {
        that = this
        var css = this.id + "_panel"
        $("#" + css).css("transition", "width 0.5s, height 0.5s")
        this.inherited(arguments);
        //GGO - Inicializaci�n de UI
        $($("#refreshWarning1")[0]).attr("src", widgObj.amdFolder + "images/refresh_warning.png");
        $($("#refreshWarning1")[1]).attr("src", widgObj.amdFolder + "images/refresh_warning.png");
        /*********************/
        //GGO - Funciones para conectar con estructura de Managers
        DataGridManagerGl.MainWidget = this;
        FormManagerGl.MainWidget = this;
        LogicManagerGl.MainWidget = this;
        StandByManagerGl.MainWidget = this;


        this.DataGridManagerLc.MainWidget = this;
        this.FormManagerLc.MainWidget = this;
        this.LogicManagerLc.MainWidget = this;
        this.StandByManagerLc.MainWidget = this;


        //this.DataGridManagerLc.startUp(); // INFO - Se inicia con el _initUI
        this.FormManagerLc.startUp();
        this.StandByManagerLc.startUp();
        this.LogicManagerLc.startUp();

        this.WidgetGeometryService = new GeometryService(this.config.URLS.GeometryServer);
        this._initUI();
        $(".tab").click(function () {
          if (this.outerText == "Resultados") {
            that.currentTab = "Resultados"
            that.FormManagerLc.isDraw = true
            that._validateChangeTab()
          } else {
            that.currentTab = "Datos"
            widgObj.resizeSmall()
          }
        })
      },
      _validateChangeTab: function () {
        this.FormManagerLc.checkStepValueInput()
        this.FormManagerLc.validateEnablingOfConfirmButton()
      },
      _initTabContainer: function () {
        var tabs = [];
        tabs.push({
          title: this.nls.measurelabel,
          content: this.tabNode1
        });
        tabs.push({
          title: this.nls.resultslabel,
          content: this.tabNode2
        });
        this.selTab = this.nls.measurelabel;
        this.tabContainer = new TabContainer({
          tabs: tabs,
          selected: this.selTab
        }, this.tabMain);

        this.tabContainer.startup();
        this.own(on(this.tabContainer, 'tabChanged', lang.hitch(this, function (title) {
          if (title !== this.nls.resultslabel) {
            this.selTab = title;
          }
          this._resizeChart();
          // GGO - Fix

          DataGridManagerGl.repaintMainDataGrid();

        })));
        jimuUtils.setVerticalCenter(this.tabContainer.domNode);
        html.setStyle(this.btnDownload, 'display', 'none');
      },

      _initProgressBar: function () {
        this.progressBar = new ProgressBar({
          indeterminate: true
        }, this.progressbar);
        html.setStyle(this.progressBar.domNode, 'display', 'none');
      },
      resize: function () {
        $("#" + this.domNode.id).css("transition", "width 0.5s, height 0.5s")
        // console.log("Panel antes");
        //console.log(this.getPanel());
        // GGO - Fix de dimension inicial
        var mPosition = {
          l: null,
          t: null
        };
        /*"position": {
            "left": 55,
            "top": 45,
            "height": 450,
            "width": 675,
            "relativeTo": "map"
        },*/
        if (this.getPanel().position.height < 450)
          mPosition.h = 255;
        if (this.getPanel().position.width < 675)
          mPosition.w = 345;
        this.getPanel().resize(mPosition);
        // console.log("Panel despues");
        // console.log(this.getPanel());

        // GGO - Resize

        this.DataGridManagerLc.repaintMainDataGrid();
      },
      resizeSmall: function () {
        $("#" + this.domNode.id).css("transition", "width 0.5s, height 0.5s")
        // console.log("Panel antes");
        //console.log(this.getPanel());
        // GGO - Fix de dimension inicial
        var mPosition = {
          l: null,
          t: null
        };
        /*"position": {
            "left": 55,
            "top": 45,
            "height": 450,
            "width": 675,
            "relativeTo": "map"
        },*/
        var panel = this.getPanel()
        panel.position.width = 345
        panel.position.height = 255
        panel.setPosition(panel.position)
        panel.panelManager.normalizePanel(panel);
        // console.log("Panel despues");
        // console.log(this.getPanel());

        // GGO - Resize

        this.DataGridManagerLc.repaintMainDataGrid();
        this._resizeChart()
        try {
          $("#" + this.domNode.parentElement.parentElement.parentElement.childNodes[2].id).hide()
        } catch (error) {

        }
      },
      resizeBig: function () {
        that = this
        // console.log("Panel antes");
        //console.log(this.getPanel());
        // GGO - Fix de dimension inicial
        var mPosition = {
          l: null,
          t: null
        };
        /*"position": {
            "left": 55,
            "top": 45,
            "height": 450,
            "width": 675,
            "relativeTo": "map"
        },*/
        var panel = this.getPanel()
        panel.position.width = 600
        panel.position.height = 450
        panel.setPosition(panel.position)

        // console.log("Panel despues");
        // console.log(this.getPanel());
        setTimeout(function () {
          panel.panelManager.normalizePanel(panel);

          that.DataGridManagerLc.repaintMainDataGrid();
          that._resizeChart()
        }, 500)
        // GGO - Resize
        try {
          $("#" + this.domNode.parentElement.parentElement.parentElement.childNodes[2].id).hide()
        } catch (error) {

        }
      },
      onClose: function () {
        if (this.measureTool) {
          this.measureTool.setTool("distance", false);
          this.measureTool.clearResult();
          this._displayChartLocation(-1);
        }

        // GGO - Cerramos los managers aplicando las medidas de seguridad
        this.LogicManagerLc.closeUp();
        this.FormManagerLc.closeUp();
        this.DataGridManagerLc.closeUp();
        this.chartLocationGraphic = null;
        this.clearProfileChart();
        StandByManagerGl.StandbyContainer.hide();
        // GGO - Implementaci�n de variable de control
        this.firstTimeExecuted = false;

        // GGO - 2108 
        this.map.setMapCursor("default");
      },

      onOpen: function () {
        if (this.lastMeasure && this.measureTool) {
          this.measureTool.measure(this.lastMeasure);
        }
        //GGO - Reinciamos la Grilla
        this.DataGridManagerLc.restart();
        this.FormManagerLc.reOpened();

        console.log("Panel antes");
        console.log(this.getPanel());

        // GGO - Fix de dimension inicial
        var mPosition = {
          l: null,
          t: null
        };
        /*"position": {
          "left": 55,
          "top": 45,
          "height": 450,
          "width": 675,
          "relativeTo": "map"
        },*/
        mPosition.h = 255;
        mPosition.w = 345;
        this.getPanel().resize(mPosition);

        console.log("Panel despu�s");
        console.log(this.getPanel());
      },

      /**
       * INITIALIZE ESRI MEASUREMENT DIJIT
       *
       * @private
       */
      _initMeasureTool: function () {
        var red = new Color(Color.named.red);
        var orange = new Color([255, 170, 0]);
        // MEASUREMENT TOOL //
        this.measureTool = new Measurement({
          map: this.map,
          pointSymbol: new SimpleMarkerSymbol(this.config.symbols.lineEndSymbol),
          lineSymbol: new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, red, 3),
          defaultAreaUnit: Units.SQUARE_METERS,//(this.scalebarUnits === 'metric') ? Units.SQUARE_KILOMETERS : Units.SQUARE_MILES,
          defaultLengthUnit: Units.METERS//(this.scalebarUnits === 'metric') ? Units.KILOMETERS : Units.MILES
        }, this._measureNode);
        aspect.after(this.measureTool, 'setTool', lang.hitch(this, function () {
          if (this.measureTool.activeTool) {
            this.map.setInfoWindowOnClick(false);
            this.disableWebMapPopup();
          } else {
            this.map.setInfoWindowOnClick(true);
            this.enableWebMapPopup();
          }
        }));
        this.measureTool.startup();
        this.measureTool.hide(); // GGO - 0608 - No quiero que sea visible.

        // HIDE AREA AND LOCATION TOOLS //
        this.measureTool.hideTool('area');
        this.measureTool.hideTool('location');

        //Activate then deactivate the distance tool to enable the measure units
        on.once(this.measureTool, "tool-change", lang.hitch(this, function () {
          this.measureTool.setTool("distance", false);
          this.measureTool.clearResult();
        }));
        this.measureTool.setTool("distance", true);

        // CREATE PROFILE ON DISTANCE MEASURE-END EVENT //
        // GGO - 0608 - Con este evento podr�amos registrar EN TODDO MOMENTO el c�lculo de la medici�n.
        this.measureTool.on('measure', lang.hitch(this, this._onMeasure));

        // GGO - 0608 - El fin del dibujo es procesado por LogicManager (tienen los dos el mismo event.geometry)
        this.measureTool.on('measure-start', lang.hitch(this, LogicManagerGl.processDrawStart));

        // GGO - 0608 - El fin del dibujo es procesado por LogicManager (tienen los dos el mismo event.geometry)

        this.measureTool.on('measure-end', lang.hitch(this, LogicManagerGl.processDrawEnd));

        // Clear existing profiles when distance tool is clicked.
        this.measureTool._distanceButton.on("click", lang.hitch(this, this._onMeasureClick));

        // Update the chart when units change
        on(this.measureTool, "unit-change", lang.hitch(this, this._unitsChanged), true);
      },

      disableWebMapPopup: function () {
        if (this.map && this.map.webMapResponse) {
          var handler = this.map.webMapResponse.clickEventHandle;
          if (handler) {
            handler.remove();
            this.map.webMapResponse.clickEventHandle = null;
          }
        }
      },

      enableWebMapPopup: function () {
        if (this.map && this.map.webMapResponse) {
          var handler = this.map.webMapResponse.clickEventHandle;
          var listener = this.map.webMapResponse.clickEventListener;
          if (listener && !handler) {
            this.map.webMapResponse.clickEventHandle = on(
              this.map,
              'click',
              lang.hitch(this.map, listener)
            );
          }
        }
      },

      /**
       * MEASUREMENT DISTACE TOOL CLICK
       *
       * @private
       */
      _onMeasureClick: function () {
        this.clearProfileChart();
        this.map.infoWindow.clearFeatures();
        this.map.infoWindow.hide();
        this.emit("measure-distance-checked", {
          checked: this.measureTool._distanceButton.checked
        });
      },

      _onMeasure: function (evt) {

        var mSegmentLength = evt.segmentLength.toFixed(2);
        var mLineLength = evt.values.toFixed(2);

        $("#iElevationProfile_spanSegmentLength").text(mSegmentLength + " [m]");
        $("#iElevationProfile_spanLineLength").text(mLineLength + " [m]");
      },

      _onMeasureEnd: function (evt) {
        if (evt.toolName === "distance") {
          this.tabContainer.selectTab(this.nls.resultslabel);
          if (!this.map.spatialReference.isWebMercator()) {
            var params = new ProjectParameters();
            params.geometries = [evt.geometry];
            params.outSR = new SpatialReference(this.map.spatialReference); // GGO - 0608 
            esriConfig.defaults.geometryService.project(params, lang.hitch(this, function (results) {
              this.lastMeasure = results[0];
              this.displayProfileChart(results[0]);
            }));
          } else {
            this.lastMeasure = evt.geometry;
            this.displayProfileChart(evt.geometry);
          }
        }
      },

      _downloadCanvas: function (link, canvas, filename) {
        link.href = canvas.toDataURL("image/jpeg");
        link.download = filename;
        // html.setStyle(this.btnExport, 'display', 'none');
        this.prepareVis = false;
        html.setStyle(this.btnDownload, 'display', 'block');
      },

      _export: function (evt) {
        gfxUtils.toSvg(this.profileChart.surface).then(lang.hitch(this, function (svg) {
          var canvas = document.createElement('canvas');
          canvas.width = this.profileChart.dim.width;
          canvas.height = this.profileChart.dim.height;
          var context = canvas.getContext("2d");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height)

          var URL = window.URL || window.webkitURL;
          var data = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
          var url = URL.createObjectURL(data);
          var image = new Image();
          image.crossOrigin = '';
          image.onload = lang.hitch(this, function () {
            context.drawImage(image, 0, 0);
            URL.revokeObjectURL(url);
            var mFileName = this.nls.export_profileFileName;
            canvas.toBlob(function (blob) {
              var filesize = Math.round(blob.length / 1024) + ' KB';

              var mDate = new Date();
              var mMonth = (mDate.getMonth() + 1) < 10 ? "0" + (mDate.getMonth() + 1) : (mDate.getMonth() + 1);
              var mDateString = mDate.getDate() + "" + (mMonth) + "" + mDate.getFullYear();
              var mHourString = mDate.getHours() + "" + mDate.getMinutes() + "" + mDate.getSeconds();

              saveAs(blob, mFileName + mDateString + "_" + mHourString + ".png");
            });

          });
          image.src = url;
        }));

      },

      _clear: function () {
        this.lastMeasure = null;
        this.currentProfileResults = null;
        html.setStyle(this.divOptions, 'display', 'none');
        html.setStyle(this.divGridSwitch, 'display', 'none');
        this.prepareVis = false;
        html.setStyle(this.btnDownload, 'display', 'none');
        this.clearProfileChart();
        this.tabContainer.selectTab(this.nls.measurelabel);
        this.measureTool.clearResult();
        return false;
      },

      /**
       * INITIALIZE THE UI
       *
       * @private
       */
      _initUI: function () {

        if (this.chartRenderingOptions.constrain) {
          domClass.add(this._chartNode, "PanelMax");
        }
        // MAKE SURE WE HAVE ACCESS TO THE PROFILE SERVICE //
        this._initProfileService().then(lang.hitch(this, function () {
          this._updateProfileChart();
          // DIJIT SUCCESSFULLY LOADED //
          this.loaded = true;
          this.emit('load', {});

          // GGO - Una vez que fue cargado el dijit de Chart > Se carga la tabla
          DataGridManagerGl.startUp();

        }), lang.hitch(this, function () {
          this.emit('error', new Error(this.nls.errors.InvalidConfiguration));
          FormManagerGl.launchToastError(this.nls.errors.InvalidConfiguration);
          this.destroy();
        }));
      },

      /**
       * INITIALIZE THE PROFILE SERVICE
       *
       * @returns {*}
       * @private
       */
      _initProfileService: function () {
        var deferred = new Deferred();
        this.samplingDistance = new LinearUnit();
        this.samplingDistance.units = Units.METERS;
        // if (this.profileServiceUrl) {
        //   // MAKE SURE PROFILE SERVICE IS AVAILABLE //
        //   esriRequest({
        //     url: this.profileServiceUrl,
        //     content: {
        //       f: 'json'
        //     },
        //     callbackParamName: 'callback'
        //   }).then(lang.hitch(this, function (taskInfo) {
        //     //console.log('GP Service Details: ', taskInfo);

        //     // TASK DETAILS //
        //     this.taskInfo = taskInfo;

        //     // CREATE GP PROFILE SERVICE //
        //     this.profileService = new Geoprocessor(this.profileServiceUrl);
        //     this.profileService.setOutSpatialReference(this.map.spatialReference);

        //     // SAMPLING DISTANCE //
        //     this.samplingDistance = new LinearUnit();
        //     this.samplingDistance.units = Units.METERS;

        //     deferred.resolve();
        //   }), lang.hitch(this, function (error) {
        //     deferred.reject(error);
        //   }));
        // } else {
        //   deferred.reject(new Error(this.nls.errors.InvalidConfiguration));
        // }
        setTimeout(function () {
          deferred.resolve()
        }, 50)
        return deferred.promise;
      },


      /**
       * GET PROFILE OVER POLYLINE FROM PROFILE SERVICE
       *
       * @param polyline
       * @returns {*}
       * @private
       */
      _getProfile: function (polyline, pMeasureType, pResolution, pStepValue, pStepMeasuretype) {
        var deferred = new Deferred();

        // CONVERT WEBMERCATOR POLYLINE TO GEOGRAPHIC        //
        // - IF NOT WEBMERCATOR ASSUME ALREADY IN GEOGRAPHIC //
        //var geoPolyline = (polyline.spatialReference.isWebMercator()) ? webMercatorUtils.webMercatorToGeographic(polyline) : polyline;
        // GET LENGTH IN METERS //
        //var profileLengthMeters = geodesicUtils.geodesicLengths([geoPolyline], Units.METERS)[0];
        // GET SAMPLING DISTANCE //
        //var samplingDistance = (profileLengthMeters / this.samplingPointCount);

        // CREATE GP TASK INPUT FEATURE SET //
        var inputProfileGraphic = new Graphic(polyline, null, {
          OID: 1
        });
        var inputLineFeatures = new FeatureSet();
        inputLineFeatures.features = [inputProfileGraphic];
        // MAKE SURE OID FIELD IS AVAILABLE TO GP SERVICE //
        inputLineFeatures.fields = [
          {
            'name': 'OID',
            'type': 'esriFieldTypeObjectID',
            'alias': 'OID'
          }
        ];

        // GGO - Request Object
        var samplingDistance;
        var mRequest = {};
        mRequest["InputLineFeatures"] = inputLineFeatures;
        mRequest["ProfileIDField"] = 'OID';
        mRequest["DEMResolution"] = pResolution;
        if (pStepValue) {
          mRequest["MaximumSampleDistance"] = pStepValue;
          samplingDistance = pStepValue;
          if (pStepMeasuretype === 9001)
            mRequest["MaximumSampleDistanceUnits"] = "Meters";
          else
            mRequest["MaximumSampleDistanceUnits"] = "Kilometers";
        } else {
          mRequest["MaximumSampleDistance"] = "";
          mRequest["MaximumSampleDistanceUnits"] = "";
        }

        mRequest["returnZ"] = true;
        mRequest["returnM"] = true;


        // MAKE GP REQUEST //

        // SG - Grafico por identify
        this.LogicManagerLc.continueRecursive = true
        this.LogicManagerLc.profileResultsArray = []
        this.LogicManagerLc.identifyVeritces(0, deferred)

        // SG - Grafico por servicio perfil topografico
        // this.profileService.execute(mRequest).then(lang.hitch(this, function (results) {
        //   
        //   // GET RESULT //
        //   if (results.length > 0) {
        //     var profileOutput = results[0].value;
        //     // GET PROFILE FEATURE //
        //     if (profileOutput.features.length > 0) {
        //       var profileFeature = profileOutput.features[0];
        //       // SET DEM RESOLUTION DETAILS //
        //       this._sourceStr = lang.replace('{0}: {1}', [this.nls.chart.demResolution, profileFeature.attributes.DEMResolution]);

        //       // GET PROFILE GEOMETRY //
        //       var profileGeometry = profileFeature.geometry;
        //       var allElevations = [];
        //       var allDistances = [];


        //       if (profileGeometry.paths.length > 0) {
        //         if (profileGeometry.spatialReference.wkid !== this.map.spatialReference.wkid) {
        //           // PROYECCION A SR //
        //           var mProjectParameters = new ProjectParameters();
        //           mProjectParameters.geometries = [profileGeometry];
        //           mProjectParameters.outSR = this.map.spatialReference;
        //           this.WidgetGeometryService.project(mProjectParameters, function (pProjectedLines) {
        //             // Con la geometr�a projectada, procesamos la elevaci�n
        //             if (pProjectedLines && pProjectedLines.length > 0) {
        //               // Guardamos la �ltima geometr�a projectada procesada
        //               var mProjectedGeometry = pProjectedLines[0];

        //               // POLYLINE PATHS //
        //               array.forEach(mProjectedGeometry.paths, lang.hitch(this, function (profilePoints, pathIndex) {
        //                 // ELEVATION INFOS //
        //                 array.forEach(profilePoints, lang.hitch(this, function (coords, pointIndex) {
        //                   var elevationInfo = {
        //                     x: ((coords.length > 3) ? coords[3] : (pointIndex * samplingDistance)),
        //                     y: ((coords.length > 2) ? coords[2] : 0.0),
        //                     pathIdx: pathIndex,
        //                     pointIdx: pointIndex
        //                   };
        //                   allElevations.push(elevationInfo);
        //                   allDistances.push(elevationInfo.x);
        //                 }));
        //               }));

        //               // RESOLVE TASK //
        //               deferred.resolve({
        //                 geometry: mProjectedGeometry,
        //                 elevations: allElevations,
        //                 distances: allDistances,
        //                 samplingDistance: samplingDistance
        //               });
        //             }
        //           });
        //         }
        //         else {
        //           // POLYLINE PATHS //
        //           array.forEach(profileGeometry.paths, lang.hitch(this, function (profilePoints, pathIndex) {
        //             // ELEVATION INFOS //
        //             array.forEach(profilePoints, lang.hitch(this, function (coords, pointIndex) {
        //               var elevationInfo = {
        //                 x: ((coords.length > 3) ? coords[3] : (pointIndex * samplingDistance)),
        //                 y: ((coords.length > 2) ? coords[2] : 0.0),
        //                 pathIdx: pathIndex,
        //                 pointIdx: pointIndex
        //               };
        //               allElevations.push(elevationInfo);
        //               allDistances.push(elevationInfo.x);
        //             }));
        //           }));

        //           // RESOLVE TASK //
        //           deferred.resolve({
        //             geometry: profileGeometry,
        //             elevations: allElevations,
        //             distances: allDistances,
        //             samplingDistance: samplingDistance
        //           });
        //         }
        //       } else {
        //         deferred.reject(new Error(this.nls.errors.UnableToProcessResults));
        //       }
        //     } else {
        //       deferred.reject(new Error(this.nls.errors.UnableToProcessResults));
        //     }
        //   } else {
        //     deferred.reject(new Error(this.nls.errors.UnableToProcessResults));
        //   }
        // }), deferred.reject);

        return deferred.promise;
      },


      /**
       * GET PROFILE OVER POLYLINE FROM PROFILE SERVICE
       *
       * @param polyline
       * @returns {*}
       * @private
       */
      _getProfileOld: function (polyline, pMeasureType, pResolution, pStepValue, pStepMeasuretype) {
        // var deferred = new Deferred();
        // 
        // // CONVERT WEBMERCATOR POLYLINE TO GEOGRAPHIC        //
        // // - IF NOT WEBMERCATOR ASSUME ALREADY IN GEOGRAPHIC //
        // //var geoPolyline = (polyline.spatialReference.isWebMercator()) ? webMercatorUtils.webMercatorToGeographic(polyline) : polyline;
        // // GET LENGTH IN METERS //
        // //var profileLengthMeters = geodesicUtils.geodesicLengths([geoPolyline], Units.METERS)[0];
        // // GET SAMPLING DISTANCE //
        // //var samplingDistance = (profileLengthMeters / this.samplingPointCount);

        // // CREATE GP TASK INPUT FEATURE SET //
        // var inputProfileGraphic = new Graphic(polyline, null, {
        //   OID: 1
        // });
        // var inputLineFeatures = new FeatureSet();
        // inputLineFeatures.features = [inputProfileGraphic];
        // // MAKE SURE OID FIELD IS AVAILABLE TO GP SERVICE //
        // inputLineFeatures.fields = [
        //   {
        //     'name': 'OID',
        //     'type': 'esriFieldTypeObjectID',
        //     'alias': 'OID'
        //   }
        // ];

        // // GGO - Request Object
        // var samplingDistance;
        // var mRequest = {};
        // mRequest["InputLineFeatures"] = inputLineFeatures;
        // mRequest["ProfileIDField"] = 'OID';
        // mRequest["DEMResolution"] = pResolution;
        // if (pStepValue) {
        //   mRequest["MaximumSampleDistance"] = pStepValue;
        //   samplingDistance = pStepValue;
        //   if (pStepMeasuretype === 9001)
        //     mRequest["MaximumSampleDistanceUnits"] = "Meters";
        //   else
        //     mRequest["MaximumSampleDistanceUnits"] = "Kilometers";
        // } else {
        //   mRequest["MaximumSampleDistance"] = "";
        //   mRequest["MaximumSampleDistanceUnits"] = "";
        // }

        // mRequest["returnZ"] = true;
        // mRequest["returnM"] = true;


        // // MAKE GP REQUEST //
        // this.profileService.execute(mRequest).then(lang.hitch(this, function (results) {

        //   // GET RESULT //
        //   if (results.length > 0) {
        //     var profileOutput = results[0].value;
        //     // GET PROFILE FEATURE //
        //     if (profileOutput.features.length > 0) {
        //       var profileFeature = profileOutput.features[0];
        //       // SET DEM RESOLUTION DETAILS //
        //       this._sourceStr = lang.replace('{0}: {1}', [this.nls.chart.demResolution, profileFeature.attributes.DEMResolution]);

        //       // GET PROFILE GEOMETRY //
        //       var profileGeometry = profileFeature.geometry;
        //       var allElevations = [];
        //       var allDistances = [];

        //       // GGO - Proceso gr�fico
        //       //LogicManagerGl.processGraphicProfile(profileGeometry);

        //       if (profileGeometry.paths.length > 0) {
        //         // POLYLINE PATHS //
        //         array.forEach(profileGeometry.paths, lang.hitch(this, function (profilePoints, pathIndex) {
        //           // ELEVATION INFOS //
        //           array.forEach(profilePoints, lang.hitch(this, function (coords, pointIndex) {
        //             var elevationInfo = {
        //               x: ((coords.length > 3) ? coords[3] : (pointIndex * samplingDistance)),
        //               y: ((coords.length > 2) ? coords[2] : 0.0),
        //               pathIdx: pathIndex,
        //               pointIdx: pointIndex
        //             };
        //             allElevations.push(elevationInfo);
        //             allDistances.push(elevationInfo.x);
        //           }));
        //         }));

        //         // RESOLVE TASK //
        //         deferred.resolve({
        //           geometry: profileGeometry,
        //           elevations: allElevations,
        //           distances: allDistances,
        //           samplingDistance: samplingDistance
        //         });
        //       } else {
        //         deferred.reject(new Error(this.nls.errors.UnableToProcessResults));
        //       }
        //     } else {
        //       deferred.reject(new Error(this.nls.errors.UnableToProcessResults));
        //     }
        //   } else {
        //     deferred.reject(new Error(this.nls.errors.UnableToProcessResults));
        //   }
        // }), deferred.reject);

        // return deferred.promise;
      },


      /**
       * DISPLAY PROFILE CHART
       *
       * @param geometry
       * @returns {*}
       */
      displayProfileChart: function (geometry) {
        StandByManagerGl.StandbyContainer.show();
        html.setStyle(this.divOptions, 'display', 'none');
        html.setStyle(this.divGridSwitch, 'display', 'none');
        html.setStyle(this.btnDownload, 'display', 'none');
        //html.setStyle(this.progressBar.domNode, 'display', 'block');

        // EXCEPTION: Caso especial porque aqu� hay discrepancia entre los SR del servicio y mapa
        // Projectamos la geometr�a para hacerla coincidir con la del servicio
        //var mOutSpatialReference = new SpatialReference({ wkid: 2082 });
        var mProjectParameters = new ProjectParameters();
        mProjectParameters.geometries = [geometry];
        mProjectParameters.outSR = this.map.spatialReference;


        var mdisplayProfileChartCont = lang.hitch(this, this.displayProfileChartCont);

        this.WidgetGeometryService.project(mProjectParameters, function (pProjectedLines) {
          StandByManagerGl.StandbyContainer.hide();
          // Con la geometr�a projectada, procesamos la elevaci�n
          if (pProjectedLines && pProjectedLines.length > 0) {

            console.log(pProjectedLines[0]);


            mdisplayProfileChartCont(pProjectedLines[0]);
          }
        });


      },

      displayProfileTab: function () {
        this.tabContainer.selectTab(this.nls.resultslabel);

      },
      //GGO - Flag de control
      firstTimeExecuted: false,
      //GGO - Funci�n para ejecutar el Chart. Se invoca desde LogicManager
      displayProfileChartCont: function (pGeometry, pMeasureType, pResolution, pStepValue, pStepMeasuretype) {

        StandByManagerGl.StandbyContainer.show();
        html.setStyle(this.divOptions, 'display', 'none');
        html.setStyle(this.divGridSwitch, 'display', 'none');
        html.setStyle(this.btnDownload, 'display', 'none');
        //html.setStyle(this.progressBar.domNode, 'display', 'block');


        this._getProfile(pGeometry, pMeasureType, this.config.demResolutionDefault, pStepValue, pStepMeasuretype).then(lang.hitch(this, function (elevationInfo) {
          StandByManagerGl.StandbyContainer.hide();

          // GGO - Implementaci�n de variable de control

          this.firstTimeExecuted = true;
          this.elevationInfo = elevationInfo;
          this._updateProfileChart();
          this.emit('display-profile', elevationInfo);
          topic.publish('display-profile', elevationInfo);
          html.setStyle(this.divOptions, 'display', 'block');
          html.setStyle(this.divGridSwitch, 'display', 'block');
          this.prepareVis = true;
          //html.setStyle(this.progressBar.domNode, 'display', 'none');
        }), lang.hitch(this, function (error) {
          StandByManagerGl.StandbyContainer.hide();
          //html.setStyle(this.progressBar.domNode, 'display', 'none');
          /* GGO - Tratamiento de error: Limpieza de chart y limpieza de Graphic Layer*/
          LogicManagerGl.clearGraphicLayerList();
          this.clearProfileChart();
          /*------*/
          //alert(lang.replace('{message}\n\n{details.0}', error));
          FormManagerGl.launchToastError(lang.replace('{message}\n\n{details.0}', error));
          this.emit('error', error);
        }));
      },

      /**
       * CLEAR PROFILE CHART
       *
       * @private
       */
      clearProfileChart: function () {
        this.elevationInfo = null;
        this._updateProfileChart();
        this.emit('clear-profile', {});
      },

      /**
       * UPDATE PROFILE CHART
       *
       * @private
       */
      _updateProfileChart: function () {

        html.setStyle(this.divOptions, 'display', 'none');
        html.setStyle(this.divGridSwitch, 'display', 'none');
        //alert("TODO - STAND BY");
        //html.setStyle(this.progressBar.domNode, 'display', 'block');
        //StandByManagerGl.StandbyContainer.show();
        this._createProfileChart(this.elevationInfo).then(lang.hitch(this, function () {

          this.profileChart.resize();
          StandByManagerGl.StandbyContainer.hide();
          //html.setStyle(this.progressBar.domNode, 'display', 'none');
        }), lang.hitch(this, function (error) {
          StandByManagerGl.StandbyContainer.hide();
          //html.setStyle(this.progressBar.domNode, 'display', 'none');
          this.emit('error', error);
          FormManagerGl.launchToastError(error);
        }));
      },

      _unitsChanged: function () {
        //Check to see if the measure tool is active. If so call update profile chart
        if (this.measureTool._distanceButton.checked) {
          //measure tool
          this._updateProfileChart();
        }
      },

      _flipProfile: function () {
        var oPath = this.lastMeasure.paths[0];
        this.lastMeasure.removePath(0);
        oPath.reverse();
        this.lastMeasure.addPath(oPath);
        this.displayProfileChart(this.lastMeasure);
      },

      /**
       * CREATE PROFILE CHART
       *
       * @param elevationInfo
       * @returns {*}
       * @private
       */
      _createProfileChart: function (elevationInfo) {


        var deferred = new Deferred();

        // CHART SERIES NAMES //
        var waterDataSeriesName = 'Water';
        var elevationDataSeriesName = 'ElevationData';

        // MIN/MAX/STEP //
        var yMin = -10.0;
        var yMax = 100.0;

        // DID WE GET NEW ELEVATION INFORMATION //
        if (!elevationInfo) {


          // CLEAR GRAPHIC FROM MAP //
          this._displayChartLocation(-1);

          // SAMPLING DISTANCE //
          this.samplingDistance.distance = (this.map.extent.getWidth() / this.samplingPointCount);

          // GEOMETRY AND ELEVATIONS //
          this.profilePolyline = null;
          var samplingDisplayDistance = this._convertDistancesArray([this.samplingDistance.distance])[0];
          this.elevationData = this._getFilledArray(this.samplingPointCount, samplingDisplayDistance, true);

          // CLEAR GAIN/LOSS AND SOURCE DETAILS //
          this._gainLossStr = '';
          this._sourceStr = '';

          // REMOVE ELEVATION INDICATORS //
          if (this.elevationIndicator) {
            this.elevationIndicator.destroy();
            this.elevationIndicator = null;
          }
          if (this.elevationIndicator2) {
            this.elevationIndicator2.destroy();
            this.elevationIndicator2 = null;
          }
        } else {

          // GGO - 20/08
          StandByManagerGl.StandbyContainer.show();
          //alert(" TODDO - _createProfileChart");

          // GEOMETRY, ELEVATIONS, DISTANCES AND SAMPLING DISTANCE //

          this.profilePolyline = elevationInfo.geometry;
          this.elevationData = this._convertElevationsInfoArray(elevationInfo.elevations);
          this.distances = this._convertDistancesArray(elevationInfo.distances);
          this.samplingDistance.distance = this._convertDistancesArray([elevationInfo.samplingDistance.distance])[0];

          // CALC MIN/MAX/STEP //
          var yMinSource = this._getArrayMin(this.elevationData);
          var yMaxSource = this._getArrayMax(this.elevationData);
          var yRange = (yMaxSource - yMinSource);
          yMin = yMinSource - (yRange * 0.05);
          yMax = yMaxSource + (yRange * 0.05);

          // GAIN/LOSS DETAILS //
          var detailsNumberFormat = {
            places: 2
          };
          var elevFirst = this.elevationData[0].y;
          var elevLast = this.elevationData[this.elevationData.length - 1].y;
          var mGeometryLengthString = LogicManagerGl.getLengthStringFromProfile(elevationInfo.geometry);
          var gainLossDetails = {
            profile_length: mGeometryLengthString,
            min: number.format(yMinSource, detailsNumberFormat),
            max: number.format(yMaxSource, detailsNumberFormat),
            start: number.format(elevFirst, detailsNumberFormat),
            end: number.format(elevLast, detailsNumberFormat),
            gainloss: number.format((elevLast - elevFirst), detailsNumberFormat),
            unit: this._getDisplayUnitsX(true)
          };
          this._gainLossStr = lang.replace(this.nls.chart.gainLossTemplate, gainLossDetails);
          this.profileInfo = this._gainLossStr + "<br>" + this._sourceStr;

          // REMOVE ELEVATION INDICATORS //
          if (this.elevationIndicator) {
            this.elevationIndicator.destroy();
            this.elevationIndicator = null;
          }
          if (this.elevationIndicator2) {
            this.elevationIndicator2.destroy();
            this.elevationIndicator2 = null;
          }

          // MOUSE/TOUCH ELEVATION INDICATOR //
          var indicatorProperties = {
            series: elevationDataSeriesName,
            mouseOver: true,
            font: "normal normal bold 9pt 'Avenir Light' !important",
            fontColor: this.chartRenderingOptions.indicatorFontColor,
            fill: this.chartRenderingOptions.indicatorFillColor,
            markerFill: 'none',
            markerStroke: {
              color: 'red',
              width: 3.0
            },
            markerSymbol: 'm -6 -6, l 12 12, m 0 -12, l -12 12', // RED X //
            offset: {
              y: -2,
              x: -25
            },
            labelFunc: lang.hitch(this, function (obj) {
              this._displayChartLocation(obj.x);
              DataGridManagerGl.selectLocation(obj);
              var elevUnitsLabel = this._getDisplayUnitsX(true);
              // GGO - Fix formato.
              var elevChangeLabel = number.format(obj.y, detailsNumberFormat); //obj.y.toFixed(2);//
              var mElevChangeLabelDot = elevChangeLabel.replace(",", ".");
              return lang.replace('{0} {1}', [mElevChangeLabelDot, elevUnitsLabel]); //2108 - Elevacion
            })
          };
          // MOUSE/TOUCH ELEVATION CHANGE INDICATOR //
          var indicatorProperties2 = {
            series: waterDataSeriesName,
            mouseOver: true,
            font: "normal normal bold 8pt 'Avenir Light' !important;",
            fontColor: this.chartRenderingOptions.indicatorFontColor,
            fill: this.chartRenderingOptions.indicatorFillColor,
            /*fillFunc: lang.hitch(this, function (obj) {
              var elevIndex = this.distances.indexOf(obj.x);
              var elev = this.elevationData[elevIndex].y;
              return (elev >= elevFirst) ? 'green' : 'red';
            }),*/
            offset: {
              y: 25,
              x: -30
            },
            labelFunc: lang.hitch(this, function (obj) {
              /// GGO - 1708

              DataGridManagerGl.selectLocation(obj);
              var mDataItem = DataGridManagerGl.getDataElementByTouchObject(obj);
              return (mDataItem["Pend"].toFixed(2) + "\xB0"); //2108 - Pendiente
              /*
                var elevIndex = this.distances.indexOf(obj.x);
                var elev = this.elevationData[elevIndex].y;
                var elevChangeLabel = number.format(elev - elevFirst, detailsNumberFormat);
                var plusMinus = ((elev - elevFirst) > 0) ? '+' : '';
                DataGridManagerGl.selectLocation(obj);
                return lang.replace('{0}{1}', [plusMinus, elevChangeLabel]);
              */
            })
          };
          if (esriSniff('has-touch')) {
            this.elevationIndicator2 = new TouchIndicator(this.profileChart, 'default', indicatorProperties2);
            this.elevationIndicator = new TouchIndicator(this.profileChart, 'default', indicatorProperties);
          } else {
            this.elevationIndicator2 = new MouseIndicator(this.profileChart, 'default', indicatorProperties2);
            this.elevationIndicator = new MouseIndicator(this.profileChart, 'default', indicatorProperties);
          }
          this.profileChart.fullRender();
        }

        if (this.elevationInfo) {
          var csvData = [];
          for (var e = 0; e < this.elevationData.length; e++) {
            var csvRow = {};
            csvRow["X"] = this.elevationInfo.geometry.paths[0][e][0];
            csvRow["Y"] = this.elevationInfo.geometry.paths[0][e][1];
            csvRow["Elevation"] = this.elevationData[e].y;
            csvRow["Distance"] = this.distances[e];
            csvData.push(csvRow);
          }
          this.currentProfileResults = {
            data: csvData,
            columns: ["X", "Y", "Elevation", "Distance"]
          }
        }

        // FILLED ZERO ARRAY //
        var waterData = this._resetArray(this.elevationData, 0.0);

        // ARE WE UPDATING OR CREATING THE CHART //
        if (this.profileChart != null) {
          // UPDATE CHART //
          this.profileChart.getAxis('y').opt.min = yMin;
          this.profileChart.getAxis('y').opt.max = yMax;
          this.profileChart.getAxis('y').opt.title = lang.replace(this.nls.chart.elevationTitleTemplate, [this._getDisplayUnitsX(true)]);
          this.profileChart.getAxis('x').opt.title = lang.replace(this.nls.chart.distanceTitleTemplate, [this._getDisplayUnitsX(false)]);
          this.profileChart.dirty = true;
          this.profileChart.updateSeries(waterDataSeriesName, waterData);
          this.profileChart.updateSeries(elevationDataSeriesName, this.elevationData);
          // RENDER CHART //
          this.profileChart.render();
          deferred.resolve();

        } else {

          // CREATE CHART //
          this.profileChart = new Chart(this._chartNode, {
            title: this.nls.chart.title,
            titlePos: 'top',
            titleGap: 0,
            titleFont: lang.replace("normal normal bold {chartTitleFontSize}pt 'Avenir Light' ", this.chartRenderingOptions),
            titleFontColor: this.chartRenderingOptions.titleFontColor
          });

          // SET THEME //
          this.profileChart.setTheme(ThreeD);

          // OVERRIDE DEFAULTS //
          this.profileChart.fill = 'transparent';
          this.profileChart.theme.axis.stroke.width = 2;
          this.profileChart.theme.axis.majorTick.color = Color.named.white.concat(0.5); // TODO - GONZA!
          this.profileChart.theme.axis.majorTick.width = 1.0; // TODO - GONZA!
          this.profileChart.theme.plotarea.fill = {
            type: 'linear',
            space: 'plot',
            x1: 50,
            y1: 100,
            x2: 50,
            y2: 0,
            colors: [
              {
                offset: 0.0,
                color: this.chartRenderingOptions.skyTopColor
              },
              {
                offset: 1.0,
                color: this.chartRenderingOptions.skyBottomColor
              }
            ]
          };

          // Y AXIS //
          this.profileChart.addAxis('y', {
            min: yMin,
            max: yMax,
            fontColor: this.chartRenderingOptions.axisFontColor,
            font: lang.replace("normal normal bold {axisLabelFontSize}pt 'Avenir Light' !important", this.chartRenderingOptions),
            vertical: true,
            natural: true,
            fixed: true,
            includeZero: false,
            majorLabels: true,
            minorLabels: true,
            majorTicks: true,
            minorTicks: true,
            htmlLabels: false,
            majorTick: {
              color: this.chartRenderingOptions.axisMajorTickColor,
              length: 6
            },
            title: lang.replace(this.nls.chart.elevationTitleTemplate, [this._getDisplayUnitsX(true)]),
            titleGap: 30,
            titleFont: lang.replace("normal normal bold {axisTitleFontSize}pt 'Avenir Light' !important", this.chartRenderingOptions),
            titleFontColor: this.chartRenderingOptions.titleFontColor,
            titleOrientation: 'axis'
          });

          // X AXIS //
          this.profileChart.addAxis('x', {
            fontColor: this.chartRenderingOptions.axisFontColor,
            font: lang.replace("normal normal bold {axisLabelFontSize}pt 'Avenir Light' !important", this.chartRenderingOptions),
            natural: true,
            fixed: true,
            includeZero: false,
            majorLabels: true,
            minorLabels: true,
            majorTicks: true,
            minorTicks: true,
            htmlLabels: false,
            majorTick: {
              color: this.chartRenderingOptions.axisMajorTickColor,
              length: 6
            },
            title: lang.replace(this.nls.chart.distanceTitleTemplate, [this._getDisplayUnitsX(false)]),
            titleGap: 5,
            titleFont: lang.replace("normal normal bold {axisTitleFontSize}pt 'Avenir Light' !important", this.chartRenderingOptions),
            titleFontColor: this.chartRenderingOptions.titleFontColor,
            titleOrientation: 'away'
          });

          // GRID //
          this.profileChart.addPlot('grid', {
            type: Grid,
            hMajorLines: true,
            hMinorLines: false,
            vMajorLines: false,
            vMinorLines: false
          });

          // PROFIlE PLOT //
          this.profileChart.addPlot('default', {
            type: Areas,
            tension: 'X'
          });

          // WATER PLOT //
          this.profileChart.addPlot('water', {
            type: Areas
          });

          // WATER DATA //
          this.profileChart.addSeries(waterDataSeriesName, waterData, {
            plot: 'water',
            stroke: {
              width: 2.0,
              color: this.chartRenderingOptions.waterLineColor
            },
            fill: {
              type: 'linear',
              space: 'plot',
              x1: 50,
              y1: 0,
              x2: 50,
              y2: 100,
              colors: [
                {
                  offset: 0.0,
                  color: this.chartRenderingOptions.waterTopColor
                },
                {
                  offset: 1.0,
                  color: this.chartRenderingOptions.waterBottomColor
                }
              ]
            }
          });

          // PROFILE DATA //
          this.profileChart.addSeries(elevationDataSeriesName, this.elevationData, {
            plot: 'default',
            stroke: {
              width: 1.5,
              color: this.chartRenderingOptions.elevationLineColor
            },
            fill: {
              type: 'linear',
              space: 'plot',
              x1: 50,
              y1: 0,
              x2: 50,
              y2: 100,
              colors: [
                {
                  offset: 0.0,
                  color: this.chartRenderingOptions.elevationTopColor
                },
                {
                  offset: 1.0,
                  color: this.chartRenderingOptions.elevationBottomColor
                }
              ]
            }
          });

          // RENDER CHART //
          this.profileChart.render();
          deferred.resolve();
        }

        return deferred.promise;
      },

      /**
       * RESIZE PROFILE CHART
       *
       * @private
       */
      _resizeChart: function () {
        if (this.profileChart) {
          this.profileChart.resize();
        }
      },

      /**
       * DISPLAY CHART LOCATION AS RED X GRAPHIC ON MAP
       *
       * @param {Number} chartObjectX
       */
      _displayChartLocation: function (chartObjectX) {
        if (this.map && this.elevationData && this.profilePolyline) {

          if (!this.chartLocationGraphic) {
            // CREATE LOCATION GRAPHIC //
            var red = new Color(Color.named.red);
            var outline = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, red, 3);
            // GGO - Utilizaci�n de mi marcador
            var chartLocationSymbol = new SimpleMarkerSymbol(this.config.symbols.mapIndicatorSymbol); //SimpleMarkerSymbol.STYLE_X, 13, outline, red);
            this.chartLocationGraphic = new Graphic(null, chartLocationSymbol); // RED X //
            //this.map.graphics.add(this.chartLocationGraphic);
            LogicManagerGl.addDisplayLocatorToGraphicLayer(this.chartLocationGraphic);
          } else if (!this.chartLocationGraphic._graphicsLayer) {
            // GGO -  0808 - Medida de seguridada para no peder marcador locator.
            LogicManagerGl.clearGraphicLayerLocator();
            LogicManagerGl.addDisplayLocatorToGraphicLayer(this.chartLocationGraphic);
          }


          // SET GEOMETRY OF LOCATION GRAPHIC //
          var distanceIndex = (this.distances) ? array.indexOf(this.distances, chartObjectX) : -1;
          if (distanceIndex >= 0) {
            var elevData = this.elevationData[distanceIndex];
            // SG - Cambio para tomar crear polylinea y tomar geografia
            var polylineJSON = this.profilePolyline
            var polyline = new Polyline(polylineJSON)
            this.chartLocationGraphic.setGeometry(polyline.getPoint(elevData.pathIdx, elevData.pointIdx));
          } else {
            this.chartLocationGraphic.setGeometry(null);
          }
        }
      },
      // GGO
      clearDisplayLocator: function () {
        this.chartLocationGraphic = null;
      },

      /**
       * GET DISPLAY VALUE GIVEN A VALUE IN METERS AND THE DISPLAY UNITS
       * CONVERT FROM METERS TO MILES THEN FROM MILES TO DISPLAY UNITS
       *
       * @param {Number} valueMeters
       * @param {String} displayUnits
       */
      _getDisplayValue: function (valueMeters, displayUnits) {
        if (displayUnits === this.measureTool._unitStrings.esriMeters) {
          return valueMeters;
        } else {
          var distanceMiles = (valueMeters * this.measureTool._unitDictionary[this.measureTool._unitStrings.esriMeters]);
          return (distanceMiles / this.measureTool._unitDictionary[displayUnits]);
        }
      },


      /**
         * GET DISPLAY UNITS
         *
         * @param {Boolean} isElevation
         */
      _getDisplayUnitsX: function (isElevation) {
        var displayUnits = this.measureTool._unitDropDown.label;
        if (isElevation) {
          // GGO - Siempre la elevaci�n va en metros.
          displayUnits = "[m]"; //this.measureTool._unitStrings.esriMeters;
          /*
          switch (displayUnits) {
          case this.measureTool._unitStrings.esriMiles:
              displayUnits = this.measureTool._unitStrings.esriFeet;
              break;
          case this.measureTool.esriYards:
              displayUnits = this.measureTool._unitStrings.esriYards;
              break;
          case this.measureTool._unitStrings.esriKilometers:
              displayUnits = this.measureTool._unitStrings.esriMeters;
              break;
          }
          */
        } else {
          //GGO - La distancia puede ir en Metros o Kil�metros
          var mMeasureType = this.FormManagerLc.mMeasureTypeSelected;
          if (mMeasureType === "Meters" || mMeasureType === "Metros") {
            //2108
            displayUnits = "[m]"; //this.measureTool._unitStrings.esriMeters;
          } else {
            displayUnits = "[km]"; //this.measureTool._unitStrings.esriKilometers;
          }

        }
        return displayUnits;
      },

      /**
       * GET DISPLAY UNITS
       *
       * @param {Boolean} isElevation
       */
      _getDisplayUnits: function (isElevation) {
        var displayUnits = this.measureTool._unitDropDown.label;
        if (isElevation) {
          // GGO - Siempre la elevaci�n va en metros.
          displayUnits = this.measureTool._unitStrings.esriMeters;
          /*
          switch (displayUnits) {
          case this.measureTool._unitStrings.esriMiles:
              displayUnits = this.measureTool._unitStrings.esriFeet;
              break;
          case this.measureTool.esriYards:
              displayUnits = this.measureTool._unitStrings.esriYards;
              break;
          case this.measureTool._unitStrings.esriKilometers:
              displayUnits = this.measureTool._unitStrings.esriMeters;
              break;
          }
          */
        } else {
          //GGO - La distancia puede ir en Metros o Kil�metros
          var mMeasureType = this.FormManagerLc.mMeasureTypeSelected;
          if (mMeasureType === "Meters" || mMeasureType === "Metros") {
            //2108
            displayUnits = this.measureTool._unitStrings.esriMeters;
          } else {
            displayUnits = this.measureTool._unitStrings.esriKilometers;
          }

        }
        return displayUnits;
      },

      /**
       * CONVERT ELEVATION INFO (X=DISTANCE,Y=ELEVATION) FROM METERS TO DISPLAY UNITS
       *
       * @param elevationArray
       * @returns {Array}
       * @private
       */
      _convertElevationsInfoArray: function (elevationArray) {
        var displayUnitsX = this._getDisplayUnits(false);
        var displayUnitsY = this._getDisplayUnits(true);
        return array.map(elevationArray, lang.hitch(this, function (item) {
          return lang.mixin(item, {
            x: this._getDisplayValue(item.x, displayUnitsX),
            y: this._getDisplayValue(item.y, displayUnitsY)
          });
        }));
      },

      /**
       * CONVERT DISTANCES FROM METERS TO DISPLAY UNITS
       *
       * @param distancesArray
       * @returns {Array}
       * @private
       */
      _convertDistancesArray: function (distancesArray) {
        var displayUnitsX = this._getDisplayUnits(false);
        return array.map(distancesArray, lang.hitch(this, function (distance) {
          return this._getDisplayValue(distance, displayUnitsX);
        }));
      },

      /**
       * CREATE ARRAY WITH INPUT VALUE AND ALLOW MULTIPLIER
       *
       * @param size
       * @param value
       * @param asMultiplier
       * @returns {Array}
       * @private
       */
      _getFilledArray: function (size, value, asMultiplier) {
        var dataArray = new Array(size);
        for (var dataIdx = 0; dataIdx < size; ++dataIdx) {
          dataArray[dataIdx] = {
            x: asMultiplier ? (dataIdx * value) : dataIdx,
            y: asMultiplier ? 0.0 : (value || 0.0)
          };
        }
        return dataArray;
      },

      /**
       * RESET Y VALUES IN ARRAY
       *
       * @param dataArray
       * @param value
       * @returns {*}
       * @private
       */
      _resetArray: function (dataArray, value) {
        return array.map(dataArray, function (item) {
          return {
            x: item.x,
            y: value
          };
        });
      },

      /**
       * GET MAXIMUM Y VALUE IN ARRAY
       *
       * @param {[]} dataArray
       * @return {number}
       * @private
       */
      _getArrayMax: function (dataArray) {
        var values = array.map(dataArray, function (item) {
          return item.y;
        });
        return Math.max.apply(Math, values);
      },

      /**
       * GET MINIMUM Y VALUE IN ARRAY
       *
       * @param {[]} dataArray
       * @return {number}
       * @private
       */
      _getArrayMin: function (dataArray) {
        var values = array.map(dataArray, function (item) {
          return item.y;
        });
        return Math.min.apply(Math, values);
      },

      //SG - Grafico por identify - CONTINUACION
      _drawGraphic: function (results, deferred) {
        //Si tiene error entonces

        if (arguments[2]) {
          deferred.reject(new Error(this.nls.errors.UnableToProcessResults));
        } else {
          var stepValue = this.FormManagerLc.getStepValue()
          samplingDistance = stepValue;
          // GET PROFILE FEATURE //
          var profileFeature = results;
          // SET DEM RESOLUTION DETAILS //
          this._sourceStr = lang.replace('{0}: {1}', [this.nls.chart.demResolution, profileFeature.attributes.DEMResolution]);

          // GET PROFILE GEOMETRY //
          var profileGeometry = profileFeature.geometry;
          var allElevations = [];
          var allDistances = [];


          if (profileGeometry.paths.length > 0) {
            if (profileGeometry.spatialReference.wkid !== this.map.spatialReference.wkid) {
              // PROYECCION A SR //
              var mProjectParameters = new ProjectParameters();
              mProjectParameters.geometries = [profileGeometry];
              mProjectParameters.outSR = this.map.spatialReference;
              this.WidgetGeometryService.project(mProjectParameters, function (pProjectedLines) {
                // Con la geometr�a projectada, procesamos la elevaci�n
                if (pProjectedLines && pProjectedLines.length > 0) {
                  // Guardamos la �ltima geometr�a projectada procesada
                  var mProjectedGeometry = pProjectedLines[0];

                  // POLYLINE PATHS //
                  array.forEach(mProjectedGeometry.paths, lang.hitch(this, function (profilePoints, pathIndex) {
                    // ELEVATION INFOS //
                    array.forEach(profilePoints, lang.hitch(this, function (coords, pointIndex) {
                      var elevationInfo = {
                        x: ((coords.length > 3) ? coords[3] : (pointIndex * samplingDistance)),
                        y: ((coords.length > 2) ? coords[2] : 0.0),
                        pathIdx: pathIndex,
                        pointIdx: pointIndex
                      };
                      allElevations.push(elevationInfo);
                      allDistances.push(elevationInfo.x);
                    }));
                  }));

                  // RESOLVE TASK //

                  //RRS, establece la distancia real en el input de distancia
                  var distance = allDistances.pop()
                  $("#iElevationProfile_spanSegmentLength").text(distance.toFixed(2) + " [m]");
                  deferred.resolve({
                    geometry: mProjectedGeometry,
                    elevations: allElevations,
                    distances: allDistances,
                    samplingDistance: samplingDistance
                  });
                }
              });
            }
            else {
              // POLYLINE PATHS //
              array.forEach(profileGeometry.paths, lang.hitch(this, function (profilePoints, pathIndex) {
                // ELEVATION INFOS //
                array.forEach(profilePoints, lang.hitch(this, function (coords, pointIndex) {
                  var elevationInfo = {
                    x: ((coords.length > 3) ? coords[3] : (pointIndex * samplingDistance)),
                    y: ((coords.length > 2) ? coords[2] : 0.0),
                    pathIdx: pathIndex,
                    pointIdx: pointIndex
                  };
                  allElevations.push(elevationInfo);
                  allDistances.push(elevationInfo.x);
                }));
              }));

              // RESOLVE TASK //

              deferred.resolve({
                geometry: profileGeometry,
                elevations: allElevations,
                distances: allDistances,
                samplingDistance: samplingDistance
              });
            }
          } else {
            deferred.reject(new Error(this.nls.errors.UnableToProcessResults));
          }
        }

      },
      /**
       * DESTROY DIJIT
       */
      destroy: function () {
        if (this.profileChart) {
          //this.profileChart.destroy();
        }
        this.inherited(arguments);
      }
    });
  });

