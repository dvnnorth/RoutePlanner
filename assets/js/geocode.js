// Initialize the map
var map, infoWindow;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 10
  });
  infoWindow = new google.maps.InfoWindow;

  /*  document.getElementById('submit').addEventListener('click', function () {
      var address = document.getElementById('address').value;
      var destination = document.getElementById('destination').value;
      geocodeAddress(geocoder, map, address);
      geocodeAddress(geocoder, map, destination);
    });*/
}

// IIFE - Center map on user location and autocomplete first input field
function centerMap () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 10
  });
  infoWindow = new google.maps.InfoWindow;

  var geocoder = new google.maps.Geocoder();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setCenter(pos);
      geocoder.geocode({
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      }, function (results, status) {
        if (status === 'OK') {
          $(`#address`).val(results[0].formatted_address);
        }
      });
    }, function () {
      console.log(`Location Retrieval Failed`);
    });
  }
}

// function geocodeAddress(geocoder, resultsMap, address) {
//   geocoder.geocode({ 'address': address }, function (results, status) {
//     if (status === 'OK') {
//       resultsMap.setCenter(results[0].geometry.location);
//       var marker = new google.maps.Marker({
//         map: resultsMap,
//         position: results[0].geometry.location
//       });
//     } else {
//       alert('Geocode was not successful for the following reason: ' + status);
//     }
//   });
// }

function handleLocationError(infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.open(map);
}

// Call Geocode
//geocode();

// Get location form
var locationForm = document.getElementById('location-form');

// Listen for submit
locationForm.addEventListener('submit', geocode);
locationForm.addEventListener('submit', drawRoute);


var startLat;
var startLng;
var endlat;
var endlng;

function geocode(e) {
  // Prevent actual submit
  e.preventDefault();

  var location = document.getElementById('address').value;
  var destination = document.getElementById('destination').value;

  // Initialize display
  // document.getElementById('results').innerHTML = "";
  $(`#output`).empty();

  axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: {
      address: location,
      key: 'AIzaSyAaODN8BfiLaVS7586DIEwayLiCIuVBWzw'
    }
  })
    .then(function (response) {
      // Log full response
      //console.log(response);

      // Formatted Address
      var formattedAddress = response.data.results[0].formatted_address;
      var formattedAddressOutput = `
          <ul class="list-group">
            <li class="list-group-item">${formattedAddress}</li>
          </ul>
        `;

      // Address Components
      var addressComponents = response.data.results[0].address_components;
      var addressComponentsOutput = '<ul class="list-group">';
      for (var i = 0; i < addressComponents.length; i++) {
        addressComponentsOutput += `
            <li class="list-group-item"><strong>${addressComponents[i].types[0]}</strong>: ${addressComponents[i].long_name}</li>
          `;
      }
      addressComponentsOutput += '</ul>';

      // Geometry
      startLat = response.data.results[0].geometry.location.lat;
      startLng = response.data.results[0].geometry.location.lng;
      /*var geometryOutput = `
          <ul class="list-group">
            <li class="list-group-item"><strong>Starting Location</strong></li>
            <li class="list-group-item"><strong>Latitude</strong>: ${startLat}</li>
            <li class="list-group-item"><strong>Longitude</strong>: ${startLng}</li>
          </ul>
        `;*/

      // Output to app
      // document.getElementById('formatted-address').innerHTML = formattedAddressOutput;
      // document.getElementById('address-components').innerHTML = addressComponentsOutput;
      //document.getElementById('geometry').innerHTML += geometryOutput;
    })
    .catch(function (error) {
      console.log(error);
    });

  axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: {
      address: destination,
      key: 'AIzaSyAaODN8BfiLaVS7586DIEwayLiCIuVBWzw'
    }
  })
    .then(function (response) {
      // Log full response
      // console.log(response);

      // Formatted Address
      var formattedDestinationAddress = response.data.results[0].formatted_address;
      var formattedDestinationAddressOutput = `
          <ul class="list-group">
            <li class="list-group-item">${formattedDestinationAddress}</li>
          </ul>
        `;

      // Address Components
      var destinationAddressComponents = response.data.results[0].address_components;
      var destinationAddressComponentsOutput = '<ul class="list-group">';
      for (var i = 0; i < destinationAddressComponents.length; i++) {
        destinationAddressComponentsOutput += `
            <li class="list-group-item"><strong>${destinationAddressComponents[i].types[0]}</strong>: ${destinationAddressComponents[i].long_name}</li>
          `;
      }
      destinationAddressComponentsOutput += '</ul>';

      // Geometry
      var endlat = response.data.results[0].geometry.location.lat;
      var endlng = response.data.results[0].geometry.location.lng;
      /*var geometryOutput = `
          <ul class="list-group">
            <li class="list-group-item"><strong>Destination</strong></li>
            <li class="list-group-item"><strong>Latitude</strong>: ${endlat}</li>
            <li class="list-group-item"><strong>Longitude</strong>: ${endlng}</li>
          </ul>
        `;*/

      // Output to app
      // document.getElementById('formatted-address').innerHTML = formattedAddressOutput;
      // document.getElementById('address-components').innerHTML = addressComponentsOutput;
      // document.getElementById('geometry').innerHTML += geometryOutput;


      //   initiate Lyft API call

      // console.log(`checking lat long`, this.startLat, this.startLng, endlat, endlng);

      axios.get(`https://api.lyft.com/v1/cost?start_lat=${startLat}&start_lng=${startLng}&end_lat=${endlat}&end_lng=${endlng}`)
        .then(function (response) {
          // Log full response
          // console.log(`lyft response`, response);
          var fareMin = response.data.cost_estimates[0].estimated_cost_cents_min;
          var fareMax = response.data.cost_estimates[0].estimated_cost_cents_max;
          var distance = response.data.cost_estimates[0].estimated_distance_miles;
          var timeOfTravel = response.data.cost_estimates[0].estimated_duration_seconds;
          var output = $(`<div>`).addClass(`col s12 m6`).attr(`id`, `output`);
          var card = $(`<div>`).addClass(`card-panel pink lighten-5`);
          var cardContent = $(`<div>`).addClass(`card-content black-text`);
          var lyftImg = $(`<img>`)
            .attr(`src`, `./assets/img/Lyft_Logo_Pink.png`)
            .attr(`width`, `100`);
          var list = $(`<ul>`)
            .append($(`<li>`).text(`$${fareMin / 100} - $${fareMax / 100}`))
            .append($(`<li>`).text(`${distance} miles`))
            .append($(`<li>`).text(`${Math.round(timeOfTravel / 60) ? Math.round(timeOfTravel / 60) : 'Less than zero'} minutes`));
          cardContent.append(lyftImg)
          cardContent.append(list);
          card.append(cardContent);
          output.append(card);
          $(`#input-col`).addClass(`m6`);
          $(`#main-row`).append(output);
        });


    })
    .catch(function (error) {
      console.log(error);
    });

}

function drawRoute(e) {
  // Prevent form submission
  e.preventDefault();
  initMap();
  var directions = new google.maps.DirectionsService();
  var renderer = new google.maps.DirectionsRenderer();
  var address = document.getElementById('address').value;
  var destination = document.getElementById('destination').value;


  directions.route({
    origin: address,
    destination: destination,
    travelMode: 'DRIVING'
  }, function (result, status) {
    if (status == 'OK') {
      renderer.setMap(map);
      renderer.setDirections(result);
    }
  });
}

