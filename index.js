var google;
var map;
var gpxRAWstring = [];
var csvRAWstring = [];
var gpx = [];
var csv = [];
var infowindows = [];
var infowindow_on = true;


function initMap(){

  var options = {
    zoom:8,
    center:{lat:42.3601, lng:-71.0589}
  }

  map = new google.maps.Map(document.getElementById("map"), options);

}

function upload_gpx() {
    gpx = [];
    gpxRAWstring = [];
    var data = [];
    var body = '';
    var input = document.getElementById("gpx");
    var file = input.files[0];
    var fr = new FileReader();
    fr.onload = function(){
        var text = fr.result;
        data.push(fr.result);

        console.log(data);
        gpxRAWstring = data;
        body = data[0];
        console.log(body);
        var trackPoints = body.split("</trkpt>");
        var regex = /[0-9 +-]/;
        var i;
        var offset;
        var query_string = "";
        var GPSpoint = {
          time: "sample",
          lon: "sample",
          lat: "sample"
        };

        for(i=0;i<trackPoints.length-1; i++){
          var string = trackPoints[i];

          // Get the time
          var index = string.indexOf("T");
          offset = string.substring(index).search(regex);
          GPSpoint.time = string.substring(index+offset, index+offset+8);

          // Get the Longitude
          var index = string.indexOf("lon");
          offset = string.substring(index).search(regex);
          GPSpoint.lon = string.substring(index+offset, index+offset+10);

          // Get the Latitude
          var index = string.indexOf("lat");
          offset = string.substring(index).search(regex);
          GPSpoint.lat = string.substring(index+offset, index+offset+9);

          // push the stat
          gpx.push({
            time: GPSpoint.time,
            lon: GPSpoint.lon,
            lat: GPSpoint.lat
          });

        }//for
        console.log(gpx);

      };
    fr.readAsText(file);

    document.getElementById("submitgpx").innerHTML = "<img src = 'check.png' width='15' height='15'>";

}

function upload_csv (){
    csv = [];
    csvRAWstring = [];
    var data = [];
    var body = '';
    var input = document.getElementById("csv");
    var file = input.files[0];
    var fr = new FileReader();
    fr.onload = function(){
        var text = fr.result;
        data.push(fr.result);

        console.log(data);
        csvRAWstring = data;
        body = data[0];
        console.log(body);
        var rawdata = body.split("\r");

        var statPoint = {
          distance: "sample",
          time: "sample",
          strcount: "sample",
          rate: "sample",
          check: "sample",
          splspeed: "sample",
          speed: "sample",
          dispstr: "sample",
        };

        var i;
        var dataPoint = [];
        for(i=3;i<rawdata.length-1;i++){
          dataPoint = rawdata[i].split(",");
          statPoint.distance = dataPoint[0];
          statPoint.time = dataPoint[1];
          statPoint.strcount = dataPoint[2];
          statPoint.rate = dataPoint[3];
          statPoint.check = dataPoint[4];
          statPoint.splspeed = dataPoint[5];
          statPoint.speed = dataPoint[6];
          statPoint.dispstr = dataPoint[7];

          // push the stats
          csv.push({
            distance: statPoint.distance,
            time: statPoint.time,
            strcount: statPoint.strcount,
            rate: statPoint.rate,
            check: statPoint.check,
            splspeed: statPoint.splspeed,
            speed: statPoint.speed,
            dispstr: statPoint.dispstr
          });
        } // for
        console.log(csv);

      };
    fr.readAsText(file);

    document.getElementById("submitcsv").innerHTML = "<img src = 'check.png' width='15' height='15'>";

}

