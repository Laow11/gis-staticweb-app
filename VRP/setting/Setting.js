///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'dojo/_base/lang',
    'dojo/on',
    "dijit/form/Select"
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    lang,
    on) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-vrp-setting',

      startup: function() {
        this.inherited(arguments);

        document.addEventListener("wheel", function(event){
            if(document.activeElement.type === "number"){
                document.activeElement.blur();
            }
        });

        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;

        /*if (config.URLS.urlService) {
            this.urlService.value = config.URLS.urlService;
            this.urlService.proceedValue = true;
        }*/

        if (config.URLS.urlDataModel) {
            this.urlDataModel.value = config.URLS.urlDataModel;
            this.urlDataModel.proceedValue = true;
        }

        if (config.URLS.urlDashboardPortal) {
            this.urlDashboardPortal.value = config.URLS.urlDashboardPortal;
            this.urlDashboardPortal.proceedValue = true;
        }

        if (config.URLS.urlServiceMax) {
            this.urlServiceMax.value = config.URLS.urlServiceMax;
            this.urlServiceMax.proceedValue = true;
        }
        /*if (config.outSR) {
            this.outSR.value = config.outSR;
            this.outSR.proceedValue = true;
        }*/
      },

      getConfig: function() {        
        /*var _urlService = this.urlService.value;
        this.config.URLS.urlService = _urlService;*/

        var urlDataModel = this.urlDataModel.value;
        this.config.URLS.urlDataModel = urlDataModel;

        var urlDashboardPortal = this.urlDashboardPortal.value;
        this.config.URLS.urlDashboardPortal = urlDashboardPortal;

        var urlServiceMax = this.urlServiceMax.value;
        this.config.URLS.urlServiceMax = urlServiceMax;

        /*var outSR = this.outSR.value;
        this.config.outSR = outSR;*/

        return this.config;
      }

    });
  });
