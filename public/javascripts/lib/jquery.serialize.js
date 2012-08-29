define(['jquery'], function($) {
  // given a form element, serialize its inputs into a JavaScript object
  $.fn.serializeObject = function() {
    var data = {};
    var array = this.serializeArray();

    // serializeArray returns an array in the form:
    // [
    //  {
    //    name: 'inputName',
    //    value: 'inputValue'
    //  },
    //  {
    //    name: 'input2Name',
    //    value: 'inpu2Value'
    //  },
    //  ...
    // ];
    //
    // convert this to the form:
    // {
    //  inputName: 'inputValue',
    //  input2Name: 'input2Value'
    // }
    $.each(array, function() {
      if (data[this.name] !== undefined) {
        if (!data[this.name].push) {
          data[this.name] = [ data[this.name] ];
        }

        data[this.name].push(this.value || '');
      } else {
        data[this.name] = this.value || '';
      }
    });

    return data;
  };
});
