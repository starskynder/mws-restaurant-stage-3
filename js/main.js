/**
 * Polyfill for parentNode.append() method for MS Edge
 */

// Source: https://github.com/jserz/js_piece/blob/master/DOM/ParentNode/append()/append().md
(function(arr) {
  arr.forEach(function(item) {
    if (item.hasOwnProperty("append")) {
      return;
    }
    Object.defineProperty(item, "append", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function append() {
        var argArr = Array.prototype.slice.call(arguments),
          docFrag = document.createDocumentFragment();

        argArr.forEach(function(argItem) {
          var isNode = argItem instanceof Node;
          docFrag.appendChild(
            isNode ? argItem : document.createTextNode(String(argItem))
          );
        });

        this.appendChild(docFrag);
      }
    });
  });
})([Element.prototype, Document.prototype, DocumentFragment.prototype]);

let restaurants, neighborhoods, cuisines;
let map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
 
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option1 = document.createElement("option");
    option1.innerHTML = cuisine;
    option1.value = cuisine;
    select.appendChild(option1);
  });
};

/**
 * Initialize Google map, called from HTML.
 */

window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  self.map.addListener("tilesloaded", setMapTitle);
  updateRestaurants();
};

/**
 * Set Google Maps title and html lang
 */
setMapTitle = () => {
  const mapFrame = document.querySelector("#map").querySelector("iframe");
  mapFrame.setAttribute("title", "Google maps with restaurant location");

  const htmlFrame = document.querySelector("#map").querySelector("iframe")
    .contentWindow;
  const htmlLang = htmlFrame.document.getElementsByTagName("html")[0];

  
  htmlLang.setAttribute("lang", "en");
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};
updateRestaurants();
/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  /**
   * If no match is found for the current restaurant + cuisine create a "no match" warning message.
   * */
  if (restaurants.length === 0) {
    const noMatch = document.createElement("li");
    noMatch.id = "no-match";
    const noMatchText = document.createElement("div");
    noMatchText.innerHTML = "<h2>No Match Found</h2>";
    noMatch.append(noMatchText);
    ul.append(noMatch);
    const noMatchImg = document.createElement("img");
    noMatchImg.src = "../img/no-match.png";
    noMatchImg.setAttribute("alt", " ");

    noMatch.append(noMatchImg);
  }
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  if (typeof google === "object" && typeof google.maps === "object") {
    addMarkersToMap();
  }
};

/**
 * Create restaurant HTML.
 */

createRestaurantHTML = restaurant => {
  const li = document.createElement("li");
  const image = document.createElement("img");
  image.className = "restaurant-img lazyload";

  // Set images alt attribute.
  image.alt = `Image from ${restaurant.name} restaurant`;
  const imageDest = DBHelper.imageUrlForRestaurant(restaurant);

  // Set images srcset  and sizes attributes.
 

  const setSourcet = `img/${imageDest}-1x.jpg 1x, img/${imageDest}-1x.webp 1x , img/${imageDest}-2x.jpg 2x, img/${imageDest}-2x.webp 2x`;
  image.setAttribute("data-srcset", setSourcet);
  image.setAttribute("data-sizes", "auto");

  image.setAttribute("data-src", `img/${imageDest}-2x.jpg`);
  

  li.append(image);

  const name = document.createElement("h2");
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement("a");
  more.innerHTML = "View Restaurant Details";
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  if (google.maps.event) {
    restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
      google.maps.event.addListener(marker, "click", () => {
        window.location.href = marker.url;
      });
      self.markers.push(marker);
    });
  }
};
var buttonMap = document.getElementById("hidemap");
buttonMap.addEventListener("click", loadScript, false);



//If nav button "Google Map" is clicked generate a click event on "Click to view Map" that load the map
let goToMap = document.getElementById("toTheMap");
goToMap.addEventListener(
  "click",
  function() {
    simulateClick(buttonMap);
  },
  false
);

let simulateClick = function(elem) {
  // Create our event (with options)
  let evt = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window
  });
  // If cancelled, don't dispatch our event
  let canceled = !elem.dispatchEvent(evt);
};





function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src =
    "https://maps.googleapis.com/maps/api/js?key=AIzaSyALWr-o4S736QQLqMiNGZnUvv0QwyyXYUo&libraries=places&callback=initMap";
  script.setAttribute("async", true);
  script.setAttribute("defer", true);
  document.body.appendChild(script);
  displayMap();
  buttonMap.removeEventListener("click", loadScript, false);

  return false;
}
function displayMap() {
  document.getElementById("map-container").style.display = "block";
}
