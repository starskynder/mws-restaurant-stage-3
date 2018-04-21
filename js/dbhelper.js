let dbPromise = idb.open("restaurants-store", 1, function(db) {
  if (!db.objectStoreNames.contains("restaurants")) {
    db.createObjectStore("restaurants", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("reviews")) {
    db.createObjectStore("reviews", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "date" });
  }
  if (!db.objectStoreNames.contains("favorite-rests")) {
    db.createObjectStore("favorite-rests", { keyPath: "date" });
  }
});

class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static fetchRestaurants(callback) {
    getServerData() // get server data
      .then(dataFromNetwork => {
        callback(null, dataFromNetwork);
        // display server data on page

        saveRestaurantDataLocally(dataFromNetwork); // update local copy of data in IDB
      })
      .catch(err => {
        // if we can't connect to the server...
        console.log(
          "Network requests have failed, this is expected if offline"
        );
        getRestaurantData() // attempt to get local data from IDB
          .then(offlineData => {
            callback(null, offlineData); // display local data on page
          });
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants

        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `${restaurant.id}`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    if (self.map) {
      const marker = new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),

        map: map,
        animation: google.maps.Animation.DROP
      });
      return marker;
    }
  }
}

function saveRestaurantDataLocally(restaurants) {
  if (!("indexedDB" in window)) {
    return null;
  }

  return dbPromise.then(db => {
    const tx = db.transaction("restaurants", "readwrite");
    const store = tx.objectStore("restaurants");
    return Promise.all(
      restaurants.map(restaurant => store.put(restaurant))
    ).catch(() => {
      tx.abort();
      throw Error("restaurants were not added to the store");
    });
  });
}

function getRestaurantData() {
  if (!("indexedDB" in window)) {
    return null;
  }
  return dbPromise.then(db => {
    const tx = db.transaction("restaurants", "readonly");
    const store = tx.objectStore("restaurants");
    return store.getAll();
  });
}
function getServerData() {
  return fetch(DBHelper.DATABASE_URL).then(response => {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response.json();
  });
}
