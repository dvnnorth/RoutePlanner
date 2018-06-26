// Google Maps API Callback
function centerMap() {

  // Initialize map
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 10
  });

  infoWindow = new google.maps.InfoWindow;

  // Store the geocoder
  var geocoder = new google.maps.Geocoder();

  // If the navigator successfully loaded, then center the map and prefill start location
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

// On document ready
$(function () {

  // Initialize the map
  var map;
  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 10
    });
  }

  // Get location form
  var locationForm = document.getElementById('location-form');

  // Listen for submit
  locationForm.addEventListener('submit', onSubmit);

  // Do the geocoding for the addresses and make the Lyft API call
  function geocode(e) {

    // Prevent actual submit
    e.preventDefault();

    // Get the values of the "to" and "from" text inputs
    var location = document.getElementById('address').value;
    var destination = document.getElementById('destination').value;

    // Initialize output
    if ($(`#output`)) {
      $(`#output`).remove();
    }

    var startLat, startLng, endLat, endLng;

    // Use Axios.js AJAX to get location geocode
    // Welcome to the "promise land"

    // Get starting location geocode
    axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: location,
        key: 'AIzaSyAaODN8BfiLaVS7586DIEwayLiCIuVBWzw'
      }
    }).then(function (locationResponse) {

      // Get destination geocode
      axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: destination,
          key: 'AIzaSyAaODN8BfiLaVS7586DIEwayLiCIuVBWzw'
        }
      }).then(function (destinationResponse) {

        // Get coordinates from responses
        startLat = locationResponse
          .data
          .results[0]
          .geometry
          .location
          .lat;

        startLng = locationResponse
          .data
          .results[0]
          .geometry
          .location
          .lng;

        endLat = destinationResponse
          .data
          .results[0]
          .geometry
          .location
          .lat;

        endLng = destinationResponse
          .data
          .results[0]
          .geometry
          .location
          .lng;

        // Use Axios.js AJAX get method for Lyft API call
        axios.get(`https://cors-anywhere.herokuapp.com/https://api.lyft.com/v1/cost?start_lat=${startLat}&start_lng=${startLng}&end_lat=${endLat}&end_lng=${endLng}`)
          .then(function (lyftResponse) {

            // list will contain the data from the Lyft response or an error message
            var list;

            // If the response from Lyft has no data, show error, else show data
            if (lyftResponse.data.cost_estimates.length === 0) {
              list = list = $(`<ul>`)
                .append($(`<li>`).text(`Lyft can't take you on this trip...`));
              addLyftCard(false, list);
            }
            else {
              var fareMin = lyftResponse.data.cost_estimates[0].estimated_cost_cents_min;
              var fareMax = lyftResponse.data.cost_estimates[0].estimated_cost_cents_max;
              var distance = lyftResponse.data.cost_estimates[0].estimated_distance_miles;
              var timeOfTravel = lyftResponse.data.cost_estimates[0].estimated_duration_seconds;
              list = $(`<ul>`)
                .append($(`<li>`).text(`$${fareMin / 100} - $${fareMax / 100}`))
                .append($(`<li>`).text(`${distance} miles`))
                .append($(`<li>`).text(`${Math.round(timeOfTravel / 60) ? Math.round(timeOfTravel / 60) : 'Less than zero'} minutes`));
              addLyftCard(true, list);
            }
          });
          var settings = {
            "async": true,
            "crossDomain": true,
            "url": `https://api.uber.com/v1.2/estimates/price?start_latitude=${startLat}&start_longitude=${startLng}&end_latitude=${endLat}&end_longitude=${endLng}`,
            "method": "GET",
            "headers": {
              "authorization": "Token v-UA8A2to_68Jm6Tpn03GQ0wi52HBB0oA1f1v91a",
              "cache-control": "no-cache",
              "postman-token": "a4c6b084-95d7-d347-a347-1875be72a17b"
            }
          };
          
          $.ajax(settings).done(function (response) {
            console.log(`Uber response`, response);
          });

      })
        .catch(function (error) {
          console.log(error)
        });
    });
  }

  // Draw the route on the map
  function drawRoute(e) {

    // Prevent form submission
    e.preventDefault();

    // Initialize the map
    initMap();

    // Initialize the directions and renderer objects
    var directions = new google.maps.DirectionsService();
    var renderer = new google.maps.DirectionsRenderer();

    // Get the to and from addresses
    var address = document.getElementById('address').value;
    var destination = document.getElementById('destination').value;

    // Draw the directions
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

  // Bundle function for Submit button onclick callback
  function onSubmit(e) {
    geocode(e);
    drawRoute(e);
  }

  // Helper function to compose and display the Lyft response card
  function addLyftCard(goodResponse, listData) {
    var output = $(`<div>`).addClass(`col s12 m6`).attr(`id`, `output`);
    var card;
    if (goodResponse) {
      card = $(`<div>`).addClass(`card-panel red lighten-5`);
    }
    else {
      card = $(`<div>`).addClass(`card-panel blue-grey lighten-5`);
    }
    var cardContent = $(`<div>`).addClass(`card-content black-text`);
    var lyftImg = $(`<img>`)
      .attr(`src`, `./assets/img/Lyft_Logo_Pink.png`)
      .attr(`width`, `100`);
    cardContent.append(lyftImg)
    cardContent.append(listData);
    card.append(cardContent);
    output.append(card);
    $(`#input-col`).addClass(`m6`);
    $(`#main-row`).append(output);
  }
});

