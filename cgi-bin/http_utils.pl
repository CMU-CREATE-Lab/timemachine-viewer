#!/usr/bin/perl
use strict;
use warnings;

#use CGI;
#use CGI::Carp;

#=======================================================================================================================
# Parses the "Range" HTTP request header and returns the starting and ending byte positions.  This implementation does
# not support multiple ranges (e.g "Range:bytes0-1,100-200").
#
# Inputs:
#    $fileLengthInBytes: the length of the requested file in bytes
#
# Outputs:
#    $rangeMin: the starting byte position
#    $rangeMax: the ending byte position
#
# See specs at: http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35.1
#-----------------------------------------------------------------------------------------------------------------------
sub parseRangeRequestHeader()
   {
   my ($fileLengthInBytes) = @_;

   # set the default range to be the entire file
   my $rangeMin = 0;
   my $rangeMax = $fileLengthInBytes - 1;

   my $q = CGI->new;
   if (defined $q->http("Range"))
      {
      my $rangeHeader = $q->http("Range");
   
      chomp $rangeHeader;                  # chop off the newline
      $rangeHeader =~ s/^\s+//;            # chop off leading whitespace
      $rangeHeader =~ s/\s+$//;            # chop off trailing whitespace
   
      #carp "Range header = [". $rangeHeader ."]";
   
      if (length($rangeHeader))
         {
         my $byteRange = '';
         if ($rangeHeader =~ /^bytes\s*=\s*(.+)$/)
            {
            $byteRange = $1;
            }
   
         if (length($byteRange))
            {
            #carp "Byte range = [$byteRange]";
   
            if ($byteRange =~ /^(\d*)\s*-\s*(\d*)$/)
               {
               my $firstBytePos = $1;
               my $lastBytePos = $2;
               my $isFirstBytePosDefined = length $1;
               my $isLastBytePosDefined = length $2;
               #carp "Byte range = [$firstBytePos] - [$lastBytePos]         [$isFirstBytePosDefined|$isLastBytePosDefined]";
               if ($isFirstBytePosDefined)
                  {
                  # The spec states that "if the last-byte-pos value is absent, or if the value is greater than or equal to
                  # the current length of the entity-body, last-byte-pos is taken to be equal to one less than the current
                  # length of the entity- body in bytes."
                  if (!$isLastBytePosDefined || $lastBytePos >= $fileLengthInBytes)
                     {
                     $isLastBytePosDefined = 1;
                     $lastBytePos = $fileLengthInBytes - 1;
                     #carp "corrected lastBytePos value to [$lastBytePos]";
                     }
   
                  #carp "User agent is requesting [$firstBytePos] - [$lastBytePos]";
   
                  # The spec states that "if the last-byte-pos value is present, it MUST be greater than or equal to the
                  # first-byte-pos in that byte-range-spec, or the byte- range-spec is syntactically invalid. The recipient
                  # of a byte-range- set that includes one or more syntactically invalid byte-range-spec values MUST ignore
                  # the header field that includes that byte-range- set."
                  if (0 <= $firstBytePos && $firstBytePos <= $lastBytePos)
                     {
                     # TODO
                     $rangeMin = $firstBytePos;
                     $rangeMax = $lastBytePos;
                     #carp "Valid range!";
                     }
                  else
                     {
                     #carp "Invalid range: firstBytePos [$firstBytePos] must be less than or equal to lastBytePos [$lastBytePos]";
                     }
                  }
               elsif ($isLastBytePosDefined)
                  {
                  # TODO: check size
   
                  # The spec states that "a suffix-byte-range-spec is used to specify the suffix of the entity-body, of a
                  # length given by the suffix-length value. (That is, this form specifies the last N bytes of an
                  # entity-body.)  If the entity is shorter than the specified suffix-length, the entire entity-body is
                  # used."
                  #carp "User agent is requesting the final [$lastBytePos] bytes";
                  if ($lastBytePos > 0 && $lastBytePos <= $fileLengthInBytes)
                     {
                     $rangeMin = $fileLengthInBytes - $lastBytePos;
                     #carp "Valid range!";
                     }
                  else
                     {
                     #carp "User agent requested a suffix byte range of 0 or a value greater than the length of the file, so just default to serving the whole file";
                     }
                  }
               }
            }
         }
      }
   #carp "Will serve bytes [$rangeMin] to [$rangeMax]";

   return ($rangeMin, $rangeMax);
   }
#=======================================================================================================================
return 1;