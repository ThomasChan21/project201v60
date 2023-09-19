var lyrOSM;
var lyrWatercolor;
var lyrTopo;
var lyrImagery;
var lyrOutdoors;
var ctlSidebar;
var lyrLandSaleRecords;
var lyrRevitIB2018;
var lyrLeaseModi;
var lyrTest;
var lyrExchange;
var lyrMarkerCluster;
var arLandSaleResult = [];
var arModiResult = [];
var arExchangeResult = [];
var arIB2018Result = [];
var resultModiData = {};

$(document).ready(function () {
  // map class initialize
  var map = L.map('map').setView([22.38503, 114.14374], 12);
  map.options.minZoom = 11;
  map.options.maxZoom = 18;
  map.zoomControl.setPosition('topleft');

  // adding side bar

  ctlSidebar = L.control.sidebar('side-bar').addTo(map);

  // adding easy button
  var ctlEasybutton;
  ctlEasybutton = L.easyButton('<img src="./lib/svg/transfer-svgrepo-com.svg" style="width:14px">', function () {
    ctlSidebar.toggle();
  }).addTo(map);

  // adding osm tilelayer
  // lyrOSM = L.tileLayer.provider('OpenStreetMap.Mapnik');
  lyrTopo = L.tileLayer.provider('OpenTopoMap');
  lyrImagery = L.tileLayer.provider('Esri.WorldImagery');
  lyrOutdoors = L.tileLayer.provider('Thunderforest.Outdoors');
  lyrWatercolor = L.tileLayer.provider('Stamen.Watercolor');

  var lyrTopo_tc = L.layerGroup.hongKong('topography.tc');
  var lyrImagery_tc = L.layerGroup.hongKong('imagery.tc');

  var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  });

  lyrTopo_tc.addTo(map);

  //add map scale
  L.control.scale().addTo(map);

  //Map coordinate display
  map.on('mousemove', function (e) {
    $('.coordinate').html(`Lat: ${e.latlng.lat.toFixed(5)} Lng: ${e.latlng.lng.toFixed(5)}`);
  });

  //Addming marker in the center of map

  var icnLAMSubject = L.AwesomeMarkers.icon({
    icon: 'home',
    markerColor: 'pink',
    prefix: 'fa',
  });

  var singleMarker = L.marker([22.38503, 114.14374], {
    icon: icnLAMSubject,
    draggable: true,
  })
    .bindPopup('<p>Subject Property</p>', { closeButton: false })
    .addTo(map)
    .openPopup();

  //Leaflet layer control
  var baseMaps = {
    'Topography Chinese': lyrTopo_tc,
    'Imagery Chinese': lyrImagery_tc,
    OSM: osm,
    Imagery: lyrImagery,
    'Topo Map': lyrTopo,
    Outdoors: lyrOutdoors,
    Watercolor: lyrWatercolor,
  };

  var overlayMaps = {
    'Single Marker': singleMarker,
  };

  ctlLayers = L.control.layers(baseMaps, overlayMaps, { collapsed: true, position: 'topright' }).addTo(map);

  //Leaflet browser print function
  L.control.browserPrint({ position: 'topright' }).addTo(map);

  //Leaflet search
  L.Control.geocoder().addTo(map);

  //Leaflet measure
  L.control
    .measure({
      primaryLengthUnit: 'kilometers',
      secondaryLengthUnit: 'meter',
      primaryAreaUnit: 'sqmeters',
      secondaryAreaUnit: undefined,
    })
    .addTo(map);

  //zoom to layer
  $('.zoom-to-layer').click(function () {
    map.setView([22.38503, 114.14374], 12);
  });

  // create different icons

  L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';

  icnRedSprite = L.spriteIcon('red');
  icnVioletSprite = L.spriteIcon('violet');
  icnBlueSprite = L.spriteIcon('blue');
  /*   icnLAMPetrolStation = L.AwesomeMarkers.icon({
    icon: 'flag',
    markerColor: 'green',
    prefix: 'fa',
    spin: true
  }); */

  icnLAMPetrolStation = L.AwesomeMarkers.icon({
    icon: 'star',
    markerColor: 'cadetblue',
  });

  icnLAMOthers = L.AwesomeMarkers.icon({
    icon: 'star',
    markerColor: 'blue',
    prefix: 'fa',
  });
  icnLAMIB = L.AwesomeMarkers.icon({
    icon: 'building',
    markerColor: 'darkred',
    prefix: 'fa',
  });

  // ~~ Loading Data Session ~~

  // **************** Government Land Sale - data from API **************

  var apiLandSale = 'https://portal.csdi.gov.hk/server/services/common/landsd_rcd_1631600922343_18223/MapServer/WFSServer?' + 'service=wfs' + '&version=2.0.0' + '&request=GetFeature' + '&typename=LAO_LSR' + '&outputFormat=GeoJSON' + '&srsname=EPSG%3A4326';

  // console.log(apiLandSale);

  // Loop to get the user and disctrict list

  // console.log('land sale api encoded ' + encoded);

  var arrYearOfSaleFilter = [];
  var arrLandDistrictFilter = [];

  // Get Year of Sale and District Council
  $.getJSON(apiLandSale, function (data) {
    $.each(data.features, function (key, value) {
      if (arrYearOfSaleFilter.indexOf(value.properties.Financial_Year_of_Land_Sale_Result_Announced) == -1) {
        arrYearOfSaleFilter.push(value.properties.Financial_Year_of_Land_Sale_Result_Announced);
      }
      if (arrLandDistrictFilter.indexOf(value.properties.Relevant_District_Council) == -1) {
        arrLandDistrictFilter.push(value.properties.Relevant_District_Council);
      }
    });
    arrYearOfSaleFilter.sort();
    arrLandDistrictFilter.sort();

    $.each(arrYearOfSaleFilter, function (index, value) {
      $('#yearOfSaleFilter').append('<option value="' + value + '">' + value + '</option>');
    });
    $.each(arrLandDistrictFilter, function (index, value) {
      $('#landDistrictFilter').append('<option value="' + value + '">' + value + '</option>');
    });
  });

  lyrMarkerCluster = L.markerClusterGroup();
  lyrLandSaleRecords = L.geoJSON.ajax(apiLandSale, {
    pointToLayer: returnLandSaleMarker,
    filter: filterLandSale,
  });

  lyrLandSaleRecords.on('data:loaded', function () {
    lyrMarkerCluster.clearLayers();
    lyrMarkerCluster.addLayer(lyrLandSaleRecords);
    // lyrMarkerCluster.addTo(map);
    // map.fitBounds(lyrMarkerCluster.getBounds());
    // var arr_Layers = lyrMarkerCluster.getLayers();
    // console.log(arr_Layers[0]);
    // console.log(arr_Layers.length);
  });
  ctlLayers.addOverlay(lyrMarkerCluster, 'Land Sales Records');

  /*   $('#userFilter').change(function (e) {
    console.log(e.target.value);
    // console.log($("#userFilter").val());
  }); */

  $('#btnLandUserFilterAll').click(function () {
    $('input[name=fltLandUser]').prop('checked', true);
  });
  $('#btnLandUserFilterNone').click(function () {
    $('input[name=fltLandUser]').prop('checked', false);
  });

  $('#btnFilterLand').click(function () {
    var flagLand = 0;
    if (lyrLandSaleRecords) {
      //console.log('will remove layer - lyrLandSaleRecords ...');
      ctlLayers.removeLayer(lyrLandSaleRecords);
      lyrLandSaleRecords.remove();
    }

    if (arLandSaleResult != null) {
      arLandSaleResult = [];
    }

    lyrLandSaleRecords = L.geoJSON.ajax(apiLandSale, {
      pointToLayer: returnLandSaleMarker,
      onEachFeature: processLandSale,
      filter: filterLandSale,
    });
    lyrLandSaleRecords.on('data:loaded', function () {
      lyrMarkerCluster.clearLayers();
      lyrMarkerCluster.addLayer(lyrLandSaleRecords);
      lyrMarkerCluster.addTo(map);
      map.fitBounds(lyrMarkerCluster.getBounds());
      flagLand = 1;
      if (arLandSaleResult.length > 0) {
        $('#divLandSaleQty').html('No. of Records found : ' + arLandSaleResult.length);
        $('#divLandSaleBtn').html('<button id="btnDownloadLandSale" class="btn-block">Download CSV file</button>');
      }
    });

    //no data is loaded to the lyrLandSaleRecords, then ...

    if (flagLand != 1) {
      $('#divLandSaleQty').html('No. of Records found : ' + arLandSaleResult.length);
      $('#divLandSaleBtn').html('');
    }
  });

  $('#divLandSaleBtn').click(function () {
    console.log('clicked download button');
    downloadLandSale();
  });

  // **************** Lease Modification - data from API **************

  var apiLeaseModi = 'https://portal.csdi.gov.hk/server/services/common/landsd_rcd_1637225104335_55505/MapServer/WFSServer?' + 'service=wfs' + '&version=2.0.0' + '&request=GetFeature' + '&typename=LAOLMC' + '&outputFormat=GeoJSON' + '&srsname=EPSG%3A4326';

  // Loop to get the user and disctrict list

  var arrYearOfModiFilter = [];
  var arrModiDistrictFilter = [];
  var resultModiData = {};
  var optFilterModiPremium;

  // loading filter keyword into the search bar
  $.getJSON(apiLeaseModi, function (data) {
    $.each(data.features, function (key, value) {
      if (arrYearOfModiFilter.indexOf(value.properties.Execution_Year) == -1) {
        arrYearOfModiFilter.push(value.properties.Execution_Year);
      }
      if (arrModiDistrictFilter.indexOf(value.properties.Relevant_District_Council) == -1) {
        arrModiDistrictFilter.push(value.properties.Relevant_District_Council);
      }
    });
    arrYearOfModiFilter.sort();
    arrModiDistrictFilter.sort();

    $.each(arrYearOfModiFilter, function (index, value) {
      $('#yearOfModiFilter').append('<option value="' + value + '">' + value + '</option>');
    });
    $.each(arrModiDistrictFilter, function (index, value) {
      $('#modiDistrictFilter').append('<option value="' + value + '">' + value + '</option>');
    });
  });

  // console.log(arrYearOfModiFilter);

  lyrLeaseModi = L.geoJSON.ajax(apiLeaseModi, {
    pointToLayer: returnLeaseModiMarker,
    filter: filterLeaseModi,
  });

  ctlLayers.addOverlay(lyrLeaseModi, 'Lease Modification');

  $('#btnModiUserFilterAll').click(function () {
    $('input[name=fltModiUser]').prop('checked', true);
  });
  $('#btnModiUserFilterNone').click(function () {
    $('input[name=fltModiUser]').prop('checked', false);
  });

  $('#btnFilterLeaseModi').click(function () {
    if (lyrLeaseModi) {
      ctlLayers.removeLayer(lyrLeaseModi);
      lyrLeaseModi.remove();
    }
    if (arModiResult != null) {
      arModiResult = [];
    }

    var arrayModi = []; // array of features without Nil or $1000 premium
    var arrayModiAll = []; // array of features - no filtering
    var filteredModi = []; // obj after filtering premium

    $.getJSON(apiLeaseModi, function (data) {
      $.each(data.features, function (index, value) {
        //console.log(index, value);
        arrayModiAll.push(value);
        //console.log(arrayModi);
        if ((value.properties.Premium____ !== 'Nil') & (value.properties.Premium____ !== '1,000')) {
          arrayModi.push(value);
        }
      });

      // console.log(arrayModiAll.length);
      // console.log(arrayModi.length);

      optFilterModiPremium = $('input[name=fltModiPremium]:checked').val();
      //console.log(optFilterModiPremium);

      if (optFilterModiPremium === 'All-Premium') {
        filteredModi = arrayModiAll;
      } else {
        filteredModi = arrayModi;
      }

      // console.log(filteredModi);

      var resultText = '{ "features" : ' + JSON.stringify(filteredModi) + ', "type" : "FeatureCollection" }';

      resultModiData = JSON.parse(resultText);
      // console.log(resultModiData);
      // console.log(resultModiData.features[0].properties.userEN);

      lyrLeaseModi = L.geoJSON(resultModiData, {
        pointToLayer: returnLeaseModiMarker,
        onEachFeature: processModi,
        filter: filterLeaseModi,
      }).addTo(map);
      ctlLayers.addOverlay(lyrLeaseModi, 'Lease Modification');

      if (arModiResult.length !== 0) {
        map.fitBounds(lyrLeaseModi.getBounds());
      }

      //console.log(arModiResult);

      if (arModiResult.length > 0) {
        //flagModi = 1;
        $('#divLeaseModiQty').html('No. of Records found : ' + arModiResult.length);
        $('#divLeaseModiBtn').html('<button id="btnDownloadModi" class="btn-block">Download CSV file</button>');
      } else {
        //no data is loaded to the lyrLeaseModi, then ...
        //if (flagModi != 1) {
        $('#divLeaseModiQty').html('No. of Records found : ' + arModiResult.length);
        $('#divLeaseModiBtn').html('');
        //}
      }
    });

    $('#divLeaseModiBtn').click(function () {
      console.log('clicked download button');
      downloadModi();
    });
  });

  // **************** Land Exchange - data from API **************

  var apiLandExchange = 'https://portal.csdi.gov.hk/server/services/common/landsd_rcd_1637224372675_83413/MapServer/WFSServer?' + 'service=wfs' + '&version=2.0.0' + '&request=GetFeature' + '&typename=LAOLEC' + '&outputFormat=GeoJSON' + '&srsname=EPSG%3A4326';

  // Loop to get the user and disctrict list

  var arrYearOfExchangeFilter = [];
  var arrExchangeDistrictFilter = [];

  $.getJSON(apiLandExchange, function (data) {
    $.each(data.features, function (key, value) {
      if (arrYearOfExchangeFilter.indexOf(value.properties.Execution_Year) == -1) {
        arrYearOfExchangeFilter.push(value.properties.Execution_Year);
      }
      if (arrExchangeDistrictFilter.indexOf(value.properties.Relevant_District_Council) == -1) {
        arrExchangeDistrictFilter.push(value.properties.Relevant_District_Council);
      }
    });
    arrYearOfExchangeFilter.sort();
    arrExchangeDistrictFilter.sort();

    $.each(arrYearOfExchangeFilter, function (index, value) {
      $('#yearOfExchangeFilter').append('<option value="' + value + '">' + value + '</option>');
    });
    $.each(arrExchangeDistrictFilter, function (index, value) {
      $('#exchangeDistrictFilter').append('<option value="' + value + '">' + value + '</option>');
    });
  });

  // console.log(arrYearOfExchangeFilter);

  lyrExchange = L.geoJSON.ajax(apiLandExchange, {
    pointToLayer: returnExchangeMarker,
    filter: filterExchange,
  });

  ctlLayers.addOverlay(lyrExchange, 'Land Exchange');

  $('#btnExchangeUserFilterAll').click(function () {
    $('input[name=fltExchangeUser]').prop('checked', true);
  });
  $('#btnExchangeUserFilterNone').click(function () {
    $('input[name=fltExchangeUser]').prop('checked', false);
  });

  $('#btnFilterExchange').click(function () {
    var flagExchange;
    if (lyrExchange) {
      ctlLayers.removeLayer(lyrExchange);
      lyrExchange.remove();
    }
    if (arExchangeResult != null) {
      arExchangeResult = [];
    }
    lyrExchange = L.geoJSON
      .ajax(apiLandExchange, {
        pointToLayer: returnExchangeMarker,
        onEachFeature: processExchange,
        filter: filterExchange,
      })
      .addTo(map);
    ctlLayers.addOverlay(lyrExchange, 'Land Exchange');
    lyrExchange.on('data:loaded', function () {
      map.fitBounds(lyrExchange.getBounds());
      flagExchange = 1;
      if (arExchangeResult.length > 0) {
        $('#divExchangeQty').html('No. of Records found : ' + arExchangeResult.length);
        $('#divExchangeBtn').html('<button id="btnDownloadExchange" class="btn-block">Download CSV file</button>');
      }
    });
    if (flagExchange != 1) {
      $('#divExchangeQty').html('No. of Records found : ' + arExchangeResult.length);
      $('#divExchangeBtn').html('');
    }

    $('#divExchangeBtn').click(function () {
      console.log('clicked download button');
      downloadExchange();
    });
  });
  // **************** Revitialization of IB - data from API **************

  var apiLeaseModiIB2018 = 'https://portal.csdi.gov.hk/server/services/common/landsd_rcd_1637309419658_86585/MapServer/WFSServer?' + 'service=wfs' + '&version=2.0.0' + '&request=GetFeature' + '&typename=LAO_ELMC18' + '&outputFormat=GeoJSON' + '&srsname=EPSG%3A4326';

  lyrRevitIB2018 = L.geoJSON.ajax(apiLeaseModiIB2018, {
    pointToLayer: returnRevitIB2018Marker,
    onEachFeature: processIB2018,
  });
  
  // console.log(lyrRevitIB2018);

  ctlLayers.addOverlay(lyrRevitIB2018, 'Revitalization of IB 2018');

  $('#btnIB2018Dsiplay').click(function () {
    if ($('#btnIB2018Dsiplay').html() == 'Remove IB Locations') {
      ctlLayers.removeLayer(lyrRevitIB2018);
      lyrRevitIB2018.remove();
      $('#btnIB2018Dsiplay').html('Show IB Locations');
    } else {
      lyrRevitIB2018 = L.geoJSON.ajax(apiLeaseModiIB2018, { pointToLayer: returnRevitIB2018Marker }).addTo(map);
      ctlLayers.addOverlay(lyrRevitIB2018, 'Revitalization of IB 2018');
      $('#btnIB2018Dsiplay').html('Remove IB Locations');
    }
  });

  $('#btnIB2018Table').click(function () {
    if ($('#btnIB2018Table').html() == 'Show Premium Table') {
      var text = "<table class='table table-hover'><tr><th>Address</th><th>Premium</th><th>User</th>";
      $.getJSON(apiLeaseModiIB2018, function (data) {
        $.each(data.features, function (key, value) {
          text += '<tr><td>' + value.properties.Address + '</td><td>' + '$' + value.properties.Premium__HK__ + '</td><td>' + value.properties.User + '</td></tr>';
        });
        text += '</table>';
        $('#divIB2018Data').html(text);
        $('#btnIB2018Table').html('Remove Premium Table');
        $('#divIB2018Qty').html('No. of Records found : ' + arIB2018Result.length);
        $('#divIB2018Btn').html('<button id="btnDownloadIB2018" class="btn-block">Download CSV file</button>');
      });
    } else {
      $('#divIB2018Data').html('');
      $('#btnIB2018Table').html('Show Premium Table');
      $('#divIB2018Qty').html('');
      $('#divIB2018Btn').html('');
    }

    $('#divIB2018Btn').click(function () {
      console.log('clicked download button');
      downloadIB2018();
    });
  });
});

