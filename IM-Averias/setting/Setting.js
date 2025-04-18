// All material copyright ESRI, All Rights Reserved, unless otherwise specified.
// See http://arcgis.improntait.com/arcgis1071/jsapi/jsapi/esri/copyright.txt and http://www.arcgis.com/apps/webappbuilder/copyright.txt for details.

//>>built
define(["dojo/_base/lang", "dojo/_base/declare", "jimu/BaseWidgetSetting", "jimu/dijit/Filter"], function (b, c, d, e) {
    return c([d], {
        baseClass: "jimu-widget-filter-demo-setting",
        singleSetting: null,
        layerChooserSelect: null,
        layerInfosObj: null,
        postCreate: function () {
            this.inherited(arguments);
            this.url = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer/0";
            this.layerDefinition = {
                currentVersion: 10.41,
                name: "Cities",
                fields: [{
                    name: "OBJECTID",
                    type: "esriFieldTypeOID",
                    alias: "OBJECTID",
                    domain: null
                }, {
                    name: "Shape",
                    type: "esriFieldTypeGeometry",
                    alias: "Shape",
                    domain: null
                }, {
                    name: "CITY_NAME",
                    type: "esriFieldTypeString",
                    alias: "CITY_NAME",
                    length: 30,
                    domain: null
                }, {
                    name: "POP",
                    type: "esriFieldTypeInteger",
                    alias: "POP",
                    domain: null
                }, {
                    name: "POP_RANK",
                    type: "esriFieldTypeInteger",
                    alias: "POP_RANK",
                    domain: null
                }, {
                    name: "POP_CLASS",
                    type: "esriFieldTypeString",
                    alias: "POP_CLASS",
                    length: 25,
                    domain: null
                }, {
                    name: "LABEL_FLAG",
                    type: "esriFieldTypeInteger",
                    alias: "LABEL_FLAG",
                    domain: null
                }]
            };
            this.filter = new e({
                enableAskForValues: !0
            });
            this.filter.placeAt(this.domNode);
            this.filter.build({
                url: this.url,
                layerDefinition: this.layerDefinition,
                expr: "1\x3d1"
            });
            this.config && this.setConfig(this.config)
        },
        startup: function () {
            this.inherited(arguments);
            this.filter.startup()
        },
        setConfig: function (a) {
            a && setTimeout(b.hitch(this, function () {
                this.filter.build({
                    url: this.url,
                    layerDefinition: this.layerDefinition,
                    partsObj: a
                })
            }), 2E3)
        },
        getConfig: function () {
            return this.filter.toJson()
        }
    })
});