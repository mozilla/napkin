define(function() {
  return {
    /* Gets the project ID, screen ID, and whether share mode is active via the URL.
     * Returns: { projectId: <project ID>, screenId: <screen ID>, share: <share mode> }
     */
    getUrlData: function() {
      if (this.cachedScreenUrlData) {
        return this.cachedScreenUrlData;
      }

      var requestPath = window.location.pathname;
      var matches = /^\/(\w+)(\/(\d+))?\/project\/(\d+)\/screen\/(\d+)\/?$/.exec(requestPath);

      if (!matches) {
        return false;
      }

      // cache url data, as it does not change
      this.cachedScreenUrlData = {
        projectId: parseInt(matches[4], 10),
        screenId: parseInt(matches[5], 10),
        isSharePage: matches[1] === 'share'
      };
      return this.cachedScreenUrlData;
    },

    /* Check whether the current page is the screen share page.
     * Returns: true if this is the screen share page and false otherwise
     */
    isSharePage: function() {
      var urlData = this.getUrlData();
      return urlData.isSharePage;
    }
  };
});
