var CACHE_STATIC_NAME = "static-v2";
var CACHE_DYNAMIC_NAME = "dynamic-v1";

const STATIC_LIST = [
  "/",
  "/index.html",
  "/src/css/app.css",
  "/src/css/main.css",
  "/src/js/main.js",
  "/src/js/material.min.js",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(function(cache) {
      cache.addAll(STATIC_LIST);
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(
        keyList.map(function(key) {
          if (key !== CACHE_STATIC_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 1. Identification exercise: Cache with Network fallback
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function(res) {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(function(cache) {
                  cache.put(event.request.url, res.clone());
                  return res;
                });
            })
            .catch(function(err) {

            });
        }
      })
  );
});

// 2. Network only strategy
self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
})

// 3. Cache only
self.addEventListener('fetch', function(event) {
  event.respondWith(caches.match(event.request));
})

// 4. Network, cache fallback
self.addEventListener("fetch", function(event) {
  event.respondWith(
    fetch(event.request).then(res => {
      return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
        cache.put(event.request.url, res.clone());
        return res;
      })
    }).catch(() => {
      return caches.match(event.request.url);
    })
  );
});

// 5. Cache, then network
// self.addEventListener("fetch", function(event) {
//   event.respondWith(caches.match(event.request.url).then(resp => {
//     if (resp) {
//       return resp;
//     }
//     return fetch(event.request);
//   }))
// })

// 6. Routing/URL Parsing: Cache then network, Cache with network fallback, Cache Only
self.addEventListener("fetch", event => {
  const url = 'https://httpbin.org/ip';
  if(event.request.url.indexOf(url) !== -1) {
    event.respondWith(
      caches.open(CACHE_DYNAMIC_NAME)
        .then(function (cache) {
          return fetch(event.request)
            .then(function(res) {
              cache.put(event.request, res.clone());
              return res;
            })
        })
    )
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if(response) return response;

          return fetch(event.request)
            .then(function(res) {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(function (cache) {
                  cache.put(event.request.url, res.clone());
                  return res;
                })
            })
            .catch(function (err) {
               return caches.open(CACHE_STATIC_NAME)
                 .then(function (cache) {
                   return cache.match('/offline.html');
                 })
            })
        })
    )

  }
});
