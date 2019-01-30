/**
 * @license
 * Redistribution and use in source and binary forms ...
 *
 * Class for Tile index
 *
 * Dependencies:
 *  None
 *
 * Copyright 2011 Carnegie Mellon University. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of
 *    conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list
 *    of conditions and the following disclaimer in the documentation and/or other materials
 *    provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ''AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * The views and conclusions contained in the software and documentation are those of the
 * authors and should not be interpreted as representing official policies, either expressed
 * or implied, of Carnegie Mellon University.
 *
 * Authors:
 *  Randy Sargent (randy.sargent@cs.cmu.edu)
 *
 */

// A tile has a level, row, and column
// Level 0 has 1x1=1 tiles; level 1 has 2x2=4 tiles; level 2 has 4x4=16 tiles
//
// key is a string that encodes [level, row, column] with leading zeros to allow
// lexicographic sorting to match sorting by [level, row, column]

"use strict";

function TileIdx(l, c, r) {
  this.l = l;
  this.c = c;
  this.r = r;
  this.key = ('00' + l).substr(-3) + ('00000' + r).substr(-6) + ('00000' + c).substr(-6);
}

TileIdx.prototype.parent = function() {
  if (this.l > 0) {
    return new TileIdx(this.l - 1, this.c >> 1, this.r >> 1);
  } else {
    return null;
  }
};

TileIdx.prototype.toString = function() {
  return this.l + ',' + this.c + ',' + this.r;
};