// ~~ Create Functions Session ~~

//Full screen map view
var mapId = document.getElementById('map');
function fullScreenView() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    mapId.requestFullscreen();
  }
}

// Land Sale Functions

function processLandSale(json) {
  var att = json.properties;

  arLandSaleResult.push({
    Financial_Year: att.Financial_Year_of_Land_Sale_Result_Announced,
    Lot_No: att.Facility_Name,
    Location: att.Address,
    Disposal_Type: att.Disposal_Type,
    User: att.User,
    Premium: att.Premium____Million_,
    Site_Area: att.Area_in_Square_Metres,
    District_Council: att.Relevant_District_Council,
    Award_Date: att.Sale_Tender_Award_Date,
    Remarks: att.Remarks,
  });
}

function filterLandSale(json) {
  var att = json.properties;
  var arrLandUser = [];
  var optYearOfSaleFilter = $('#yearOfSaleFilter').val();
  var optLandDistrictFilter = $('#landDistrictFilter').val();
  // console.log(optDistrictFilter);

  // filter Land User
  var arrLandUserFilter = [];
  $('input[name=fltLandUser]').each(function () {
    if (this.checked) {
      arrLandUserFilter.push(this.value);
    }
  });

  arrLandUser = att.User.split(' ');
  // console.log(arrLandUser[0]);
  if (optYearOfSaleFilter == 'ALL' && optLandDistrictFilter == 'ALL') {
    switch (arrLandUser[0]) {
      case 'PETROL':
        return arrLandUserFilter.indexOf('PFS') >= 0;
        break;
      case 'RESIDENTIAL':
        return arrLandUserFilter.indexOf('Residential') >= 0;
        break;
      case 'COMMERCIAL':
        return arrLandUserFilter.indexOf('Commercial') >= 0;
        break;
      case 'HOTEL':
        return arrLandUserFilter.indexOf('Hotel') >= 0;
        break;
      case 'INDUSTRIAL':
        return arrLandUserFilter.indexOf('Industrial') >= 0;
        break;
      default:
        return arrLandUserFilter.indexOf('Others') >= 0;
        break;
    }
  } else if (optYearOfSaleFilter == 'ALL' && optLandDistrictFilter != 'ALL') {
    if (att.Relevant_District_Council == optLandDistrictFilter) {
      switch (arrLandUser[0]) {
        case 'PETROL':
          return arrLandUserFilter.indexOf('PFS') >= 0;
          break;
        case 'RESIDENTIAL':
          return arrLandUserFilter.indexOf('Residential') >= 0;
          break;
        case 'COMMERCIAL':
          return arrLandUserFilter.indexOf('Commercial') >= 0;
          break;
        case 'HOTEL':
          return arrLandUserFilter.indexOf('Hotel') >= 0;
          break;
        case 'INDUSTRIAL':
          return arrLandUserFilter.indexOf('Industrial') >= 0;
          break;
        default:
          return arrLandUserFilter.indexOf('Others') >= 0;
          break;
      }
    }
  } else if (optLandDistrictFilter == 'ALL' && optYearOfSaleFilter != 'ALL') {
    if (att.Financial_Year_of_Land_Sale_Result_Announced == optYearOfSaleFilter) {
      switch (arrLandUser[0]) {
        case 'PETROL':
          return arrLandUserFilter.indexOf('PFS') >= 0;
          break;
        case 'RESIDENTIAL':
          return arrLandUserFilter.indexOf('Residential') >= 0;
          break;
        case 'COMMERCIAL':
          return arrLandUserFilter.indexOf('Commercial') >= 0;
          break;
        case 'HOTEL':
          return arrLandUserFilter.indexOf('Hotel') >= 0;
          break;
        case 'INDUSTRIAL':
          return arrLandUserFilter.indexOf('Industrial') >= 0;
          break;
        default:
          return arrLandUserFilter.indexOf('Others') >= 0;
          break;
      }
    }
  } else if (att.Financial_Year_of_Land_Sale_Result_Announced == optYearOfSaleFilter && att.Relevant_District_Council == optLandDistrictFilter) {
    switch (arrLandUser[0]) {
      case 'PETROL':
        return arrLandUserFilter.indexOf('PFS') >= 0;
        break;
      case 'RESIDENTIAL':
        return arrLandUserFilter.indexOf('Residential') >= 0;
        break;
      case 'COMMERCIAL':
        return arrLandUserFilter.indexOf('Commercial') >= 0;
        break;
      case 'HOTEL':
        return arrLandUserFilter.indexOf('Hotel') >= 0;
        break;
      case 'INDUSTRIAL':
        return arrLandUserFilter.indexOf('Industrial') >= 0;
        break;
      default:
        return arrLandUserFilter.indexOf('Others') >= 0;
        break;
    }
  }
}

