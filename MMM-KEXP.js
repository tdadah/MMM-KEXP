/* MagicMirror²
 * Module: MMM-KEXP
 *
 * By Tara Dadah https://tarad.dev
 * MIT Licensed.
 */
Module.register("MMM-KEXP", {
  // Default module config.
  defaults: {
    updateInterval: 30000, // 30s
    showApplication: true,
    initialLoadDelay: 0 // 0 seconds delay
  },

  kexpApiUrl:
    "https://api.kexp.org/v2/plays/?format=json&limit=1&ordering=-airdate",
  airDate: null,
  imageUri: null,
  thumbnailUri: null,
  songTitle: null,
  artist: null,
  albumTitle: null,
  labels: null,
  releaseDate: null,
  isLocal: null,
  isRequest: null,
  isLive: null,

  getTemplate: function () {
    if (this.airDate === null) return "loading.njk";
    if (this.songTitle === undefined) return "airbreak.njk";

    return "MMM-KEXP.njk";
  },

  getTemplateData: function () {
    return {
      config: this.config,
      thumbnailUri: this.thumbnailUri,
      artist: this.artist,
      albumTitle: this.albumTitle,
      songTitle: this.songTitle
    };
  },

  // Start the KEXP module.
  start: function () {
    Log.info(`KEXP song provider started.`);

    // Schedule the first update.
    this.scheduleUpdate(this.config.initialLoadDelay);
  },

  scheduleUpdate: function (delay = null) {
    let nextLoad = this.config.updateInterval;
    if (delay !== null && delay >= 0) {
      nextLoad = delay;
    }

    setTimeout(() => {
      this.fetchCurrentlyPlaying();
    }, nextLoad);
  },

  /*
   * Fetch currently playing data from KEXP API
   */
  fetchCurrentlyPlaying() {
    this.fetchData(() => this.updateAvailable());
  },

  getSongDetailsFromJsonResponse(responseBody) {
    const kexpInfoSongs = JSON.parse(responseBody);
    let song = kexpInfoSongs.results[0];

    this.airDate = song.airdate;
    this.imageUri = song.image_uri;
    this.thumbnailUri = song.thumbnail_uri;
    this.songTitle = song.song;
    this.artist = song.artist;
    this.albumTitle = song.album;
    this.labels = song.labels;
    this.releaseDate = song.release_date;
    this.isLocal = song.is_local;
    this.isRequest = song.is_request;
    this.isLive = song.is_live;

    Log.log(
      `KEXP data: ${this.songTitle}, ${this.albumTitle}, ${this.artist}, ${this.thumbnailUri}`
    );
  },

  updateAvailable: function () {
    this.updateDom(0);
    this.scheduleUpdate();
  },

  fetchData: async function (onCompleteCallback) {
    const self = this;

    const xhr = new XMLHttpRequest();
    xhr.open("GET", self.kexpApiUrl, true);
    xhr.onreadystatechange = function onReadyStateChange() {
      if (this.readyState === 4) {
        if (this.status === 200) {
          self.getSongDetailsFromJsonResponse(this.response);
          onCompleteCallback();
        } else {
          Log.error(
            self.name,
            `MMM-KEXP: Failed to load data. XHR status: ${this.status}`
          );
        }
      }
    };

    xhr.send();
  }
});
