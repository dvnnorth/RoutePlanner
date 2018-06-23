$(function () {

    // Initialize the sidenav bar
    $('.sidenav').sidenav();

    let map;
    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 29.7604, lng: -95.3698 },
            zoom: 8
        });
    }

    initMap();

    let lyftEndpoint = "https://api.lyft.com/v1/cost?start_lat=37.7763&start_lng=-122.3918&end_lat=37.7972&end_lng=-122.4533";

    axios.get(lyftEndpoint)
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });

});