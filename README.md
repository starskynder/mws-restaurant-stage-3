# mws-restaurant-stage-3


In main.js and restaurant_info.js insert your GOOGLE MAPS API KEY in the loadScript() function (bottom of the files) in order for the ap
p to retrieve the Maps. <br>
Replace this string --> "https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places&callback=initMap" .<br>
You may need to un-gzip both files to insert the Api key (read below).<br>

The app contains both gzip and non gzip files. Allow the server to fetch gzip in order to obtain better performance.<br>

Every page in the app have inline CSS to optimize the Critical Rendering Path and improve perfomance.<br>

In order to let the "sync" event work in the service worker, for both "sync-new-posts" and "sync-favorites" ,
you need to run the server on localhost:1337 or replace this urls minding the __${id}__ part: <br>
1)`http://localhost:1337/restaurants/${id}/?is_favorite=false` <br>
2) `http://localhost:1337/restaurants/${id}/?is_favorite=true`

 

The Audits folder contains lighthouse report: a json file and an html file.

