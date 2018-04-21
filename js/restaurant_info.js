let restaurant, map;

/**
 * Initialize Google map, called from loadScript.
 */
window.initMap = (restaurant = self.restaurant) => {
  self.map = new google.maps.Map(document.getElementById("map"), {
    zoom: 16,
    center: restaurant.latlng,
    scrollwheel: false
  });

  self.map.addListener("tilesloaded", setMapTitle);
  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
};

document.addEventListener("DOMContentLoaded", event => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
    }
  });
});

/**
 * Set Google Maps title and html lang
 */
setMapTitle = () => {
  const mapFrame = document.getElementById("map").querySelector("iframe");
  mapFrame.setAttribute("title", "Google maps with restaurant location");
  const htmlFrame1 = document
    .getElementById("map")
    .querySelector("iframe")
    .contentWindow.document.querySelector("html");

  console.log(htmlFrame1);
  htmlFrame1.setAttribute("lang", "en");
};
/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");

  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

var getReviewsURL = function() {
  const port = 1337; // Change this to your server port
  const index = window.location.href.indexOf("=");
  const id = window.location.href.slice(index + 1);

  return `http://localhost:${port}/reviews/?restaurant_id=${id}`;
};
/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  // Set images alt attribute.
  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.alt = `${restaurant.name} restaurant`;

  // Set images srcset  and sizes attributes.
  const imageDest = DBHelper.imageUrlForRestaurant(restaurant);

  const imageNumber = imageDest;

  const setSourcet = `img/${imageNumber}-1x.jpg 1x, img/${imageNumber}-1x.webp 1x , img/${imageNumber}-2x.jpg 2x, img/${imageNumber}-2x.webp 2x`;
  image.setAttribute("srcset", setSourcet);
  image.setAttribute("sizes", "(min-width: 416px) 320px");

  image.src = `img/${imageNumber}-2x.jpg`;

  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;
  if (restaurant.is_favorite === "true") {
    const favBtn = document.querySelector(".favorite_btn");
    favBtn.classList.remove("non-favorite");
    favBtn.innerHTML = "Unfav Restaurant";
    const star = document.querySelector(".star");
    star.style.color = "#ad034d";
  } else {
    const favBtn = document.querySelector(".favorite_btn");
    favBtn.innerHTML = "Fav Restaurant";
    favBtn.classList.add("non-favorite");
    const star = document.querySelector(".star");
    star.style.color = "#464444c7";
  }

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  getReviewsURL();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

getRestaurantReviews = () => {
  return fetch(getReviewsURL()).then(response => {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response.json();
  });
};

loadContentNetworkFirst();

/**
 * Create all reviews HTML and add them to the webpage.
 */
function loadContentNetworkFirst() {
  getRestaurantReviews() // get server data
    .then(dataFromNetwork => {
      fillReviewsHTML(dataFromNetwork); // display server data on page
      saveReviewsDataLocally(dataFromNetwork); // update local copy
    })
    .catch(err => {
      // if we can't connect to the server...
      console.log("Network requests have failed, this is expected if offline");
      getReviewsData() // attempt to get local data from IDB
        .then(offlineData => {
          if (!offlineData.length) {
            // alert user if there is no local data
            console.log("no data");
          } else {
            fillReviewsHTML(offlineData); // display local data on page
          }
        });
    });
}

getRestaurantReviews = () => {
  return fetch(getReviewsURL()).then(response => {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response.json();
  });
};

function saveReviewsDataLocally(reviews) {
  if (!("indexedDB" in window)) {
    return null;
  }

  return dbPromise.then(db => {
    const tx = db.transaction("reviews", "readwrite");
    const store = tx.objectStore("reviews");
    return Promise.all(reviews.map(review => store.put(review))).catch(() => {
      tx.abort();
      throw Error("reviews were not added to the store");
    });
  });
}

function getReviewsData() {
  if (!("indexedDB" in window)) {
    return null;
  }
  return dbPromise.then(db => {
    const tx = db.transaction("reviews", "readonly");
    const store = tx.objectStore("reviews");
    return store.getAll();
  });
}

fillReviewsHTML = reviews => {
  const container = document.getElementById("reviews-container");
  const title = document.createElement("h3");
  title.innerHTML = "REVIEWS";
  title.classList = "review-list_title";
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement("li");
  const name = document.createElement("p");
  name.innerHTML = review.name;
  name.classList = "reviewer";
  li.appendChild(name);

  const date = document.createElement("p");
  let secDate = new Date(review.createdAt);
  date.innerHTML = secDate.toLocaleDateString();
  li.appendChild(date);

  const rating = document.createElement("p");
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = "ratings";
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};

/**
 * Post a comment
 */
const restaurantId = window.location.href.slice(41);
document.getElementById("restId").value = restaurantId;

var buttonMap = document.getElementById("hidemap");
buttonMap.addEventListener("click", loadScript, false);

