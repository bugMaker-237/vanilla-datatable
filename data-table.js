(function(window) {
  function MultiSearch(options) {
    options = options || {};
    this.dataSource =
      options.dataSource || throwIfundefined("dataSource is undefined");
    this.dataSource = throwIfNotArray(
      this.dataSource,
      "dataSource is not an array"
    );
    this.filterSelector = options.filterSelector || "[m-s-filter]";
    this.dataSourceLoader = options.dataSourceLoader || noop;
    this.inputFilters = [];
    this.setFilters();
  }

  MultiSearch.prototype.setFilters = function() {
    document.querySelectorAll(this.filterSelector).forEach(
      /**
       *
       * @param {HTMLInputElement} elt
       */
      function(elt) {
        var filter = elt.getAttribute(
          this.filterSelector.substr(1, this.filterSelector.length - 2)
        );
        this.inputFilters.push({ filter: filter, element: elt });

        elt.addEventListener("input", this.filterChangeHandler.bind(this));
      }.bind(this)
    );
  };

  MultiSearch.prototype.filterChangeHandler =
    /**
     *
     * @param {InputEvent} event
     */
    function(event) {
      var finalArray = [];
      for (var i = 0; i < this.dataSource.length; i++) {
        const d = this.dataSource[i];
        var canBePushed = undefined; // <- if not set explicitly the value will be reduced after next iteration since variable is not scoped
        for (var j = 0; j < this.inputFilters.length; j++) {
          const inputFilter = this.inputFilters[j];
          const inputValue = inputFilter.element.value;
          if (inputValue == null || inputValue.trim() == "") continue;

          var res =
            d[inputFilter.filter]
              .toString()
              .toLowerCase()
              .indexOf(inputValue.toLowerCase()) > -1;

          canBePushed =
            typeof canBePushed !== "undefined" ? canBePushed && res : res;

          if (!canBePushed) break;
        }
        if (canBePushed) finalArray.push(d);
      }

      finalArray =
        finalArray.length == 0 && this.areInputsEmpty()
          ? this.dataSource
          : finalArray;

      this.dataSourceLoader(finalArray);
    };

  MultiSearch.prototype.areInputsEmpty = function() {
    var isEmpty;
    for (let j = 0; j < this.inputFilters.length; j++) {
      const inputFilter = this.inputFilters[j];
      const inputValue = inputFilter.element.value;
      var res = inputValue == null || inputValue == "";
      isEmpty = typeof isEmpty !== "undefined" ? isEmpty && res : res;
    }
    return isEmpty;
  };
  function throwIfundefined(msg = "Error") {
    throw new Error(msg);
  }
  function throwIfNotArray(obj, msg = "Error") {
    if (!Array.isArray(obj)) throw new Error(msg);
    return obj;
  }

  function noop() {}

  window.MultiSearch = MultiSearch;
})(window);
