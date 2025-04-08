define([
    'dojo/_base/lang',
    'dojo/_base/array',
    "dojo/promise/all",
    "dojo/topic",
    "dojo/on"
], function (lang, array, all, topic, dojoOn) {

    var mo = {};
    mo.MainWidget = {};

    // VARIABLES
    //Variable para almacenar el Feature Set del universo.
    mo.featureSet = {};

    //Variable para almacenar el Feature Set del universo de forma simplificada (Solo attrs).
    mo.simpleFeatureSet = {};

    //Variable para almacenar el elemento primario seleccionado
    mo.mainDataGridRowSelected = {};

    mo.firstTimeOpenFxecuted = false;
    mo.isClearing = false;
    mo.recievedRefresh = false;
    mo.firstTimeHeight = 4;
    // CONSTANTES


    // FUNCIONES
    mo.startUp = function () {
        // Medida de seguridad para que el DxDataGrid ya esté listo
        $('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid({
            "noDataText": "-"
        });

        mo.openDataGrid([]);

        // Conexión con Widget.js
        topic.subscribe("display-profile", function (pElevationInfo) {
            // this will be called when the "display-profile" event is emitted
            mo.loadDataGrid(pElevationInfo);
        });
    };

    mo.closeUp = function () {
        mo.openDataGrid([]);
        mo.repaintMainDataGrid();
        //mo.firstTimeHeight = 4;
    };

    mo.clear = function () {
        mo.openDataGrid([]);
        mo.repaintMainDataGrid();
    };

    mo.restart = function () {
        if (mo.firstTimeOpenFxecuted) {
            mo.openDataGrid([]);
            mo.repaintMainDataGrid();
        }

    };

    /*
     * Funcion para asistir: getTableRowData
     */
    mo.RadianToDegree = function (pRadians) {
        return pRadians * (180.0 / Math.PI);
    };



    /*
     * Funcion principal para procesar la geometria que nos viene, el arreglo de distancias y asi formar
     * el datasource que será enviado al a grilla
     */

    mo.getTableRowData = function (pGeometryToProcess, pDistanceArray) {
        var mRowDataList = [];
        var mRowDataListProcessed = [];
        var mVertexIndex = 0;

        for (var i = 0; i < pGeometryToProcess.paths.length; i++) {
            for (var j = 0; j < pGeometryToProcess.paths[i].length; j++) {
                var mRowData = {};
                var mRowDataPrevious;
                mRowData.Vertex = 0;
                mRowData.X = 0.0;
                mRowData.Y = 0.0;
                mRowData.Z = 0.0;
                mRowData.M = 0.0;
                mRowData.L = 0.0;
                mRowData.Pend = 0.0;
                mRowData.X_distance = 0.0;

                mRowData.Vertex = mVertexIndex;
                mRowData.X = pGeometryToProcess.paths[i][j][0];//.toFixed(2);
                mRowData.Y = pGeometryToProcess.paths[i][j][1];//.toFixed(2);
                mRowData.Z = pGeometryToProcess.paths[i][j][2];//.toFixed(2);




                if (j == 0) {
                    mRowData.M = 0.0;
                    mRowData.L = 0.0;
                }

                else {
                    mRowDataPrevious = mRowDataList[j - 1];
                    var mx2 = Math.pow(mRowDataPrevious.X - mRowData.X, 2);
                    var my2 = Math.pow(mRowDataPrevious.Y - mRowData.Y, 2);
                    var mz2 = Math.pow(mRowDataPrevious.Z - mRowData.Z, 2);
                    mRowData.L = mRowDataPrevious.L + Math.sqrt(mx2 + my2 + mz2);
                    mRowData.M = mRowDataPrevious.M + Math.sqrt(mx2 + my2);
                }
                // GGO - 2108 - Dejamos calculo de forma igual - Modo : anterior
                if (j == 0)
                    mRowData.Pend = 0.0;
                else {
                    if (mRowData.Z == mRowDataPrevious.Z)

                        console.log("Pendiente = 0 en Vertex: " + mVertexIndex);

                    mRowDataPrevious = mRowDataList[j - 1];
                    var mAtan = Math.atan((mRowData.Z - mRowDataPrevious.Z) / (mRowData.M - mRowDataPrevious.M));
                    mRowData.Pend = (mo.RadianToDegree(mAtan)); //.toFixed(2)
                    if (isNaN(mRowData.Pend)) {
                        mRowData.Pend = "-"
                    }
                }
                mRowData.X_distance = pDistanceArray[j];
                mRowDataList.push(mRowData);
                mVertexIndex++;
            }

            //Procesamiento adicional PEND.
            /*
            for (var index = 0; index < mRowDataList.length; index++) {

                var mCurrentRowData = mRowDataList[index];

                // GGO - 1708 - Fix segun video.
                if ((index + 1) == pGeometryToProcess.paths[i].length) {
                    mRowDataPrevious = mRowDataList[index - 1];
                    mRowDataList[index].Pend = mRowDataPrevious.Pend; //0.0;
                }
                else {
                    var mRowDataNext = mRowDataList[index + 1];
                    var mAtan = Math.atan((mRowDataNext.Z - mCurrentRowData.Z) / (mRowDataNext.L - mCurrentRowData.L));
                    mRowDataList[index].Pend = (mo.RadianToDegree(mAtan)).toFixed(2);
                }

            }
            */
            //Procesamiento adicional.
            for (var l = 0; l < mRowDataList.length; l++) {
                var mRowDataItemProcessed = {};
                mRowDataItemProcessed = mRowDataList[l];

                //var mXFixed = mRowDataItemProcessed.X.toFixed(2);
                //mRowDataItemProcessed.X = mXFixed;

                //var mYFixed = mRowDataItemProcessed.Y.toFixed(2);
                //mRowDataItemProcessed.Y = mYFixed;

                //var mZFixed = mRowDataItemProcessed.Z.toFixed(2);
                //mRowDataItemProcessed.Z = mZFixed;

                //var mMFixed = mRowDataItemProcessed.M.toFixed(2);
                //mRowDataItemProcessed.M = mMFixed;

                //var mLFixed = mRowDataItemProcessed.L.toFixed(2);
                //mRowDataItemProcessed.L = mLFixed;

                //var mMOrigFixed = mRowDataItemProcessed.M_Orig.toFixed(2);
                //mRowDataItemProcessed.M_Orig = mMOrigFixed;

                mRowDataListProcessed.push(mRowDataItemProcessed);
            }

        }

        return mRowDataListProcessed;
    };

    /*
    * Función principal para comenzar el procesamiento de los datos del perfíl en la grilla
    */

    mo.loadDataGrid = function (pDataNotFormatted) {

        // TODO - Procesar para obtener el arreglo: L,Pendiente, DEM
        //console.log("pDataNotFormatted");
        //console.log(pDataNotFormatted);
        var mData = mo.getTableRowData(pDataNotFormatted.geometry, mo.MainWidget._convertDistancesArray(pDataNotFormatted.distances));
        //console.log("mData");
        //console.log(mData);
        mo.firstTimeOpenFxecuted = true;
        mo.openDataGrid(mData);
    };

    // Función para abrir el DataGrid
    mo.openDataGrid = function (pData) {

        /* CONFIGURACIÓN DATA-GRID */
        //INFO - Cargamos en una variable la instancia del DataGrid
        var dataGrid = $('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid('instance');


        //INFO - Esta configuración existe para el caso "TODAS" (o MULTIPLE)
        //Creamos el objeto de configuración del DataGrid
        var mConfiguration = lang.clone(mo.MainWidget.config.mainDataGrid);

        //INFO - Asignación de datos

        mConfiguration.dataSource = {
            store: pData
        };

        // Función para configuración de Height
        mConfiguration.height = function () {
            var mh1 = $("#results_label").height();
            var mh2 = $("#results_menu").height();
            var mh3 = $("#results_chart").height();
            var mh4 = 0;//$("#results_progressbar").height();

            if (mo.firstTimeHeight > 0) {
                mo.firstTimeHeight--;
                //console.log((this.parentElement.parentElement.parentElement.clientHeight / 2) - 100);
                return (this.parentElement.parentElement.parentElement.clientHeight / 2) - 100;
            } else if (this.parentElement &&
                this.parentElement.parentElement &&
                this.parentElement.parentElement.parentElement) {
                //console.log(this.parentElement.parentElement.parentElement.clientHeight - mh1 - mh2 - mh3 - mh4 - 10);
                return this.parentElement.parentElement.parentElement.clientHeight - 30 - mh2 - mh3 - mh4;
            }
            else
                return 300;
        };

        mConfiguration.width = function () {
            if (this.parentElement &&
                this.parentElement.parentElement &&
                this.parentElement.parentElement.parentElement) {

                //console.log(this.parentElement.parentElement.parentElement.clientWidth )
                return this.parentElement.parentElement.parentElement.clientWidth;

            }
            else
                return 400;
        };

        mConfiguration.onRowClick = function (pInfo) {
            //console.log(pInfo);
            //mo.MainWidget.profileChart.fireEvent("default", 'onmouseover', pInfo.Vertex);
            //mo.MainWidget._displayChartLocation(pInfo.data.X_distance);

        };

        mConfiguration.onRowPrepared = function (e) {
            $(e.rowElement).attr({ 'data-row-index': e.rowIndex + 1 }); // GGO - 0608 - Removido el: + 1
        };

        // INFO - Función para poder auto-scrollear en combinación con el highlight de la fila
        mConfiguration.onSelectionChanged = function (options) {
            var scrollable = options.component.getView('rowsView')._scrollable;
            var selectedRowElements = options.component.element().find('tr.dx-selection');
            scrollable.scrollToElement(selectedRowElements);
        };

        // INFO - Función para ajustar el nombre del archivo justo antes que salga
        mConfiguration.onFileSaving = function (e) {
            e.fileName = mo.exportGetFileName();
        };

        /* CONFIGURACIÓN DATA-GRID: LISTA */

        //Acá invocamos a la DataGrid
        $('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid(mConfiguration);
    };



    /**
     * Función para remarcar una ubicación (fila) en la grilla
     * Usado por el Widget.js cuando se hace hover en el gráfico.
     * pTouchObject
     *  x
     *  y
     */
    mo.selectLocation = function (pTouchObject) {
        var dataGrid = $('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid('instance');


        var mDataSource = dataGrid.getDataSource();
        var mItems = mDataSource.items();
        //console.log(mItems);
        for (var i = 0; i < mItems.length; i++) {
            if (mItems[i]["X_distance"] == pTouchObject.x) {
                //dataGrid.selectRows(i, false);
                dataGrid.selectRowsByIndexes(mItems[i]["Vertex"]);
                //mo.scrollToRow2(mItems[i]["Vertex"] );
                return;
            }

        }
        //mDataSource.filter("X_distance", "=", pTouchObject.x);
        //mDataSource.load().done(function(result) {
        //    //'result' contains the "First item" and "Second item" items
        //    console.log(result);
        //});
    };

    mo.getDataElementByTouchObject = function (pTouchObject) {
        var dataGrid = $('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid('instance');

        var mDataSource = dataGrid.getDataSource();
        var mItems = mDataSource.items();
        //console.log(mItems);
        for (var i = 0; i < mItems.length; i++) {
            if (mItems[i]["X_distance"] == pTouchObject.x) {
                return mItems[i];
            }

        }
        return null;
    };

    /*
     * Este método permite "re-pintar" la grilla. Esto significa reestablecer la UI y 
     * que se ajuste (si es que hay definida funciones o reestricciones)
     */
    mo.repaintMainDataGrid = function () {
        try {
            if ($('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid('instance')) {
                var dataGrid = $('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid('instance');
                dataGrid.repaint();
            }
        } catch (error) {

        }

    };

    mo.startLoadingPanel = function (pMessage) {
        var dataGrid = $('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid('instance');
        dataGrid.beginCustomLoading(pMessage);
    };
    mo.stopLoadingPanel = function () {
        var dataGrid = $('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid('instance');
        dataGrid.endCustomLoading();
    };

    mo.exportToXls = function () {
        var dataGrid = $('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid('instance');
        dataGrid.exportToExcel(false); //INFO: Exporta toddo
    };

    mo.exportGetFileName = function () {
        var mDate = new Date();
        var mMonth = (mDate.getMonth() + 1) < 10 ? "0" + (mDate.getMonth() + 1) : (mDate.getMonth() + 1);
        var mDateString = mDate.getDate() + "" + (mMonth) + "" + mDate.getFullYear();
        var mHourString = mDate.getHours() + "" + mDate.getMinutes() + "" + mDate.getSeconds();

        return mo.MainWidget.nls.export_profileFileName + mDateString + "_" + mHourString;
    };

    /***************************/
    /* EXPORT TO CSV */
    mo.getColumns = function () {
        var mJsonColumns = mo.MainWidget.config.mainDataGrid.columns;
        var mColumns = [];
        for (var i = 0; i < mJsonColumns.length; i++) {
            if (mJsonColumns[i].visible)
                mColumns.push(mJsonColumns[i].dataField);
        }
        console.log(mColumns)
        return mColumns;
    };

    mo.getData = function () {
        var dataGrid = $('#' + mo.MainWidget.config.mainDataGrid.divId).dxDataGrid('instance');

        var mDataSource = dataGrid.getDataSource();

        // TODO - PARSEAR ELEMENTOS EN COLUMN

        var mItems = mDataSource.items();
        //console.log(mItems)
        return mItems;
    };



    mo.getColumnsForCSV = function () {
        var mJsonColumns = mo.MainWidget.config.mainDataGrid.columns;
        var mColumns = [];
        for (var i = 0; i < mJsonColumns.length; i++) {
            if (mJsonColumns[i].visible)
                mColumns.push(mJsonColumns[i].caption);
        }
        //console.log(mColumns);
        return mColumns;
    };

    mo.getDataForCSV = function () {
        var mCsvColumns = mo.getColumnsForCSV();
        var mDataFieldColumns = mo.getColumns();
        var mData = mo.getData();

        var mCsvData = [];
        for (var i = 0; i < mData.length; i++) {
            var mCsvDataItem = {};
            for (var j = 0; j < mDataFieldColumns.length; j++) {
                if (mDataFieldColumns[j] == "Vertex")
                    mCsvDataItem[mCsvColumns[j]] = (mData[i][mDataFieldColumns[j]]);//.toFixed(0);
                else
                    mCsvDataItem[mCsvColumns[j]] = (mData[i][mDataFieldColumns[j]]);//.toFixed(2);

            }
            mCsvData.push(mCsvDataItem);
        }
        console.log(mCsvData);
        return mCsvData;
    };

    /************************/
    mo.isGridVisible = true;
    mo.switchGrid = function () {
        if (mo.isGridVisible) {
            $("#im_data_grid").css("display", "none");
            $($("#results_chart")[0]).removeClass("widget-elevation-profileChartNode-50");
            $($("#results_chart")[0]).addClass("widget-elevation-profileChartNode-90");
            mo.MainWidget._resizeChart();
            mo.isGridVisible = false;
        } else {
            $("#im_data_grid").css("display", "block");
            $($("#results_chart")[0]).removeClass("widget-elevation-profileChartNode-90");
            $($("#results_chart")[0]).addClass("widget-elevation-profileChartNode-50");
            mo.MainWidget._resizeChart();
            mo.repaintMainDataGrid();
            mo.isGridVisible = true;
        }
    };

    return mo;
});