function returnLandSaleMarker(json, latlng) {
  var att = json.properties;
  var remark;
  var unsuccessfulAmt;
  var arUnccessfulTenderAmt;
  var premiumInFullFigure;
  var indTenderAmt;
  var pcChange;

  if (att.User == 'PETROL FILLING STATION') {
    var icnLandSale = icnLAMPetrolStation;
  } else {
    var icnLandSale = icnLAMOthers;
  }
  if (att.Remarks === undefined) {
    remark = 'N.A.';
  } else {
    remark = att.Remarks;
  }

  // unsuccessfulAmt = 'N.A.'; // assume N.A. first

  if (!att.Premium____Million_.startsWith('-')) {
    premiumInFullFigure = Number(att.Premium____Million_.replace(/,/g, '')) * 1000000;
    // console.log(premiumInFullFigure, att.awardDateEN, att.lotNumberEN);

    if (att.Tender_amounts_submitted_by_the_unsuccessful_tenderers !== 'N.A.' && att.Tender_amounts_submitted_by_the_unsuccessful_tenderers !== 'null') {
      unsuccessfulAmt = att.Tender_amounts_submitted_by_the_unsuccessful_tenderers;
      arUnccessfulTenderAmt = unsuccessfulAmt.split('<br/>');

      unsuccessfulAmt = '';
      for (var i = 0; i < arUnccessfulTenderAmt.length; i++) {
        indTenderAmt = Number(arUnccessfulTenderAmt[i].split(' ')[1].slice(1).replace(/,/g, ''));
        //console.log(indTenderAmt);
        pcChange = (100 * (premiumInFullFigure - indTenderAmt)) / premiumInFullFigure;
        // console.log(indTenderAmt);
        //console.log(pcChange);
        unsuccessfulAmt += `${arUnccessfulTenderAmt[i]} (${pcChange.toFixed(2)}%)<br/>`;
      }
      // console.log(arUnccessfulTenderAmt);
    }
  }

  return L.marker(latlng, { icon: icnLandSale }).bindPopup(
    `<h4>Land Sale: ${att.Financial_Year_of_Land_Sale_Result_Announced}</h4>
    <ul>
      <li>- Lot No.: <b>${att.Facility_Name}</b></li>
      <li>- Award Date: ${att.Sale_Tender_Award_Date}</li>
      <li>- Disposal Type: ${att.Disposal_Type}</li>
      <li>- User: <b>${att.User}</b></li>
      <li>- Site Area (sm): <b>${att.Area_in_Square_Metres}</b></li>
      <li>- Premium (HK$M): <b>${att.Premium____Million_}</b></li>
      <li>- Successful Tenderer: <b>${att.最高的投標者__母公司_}</b></li>
      <li>- Unsuccessful Tenderer Amt: <br><b>${unsuccessfulAmt}</b></li>
      <li>- Remarks: ${remark}</li>
    </ul>
      `,
    { closeButton: false }
  );
}

