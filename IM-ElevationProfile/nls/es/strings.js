/*global define*/
///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define({
    _widgetLabel: "Perfil Topográfico",
    form: {
        dxConfirmButton: {
            "hintDeactive": "Complete los Datos de Entrada para luego poder ejecutar y obtener el Perfil Topográfico",
            "hintActive": "Presione para ejecutar y obtener el Perfil Topográfico según los Datos de Entrada",
            "text": ""
        },
        dxDrawPolyline: {
            "hint": "Presione para habilitar la herramienta de dibujo lineal y cargar los datos en el formulario",
            "hintActive": "Presione para deshabilitar la herramienta de dibujo lineal y usar la última línea dibujada",
            "text": ""
        },
        dxDrawFreePolyline: {
            "hint": "Presione para comenzar a agregar marcadores al mapa usando la herramienta de dibujo de Polilínea Libre.",
            "hintActive": "Presione para parar de agregar marcadores al mapa usando la herramienta de dibujo de Polilínea Libre.",
            "text": "Polilínea Libre"
        },
        dxProfileSelection: {
            "hintDeactive": "Identifique en el mapa un elemento lineal para habilitar esta función",
            "hintActive": "Presione para cargar en los Datos de Entrada la geometría identificada.",
            "text": ""
        },
        dxSelectBoxMeasureType: {
            "dataSource": [
                { "value": "Kilometers", "measureType": "Kilometers", "label": "kilómetros [km]" },
                { "value": "Meters", "measureType": "Meters", "label": "metros [m]", selected: true }
            ]
        },
        dxSwitchUseSteps: {
            "hint": "¿Desea usar la división en 'pasos'?",
            "onText": "SI",
            "offText": "NO",
        },
        dxSwitchUseStepWithDraw: {
            "hint": "¿Desea usar la división en 'pasos' de la línea dibujada?",
            "onText": "SI",
            "offText": "NO",
        },
        dxSwitchUseStepWithSelect: {
            "hint": "¿Desea usar la división en 'pasos' de la línea seleccionada?",
            "onText": "SI",
            "offText": "NO",
        },
        dxNumberBoxStepValue: {
            "hint": "Dividir línea en ## [m]",
            "placeHolder": "10 metros",
        },
        dxSelectBoxStepType: {
            "dataSource": [
                { "value": "9036", "measureType": "9036", "label": "Kilómetros [km]" },
                { "value": "9001", "measureType": "9001", "label": "Metros [m]", selected: true }
            ]
        },
        dxSelectBoxResolution: {
            "dataSource": [
                { "resolution": "1m", "text": "1m", "value": "1m", "label": "1m" },
                { "resolution": "5m", "text": "5m", "value": "5m", "label": "5m", selected: true },
                { "resolution": "FINEST", "text": "FINEST", "value": "FINEST", "label": "FINEST" }
            ]
        },
        mTool: "Herramienta Gráfica:",
        mDEMResolution: "Resolución DEM:",
        mSubTitle: "Elija una unidad y selecciona una herramienta para dibujar",
        spanUseSteps: "¿Dividir en pasos el perfil?",
        spanUseStepWithDraw: "¿Dividir en pasos el perfil por dibujo?",
        spanUseStepWithSelect: "¿Dividir en pasos el perfil por selección?",
        mMeasureUnit: "Unidad de Medida del Perfil:",
        mStepValue: "Longitud de la división (Paso):",
        mStepType: "Unidad de Medida de la División:",
        mSegmentTitle: "Longitud del Segmento:",
        mLineTitle: "Longitud total del perfil:",
        mSamplesTitle: "N° de Muestras:"
    },
    profileElevationDijit: {
        title: ""
    },
    tooltips: {
        actionTriggersUpdate: "Si actualiza este valor, generará una actualización del perfil topográfico actual."
    },
    descriptionlabel: "Usa la herramienta de medición para dibujar una línea en el mapa de la que quieras obtener su perfil topográfico.",
    chartLabel: "Haz click o pasa el mouse sobre el gráfico del Perfil Topográfico para ver su elevación y marcar la ubicación en el mapa.",
    clear: "Limpiar",
    prepare: "Exportar gráfico de perfil a PNG",
    download: "Descarga",
    measurelabel: "Datos de Entrada",
    resultslabel: "Resultados",
    profileinfo: "Información del Perfil",
    display: {
        elevationProfileTitle: "Perfil de Topográfico",
        hoverOver: "Haz click o pasa el mouse sobre el gráfico del Perfil Topográfico para ver su elevación y marcar la ubicación en el mapa."
    },
    chart: {
        title: "",
        demResolution: "Resolución DEM",
        elevationTitleTemplate: "Elevación  {0} ",
        distanceTitleTemplate: "Longitud 2D {0} ",
        gainLossTemplate: "Longitud: {profile_length}<br> Elevación Mín: {min} {unit}<br>Elevación Máx: {max} {unit}<br>Inicio Elevación: {start} {unit}<br>Fín Elevación: {end} {unit}<br>Cambio Elevación: {gainloss} {unit}"
    },
    units_simple: {
        kilometers: "[km]",
        meters : "[m]"
    },
    grid: {
      title: "Detalle"  
    },
    errors: {
        InvalidConfiguration: "Configuración Inválida.",
        UnableToProcessResults: "No se pueden procesar los resultados.",
        error_vertex_without_steps: "La cantidad de vértices que tiene la línea dibujada excede el límite ({vertex_limit}) \n Puede: \n A. Dibujar una línea de menor longitud. \n B. Utilizar la división en pasos para establecer menos vértices.",
        error_vertex_with_steps: "La cantidad de vértices que tiene la línea dibujada, con la división (paso} definido excede el límite ({vertex_limit}) . Ajuste la longitud de la división.",
        error_vertex_selection_without_steps: "La cantidad de vértices que tiene la línea seleccionada excede el límite ({vertex_limit}) \n Puede: \n A. Dibujar una línea de menor longitud. \n B. Utilizar la división en pasos para establecer menos vértices.",
        error_vertex_selection_with_steps: "La cantidad de vértices que tiene la línea seleccionada , con la división (paso} definido excede el límite ({vertex_limit}) . Ajuste la longitud de la división.",
        error_no_selection: "No se puede usar la selección: \n  Debe identificar en el mapa un elemento lineal.",
        error_feature_not_polyline: "No se puede usar la selección: \n El feature seleccionado no es del tipo lineal."
    },
    widgetversion: 'Widget Perfil Topográfico Version Info',
    widgetverstr: 'Widget Version',
    wabversionmsg: 'Widget is designed to run in Web AppBuilder version',
    resultactions: "Exportar perfil",
    gridaction: "Mostrar/Ocultar la Grilla de Detalle",
    _featureAction_exportToCSV: "Exportar datos de perfil a CSV",
    _featureAction_exportToXLS: "Exportar datos de perfil a XLS",
    export_profileFileName : "PerfilTopografico_",
    flipProfile: "Invertir datos de Perfil Topográfico"
});