// make a global 'fields' object with the url args
var fields = function () {
  var out_fields = {};
  var query_fields = window.location.search.split('?')[1];
  if( query_fields ) {
    query_fields = query_fields.split('&');
    for( var i in query_fields ) {
      var raw = query_fields[i].split('=');
      if( raw.length > 1 )
        out_fields[raw[0]] = raw[1];
    }
  }
  console.log( out_fields );
  return out_fields;
}();
