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

my $cgi = CGI->new;

# TODO: parse URL for requested resource
my $filePath = '/brassica1-15m-halfsize/r00/r00321.mp4';
my $file = "../timelapses" . $filePath;

# TODO: make sure the file exists

# calculate the ETag for this resource
my $etag = '"' . crc32($filePath) . '"';

# look for the If-None-Match request header with the ETag so we can respond with a 304 if they match.
my $requestedEtag = '';
if (defined $cgi->http("If-None-Match"))
   {
   $requestedEtag = $cgi->http("If-None-Match");
   carp "If-None-Match is defined: [$requestedEtag]";
   }

# compare the etags--respond with a 304 if they match, or j
if ($requestedEtag eq $etag)
   {
   print $cgi->header(-status=>'304 Not Modified',
                      -Connection=>'close',
                      -expires=>'+1y',
                      -ETag=>$etag
                      );
   }
else
   {
   # get the file length in bytes
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

   my $httpStatus = ($numBytesToRead == $length) ? '200 OK' : '206 Partial Content';

   # -type, -status, -expires
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
   }

