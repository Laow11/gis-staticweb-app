define([
    'dojo/_base/lang',
    'dojo/_base/array',
    "dojo/dom-style",
    "dojox/widget/Standby"

], function (lang, array, domStyle, Standby) {

    var mo = {};
    mo.MainWidget = {};
    mo.StandbyContainer = null;

    mo.startUp = function () {
        //console.log($("#_iElevationProfileWidget").parent()[0]);

        mo.StandbyContainer = new Standby({
            target: $("#mElevationProfileWidgetTabs").parent().parent().parent()[0],
            color: 'lightgray',
            image: mo.MainWidget.amdFolder + '/images/iElevationProfile_standby_green.gif'
        });
		//widgets/ElevationProfile/images/
        document.body.appendChild(mo.StandbyContainer.domNode);
        mo.StandbyContainer.startup();

        
    };


    return mo;
});