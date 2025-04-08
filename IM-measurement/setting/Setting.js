///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2016 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  "dojo/_base/array",
  "dojo/_base/html",
  "dojo/_base/lang",
  "dojo/query",
  "dojo/on",
  "dojo/when",
  "esri/lang",
  "dojo/Deferred",
  'dijit/_WidgetsInTemplateMixin',
  "jimu/utils",
  'jimu/BaseWidgetSetting',
  "jimu/portalUtils",
  'esri/units',
  'dojo/on',
  "dijit/Tooltip",
  "dojo/mouse",
  "dijit/form/Select",
  'jimu/dijit/CheckBox'
],
  function (declare,
    array,
    html,
    lang,
    query,
    on,
    when,
    esriLang,
    Deferred,
    _WidgetsInTemplateMixin,
    jimuUtils,
    BaseWidgetSetting,
    PortalUtils,
    esriUnits,
    on,
    Tooltip,
    mouse) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-measurement-setting',

      startup: function () {
        this.inherited(arguments);
        if (!this.config.measurement) {
          this.config.measurement = {};
        }

        this._showToolsItems = [];
        Tooltip.position = "below";
        this._initShowToolItem(this.showArea);
        this._initShowToolItem(this.showDistance);
        this._initShowToolItem(this.showLocation);
        this._initGSVCToolItem(this.config.geometryServiceURL);
        this._initTSVToolItem(this.config.transformationsServiceURL);
        this._initUGToolItem(this.config.UG);
        this._initMapSysToolItem(this.config.mapSys);
        this._initDEMToolItem(this.config.demServiceURL);
        this._initATTRToolItem(this.config.altitudeField);
        this.setConfig(this.config);
      },

      _processConfig: function (configJson) {
        var def = new Deferred();
        if (configJson.defaultLengthUnit && configJson.defaultAreaUnit) {
          def.resolve(configJson);
        } else {
          PortalUtils.getUnits(this.appConfig.portalUrl).then(lang.hitch(this, function (units) {
            configJson.defaultAreaUnit = units === 'english' ?
              esriUnits.SQUARE_MILES : esriUnits.SQUARE_KILOMETERS;
            configJson.defaultLengthUnit = units === 'english' ?
              esriUnits.MILES : esriUnits.KILOMETERS;
            def.resolve(configJson);
          }));
        }
        return def.promise;
      },

      setConfig: function (config) {
        this.config = config;

        this._processConfig(config).then(lang.hitch(this, function (configJson) {
          if (configJson.measurement.defaultAreaUnit) {
            this.selectAreaUnit.set('value', configJson.measurement.defaultAreaUnit);
          } else {
            this.selectAreaUnit.set('value', "esriAcres");
          }
          if (configJson.measurement.defaultLengthUnit) {
            this.selectLengthUnit.set('value', configJson.measurement.defaultLengthUnit);
          } else {
            this.selectLengthUnit.set('value', "esriMiles");
          }

          if ("undefined" !== typeof configJson.showArea && false === configJson.showArea) {
            this.showArea.setValue(false);
          }
          if ("undefined" !== typeof configJson.showDistance && false === configJson.showDistance) {
            this.showDistance.setValue(false);
          }
          if ("undefined" !== typeof configJson.showLocation && false === configJson.showLocation) {
            this.showLocation.setValue(false);
          }
          if ("undefined" !== typeof configJson.geometryServiceURL && null === configJson.geometryServiceURL && "" === configJson.geometryServiceURL) {
            this.geometryServiceURL.setValue("");
          }
          if ("undefined" !== typeof configJson.transformationsServiceURL && null === configJson.transformationsServiceURL && "" === configJson.transformationsServiceURL) {
            this.transformationsServiceURL.setValue("");
          }
          if ("undefined" !== typeof configJson.UG && null === configJson.UG && "" === configJson.UG) {
            this.UG.setValue("");
          }
          if ("undefined" !== typeof configJson.mapSys && null === configJson.mapSys && "" === configJson.mapSys) {
            this.mapSys.setValue("");
          }
          if ("undefined" !== typeof configJson.demServiceURL && null === configJson.demServiceURL && "" === configJson.demServiceURL) {
            this.demServiceURL.setValue("");
          }
          if ("undefined" !== typeof configJson.altitudeField && null === configJson.altitudeField && "" === configJson.altitudeField) {
            this.altitudeField.setValue("");
          }
        }));
      },

      getConfig: function () {
        this.config.measurement.defaultAreaUnit = this.selectAreaUnit.value;
        this.config.measurement.defaultLengthUnit = this.selectLengthUnit.value;

        this.config.showArea = this.showArea.checked;
        this.config.showDistance = this.showDistance.checked;
        this.config.showLocation = this.showLocation.checked;

        this.config.geometryServiceURL = this.geometryServiceURL.value;
        this.config.transformationsServiceURL = this.transformationsServiceURL.value;
        this.config.UG = this.UG.value;
        this.config.mapSys = this.mapSys.value;
        this.config.demServiceURL = this.demServiceURL.value;
        this.config.altitudeField = this.altitudeField.value;
        return this.config;
      },
      _onGSVCBlur: function () {
        this.geometryServiceURL.set('value', jimuUtils.stripHTML(this.geometryServiceURL.get('value')));
      },
      _onTSVBlur: function () {
        this.transformationsServiceURL.set('value', jimuUtils.stripHTML(this.transformationsServiceURL.get('value')));
      },
      _onUGBlur: function () {
        this.UG.set('value', jimuUtils.stripHTML(this.UG.get('value')));
      },
      _onMapSysBlur: function () {
        this.mapSys.set('value', jimuUtils.stripHTML(this.mapSys.get('value')));
      },
      _onDEMBlur: function () {
        this.demServiceURL.set('value', jimuUtils.stripHTML(this.demServiceURL.get('value')));
      },
      _onAltBlur: function () {
        this.altitudeField.set('value', jimuUtils.stripHTML(this.altitudeField.get('value')));
      },
      _initShowToolItem: function (item) {
        if (item) {
          item.setValue(true);
          this._showToolsItems.push(item);
          this.own(on(item, 'change', lang.hitch(this, this._onShowToolItemsChange, item)));
        }
      },
      _initGSVCToolItem: function (value) {
        this.geometryServiceURL.set('value', jimuUtils.stripHTML(value));
      },
      _initTSVToolItem: function (value) {
        this.transformationsServiceURL.set('value', jimuUtils.stripHTML(value));
      },
      _initUGToolItem: function (value) {
        this.UG.set('value', jimuUtils.stripHTML(value));
      },
      _initMapSysToolItem: function (value) {
        this.mapSys.set('value', jimuUtils.stripHTML(value));
      },
      _initDEMToolItem: function (value) {
        this.demServiceURL.set('value', jimuUtils.stripHTML(value));
      },
      _initATTRToolItem: function (value) {
        this.altitudeField.set('value', jimuUtils.stripHTML(value));
      },
      _onShowToolItemsChange: function (obj) {
        if (obj) {
          if (false === obj.checked && this._isItemsAllHide()) {
            obj.check();
            Tooltip.hide();
            Tooltip.show(this.nls.allHidedTips, obj.domNode);
            this.own(on.once(obj.domNode, mouse.leave,
              lang.hitch(this, function () {
                Tooltip.hide(obj.domNode);
              }))
            );
          }
        }
      },

      _isItemsAllHide: function () {
        for (var i = 0, len = this._showToolsItems.length; i < len; i++) {
          var item = this._showToolsItems[i];
          if (true === item.checked) {
            return false;
          }
        }
        return true;
      }
    });
  });