function displayPath(){

    document.getElementById("submitcsv").innerHTML = "";
    document.getElementById("submitgpx").innerHTML = "";
    infowindows = [];
    // cut out the decimals
    var i;
    var newdata;
    for(i=0;i<csv.length;i++){
      newdata = csv[i].time.slice(0,7);
      csv[i].time = newdata;
    }

    var date;
    var date_string;
    var hours, minutes, seconds;
    for(i=0;i<csv.length;i++){
      hours = csv[i].time.slice(0, 1);
      minutes = csv[i].time.slice(2, 4);
      seconds = csv[i].time.slice(5, 7);
      date_string = "August 19, 2018 " + hours + ":" + minutes + ":" + seconds;
      date = new Date(date_string);

      csv[i].time = date.getHours().toString()
      + ":" + date.getMinutes().toString()
      + ":" + date.getSeconds().toString();
    }

    // adjust the gpx time to be elapsed time
    var date2;
    var date_string2;

    //console.log(gpx[0]);
    var base_hours = parseFloat(gpx[0].time.slice(0, 2));
    var base_minutes = parseFloat(gpx[0].time.slice(3, 5));
    var base_seconds = parseFloat(gpx[0].time.slice(6, 8));

    var hours2, minutes2, seconds2;
    for(i=0;i<gpx.length;i++){
      hours2 = gpx[i].time.slice(0, 2);
      minutes2 = gpx[i].time.slice(3, 5);
      seconds2 = gpx[i].time.slice(6, 8);
      date_string2 = "August 19, 2018 " + hours2 + ":" + minutes2 + ":" + seconds2;
      date2 = new Date(date_string2);

      date2.setHours(date2.getHours() - base_hours);
      date2.setMinutes(date2.getMinutes() - base_minutes);
      date2.setSeconds(date2.getSeconds() - base_seconds);

      gpx[i].time = date2.getHours().toString()
      + ":" + date2.getMinutes().toString()
      + ":" + date2.getSeconds().toString();

    }
        var lilyPath = new window.google.maps.Polyline({
          //geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 5,
        });

        var i, j;
        var path = lilyPath.getPath();
        var myLatLng;
        var infowindow;
        var split;
        var avg_split = 0;
        var avg_rate = 0;
        var avg_disStr = 0;
        var tot_dis = 0;

        for(i=0;i<gpx.length;i++){
          myLatLng = new window.google.maps.LatLng({lat: parseFloat(gpx[i].lat), lng: parseFloat(gpx[i].lon)});
          path.push(myLatLng);
          if(i==0){window.map.setCenter(myLatLng); window.map.setZoom(13);}

          for(j=0;j<csv.length;j++){
            if(csv[j].time == gpx[i].time){
              avg_split += (parseFloat(csv[j].splspeed.slice(1,5)[0])*60) + parseFloat(csv[j].splspeed.slice(1,5).slice(2,5));
              avg_rate += parseFloat(csv[j].rate.slice(1,5));
              avg_disStr += parseFloat(csv[j].dispstr.slice(0,5));

            }// if
          }// csv

          for(j=19;j<csv.length;j+=20){
            if(csv[j].time == gpx[i].time){
              split = csv[j].splspeed.slice(1,5) + " @ " + csv[j].rate.slice(1,5);
              infowindows.push(new window.google.maps.InfoWindow({
                  content: split,
                  position: myLatLng,
                  map: window.map
              }));

            }// if
          }// csv


        }// gpx

        lilyPath.strokeColor = "darkblue";
        lilyPath.setMap(window.map);

        console.log(avg_rate)

        avg_rate = (avg_rate/csv.length).toFixed(1);
        avg_split = avg_split/csv.length;
        var newavg = parseInt(avg_split/60); // minutes as int
        avg_split = (parseFloat((avg_split/60).toString().slice(1,3)))*60;
        console.log((avg_split/60).toString().slice(1,3));
        console.log(newavg);
        console.log(avg_split);
        avg_split = newavg + avg_split;
        var newsplit = newavg.toString()+":"+avg_split.toString();
        avg_disStr = (avg_disStr/csv.length).toFixed(2);
        tot_dis = csv[csv.length-1].distance;
        document.getElementById("stats").innerHTML = "<div className='hero'>" +
                                                      "<div className = 'box'><li><ul>Average stroke rate (str/min): <strong>" +
                                                      avg_rate.toString() + "</strong></ul><ul>Average Split (time/500m): <strong>" +
                                                      newsplit + "</strong></ul><ul>Average Distance per Stroke (m): <strong>" +
                                                      avg_disStr.toString() + "</strong></ul><ul>Total Distance (m): <strong>" +
                                                      tot_dis.toString() + "</strong></ul></li></div></div>";

}

function toggleInfoWindows (){
    if (csv === undefined || csv.length == 0) {
      return;
    }

    if (infowindow_on == false){
      // populate the map
      infowindow_on = true;
      for (var i=0;i<infowindows.length;i++) {
        infowindows[i].open(window.map);
      }
    } else if(infowindow_on == true){
      // take off map
      infowindow_on = false;
      for (var i=0;i<infowindows.length;i++) {
        infowindows[i].close();
      }
    }
}