// Lease Modification Functions

function returnLeaseModiMarker(json, latlng) {
  var att = json.properties;
  if (att.Premium____ == 'Nil') {
    var clrModi = 'green';
  } else if (att.Premium____ == '1,000') {
    var clrModi = 'indigo';
  } else {
    var clrModi = 'red';
  }

  return L.circleMarker(latlng, { radius: 8, color: clrModi }).bindPopup(
    `<h4>Lease Modification : ${att.Execution_Year}</h4>
    <ul>
      <li>- Lot No.: ${att.Lot_Number}</li>
      <li>- Location: <b>${att.Location}</b></li>
      <li>- User: <b>${att.User}</b></li>
      <li>- Premium (HK$): <b>${att.Premium____}</b></li>
      <li>- District Council: ${att.Relevant_District_Council}</li>
      <li>- Execution Date: ${att.Execution_Date}</li>
    </ul>
    `,
    { closeButton: false }
  );
}

function filterLeaseModi(json) {
  // console.log(json);
  var att = json.properties;
  var strModiUser = att.User.slice(0, 5);
  var optYearOfModiFilter = $('#yearOfModiFilter').val();
  var optModiDistrictFilter = $('#modiDistrictFilter').val();

  // filter Modi User
  var arrModiUserFilter = [];
  $('input[name=fltModiUser]').each(function () {
    if (this.checked) {
      arrModiUserFilter.push(this.value);
    }
  });

  if (optYearOfModiFilter == 'ALL' && optModiDistrictFilter == 'ALL') {
    switch (strModiUser) {
      case 'Petro':
        return arrModiUserFilter.indexOf('PFS') >= 0;
        break;
      case 'Resid':
        return arrModiUserFilter.indexOf('Residential') >= 0;
        break;
      case 'Comme':
        return arrModiUserFilter.indexOf('Commercial') >= 0;
        break;
      case 'Hotel':
        return arrModiUserFilter.indexOf('Hotel') >= 0;
        break;
      case 'Indus':
        return arrModiUserFilter.indexOf('Industrial') >= 0;
        break;
      default:
        return arrModiUserFilter.indexOf('Others') >= 0;
        break;
    }
  } else if (optYearOfModiFilter == 'ALL' && optModiDistrictFilter != 'ALL') {
    if (att.Relevant_District_Council == optModiDistrictFilter) {
      switch (strModiUser) {
        case 'Petro':
          return arrModiUserFilter.indexOf('PFS') >= 0;
          break;
        case 'Resid':
          return arrModiUserFilter.indexOf('Residential') >= 0;
          break;
        case 'Comme':
          return arrModiUserFilter.indexOf('Commercial') >= 0;
          break;
        case 'Hotel':
          return arrModiUserFilter.indexOf('Hotel') >= 0;
          break;
        case 'Indus':
          return arrModiUserFilter.indexOf('Industrial') >= 0;
          break;
        default:
          return arrModiUserFilter.indexOf('Others') >= 0;
          break;
      }
    }
  } else if (optModiDistrictFilter == 'ALL' && optYearOfModiFilter != 'ALL') {
    if (att.Execution_Year == optYearOfModiFilter) {
      switch (strModiUser) {
        case 'Petro':
          return arrModiUserFilter.indexOf('PFS') >= 0;
          break;
        case 'Resid':
          return arrModiUserFilter.indexOf('Residential') >= 0;
          break;
        case 'Comme':
          return arrModiUserFilter.indexOf('Commercial') >= 0;
          break;
        case 'Hotel':
          return arrModiUserFilter.indexOf('Hotel') >= 0;
          break;
        case 'Indus':
          return arrModiUserFilter.indexOf('Industrial') >= 0;
          break;
        default:
          return arrModiUserFilter.indexOf('Others') >= 0;
          break;
      }
    }
  } else {
    if (att.Execution_Year == optYearOfModiFilter && att.Relevant_District_Council == optModiDistrictFilter) {
      switch (strModiUser) {
        case 'Petro':
          return arrModiUserFilter.indexOf('PFS') >= 0;
          break;
        case 'Resid':
          return arrModiUserFilter.indexOf('Residential') >= 0;
          break;
        case 'Comme':
          return arrModiUserFilter.indexOf('Commercial') >= 0;
          break;
        case 'Hotel':
          return arrModiUserFilter.indexOf('Hotel') >= 0;
          break;
        case 'Indus':
          return arrModiUserFilter.indexOf('Industrial') >= 0;
          break;
        default:
          return arrModiUserFilter.indexOf('Others') >= 0;
          break;
      }
    }
  }
}

