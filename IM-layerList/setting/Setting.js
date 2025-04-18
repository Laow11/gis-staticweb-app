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
  'jimu/BaseWidgetSetting',
  'jimu/LayerInfos/LayerInfos',
  "jimu/utils",
  'dijit/_WidgetsInTemplateMixin',
  './LayerSelector',
  'dijit/form/CheckBox',
  'jimu/dijit/CheckBox',
  "jimu/dijit/SimpleTable",
  "jimu/dijit/LoadingIndicator"
],
  function (
    declare,
    array,
    html,
    lang,
    query,
    on,
    when,
    esriLang,
    BaseWidgetSetting,
    LayerInfos,
    jimuUtils,
    _WidgetsInTemplateMixin,
    LayerSelector,
    CheckBox,
    SimpleTable) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-layerList-setting',


      startup: function () {
        this.inherited(arguments);
        this.setConfig(this.config);
        this.createLayerSelector();
      },

      createLayerSelector: function () {
        var layerInfosObj = LayerInfos.getInstanceSync();
        this.layerSelector = new LayerSelector({
          operLayerInfos: layerInfosObj,
          config: this.config
        }).placeAt(this.layerSelectorDiv);
      },

      _onbaseMapNameBlur: function () {
        this.baseMapName.set('value', jimuUtils.stripHTML(this.baseMapName.get('value')));
      },


      setConfig: function (config) {
        this.showLegend.setValue(config.showLegend);
        this.baseMapName.setValue(config.baseMapName);
        if (config.contextMenu) {
          this.zoomto.setValue(config.contextMenu.ZoomTo);
          this.transparency.setValue(config.contextMenu.Transparency);
          this.controlPopup.setValue(config.contextMenu.EnableOrDisablePopup);
          this.moveupDown.setValue(config.contextMenu.MoveupOrMovedown);
          this.table.setValue(config.contextMenu.OpenAttributeTable);
          this.url.setValue(config.contextMenu.DescriptionOrShowItemDetailsOrDownload);
        }
      },

      getConfig: function () {
        this.config.showLegend = this.showLegend.getValue();
        this.config.baseMapName = this.baseMapName.getValue();
        if (!this.config.contextMenu) {
          this.config.contextMenu = {};
        }
        this.config.contextMenu.ZoomTo = this.zoomto.getValue();
        this.config.contextMenu.Transparency = this.transparency.getValue();
        this.config.contextMenu.EnableOrDisablePopup = this.controlPopup.getValue();
        this.config.contextMenu.MoveupOrMovedown = this.moveupDown.getValue();
        this.config.contextMenu.OpenAttributeTable = this.table.getValue();
        this.config.contextMenu.DescriptionOrShowItemDetailsOrDownload = this.url.getValue();
        this.config.layerOptions = this.layerSelector.getLayerOptions();
        return this.config;
      }

    });
  });
