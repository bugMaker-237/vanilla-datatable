(function(window) {
  function DataTableFilter(options) {
    options = options || {};
    this.initialDataSource =
      options.dataSource || throwIfundefined("dataSource is undefined");
    this.initialDataSource = throwIfNotArray(
      this.initialDataSource,
      "dataSource is not an array"
    );
    this.filterSelector = options.filterSelector || "[m-s-filter]";
    this.paginatorSelector = options.paginatorSelector || "[m-s-page]";
    this.dataSourceLoader = options.dataSourceLoader || noop;
    this.inputFilters = [];
    this.isDeferred = options.isDeferred;
    this.deferredQueryLoader =
      options.deferredQueryLoader ||
      (options.isDeferred
        ? throwIfundefined("deferredQueryLoader is undefined")
        : noop);
    this.deferredPromise = null;
    this.itemsPerPage = options.itemsPerPage;
    this.hasPagination = options.hasPagination;
    this.setFilters();
    if (this.hasPagination) this.linkPaginations();
  }
  DataTableFilter.prototype.linkPaginations = function() {
    document.querySelectorAll(this.paginatorSelector).forEach(
      function(elt) {
        elt.addEventListener(
          "click",
          function(event) {
            event.stopImmediatePropagation();
            var page = event.target.getAttribute(
              this.paginatorSelector.substr(
                1,
                this.paginatorSelector.length - 2
              )
            );
            this.paginate(page);
          }.bind(this)
        );
      }.bind(this)
    );
  };
  DataTableFilter.prototype.setFilters = function() {
    document.querySelectorAll(this.filterSelector).forEach(
      function(elt) {
        var filter = elt.getAttribute(
          this.filterSelector.substr(1, this.filterSelector.length - 2)
        );
        this.inputFilters.push({ filter: filter, element: elt });

        elt.addEventListener(
          "input",
          this.isDeferred
            ? DeferredFilterChangeHandler.bind(this)
            : filterChangeHandler.bind(this)
        );
      }.bind(this)
    );
  };

  function DeferredFilterChangeHandler(event) {
    var inputValueMap = this.getInputValueMap();
    if (this.deferredPromise) {
      this.deferredPromise.cancel();
    }
    this.deferredPromise = makeCancelablePromise(
      this.deferredQueryLoader(inputValueMap)
    );
    this.deferredPromise.promise.then(
      function(res) {
        this.fillDataTable(res);
      }.bind(this)
    );
  }
  function makeCancelablePromise(promise) {
    var hasCanceled = false;
    var wrappedPromise = new Promise(function(res, rej) {
      promise.then(
        function(value) {
          if (hasCanceled) rej({ isCanceled: true });
          else res(value);
        }.bind({ res: res, rej: rej, hasCanceled: hasCanceled }),
        function(error) {
          if (hasCanceled) rej({ isCanceled: true });
          else rej(value);
        }.bind({ rej: rej, hasCanceled: hasCanceled })
      );
    });
    return {
      promise: wrappedPromise,
      cancel: function() {
        hasCanceled = false;
      }.bind({ hasCanceled })
    };
  }

  function filterChangeHandler(event) {
    var finalArray = [];
    var inputValueMap = this.getInputValueMap();
    for (var i = 0; i < this.initialDataSource.length; i++) {
      const d = this.initialDataSource[i];
      var canBePushed = undefined; // <- if not set explicitly the value will be reduced after next iteration since variable is not scoped
      for (var j = 0; j < inputValueMap.length; j++) {
        const inputFilter = inputValueMap[j].filter;
        const inputValue = inputValueMap[j].value;
        if (inputValue == null || inputValue.trim() == "") continue;

        var res =
          d[inputFilter]
            .toString()
            .toLowerCase()
            .indexOf(inputValue.toLowerCase()) > -1;
        canBePushed =
          typeof canBePushed !== "undefined" ? canBePushed && res : res;

        if (!canBePushed) break;
      }
      if (canBePushed) finalArray.push(d);
    }
    this.fillDataTable(finalArray);
  }
  DataTableFilter.prototype.fillDataTable = function(filteredDataSource = []) {
    var finalArray =
      filteredDataSource.length == 0 && this.areInputsEmpty()
        ? this.initialDataSource
        : filteredDataSource;

    this.actualDataSource = finalArray;
    this.paginate();
  };
  DataTableFilter.prototype.paginate = function(pageNumber = 1) {
    if (this.hasPagination && this.itemsPerPage) {
      var endIndex = this.itemsPerPage * pageNumber - 1;
      var startIndex = endIndex - this.itemsPerPage + 1;
      this.dataSourceLoader(this.actualDataSource.slice(startIndex, endIndex));
    } else {
      this.dataSourceLoader(this.actualDataSource);
    }
  };
  DataTableFilter.prototype.getInputValueMap = function() {
    return this.inputFilters.map(function(i) {
      return {
        filter: i.filter,
        value: i.element.value
      };
    });
  };
  DataTableFilter.prototype.areInputsEmpty = function() {
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

  window.DataTableFilter = DataTableFilter;
})(window);