function processModi(json) {
  var att = json.properties;

  arModiResult.push({ Execution_Year: att.Execution_Year, Lot_No: att.Lot_Number, Location: att.Location, User: att.User, Premium: att.Premium____, District_Council: att.Relevant_District_Council, Execution_Date: att.Execution_Date });
}

// Land exchange Functions

function returnExchangeMarker(json, latlng) {
  var att = json.properties;
  if (att.Premium____ == 'Nil') {
    var clrExchange = 'black';
  } else {
    var clrExchange = 'purple';
  }

  // arExchangeResult.push(att.lotNumberEN.toString());

  return L.circleMarker(latlng, { radius: 8, color: clrExchange, fillOpacity: 0.8 }).bindPopup(
    `<h4>Land Exchange: ${att.Execution_Year}</h4>
    <ul>
      <li>- Lot No.: ${att.Lot_Number}</li>
      <li>- Location: <b>${att.Location}</b></li>
      <li>- User: <b>${att.User}</b></li>
      <li>- Premium (HK$): <b>${att.Premium____}</b></li>
      <li>- New Lot Site Area (ha): <b>${att.Site_Area_of_New_Lot__hectare___about_}</b></li>
      <li>- District Council: ${att.Relevant_District_Council}</li>
      <li>- Execution Date: ${att.Execution_Date}</li>
    </ul>
    `,
    { closeButton: false }
  );
}

