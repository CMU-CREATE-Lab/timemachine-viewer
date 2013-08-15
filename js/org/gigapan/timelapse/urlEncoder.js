// @license
// Redistribution and use in source and binary forms ...

// This class allows for the encoding/decoding to and from base-64 of unsigned integers
// (that are either variable or fixed in length), unsigned fixed point decimals, fixed
// point decimals in the range of -90 to 90 (for use as latitude), fixed point decimals
// in the range of -180 to 180 (for use as longitude), and strings.
// Caution must be taken when reading strings, as they may contain unsafe user input.
// See the comment above the unsafe_string_read() method below for the proper convention
// that must be adhered to.
//
// Dependencies: None
//
// Copyright 2013 Carnegie Mellon University. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//    conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//    of conditions and the following disclaimer in the documentation and/or other materials
//    provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of Carnegie Mellon University.
//
// Authors:
// Randy Sargent (randy.sargent@cs.cmu.edu)

"use strict";

var org;
org = org || {};
org.gigapan = org.gigapan || {};
org.gigapan.timelapse = org.gigapan.timelapse || {};

org.gigapan.timelapse.UrlEncoder = function(encoded) {
  this.encoded = encoded || "";
  // These are the "unreserved" chars, minus ~ (which is URLencoded by thunderbird)
  // and . (which might be left off by an emailer if at the end of an URL)
  // Also happens to be the RFC 4648 URL base-64 charset
  this.CODE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  this.SINGLE_CHAR_THRESH = 32;

  // Variable-length encoding
  // x
  // (x % N_MULTI) (x / N_MULTI)
  // ... (x % N_MULTI) (x / N_MULTI)

  // Encodes unsigned integer using variable-length encoding
  this.write_uint = function(x) {
    x = Math.round(x);
    if (x < 0) {
      x = 0;
    }
    while (x >= this.SINGLE_CHAR_THRESH) {
      // Non-terminating character is always in the range CODE[SINGLE_CHAR_THRESH <= i]
      this.encoded += this.CODE[this.SINGLE_CHAR_THRESH + x % (this.CODE.length - this.SINGLE_CHAR_THRESH)];
      x = Math.floor(x / (this.CODE.length - this.SINGLE_CHAR_THRESH));
    }
    // Terminating character is always in the range CODE[0 <= i < SINGLE_CHAR_THRESH]
    this.encoded += this.CODE[x];
  }

  // Decodes unsigned integer using variable-length encoding
  // Returns null if invalid encoding
  this.read_uint = function() {
    var decoded = 0;
    var significance = 1;
    for (var i = 0; true; i++) {
      if (i >= this.encoded.length) {
        return null;
      }
      var index = this.CODE.indexOf(this.encoded[i]);
      if (index < 0) {
        return null;
      }
      if (index < this.SINGLE_CHAR_THRESH) {
        this.encoded = this.encoded.substr(i + 1);
        return decoded + index * significance;
      }
      decoded += (index - this.SINGLE_CHAR_THRESH) * significance;
      significance *= (this.CODE.length - this.SINGLE_CHAR_THRESH);
    }
  }

  // Encodes unsigned integer in range 0 <= x < (64 ^ nchars) using fixed-length little-endian base-64 encoding.
  this.write_uint_fixed = function(nchars, x) {
    x = Math.round(x);
    if (x < 0) {
      x = 0;
    }
    if (x >= Math.pow(this.CODE.length, nchars)) {
      x = Math.pow(this.CODE.length, nchars) - 1;
    }
    for (var i = 0; i < nchars; i++) {
      this.encoded += this.CODE[x % this.CODE.length];
      x = Math.floor(x / this.CODE.length);
    }
  }

  // Decodes unsigned integer in range 0 <= x < (64 ^ nchars) using fixed-length encoding.
  // Returns null if invalid encoding.
  this.read_uint_fixed = function(nchars) {
    if (this.encoded.length < nchars) {
      return null;
    }
    var decoded = 0;
    var significance = 1;
    for (var i = 0; i < nchars; i++) {
      var index = this.CODE.indexOf(this.encoded[i]);
      if (index < 0) {
        return null;
      }
      decoded += index * significance;
      significance *= this.CODE.length;
    }
    this.encoded = this.encoded.substr(nchars);
    return decoded;
  }

  // Write unsigned fixed-point number, with decimal_digits digits of precision (in base 10) after the decimal
  this.write_udecimal = function(num, decimal_digits) {
    return this.write_uint(Math.round(num * Math.pow(10, decimal_digits)));
  }

  // Read unsigned fixed-point number, with decimal_digits digits of precision (in base 10) after the decimal
  this.read_udecimal = function(decimal_digits) {
    return this.read_uint() / Math.pow(10, decimal_digits);
  }

  // Lat is in the range -90 to 90, and is stored with 5 digits after the decimal, e.g. 89.76543
  this.write_lat = function(lat) {
    this.write_uint_fixed(4, Math.round((lat + 90) * 8e4));
  }

  this.read_lat = function() {
    return this.read_uint_fixed(4) / 8e4 - 90;
  }

  // Lon is in the range -180 to 180, and is stored with 5 digits after the decimal,
  // with the limitation that the last digit is rounded to the nearest of (0,2,4,5,6,8).
  // E.g. 179.65432
  this.write_lon = function(lon) {
    this.write_uint_fixed(4, Math.round((lon + 180) * 4e4));
  }

  this.read_lon = function() {
    return this.read_uint_fixed(4) / 4e4 - 180;
  }

  // Strings are URL-encoded and terminated with "_".  It supports unicode strings.
  this.string_delimeter = "_";

  this.write_string = function(str) {
    for (var i = 0; i < str.length; i++) {
      if (this.CODE.indexOf(str[i]) >= 0 && str[i] != this.string_delimeter) {
        this.encoded += str[i];
      } else if (encodeURIComponent(str[i]).length > 1) {
        this.encoded += encodeURIComponent(str[i]);
      } else {
        this.encoded += "%" + str.charCodeAt(i).toString(16).toUpperCase();
      }
    }
    this.encoded += this.string_delimeter;
  }

  // Decodes string.  Returns null if invalid encoding
  // Any variable that stores the return value from this method should be marked as unsafe,
  // since they may contain user inputted data.
  // Specifically, they must follow the convention of being appended with "unsafe_string_"
  this.read_unsafe_string = function() {
    var delim = this.encoded.indexOf(this.string_delimeter);
    if (delim < 0) {
      return null;
    }
    var decoded = decodeURIComponent(this.encoded.substr(0, delim));
    this.encoded = this.encoded.substr(delim + 1);
    return decoded;
  }
}
