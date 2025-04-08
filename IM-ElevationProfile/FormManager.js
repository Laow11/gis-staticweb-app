define([
    "dijit/form/Button",
    "dijit/form/Select",
    'dojo/_base/lang',
    'dojo/aspect',
    "dojo/on",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/dom-construct",
    'dojo/topic',
    "dojox/widget/Toaster",
    "esri/geometry/Point",
    'jimu/dijit/Message',
    "dojo/domReady!"
], function (Button, Select, lang, aspect, on, dom, domStyle, domConstruct, topic, Toaster, Point, Message) {

    var mo = {};
    mo.MainWidget = {};

    // VARIABLES
    mo.mDrawPolylineButton = null;
    mo.mDrawPolylineButtonTooltip = null;
    mo.activatedDrawPolylineTool = false;
    mo.mDrawFreeHandPolylineButton = null;
    mo.mDrawFreeHandPolylineButtonTooltip = null;
    mo.activatedDrawFreeHandPolylineTool = false;
    mo.mMeasureTypeSelected = "";
    mo.mSelectBoxMeasureType = null;
    mo.mResolutionSelected = "";
    mo.mSelectBoxResolution = null;
    mo.mStepTypeSelected = "";
    mo.mSelectBoxStepType = null;
    mo.mStepValue = null;
    mo.mSwitchUseStepWithDraw = null;
    mo.mSwitchUseStepWithSelect = null;
    mo.mSwitchUseStepsValue = false;
    mo.mSwitchUseStepWithDrawValue = false;
    mo.mSwitchUseStepWithSelectValue = false;
    mo.lastRecievedSelection = null;
    mo.isFormOpened = false;
    mo.isDraw = true;
    mo.lastStep = null;
    mo.isClicked = false;
    mo.isDblClicked = false;
    mo.isSelection = false;
    mo.currentTool = null;
    // CONSTANTES


    // FUNCIONES
    mo.startUp = function () {

        // GGO - 0908 - Handlers para administrar cuando se ve/oculta el infowindow
        on(mo.MainWidget.map.infoWindow, 'show', function () {
            mo.validateEnablingOfUseSelectionButton();
        });

        aspect.after(mo.MainWidget.map.infoWindow, 'onSelectionChange', function () {
            mo.validateEnablingOfUseSelectionButton();
        });

        on(mo.MainWidget.map.infoWindow, 'hide', function () {
            mo.validateEnablingOfUseSelectionButton();
        });

        // Preparamos el formulario
        mo.prepareForm();

        //polyfills
        if (Number.parseInt === undefined)
            Number.parseInt = window.parseInt;

        if (Number.isNaN === undefined)
            Number.isNaN = window.isNaN;

        // GGO - 2108
        mo.isFormOpened = true;

        // GGO - 2108 - Importante listener
        topic.subscribe("activated_maptool_from_movsuelos", mo.safeDeactivateDrawPolylineTool);
    };

    mo.reOpened = function () {
        mo.setFocusStepInput();
        mo.isFormOpened = true;
    };

    mo.closeUp = function () {
        // GGO - 2108 - Fix
        mo.isFormOpened = true;

        // Desactivamos las herramientas de dibujo
        mo.deactivateDrawTools();

        // GGO - 0808 - Reestablecemos el input
        mo.restartInputStep();

        // Limpieza de variables
        //mo.clearVariables();

        // GGO - 0908 - Chequeo de botón de seleccción
        mo.validateEnablingOfUseSelectionButton();

        // GGO - 0608 - Limpieza de info
        $("#iElevationProfile_spanSegmentLength").text("0.00 [m]");
        $("#iElevationProfile_spanLineLength").text("0.00 [m]");
        $("#iElevationProfile_spanSamplesLength").text("0");
        mo.lastRecievedSelection = null;

        // GGO - 2108 - Sacamos el recuadro Rojo el input de step
        var mConfigNumberBox = mo.MainWidget.config.form.dxNumberBoxStepValue;
        $("#" + mConfigNumberBox.divId).removeClass("red-input-box");

        // GGO - 2108
        topic.publish("activated_maptool_from_perfil", false);
    };

    // Función de desactivación de herramientas
    mo.deactivateDrawTools = function () {
        mo.deactivateDrawPolylineTool();
        //mo.deactivateDrawFreeHandPolylineTool(); // GGO - 0608 - Ya no se utiliza
    };

    // Función de limpieza de variables
    mo.clearVariables = function () {
        //mo.mDrawPolylineButton = null;
        //mo.mDrawPolylineButtonTooltip = null;
        mo.activatedDrawPolylineTool = false;
        //mo.mDrawFreeHandPolylineButton = null;
        //mo.mDrawFreeHandPolylineButtonTooltip = null;
        mo.activatedDrawFreeHandPolylineTool = false;
        mo.mMeasureTypeSelected = "";
        mo.mSelectBoxMeasureType = null;
        mo.mStepTypeSelected = "";
        mo.mSelectBoxStepType = null;
        mo.mStepValue = null;
        mo.mSwitchUseStepWithDraw = null;
        mo.mSwitchUseStepWithSelect = null;
        mo.mSwitchUseStepsValue = false;
        mo.mSwitchUseStepWithDrawValue = false;
        mo.mSwitchUseStepWithSelectValue = false;
    };

    /**
     * Este metodo se encarga de preparar el formulario con todos los controles
     * de Dojo
     */
    mo.prepareForm = function () {

        // Agregamos boton de confirmación
        mo.addConfirmButton();

        // Agregamos boton de herramienta de dibujo Polyline
        mo.addPolylineButton();

        // Agregamos boton de herramienta de dibujo Polyline
        mo.addUseSelectionButton();

        // Agregamos input de herramienta de dibujo FreeHandPolyline
        //mo.addFreeHandPolylineButton();

        // Agregamos Select Box de Formato
        mo.addMeasureTypeSelectBox();

        // Agregamos Select Box de DEM Resolution
        mo.addResolutionSelectBox();

        // Agregamos Switch general para usar división x pasos
        mo.addUseStepsSwitch();

        // Agregamos Switch para usar división x pasos x dibujo
        //mo.addUseStepWithDrawSwitch();

        // Agregamos Switch para usar división x pasos x selección
        //mo.addUseStepWithSelectSwitch();

        // Agregamos Input de Pasos
        mo.addStepValueInput();

        // Agregamos Select Box de tipo de Pasos
        //mo.addStepTypeSelectBox();
        mo.mStepTypeSelected = mo.MainWidget.config.form.dxSelectBoxStepType.value;

        // Agrego Dojox Toaster containerNode: $("#iElevationProfile_Row3")[0],
        mo.mErrorToaster = new Toaster({

            messageTopic: '/app/iElevationProfile/error',
            positionDirection: 'bl-up',
            duration: 3000
        }, $("#toasterError")[0]);

        //mo.mErrorToaster.placeAt($("#iElevationProfile_Row4")[0]);
        //$("#_iElevationProfileWidget").parent()[0]
    };


    /* BUTTON : CONFIRM */
    // Función para agregar botón de confirmación
    mo.addConfirmButton = function () {
        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxConfirmButton;
        $("#" + mConfig.divId).dxButton({
            icon: mConfig.icon,
            text: mo.MainWidget.nls.form.dxConfirmButton.text,
            hint: mo.MainWidget.nls.form.dxConfirmButton.hintDeactive,
            type: mConfig.type,
            width: mConfig.width,
            height: mConfig.height,
            disabled: mConfig.disabled,
            onClick: function () {
                mo.MainWidget.LogicManagerLc.processSavedDrawEndEvent();
            }
        });
    };

    // Función para activar el botón de confirmación
    mo.activateConfirmButton = function () {
        //Obtenemos la configuración indicada
        mo.MainWidget.LogicManagerLc.processSavedDrawEndEvent();
    };

    // Función para desactivar el botón de confirmación
    mo.deactivateConfirmButton = function () {
        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxConfirmButton;

        var mConfirmButton = $('#' + mConfig.divId).dxButton('instance');

        mConfirmButton.option("disabled", true);
        mConfirmButton.option("hint", mo.MainWidget.nls.form.dxConfirmButton.hintDeactive);

    };

    /**
     * Método principal para poder validar si el botón de confirmación 
     * debe habilitarse o no
     */
    mo.validateEnablingOfConfirmButton = function () {
        var mValidateStep = false;
        var mValidateGeometry = false;
        var mValidateStepLimit = false;
        // 1° Validación de paso.
        //Obtenemos la configuración indicada
        var mConfigNumberBox = mo.MainWidget.config.form.dxNumberBoxStepValue;
        var mDxNumberBox = $("#" + mConfigNumberBox.divId).dxNumberBox("instance");
        mo.mStepValue = mDxNumberBox.option("value");

        if (Number.isNaN(Number.parseInt(mo.mStepValue))) {
            mValidateStep = false;
        } else {
            mValidateStep = true;
        }
        // 2° Validación de gráfico.
        if (mo.MainWidget.LogicManagerLc.lastDrawEndProcessed)
            mValidateGeometry = true;
        else
            mValidateGeometry = false;
        // 3° Validacion de vértices
        var mIsVertexAmountValid = mo.MainWidget.LogicManagerLc.isVertexAmountValid();
        // Validación general y ejecución
        if (mValidateStep && mValidateGeometry && mIsVertexAmountValid) {
            if (mo.currentTool == "Selection") {

                if (mo.lastStep !== mo.mStepValue) {
                    mo.activateConfirmButton();
                } else {
                    mo.MainWidget.resizeBig()
                }
            } else {

                mo.activateConfirmButton();
                // mo.lastStep = mo.mStepValue
                mo.MainWidget.currentTab = "Resultados"
            }
        } else {
            mo.deactivateConfirmButton()
            mo.MainWidget.currentTab = "Datos"
            if ($("label[label='Datos de Entrada']").prevObject[0].activeElement.childNodes[1].children[0].children[0]) {
                $("label[label='Datos de Entrada']").prevObject[0].activeElement.childNodes[1].children[0].children[0].click()
                var mMessage = "";
                mMessage = lang.clone(mo.MainWidget.config.errors.error_no_line_drawn)
                mo.MainWidget.FormManagerLc.launchToastError(mMessage, 2000);
            }
        }
    };

    /* BUTTON : POLYLINE */
    // Función para agregar botón de Polilínea
    mo.addPolylineButton = function () {
        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxDrawPolyline;

        // Inicialización DOJO
        /*mo.mDrawPolylineButton = new Button({
             label: mo.MainWidget.nls.form.dxDrawPolyline.text,
             showLabel: false,
             iconClass: mConfig.icon,
             onClick: function () {
                 // GGO - 0608 - Activación del Measurement (que es el paso previo ahora)
                 
                 if (!mo.activatedDrawPolylineTool) {
                     mo.activateDrawPolylineTool();
                     mo.MainWidget.measureTool.setTool("distance", true);
                 } else {
                     mo.MainWidget.measureTool.setTool("distance", false);
                     mo.deactivateDrawPolylineTool();
                 }
             
                 if (mo.activatedDrawFreeHandPolylineTool) {
                     mo.deactivateDrawFreeHandPolylineTool();
                 }
 
                 if (!mo.activatedDrawPolylineTool) {
                     mo.activateDrawPolylineTool();
                 } else {
                     mo.deactivateDrawPolylineTool();
                 }
             }
         }, mConfig.divId);
         mo.mDrawPolylineButton.startup();
         domStyle.set(mConfig.divId, "width", mConfig.width);
         domStyle.set(mConfig.divId, "height", mConfig.height);*/


        /*
        mo.mDrawPolylineButtonTooltip = new Tooltip({
            connectId: [mConfig.divId],
            label: mo.MainWidget.nls.form.dxDrawPolyline.hint
        });
        */
        // Inicialización DX
        $("#" + mConfig.divId).dxButton({
            icon: mConfig.icon,
            text: mo.MainWidget.nls.form.dxDrawPolyline.text,
            hint: mo.MainWidget.nls.form.dxDrawPolyline.hint,
            type: mConfig.type,
            width: mConfig.width,
            height: mConfig.height,
            onClick: function () {
                mo.isSelection = false
                // GGO - 0608 - Activación del Measurement (que es el paso previo ahora)
                if (!mo.activatedDrawPolylineTool) {
                    console.log("IM - Iniciando tool de PERFIL - Directo");
                    mo.activateDrawPolylineTool();
                } else {
                    console.log("IM - Terminando tool de PERFIL - Directo");
                    mo.deactivateDrawPolylineTool();
                }
                mo.setFocusStepInput();
            }
        });

    };


    mo.safeDeactivateDrawPolylineTool = function (pEvent) {
        console.log("Valor del topic 'activated_maptool_from_movsuelos': " + pEvent);
        if (mo.isFormOpened && pEvent) {
            console.log("IM - Terminando tool de PERFIL - Indirecto");
            mo.MainWidget.map.setMapCursor("default");
            mo.MainWidget.measureTool.setTool("distance", false);
            mo.deactivateDrawPolylineTool();
        }
    };

    // Método para activar la herramienta de dibujo: Polilínea
    mo.activateDrawPolylineTool = function () {
        //GGO - 0608 - Comentamos esto puesto que usamos la barra del dijit Measurement
        //mo.MainWidget.map.setInfoWindowOnClick(false);
        var tip = "Haz click para empezar a dibujar la polilínea"
        var tip2 = "Para terminar, haz doble click"
        var tooltip = dojo.create("div", {
            "class": "tooltip",
            "innerHTML": tip
        }, mo.MainWidget.map.container)
        var tooltip2 = dojo.create("div", {
            "class": "tooltip2",
            "innerHTML": tip2
        }, mo.MainWidget.map.container)
        dojo.style(tooltip, "position", "fixed")
        dojo.style(tooltip, "width", "90px")
        dojo.style(tooltip, "height", "90px")
        dojo.style(tooltip, "background-color", "white")
        dojo.style(tooltip, "border", "1px solid #485566")
        dojo.style(tooltip, "border-radius", "5px")
        dojo.style(tooltip, "padding", "10px 15px")
        dojo.style(tooltip2, "position", "fixed")
        dojo.style(tooltip2, "width", "90px")
        dojo.style(tooltip2, "height", "80px")
        dojo.style(tooltip2, "background-color", "white")
        dojo.style(tooltip2, "border", "1px solid #485566")
        dojo.style(tooltip2, "border-radius", "5px")
        dojo.style(tooltip2, "padding", "10px 15px")
        //$("#map_container").css('cursor', 'default')
        //Obtenemos la configuración necesaria
        var mConfig = mo.MainWidget.config.form;
        // Activo "visualmente" la herramienta
        // Código: DX
        $("#" + mConfig.dxDrawPolyline.divId).dxButton('instance').option("icon", mConfig.dxDrawPolyline.iconActive);
        $("#" + mConfig.dxDrawPolyline.divId).dxButton('instance').option("hint", mo.MainWidget.nls.form.dxDrawPolyline.hintActive);
        $("#" + mConfig.dxDrawPolyline.divId).addClass("im-button-active");

        // Código DOJO
        //mo.mDrawPolylineButton.set("iconClass", mConfig.dxDrawPolyline.iconActive);

        // Activo la herramienta para escuchar clicks
        //GGO - 0608 - Comentamos esto puesto que usamos la barra del dijit Measurement
        //mo.MainWidget.LogicManagerLc.enableDrawPolylineTool();

        // Activo el flag: 
        mo.activatedDrawPolylineTool = true;
        // Activo estados y cursores
        topic.publish("activated_maptool_from_perfil", true);
        mo.MainWidget.map.setMapCursor("default");
        mo.MainWidget.measureTool.setTool("distance", true);
        mo.isClicked = false
        mo.isDblClicked = false
        mo.MainWidget.map.on("mouse-move", function (evt) {
            if ($("#" + mConfig.dxDrawPolyline.divId).hasClass("im-button-active") && !mo.isDblClicked) {
                var px = evt.screenPoint.x
                var py = evt.screenPoint.y
                if (!mo.isClicked) {
                    $(".tooltip2").hide()
                    dojo.style(tooltip, {
                        left: (px + 20) + "px",
                        top: (py - 50) + "px"
                    });
                    $(".tooltip").show()
                } else {
                    $(".tooltip").hide()
                    dojo.style(tooltip2, {
                        left: (px + 20) + "px",
                        top: (py - 50) + "px"
                    });
                    $(".tooltip2").show()
                }
                mo.MainWidget.map.on("click", function (evt) {
                    mo.isClicked = true
                    $(".tooltip").hide()
                    dojo.style(tooltip2, {
                        left: (px + 20) + "px",
                        top: (py - 50) + "px"
                    });
                    $(".tooltip2").show()
                })
                mo.MainWidget.map.on("dbl-click", function (evt) {
                    mo.isDblClicked = true
                    $(".tooltip").hide()
                    $(".tooltip2").hide()
                })
            }
        })

        // Activo intervalo
        mo.startIntervalCheckMapInfoWindow();
    };

    // Método para desactivar la herramienta de dibujo: Polilínea
    mo.deactivateDrawPolylineTool = function () {

        //Obtenemos la configuración necesaria
        var mConfig = mo.MainWidget.config.form;

        // Desactivo "visualmente" la herramienta
        // Código DX
        $("#" + mConfig.dxDrawPolyline.divId).dxButton('instance').option("icon", mConfig.dxDrawPolyline.icon);
        $("#" + mConfig.dxDrawPolyline.divId).dxButton('instance').option("hint", mo.MainWidget.nls.form.dxDrawPolyline.hint);
        $("#" + mConfig.dxDrawPolyline.divId).removeClass("im-button-active");
        $(".tooltip").remove()
        $(".tooltip2").remove()
        // Código DOJO
        //mo.mDrawPolylineButton.set("iconClass", mConfig.dxDrawPolyline.icon);

        // Desactivo el flag: 
        mo.activatedDrawPolylineTool = false;

        //GGO - 0608 - Comentamos esto puesto que usamos la barra del dijit Measurement
        //mo.MainWidget.LogicManagerLc.unsetDrawToolbar();

        // Activo estados y cursores
        topic.publish("activated_maptool_from_perfil", false);
        mo.MainWidget.map.setMapCursor("default");
        mo.MainWidget.measureTool.setTool("distance", false);
        mo.MainWidget.map.setInfoWindowOnClick(true);

        // Detengo intervalo
        mo.stopIntervalCheckMapInfoWindow();
    };



    /* BUTTON : FREE HAND POLYLINE */
    // Método para agregar botón de Polilínea libre
    mo.addFreeHandPolylineButton = function () {
        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxDrawFreeHandPolyline;

        // Inicialización Dojo
        mo.mDrawFreeHandPolylineButton = new Button({
            label: mo.MainWidget.nls.form.dxDrawFreePolyline.text,
            showLabel: false,
            iconClass: mConfig.icon,
            onClick: function () {
                mo.currentTool = "Draw"
                if (mo.activatedDrawPolylineTool) {
                    mo.deactivateDrawPolylineTool();
                }

                if (!mo.activatedDrawFreeHandPolylineTool) {
                    mo.activateDrawFreeHandPolylineTool();
                } else {
                    mo.deactivateDrawFreeHandPolylineTool();
                }

            }
        }, mConfig.divId);
        mo.mDrawFreeHandPolylineButton.startup();
        domStyle.set(mConfig.divId, "width", mConfig.width);
        domStyle.set(mConfig.divId, "height", mConfig.height);


        /*
        mo.mDrawFreeHandPolylineButtonTooltip = new Tooltip({
            connectId: [mConfig.divId],
            label: mo.MainWidget.nls.form.dxDrawFreeHandPolyline.hint
        });
        */
        // Inicialización DX
        /*
         $("#" + mConfig.divId).dxButton({
             icon: mConfig.icon,
             text: mo.MainWidget.nls.form.dxDrawFreeHandPolyline.text,
             hint: mo.MainWidget.nls.form.dxDrawFreeHandPolyline.hint,
             type: mConfig.type,
             width: mConfig.width,
             height: mConfig.height,
             onClick: function () {
                 //mo.MainWidget.LogicManagerLc.secureEndDragPoint();
 
                 if (!mo.activatedDrawFreeHandPolylineTool) {
                     mo.activateDrawFreeHandPolylineTool();
                 } else {
                     mo.deactivateDrawFreeHandPolylineTool();
                 }
             }
         });
         */
    };

    // Método para activar la herramienta de dibujo: Polilínea libre
    mo.activateDrawFreeHandPolylineTool = function () {
        mo.MainWidget.map.setInfoWindowOnClick(false);

        //$("#map_container").css('cursor', 'default')
        //Obtenemos la configuración necesaria
        var mConfig = mo.MainWidget.config.form;

        // Activo "visualmente" la herramienta
        // Código: DX
        /*  
            $("#" + mConfig.dxDrawFreeHandPolyline.divId).dxButton('instance').option("icon", mConfig.dxDrawFreeHandPolyline.iconActive);
            $("#" + mConfig.dxDrawFreeHandPolyline.divId).dxButton('instance').option("hint", mo.MainWidget.nls.form.dxDrawFreeHandPolyline.hintActive);
        */
        // Código DOJO
        mo.mDrawFreeHandPolylineButton.set("iconClass", mConfig.dxDrawFreeHandPolyline.iconActive);

        // Activo la herramienta de dibujo
        mo.MainWidget.LogicManagerLc.enableDrawFreeHandPolylineTool();

        // Activo el flag: 
        mo.activatedDrawFreeHandPolylineTool = true;

    };

    // Método para desactivar la herramienta de dibujo: Polilínea libre
    mo.deactivateDrawFreeHandPolylineTool = function () {
        //Obtenemos la configuración necesaria
        var mConfig = mo.MainWidget.config.form;

        // Desactivo "visualmente" la herramienta
        // Código DX
        /*
        $("#" + mConfig.dxDrawFreeHandPolyline.divId).dxButton('instance').option("icon", mConfig.dxDrawFreeHandPolyline.icon);
        $("#" + mConfig.dxDrawFreeHandPolyline.divId).dxButton('instance').option("hint", mo.MainWidget.nls.form.dxDrawFreeHandPolyline.hint);
        */
        // Código Dojo
        mo.mDrawFreeHandPolylineButton.set("iconClass", mConfig.dxDrawFreeHandPolyline.icon);

        // Desactivo el flag: 
        mo.activatedDrawFreeHandPolylineTool = false;

        mo.MainWidget.LogicManagerLc.unsetDrawToolbar();
    };


    /* BUTTON : USE SELECTION */
    // Función para agregar botón de Polilínea
    mo.addUseSelectionButton = function () {
        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxProfileSelection;

        // Inicialización DOJO
        /*mo.mUseSelectionButton = new Button({
             label: mo.MainWidget.nls.form.dxProfileSelection.text,
             showLabel: false,
             iconClass: mConfig.icon,
             onClick: function () {
                 //if (mo.MainWidget.map && mo.MainWidget.map.infoWindow)
                 //    console.log(mo.MainWidget.map.infoWindow.features);
 
                 // Código DOJO
                 // mo.mUseSelectionButton.set("iconClass", mConfig.dxDrawPolyline.icon);
 
                 if (mo.MainWidget.map.infoWindow.features &&
                     mo.MainWidget.map.infoWindow.isShowing &&
                     mo.MainWidget.map.infoWindow._highlighted &&
                     mo.MainWidget.map.infoWindow._highlighted.geometry.type === "polyline") {
 
                     var mGeometry = mo.MainWidget.map.infoWindow._highlighted.geometry;
 
                     mo.MainWidget.LogicManagerLc.processDirectGeometryForElevationProfile(mGeometry);
                     
                 } else {
                     if (!mo.MainWidget.map.infoWindow.features) {
                         mo.launchToastError(mo.MainWidget.nls.errors.error_no_selection);
                     } else if (mo.MainWidget.map.infoWindow._highlighted.geometry.type !== "polyline") {
                         mo.launchToastError(mo.MainWidget.nls.errors.error_feature_not_polyline);
                     }
                     
                 }
             }
         }, mConfig.divId);
         mo.mUseSelectionButton.startup();
         domStyle.set(mConfig.divId, "width", mConfig.width);
         domStyle.set(mConfig.divId, "height", mConfig.height);
         */
        mo.mUseSelectionButton = $("#" + mConfig.divId).dxButton({
            icon: mConfig.icon,
            text: mo.MainWidget.nls.form.dxProfileSelection.text,
            hint: mo.MainWidget.nls.form.dxProfileSelection.hintDeactive,
            type: mConfig.type,
            width: mConfig.width,
            height: mConfig.height,
            disabled: true,
            onClick: function () {
                // Desactivo herramienta de polilínea
                //RRS; siempre que sea seleccion desactiv el draw
                mo.MainWidget.FormManagerLc.isDraw = false
                mo.currentTool = "Selection"
                mo.deactivateDrawPolylineTool();
                mo.MainWidget.LogicManagerLc.erasePreviousData();
                mo.lastRecievedSelection = null; // GGO - 0808 - Limpiamos el "evento" selección

                mo.isSelection = true
                mo.lastStep = 0
                if (mo.MainWidget.map.infoWindow.features &&
                    mo.MainWidget.map.infoWindow.isShowing &&
                    mo.MainWidget.map.infoWindow._highlighted &&
                    mo.MainWidget.map.infoWindow._highlighted.geometry.type === "polyline") {

                    var mGeometry = mo.MainWidget.map.infoWindow._highlighted.geometry;

                    // GGO - 0808 - Guardamos el "evento" de selección
                    mo.lastRecievedSelection = mGeometry;
                    // GGO - 0608 - No proceso directamente.
                    mo.MainWidget.LogicManagerLc.processGraphicProfile(mGeometry);
                } else {


                    if (!mo.MainWidget.map.infoWindow.features ||
                        !mo.MainWidget.map.infoWindow.isShowing) {
                        mo.launchToastError(mo.MainWidget.nls.errors.error_no_selection);

                    } else if (mo.MainWidget.map.infoWindow._highlighted.geometry.type !== "polyline") {
                        // GGO - 0608 - Ante error en selección: Desactivo botón
                        mo.launchToastError(mo.MainWidget.nls.errors.error_feature_not_polyline);
                    }
                    // GGO - 0608 - Ante error en selección: Chequeo a ver si sigue válido el botón de confirmación
                    mo.MainWidget.LogicManagerLc.processGraphicProfile(mGeometry);
                    mo.validateEnablingOfConfirmButton();
                }
            }
        });
    };

    // Función para activar el botón de confirmación
    mo.activateUseSelectionButton = function () {
        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxProfileSelection;

        var mUseSelectionButton = $('#' + mConfig.divId).dxButton('instance');

        mUseSelectionButton.option("disabled", false);
        mUseSelectionButton.option("hint", mo.MainWidget.nls.form.dxProfileSelection.hintActive);
    };

    // Función para desactivar el botón de confirmación
    mo.deactivateUseSelectionButton = function () {
        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxProfileSelection;

        var mUseSelectionButton = $('#' + mConfig.divId).dxButton('instance');

        mUseSelectionButton.option("disabled", true);
        mUseSelectionButton.option("hint", mo.MainWidget.nls.form.dxProfileSelection.hintDeactive);

    };

    /**
     * Método principal para poder validar si el botón de confirmación 
     * debe habilitarse o no
     */
    mo.validateEnablingOfUseSelectionButton = function () {
        //mo.MainWidget.map.infoWindow.features &&
        if (
            mo.MainWidget.map.infoWindow.isShowing &&
            mo.MainWidget.map.infoWindow._highlighted &&
            mo.MainWidget.map.infoWindow._highlighted.geometry.type === "polyline") {

            mo.activateUseSelectionButton();
        } else {

            //!mo.MainWidget.map.infoWindow.features ||
            if (
                !mo.MainWidget.map.infoWindow.isShowing) {
                mo.deactivateUseSelectionButton();

            } else if (mo.MainWidget.map.infoWindow._highlighted.geometry.type !== "polyline") {
                // GGO - 0908 - Ante error en selección: Desactivo botón
                mo.deactivateUseSelectionButton();
            }

        }
    };

    /* SELECT : UNIDAD DE MEDIDA */
    // Método para agregar  Select Box de Tipo de Medida
    mo.addMeasureTypeSelectBox = function () {

        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxSelectBoxMeasureType;

        mo.mSelectBoxMeasureType = new Select({
            name: mConfig.divId,
            style: "width: 100%;",
            options: mo.MainWidget.nls.form.dxSelectBoxMeasureType.dataSource
        }, mConfig.divId);
        mo.mSelectBoxMeasureType.startup();
        /*
        $("#" + mConfig.divId).dxSelectBox({
            dataSource: mo.MainWidget.nls.form.dxSelectBoxMeasureType.dataSource,
            displayExpr: mConfig.displayExpr,
            valueExpr: mConfig.valueExpr,
            value: mConfig.value,
            onValueChanged: mo.onValueChangedMeasureTypeSelectBox
        });*/

        mo.mSelectBoxMeasureType.on('change', mo.onValueChangedMeasureTypeSelectBox);

        mo.mMeasureTypeSelected = mConfig.value;
    };

    // Handler de cambio de valor de Select
    mo.onValueChangedMeasureTypeSelectBox = function (pEvent) {
        //console.log(pEvent);
        // Almacenamos valor de unidad de medida
        //   Caso select de Dojo: pEvent es el value
        mo.mMeasureTypeSelected = pEvent;
        // Invocamos a la lógica para actualizar (tal vez) el gráfico.
        // GGO - 0608 - Por ahora no se necesita actualizar ante cambios de este valor
        // mo.MainWidget.LogicManagerLc.updateProfileWithMeasureType(mo.mMeasureTypeSelected);
    };


    /******************************************/

    /* SELECT : DEM RESOLUTION */
    // Método para agregar  Select Box de Tipo de Medida
    mo.addResolutionSelectBox = function () {

        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxSelectBoxResolution;

        mo.mSelectBoxResolution = new Select({
            name: mConfig.divId,
            style: "width: 100%;",
            options: mo.MainWidget.nls.form.dxSelectBoxResolution.dataSource
        }, mConfig.divId);
        mo.mSelectBoxResolution.startup();
        /*
        $("#" + mConfig.divId).dxSelectBox({
            dataSource: mo.MainWidget.nls.form.dxSelectBoxResolution.dataSource,
            displayExpr: mConfig.displayExpr,
            valueExpr: mConfig.valueExpr,
            value: mConfig.value,
            onValueChanged: mo.onValueChangedResolutionSelectBox
        });*/

        mo.mSelectBoxResolution.on('change', mo.onValueChangedResolutionSelectBox);

        mo.mResolutionSelected = mConfig.value;
    };

    // Handler de cambio de valor de Select
    mo.onValueChangedResolutionSelectBox = function (pEvent) {
        //console.log(pEvent);
        // Almacenamos valor de unidad de medida
        //   Caso select de Dojo: pEvent es el value
        mo.mResolutionSelected = pEvent;
        // Invocamos a la lógica para actualizar (tal vez) el gráfico.
        mo.MainWidget.LogicManagerLc.updateProfileWithResolution(mo.mResolutionSelected);
    };

    /***************************/
    /* INPUT : STEP VALUE */
    // Agregamos input X
    mo.addStepValueInput = function () {
        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxNumberBoxStepValue;

        $("#" + mConfig.divId).dxNumberBox({
            hint: mo.MainWidget.nls.form.dxNumberBoxStepValue.hint,
            placeholder: mo.MainWidget.nls.form.dxNumberBoxStepValue.placeholder,
            showClearButton: mConfig.showClearButton,
            step: 0,
            value: mConfig.initalValue,
            min: mConfig.min,
            max: mConfig.max,
            onValueChanged: mo.checkStepValueInput,
            valueChangeEvent: "change focusout"
        });
    };
    mo.setFocusStepInput = function () {
        var mConfigNumberBox = mo.MainWidget.config.form.dxNumberBoxStepValue;
        var mDxNumberBox = $("#" + mConfigNumberBox.divId).dxNumberBox("instance");
        mDxNumberBox.focus();
    };

    // Método para obtener valor del step.
    mo.getStepValue = function () {
        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxNumberBoxStepValue;

        var mDxNumberBox = $("#" + mConfig.divId).dxNumberBox("instance");

        mo.mStepValue = mDxNumberBox.option("value");

        return mo.mStepValue;
    };

    // Método para chequear si el valor es correcto y no cero.
    mo.isValidStepValue = function () {
        var mStepValue = mo.getStepValue();
        if (Number.isNaN(Number.parseInt(mStepValue))) {
            return false;
        } else {
            if (mStepValue > 0)
                return true;
            else
                return false;
        }
    };


    // Método para corregir el valor y el máximo del step según uno dado
    mo.fixInputStepValue = function (pNewValue) {
        return;

        //console.log("fixInputStepValue: " + pNewValue);
        var mConfigNumberBox = mo.MainWidget.config.form.dxNumberBoxStepValue;
        var mDxNumberBox = $("#" + mConfigNumberBox.divId).dxNumberBox("instance");
        mo.mStepValue = mDxNumberBox.option("max", pNewValue);
        mo.mStepValue = mDxNumberBox.option("value", pNewValue);
    };

    // Método para reestablecer los valores inicial/max del step
    mo.restartInputStep = function () {
        var mConfigNumberBox = mo.MainWidget.config.form.dxNumberBoxStepValue;
        var mDxNumberBox = $("#" + mConfigNumberBox.divId).dxNumberBox("instance");
        mo.mStepValue = mDxNumberBox.option("max", mConfigNumberBox.max);
        mo.mStepValue = mDxNumberBox.option("value", mConfigNumberBox.initalValue);
    };

    // Método para reestablecer el valor máximo del step
    mo.restartInputStepMaxValue = function () {
        var mConfigNumberBox = mo.MainWidget.config.form.dxNumberBoxStepValue;
        var mDxNumberBox = $("#" + mConfigNumberBox.divId).dxNumberBox("instance");
        mo.mStepValue = mDxNumberBox.option("max", mConfigNumberBox.max);
    };

    // Método para establecer el valor máximo del step según uno dado
    mo.setMaxInputStepValue = function (pNewValue) {
        console.log("setMaxInputStepValue: " + pNewValue);
        var mConfigNumberBox = mo.MainWidget.config.form.dxNumberBoxStepValue;
        var mDxNumberBox = $("#" + mConfigNumberBox.divId).dxNumberBox("instance");
        mo.mStepValue = mDxNumberBox.option("max", pNewValue);

    };

    mo.isInputValueAutomatic = false;

    // Método que se ejecuta en el onChange del Step
    mo.checkStepValueInput = function (e) {
        // GGO - Chequeo de loop 
        mo.isDraw = false
        mo.MainWidget.isNew = true

        if (mo.lastStep == mo.mStepValue) {
            mo.MainWidget.isNew = false
        }
        // else {
        //     mo.MainWidget.LogicManagerLc.isFirst = true
        // }
        if (mo.isInputValueAutomatic) {
            mo.isInputValueAutomatic = false;
            return;
        }
        // GGO - 0808 - Chequeo para evitar loop infinito.
        if (!mo.isValidStepValue())
            return;

        var mConfigNumberBox = mo.MainWidget.config.form.dxNumberBoxStepValue;
        // GGO - 0808 - Ante cada cambio del step, hacemos un update de las estadísticas.
        if (mo.lastRecievedSelection) {
            // GGO - 1608 - Chequeo previo de sobrepaso de steps
            if (mo.MainWidget.LogicManagerLc.willNewLineExceedLimit(mo.lastRecievedSelection, mo.getStepValue())) {
                // Encerramos en Rojo el input de step
                $("#" + mConfigNumberBox.divId).addClass("red-input-box");
                mo.deactivateConfirmButton();
                mo.MainWidget.LogicManagerLc.launchToastErrorVertex();
                return;
            }

            // Actualizamos usando selección
            mo.MainWidget.LogicManagerLc.processGraphicProfile(mo.lastRecievedSelection);
        } else if (mo.MainWidget.LogicManagerLc.lastRecievedDrawEvent) {

            // GGO - 1608 - Chequeo previo de sobrepaso de steps
            if (mo.MainWidget.LogicManagerLc.willNewLineExceedLimit(mo.MainWidget.LogicManagerLc.lastRecievedDrawEvent.geometry, mo.getStepValue())) {
                // Encerramos en Rojo el input de step
                $("#" + mConfigNumberBox.divId).addClass("red-input-box");
                mo.deactivateConfirmButton();
                mo.MainWidget.LogicManagerLc.launchToastErrorVertex();
                return;
            }
            // Actualizamos usando dibujo
            mo.MainWidget.LogicManagerLc.processDrawEnd(mo.MainWidget.LogicManagerLc.lastRecievedDrawEvent);
        } else {
            $("#" + mConfigNumberBox.divId).val(20)
        }
        return;



    };

    /***************************/
    /* SELECT : STEP TYPE */
    // Método para agregar  Select Box de Tipo de Medida
    mo.addStepTypeSelectBox = function () {

        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxSelectBoxStepType;

        mo.mSelectBoxStepType = new Select({
            name: mConfig.divId,
            style: "width: 100%;",
            options: mo.MainWidget.nls.form.dxSelectBoxStepType.dataSource
        }, mConfig.divId);
        mo.mSelectBoxStepType.startup();


        mo.mSelectBoxStepType.on('change', mo.onValueChangedStepTypeSelectBox);

        mo.mStepTypeSelected = mConfig.value;
    };

    // Handler de cambio de valor de Select
    mo.onValueChangedStepTypeSelectBox = function (pEvent) {
        //console.log(pEvent);
        // Almacenamos valor de unidad de medida
        //   Caso select de Dojo: pEvent es el value
        mo.mStepTypeSelected = pEvent;
        // Invocamos a la lógica para actualizar (tal vez) el gráfico.
        // TODO - Hacer método en LogicManager para actualizar según división de pasos
        //mo.MainWidget.LogicManagerLc.updateProfileWithResolution(mo.mResolutionSelected);
    };


    /**********************************/
    /* SWITCH : USE STEP IN DRAW LINE */
    // Método para agregar  Select Box de Tipo de Medida
    mo.addUseStepsSwitch = function () {

        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxSwitchUseSteps;

        mo.mSwitchUseSteps = $("#" + mConfig.divId).dxSwitch({
            name: mConfig.divId,
            hint: mo.MainWidget.nls.form.dxSwitchUseSteps.hint,
            onText: mo.MainWidget.nls.form.dxSwitchUseSteps.onText,
            offText: mo.MainWidget.nls.form.dxSwitchUseSteps.offText,
            value: mConfig.value,
            width: mConfig.width,
            onValueChanged: mo.onValueChangedUseStepsSwitch
        }, mConfig.divId);
        //mo.mSwitchUseSteps.startup();


        //mo.mSwitchUseSteps.on('change', mo.onValueChangedUseStepsSwitch);

        mo.mSwitchUseStepsValue = mConfig.value;
    };

    // Handler de cambio de valor de Switch
    mo.onValueChangedUseStepsSwitch = function (pEvent) {
        //console.log(pEvent);
        // Almacenamos valor de unidad de medida
        //   Caso select de Dojo: pEvent es el value
        mo.mSwitchUseStepsValue = pEvent.value;
        // Invocamos a la lógica para actualizar (tal vez) el gráfico.
        // TODO - Hacer método en LogicManager para actualizar según si usa division en dibujo
        //mo.MainWidget.LogicManagerLc.updateProfileWithResolution(mo.mResolutionSelected);
    };


    /**********************************/
    /**********************************/
    /* SWITCH : USE STEP IN DRAW LINE */
    // Método para agregar  Select Box de Tipo de Medida
    mo.addUseStepWithDrawSwitch = function () {

        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxSwitchUseStepWithDraw;

        mo.mSwitchUseStepWithDraw = $("#" + mConfig.divId).dxSwitch({
            name: mConfig.divId,
            hint: mo.MainWidget.nls.form.dxSwitchUseStepWithDraw.hint,
            onText: mo.MainWidget.nls.form.dxSwitchUseStepWithDraw.onText,
            offText: mo.MainWidget.nls.form.dxSwitchUseStepWithDraw.offText,
            value: mConfig.value,
            width: mConfig.width,
            onValueChanged: mo.onValueChangedUseStepWithDrawSwitch
        }, mConfig.divId);
        //mo.mSwitchUseStepWithDraw.startup();


        //mo.mSwitchUseStepWithDraw.on('change', mo.onValueChangedUseStepWithDrawSwitch);

        mo.mSwitchUseStepWithDrawValue = mConfig.value;
    };

    // Handler de cambio de valor de Switch
    mo.onValueChangedUseStepWithDrawSwitch = function (pEvent) {
        //console.log(pEvent);
        // Almacenamos valor de unidad de medida
        //   Caso select de Dojo: pEvent es el value
        mo.mSwitchUseStepWithDrawValue = pEvent.value;
        // Invocamos a la lógica para actualizar (tal vez) el gráfico.
        // TODO - Hacer método en LogicManager para actualizar según si usa division en dibujo
        //mo.MainWidget.LogicManagerLc.updateProfileWithResolution(mo.mResolutionSelected);
    };


    /**********************************/
    /**********************************/
    /* SWITCH : USE STEP IN SELECT LINE */
    // Método para agregar  Select Box de Tipo de Medida
    mo.addUseStepWithSelectSwitch = function () {

        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.form.dxSwitchUseStepWithSelect;

        mo.mSwitchUseStepWithSelect = $("#" + mConfig.divId).dxSwitch({
            name: mConfig.divId,
            hint: mo.MainWidget.nls.form.dxSwitchUseStepWithSelect.hint,
            onText: mo.MainWidget.nls.form.dxSwitchUseStepWithSelect.onText,
            offText: mo.MainWidget.nls.form.dxSwitchUseStepWithSelect.offText,
            value: mConfig.value,
            width: mConfig.width,
            onValueChanged: mo.onValueChangedUseStepWithSelectSwitch
        }, mConfig.divId);
        //mo.mSwitchUseStepWithSelect.startup();


        //mo.mSwitchUseStepWithSelect.on('change', mo.onValueChangedUseStepWithSelectSwitch);

        mo.mSwitchUseStepWithSelectValue = mConfig.value;
    };

    // Handler de cambio de valor de Switch
    mo.onValueChangedUseStepWithSelectSwitch = function (pEvent) {
        //console.log(pEvent);
        // Almacenamos valor de unidad de medida
        //   Caso select de Dojo: pEvent es el value
        mo.mSwitchUseStepWithSelectValue = pEvent.value;
        // Invocamos a la lógica para actualizar (tal vez) el gráfico.
        // TODO - Hacer método en LogicManager para actualizar según si usa division en dibujo
        //mo.MainWidget.LogicManagerLc.updateProfileWithResolution(mo.mResolutionSelected);
    };


    /**********************************/

    mo.launchToastError = function (pMessage, pDisplayTime) {
        //Obtenemos la configuración indicada
        var mConfig = mo.MainWidget.config.toastError;

        var mPositionId = $("#" + mConfig.divId).parent().parent();
        var mPosition = lang.clone(mConfig.position);
        mPosition.of = "#" + mPositionId[0].id;

        var mDisplayTime = mConfig.displayTime;
        if (pDisplayTime)
            mDisplayTime = pDisplayTime;

        $("#" + mConfig.divId).dxToast({
            width: function () {
                return mConfig.width;
            },
            position: mPosition,
            type: mConfig.type,
            displayTime: mDisplayTime,
            message: pMessage
        });
        $("#" + mConfig.divId).dxToast("show");
    };

    ///////////////////////////
    mo.mIntervalCheckMapInfoWindow = null;
    mo.startIntervalCheckMapInfoWindow = function () {
        mo.mIntervalCheckMapInfoWindow = setInterval(mo.executeIntervalCheckMapInfoWindow, 250);
    };

    mo.stopIntervalCheckMapInfoWindow = function () {
        clearInterval(mo.mIntervalCheckMapInfoWindow);
    };

    mo.executeIntervalCheckMapInfoWindow = function () {
        if (!mo.activatedDrawPolylineTool) {
            // NO ACTIVADO POLYLINE TOOL

        } else {
            // SI ACTIVADO POLYLINE TOOL
            // VITAL: Chequeo de que el mapa tenga desactivado el InfoWindow
            if (mo.MainWidget.map.isDoubleClickZoom === false) {
                // Si map.isDoubleClickZoom => InfoWindow activado => Hay que desactivarlo
                mo.MainWidget.map.setInfoWindowOnClick(false);
            }
        }
    };

    return mo;
});