#!/usr/bin/perl
use strict;
use warnings;
use File::stat;
use List::Util qw(min max);
use String::CRC32;
use CGI;
use CGI::Carp;
use DateTime;
use HTTP::Date;

require "http_utils.pl";

#-----------------------------------------------------------------------------------------------------------------------
use constant MAX_BUFFER_SIZE => 65536;   # 64 K

#-----------------------------------------------------------------------------------------------------------------------

# TODO: parse URL for requested resource
my $filePath = '/brassica1-15m-halfsize/r00/r00321.mp4';
my $file = "../timelapses" . $filePath;

# calculate the ETag for this resource
my $etag = '"' . crc32($filePath) . '"';

# TODO: look for an If-Range or If-None-Match request header with the ETag and respond with a 304 if they match.

# TODO: make sure the file exists and, if so, then get its length in bytes
my $length = stat($file)->size;

my ($rangeMin, $rangeMax) = &parseRangeRequestHeader($length);
my $numBytesToRead = $rangeMax - $rangeMin + 1;

# the actual buffer size is the min of the number of bytes to read and the MAX_BUFFER_SIZE
my $bufferSize = min($numBytesToRead, MAX_BUFFER_SIZE);

# open the file
open (FILE, '<', $file) || die "Could not open $file: $!";
binmode FILE;

# seek to the starting position
seek(FILE, $rangeMin, 0);

carp "Serving bytes [$rangeMin,$rangeMax] of file [$file]";

my $expires = time2str(DateTime->now()->add( years => 1 )->epoch());

#print "Content-Type: video/mp4\n";
#print "ETag: ". crc32(*FILE) ."\n";
#print "Accept-Ranges: bytes\n";
#print "Expires: $expires\n";
#print "Content-Range: bytes $rangeMin-$rangeMax/$length\n";
#print "Content-Length: $numBytesToRead\n\n";

my $httpStatus = ($numBytesToRead == $length) ? '200 OK' : '206 Partial Content';

# -type, -status, -expires
my $cgi = CGI->new;
print $cgi->header(-status=>$httpStatus,
                   -type=>'video/mp4',
                   -expires=>'+1y',
                   -Content_Length=>$numBytesToRead,
                   -Content_Range=>"bytes $rangeMin-$rangeMax/$length",
                   -Accept_Ranges=>'bytes',
                   -Connection=>'close',
                   -ETag=>$etag
                   );

# read the specified bytes from the file and print to STDOUT
my $buffer;
my $numBytesRead = 0;
my $numBytesRemaining = $numBytesToRead;
binmode STDOUT;
while (($numBytesRead = read FILE, $buffer, $bufferSize) != 0 && $numBytesRemaining > 0) {
   $numBytesRemaining -= $numBytesRead;
   #carp "   read $numBytesRead bytes, remaining $numBytesRemaining";
   $bufferSize = min($bufferSize, $numBytesRemaining);
   print $buffer;
}

# close the file
close(FILE);
