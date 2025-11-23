
function getCoordintes(setLocationCallback) {
    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    function success(pos) {
        var crd = pos.coords;
        var lat = crd.latitude.toString();
        var lng = crd.longitude.toString();
        var coordinates = [lat, lng];
        // console.log(`Latitude: ${lat}, Longitude: ${lng}`);
        getDetails(coordinates, setLocationCallback);
        return;

    }

    function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    navigator.geolocation.getCurrentPosition(success, error, options);
}

// Step 2: Get names
function getDetails(coordinates, setLocationCallback) {
    var xhr = new XMLHttpRequest();
    var lat = coordinates[0];
    var lng = coordinates[1];

    // Paste your LocationIQ token below.
    xhr.open('GET', `https://us1.locationiq.com/v1/reverse.php?key=${my_location_api_key}&lat=${lat}&lon=${lng}&format=json`, true);
    xhr.send();
    xhr.onreadystatechange = processRequest;
    xhr.addEventListener("readystatechange", processRequest, false);

    return

    function processRequest(e) {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            // var city = response.address.city;
            // console.log(city);
            setLocationCallback(response.address)
            return;
        }
    }
}

const my_location_api_key = "pk.eaedea631fa3249e4681264747b4cffd";

/**
    setLocationState will eventually be called and passed an object with the following fields:

    government,
house_number,
road,
quarter,
suburb,
city,
state_district,
state,
postcode,
country,
country_code,
 
 */
function getLocale(setLocationState) {
    getCoordintes(setLocationState);
}

export default getLocale;