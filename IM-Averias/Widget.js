var jqueryURL = "./libs/blank";
var dxWeb = "./libs/blank";
var dxLocalization = "./libs/blank";
if (!window.jQuery) {
  jqueryURL = "./libs/jquery.min";
}
if (!window.DevExpress) {
  dxWeb = "../libs/devExpress1624/js/dx.web";
}



define([
  'dojo/_base/declare',
  'jimu/BaseWidget',
  "jimu/dijit/Popup",
  'esri/tasks/query',
  'esri/tasks/QueryTask',
  "esri/layers/FeatureLayer",
  "esri/graphic",
  "esri/geometry/Point",
  'esri/tasks/GeometryService',
  "esri/geometry/projection",
  "esri/SpatialReference",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/Color",
  'dojo/text!./config.json',
  'dojo/query',
  'dojo/_base/lang',
  'dojo/dom-style',
  './GridManager',
  'esri/request',
  'jimu/WidgetManager',
  jqueryURL,
  dxWeb,
  dxLocalization

],
  function (declare, BaseWidget, Popup, Query, QueryTask, FeatureLayer, Graphic, Point, GeometryService, projection, SpatialReference, SimpleMarkerSymbol, Color, config, dojoQuery, lang, domStyle, GridManager, Request, WidgetManager) {

    var widgObj;
    //Manager Local
    var GridManager = GridManager;

    //CONSTANTES 
    var popup = null

    return declare([BaseWidget], {
      datosAverias: null,
      datosAveriasWithGeo: null,
      datosOT: null,
      baseClass: 'widget-averias',
      declaredClass: 'Averias',
      datosDomainsAverias: null,
      idOfAveriaDeDuctosLayer: null,

      GridManagerLc: GridManager,
      /**
       *  POSTCREATE - CONNECT UI ELEMENT EVENTS
       */
      postCreate: function () {

        this.inherited(arguments);
        widgObj = this;

        var panel = widgObj.getPanel();
        var pos = panel.position;
        pos.width = 810;
        pos.height = 345;  
        panel.setPosition(pos);
        panel.panelManager.normalizePanel(panel);

        config = JSON.parse(config)
        widgObj.config = config
        setTimeout(lang.hitch(this, function () {
          domStyle.set(dojoQuery(".dojoxResizeHandle", this.domNode.parentNode.parentNode.parentNode)[0], 'display', 'none');
        }), 200);
      },

      startup: function () {   
        
        widgObj.datosAverias = []
        widgObj.datosAveriasWithGeo = []
        widgObj.datosOT = []
        
        GridManager.MainWidget = this;

        this.GridManagerLc.MainWidget = this;

        this.GridManagerLc.startUp();

        this.queryStartDomainsAverias();
        this.queryStartDataAverias();
        this.getIdOfAveriaDeDuctosLayer();
        
        $("#eliminarAveriaButton").unbind('click');
        $("#eliminarAveriaButton").click(widgObj.eliminarAveria);
        $("#asignarButton").unbind('click');
        $("#asignarButton").click(widgObj.asignarAverias);
        $("#desasignarButton").unbind('click');
        $("#desasignarButton").click(widgObj.desasignarAveriaTrigger);
        $("#aprobarButton").unbind('click');
        $("#aprobarButton").click(widgObj.aprobarAveria);
        $("#refrescarButton").unbind('click');
        $("#refrescarButton").click(widgObj.refrescarGrid);
        $("#desestimarOTButton").unbind('click');
        $("#desestimarOTButton").click(widgObj.desestimarOT);
        
        //RRS, bindings panel de control
        $("#cFilterAV").unbind().bind("click", function (e) {
          e.preventDefault();
          if ($(this.childNodes[0]).hasClass("fa-eye-slash")) {
            $(this.childNodes[0]).removeClass("fa-eye-slash")
            $(this.childNodes[0]).addClass("fa-eye")
            $(this).attr("title", "Mostrar sin asignar")
            $(this).attr("data-todos", "todos")
          }
          else {
            $(this.childNodes[0]).removeClass("fa-eye")
            $(this.childNodes[0]).addClass("fa-eye-slash")
            $(this).attr("title", "Mostrar todos")
            $(this).attr("data-todos", "filtrados")
          }          
          GridManager.loadDataGrids(widgObj.datosAverias, widgObj.datosOT, "AV")
          
                   
        });

        $("#cFilterOT").unbind().bind("click", function (e) {
          e.preventDefault();
          if ($(this.childNodes[0]).hasClass("fa-eye-slash")) {
            $(this.childNodes[0]).removeClass("fa-eye-slash")
            $(this.childNodes[0]).addClass("fa-eye")
            $(this).attr("title", "Mostrar sin asignar")
            $(this).attr("data-todos", "todos")
          }
          else {
            $(this.childNodes[0]).removeClass("fa-eye")
            $(this.childNodes[0]).addClass("fa-eye-slash")
            $(this).attr("title", "Mostrar todos")
            $(this).attr("data-todos", "filtrados")
          }
          GridManager.loadDataGrids(widgObj.datosAverias, widgObj.datosOT, "OT")
          
        });
        $("#zoomAv").unbind().bind("click", function (e) {
          e.preventDefault();
          var geometryService = new GeometryService(config.URLs.geometryServerUrl)
          var keysAverias = $('#gridAverias').dxDataGrid('instance').getSelectedRowKeys();
          var arrGeo = []
          for (var i = 0; i < keysAverias.length; i++) {
            for (var j = 0; j < widgObj.datosAveriasWithGeo.length; j++) {
              if (keysAverias[i].OBJECTID == widgObj.datosAveriasWithGeo[j].attributes[config.dataAveria.OBJECTID]) {

                arrGeo.push(widgObj.datosAveriasWithGeo[j].geometry)
              }
            }
          }
          if (arrGeo.length > 0) {
            geometryService.union(arrGeo, function (geometry) {
              var extent = geometry.getExtent()
              if (extent.xmin === extent.xmax) {
                extent.xmin = parseFloat(extent.xmin - 0.01)
              }
              if (extent.ymin === extent.ymax) {
                extent.xmin = parseFloat(extent.xmin - 0.01)
              }
              var extentExpanded = extent.expand(1.5)
              var mEnvelopOffsetX = extentExpanded.getWidth() * (+1) * 0.25;
              widgObj.map.setExtent(extentExpanded.offset(mEnvelopOffsetX, 0))
            }, function (err) {
              console.log(err)
            });

          }
        });

        $("#attributesTableAV").unbind().bind("click", function (e) {        	
          if ($("#attributesTableAV").attr('name') == "Close"){
            try{
                //Abro la tabla de atributos
                WidgetManager.getInstance().getWidgetsByName(config.parameters.AttributeTableWidgetName)[0]._openTable();
                //Luego modifico la variable de control
                $("#attributesTableAV").attr('name', 'Open');
            }
            catch(error){
                console.log('No se pudo abrir la tabla de atributos con el nombre parametrizado en el config.parameters.AttributeTableWidgetName: ' +
                            config.parameters.AttributeTableWidgetName + error)
                throw error;
            }
          }
          else{
            try{
                 //Cierro la tabla
                 WidgetManager.getInstance().getWidgetsByName(config.parameters.AttributeTableWidgetName)[0]._closeTable();
                 //Luego modifico la variable de control
                 $("#attributesTableAV").attr('name', 'Close');
            }
            catch(error){
                console.log('No se pudo cerrar la tabla de atributos con el nombre parametrizado en el config.parameters.AttributeTableWidgetName: ' +
                            config.parameters.AttributeTableWidgetName + error)
                throw error;
            }
          }          
        });

        $("#cOcultarOTs").unbind().bind("click", function (e) {    
		
          if ($("#cOcultarOTs").attr('name') == "Close"){ 
          	$("#cOcultarOTsArrow").attr('class', 'fas fa-angle-double-left');
          	$("#cOcultarOTs").attr('title', 'Ocultar Órdenes de Trabajo')
          	$("#containerOT").css("display", "block");
          	$("#containerAV").css("border-right", "4px solid #ddd");
          	$("#containerAV").css("padding-right", "13px");
          	$("#gridsContainer").css("width", "800px");   
          	$("#idTitleAverias").css("padding-right", "75px");    
          	$("#asignarButton").show();
          	$("#desestimarOTButton").show();
          	$('#' + document.getElementsByClassName('jimu-widget-frame jimu-container')[0].id).css("padding-right", "5px");
          	$("#cOcultarOTs").attr('name', 'Open');
          	widgObj.getPanel().resize({w:815})
          }
          else{
			  
			$("#cAgrandarGrillaOTsArrow").attr('class', 'fas fa-angle-double-right');
      	$("#cAgrandarGrillaOT").attr('title', 'Agrandar grilla OTs')
      	$("#gridsContainer").css("width", "800px");   			
  			$("#containerOT").css("width", "385px")
  			$("#gridOT").css("width", "385px")
  			$("#containerbtnsOT").css("width", "385px")
	       $("#OTTitleID").css("padding-left", "25%") ;
      	$("#cAgrandarGrillaOT").attr('name', 'Small');
        $("#cAgrandarGrillaOT").css('padding-left', '10.2%');
        $("#cAgrandarGrillaOT").css('padding-right', '8%');
      	widgObj.getPanel().resize({w:815})
	  
	  
	  
	  
	  
	  
      	$("#cOcultarOTsArrow").attr('class', 'fas fa-angle-double-right');
      	$("#cOcultarOTs").attr('title', 'Ver Órdenes de Trabajo')
      	$("#containerOT").css("display", "none");
      	$("#containerAV").css("border-right", "0px");
      	$("#containerAV").css("padding-right", "0px");
      	$("#idTitleAverias").css("padding-right", "75px"); 
      	$("#gridsContainer").css("width", "388px");
      	$("#asignarButton").hide();
      	$("#desestimarOTButton").hide();
      	$('#' + document.getElementsByClassName('jimu-widget-frame jimu-container')[0].id).css("padding-right", "3px");
      	$("#cOcultarOTs").attr('name', 'Close');
      	widgObj.getPanel().resize({w:395})
          }          
        });
		
		$("#cAgrandarGrillaOT").unbind().bind("click", function (e) {                	
      if ($("#cAgrandarGrillaOT").attr('name') == "Small"){ 
        $("#cAgrandarGrillaOTsArrow").attr('class', 'fas fa-angle-double-left');
        $("#cAgrandarGrillaOT").attr('title', 'Acortar grilla OTs')   
			
  			//Tamaño del widget, y del ancho de las grids
  			valueSizeGrid = ((screen.width)*0.96)
        widgObj.getPanel().resize({w:valueSizeGrid})
  			var valueSizeGridsContainer = ((valueSizeGrid)*0.99)
  			$("#gridsContainer").css("width", (valueSizeGridsContainer + "px")); 
  			
  			//Tamaño de la grid OT
  			var valueGridOTSize = (valueSizeGridsContainer - 415)          	  
			  
        //Cambio de tamaño de la grilla
  			$("#containerOT").css("width", valueGridOTSize + "px")
  			$("#gridOT").css("width", valueGridOTSize + "px")
  			$("#containerbtnsOT").css("width", "100%")        
        $("#OTTitleID").css("padding-left", "38%") ;
        $("#cAgrandarGrillaOT").css('padding-left', '5%');
        $("#cAgrandarGrillaOT").css('padding-right', '5%');
  			$("#cAgrandarGrillaOT").attr('name', 'Large');

      }
      else{
        //Cambio de tamaño de la grilla, estado original
      	$("#cAgrandarGrillaOTsArrow").attr('class', 'fas fa-angle-double-right');
      	$("#cAgrandarGrillaOT").attr('title', 'Agrandar grilla OTs')
      	$("#gridsContainer").css("width", "800px"); 			
  			$("#containerOT").css("width", "385px")
  			$("#gridOT").css("width", "385px")
  			$("#containerbtnsOT").css("width", "385px")
        $("#OTTitleID").css("padding-left", "25%") ;
        $("#cAgrandarGrillaOT").css('padding-left', '10.2%');
        $("#cAgrandarGrillaOT").css('padding-right', '8%');
        $("#cAgrandarGrillaOT").attr('name', 'Small');
        widgObj.getPanel().resize({w:815})
        }          
      });

      },

      desasignarAveriaTrigger: function() {
        var averia = {};
        averia.data = GridManager.averiasSelected[0];
        GridManager.confirmarDesasignar(averia);
      },

      refrescarGrid: function() {

      	if ($("#cOcultarOTs").attr('name') == "Close"){
      		document.getElementById('cOcultarOTs').click(); 
		    }

        //Limpio la seleccion de ambas grillas
        $('#gridAverias').dxDataGrid('instance').clearSelection();
        $('#gridOT').dxDataGrid('instance').clearSelection();

      	//Recargo las grillas
        widgObj.queryStartDataAverias();

        //Cierro la tabla de atributos
    		var widgetManager = WidgetManager.getInstance(); 
        var attributesTableWidget = widgetManager.getWidgetsByName(config.parameters.AttributeTableWidgetName);
        attributesTableWidget[0]._closeTable();
    		
      },

      aprobarAveria: function() {        
        //Creo el popup
        popup = new Popup({
          titleLabel: "Modificar REVISADO/APROBADO",
          maxWidth: 320,
          maxHeight: 600,
          autoHeight: true,
          content: "<div><table style='width: 100%; border-collapse: separate; border-spacing: 0 15px;' border-collapse='collapse';><tbody><tr><td>ID Averia</td><td> <input id = 'inputAveria' disabled='disabled'></input></td></tr><tr><td>ID OT</td><td> <input id = 'inputOT' disabled='disabled'></input></td></tr><tr><td>Revisado</td><td> <select id='selectRevisado'> </select></td></tr><tr><td>Aprobado</td><td> <select id='selectAprobado'></select></td></tr></tbody></table></div>",
          buttons: [{
            label: "Aceptar",
            onClick: lang.hitch(this, function () {

              GridManager.averiasSelected[0].APROBADO = document.getElementById('selectAprobado').value;
              GridManager.averiasSelected[0].REVISADO = document.getElementById('selectRevisado').value;              

              var featureAverias = new FeatureLayer(config.URLs.averiasFeature)

              GridManager.averiasSelected
              
              $("#statusInfo").html("<i class='fas fa-circle-notch fa-spin' style='color: deepskyblue'></i> Actualizando...")
              
              var averiasUpdates = []
              for (var i = 0; i < GridManager.averiasSelected.length; i++) {
                var averiasGraphic = new Graphic(null, null, GridManager.averiasSelected[i], null)
                averiasUpdates.push(averiasGraphic)
              }


              featureAverias.applyEdits([], averiasUpdates, [], function () {
                setTimeout(function () {
                  $("#statusInfo").html("<i class='fas fa-check' style='color:green'></i> Operación Exitosa")
                }, 100)
              }, function (error) {
                if (error.message == "Cannot read property 'attributes' of undefined") {
                  $("#statusInfo").html("<i class='fas fa-check' style='color:green'></i> Operación Exitosa")
                } else {
                  setTimeout(function () {
                    $("#statusInfo").html("<i class='fa fa-times' style='color:red'></i> Operación Fallida")
                  }, 100)
                }
              })
              var array = []
              array.push($("#gridAverias").dxDataGrid('instance').getRowIndexByKey(GridManager.averiasSelected[0]));
              $("#gridAverias").dxDataGrid('instance').repaintRows(array);
              $('#gridAverias').dxDataGrid('instance').clearSelection();
              $("#gridAverias").dxDataGrid('instance').selectRowsByIndexes(array);
              //GridManager.loadDataGrids(widgObj.datosAverias, widgObj.datosOT, "AV")

              popup.close();
                     
              
            })
          }, {
            label: "Cancelar",
            onClick: lang.hitch(this, function () {
              popup.close();
            })
          }],
          onClose: function () {
            
            $("#" + popup.id).css("display", "none");
            popup = null;

          }
        })

        //---Traigo los valores de los ID, de la OT y de la avería en caso que estén en la grilla
        if (document.getElementById('inputAveria').value != "null"){
          document.getElementById('inputAveria').value = GridManager.averiasSelected[0].OBJECTID;
        } 
        if (document.getElementById('inputOT').value != "null"){
          document.getElementById('inputOT').value = GridManager.averiasSelected[0].NRO_OT;
        }        

        //--Array que va a permitir luego fijar valores ya existentes (en caso que corresponda)
        var auxArray = []

        //--Variables de los selects (dropdownLists)
        var selectRevisado = document.getElementById('selectRevisado');
        var selectAprobado = document.getElementById('selectAprobado');

        for (var i = 0; i <= datosDomainsAverias.domains.length - 1; i++) {
          //--Nombre del dominio que corresponde a los campos Aprobado/Revisado
          if (datosDomainsAverias.domains[i].name == config.parameters.aprobadoRevisadoDomain){              
            for (var j = 0; j <= datosDomainsAverias.domains[i].codedValues.length - 1; j++) {     
              //--Agrego dinamicamente los valores que corresponden al dominio
              var optionRevisado = document.createElement("option");
              optionRevisado.text = datosDomainsAverias.domains[i].codedValues[j].name;
              optionRevisado.value = datosDomainsAverias.domains[i].codedValues[j].name;
              var optionAprobado = document.createElement("option");
              optionAprobado.text = datosDomainsAverias.domains[i].codedValues[j].name;
              optionAprobado.value = datosDomainsAverias.domains[i].codedValues[j].name;
              selectRevisado.options.add(optionRevisado, j);
              selectAprobado.options.add(optionAprobado, j);

              //--Agrego las opciones al array auxiliar
              auxArray.push(datosDomainsAverias.domains[i].codedValues[j].name);
            }
            //--En caso que ya lo encontró no sigue el loop
            break;
          }          
        }
        
        //--Tomo el valor actual del aprobado, y luego si existe en el dominio de valores posibles,
        //----lo inicializo en ese valor, caso contrario en "NO"
        var actualValueAproved = GridManager.averiasSelected[0].APROBADO;
        if (auxArray.indexOf(actualValueAproved) == -1){
          selectAprobado.selectedIndex = auxArray.indexOf("NO");
        }
        else{
          selectAprobado.selectedIndex = auxArray.indexOf(actualValueAproved);
        }

        //--Tomo el valor actual del revisado, y luego si existe en el dominio de valores posibles,
        //----lo inicializo en ese valor, caso contrario en "NO"
        var actualValueReviewed = GridManager.averiasSelected[0].REVISADO;
        if (auxArray.indexOf(actualValueReviewed) == -1){
          selectRevisado.selectedIndex = auxArray.indexOf("NO");
        }
        else{
          selectRevisado.selectedIndex = auxArray.indexOf(actualValueReviewed);
        }

      },

      eliminarAveria: function() {
        
        //Creo el popup
        popup = new Popup({
          titleLabel: "Eliminar avería",
          maxWidth: 320,
          maxHeight: 600,
          autoHeight: true,
          content: "¿Desea eliminar la avería " + GridManager.averiasSelected[0].OBJECTID + "?",
          buttons: [{
            label: "Aceptar",
            onClick: lang.hitch(this, function () {

              var featureAverias = new FeatureLayer(config.URLs.averiasFeature)
              
              $("#statusInfo").html("<i class='fas fa-circle-notch fa-spin' style='color: deepskyblue'></i> Actualizando...")
              
              var averiasUpdates = []
              for (var i = 0; i < GridManager.averiasSelected.length; i++) {
                var averiasGraphic = new Graphic(null, null, GridManager.averiasSelected[i], null)
                averiasUpdates.push(averiasGraphic)
              }

              var requestHandle = new Request({
  	            "url": config.URLs.averiasFeatureDelete,
  	            "content": {
      				  "objectIds": GridManager.averiasSelected[0].OBJECTID,
      				  "f": "json"
      				}}, {
      				  "usePost": true
      				}
	          );

	          requestHandle.then(requestSucceeded, requestFailed);
            popup.close();
	          function requestSucceeded(response, io){      
              
              //Lo borro de la grilla y la recargo
              var mRowIndex = $('#gridAverias').dxDataGrid('instance').getRowIndexByKey(GridManager.averiasSelected[0]);            
              $('#gridAverias').dxDataGrid('instance').deleteRow(mRowIndex);

              //GridManager.loadDataGrids(widgObj.datosAverias, widgObj.datosOT, "AV")
              popup.close();
	          }

	          function requestFailed(error, io){
              //GridManager.loadDataGrids(widgObj.datosAverias, widgObj.datosOT, "AV")
              popup.close();
	          }

              

            })
          }, {
            label: "Cancelar",
            onClick: lang.hitch(this, function () {
              popup.close();
            })
          }],
          onClose: function () {
                $("#" + popup.id).css("display", "none");
                popup = null;
          }     	 
                      
        })

      },

      //SG - asigna las averias al OT
      desestimarOT: function () {      
      	
        popup = new Popup({
          titleLabel: "Confirmar Desestimar",
          width: 640,
          maxHeight: 600,
          autoHeight: true,
          content: "¿Desea desestimar la OT " + GridManager.OTSelected.NAME + "?" + " No podrá ser visualizada ni relacionarla con averías",
          buttons: [{
            label: "Aceptar",
            onClick: lang.hitch(this, function () {
              var featureOT = new FeatureLayer(config.URLs.ordenesFeatureEdit)
              
              GridManager.OTSelected[config.dataOT.DESESTIMAR] = "SI";
              
              var otUpdates = []
              var otGraphic = new Graphic(null, null, GridManager.OTSelected, null)
              otUpdates.push(otGraphic)
              

              featureOT.applyEdits([], otUpdates, [], function () {
                setTimeout(function () {
                  $("#statusInfo").html("<i class='fas fa-check' style='color:green'></i> Operación Exitosa")
                }, 100)
              }, function (error) {
                if (error.message == "Cannot read property 'attributes' of undefined") {
                  $("#statusInfo").html("<i class='fas fa-check' style='color:green'></i> Operación Exitosa")
                } else {
                  setTimeout(function () {
                    $("#statusInfo").html("<i class='fa fa-times' style='color:red'></i> Operación Fallida")
                  }, 100)
                }
              })
              
              widgObj.refrescarGrid();

              popup.close();
            })
          }, {
            label: "Cancelar",
            onClick: lang.hitch(this, function () {              
              popup.close();
            })
          }],
          onClose: function () {                        
            popup = null;
          }
        })

      },
      

      //SG - asigna las averias al OT
      asignarAverias: function () {        
      	var strAverias = "";
      	for (var i = GridManager.averiasSelected.length - 1; i >= 0; i--) {
      		strAverias = strAverias + " " + GridManager.averiasSelected[i].OBJECTID + ", "
      	}
        popup = new Popup({
          titleLabel: "Confirmar Asignación",
          width: 640,
          maxHeight: 600,
          autoHeight: true,
          content: "¿Desea asignar las averías" + strAverias + " a la orden de trabajo: " + GridManager.OTSelected.NAME + "?",
          buttons: [{
            label: "Aceptar",
            onClick: lang.hitch(this, function () {
              ////
              var featureAverias = new FeatureLayer(config.URLs.averiasFeature)
              
              GridManager.averiasSelected
              GridManager.OTSelected
              for (var i = 0; i < GridManager.averiasSelected.length; i++) {
                GridManager.averiasSelected[i][config.dataAveria.NRO_OT] = GridManager.OTSelected.NAME
                GridManager.averiasSelected[i][config.dataAveria.OT_NAME] = GridManager.OTSelected.NAME
                GridManager.averiasSelected[i][config.dataAveria.OT_LASTMODIFIEDDATE] = GridManager.OTSelected.LASTMODIFIEDDATE
                GridManager.averiasSelected[i][config.dataAveria.OT_CLASESDEORDEN] = GridManager.OTSelected.CLASESDEORDEN
                GridManager.averiasSelected[i][config.dataAveria.OT_FECHA_INICIO] = GridManager.OTSelected.FECHA_INICIO
                GridManager.averiasSelected[i][config.dataAveria.OT_FECHA_FIN] = GridManager.OTSelected.FECHA_FIN
                GridManager.averiasSelected[i][config.dataAveria.OT_TIPODETAREA] = GridManager.OTSelected.TIPODETAREA
                GridManager.averiasSelected[i][config.dataAveria.OT_ORDEN_STATUS] = GridManager.OTSelected.ORDEN_STATUS
                GridManager.averiasSelected[i][config.dataAveria.OT_PROBLEM_SUMMARY] = GridManager.OTSelected.PROBLEM_SUMMARY
                GridManager.averiasSelected[i][config.dataAveria.OT_SITE] = GridManager.OTSelected.SITE
                GridManager.averiasSelected[i][config.dataAveria.OT_SCHEDULED] = GridManager.OTSelected.SCHEDULED
                GridManager.averiasSelected[i][config.dataAveria.OT_PREVIOUS_SCHEDULED] = GridManager.OTSelected.PREVIOUS_SCHEDULED
                GridManager.averiasSelected[i][config.dataAveria.OT_ACKNOWLEDGED_BY_TECHNICIAN] = GridManager.OTSelected.ACKNOWLEDGED_BY_TECHNICIAN
                GridManager.averiasSelected[i][config.dataAveria.OT_ACTUAL_ONSITE_RESPONSE] = GridManager.OTSelected.ACTUAL_ONSITE_RESPONSE
                GridManager.averiasSelected[i][config.dataAveria.OT_POZO] = GridManager.OTSelected.POZO
                GridManager.averiasSelected[i][config.dataAveria.OT_CREATEDDATE] = GridManager.OTSelected.CREATEDDATE
                GridManager.averiasSelected[i][config.dataAveria.OT_ID_AVISO_SAP_C] = GridManager.OTSelected.ID_AVISO_SAP_C
                GridManager.averiasSelected[i][config.dataAveria.OT_SMAX_PS_SAP_PM_WO_ID_C] = GridManager.OTSelected.SMAX_PS_SAP_PM_WO_ID_C
              }
              ///
              $("#statusInfo").html("<i class='fas fa-circle-notch fa-spin' style='color: deepskyblue'></i> Actualizando...")
              for (var i = 0; i < GridManager.averiasSelected.length; i++) {
                for (var j = 0; j < widgObj.datosAverias.length; j++) {
                  if (GridManager.averiasSelected[i].OBJECTID == widgObj.datosAverias[j].OBJECTID) {
                    widgObj.datosAverias[j][config.dataAveria.NRO_OT] = GridManager.OTSelected.NAME
                  }
                }
              }
              popup.close();
              var averiasUpdates = []
              for (var i = 0; i < GridManager.averiasSelected.length; i++) {
                var averiasGraphic = new Graphic(null, null, GridManager.averiasSelected[i], null)
                averiasUpdates.push(averiasGraphic)
              }

              $("#asignarButton").attr("disabled", "disabled"); 

              featureAverias.applyEdits([], averiasUpdates, [], function () {
                setTimeout(function () {
                  $("#statusInfo").html("<i class='fas fa-check' style='color:green'></i> Operación Exitosa")
                }, 100)
              }, function (error) {
                if (error.message == "Cannot read property 'attributes' of undefined") {
                  $("#statusInfo").html("<i class='fas fa-check' style='color:green'></i> Operación Exitosa")
                } else {
                  setTimeout(function () {
                    $("#statusInfo").html("<i class='fa fa-times' style='color:red'></i> Operación Fallida")
                  }, 100)
                }
              })

              var arrayAv = []
              for (var i = GridManager.averiasSelected.length - 1; i >= 0; i--) {
                arrayAv.push($("#gridAverias").dxDataGrid('instance').getRowIndexByKey(GridManager.averiasSelected[i]));
              }              
              $("#gridAverias").dxDataGrid('instance').repaintRows(arrayAv);
              $('#gridAverias').dxDataGrid('instance').clearSelection();
              $("#gridAverias").dxDataGrid('instance').selectRowsByIndexes(arrayAv);

              var arrayOT = []
              arrayOT.push($("#gridOT").dxDataGrid('instance').getRowIndexByKey(GridManager.OTSelected));
              $("#gridOT").dxDataGrid('instance').repaintRows(arrayOT);              
              $('#gridOT').dxDataGrid('instance').clearSelection();
              $("#gridOT").dxDataGrid('instance').getRowElement(arrayOT).attr('style', 'background-color: #f2f2f2 !important')
              $("#gridOT").dxDataGrid('instance').selectRowsByIndexes(arrayOT);
              GridManager.selectionChangedRaised = false
              
              //GridManager.loadDataGrids(widgObj.datosAverias, widgObj.datosOT)

            })
          }, {
            label: "Cancelar",
            onClick: lang.hitch(this, function () {              
              popup.close();
            })
          }],
          onClose: function () {                        
            popup = null;
          }
        })

      },
      pointToExtent: function (map, point, toleranceInPixel) {
        var pixelWidth = map.extent.getWidth() / map.width;
        var toleraceInMapCoords = toleranceInPixel * pixelWidth;
        return new esri.geometry.Extent(point.x - toleraceInMapCoords, point.y - toleraceInMapCoords, point.x + toleraceInMapCoords, point.y + toleraceInMapCoords, map.spatialReference
        );
      },

      //SG - Desasigna la averia seleccionada con doble click de la OT correspondiente
      desasignarAveria: function (averia) {
        var featureAverias = new FeatureLayer(config.URLs.averiasFeature)
        var averiasGraphic = new Graphic(null, null, averia, null)

        featureAverias.applyEdits([], [averiasGraphic], [], function (e) {
          setTimeout(function () {
            $("#statusInfo").html("<i class='fas fa-check' style='color:green'></i> Operación Exitosa")
          }, 100)
        }, function (error) {
          error
          if (error.message == "Cannot read property 'attributes' of undefined") {
            $("#statusInfo").html("<i class='fas fa-check' style='color:green'></i> Operación Exitosa")
          } else {
            setTimeout(function () {
              $("#statusInfo").html("<i class='fa fa-times' style='color:red'></i> Operación Fallida")
            }, 100)
          }          
          // alert("Ha ocurrido un error guardando los cambios")
        })  

        var arrayAv = []
        for (var i = GridManager.averiasSelected.length - 1; i >= 0; i--) {
          arrayAv.push($("#gridAverias").dxDataGrid('instance').getRowIndexByKey(GridManager.averiasSelected[i]));
        }              
        $("#gridAverias").dxDataGrid('instance').repaintRows(arrayAv);
        $('#gridAverias').dxDataGrid('instance').clearSelection();
        $("#gridAverias").dxDataGrid('instance').selectRowsByIndexes(arrayAv);

        var arrayOT = []
        arrayOT.push($("#gridOT").dxDataGrid('instance').getRowIndexByKey(GridManager.OTSelected));
        $("#gridOT").dxDataGrid('instance').repaintRows(arrayOT);
        $('#gridOT').dxDataGrid('instance').clearSelection();
        $("#gridOT").dxDataGrid('instance').selectRowsByIndexes(arrayOT);  

      },
      //SG - Query inicial para obtener los datos de averias y guardarlos en una variable local 
      queryStartDataAverias: function () {
        widgObj.datosAverias = []
        var queryTaskAverias = new QueryTask(config.URLs.averiasFeature)
        var query = new Query()
        query.where = config.dataAveria.BORRADA + " is null OR " + config.dataAveria.BORRADA + " <> 'SI'";
        query.returnDistinctValues = false
        query.outFields = ["*"]
        query.returnGeometry = true
        query.orderByFields = ["FECHA_INICIO DESC", "OBJECTID DESC"];
        queryTaskAverias.execute(query, function (feature) {          
          widgObj.datosAverias = []
          widgObj.datosAveriasWithGeo = []
          for (var i = 0; i < feature.features.length; i++) {
            widgObj.datosAverias.push(feature.features[i].attributes)
            widgObj.datosAveriasWithGeo.push(feature.features[i])
          }
          widgObj.queryStartDataOT()          
        }, function (error) {
          console.log(error)
        })
      },
      //SG - Query inicial para obtener los datos de ordenes de trabajo y guardarlos en una variable local 
      queryStartDataOT: function () {
        widgObj.datosOT = []
        var queryTaskAverias = new QueryTask(config.URLs.ordenesFeature)
        var query = new Query()
        query.where = "1=1"
        query.returnDistinctValues = false
        query.outFields = ["*"]
        query.returnGeometry = false
        queryTaskAverias.execute(query, function (feature) {
          widgObj.datosOT = []
          for (var i = 0; i < feature.features.length; i++) {
            widgObj.datosOT.push(feature.features[i].attributes)
          }
          $("#cFilterOT").removeAttr("disabled");
          GridManager.loadDataGrids(widgObj.datosAverias, widgObj.datosOT)          
        }, function (error) {
          console.log(error)
        })
      },

      queryStartDomainsAverias: function (){    
        var queryTaskDomains = new QueryTask(config.URLs.domainsValuesURL);
        var query = new Query()
        query.where = "1=1"
        query.outFields = ["*"]
        queryTaskDomains.execute(query, function (feature) {     
          datosDomainsAverias = feature;          
        }, function(error){          
          console.log('No se pudo realizar la query a la URL dispuesta en el archivo config.URLs.domainsValuesURL. ' + error)
        })
      },

      getIdOfAveriaDeDuctosLayer: function (){    
        for (var k in GridManager.MainWidget.map._layers) {          
          if (GridManager.MainWidget.map._layers[k].url == config.URLs.averiasFeature){  
            idOfAveriaDeDuctosLayer = GridManager.MainWidget.map._layers[k].id;
            break;
          }
        } 
      },

      onClose: function () {
        //Limpio la seleccion de ambas grillas
        $('#gridAverias').dxDataGrid('instance').clearSelection();
        $('#gridOT').dxDataGrid('instance').clearSelection();
        //Se vuelve la grilla a su tamaño original
        if ($("#cOcultarOTs").attr('name') == "Close"){
          document.getElementById('cOcultarOTs').click(); 
        }        
      },

      onOpen: function () {        
        
      },
      destroy: function () {
        if (this.profileChart) {
          //this.profileChart.destroy();
        }
        this.inherited(arguments);
      }
    });
  });