function filterExchange(json) {
  var att = json.properties;
  var strExchangeUser;
  var optYearOfExchangeFilter = $('#yearOfExchangeFilter').val();
  var optExchangeDistrictFilter = $('#exchangeDistrictFilter').val();
  // console.log(optDistrictFilter);

  // filter Exchange User
  var arrExchangeUserFilter = [];
  $('input[name=fltExchangeUser]').each(function () {
    if (this.checked) {
      arrExchangeUserFilter.push(this.value);
    }
  });

  strExchangeUser = att.User.slice(0, 5);
  if (optYearOfExchangeFilter == 'ALL' && optExchangeDistrictFilter == 'ALL') {
    switch (strExchangeUser) {
      case 'Petro':
        return arrExchangeUserFilter.indexOf('PFS') >= 0;
        break;
      case 'Resid':
        return arrExchangeUserFilter.indexOf('Residential') >= 0;
        break;
      case 'Comme':
        return arrExchangeUserFilter.indexOf('Commercial') >= 0;
        break;
      case 'Hotel':
        return arrExchangeUserFilter.indexOf('Hotel') >= 0;
        break;
      case 'Indus':
        return arrExchangeUserFilter.indexOf('Industrial') >= 0;
        break;
      default:
        return arrExchangeUserFilter.indexOf('Others') >= 0;
        break;
    }
  } else if (optYearOfExchangeFilter == 'ALL' && optExchangeDistrictFilter != 'ALL') {
    if (att.Relevant_District_Council == optExchangeDistrictFilter) {
      switch (strExchangeUser) {
        case 'Petro':
          return arrExchangeUserFilter.indexOf('PFS') >= 0;
          break;
        case 'Resid':
          return arrExchangeUserFilter.indexOf('Residential') >= 0;
          break;
        case 'Comme':
          return arrExchangeUserFilter.indexOf('Commercial') >= 0;
          break;
        case 'Hotel':
          return arrExchangeUserFilter.indexOf('Hotel') >= 0;
          break;
        case 'Indus':
          return arrExchangeUserFilter.indexOf('Industrial') >= 0;
          break;
        default:
          return arrExchangeUserFilter.indexOf('Others') >= 0;
          break;
      }
    }
  } else if (optExchangeDistrictFilter == 'ALL' && optYearOfExchangeFilter != 'ALL') {
    if (att.Execution_Year == optYearOfExchangeFilter) {
      switch (strExchangeUser) {
        case 'Petro':
          return arrExchangeUserFilter.indexOf('PFS') >= 0;
          break;
        case 'Resid':
          return arrExchangeUserFilter.indexOf('Residential') >= 0;
          break;
        case 'Comme':
          return arrExchangeUserFilter.indexOf('Commercial') >= 0;
          break;
        case 'Hotel':
          return arrExchangeUserFilter.indexOf('Hotel') >= 0;
          break;
        case 'Indus':
          return arrExchangeUserFilter.indexOf('Industrial') >= 0;
          break;
        default:
          return arrExchangeUserFilter.indexOf('Others') >= 0;
          break;
      }
    }
  } else {
    if (att.Execution_Year == optYearOfExchangeFilter && att.Relevant_District_Council == optExchangeDistrictFilter) {
      switch (strExchangeUser) {
        case 'Petro':
          return arrExchangeUserFilter.indexOf('PFS') >= 0;
          break;
        case 'Resid':
          return arrExchangeUserFilter.indexOf('Residential') >= 0;
          break;
        case 'Comme':
          return arrExchangeUserFilter.indexOf('Commercial') >= 0;
          break;
        case 'Hotel':
          return arrExchangeUserFilter.indexOf('Hotel') >= 0;
          break;
        case 'Indus':
          return arrExchangeUserFilter.indexOf('Industrial') >= 0;
          break;
        default:
          return arrExchangeUserFilter.indexOf('Others') >= 0;
          break;
      }
    }
  }
}

