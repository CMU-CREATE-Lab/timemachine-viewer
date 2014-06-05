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
use constant MIN_BUFFER_SIZE => 32768;       # 32 KB
use constant DEFAULT_BUFFER_SIZE => 65536;   # 64 KB
use constant MAX_BUFFER_SIZE => 4194304;     #  4 MB
use constant CGI_PARAM_ID => 'id';           # For specifying the dataset
use constant CGI_PARAM_TILE => 't';          # For specifying the tile
use constant CGI_PARAM_DROP => 'drop';       # For specifying the whether the CGI should prematurely drop the connection (default is false)
use constant CGI_PARAM_BUFFER => 'buffer';   # For specifying the size of the read buffer
use constant HTTP_STATUS_200 => '200 OK';
use constant HTTP_STATUS_206 => '206 Partial Content';
use constant HTTP_STATUS_304 => '304 Not Modified';
use constant HTTP_STATUS_400 => '400 Bad Request';
use constant HTTP_STATUS_404 => '404 Not Found';
#-----------------------------------------------------------------------------------------------------------------------

my $cgi = CGI->new;

my $willPrematurelyDropConnection = defined $cgi->param(CGI_PARAM_DROP) && $cgi->param(CGI_PARAM_DROP);

# allow user to specify read buffer size
my $requestedBufferSize = MAX_BUFFER_SIZE;
if (defined $cgi->param(CGI_PARAM_BUFFER) && $cgi->param(CGI_PARAM_BUFFER) =~ /^\d+$/)
   {
   my $tempBufferSize = $cgi->param(CGI_PARAM_BUFFER);
   if ($tempBufferSize >= MIN_BUFFER_SIZE && $tempBufferSize <= MAX_BUFFER_SIZE)
      {
      $requestedBufferSize = $tempBufferSize;
      }
   }
carp "Buffer size IS = [$requestedBufferSize]";

if (defined $cgi->param(CGI_PARAM_ID) && defined $cgi->param(CGI_PARAM_TILE))
   {
   my $dataset = $cgi->param(CGI_PARAM_ID);
   my $tile = $cgi->param(CGI_PARAM_TILE);

   # Make sure the dataset and tile are valid.  Dataset can only contain alphanumeric, dash, or underscores.  Tile must
   # start with an r, end with ".mp4", and may contain zero or more characters consisting of r, numbers, or a slash.
   if ($dataset =~ /^[a-zA-Z0-9-_]+$/ && $tile =~ /^r[r0-9\/]*\.mp4$/)
      {
      my $filePath = "/$dataset/$tile";
      my $file = "../timelapses" . $filePath;

      # make sure the file exists
      if (-e $file)
         {
         # calculate the ETag for this resource
         my $etag = '"' . crc32($filePath) . '"';

         # look for the If-None-Match request header with the ETag so we can respond with a 304 if they match.
         my $requestedEtag = '';
         if (defined $cgi->http("If-None-Match"))
            {
            $requestedEtag = $cgi->http("If-None-Match");
            }

         # compare the etags--respond with a 304 if they match, or j
         if ($requestedEtag eq $etag)
            {
            carp "Status [".HTTP_STATUS_304."] File [$file]";
            print $cgi->header(-status=>HTTP_STATUS_304,
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

            # the actual buffer size is the min of the number of bytes to read and the $requestedBufferSize
            my $bufferSize = min($numBytesToRead, $requestedBufferSize);

            # open the file
            open (FILE, '<', $file) || die "Could not open $file: $!";
            binmode FILE;

            # seek to the starting position
            seek(FILE, $rangeMin, 0);

            my $expires = time2str(DateTime->now()->add( years => 1 )->epoch());

            my $httpStatus = ($numBytesToRead == $length) ? HTTP_STATUS_200 : HTTP_STATUS_206;

            carp "Status [$httpStatus] File [$file] Bytes [$rangeMin,$rangeMax]";

            # print the response headers
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
               $bufferSize = min($bufferSize, $numBytesRemaining);
               print $buffer;
               if ($willPrematurelyDropConnection)
                  {
                  last;
                  }
            }

            # close the file
            close(FILE);
            }
         }
      else
         {
         carp "Status [".HTTP_STATUS_404."]: file does not exist [$tile]";
         print $cgi->header(-status=>HTTP_STATUS_404, -Connection=>'close' );
         }
      }
   else
      {
      carp "Status [".HTTP_STATUS_400."]: invalid dataset [$dataset] or tile [$tile]";
      print $cgi->header(-status=>HTTP_STATUS_400, -Connection=>'close' );
      }
   }
else
   {
   carp "Status [".HTTP_STATUS_400."] missing param(s)";
   print $cgi->header(-status=>HTTP_STATUS_400, -Connection=>'close' );
   }
