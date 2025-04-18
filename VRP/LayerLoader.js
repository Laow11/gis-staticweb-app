///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
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
define(["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/promise/all",
    "dojo/Deferred",
    "dojo/json",   
    "./util",
    "esri/lang",
    "esri/request",
    "esri/arcgis/utils",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/DynamicLayerInfo",
    "esri/layers/FeatureLayer",
    "esri/layers/ImageParameters",
    "esri/layers/ImageServiceParameters",
    "esri/layers/KMLLayer",
    "esri/layers/LayerDrawingOptions",
    "esri/layers/MosaicRule",
    "esri/layers/RasterFunction",
    "esri/layers/VectorTileLayer",
    "esri/layers/WMSLayer",
    "esri/layers/WMSLayerInfo",
    "esri/dijit/PopupTemplate",
    "esri/InfoTemplate",
    "esri/renderers/jsonUtils",
    "esri/geometry/Extent",
    "esri/SpatialReference",
    "jimu/utils",
    "jimu/LayerInfos/LayerInfos"
  ],
  function(declare, lang, array, all, Deferred, djJson, util, esriLang, esriRequest, agsUtils,
    ArcGISDynamicMapServiceLayer, ArcGISImageServiceLayer, ArcGISTiledMapServiceLayer,
    DynamicLayerInfo, FeatureLayer, ImageParameters, ImageServiceParameters, KMLLayer,
    LayerDrawingOptions, MosaicRule, RasterFunction, VectorTileLayer, WMSLayer, WMSLayerInfo,
    PopupTemplate, InfoTemplate, jsonRendererUtils, Extent, SpatialReference, jimuUtils,LayerInfos) {

    return declare(null, {

      item: null,
      itemUrl: null,
      map: null,
      serviceUrl: null,

      constructor: function(args) {
        lang.mixin(this, args);
      },

      addItem: function(item, map) {       
        debugger
        // TODO layer position, titles, timeouts, feedback
        //console.warn("addItem",item);
        var dfd = new Deferred();
        this.map = map;
        this.item = item;
        
        this.itemUrl = this._checkMixedContent(item.itemUrl);
        this.serviceUrl = this._checkMixedContent(item.url);

        if (item.type === "Feature Service") {
          return this._addFeatureService();
        } else if (item.type === "Image Service") {
          return this._addImageService();
        } else if (item.type === "KML") {
          return this._addKML();
        } else if (item.type === "Map Service") {
          return this._addMapService();
        } else if (item.type === "Vector Tile Service") {
          return this._addVectorTileService();
        } else if (item.type === "WMS") {
          return this._addWMS();
        } else {
          // TODO reject
          console.warn("Unsupported item type: ", item.type);
          dfd.resolve(null);
        }
        return dfd;
      },

      _addFeatureService: function() {
        var self = this,
          dfd = new Deferred();
        var serviceUrl = this.serviceUrl;
        var item = this.item,
          itemData = {};
        var layerIds = null,
          layerDfds = [],
          featureLayers = [];

        self._readItemJsonData().then(function(result) {
          //console.warn("_addFeatureService.jsonData",result);
          itemData = result || {};
          if (itemData && itemData.layers && (itemData.layers.length > 0)) {
            array.forEach(itemData.layers, function(l) {
              if ((typeof(l.id) !== "undefined") && (l.id !== null)) {
                if (layerIds === null) {
                  layerIds = [];
                }
                layerIds.push(l.id);
              }
            });
          }
          return self._readRestInfo(serviceUrl);

        }).then(function(result) {

          //console.warn("_addFeatureService.serviceInfo",result);
          if (result && typeof result.type === "string" &&
             (result.type === "Feature Layer" || result.type === "Table")) {
            // a single layer registered from a service /FeatureServer/1 or /MapServer/2
            var layer = new FeatureLayer(serviceUrl, {
              id: self._generateLayerId(),
              outFields: ["*"]
            });
            layerDfds.push(self._waitForLayer(layer));

          } else {
            var list = [];
            if (result && result.layers && result.layers.length > 0) {
              array.forEach(result.layers,function(lyr){
                list.push(lyr);
              });
            }
            if (result && result.tables && result.tables.length > 0) {
              array.forEach(result.tables,function(tbl){
                list.push(tbl);
              });
            }
            if (list.length > 0) {
              array.forEach(list, function(lyr) {
                var bAdd = true;
                if (layerIds !== null && layerIds.length > 0) {
                  bAdd = array.some(layerIds, function(lid) {
                    return (lid === lyr.id);
                  });
                }
                if (bAdd) {
                  var layer = new FeatureLayer(serviceUrl + "/" + lyr.id, {
                    id: self._generateLayerId(),
                    outFields: ["*"]
                  });
                  layerDfds.push(self._waitForLayer(layer));
                }
              });
            } else {
              // TODO popup a message here?
              console.warn("No layers or tables...");
            }
          }
          return all(layerDfds);

        }).then(function(results) {
          //console.warn("_addFeatureService.layerDfds",results);
          array.forEach(results, function(result) {
            featureLayers.push(result);
          });
          featureLayers.reverse();
          return featureLayers;

        }).then(function() {
          array.forEach(featureLayers, function(layer) {
            var opLayer = self._processFeatureLayer(layer, item, itemData);
            layer.arcgisProps = {
              title: opLayer.title
            };
            layer._titleForLegend = opLayer.title;
            if (!esriLang.isDefined(layer.title)) {
              layer.title = opLayer.title;
            }
            self._addLayer(layer);
          });
        }).then(function() {
          dfd.resolve(featureLayers);
        }).otherwise(function(error) {
          dfd.reject(error);
        });
        return dfd;
      },

      _addImageService: function() {
        var self = this,
          dfd = new Deferred();
        self._readItemJsonData().then(function(result) {
          var itemData = result || {};
          return self._newImageServiceLayer(itemData);
        }).then(function(layer) {
          self._addLayer(layer);
          dfd.resolve(layer);
        }).otherwise(function(error) {
          dfd.reject(error);
        });
        return dfd;
      },

      _addKML: function() {
        var self = this,
          dfd = new Deferred();
        self._newKMLLayer().then(function(layer) {
          if (layer) {
            layer.title = self.item.title;
          }
          self._addLayer(layer);
          dfd.resolve(layer);
        }).otherwise(function(error) {
          dfd.reject(error);
        });
        return dfd;
      },

      _addMapService: function() {
        var self = this,
          dfd = new Deferred();
        self._readItemJsonData().then(function(result) {
          var itemData = result || {};
          return self._newMapServiceLayer(itemData);
        }).then(function(layer) {
          self._addLayer(layer);
          dfd.resolve(layer);
        }).otherwise(function(error) {
          dfd.reject(error);
        });
        return dfd;
      },

      _addVectorTileService: function() {
        var self = this,
          dfd = new Deferred();
        self._newVectorTileLayer().then(function(layer) {
          self._addLayer(layer);
          dfd.resolve(layer);
        }).otherwise(function(error) {
          dfd.reject(error);
        });
        return dfd;
      },

      _addWMS: function() {
        var self = this,
          dfd = new Deferred();
        self._readItemJsonData().then(function(result) {
          var itemData = result || {};
          return self._newWMSLayer(itemData);
        }).then(function(layer) {
          if (layer) {
            layer.title = self.item.title;
          }
          self._addLayer(layer);
          dfd.resolve(layer);
        }).otherwise(function(error) {
          dfd.reject(error);
        });
        return dfd;
      },

      _addLayer: function(layer) {

        this.map.initCount++;
        var NumeroOrden = null
        
        //console.warn("_addLayer",layer);
        //console.warn("map",this.map);
        var item = this.item;
        if (layer) {
          layer.xtnItemId = item.id;
          layer.xtnAddData = true;
          if (!layer.arcgisProps && item) {
            layer.arcgisProps = {
              title: item.title
            };
            layer._titleForLegend = item.title;
          }
          if (!esriLang.isDefined(layer.title)) {
                  var tagsLayer = item.tags;    
                if (tagsLayer != null) {

                  for (let tgL of tagsLayer) {
                    if (tgL.includes('Nombre')) {
                    numOrden = tgL.split('Nombre:');
                    description = numOrden[1]
                      }

                    if (tgL.includes('Orden')) {
                          numOrden = tgL.split('Orden:');
                          var num = numOrden[1]           
                          NumeroOrden = num  
                      }
                  }
                  description = description.trim();
                }
        
            layer.title = description;
          }
          
          layer._wabProperties =  {
            itemLayerInfo: {
              itemId: item.id,
              itemUrl: this.itemUrl,
              portalUrl: item.portalUrl
            }
          };
                   
        templates = []

        for (var i = 0; i < layer.layerInfos.length; i++) {          
            if (layer.layerInfos[i].type == "Feature Layer") {
              _this = this
              this.getMapServiceInformation(layer.url + "/" + layer.layerInfos[i].id)
                              
              var popupInfo = this._nuevoPopupInfo(_this.layerselect,layer.layerInfos[i].name);
              
              if (popupInfo) {
                 
              
                  layer.layerInfos[i].infoTemplate = this._nuevoInfoTemplate(popupInfo, layer.layerInfos[i].name);
                  templates[layer.layerInfos[i].id] = {
                      infoTemplate: this._nuevoInfoTemplate(popupInfo, layer.layerInfos[i].name)
                };
              }
          }
       }
         
        
        layer.infoTemplates = templates
        this.map.listMapLayerOrdenados2[num] = layer
        
        if (this.map.initCount == this.map.countList) {

            this.map.listMapLayerOrdenados2 = this.map.listMapLayerOrdenados2.reverse()
           for (let item of this.map.listMapLayerOrdenados2) {
            
              this.map.addLayer(item)  
            }
        }

        var layerInfos = [];
           var layerInfosObject = LayerInfos.getInstanceSync();
            layerInfosObject.traversal(function(layerInfo1){
               layerInfos.push(layerInfo1);
            });

      
            array.map(layerInfos, function (layerInfo) {
 
                layerInfo.enablePopup() 
            });
           
        }
      },
        // GET MAP SERVICE INFORMATION      
      getMapServiceInformation: function(mapServiceUrl) {
          esri.request({
              url: dojo.replace("{0}/layers",[mapServiceUrl]),
              content: {
                  f: 'json'
              },
              sync: true,
              callbackParamName: "callback"
          }).then( function(response) {            
              // THE INFORMATION RETURNED HERE IS NOT THE SAME OBJECT/INSTANCE AS 
              // THE JS API LAYER CREATED ABOBE, IT'S JUST A SIMPLE JSON OBJECT
              // REPRESENTATION OF MAP SERVICE INFORMAITON
              // dojo.forEach(response.layers, function(layerInfo) {
            
              _this.layerselect =   response
              //  });
          });
      },
      _nuevoReadRestInfo: function(url) {

        return esriRequest({
          url: url,
          content: {
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback"
        }, {});
      },
      _nuevoInfoTemplate: function(popupInfo, title) {     
        
        if (popupInfo) {
          try {
            var popupTemplate = new PopupTemplate({
              description: popupInfo.description,
              title: popupInfo.title,
              showAttachments: popupInfo.showAttachments,
              fieldInfos: popupInfo.fieldInfos,
              mediaInfos: popupInfo.mediaInfos
            });
            return popupTemplate;
          } catch (ex) {
            console.error(ex);
          }
        }
        var infoTemplate = new InfoTemplate();
        if (esriLang.isDefined(title)) {
          infoTemplate.setTitle(title);
        }
        return infoTemplate;
      },
      _nuevoPopupInfo: function(object,title) {   
           
        if (object && object.fields) {
          var popupInfo = {
            title: object.name,
            fieldInfos:[],
            description: null,
            showAttachments: true,
            mediaInfos: []
          };
          if (typeof title === "string" && title.length > 0) {
            popupInfo.title = title;
          }
          array.forEach(object.fields, function(field){

            var fieldInfo = jimuUtils.getDefaultPortalFieldInfo(field);

                var fieldName = field.name;
                var item = {
                  fieldName: fieldName,
                  format: null,
                  label: field.alias || fieldName,
                  stringFieldOption: 'textbox',
                  tooltip: '',
                  visible: false,
                  type: field.type
                };
                
                var type = field.type;
                
                switch (type) {
                  case 'esriFieldTypeDate':
                    item.format = {
                      dateFormat: "shortDateLEShortTime24"
                    }
                  break;
                  case 'esriFieldTypeDouble':
                  
                    if ((item.fieldName.includes("LAT") || item.fieldName.includes("LONG")) && item.fieldName != "POPULATION"){                      
                        item.format = {places: 6, digitSeparator: true };                        
                    }
                    else {
                      item.format = {places: 2, digitSeparator: true };      
                    }
                  break;
                }
                item.visible = true;
                item.isEditable = field.editable;
                
                popupInfo.fieldInfos.push(item);
          });
          return popupInfo;
        }
        return null;
      },
      

      _checkMixedContent: function(uri) {
        return util.checkMixedContent(uri);
      },

      _checkUrl: function(url) {
        return agsUtils._checkUrl(url);
      },

      /*
      _checkVectorTileUrl: function(url,operationalLayer) {
        var dfd = new Deferred();
        var endsWith = function(sv,sfx) {
          return (sv.indexOf(sfx,(sv.length - sfx.length)) !== -1);
        };
        if (endsWith(url,".json")) {
          operationalLayer.styleUrl = url;
          dfd.resolve(url);
        } else {
          var u = this.itemUrl+"/resources/styles/root.json";
          var content = {}, options = {};
          esriRequest({url:u,content:content,handleAs:"json",callbackParamName:"callback"},options).then(
            function(){
              operationalLayer.styleUrl = u;
              dfd.resolve(u);
            },
            function(){
              u = url+"/resources/styles/root.json";
              esriRequest({url:u,content:content,handleAs:"json",callbackParamName:"callback"},options).then(
                function(){
                  operationalLayer.styleUrl = u;
                  dfd.resolve(u);
                },
                function(){
                  operationalLayer.url = url;
                  dfd.resolve(url);
                }
              );
            }
          );
        }
        return dfd;
      },
      */

      _checkVectorTileUrl: function(url, operationalLayer) {
        var dfd = new Deferred();
        var endsWith = function(sv, sfx) {
          return (sv.indexOf(sfx, (sv.length - sfx.length)) !== -1);
        };
        if (endsWith(url, ".json")) {
          operationalLayer.styleUrl = url;
          dfd.resolve(url);
          return dfd;
        }
        var params = {
          url: null,
          content: {},
          handleAs: "json",
          callbackParamName: "callback"
        };
        if (this.itemUrl) {
          params.url = this.itemUrl + "/resources/styles/root.json";
          esriRequest(params, {}).then(function() {
            operationalLayer.styleUrl = params.url;
            dfd.resolve(params.url);
          }).otherwise(function() {
            params.url = url + "/resources/styles/root.json";
            esriRequest(params, {}).then(function() {
              operationalLayer.styleUrl = params.url;
              dfd.resolve(params.url);
            }).otherwise(function() {
              operationalLayer.url = url;
              dfd.resolve(url);
            });
          });
        } else {
          params.url = url + "/resources/styles/root.json";
          esriRequest(params, {}).then(function() {
            operationalLayer.styleUrl = params.url;
            dfd.resolve(params.url);
          }).otherwise(function() {
            operationalLayer.url = url;
            dfd.resolve(url);
          });
        }
        return dfd;
      },

      _generateLayerId: function() {
        return this._generateLayerIds(1)[0];
      },

      _generateLayerIds: function(count) {
        var i, ids = [];
        for (i = 0; i < count; i++) {
          ids.push(this._generateRandomId());
        }
        return ids;
      },

      _generateRandomId: function() {
        var t = null;
        if (typeof Date.now === "function") {
          t = Date.now();
        } else {
          t = (new Date()).getTime();
        }
        var r = ("" + Math.random()).replace("0.", "r");
        return (t + "" + r).replace(/-/g, "");
      },

      _makeFeatureLayerTitle: function(pattern, serviceName, layerName) {
        var n, s, regexp;
        try {
          if (serviceName && layerName && (serviceName === layerName)) {
            return serviceName;
          } else if (serviceName && layerName) {
            // try to remove a timestamp suffix
            n = layerName.indexOf(serviceName);
            if (n === 0) {
              s = layerName.substring(n + serviceName.length + 1);
              if (s.length >= 13) {
                regexp = /^\d+$/;
                if (regexp.test(s)) {
                  return serviceName;
                }
              }
            }
          }
        } catch (ex) {}
        return pattern.replace("{serviceName}", serviceName).replace("{layerName}", layerName);
      },

      _newImageServiceLayer: function(itemData) {
        //console.warn("_newImageServiceLayer.itemData",itemData);
        var dfd = new Deferred();
        var mapLayerId = this._generateLayerId();
        var layerUrl = this.serviceUrl;
        var layerObject = {
          mapLayerId: mapLayerId,
          bandIds: null,
          format: null,
          compressionQuality: null,
          opacity: 1.0,
          visibility: true
        };

        if (esriLang.isDefined(itemData.visibility) && itemData.visibility === false) {
          layerObject.visibility = false; // TODO?
        }
        if (esriLang.isDefined(itemData.opacity)) {
          layerObject.opacity = itemData.opacity;
        }
        if (esriLang.isDefined(itemData.minScale) && !esriLang.isDefined(layerObject.minScale)) {
          layerObject.minScale = itemData.minScale;
        }
        if (esriLang.isDefined(itemData.maxScale) && !esriLang.isDefined(layerObject.maxScale)) {
          layerObject.maxScale = itemData.maxScale;
        }
        if (esriLang.isDefined(itemData.refreshInterval) &&
          !esriLang.isDefined(layerObject.refreshInterval)) {
          layerObject.refreshInterval = itemData.refreshInterval;
        }
        if (itemData.popupInfo && !layerObject.popupInfo && !layerObject.disablePopup) {
          layerObject.popupInfo = itemData.popupInfo;
        }
        if (itemData.renderingRule && !layerObject.renderingRule) {
          layerObject.renderingRule = itemData.renderingRule;
          if (itemData.renderingRule.functionName) {
            layerObject.renderingRule.rasterFunction = itemData.renderingRule.functionName;
          }
        }
        if (itemData.bandIds && !layerObject.bandIds) {
          layerObject.bandIds = itemData.bandIds;
        }
        if (itemData.mosaicRule && !layerObject.mosaicRule) {
          layerObject.mosaicRule = itemData.mosaicRule;
        }
        if (itemData.format && !layerObject.format) {
          layerObject.format = itemData.format;
        }
        if (esriLang.isDefined(itemData.compressionQuality) &&
          !esriLang.isDefined(layerObject.compressionQuality)) {
          layerObject.compressionQuality = itemData.compressionQuality;
        }
        if (itemData.layerDefinition && itemData.layerDefinition.definitionExpression &&
          (!esriLang.isDefined(layerObject.layerDefinition) ||
            !esriLang.isDefined(layerObject.layerDefinition.definitionExpression))) {
          layerObject.layerDefinition = layerObject.layerDefinition || {};
          layerObject.layerDefinition.definitionExpression =
            itemData.layerDefinition.definitionExpression;
        }

        var imageServiceParameters = new ImageServiceParameters();
        //imageServiceParameters.bandIds = layerObject.bandIds;
        if (layerObject.bandIds !== null) {
          imageServiceParameters.bandIds = layerObject.bandIds;
        }
        if (layerObject.format !== null) {
          imageServiceParameters.format = layerObject.format;
          if (layerObject.compressionQuality !== null) {
            imageServiceParameters.compressionQuality = layerObject.compressionQuality;
          }
        }
        if (layerObject.renderingRule && layerObject.renderingRule.rasterFunction) {
          var rasterFunction = new RasterFunction(layerObject.renderingRule);
          imageServiceParameters.renderingRule = rasterFunction;
        }
        if (layerObject.mosaicRule) {
          var mosaicRule = new MosaicRule(layerObject.mosaicRule);
          imageServiceParameters.mosaicRule = mosaicRule;
        }
        if (esriLang.isDefined(layerObject.noData)) {
          imageServiceParameters.noData = layerObject.noData;
        }
        if (esriLang.isDefined(layerObject.noDataInterpretation)) {
          imageServiceParameters.noDataInterpretation = layerObject.noDataInterpretation;
        }
        if (esriLang.isDefined(layerObject.interpolation)) {
          imageServiceParameters.interpolation = layerObject.interpolation;
        }

        var props = {
          imageServiceParameters: imageServiceParameters,
          opacity: layerObject.opacity,
          visible: layerObject.visibility
        };
        if (esriLang.isDefined(layerObject.mapLayerId)) {
          props.id = layerObject.mapLayerId;
        }
        if (esriLang.isDefined(layerObject.minScale)) {
          props.minScale = layerObject.minScale;
        }
        if (esriLang.isDefined(layerObject.maxScale)) {
          props.maxScale = layerObject.maxScale;
        }
        if (esriLang.isDefined(layerObject.refreshInterval)) {
          props.refreshInterval = layerObject.refreshInterval;
        }
        if (esriLang.isDefined(layerObject.resourceInfo)) {
          props.resourceInfo = layerObject.resourceInfo;
        }

        var finish = function(layer) {
          
          //console.warn("finish",layer);
          if (layerObject.layerDefinition && layerObject.layerDefinition.definitionExpression) {
            layer.setDefinitionExpression(layerObject.layerDefinition.definitionExpression, true);
          }
          if (!layerObject.disablePopup && layerObject.popupInfo) {
            layer.setInfoTemplate(new PopupTemplate(layerObject.popupInfo));
          }
          /*
          rasterUtil.populateLayerWROInfo(layer,true).then(
            function(){dfd.resolve(layer);},
            function(error2){dfd.reject(error2);}
          );
          */
          dfd.resolve(layer);
        };

        var lyr = new ArcGISImageServiceLayer(this._checkUrl(layerUrl), props);
        this._waitForLayer(lyr).then(
          function(layer) {
            finish(layer);
          },
          function(error) {
            dfd.reject(error);
          }
        );

        return dfd;
      },

      _newInfoTemplate: function(popupInfo, title) {        
        if (popupInfo) {
          try {
            var popupTemplate = new PopupTemplate({
              description: popupInfo.description,
              title: popupInfo.title,
              showAttachments: popupInfo.showAttachments,
              fieldInfos: popupInfo.fieldInfos,
              mediaInfos: popupInfo.mediaInfos
            });
            return popupTemplate;
          } catch (ex) {
            console.error(ex);
          }
        }
        var infoTemplate = new InfoTemplate();
        if (esriLang.isDefined(title)) {
          infoTemplate.setTitle(title);
        }
        return infoTemplate;
      },

      _newKMLLayer: function() {
        var options = {
          id: this._generateLayerId()
        };
        var lyr = new KMLLayer(this.serviceUrl, options);
        return this._waitForLayer(lyr);
      },

      _newMapServiceLayer: function(itemData) {
        
        var self = this,
          dfd = new Deferred();
        var checkVisibleLayers = false;
        var serviceUrl = this.serviceUrl;
        var mapLayerId = this._generateLayerId();
        var content = {
          f: "json"
        };
        esriRequest({
          url: serviceUrl,
          content: content,
          handleAs: "json",
          callbackParamName: "callback"
        }, {}).then(
          function(response) {
         
            var lyr = null;
            var options = {
              id: mapLayerId
            };
            
            if (response.tileInfo) {

              lyr = new ArcGISTiledMapServiceLayer(serviceUrl, options);

            } else {
                    
              if (response && response.supportedImageFormatTypes &&
                  response.supportedImageFormatTypes.indexOf("PNG32") !== -1) {
                options.imageParameters = new ImageParameters();
                options.imageParameters.format = "png32";
              }
              lyr = new ArcGISDynamicMapServiceLayer(serviceUrl, options);

              //console.warn("itemData",itemData);
              //console.warn("response",response);
              if (itemData && itemData.layers && itemData.layers.length > 0) {
                      
                var expressions = [];
                var dynamicLayerInfo;
                var dynamicLayerInfos = [];
                var drawingOptions;
                var drawingOptionsArray = [];
                var source;
                array.forEach(itemData.layers, function(layerInfo){
                  if (layerInfo.layerDefinition && layerInfo.layerDefinition.definitionExpression) {
                    expressions[layerInfo.id] = layerInfo.layerDefinition.definitionExpression;
                  }
                  if (layerInfo.layerDefinition && layerInfo.layerDefinition.source) {
                    dynamicLayerInfo = null;
                    source = layerInfo.layerDefinition.source;
                    if (source.type === "mapLayer") {
                      var metaLayerInfos = array.filter(response.layers, function(rlyr) {
                        return rlyr.id === source.mapLayerId;
                      });
                      if (metaLayerInfos.length) {
                        dynamicLayerInfo = lang.mixin(metaLayerInfos[0], layerInfo);
                      }
                    }
                    else {
                      dynamicLayerInfo = lang.mixin({}, layerInfo);
                    }
                    if (dynamicLayerInfo) {
                      dynamicLayerInfo.source = source;
                      delete dynamicLayerInfo.popupInfo;
                      dynamicLayerInfo = new DynamicLayerInfo(dynamicLayerInfo);
                      if (itemData.visibleLayers) {
                        var vis = ((typeof itemData.visibleLayers) === "string") ?
                          itemData.visibleLayers.split(",") : itemData.visibleLayers;
                        if (array.indexOf(vis, layerInfo.id) > -1) {
                          dynamicLayerInfo.defaultVisibility = true;
                        } else {
                          dynamicLayerInfo.defaultVisibility = false;
                        }
                      }
                      dynamicLayerInfos.push(dynamicLayerInfo);
                    }
                  }
                  if (layerInfo.layerDefinition && layerInfo.layerDefinition.source &&
                      layerInfo.layerDefinition.drawingInfo) {
                    drawingOptions = new LayerDrawingOptions(layerInfo.layerDefinition.drawingInfo);
                    drawingOptionsArray[layerInfo.id] = drawingOptions;
                  }
                });

                if (expressions.length > 0) {
                  lyr.setLayerDefinitions(expressions);
                }
                if (dynamicLayerInfos.length > 0) {
                  lyr.setDynamicLayerInfos(dynamicLayerInfos, true);
                  if (drawingOptionsArray.length > 0) {
                    lyr.setLayerDrawingOptions(drawingOptionsArray, true);
                  }
                } else {
                  checkVisibleLayers = true;
                }
              }

            }
            self._waitForLayer(lyr).then(
                
             function(layer) {  
                  
                //console.warn("MapServiceLayer",layer);
                var templates = null;
                array.forEach(layer.layerInfos, function(layerInfo) {
                  //console.warn("MapServiceLayer.layerInfo",layerInfo);
                  var cfgLyr = null;
                  if (itemData) {
                    array.some(itemData.layers, function(l) {
                      if (layerInfo.id === l.id) {
                        cfgLyr = l;
                        return true;
                      }
                    });
                  }
 
                  var popupInfo = null;
                  if (cfgLyr && cfgLyr.popupInfo) {
                    popupInfo = cfgLyr.popupInfo;
                  }
                  if (popupInfo) {
                    if (templates === null) {
                      templates = {};
                    }
                    templates[layerInfo.id] = {
                      infoTemplate: self._newInfoTemplate(popupInfo, layerInfo.name)
                    };
                  }
                });
                if (layer.infoTemplates === null) {
                  if (templates) {
                    layer.infoTemplates = templates;
                  } else {
                    //self._setDynamicLayerInfoTemplates(layer);
                  }
                }
                  
                /*
                if (checkVisibleLayers) {
                  var visibleLayers = itemData.visibleLayers;
                  if (!itemData.visibleLayers) {
                    var subIds = "";
                    array.forEach(layer.layerInfos, function(layerInfo){
                      if (layerInfo.defaultVisibility) {
                        subIds += (subIds.length > 0 ? "," : "") + layerInfo.id;
                      }
                    });
                    visibleLayers = subIds;
                  }
                  visibleLayers = self._getVisibleFeatureLayers(layer.layerInfos,visibleLayers);
                  layer.setVisibleLayers(visibleLayers);
                }
                */
          
                dfd.resolve(layer);

              },
              function(error2) {
                dfd.reject(error2);
              }
            );
          },
          function(error) {
            dfd.reject(error);
          }
        );
        return dfd;
      },

      _getVisibleFeatureLayers: function(layerInfos, visibleLayers) {
        // don't list the group layers
        if (!layerInfos || !visibleLayers || visibleLayers.length === 0) {
          return [];
        }
        var tocLayers = "," + visibleLayers + ",";
        var realVisibleLayers = [];
        var k, dontUseLayerIds = ",";
        for (k = 0; k < layerInfos.length; k++) {
          if (layerInfos[k].subLayerIds !== null) {
            if (tocLayers.indexOf("," + layerInfos[k].id + ",") === -1 ||
              dontUseLayerIds.indexOf("," + layerInfos[k].id + ",") > -1) {
              dontUseLayerIds += layerInfos[k].subLayerIds.toString() + ",";
            }
          } else if (tocLayers.indexOf("," + layerInfos[k].id + ",") > -1 &&
            dontUseLayerIds.indexOf("," + layerInfos[k].id + ",") === -1) {
            realVisibleLayers.push(layerInfos[k].id);
          }
        }
        return realVisibleLayers;
      },

      _newPopupInfo: function(object,title) {
        if (object && object.fields) {
          var popupInfo = {
            title: object.name,
            fieldInfos:[],
            description: null,
            showAttachments: true,
            mediaInfos: []
          };
          if (typeof title === "string" && title.length > 0) {
            popupInfo.title = title;
          }
          array.forEach(object.fields, function(field){            
           var fieldInfo = jimuUtils.getDefaultPortalFieldInfo(field);

               /*  var fieldName = field.name;
                var item = {
                  fieldName: fieldName,
                  format: null,
                  label: field.alias || fieldName,
                  stringFieldOption: 'textbox',
                  tooltip: '',
                  visible: false,
                  type: field.type
                };
                
                var type = field.type;
                
                switch (type) {
                  case 'esriFieldTypeDate':
                    item.format = {
                      dateFormat: "shortDateLEShortTime24"
                    }
                  break;
                  case 'esriFieldTypeDouble':
                  
                    if ((item.fieldName.includes("LAT") || item.fieldName.includes("LONG")) && item.fieldName != "POPULATION"){                      
                        item.format = {places: 5, digitSeparator: true };                        
                    }
                  break;
                }
                item.visible = true;
                item.isEditable = field.editable;
                
                popupInfo.fieldInfos.push(item);*/
                fieldInfo.visible = true;
                fieldInfo.isEditable = field.editable;
                popupInfo.fieldInfos.push(fieldInfo);
          });
          return popupInfo;
        }
        return null;
      },

      _newVectorTileLayer: function() {
        var self = this,
          dfd = new Deferred(),
          opLayer = {};
        var serviceUrl = this.serviceUrl;
        var mapLayerId = this._generateLayerId();
        if ((typeof serviceUrl === "string") && (serviceUrl.length > 0)) {
          this._checkVectorTileUrl(serviceUrl, opLayer).then(
            function(url) {
              if ((typeof url === "string") && (url.length > 0)) {
                url = self._checkMixedContent(url);
                var props = {
                  id: mapLayerId,
                  opacity: 1,
                  visible: true
                };
                //console.warn("url",url,props);
                var lyr = new VectorTileLayer(url, props);
                //console.warn("lyr",lyr);
                self._waitForLayer(lyr).then(
                  function(layer) {
                    dfd.resolve(layer);
                  },
                  function(error2) {
                    dfd.reject(error2);
                  }
                );
              } else {
                dfd.resolve(null);
              }
            },
            function(error) {
              dfd.reject(error);
            }
          );
        } else {
          dfd.resolve(null);
        }
        return dfd;
      },

      _newWMSLayer: function(itemData) {
        var self = this;
        var item = this.item;
        var itemHasLayers = false;
        var wkid = null;
        var options = {
          id: this._generateLayerId()
        };
        if (itemData) {
          var visibleLayers = [];
          var layerInfos = [];
          array.forEach(itemData.layers, function(layer){
            itemHasLayers = true;
            layerInfos.push(new WMSLayerInfo({
              name: layer.name,
              title: layer.title,
              legendURL: layer.legendURL,
              queryable: layer.queryable,
              showPopup: layer.showPopup
            }));
            visibleLayers.push(layer.name);
          }, this);
          if (itemData.visibleLayers) {
            visibleLayers = itemData.visibleLayers;
          }

          var resourceInfo = {
            customLayerParameters: itemData.customLayerParameters,
            customParameters: itemData.customParameters,
            layerInfos: layerInfos,
            version: itemData.version,
            maxWidth: itemData.maxWidth,
            maxHeight: itemData.maxHeight,
            featureInfoFormat: itemData.featureInfoFormat,
            getFeatureInfoURL: itemData.featureInfoUrl,
            getMapURL: itemData.mapUrl,
            spatialReferences: itemData.spatialReferences,
            title: itemData.title,
            copyright: itemData.copyright,
            minScale: itemData.minScale || 0,
            maxScale: itemData.maxScale || 0,
            format: itemData.format
          };
          // TODO item vs itemData? title copyright
          if (item && item.extent) {
            var gcsExtent = new Extent(
              item.extent[0][0],item.extent[0][1],item.extent[1][0],item.extent[1][1],
              new SpatialReference({wkid:4326})
            );
            resourceInfo.extent = gcsExtent;
          }
          if (itemData.spatialReferences && itemData.spatialReferences.length > 0) {
            wkid = itemData.spatialReferences[0];
          }
          options = {
            id: this._generateLayerId(),
            visibleLayers: visibleLayers,
            format: "png",
            transparent: itemData.firstLayer ? false : true,
            opacity: itemData.opacity,
            visible: (itemData.visibility !== null) ? itemData.visibility : true,
            resourceInfo: resourceInfo,
            refreshInterval: itemData.refreshInterval
          };
        }

        var lyr = new WMSLayer(this.serviceUrl, options);
        var dfd = this._waitForLayer(lyr);
        dfd.then(function(layer) {
          if (!itemHasLayers) {
            self._setWMSVisibleLayers(layer);
          }
          if (wkid && layer.spatialReference) {
            layer.spatialReference.wkid = wkid;
          }
        });
        return dfd;
      },

      _processFeatureLayer: function(featureLayer, item, itemData) {
       
        var self = this,
          dlPattern = "i18n.search.featureLayerTitlePattern"
        var opLayer = null;
        if (itemData && itemData.layers && (itemData.layers.length > 0)) {
          array.some(itemData.layers, function(info) {
            var layerDefinition, jsonRenderer, renderer, isCustomTemplate = false;
            var popInfo, jsonPopInfo, infoTemplate;
            if (info.id === featureLayer.layerId) {
              //console.warn("layerInfo",info);
              if (info.popupInfo) {
                popInfo = info.popupInfo;
                jsonPopInfo = djJson.parse(djJson.stringify(popInfo));
                infoTemplate = new PopupTemplate(jsonPopInfo);
                featureLayer.setInfoTemplate(infoTemplate);
                isCustomTemplate = true;
              }
              if (esriLang.isDefined(info.showLabels)) {
                featureLayer.setShowLabels(info.showLabels);
              }
              if (esriLang.isDefined(info.refreshInterval)) {
                featureLayer.setRefreshInterval(info.refreshInterval);
              }
              if (esriLang.isDefined(info.showLegend)) {
                // TODO?
                console.log('');
              }
              if (esriLang.isDefined(info.timeAnimation)) {
                if (info.timeAnimation === false) {
                  // TODO?
                  console.log("");
                }
              }
              layerDefinition = info.layerDefinition;
              if (layerDefinition) {
                if (layerDefinition.definitionExpression) {
                  featureLayer.setDefinitionExpression(layerDefinition.definitionExpression);
                }
                if (layerDefinition.displayField) {
                  featureLayer.displayField(layerDefinition.displayField);
                }
                if (layerDefinition.drawingInfo) {
                  if (layerDefinition.drawingInfo.renderer) {
                    jsonRenderer = djJson.parse(
                      djJson.stringify(layerDefinition.drawingInfo.renderer)
                    );
                    renderer = jsonRendererUtils.fromJson(jsonRenderer);
                    if (jsonRenderer.type && (jsonRenderer.type === "classBreaks")) {
                      renderer.isMaxInclusive = true;
                    }
                    featureLayer.setRenderer(renderer);
                  }
                  if (esriLang.isDefined(layerDefinition.drawingInfo.transparency)) {
                    // TODO validate before setting?
                    featureLayer.setOpacity(1 - (layerDefinition.drawingInfo.transparency / 100));
                  }
                }
                if (esriLang.isDefined(layerDefinition.minScale)) {
                  featureLayer.setMinScale(layerDefinition.minScale);
                }
                if (esriLang.isDefined(layerDefinition.maxScale)) {
                  featureLayer.setMaxScale(layerDefinition.maxScale);
                }
                if (esriLang.isDefined(layerDefinition.defaultVisibility)) {
                  if (layerDefinition.defaultVisibility === false) {
                    featureLayer.setVisibility(false); // TODO?
                  }
                }
              }
              if (!isCustomTemplate) {
                self._setFeatureLayerInfoTemplate(featureLayer, info.popupInfo);
              }
              opLayer = {
                url: featureLayer.url,
                id: featureLayer.id,
                itemId: item.id,
                title: self._makeFeatureLayerTitle(dlPattern, item.title, featureLayer.name)
              };
              return true;
            }
          });
          return opLayer;

        } else {
          opLayer = {
            url: featureLayer.url,
            id: featureLayer.id,
            itemId: item.id,
            title: self._makeFeatureLayerTitle(dlPattern, item.title, featureLayer.name)
          };
          self._setFeatureLayerInfoTemplate(featureLayer, null, opLayer.title);
          return opLayer;
        }
      },

      _readItemJsonData: function() {
        var u = this.itemUrl + "/data";
        var content = {
            f: "json"
          },
          options = {};
        return esriRequest({
          url: u,
          content: content,
          handleAs: "json"
        }, options);
      },

      _readRestInfo: function(url) {        
        return esriRequest({
          url: url,
          content: {
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback"
        }, {});
      },

      _setDynamicLayerInfoTemplates: function(layer) {
          
        var self = this, templates = null, dfds = [];        
        var readLayer = function(lInfo) {
          var dfd = self._readRestInfo(layer.url + "/" + lInfo.id);
          dfd.then(function(result){                      
              try {                  
              var popupInfo = self._newPopupInfo(result);
              if (popupInfo) {
                templates[lInfo.id] = {
                  infoTemplate: self._newInfoTemplate(popupInfo)
                };
              }
            } catch(exp) {
              console.warn("Error setting popup.");
              console.error(exp);
            }
          });
          
          return dfd;
        };
        
        if (layer.infoTemplates === null) {
          array.forEach(layer.layerInfos, function(lInfo) {
            if (templates === null) {
              templates = {};
            }
            if (!lInfo.subLayerIds) {
              dfds.push(readLayer(lInfo));
            }
          });
        }
        if (dfds.length > 0) {
          all(dfds).then(function(){
            
            if (templates) {
              layer.infoTemplates = templates;
            }
          }).otherwise(function(ex){
            console.warn("Error reading sublayers.");
            console.error(ex);
          });
        }
      },

      _setFeatureLayerInfoTemplate: function(featureLayer, popupInfo, title) {
        if (!popupInfo) {
          popupInfo = this._newPopupInfo(featureLayer,title);
        }
        var template = this._newInfoTemplate(popupInfo, title);
        featureLayer.setInfoTemplate(template);
      },

      _setWMSVisibleLayers: function(layer) {
        var maxLayers = 10,
          lyrNames = [];
        if (layer) {
          array.some(layer.layerInfos, function(lyrInfo) {
            //console.warn("lyrInfo",lyrInfo);
            if (typeof lyrInfo.name === "string" && lyrInfo.name.length > 0) {
              if (lyrNames.length < maxLayers) {
                lyrNames.push(lyrInfo.name);
              } else {
                return true;
              }
            }
          });
          //console.warn("lyrNames",lyrNames);
          if (lyrNames.length <= maxLayers) {
            layer.setVisibleLayers(lyrNames);
          }
        }
      },

      _waitForLayer: function(layer) {        
        var dfd = new Deferred(),
          handles = [];
        if (layer.loaded) {
          dfd.resolve(layer);
          return dfd;
        }
        if (layer.loadError) {
          dfd.reject(layer.loadError);
          return dfd;
        }
        var clearHandles = function() {
          array.forEach(handles, function(h) {
            h.remove();
          });
        };
        //console.warn("_waitForLayer");
        handles.push(layer.on("load", function(layerLoaded) {          
          //console.warn("_waitForLayer.load",layerLoaded);
          clearHandles();
          dfd.resolve(layerLoaded.layer);
        }));
        handles.push(layer.on("error", function(layerError) {
          //console.warn("_waitForLayer.error",layerError);
          clearHandles();
          var error = layerError.error;
          try {
            if (error.message && (error.message.indexOf("Unable to complete") !== -1)) {
              console.warn("layerAccessError", error);
              dfd.reject(new Error("i18n.search.layerInaccessible"));
            } else {
              dfd.reject(error);
            }
          } catch (ex) {
            //console.warn("layerAccessError",ex);
            dfd.reject(error);
          }
        }));
        return dfd;
      },
      _initControlPopup: function() {
     
      var mapServiceLayer = this.originOperLayer.mapService.layerInfo.layerObject;
      var subId = this.originOperLayer.mapService.subId;
      setTimeout(lang.hitch(this,function(){
        this.loadInfoTemplate().then(lang.hitch(this, function(){
          var bmFound = false;
          this._layerInfos._finalBasemapLayerInfos.some(lang.hitch(this, function(bm){
            if(this.id.indexOf(bm.id)>-1){
              bmFound = true;
              return true
            }
          }));
          if(!bmFound){
            this.enablePopup();
          }
        }));
      }), 500);

      this.controlPopupInfo = {
        enablePopup: (mapServiceLayer.infoTemplates && mapServiceLayer.infoTemplates[subId]) ?
                      true:
                      false,
        infoTemplates: undefined
      };
    }

    });

  });