function processExchange(json) {
  var att = json.properties;

  arExchangeResult.push({ Execution_Year: att.Execution_Year, Lot_No: att.Lot_Number, Location: att.Location, User: att.User, Premium: att.Premium____, New_Lot_Site_Area: att.Site_Area_of_New_Lot__hectare___about_, District_Council: att.Relevant_District_Council, Execution_Date: att.Execution_Date });
}

// Revitalization of IB Functions

function returnRevitIB2018Marker(json, latlng) {
  var att = json.properties;

  return L.marker(latlng, { icon: icnLAMIB }).bindPopup(
    `<h4>Revitalization of IB (2018) - Lease Modification</h4>
  <ul>
    <li>- Date of Lease Modification: ${att.Execution_Date}</li>
    <li>- Location: <b>${att.Address}</b></li>
    <li>- Premium (HK$): <b>${att.Premium__HK__}</b></li>
    <li>- User: <b>${att.User}</b></li>
  `,
    { closeButton: false }
  );
}

function processIB2018(json) {
  var att = json.properties;

  arIB2018Result.push({ Execution_Year: att.Execution_Year, Lot_No: att.Facility_Name, Location: att.Address, User: att.User, Premium: att.Premium__HK__, District_Council: att.Relevant_District_Council, Execution_Date: att.Execution_Date });
}

// Generic Functions

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

// Export JSON to CSV file

function convertToCSV(objArray) {
  var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
  var str = '';
  for (var i = 0; i < array.length; i++) {
    var line = '';
    for (var index in array[i]) {
      if (line != '') line += ',';
      line += array[i][index];
    }
    str += line + '\r\n';
  }
  return str;
}