document
  .querySelector("#post-message")
  .addEventListener("submit", function(event) {
    event.preventDefault();
    const reviewerRate = document.querySelector('input[name="rating"]:checked');
    const reviewerName = document.getElementById("reviewer-name");

    const reviewComment = document.getElementById("comment");

    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready
        .then(function(sw) {
          var post = {
            date: new Date().toISOString(),
            restaurant_id: restaurantId,
            name: reviewerName.value,
            rating: reviewerRate.value,
            comments: reviewComment.value
          };
          writeData("sync-posts", post)
            .then(function() {
              return sw.sync.register("sync-new-posts");
            })
            .then(function(res) {
              console.log("you're post was saved for sync!");
              if (navigator.onLine) {
                window.location.reload();
              } else {
                document.getElementById("connectivity-message").style.display =
                  "block";
              }
            })
            .catch(function(err) {
              console.log(err);
            });

          console.log("registered");
        })
        .catch(function() {
          // system was unable to register for a sync,
          // this could be an OS-level restriction
          console.log("event 1");

          var comment = {
            restaurant_id: restaurantId,
            name: reviewerName.value,
            rating: reviewerRate.value,
            comments: reviewComment.value
          };
          fetch("http://localhost:1337/reviews/", {
            method: "POST",
            headers: new Headers({
              "content-type": "application/json"
            }),
            body: JSON.stringify(comment)
          }).then(function(res) {
            if (res.ok) {
              window.location.reload();
            }
          });
        });
    } else {
      // serviceworker/sync not supported
      console.log("event 2");

      var comment = {
        restaurant_id: restaurantId,
        name: reviewerName.value,
        rating: reviewerRate.value,
        comments: reviewComment.value
      };
      return fetch("http://localhost:1337/reviews/", {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json"
        }),
        body: JSON.stringify(comment)
      }).then(function(res) {
        if (res.ok) {
          window.location.reload();
        }
      });
    }
  });

var offlineNotification = document.getElementById("offline");
function showIndicator() {
  offlineNotification.innerHTML = "You are currently offline.";
  offlineNotification.className = "showOfflineNotification";
}
function hideIndicator() {
  offlineNotification.className = "hideOfflineNotification";
  document.getElementById("connectivity-message").style.display = "none";
}
window.addEventListener("online", hideIndicator);
window.addEventListener("offline", showIndicator);

document
  .querySelector(".favorite_btn")
  .addEventListener("click", function(event) {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      let trueOrFalse;
      if (this.classList.contains("non-favorite")) {
        trueOrFalse = true;
        this.innerHTML = "Unfav Restaurant";
        this.classList.remove("non-favorite");
        document.getElementsByClassName("star")[0].style.color = "#ad034d";
      } else {
        trueOrFalse = false;
        this.innerHTML = "Fav Restaurant";
        this.classList.add("non-favorite");
        document.getElementsByClassName("star")[0].style.color =
          "rgba(70, 68, 68, 0.781)";
      }
      navigator.serviceWorker.ready.then(function(sw) {
        var fav = {
          date: new Date().toISOString(),
          favOrNot: trueOrFalse,
          id: restaurantId
        };
        writeData("favorite-rests", fav)
          .then(function() {
            return sw.sync.register("sync-favorites");
          })
          .catch(function(err) {
            console.log(err);
          });
      });
    } else {
      // serviceworker/sync not supported
      favoriteRest(event);
    }
  });

function favoriteRest(event) {
  console.log(event.target);
  console.log("hey");
  var target1 = event.target;
  console.log(target1.classList.contains("non-favorite"));
  if (target1.classList.contains("non-favorite")) {
    console.log("here!");
    target1.innerHTML = "Unfav Restaurant";
    target1.classList.remove("non-favorite");
    const port = 1337; // Change this to your server port
    const index = window.location.href.indexOf("=");
    const id = window.location.href.slice(index + 1);
    fetch(`http://localhost:${port}/restaurants/${id}/?is_favorite=true`, {
      method: "put"
    });
    document.getElementsByClassName("star")[0].style.color = "#ad034d";
  } else {
    console.log("there!");
    target1.innerHTML = "Fav Restaurant";
    target1.classList.add("non-favorite");
    const port = 1337; // Change this to your server port
    const index = window.location.href.indexOf("=");
    const id = window.location.href.slice(index + 1);
    fetch(`http://localhost:${port}/restaurants/${id}/?is_favorite=false`, {
      method: "put"
    });
    document.getElementsByClassName("star")[0].style.color =
      "rgba(70, 68, 68, 0.781)";
  }
}

function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src =
    "https://maps.googleapis.com/maps/api/js?key=AIzaSyALWr-o4S736QQLqMiNGZnUvv0QwyyXYUo&libraries=places&callback=initMap";
  document.getElementsByTagName("head")[0].appendChild(script);
  displayMap();
  buttonMap.removeEventListener("click", loadScript, false);

  return false;
}
function displayMap() {
  document.getElementById("map-container").style.display = "block";
}
