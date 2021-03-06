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
              addCard(false, list, 'lyft');
            }
            else {
              var fareMin = lyftResponse.data.cost_estimates[0].estimated_cost_cents_min;
              var fareMax = lyftResponse.data.cost_estimates[0].estimated_cost_cents_max;
              var distance = lyftResponse.data.cost_estimates[0].estimated_distance_miles;
              var timeOfTravel = lyftResponse.data.cost_estimates[0].estimated_duration_seconds;
              list = $(`<ul>`)
                .append($(`<li>`).text(`US $${fareMin / 100} - $${fareMax / 100}`))
                .append($(`<li>`).text(`${distance} miles`))
                .append($(`<li>`).text(`${Math.round(timeOfTravel / 60) ? Math.round(timeOfTravel / 60) : 'Less than zero'} minutes`));
              addCard(true, list, 'lyft');
            }
          })
          .catch(function (error) {
            list = list = $(`<ul>`)
              .append($(`<li>`).text(`Lyft can't take you on this trip...`));
            addCard(false, list, 'lyft');
          });

        // Uber call
        var settings = {
          "async": true,
          "crossDomain": true,
          "url": `https://cors-anywhere.herokuapp.com/https://api.uber.com/v1.2/estimates/price?start_latitude=${startLat}&start_longitude=${startLng}&end_latitude=${endLat}&end_longitude=${endLng}`,
          "method": "GET",
          "headers": {
            "authorization": "Token v-UA8A2to_68Jm6Tpn03GQ0wi52HBB0oA1f1v91a",
            "cache-control": "no-cache",
            "postman-token": "a4c6b084-95d7-d347-a347-1875be72a17b"
          }
        };

        axios(settings)
          .then(function (uberResponse) {

            // list will contain the data from the Uber response or an error message
            var list;

            // If the response from Uber has data, show data
            var estimate = uberResponse.data.prices[0].estimate;
            var distance = uberResponse.data.prices[0].distance;
            var timeOfTravel = uberResponse.data.prices[0].duration;
            list = $(`<ul>`)
              .append($(`<li>`).text(estimate))
              .append($(`<li>`).text(`${distance} miles`))
              .append($(`<li>`).text(`${Math.round(timeOfTravel / 60) ? Math.round(timeOfTravel / 60) : 'Less than zero'} minutes`));
            addCard(true, list, 'uber');

          })
          .catch(function (error) {
            // If Uber returns an error
            list = list = $(`<ul>`)
              .append($(`<li>`).text(`Uber can't take you on this trip...`));
            addCard(false, list, 'uber');
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
    // Shrink/resize input fields
    if (!($(`#input-col`).hasClass(`l4`))) {
      $(`#input-col`).addClass(`l4`);
    }

    // Initialize output
    var searchBars = $(`#input-col`)
    $(`#main-row`).empty();
    $(`#main-row`).append(searchBars);

    geocode(e);
    drawRoute(e);
  }

  // Helper function to compose and display the Lyft response card
  function addCard(goodResponse, listData, uberOrLyft) {
    var output = $(`<div>`).addClass(`col s12 m12 l4 card-output`);
    var card;
    if (goodResponse && uberOrLyft === 'lyft') {
      card = $(`<div>`).addClass(`card-panel red lighten-5 card-height`);
    }
    else if (goodResponse && uberOrLyft === 'uber') {
      card = $(`<div>`).addClass(`card-panel grey lighten-1 card-height`);
    }
    else {
      card = $(`<div>`).addClass(`card-panel blue-grey lighten-5`);
    }
    var cardContent = $(`<div>`).addClass(`card-content black-text`);
    var companyLogo = $(`<img>`);
    if (uberOrLyft === 'uber') {
      companyLogo
        .attr(`src`, `./assets/img/uberLogo.png`)
        .attr(`width`, `100`);
    }
    else {
      companyLogo
        .attr(`src`, `./assets/img/Lyft_Logo_Pink.png`)
        .attr(`width`, `100`);
    }
    cardContent.append(companyLogo)
    cardContent.append(listData);
    card.append(cardContent);
    output.append(card);
    $(`#main-row`).append(output);
  }

});

