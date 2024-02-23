getAverageGameLength = function(gameLength) {
    var avg = 0;

    for (var i=0; i<gameLength.length; i++) {
         avg = avg + a[i];
     }

     avg = avg / gameLength.length;
     return avg;
 }

 module.exports = getAverageGameLength();