importScripts("js/idb.js");
importScripts("js/utility.js");

(function() {
  "use strict";
  var filesToCache = [
    ".",
    "index.html",
    "404.html",
    "restaurant.html",
    "offline.html",
    "js/idb.js",
    "img/1-2x.jpg",
    "img/1-1x.jpg",
    "img/1-2x.webp",
    "img/1-1x.webp",
    "img/2-2x.jpg",
    "img/2-1x.jpg",
    "img/2-2x.webp",
    "img/2-1x.webp",
    "img/3-2x.jpg",
    "img/3-1x.jpg",
    "img/3-2x.webp",
    "img/3-1x.webp",
    "img/4-2x.jpg",
    "img/4-1x.jpg",
    "img/4-2x.webp",
    "img/4-1x.webp",
    "img/5-2x.jpg",
    "img/5-1x.jpg",
    "img/5-2x.webp",
    "img/5-1x.webp",
    "img/6-2x.jpg",
    "img/6-1x.jpg",
    "img/6-2x.webp",
    "img/6-1x.webp",
    "img/7-2x.jpg",
    "img/7-1x.jpg",
    "img/7-2x.webp",
    "img/7-1x.webp",
    "img/8-2x.jpg",
    "img/8-1x.jpg",
    "img/8-2x.webp",
    "img/8-1x.webp",
    "img/9-2x.jpg",
    "img/9-1x.jpg",
    "img/9-2x.webp",
    "img/9-1x.webp",
    "img/10-2x.jpg",
    "img/10-1x.jpg",
    "img/10-2x.webp",
    "img/10-1x.webp",
    "img/food6-large.jpg",
    "img/food6-small.jpg",
    "img/no-match.png",
    "js/main.js",
    "js/restaurant_info.js",
    "js/dbhelper.js",
    "js/lazysizes.min.js",
    "js/utility.js"
  ];

  let staticCacheName = "pages-cache-v1";

  self.addEventListener("install", function(event) {
    console.log("Attempting to install service worker and cache static assets");
    event.waitUntil(
      caches.open(staticCacheName).then(function(cache) {
        return cache.addAll(filesToCache);
      })
    );
  });

  self.addEventListener("fetch", function(event) {
    if (event.request.url.indexOf("maps.google") !== -1) {
      return false;
    }
    if (
      event.request.cache === "only-if-cached" &&
      event.request.mode !== "same-origin"
    )
      return;
    event.respondWith(
      caches
        .match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }

          return (
            fetch(event.request)
              // Add fetched files to the cache
              .then(function(response) {
                // TODO 5 - Respond with custom 404 page
                if (response.status === 404) {
                  return caches.match("404.html");
                }

                return caches.open(staticCacheName).then(function(cache) {
                  if (
                    event.request.url.indexOf("maps.google") !== -1 &&
                    event.request.url !== url1
                  ) {
                    cache.put(event.request.url, response.clone());
                  }
                  return response;
                });
              })
          );
        })
        .catch(function(error) {
          //Respond with custom offline page
          console.log("Error, ", error);
          return caches.match("offline.html");
        })
    );
  });
  self.addEventListener("sync", function(event) {
    if (event.tag === "sync-new-posts") {
      event.waitUntil(
        readAllData("sync-posts").then(function(data) {
          for (var dt of data) {
            fetch("http://localhost:1337/reviews/", {
              method: "POST",
              body: JSON.stringify({
                restaurant_id: dt.restaurant_id,
                name: dt.name,
                rating: dt.rating,
                comments: dt.comments,
                date: dt.date
              })
            })
              .then(function(res) {
                if (res.ok) {
                  res.json().then(function(resData) {
                    deleteItemFromData("sync-posts", resData.date);
                  });
                }
              })
              .catch(function(err) {
                console.log("Error while sending data", err);
              });
          }
        })
      );
    }
    if (event.tag === "sync-favorites") {
      event.waitUntil(
        readAllData("favorite-rests").then(function(data) {
          for (var dt of data) {
            const id = dt.id;
            if (dt.favOrNot) {
              fetch(
                `http://localhost:1337/restaurants/${id}/?is_favorite=true`,
                {
                  method: "PUT",
                  body: JSON.stringify({
                    date: dt.date
                  })
                }
              )
                .then(function(res) {
                  if (res.ok) {
                    res.json().then(function(resData) {
                      deleteItemFromData("favorite-rests", resData.date);
                    });
                  }
                })
                .catch(function(err) {
                  console.log("Error while sending data", err);
                });
            } else {
              fetch(
                `http://localhost:1337/restaurants/${id}/?is_favorite=false`,
                {
                  method: "PUT",
                  body: JSON.stringify({
                    date: dt.date
                  })
                }
              )
                .then(function(res) {
                  if (res.ok) {
                    res.json().then(function(resData) {
                      deleteItemFromData("favorite-rests", resData.date);
                    });
                  }
                })
                .catch(function(err) {
                  console.log("Error while sending data", err);
                });
            }
          }
        })
      );
    }
  });
})();