function exportCSVFile(headers, items, fileTitle) {
  if (headers) {
    items.unshift(headers);
  }

  // Convert Object to JSON
  var jsonObject = JSON.stringify(items);

  var csv = this.convertToCSV(jsonObject);

  var exportedFilename = fileTitle + '.csv' || 'export.csv';

  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, exportedFilename);
  } else {
    var link = document.createElement('a');
    if (link.download !== undefined) {
      // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', exportedFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

function downloadLandSale() {
  var headers = {
    Financial_Year: 'Financial Year'.replace(/,/g, ''), // remove commas to avoid errors
    Lot_No: 'Lot No.',
    Location: 'Location',
    Disposal_Type: 'Disposal Type',
    User: 'User',
    Premium: 'Premium',
    Site_Area: 'Site Area (sm)',
    District_Council: 'District Council',
    Award_Date: 'Award Date',
    Remarks: 'Remarks',
  };

  var itemsFormatted = [];

  // format the data
  arLandSaleResult.forEach((item) => {
    console.log('filtered items are : ' + item);
    if (item.Remarks == undefined) {
      item.Remarks = 'N.A.';
    }
    itemsFormatted.push({
      Financial_Year: item.Financial_Year,
      Lot_No: item.Lot_No.replace(/,/g, ''), // remove commas to avoid errors,
      Location: item.Location.replace(/,/g, ''),
      Disposal_Type: item.Disposal_Type.replace(/,/g, ''),
      User: item.User.replace(/,/g, ''),
      Premium: item.Premium.replace(/,/g, ''),
      Site_Area: item.Site_Area.replace(/,/g, ''),
      District_Council: item.District_Council,
      Award_Date: item.Award_Date.replace(/,/g, ''),
      Remarks: item.Remarks.replace(/,/g, ''),
    });
  });

  var fileTitle = 'LandSaleTxns'; // or 'my-unique-title'

  exportCSVFile(headers, itemsFormatted, fileTitle); // call the exportCSVFile() function to process the JSON and trigger the download

  location.href;
}

function downloadModi() {
  var headers = {
    Execution_Year: 'Execution Year',
    Lot_No: 'Lot No.',
    Location: 'Location',
    User: 'User',
    Premium: 'Premium',
    District_Council: 'District Council',
    Execution_Date: 'Execution Date',
  };

  var itemsFormatted = [];

  // format the data
  arModiResult.forEach((item) => {
    console.log('filtered items are : ' + item);
    itemsFormatted.push({
      Execution_Year: item.Execution_Year,
      Lot_No: item.Lot_No.replace(/,/g, ''), // remove commas to avoid errors,
      Location: item.Location.replace(/,/g, ''),
      User: item.User.replace(/,/g, ''),
      Premium: item.Premium.replace(/,/g, ''),
      District_Council: item.District_Council,
      Execution_Date: item.Execution_Date,
    });
  });

  var fileTitle = 'LeaseModiTxns'; // or 'my-unique-title'

  exportCSVFile(headers, itemsFormatted, fileTitle); // call the exportCSVFile() function to process the JSON and trigger the download

  location.href;
}

function downloadExchange() {
  var headers = {
    Execution_Year: 'Execution Year'.replace(/,/g, ''), // remove commas to avoid errors
    Lot_No: 'Lot No.',
    Location: 'Location',
    User: 'User',
    Premium: 'Premium',
    New_Lot_Site_Area: 'New Lot Site Area (ha)',
    District_Council: 'District Council',
    Execution_Date: 'Execution Date',
  };

  var itemsFormatted = [];

  // format the data
  arExchangeResult.forEach((item) => {
    console.log('filtered items are : ' + item);
    itemsFormatted.push({
      Execution_Year: item.Execution_Year,
      Lot_No: item.Lot_No.replace(/,/g, ''), // remove commas to avoid errors,
      Location: item.Location.replace(/,/g, ''),
      User: item.User.replace(/,/g, ''),
      Premium: item.Premium.replace(/,/g, ''),
      New_Lot_Site_Area: item.New_Lot_Site_Area.replace(/,/g, ''),
      District_Council: item.District_Council,
      Execution_Date: item.Execution_Date,
    });
  });

  var fileTitle = 'LandExchangeTxns'; // or 'my-unique-title'

  exportCSVFile(headers, itemsFormatted, fileTitle); // call the exportCSVFile() function to process the JSON and trigger the download

  location.href;
}

function downloadIB2018() {
  var headers = {
    Execution_Year: 'Execution Year'.replace(/,/g, ''), // remove commas to avoid errors
    Lot_No: 'Lot No.',
    Location: 'Location',
    User: 'User',
    Premium: 'Premium',
    District_Council: 'District Council',
    Execution_Date: 'Execution Date',
  };

  var itemsFormatted = [];

  console.log(arIB2018Result);

  // format the data
  arIB2018Result.forEach((item) => {
    console.log('filtered items are : ' + item);
    itemsFormatted.push({
      Execution_Year: item.Execution_Year,
      Lot_No: item.Lot_No.replace(/,/g, ''), // remove commas to avoid errors,
      Location: item.Location.replace(/,/g, ''),
      User: item.User.replace(/,/g, ''),
      Premium: item.Premium.replace(/,/g, ''),
      District_Council: item.District_Council,
      Execution_Date: item.Execution_Date,
    });
  });

  var fileTitle = 'IB2018Premiums'; // or 'my-unique-title'

  exportCSVFile(headers, itemsFormatted, fileTitle); // call the exportCSVFile() function to process the JSON and trigger the download

  location.href;
}
